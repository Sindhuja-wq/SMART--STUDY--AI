/**
 * Academic Quality-Check & Validation Pipeline
 * Provides deterministic, multi-point verification for generated notes and quizzes.
 */

import { SubjectDomain, classifySubject } from "./subjectDomains";

export interface AcademicValidationResult {
  valid: boolean;
  score: number; // 0 to 100
  issues: string[];
  repairedText?: string;
}

export interface QuizQuestionCandidate {
  text: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface QuizValidationResult {
  valid: boolean;
  error?: string;
  cleanQuestions?: QuizQuestionCandidate[];
  warnings?: string[];
}

export interface JavaCodeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  publicClassName?: string;
  expectedFileName?: string;
  isBalanced: boolean;
  hasBrokenStringLiterals: boolean;
  compiledWithJavac?: boolean;
}

/**
 * Checks whether the javac compiler is available on the host system PATH.
 */
let cachedJavacAvailable: boolean | null = null;
export function isJavacAvailable(forceRefresh = false): boolean {
  if (cachedJavacAvailable !== null && !forceRefresh) return cachedJavacAvailable;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cp = require("node:child_process");
    if (typeof cp.spawnSync === "function") {
      const res = cp.spawnSync("javac", ["-version"], { stdio: "ignore", shell: true });
      cachedJavacAvailable = res.status === 0;
      return cachedJavacAvailable;
    }
  } catch {
    // Javac not available
  }
  cachedJavacAvailable = false;
  return false;
}

export function setCachedJavacAvailableForTesting(value: boolean | null): void {
  cachedJavacAvailable = value;
}

/**
 * Compiles a Java source code snippet using javac if available on the system.
 * Creates an isolated temp directory, writes the .java file matching the public class name,
 * executes `javac`, and captures any compilation diagnostics.
 */
export function compileJavaSnippetWithJavac(
  code: string,
  fileName?: string
): { success: boolean; errors: string[]; attempted: boolean } {
  if (!isJavacAvailable()) {
    return { success: true, errors: [], attempted: false };
  }

  // Only attempt javac compilation if the snippet contains a class declaration
  const classMatch = code.match(/\b(?:public\s+(?:final\s+|abstract\s+)?)?class\s+([A-Za-z0-9_$]+)/);
  if (!classMatch) {
    return { success: true, errors: [], attempted: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("node:fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require("node:os");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("node:path");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cp = require("node:child_process");

  let tmpDir = "";
  try {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "smart-study-javac-"));
    const targetBaseName = fileName ? path.basename(fileName) : `${classMatch[1]}.java`;
    const targetFilePath = path.join(tmpDir, targetBaseName);
    fs.writeFileSync(targetFilePath, code, "utf8");

    const compileRes = cp.spawnSync("javac", [targetBaseName], {
      cwd: tmpDir,
      encoding: "utf8",
      shell: true,
      timeout: 10000,
    });

    if (compileRes.status !== 0) {
      const output = ((compileRes.stderr || "") + "\n" + (compileRes.stdout || "")).trim();
      const lines = output
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0 && !l.includes("Note:"));
      return {
        success: false,
        errors: lines.length > 0 ? lines : ["javac compiler reported an error."],
        attempted: true,
      };
    }

    return { success: true, errors: [], attempted: true };
  } catch (err) {
    return {
      success: false,
      errors: [`Failed to execute javac: ${err instanceof Error ? err.message : String(err)}`],
      attempted: true,
    };
  } finally {
    if (tmpDir) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup failure in temp dir
      }
    }
  }
}

/**
 * Validates a Java source code snippet:
 * - Scans for unescaped raw newlines inside string literals ("...") that cause compile failures
 * - Verifies balanced delimiters: (), {}, []
 * - Ensures public class name matches the declared filename
 * - Detects multiple public classes or illegal escape sequences
 */
export function validateJavaCodeSnippet(
  code: string,
  declaredFileName?: string
): JavaCodeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isBalanced = true;
  let hasBrokenStringLiterals = false;

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return {
      valid: false,
      errors: ["Java code snippet is empty."],
      warnings,
      isBalanced: false,
      hasBrokenStringLiterals: false,
    };
  }

  // 1. Scan for public class declarations
  const publicClassMatches = Array.from(
    code.matchAll(/\bpublic\s+(?:final\s+|abstract\s+)?class\s+([A-Za-z0-9_$]+)/g)
  );
  let publicClassName: string | undefined;
  let expectedFileName: string | undefined;

  if (publicClassMatches.length > 1) {
    errors.push(
      `Multiple public classes found (${publicClassMatches.map((m) => m[1]).join(", ")}). Java allows at most one public class per compilation unit.`
    );
  } else if (publicClassMatches.length === 1) {
    publicClassName = publicClassMatches[0][1];
    expectedFileName = `${publicClassName}.java`;
  }

  // Check explicit file comment e.g. // File: StudentManagementSystem.java
  const explicitFileMatch = code.match(/\/\/\s*(?:File:\s*)?([A-Za-z0-9_$-]+\.java)\b/i);
  const activeFileName = declaredFileName || (explicitFileMatch ? explicitFileMatch[1] : undefined);

  if (publicClassName && activeFileName) {
    const cleanActive = activeFileName.replace(/^.*[\\\/]/, "").trim();
    if (cleanActive.toLowerCase() !== expectedFileName?.toLowerCase()) {
      errors.push(
        `Public class '${publicClassName}' requires filename '${expectedFileName}', but '${cleanActive}' was declared.`
      );
    }
  }

  // 2. Character scanner for string literal integrity and delimiter balancing
  type Delimiter = { char: "{" | "(" | "["; line: number; col: number };
  const delimiterStack: Delimiter[] = [];

  let inBlockComment = false;
  let inLineComment = false;
  let inTextBlock = false; // Java 15+ """
  let inStringLiteral = false;
  let inCharLiteral = false;
  let stringLiteralStartLine = 0;
  let stringLiteralStartCol = 0;
  let charLiteralStartLine = 0;

  let line = 1;
  let col = 0;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const nextCh = i + 1 < code.length ? code[i + 1] : "";
    const next2Ch = i + 2 < code.length ? code[i + 2] : "";
    col++;

    // Track line numbers
    if (ch === "\n") {
      // Standard string literal broken across raw newline
      if (inStringLiteral && !inTextBlock) {
        hasBrokenStringLiterals = true;
        errors.push(
          `Unclosed string literal or unescaped raw newline inside quotes at line ${stringLiteralStartLine}, column ${stringLiteralStartCol}. Java string literals cannot span newlines without concatenation or text blocks (""").`
        );
        inStringLiteral = false; // recover scanner
      }

      if (inCharLiteral) {
        errors.push(`Unclosed character literal across newline at line ${charLiteralStartLine}.`);
        inCharLiteral = false;
      }

      if (inLineComment) {
        inLineComment = false;
      }

      line++;
      col = 0;
      continue;
    }

    if (ch === "\r") {
      continue;
    }

    // Inside Line Comment
    if (inLineComment) {
      continue;
    }

    // Inside Block Comment
    if (inBlockComment) {
      if (ch === "*" && nextCh === "/") {
        inBlockComment = false;
        i++;
        col++;
      }
      continue;
    }

    // Inside Text Block (""")
    if (inTextBlock) {
      if (ch === "\\" && nextCh === "\\") {
        i++;
        col++;
        continue;
      }
      if (ch === '"' && nextCh === '"' && next2Ch === '"') {
        inTextBlock = false;
        i += 2;
        col += 2;
      }
      continue;
    }

    // Inside Standard String Literal ("...")
    if (inStringLiteral) {
      if (ch === "\\") {
        if (nextCh === "\n" || nextCh === "\r" || nextCh === "") {
          hasBrokenStringLiterals = true;
          errors.push(`Illegal dangling escape at line ${line}.`);
        }
        i++; // skip escaped char
        col++;
        continue;
      }
      if (ch === '"') {
        inStringLiteral = false;
      }
      continue;
    }

    // Inside Character Literal ('...')
    if (inCharLiteral) {
      if (ch === "\\") {
        i++;
        col++;
        continue;
      }
      if (ch === "'") {
        inCharLiteral = false;
      }
      continue;
    }

    // Comments start
    if (ch === "/" && nextCh === "/") {
      inLineComment = true;
      i++;
      col++;
      continue;
    }
    if (ch === "/" && nextCh === "*") {
      inBlockComment = true;
      i++;
      col++;
      continue;
    }

    // Text Block start (""")
    if (ch === '"' && nextCh === '"' && next2Ch === '"') {
      inTextBlock = true;
      i += 2;
      col += 2;
      continue;
    }

    // String Literal start (")
    if (ch === '"') {
      inStringLiteral = true;
      stringLiteralStartLine = line;
      stringLiteralStartCol = col;
      continue;
    }

    // Character Literal start (')
    if (ch === "'") {
      inCharLiteral = true;
      charLiteralStartLine = line;
      continue;
    }

    // Delimiter Balancing
    if (ch === "{" || ch === "(" || ch === "[") {
      delimiterStack.push({ char: ch, line, col });
    } else if (ch === "}") {
      const top = delimiterStack.pop();
      if (!top || top.char !== "{") {
        isBalanced = false;
        errors.push(`Mismatched or unexpected closing brace '}' at line ${line}, column ${col}.`);
      }
    } else if (ch === ")") {
      const top = delimiterStack.pop();
      if (!top || top.char !== "(") {
        isBalanced = false;
        errors.push(`Mismatched or unexpected closing parenthesis ')' at line ${line}, column ${col}.`);
      }
    } else if (ch === "]") {
      const top = delimiterStack.pop();
      if (!top || top.char !== "[") {
        isBalanced = false;
        errors.push(`Mismatched or unexpected closing bracket ']' at line ${line}, column ${col}.`);
      }
    }
  }

  if (inStringLiteral) {
    hasBrokenStringLiterals = true;
    errors.push(`Unclosed string literal starting at line ${stringLiteralStartLine}, column ${stringLiteralStartCol}.`);
  }
  if (inCharLiteral) {
    errors.push(`Unclosed character literal starting at line ${charLiteralStartLine}.`);
  }
  if (inBlockComment) {
    errors.push("Unclosed block comment (/*) at end of file.");
  }
  if (delimiterStack.length > 0) {
    isBalanced = false;
    for (const d of delimiterStack) {
      errors.push(`Unclosed delimiter '${d.char}' opened at line ${d.line}, column ${d.col}.`);
    }
  }

  // 3. Optional real javac compilation if compiler is present on the host
  let compiledWithJavac = false;
  if (errors.length === 0 && isBalanced && !hasBrokenStringLiterals) {
    if (isJavacAvailable() && /\bclass\s+[A-Za-z0-9_$]+/i.test(code)) {
      const targetName = expectedFileName || declaredFileName || (explicitFileMatch ? explicitFileMatch[1] : undefined);
      const compileResult = compileJavaSnippetWithJavac(code, targetName);
      if (compileResult.attempted) {
        compiledWithJavac = true;
        if (!compileResult.success) {
          for (const cErr of compileResult.errors) {
            errors.push(`javac compile error: ${cErr}`);
          }
        }
      }
    }
  }

  const valid = errors.length === 0 && isBalanced && !hasBrokenStringLiterals;
  return {
    valid,
    errors,
    warnings,
    publicClassName,
    expectedFileName,
    isBalanced,
    hasBrokenStringLiterals,
    compiledWithJavac,
  };
}

/**
 * Validates generated study notes against strict pedagogical, structural,
 * domain relevance, and academic integrity criteria.
 */
export function validateNotesContent(
  notes: unknown,
  context: {
    subject: string;
    topic: string;
    syllabus?: string | null;
    domain?: SubjectDomain;
  }
): AcademicValidationResult {
  const issues: string[] = [];

  if (!notes || typeof notes !== "string") {
    return { valid: false, score: 0, issues: ["Notes content is empty or not a string."] };
  }

  const trimmed = notes.trim();

  // 1. Length & Substantive Content Check
  if (trimmed.length < 400) {
    issues.push(`Notes are too brief (${trimmed.length} characters). Minimum substantive threshold is 400 characters.`);
  }

  // 2. Truncation & Abrupt Termination Check
  const lastLine = trimmed
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .pop() || "";

  // Check unclosed code blocks
  const codeBlockCount = (trimmed.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    issues.push("Notes contain unclosed markdown code blocks (truncated output).");
  }

  // Check ending in dangling punctuation or conjunction
  const danglingEndings = /\b(and|or|but|because|with|the|a|an|to|in|of|for|that|which|is|are|was|were)\s*$/i;
  if (danglingEndings.test(lastLine)) {
    issues.push(`Notes appear truncated mid-sentence (ends with dangling word '${lastLine.slice(-15)}').`);
  } else if (!/[.!?*:_`#)\-\]]$/.test(lastLine) && lastLine.length > 0) {
    // Doesn't end in typical sentence or markdown closing punctuation
    issues.push("Notes terminate without proper terminal punctuation or markdown closure.");
  }

  // 3. Hallucinated / Forbidden Placeholder Check
  const forbiddenPlaceholders = [
    "executePattern",
    "dummyFunction",
    "TODO:",
    "FIXME:",
    "insert code here",
    "lorem ipsum",
    '"status": "MASTERED"',
  ];
  for (const placeholder of forbiddenPlaceholders) {
    if (trimmed.includes(placeholder)) {
      issues.push(`Contains forbidden placeholder or stub text: '${placeholder}'.`);
    }
  }

  // 4. Repeated / Duplicate Paragraphs Detection
  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 60 && !p.startsWith("#") && !p.startsWith(">"));
  const seenParagraphs = new Set<string>();
  let duplicateCount = 0;
  for (const p of paragraphs) {
    const normalized = p.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seenParagraphs.has(normalized)) {
      duplicateCount++;
    } else {
      seenParagraphs.add(normalized);
    }
  }
  if (duplicateCount > 0) {
    issues.push(`Detected ${duplicateCount} repeated/duplicated paragraph(s) used to inflate note length.`);
  }

  // 4b. Excessive Mechanical Repetition of Full Topic Title in Body Text
  // If the topic is a multi-word phrase (length > 10, >= 2 words), count its occurrences in non-heading body text.
  // Genuine educational writing refers to concepts by their specific sub-terms (e.g. "relational model", "tables"),
  // not by mechanically copy-pasting the full 4-8 word syllabus header into every paragraph or practice question.
  if (context.topic && context.topic.trim().length > 10) {
    const rawTopicClean = context.topic.trim();
    const isMultiWord = rawTopicClean.split(/\s+/).length >= 2;
    if (isMultiWord) {
      // Exclude markdown headings and metadata quote blocks from repetition counting
      const bodyLines = trimmed
        .split("\n")
        .filter((l) => !l.trim().startsWith("#") && !l.trim().startsWith(">"))
        .join("\n");
      const topicEscaped = rawTopicClean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const topicOccurrences = (bodyLines.match(new RegExp(topicEscaped, "gi")) || []).length;
      if (topicOccurrences > 4) {
        issues.push(
          `Detected excessive mechanical repetition of topic title '${rawTopicClean}' (${topicOccurrences} occurrences in prose/questions). Real academic notes teach mechanisms without copy-pasting full title strings repeatedly.`
        );
      }
    }
  }

  // 4c. Raw Syllabus Boilerplate Artifacts Detection in Headings or Prose
  if (/#\s*[^#\n]+(?:[—\-–:]+\s*syllabus|syllabus\s*[:—\-–])/i.test(trimmed)) {
    issues.push(
      "Notes header retains raw syllabus boilerplate placeholder markers ('— Syllabus'). Titles must be properly normalized."
    );
  }

  // 4d. Obvious Template Leakage & Stray Heading Hashes in Prose
  // Stray markdown heading hashes inside body prose (e.g., "for # Operating Systems")
  if (/\b(?:for|in|of|on|about)\s+#+\s+[a-zA-Z]/i.test(trimmed)) {
    issues.push("Notes contain stray markdown heading hashes ('#') leaked inside sentence prose.");
  }
  // Un-interpolated template variables (e.g., "${topic}", "${subject}")
  if (/\$\{(?:topic|subject|cleanTitle|cleanSub|title)\}/i.test(trimmed)) {
    issues.push("Notes contain un-interpolated template variable placeholder (e.g. '${topic}').");
  }
  // Generic repetitive boilerplate template phrases
  if (/comprehensive academic principles,\s*core mechanisms,\s*worked examples/i.test(trimmed)) {
    issues.push("Notes contain generic repeated boilerplate phrase: 'Comprehensive academic principles, core mechanisms, worked examples, and exam problem strategies for...'.");
  }
  // Duplicated titles in template phrase: "for <Title> in <Title>"
  const dupPhraseMatch = trimmed.match(/for\s+([^.\n]+?)\s+in\s+([^.\n]+?)(?:\.|\n|$)/i);
  if (dupPhraseMatch) {
    const part1 = dupPhraseMatch[1].trim().toLowerCase().replace(/^#+\s*/, "");
    const part2 = dupPhraseMatch[2].trim().toLowerCase().replace(/^#+\s*/, "");
    if (part1 === part2 && part1.length > 2) {
      issues.push(`Detected duplicated template phrase: 'for ${dupPhraseMatch[1]} in ${dupPhraseMatch[2]}'.`);
    }
  }

  // 5. Structural Pedagogical Sections Check
  const lowerNotes = trimmed.toLowerCase();
  const hasLearningObjectives =
    lowerNotes.includes("learning objective") || lowerNotes.includes("objectives") || lowerNotes.includes("prerequisites");
  const hasConceptualOverview =
    lowerNotes.includes("concept") || lowerNotes.includes("overview") || lowerNotes.includes("principles") || lowerNotes.includes("definition");
  const hasComparisonOrBreakdown =
    lowerNotes.includes("compar") ||
    lowerNotes.includes("distinction") ||
    lowerNotes.includes("mechanisms") ||
    lowerNotes.includes("breakdown") ||
    lowerNotes.includes("|");
  const hasPitfallsOrMisconceptions =
    lowerNotes.includes("pitfall") ||
    lowerNotes.includes("misconception") ||
    lowerNotes.includes("mistake") ||
    lowerNotes.includes("trap") ||
    lowerNotes.includes("error");
  const hasSummary =
    lowerNotes.includes("summary") || lowerNotes.includes("takeaway") || lowerNotes.includes("revision") || lowerNotes.includes("key point");

  if (!hasLearningObjectives) issues.push("Missing required Learning Objectives or Prerequisites section.");
  if (!hasConceptualOverview) issues.push("Missing core Conceptual Overview or Theoretical Principles section.");
  if (!hasComparisonOrBreakdown) issues.push("Missing Comparative Analysis or Structural Breakdown section.");
  if (!hasPitfallsOrMisconceptions) issues.push("Missing Common Misconceptions or Exam Traps section.");
  if (!hasSummary) issues.push("Missing Revision Summary or Key Takeaways section.");

  // 6. Domain-Specific Pedagogical Validation & Anti-Contamination Checks
  const domain = context.domain || classifySubject(context.subject, context.topic, context.syllabus || undefined);
  const subLower = context.subject.toLowerCase();
  const topicLower = context.topic.toLowerCase();

  // Cross-Domain Contamination: Non-CS subjects must NOT receive unsolicited CS programming jargon
  if (domain !== "computer_science") {
    const softwareJargon = [
      "public class",
      "void main",
      "def __init__",
      "malloc(",
      "npm install",
      "runtime exception",
      "nullpointer",
      "git commit",
      "logging daemon",
      "compiler optimization flag",
    ];
    for (const jargon of softwareJargon) {
      if (lowerNotes.includes(jargon)) {
        issues.push(`Inappropriate Computer Science jargon '${jargon}' found in non-computing subject '${context.subject}'.`);
      }
    }
  }

  // Domain-Specific Integrity Checks
  if (domain === "mathematics") {
    const hasFormulas = lowerNotes.includes("$") || lowerNotes.includes("formula") || lowerNotes.includes("equation");
    if (!hasFormulas) {
      issues.push("Mathematics notes must include formal mathematical equations or governing formulas.");
    }
    // Specific check for Quadratic Equations
    if (topicLower.includes("quadratic")) {
      const hasDiscriminant =
        lowerNotes.includes("discriminant") || lowerNotes.includes("b^2 - 4ac") || lowerNotes.includes("b² - 4ac") || lowerNotes.includes("\\delta");
      if (!hasDiscriminant) {
        issues.push("Quadratic equation notes must include the discriminant (b² - 4ac) formulation.");
      }
    }
  } else if (domain === "physics") {
    const hasUnits =
      lowerNotes.includes("si unit") ||
      lowerNotes.includes("unit") ||
      /\b(m\/s|m\/s\^2|kg|newton|joule|watt|pascal|volt|ampere|kelvin)\b/i.test(lowerNotes);
    if (!hasUnits) {
      issues.push("Physics notes must state standard SI units for physical quantities.");
    }
    if (topicLower.includes("newton")) {
      const hasFma = lowerNotes.includes("f = ma") || lowerNotes.includes("f = m*a") || lowerNotes.includes("f_{net}");
      if (!hasFma) {
        issues.push("Newton's Laws notes must define the relationship F = ma.");
      }
    }
  } else if (domain === "biology") {
    if (topicLower.includes("photosynthesis")) {
      const hasKeyBioTerms =
        (lowerNotes.includes("thylakoid") || lowerNotes.includes("chloroplast") || lowerNotes.includes("stroma")) &&
        (lowerNotes.includes("calvin") || lowerNotes.includes("light") || lowerNotes.includes("rubisco") || lowerNotes.includes("water"));
      if (!hasKeyBioTerms) {
        issues.push("Photosynthesis notes must detail structural sites (thylakoid/stroma) and key biochemical phases.");
      }
    }
  } else if (domain === "history_social") {
    const hasChronologyOrCauses =
      lowerNotes.includes("cause") ||
      lowerNotes.includes("effect") ||
      lowerNotes.includes("consequence") ||
      lowerNotes.includes("chronology") ||
      lowerNotes.includes("treaty") ||
      lowerNotes.includes("century") ||
      /\b(18|19|20)\d\d\b/.test(lowerNotes);
    if (!hasChronologyOrCauses) {
      issues.push("History notes must analyze causes, consequences, and chronological context.");
    }
  } else if (domain === "languages_literature") {
    if (topicLower.includes("subject-verb") || topicLower.includes("agreement")) {
      const hasSvaRules =
        lowerNotes.includes("singular") &&
        lowerNotes.includes("plural") &&
        (lowerNotes.includes("rule") || lowerNotes.includes("correct"));
      if (!hasSvaRules) {
        issues.push("Subject-verb agreement notes must contrast singular vs. plural rules and correct vs. incorrect examples.");
      }
    }
  } else if (domain === "commerce_economics") {
    if (subLower.includes("accounting") || topicLower.includes("accounting") || topicLower.includes("entry") || topicLower.includes("journal")) {
      const hasAccountingCore =
        (lowerNotes.includes("debit") && lowerNotes.includes("credit")) ||
        lowerNotes.includes("assets") ||
        lowerNotes.includes("liabilities") ||
        lowerNotes.includes("equity");
      if (!hasAccountingCore) {
        issues.push("Accounting notes must include double-entry debit/credit rules or the accounting equation.");
      }
    }
  } else if (domain === "computer_science") {
    const hasCodeOrSyntax = trimmed.includes("```") || lowerNotes.includes("algorithm") || lowerNotes.includes("complexity");
    if (!hasCodeOrSyntax) {
      issues.push("Computer science notes should contain code examples, syntax breakdown, or algorithmic complexity analysis.");
    }

    // Anti-Contamination Check: Reject irrelevant high-school math polynomials & equations in CS / DBMS
    const isDbmsContext =
      subLower.includes("dbms") ||
      subLower.includes("database") ||
      subLower.includes("sql") ||
      topicLower.includes("dbms") ||
      topicLower.includes("database") ||
      topicLower.includes("sql") ||
      topicLower.includes("relational") ||
      topicLower.includes("entity relationship") ||
      topicLower.includes("normalization") ||
      topicLower.includes("transaction") ||
      (Boolean(context.syllabus) && /dbms|database/i.test(context.syllabus || ""));

    const mathContaminants = [
      "f(x) = 2x + 6",
      "ax^2 + bx + c",
      "ax² + bx + c",
      "b^2 - 4ac",
      "b² - 4ac",
      "discriminant",
      "quadratic equation",
      "quadratic formula",
      "back-substitution",
    ];

    for (const contaminant of mathContaminants) {
      if (lowerNotes.includes(contaminant.toLowerCase())) {
        issues.push(
          `Notes contain inappropriate high-school mathematics contamination '${contaminant}' in Computer Science / DBMS curriculum.`
        );
      }
    }

    if (isDbmsContext) {
      const hasDbmsTerms =
        lowerNotes.includes("database") ||
        lowerNotes.includes("dbms") ||
        lowerNotes.includes("table") ||
        lowerNotes.includes("relation") ||
        lowerNotes.includes("sql") ||
        lowerNotes.includes("schema") ||
        lowerNotes.includes("query") ||
        lowerNotes.includes("acid");
      if (!hasDbmsTerms) {
        issues.push("Database Management Systems notes must incorporate foundational database concepts (relations, schemas, SQL, transactions).");
      }

      // DBMS Concrete Artifacts Check: Must include either runnable SQL or relational schema / comparative table
      const hasSqlCode = /```sql\s*([\s\S]*?)```/i.test(trimmed);
      const hasRelationalTable = /\|[\s\S]*?\|[\s\S]*?\n\|[\s:\-]+?\|/i.test(trimmed);
      if (!hasSqlCode && !hasRelationalTable) {
        issues.push("Database Management Systems notes must include concrete SQL code examples or structured relational schema tables.");
      }

      // Check if SQL code block is non-empty and contains valid SQL keywords
      if (hasSqlCode) {
        const sqlMatch = trimmed.match(/```sql\s*([\s\S]*?)```/i);
        const sqlBody = sqlMatch ? sqlMatch[1].trim() : "";
        const hasValidSqlKeywords = /\b(create table|select|insert into|update|delete|begin|commit|rollback|create index|grant|revoke|alter table)\b/i.test(sqlBody);
        if (sqlBody.length < 20 || !hasValidSqlKeywords) {
          issues.push("SQL code example in Database Management Systems notes is empty, placeholder, or lacks valid DDL/DML statements.");
        }
      }
    }

    if (subLower.includes("java") || topicLower.includes("java") || (Boolean(context.syllabus) && /java/i.test(context.syllabus || ""))) {
      // 1. Code Snippet Syntax & Integrity Validation
      const javaBlockRegex = /```java\s*([\s\S]*?)```/gi;
      let match;
      let javaSnippetCount = 0;
      while ((match = javaBlockRegex.exec(trimmed)) !== null) {
        javaSnippetCount++;
        const snippet = match[1];
        const res = validateJavaCodeSnippet(snippet);
        if (!res.valid) {
          for (const err of res.errors) {
            issues.push(`Java code defect: ${err}`);
          }
        }
      }

      if (javaSnippetCount === 0 && !lowerNotes.includes("class ") && !lowerNotes.includes("system.out.println")) {
        issues.push("Java notes must include valid, formatted Java code examples.");
      }

      // 2. Topic Alignment: Java Foundations vs. Classes and Objects
      const isFoundationsTopic =
        /foundation|syntax|runtime|architecture|jvm|compilation/i.test(topicLower) ||
        (/foundation|syntax|runtime|architecture|jvm|compilation/i.test(context.syllabus || "") && !/class(es)?\s*(and|&)?\s*object/i.test(topicLower));

      if (isFoundationsTopic) {
        const coversPrimitives =
          lowerNotes.includes("primitive") &&
          (lowerNotes.includes("int") || lowerNotes.includes("byte") || lowerNotes.includes("double") || lowerNotes.includes("boolean"));
        const coversControlFlow =
          lowerNotes.includes("control flow") ||
          lowerNotes.includes("switch") ||
          lowerNotes.includes("if-else") ||
          lowerNotes.includes("loop") ||
          lowerNotes.includes("operator");
        const coversCompilationAndJvm =
          (lowerNotes.includes("javac") || lowerNotes.includes("bytecode") || lowerNotes.includes("classloader")) &&
          lowerNotes.includes("jvm");
        const coversRuntimeMemory =
          lowerNotes.includes("stack") && lowerNotes.includes("heap");

        if (!coversPrimitives || !coversControlFlow || !coversCompilationAndJvm || !coversRuntimeMemory) {
          issues.push(
            "Java Foundations notes must cover syntax, primitive/reference types, operators, control flow, compilation lifecycle (javac/bytecode/ClassLoader), and JVM runtime memory."
          );
        }

        // Prevent topic collapse into solely Classes & Objects
        const isCollapsedIntoClassesObjects =
          !coversPrimitives &&
          !coversCompilationAndJvm &&
          lowerNotes.includes("blueprint") &&
          lowerNotes.includes("student");
        if (isCollapsedIntoClassesObjects) {
          issues.push(
            "Topic alignment failure: Broad Java Foundations topic has collapsed into an exclusively Classes & Objects lesson."
          );
        }
      }

      const isClassesObjectsTopic =
        (/class(es)?\s*(and|&)?\s*object/i.test(topicLower) || /oop/i.test(topicLower)) &&
        !isFoundationsTopic;

      if (isClassesObjectsTopic) {
        const hasCoreOop =
          lowerNotes.includes("class") &&
          (lowerNotes.includes("object") || lowerNotes.includes("instance")) &&
          (lowerNotes.includes("constructor") || lowerNotes.includes("encapsulation"));
        if (!hasCoreOop) {
          issues.push(
            "Java Classes and Objects notes must explain classes as blueprints, object instantiation via 'new', constructors, and encapsulation."
          );
        }
      }

      // 3. Technical Accuracy: JVM Memory Explanations
      const assertsAllReferencesOnStack =
        /\b(?:all|every)\s+reference\s+variables?\s+(?:reside|live|are\s+stored|placed)\s+on\s+the\s+(?:thread\s+)?stack\b/i.test(
          trimmed
        );
      const isDebunkingMisconception =
        /misconception|wrong|fallacy|pitfall|mistake/i.test(trimmed) &&
        /instance\s+(?:reference\s+)?field/i.test(trimmed) &&
        /heap/i.test(trimmed);

      if (assertsAllReferencesOnStack && !isDebunkingMisconception) {
        issues.push(
          "Technical inaccuracy: Notes claim all reference variables reside on the thread stack. Local references live in stack frames, but instance reference fields reside inside objects on the heap, and static references reside in the Class object on the heap."
        );
      }

      // 4. Verification Claims: Do not claim javac verification if javac was not executed or is unavailable
      const claimsJavacVerification =
        /compiler-verified\s+by\s+javac|verified\s+by\s+the\s+javac\s+compiler|verified\s+using\s+javac\s+compiler/i.test(
          trimmed
        );
      if (claimsJavacVerification && !isJavacAvailable()) {
        issues.push(
          "Notes falsely claim compiler verification with javac when javac was not executed or is unavailable on the host."
        );
      }
    }

    // OS & CPU Scheduling Validation: Code/Output Agreement and Metric Consistency
    const isOsContext =
      subLower.includes("operating system") ||
      subLower === "os" ||
      topicLower.includes("scheduling") ||
      topicLower.includes("round robin") ||
      topicLower.includes("process") ||
      topicLower.includes("paging");

    if (isOsContext) {
      // 1. If Round Robin metrics table is present, verify mathematical consistency
      // Pattern matches lines like: P1	10	23	23	13
      const rrTableRegex = /P([1-9]\d*)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/g;
      let match;
      while ((match = rrTableRegex.exec(trimmed)) !== null) {
        const pid = match[1];
        const burst = parseInt(match[2], 10);
        const completion = parseInt(match[3], 10);
        const turnaround = parseInt(match[4], 10);
        const waiting = parseInt(match[5], 10);

        // Turnaround Time must equal Completion Time if arrival is t=0 (as assumed in benchmark)
        if (turnaround !== completion) {
          issues.push(
            `CPU scheduling table error for P${pid}: Turnaround Time (${turnaround}) does not match Completion Time (${completion}) under arrival time t=0.`
          );
        }
        // Waiting Time must equal Turnaround Time - Burst Time
        if (waiting !== turnaround - burst) {
          issues.push(
            `CPU scheduling table error for P${pid}: Waiting Time (${waiting}) must equal Turnaround Time (${turnaround}) minus Burst Time (${burst}) = ${turnaround - burst}.`
          );
        }
      }

      // 2. Specific benchmark verification for P1=10, P2=5, P3=8 (quantum=4):
      // If code simulates P1=10, P2=5, P3=8 with quantum 4, P2 MUST finish at 17 (never 13)!
      if (
        lowerNotes.includes("quantum = 4") ||
        lowerNotes.includes("quantum=4") ||
        (trimmed.includes("10") && trimmed.includes("5") && trimmed.includes("8") && lowerNotes.includes("round robin"))
      ) {
        // Detect old defective output where P2 had completion 13 or waiting 8
        if (/P2\s+5\s+13\s+13\s+8/.test(trimmed)) {
          issues.push(
            "Code/output mismatch in Round Robin simulation: Process P2 executes 4 units in round 1 and 1 unit at t=16, completing at t=17 (WT=12), not at t=13."
          );
        }
      }

      // 3. EMAT calculation consistency
      // If notes calculate EMAT with 80% hit ratio, 20 ns TLB, and 100 ns RAM:
      if (lowerNotes.includes("emat") && lowerNotes.includes("tlb")) {
        const has80Percent = lowerNotes.includes("80%") || lowerNotes.includes("0.80") || lowerNotes.includes("0.8");
        const has100Ns = lowerNotes.includes("100") && lowerNotes.includes("ns");
        const has20Ns = lowerNotes.includes("20") && lowerNotes.includes("ns");
        if (has80Percent && has100Ns && has20Ns) {
          // Correct answer is 140 ns. If someone claims 300 ns or 200 ns, flag it
          const claimsCorrectEmat = /140\s*ns/i.test(trimmed);
          if (!claimsCorrectEmat && /\b(300|200|260|280|90|80)\s*ns\b/i.test(trimmed)) {
            issues.push(
              "Effective Memory Access Time (EMAT) numerical calculation error: For 80% hit ratio with 20 ns TLB and 100 ns RAM, EMAT is 0.80*(120) + 0.20*(220) = 140 ns."
            );
          }
        }
      }

      // 4. Page Replacement Algorithms & Belady's Anomaly numerical accuracy
      const hasPageReplacement =
        lowerNotes.includes("page replacement") ||
        (lowerNotes.includes("fifo") && lowerNotes.includes("lru") && lowerNotes.includes("optimal"));
      if (hasPageReplacement) {
        const mentionsSampleRefs =
          lowerNotes.includes("7, 0, 1, 2, 0, 3, 0, 4, 2, 3") ||
          lowerNotes.includes("7,0,1,2,0,3,0,4,2,3");
        if (mentionsSampleRefs) {
          // FIFO with 3 frames must have 9 faults (reject old erroneous 8 faults)
          if (/\bfifo\b[^|\n]*\|\s*(?:evicts[^\n|]*\|\s*)?\*{0,2}8\s*faults?\*{0,2}/i.test(trimmed)) {
            issues.push(
              "Page replacement numerical error: For reference string '7, 0, 1, 2, 0, 3, 0, 4, 2, 3' with 3 frames, FIFO produces exactly 9 page faults, not 8."
            );
          }
          // LRU with 3 frames must have 8 faults (reject old erroneous 7 faults)
          if (/\blru\b[^|\n]*\|\s*(?:evicts[^\n|]*\|\s*)?\*{0,2}7\s*faults?\*{0,2}/i.test(trimmed)) {
            issues.push(
              "Page replacement numerical error: For reference string '7, 0, 1, 2, 0, 3, 0, 4, 2, 3' with 3 frames, LRU produces exactly 8 page faults, not 7."
            );
          }
          // Optimal with 3 frames must have 6 faults (reject old erroneous 5 faults)
          if (/\boptimal\b[^|\n]*\|\s*(?:evicts[^\n|]*\|\s*)?\*{0,2}5\s*faults?\*{0,2}/i.test(trimmed)) {
            issues.push(
              "Page replacement numerical error: For reference string '7, 0, 1, 2, 0, 3, 0, 4, 2, 3' with 3 frames, Optimal produces exactly 6 page faults, not 5."
            );
          }
        }

        // Belady's Anomaly reference string check
        const mentionsBeladyString =
          lowerNotes.includes("1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5") ||
          lowerNotes.includes("1,2,3,4,1,2,5,1,2,3,4,5");
        if (mentionsBeladyString && lowerNotes.includes("belady")) {
          const has9Faults3Frames =
            /9\s*(?:page\s*)?faults?\s*(?:with\s*)?3\s*frames/i.test(trimmed) ||
            /3\s*(?:physical\s*)?frames[^.\n]*9\s*(?:page\s*)?faults?/i.test(trimmed);
          const has10Faults4Frames =
            /10\s*(?:page\s*)?faults?\s*(?:with\s*)?4\s*frames/i.test(trimmed) ||
            /4\s*(?:physical\s*)?frames[^.\n]*10\s*(?:page\s*)?faults?/i.test(trimmed);
          if (!has9Faults3Frames || !has10Faults4Frames) {
            issues.push(
              "Belady's Anomaly explanation error: Reference string '1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5' under FIFO must demonstrate 9 faults with 3 frames and 10 faults with 4 frames."
            );
          }
        }
      }
    }
  }

  // 7. Syllabus Scope Representation
  if (context.syllabus && context.syllabus.trim().length > 10) {
    // Extract key content words from custom syllabus
    const syllabusWords = context.syllabus
      .toLowerCase()
      .split(/[\s,;:\n]+/)
      .filter((w) => w.length > 4 && !["about", "these", "their", "which", "study", "notes", "topics", "learn"].includes(w));
    if (syllabusWords.length > 0) {
      const matched = syllabusWords.filter((w) => lowerNotes.includes(w));
      const matchRate = matched.length / syllabusWords.length;
      if (matchRate < 0.25) {
        issues.push("Generated notes lack adequate representation of the user-provided custom syllabus topics.");
      }
    }
  }

  // Calculate quality score
  const deductions = issues.length * 15;
  const score = Math.max(0, Math.min(100, 100 - deductions));
  const hasContamination = issues.some((iss) => iss.includes("contamination"));
  const valid = !hasContamination && (issues.length === 0 || (issues.length <= 1 && score >= 70));

  return { valid, score, issues };
}

/**
 * Validates a 5-question multiple choice assessment.
 * Strictly verifies question count (5), option count (4), option uniqueness,
 * valid correctOption index (0-3), presence of substantive explanation,
 * question text uniqueness, and subject domain relevance.
 */
export function validateQuizQuestions(
  questions: unknown,
  context?: { subject: string; topic: string; domain?: SubjectDomain }
): QuizValidationResult {
  if (!Array.isArray(questions)) {
    return { valid: false, error: "Questions payload must be an array." };
  }

  if (questions.length !== 5) {
    return { valid: false, error: `Expected exactly 5 questions, but received ${questions.length}.` };
  }

  const cleanList: QuizQuestionCandidate[] = [];
  const seenQuestionTexts = new Set<string>();
  const warnings: string[] = [];

  const domain = context
    ? context.domain || classifySubject(context.subject, context.topic)
    : "general_academic";

  const correctIndices: number[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] as Partial<QuizQuestionCandidate>;

    if (!q || typeof q.text !== "string" || q.text.trim().length < 8) {
      return { valid: false, error: `Question #${i + 1} has empty or insufficiently detailed text.` };
    }

    const cleanText = q.text.trim();
    const normalizedText = cleanText.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (seenQuestionTexts.has(normalizedText)) {
      return { valid: false, error: `Question #${i + 1} is a duplicate of a previous question.` };
    }
    seenQuestionTexts.add(normalizedText);

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return { valid: false, error: `Question #${i + 1} must have exactly 4 options (received ${Array.isArray(q.options) ? q.options.length : 0}).` };
    }

    // Verify option uniqueness and validity
    const trimmedOptions = q.options.map((opt) => String(opt || "").trim());
    for (let oIdx = 0; oIdx < trimmedOptions.length; oIdx++) {
      if (trimmedOptions[oIdx].length === 0) {
        return { valid: false, error: `Question #${i + 1}, Option #${oIdx + 1} cannot be blank.` };
      }
    }

    const uniqueOptions = new Set(trimmedOptions.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== 4) {
      return { valid: false, error: `Question #${i + 1} contains duplicate options.` };
    }

    // Verify correctOption index
    if (typeof q.correctOption !== "number" || !Number.isInteger(q.correctOption) || q.correctOption < 0 || q.correctOption > 3) {
      return {
        valid: false,
        error: `Question #${i + 1} has invalid correctOption index (${q.correctOption}). Must be an integer 0, 1, 2, or 3.`,
      };
    }

    correctIndices.push(q.correctOption);

    // Verify explanation
    if (!q.explanation || typeof q.explanation !== "string" || q.explanation.trim().length < 12) {
      return { valid: false, error: `Question #${i + 1} requires a substantive, complete explanation.` };
    }

    // Anti-Contamination Check: Ensure non-CS quiz doesn't contain weird software distractors
    if (domain !== "computer_science") {
      const foreignTerms = ["compiler warning", "memory leak", "race condition", "nullpointerexception", "logging daemon"];
      for (const opt of trimmedOptions) {
        for (const term of foreignTerms) {
          if (opt.toLowerCase().includes(term)) {
            return {
              valid: false,
              error: `Question #${i + 1} contains inappropriate Computer Science distractor '${term}' for subject '${context?.subject}'.`,
            };
          }
        }
      }
    }

    cleanList.push({
      text: cleanText,
      options: trimmedOptions,
      correctOption: q.correctOption,
      explanation: q.explanation.trim(),
    });
  }

  // Warning check: if every single question has the same correctOption index (e.g. all 0), flag warning
  const allIdentical = correctIndices.every((idx) => idx === correctIndices[0]);
  if (allIdentical) {
    warnings.push("All 5 questions share identical correct option index. Distribution should ideally be varied.");
  }

  return { valid: true, cleanQuestions: cleanList, warnings };
}

/**
 * Builds subject-aware, topic-grounded 5-question fallback assessment for any academic discipline.
 * Distributes correctOption across 0, 1, 2, 3 so it is not always index 0.
 */
export function buildSubjectAwareFallbackQuestions(
  subject: string,
  topicTitle: string
): QuizQuestionCandidate[] {
  const domain = classifySubject(subject, topicTitle);
  const titleLower = topicTitle.toLowerCase();
  const subLower = subject.toLowerCase();

  // 1. Mathematics & Quantitative Sciences
  if (domain === "mathematics") {
    if (titleLower.includes("quadratic")) {
      return [
        {
          text: "What is the standard algebraic form of a quadratic equation in a single variable x?",
          options: [
            "ax + b = 0 with a ≠ 0",
            "ax² + bx + c = 0 with a ≠ 0",
            "ax³ + bx² + cx + d = 0",
            "a / x + b = c",
          ],
          correctOption: 1,
          explanation:
            "A quadratic equation is a second-degree polynomial equation expressed in standard form as ax² + bx + c = 0, where a, b, and c are constants and a ≠ 0.",
        },
        {
          text: "If the discriminant Δ = b² - 4ac of a real quadratic equation is strictly less than zero (Δ < 0), what is the nature of its roots?",
          options: [
            "Two distinct real and rational roots",
            "Exactly one repeated real root",
            "Two complex conjugate roots with non-zero imaginary parts",
            "Infinite real roots along a continuous interval",
          ],
          correctOption: 2,
          explanation:
            "When Δ < 0, the square root of the discriminant involves √(-1) = i, yielding two complex conjugate roots: x = (-b ± i√|Δ|) / 2a.",
        },
        {
          text: "For the quadratic equation x² - 5x + 6 = 0, what are the solutions for x?",
          options: [
            "x = 2 and x = 3",
            "x = -2 and x = -3",
            "x = 1 and x = 6",
            "x = -1 and x = -6",
          ],
          correctOption: 0,
          explanation:
            "Factoring the quadratic gives (x - 2)(x - 3) = 0. Setting each factor to zero yields x = 2 and x = 3. Checking: 2² - 5(2) + 6 = 0 and 3² - 5(3) + 6 = 0.",
        },
        {
          text: "According to Vieta's formulas, what is the product of the roots (x₁ · x₂) of the quadratic equation ax² + bx + c = 0?",
          options: [
            "-b / a",
            "-c / a",
            "b² - 4ac",
            "c / a",
          ],
          correctOption: 3,
          explanation:
            "By Vieta's relations for a quadratic polynomial, the sum of roots is x₁ + x₂ = -b/a and the product of roots is x₁ · x₂ = c/a.",
        },
        {
          text: "What geometric curve is formed by graphing the quadratic function y = ax² + bx + c in the Cartesian coordinate plane?",
          options: [
            "A hyperbola asymptotic to the coordinate axes",
            "A parabola with a vertical axis of symmetry at x = -b / (2a)",
            "A circle centered at the origin",
            "A straight line with constant slope a",
          ],
          correctOption: 1,
          explanation:
            "The graph of any quadratic function y = ax² + bx + c is a parabola opening upward (if a > 0) or downward (if a < 0), with its axis of symmetry at x = -b / 2a.",
        },
      ];
    }

    return [
      {
        text: `In mathematics, what is the primary purpose of defining the domain and range of a function or relation in ${topicTitle}?`,
        options: [
          "To identify valid input values where the expression is mathematically well-defined and determine possible output values.",
          "To convert continuous algebraic functions into discrete computer code strings.",
          "To automatically set all constants and coefficients equal to zero.",
          "To eliminate the need for analytical proofs and derivations.",
        ],
        correctOption: 0,
        explanation:
          "The domain specifies all allowable input values that prevent undefined operations (like division by zero), while the range specifies the set of all resulting outputs.",
      },
      {
        text: `Which operation preserves the equality of a mathematical equation when solving problems in ${topicTitle}?`,
        options: [
          "Squaring only the left side while leaving the right side untouched.",
          "Applying an identical algebraic operation symmetrically to both sides of the equation.",
          "Arbitrarily changing positive signs to negative signs.",
          "Dividing both sides by an expression that equals zero.",
        ],
        correctOption: 1,
        explanation:
          "The fundamental axiom of equality states that applying the identical operation to both sides of an equation preserves mathematical equivalence.",
      },
      {
        text: `What is the significance of boundary or initial conditions when applying equations in ${topicTitle}?`,
        options: [
          "They are optional cosmetic formatting notes.",
          "They convert all equations into geometric circles.",
          "They specify constraints that isolate a unique, physically or mathematically valid solution from a general family of solutions.",
          "They force all variables to remain purely integers.",
        ],
        correctOption: 2,
        explanation:
          "Boundary or initial conditions provide necessary constraints that allow determination of specific constants, isolating a unique solution.",
      },
      {
        text: `When verifying a computed mathematical solution in ${topicTitle}, what is the most reliable self-check?`,
        options: [
          "Assuming the answer is correct if it is an integer.",
          "Substituting the computed value back into the original, un-simplified governing equation to check if LHS = RHS.",
          "Multiplying the final answer by -1.",
          "Omitting all intermediate arithmetic steps.",
        ],
        correctOption: 1,
        explanation:
          "Back-substitution into the original equation verifies whether the computed solution satisfies all original constraints and catches algebraic errors.",
      },
      {
        text: `What frequent mistake occurs when dividing both sides of an equation by an algebraic expression in ${topicTitle}?`,
        options: [
          "Failing to account for the case where the expression could equal zero, which accidentally eliminates valid roots.",
          "Multiplying by the reciprocal.",
          "Using decimal notation instead of fractions.",
          "Rounding irrational numbers to three decimal places.",
        ],
        correctOption: 0,
        explanation:
          "Dividing by a variable expression without checking if it can equal zero is mathematically undefined and eliminates roots (e.g. dividing x² = 2x by x loses the root x = 0).",
      },
    ];
  }

  // 2. Physics & Physical Sciences
  if (domain === "physics") {
    if (titleLower.includes("newton") || titleLower.includes("force")) {
      return [
        {
          text: "According to Newton's Second Law of Motion for an object with constant mass m, what is the relationship between net external force F and acceleration a?",
          options: [
            "F = m / a",
            "F = m · a directed in the direction of the net force",
            "F = 0.5 · m · a²",
            "F is independent of acceleration",
          ],
          correctOption: 1,
          explanation:
            "Newton's Second Law states that the net force equals mass times acceleration (F = ma), with acceleration occurring in the direction of the net resultant force vector.",
        },
        {
          text: "What is the standard SI unit of Force, and how is it defined in fundamental base units?",
          options: [
            "Joule, defined as kg · m² / s²",
            "Watt, defined as J / s",
            "Newton (N), defined as 1 kg · m / s²",
            "Pascal, defined as N / m²",
          ],
          correctOption: 2,
          explanation:
            "One Newton (N) is the force required to accelerate a mass of 1 kilogram at a rate of 1 meter per second squared (1 N = 1 kg·m/s²).",
        },
        {
          text: "A constant net horizontal force of 30 N acts on a 6 kg object on a frictionless surface. What is the resulting acceleration?",
          options: [
            "5.0 m/s²",
            "180 m/s²",
            "0.2 m/s²",
            "24 m/s²",
          ],
          correctOption: 0,
          explanation:
            "Using a = F / m: a = 30 N / 6 kg = 5.0 m/s².",
        },
        {
          text: "What is the crucial physical distinction between an object's mass and its weight?",
          options: [
            "Mass is measured in Newtons, while weight is measured in kilograms.",
            "Mass is an intrinsic scalar measure of inertia (kg), while weight is the gravitational force acting on that mass (N = mg).",
            "Mass varies depending on gravitational field strength, while weight remains strictly constant.",
            "There is no distinction in classical mechanics; both are identical quantities.",
          ],
          correctOption: 1,
          explanation:
            "Mass is an invariant intrinsic property representing resistance to acceleration, whereas weight is the force exerted by gravity (W = mg) that changes with location.",
        },
        {
          text: "When drawing a Free-Body Diagram (FBD) for an object, which forces must be included?",
          options: [
            "Only the forces that the object exerts on its surroundings.",
            "All internal forces between the object's constituent atoms.",
            "Only external forces acting directly ON the object by its environment.",
            "Both internal and external forces simultaneously.",
          ],
          correctOption: 2,
          explanation:
            "A free-body diagram isolates the object of interest and displays only the external contact and non-contact forces acting upon it.",
        },
      ];
    }
  }

  // 3. Biology & Life Sciences
  if (domain === "biology") {
    if (titleLower.includes("photosynthesis")) {
      return [
        {
          text: "In eukaryotic plant cells, where do the light-dependent reactions of photosynthesis take place?",
          options: [
            "In the thylakoid membranes and lumen of the chloroplast",
            "In the stroma of the chloroplast",
            "In the mitochondrial matrix",
            "In the outer cell wall",
          ],
          correctOption: 0,
          explanation:
            "The light-dependent reactions occur across the thylakoid membrane where chlorophyll pigments and electron transport chain complexes are embedded.",
        },
        {
          text: "What is the primary source of the oxygen (O₂) gas released as a byproduct during photosynthesis?",
          options: [
            "The breakdown of carbon dioxide (CO₂) in the Calvin cycle",
            "The enzymatic photolysis (splitting) of water (H₂O) at Photosystem II",
            "The breakdown of glucose during cellular respiration",
            "The conversion of ATP to ADP in the stroma",
          ],
          correctOption: 1,
          explanation:
            "Oxygen released during photosynthesis originates exclusively from the oxidation and photolysis of water molecules at the oxygen-evolving complex of Photosystem II (2H₂O → 4H⁺ + 4e⁻ + O₂).",
        },
        {
          text: "What key enzyme catalyzes the fixation of atmospheric carbon dioxide onto ribulose-1,5-bisphosphate (RuBP) in the Calvin cycle?",
          options: [
            "ATP Synthase",
            "DNA Polymerase III",
            "RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase)",
            "Amylase",
          ],
          correctOption: 2,
          explanation:
            "RuBisCO is the primary enzyme responsible for catalyzing the addition of CO₂ to RuBP during the carbon fixation phase of the Calvin cycle.",
        },
        {
          text: "What two energy-rich chemical products synthesized during the light-dependent reactions are directly consumed by the Calvin cycle?",
          options: [
            "Glucose and Oxygen",
            "ATP and NADPH",
            "NADP⁺ and ADP",
            "Pyruvate and Lactate",
          ],
          correctOption: 1,
          explanation:
            "ATP (chemical energy) and NADPH (reducing power) produced in the light reactions are utilized in the stroma to reduce 3-PGA into G3P during the Calvin cycle.",
        },
        {
          text: "Why is the term 'dark reactions' considered a misnomer for the light-independent reactions of photosynthesis?",
          options: [
            "Because they can only operate during total darkness at midnight.",
            "Because they rely on continuous supplies of ATP and NADPH generated by light, and several Calvin cycle enzymes are light-activated.",
            "Because they absorb infrared heat instead of visible light.",
            "Because they occur in animal cells that lack light exposure.",
          ],
          correctOption: 1,
          explanation:
            "Although the Calvin cycle does not directly absorb photons, it halts in prolonged darkness due to depletion of ATP and NADPH, and key regulatory enzymes (including RuBisCO) require light-driven activation.",
        },
      ];
    }
  }

  // 4. History & Social Sciences
  if (domain === "history_social") {
    if (titleLower.includes("world war") || titleLower.includes("wwi") || titleLower.includes("ww1")) {
      return [
        {
          text: "What historical acronym is commonly used to summarize the four primary long-term structural causes of World War I?",
          options: [
            "NATO (North Atlantic Treaty Organization)",
            "MAIN (Militarism, Alliances, Imperialism, Nationalism)",
            "BRICS (Brazil, Russia, India, China, South Africa)",
            "OPEC (Organization of Petroleum Exporting Countries)",
          ],
          correctOption: 1,
          explanation:
            "Historians use the MAIN acronym to categorize the systemic tensions: Militarism (arms races), Alliances (entangling defense pacts), Imperialism (colonial rivalries), and Nationalism (ethnic self-determination).",
        },
        {
          text: "Which event on June 28, 1914, served as the immediate proximate catalyst for the outbreak of World War I?",
          options: [
            "The sinking of the RMS Lusitania by a German U-boat",
            "The signing of the Treaty of Versailles",
            "The assassination of Archduke Franz Ferdinand of Austria in Sarajevo",
            "The Bolshevik Revolution in Russia",
          ],
          correctOption: 2,
          explanation:
            "The assassination of Archduke Franz Ferdinand and his wife Sophie by Serbian nationalist Gavrilo Princip triggered the July Diplomatic Crisis and mobilized alliance chains.",
        },
        {
          text: "Which two major pre-war European alliance blocs confronted each other prior to August 1914?",
          options: [
            "The Triple Entente (Britain, France, Russia) and the Triple Alliance (Germany, Austria-Hungary, Italy)",
            "The Axis Powers and Allied Coalition",
            "The Warsaw Pact and NATO Alliance",
            "The League of Nations and the Holy Roman Empire",
          ],
          correctOption: 0,
          explanation:
            "The confrontation pitted the Triple Entente (Britain, France, Russia) against the Triple Alliance (Germany, Austria-Hungary, Italy, although Italy later joined the Entente in 1915).",
        },
        {
          text: "What was Article 231 of the 1919 Treaty of Versailles, and what was its historical significance?",
          options: [
            "It admitted Germany into the League of Nations as a permanent council member.",
            "The 'War Guilt Clause', which placed full legal and moral responsibility for the war on Germany and mandated heavy reparations.",
            "It granted immediate independence to all African and Asian colonial territories.",
            "It established a free trade customs union across Central Europe.",
          ],
          correctOption: 1,
          explanation:
            "Article 231 compelled Germany to accept sole responsibility for causing the war, providing legal justification for punitive financial reparations and demilitarization.",
        },
        {
          text: "Which four major imperial dynasties collapsed as a direct consequence of World War I?",
          options: [
            "The British, French, American, and Japanese empires",
            "The Roman, Byzantine, Persian, and Mongol empires",
            "The German (Hohenzollern), Russian (Romanov), Austro-Hungarian (Habsburg), and Ottoman empires",
            "The Spanish, Portuguese, Dutch, and Belgian empires",
          ],
          correctOption: 2,
          explanation:
            "The war brought about the dissolution of four longstanding empires: the Hohenzollern in Germany, the Romanov in Russia, the Habsburg in Austria-Hungary, and the Ottoman Empire.",
        },
      ];
    }
  }

  // 5. English & Language Studies
  if (domain === "languages_literature") {
    if (titleLower.includes("subject-verb") || titleLower.includes("agreement")) {
      return [
        {
          text: "What is the foundational grammatical rule of subject-verb agreement in English?",
          options: [
            "Every verb must always end in '-ed' regardless of the subject.",
            "A singular grammatical subject requires a singular verb, while a plural subject requires a plural verb.",
            "Verbs must always agree with the closest noun in the sentence, even if it is inside a prepositional phrase.",
            "Sentences must never begin with an adverbial clause.",
          ],
          correctOption: 1,
          explanation:
            "Subject-verb agreement requires the verb to match its grammatical subject in person and number (singular subject with singular verb, plural subject with plural verb).",
        },
        {
          text: "In the sentence 'The box of chocolates (is / are) on the counter', which verb form is grammatically correct and why?",
          options: [
            "'are', because 'chocolates' is a plural noun immediately preceding the verb.",
            "'is', because the true grammatical subject is the singular noun 'box', not the prepositional object 'chocolates'.",
            "Either 'is' or 'are' may be used interchangeably.",
            "Neither; the sentence requires a past-participle modal auxiliary.",
          ],
          correctOption: 1,
          explanation:
            "The head subject is 'box' (singular). The intervening prepositional phrase 'of chocolates' modifies the subject but does not change its grammatical number.",
        },
        {
          text: "When two subjects are joined by 'either...or' or 'neither...nor', which rule governs verb agreement?",
          options: [
            "The verb must always be plural.",
            "The verb must always be singular.",
            "The verb agrees in number with the subject closer to it (Rule of Proximity).",
            "The verb agrees exclusively with the first subject.",
          ],
          correctOption: 2,
          explanation:
            "Under the rule of proximity, when subjects are connected by correlative conjunctions like 'either...or' or 'neither...nor', the verb agrees with the subject nearest to it.",
        },
        {
          text: "How are indefinite pronouns like 'everyone', 'each', and 'neither' categorized for verb agreement?",
          options: [
            "They are grammatically singular and require singular verbs.",
            "They are grammatically plural and require plural verbs.",
            "They are strictly neutral and can never be paired with verbs.",
            "They depend on whether the sentence is written in the active or passive voice.",
          ],
          correctOption: 0,
          explanation:
            "Indefinite pronouns such as 'everyone', 'each', 'everybody', 'neither', and 'someone' are grammatically singular and take singular verbs (e.g. 'Everyone is invited').",
        },
        {
          text: "Which sentence demonstrates correct subject-verb agreement?",
          options: [
            "Neither the teacher nor the students was informed of the schedule change.",
            "There is several reasons why we should review the syllabus.",
            "The committee has submitted its unanimous recommendations to the board.",
            "The bouquet of flowers smell fresh and fragrant.",
          ],
          correctOption: 2,
          explanation:
            "A collective noun acting as a single cohesive unit ('committee') takes a singular verb ('has submitted'). In the other options, subject-verb agreement is violated.",
        },
      ];
    }
  }

  // 6. Commerce & Accounting
  if (domain === "commerce_economics") {
    if (subLower.includes("accounting") || titleLower.includes("accounting") || titleLower.includes("entry") || titleLower.includes("ledger")) {
      return [
        {
          text: "What is the fundamental accounting equation that governs balance sheet presentation?",
          options: [
            "Assets + Liabilities = Owner's Equity",
            "Assets = Liabilities + Owner's Equity (Capital)",
            "Revenue = Expenses - Net Income",
            "Debits - Credits = Total Capital",
          ],
          correctOption: 1,
          explanation:
            "The foundational accounting equation states that Assets = Liabilities + Owner's Equity, reflecting that all entity resources are funded either by debt or owner investment.",
        },
        {
          text: "Under the Golden Rules of double-entry accounting, what is the rule for Real Accounts (such as Machinery, Cash, or Land)?",
          options: [
            "Debit the receiver, Credit the giver.",
            "Debit all expenses and losses, Credit all incomes and gains.",
            "Debit what comes in, Credit what goes out.",
            "Always credit asset increases to the reserve account.",
          ],
          correctOption: 2,
          explanation:
            "For Real accounts representing tangible and intangible assets, the golden rule is: Debit what comes in (asset increase) and Credit what goes out (asset decrease).",
        },
        {
          text: "When a business purchases office furniture for $2,000 cash, what is the correct dual entry in the general journal?",
          options: [
            "Debit Cash $2,000; Credit Furniture $2,000",
            "Debit Furniture $2,000; Credit Cash $2,000",
            "Debit Office Expense $2,000; Credit Accounts Payable $2,000",
            "Debit Capital $2,000; Credit Furniture $2,000",
          ],
          correctOption: 1,
          explanation:
            "Furniture (an asset) increases, requiring a Debit of $2,000. Cash (an asset) decreases, requiring an offsetting Credit of $2,000. Net asset change is $0.",
        },
        {
          text: "What is the core principle of the double-entry bookkeeping system?",
          options: [
            "Every transaction must be entered twice in two different notebooks.",
            "For every transaction, the total debited amount must exactly equal the total credited amount.",
            "Cash transactions are recorded, but credit transactions are ignored until year-end.",
            "Debits represent only positive bank balances.",
          ],
          correctOption: 1,
          explanation:
            "The double-entry system mandates that every transaction impacts at least two accounts such that total debits strictly equal total credits (Σ Debits = Σ Credits).",
        },
        {
          text: "Which of the following accounts typically carries a normal Credit balance?",
          options: [
            "Accounts Payable and Sales Revenue",
            "Cash and Equipment",
            "Salary Expense and Rent Expense",
            "Drawings and Inventory",
          ],
          correctOption: 0,
          explanation:
            "Liabilities (Accounts Payable), Revenues (Sales Revenue), and Equity accounts have normal credit balances, increasing on the credit side.",
        },
      ];
    }
  }

  // 7. Computer Science & Software
  if (domain === "computer_science") {
    const isDbms =
      /dbms|database|sql/i.test(subject) ||
      /dbms|database|sql|entity relationship|er model|er diagram|normalization|relational|transactions|concurrency|acid|recovery/i.test(
        titleLower
      );

    if (isDbms) {
      const isUnit1 =
        /intro|introduction to dbms|dbms architecture|file system/i.test(titleLower) ||
        /unit\s*1/i.test(titleLower);
      const isUnit2 =
        /entity relationship|er model|er diagram|cardinality|weak entity/i.test(titleLower) ||
        /unit\s*2/i.test(titleLower);
      const isUnit3 =
        /relational model|sql|relational algebra|ddl|dml|join|group by/i.test(titleLower) ||
        /unit\s*3/i.test(titleLower);
      const isUnit4 =
        /normalization|normal form|functional dependenc|1nf|2nf|3nf|bcnf|lossless/i.test(titleLower) ||
        /unit\s*4/i.test(titleLower);
      const isUnit5 =
        /transaction|concurrency|recovery|acid|serializ|2pl|lock|deadlock|wal/i.test(titleLower) ||
        /unit\s*5/i.test(titleLower);

      if (isUnit1) {
        return [
          {
            text: "Which of the following is a primary architectural advantage of a Database Management System (DBMS) over a conventional File Processing System?",
            options: [
              "DBMS completely eliminates the need for secondary storage devices.",
              "DBMS enforces centralized data independence, eliminating structural data redundancy and inconsistency.",
              "DBMS prevents multiple users from accessing the system concurrently under all circumstances.",
              "DBMS replaces declarative queries with low-level manual assembly code routines.",
            ],
            correctOption: 1,
            explanation:
              "A DBMS provides physical and logical data independence, centralized catalog management, and transactional consistency, overcoming the high data redundancy, manual synchronization, and structural dependency inherent in traditional file processing systems.",
          },
          {
            text: "In the ANSI-SPARC Three-Schema Database Architecture, which schema level describes the physical storage structures, access paths, and internal record organization?",
            options: [
              "External Schema (User Views)",
              "Conceptual Schema (Logical Model)",
              "Internal Schema (Physical Schema)",
              "Application Interface Layer",
            ],
            correctOption: 2,
            explanation:
              "The Internal (Physical) Schema defines how data is physically stored on disk, including page layouts, B-tree indexes, file organization, and compression formats.",
          },
          {
            text: "What does Logical Data Independence ensure in a multi-tier database management system?",
            options: [
              "The ability to modify the conceptual schema without having to rewrite existing external views or user application programs.",
              "The ability to reformat hard disks without powering down the database server.",
              "The guarantee that all SQL queries run in constant O(1) time.",
              "The requirement that foreign keys must be declared with CASCADE delete rules.",
            ],
            correctOption: 0,
            explanation:
              "Logical data independence is the capacity to change the conceptual schema (e.g. adding non-destructive tables or attributes) without altering external schemas or breaking existing client applications.",
          },
          {
            text: "Which database system component is primarily responsible for holding system catalog information, schema definitions, constraints, and user authorizations?",
            options: [
              "Write-Ahead Log (WAL) buffer pool",
              "Operating System Page Table",
              "Client Presentation Component",
              "Data Dictionary / System Catalog",
            ],
            correctOption: 3,
            explanation:
              "The Data Dictionary (System Catalog) is the internal metadata repository storing schemas, relationship structures, constraints, access privileges, and physical index statistics.",
          },
          {
            text: "Who has primary administrative responsibility for defining schemas, managing user security permissions, and overseeing backup and disaster recovery?",
            options: [
              "Sophisticated End User",
              "Database Administrator (DBA)",
              "Naive / Parametric End User",
              "Hardware Firmware Engineer",
            ],
            correctOption: 1,
            explanation:
              "The Database Administrator (DBA) is authorized to configure schema structures, tune performance, manage access permissions, and ensure continuous disaster recovery and backups.",
          },
        ];
      }

      if (isUnit2) {
        return [
          {
            text: "In Entity-Relationship (ER) modeling, how is an Entity Set formally distinguished from an Attribute?",
            options: [
              "An entity set is a collection of distinguishable real-world objects sharing identical attributes, while an attribute is a descriptive property of an entity.",
              "An entity set must always be a numeric foreign key, while attributes are stored as binary blobs.",
              "An attribute contains multiple relational tables, whereas an entity set cannot store data.",
              "There is no difference; entity sets and attributes are interchangeable aliases in Chen notation.",
            ],
            correctOption: 0,
            explanation:
              "An entity is a real-world object distinguishable from other objects (e.g., a specific student), an entity set is a set of entities sharing the same properties, and attributes describe those properties.",
          },
          {
            text: "How is a Weak Entity Set represented in standard Chen ER diagram notation?",
            options: [
              "A dashed oval with a double border",
              "A diamond inside an equilateral triangle",
              "A double rectangle (entity) identified through a double diamond (identifying relationship)",
              "A single rectangle with bold italic text",
            ],
            correctOption: 2,
            explanation:
              "A weak entity set lacks a primary key of its own and depends on an owner entity set; in Chen notation, it is represented by a double rectangle linked by a double diamond identifying relationship.",
          },
          {
            text: "What is the key defining characteristic of a Candidate Key in relational modeling?",
            options: [
              "It must permit NULL values across at least 50% of the tuples.",
              "It is a minimal superkey capable of uniquely identifying every tuple in a relation without redundant attributes.",
              "It can only be formed by concatenating every single column in the relation.",
              "It is created automatically by database backup utilities.",
            ],
            correctOption: 1,
            explanation:
              "A candidate key is a minimal superkey: it satisfies both uniqueness (no two distinct tuples have identical values) and irreducibility (no proper subset satisfies uniqueness).",
          },
          {
            text: "When mapping a Many-to-Many (M:N) relationship between two entity sets (e.g. Students and Courses) into relational tables, what schema structure is required?",
            options: [
              "Adding an array column to the Students table containing all enrolled course codes.",
              "Embedding the entire Courses table inside the primary key of Students.",
              "Merging both entities into a single universal table with no foreign keys.",
              "Creating a separate associative (junction) table containing the foreign keys of both participating entities as a composite key.",
            ],
            correctOption: 3,
            explanation:
              "An M:N relationship cannot be represented as a simple foreign key in either parent table without causing multi-valued repeating groups. It requires a junction table with foreign keys referencing both tables.",
          },
          {
            text: "In an ER diagram, if every entity in entity set E must participate in at least one relationship instance of R, what constraint is present?",
            options: [
              "Total Participation (represented by a double line connecting E to R)",
              "Partial Participation (represented by a dashed line)",
              "Disjoint Generalization without specialization",
              "Ternary Aggregation constraint",
            ],
            correctOption: 0,
            explanation:
              "Total participation (existence dependency) dictates that every entity in the entity set participates in the relationship, designated in ER diagrams by a double line.",
          },
        ];
      }

      if (isUnit3) {
        return [
          {
            text: "In relational algebra, which operator performs horizontal filtering of tuples that satisfy a specified predicate?",
            options: [
              "Projection (π)",
              "Cartesian Product (×)",
              "Selection (σ)",
              "Natural Join (⋈)",
            ],
            correctOption: 2,
            explanation:
              "The Selection operator (σ_predicate) selects tuples that satisfy a Boolean condition, operating horizontally on the relation.",
          },
          {
            text: "What is the crucial operational distinction between the WHERE clause and the HAVING clause in SQL?",
            options: [
              "WHERE filters grouped and aggregated rows after GROUP BY; HAVING filters individual rows before grouping.",
              "WHERE filters individual rows before grouping occurs; HAVING filters aggregated groups formed by GROUP BY.",
              "WHERE only works with numerical columns; HAVING works strictly with strings.",
              "WHERE is part of DDL syntax; HAVING is part of DCL syntax.",
            ],
            correctOption: 1,
            explanation:
              "The WHERE clause filters individual rows before aggregation occurs, whereas the HAVING clause filters summary groups produced by GROUP BY based on aggregate expressions (e.g., HAVING COUNT(*) > 5).",
          },
          {
            text: "What does the Referential Integrity Constraint guarantee in a relational database?",
            options: [
              "That every table must have at least 1,000 tuples.",
              "That all string columns must be stored in Unicode UTF-8 format.",
              "That no transaction can ever be aborted once begun.",
              "That any foreign key value in a referencing table must match an existing primary key value in the referenced table, or be NULL.",
            ],
            correctOption: 3,
            explanation:
              "Referential integrity guarantees that foreign key references are valid; a foreign key value must correspond to a primary key in the referenced parent relation, or evaluate to NULL.",
          },
          {
            text: "Which SQL JOIN returns all rows from the left table and the matched rows from the right table, filling unmatched right attributes with NULL?",
            options: [
              "LEFT OUTER JOIN",
              "INNER JOIN",
              "CROSS JOIN",
              "FULL OUTER JOIN",
            ],
            correctOption: 0,
            explanation:
              "A LEFT OUTER JOIN preserves every row from the left relation. When no matching record exists in the right relation, NULL values are populated for all right-relation columns.",
          },
          {
            text: "How does the aggregate function COUNT(*) differ from COUNT(column_name) in SQL?",
            options: [
              "COUNT(*) counts only distinct values, while COUNT(column_name) counts all rows including duplicates.",
              "COUNT(*) counts every row in the result set including NULLs, while COUNT(column_name) counts only rows where the specified column is non-NULL.",
              "COUNT(*) throws a runtime exception if the table contains foreign keys.",
              "COUNT(*) is deprecated in ANSI SQL standards.",
            ],
            correctOption: 1,
            explanation:
              "COUNT(*) counts total tuples regardless of column content, whereas COUNT(column_name) ignores tuples where column_name evaluates to NULL.",
          },
        ];
      }

      if (isUnit4) {
        return [
          {
            text: "Which database design flaw occurs when deleting an independent master entity unintentionally purges unrelated historical records?",
            options: [
              "Insertion Anomaly",
              "Deletion Anomaly",
              "Deadlock Cascade",
              "Phantom Read Anomaly",
            ],
            correctOption: 1,
            explanation:
              "A deletion anomaly occurs when the removal of data about one real-world entity unintentionally destroys data about an entirely distinct entity due to poor schema decomposition.",
          },
          {
            text: "Under Armstrong's Axioms for functional dependencies, which inference rule states that if X → Y holds, then XZ → YZ holds for any attribute set Z?",
            options: [
              "Augmentation Rule",
              "Transitivity Rule",
              "Reflexivity Rule",
              "Decomposition Rule",
            ],
            correctOption: 0,
            explanation:
              "The Augmentation rule asserts that if X → Y, adding any attribute set Z to both sides yields XZ → YZ.",
          },
          {
            text: "What requirement must a relational table satisfy to achieve Second Normal Form (2NF)?",
            options: [
              "It must be in 3NF and contain no candidate keys.",
              "Every functional dependency must be trivial.",
              "It must contain no multi-valued dependencies.",
              "It must be in 1NF and have no partial functional dependencies (every non-prime attribute must depend on the whole candidate key).",
            ],
            correctOption: 3,
            explanation:
              "2NF requires 1NF compliance plus the complete absence of partial functional dependencies; every non-prime attribute must be fully functionally dependent on every candidate key.",
          },
          {
            text: "How does Third Normal Form (3NF) differ from Boyce-Codd Normal Form (BCNF)?",
            options: [
              "3NF applies to NoSQL document stores, while BCNF applies to SQL databases.",
              "3NF prohibits transitive dependencies, whereas BCNF allows arbitrary transitive dependencies.",
              "In 3NF, for X → Y, Y can be a prime attribute even if X is not a superkey; BCNF strictly requires X to be a superkey for every non-trivial dependency.",
              "3NF requires every column to be an integer primary key.",
            ],
            correctOption: 2,
            explanation:
              "3NF allows X → Y if X is a superkey OR Y is a prime attribute. BCNF eliminates this second condition, mandating that for every non-trivial dependency X → Y, X must strictly be a superkey.",
          },
          {
            text: "Why is a Lossless-Join Decomposition considered an essential property when decomposing a schema into normal forms?",
            options: [
              "It reduces the size of the database on disk by exactly 50%.",
              "It guarantees that joining the decomposed tables via natural join reconstructs the exact original relation without creating spurious (false) tuples.",
              "It removes the need for primary keys across all sub-tables.",
              "It converts relational tables into JSON documents.",
            ],
            correctOption: 1,
            explanation:
              "A lossless-join decomposition ensures that when sub-relations are rejoined via natural join, exactly the original relation is recovered without spurious tuples.",
          },
        ];
      }

      if (isUnit5) {
        return [
          {
            text: "Which ACID property guarantees that all database modifications within a transaction are completed successfully, or the database is rolled back to its pre-transaction state if a failure occurs?",
            options: [
              "Consistency",
              "Durability",
              "Isolation",
              "Atomicity",
            ],
            correctOption: 3,
            explanation:
              "Atomicity ('all-or-nothing') guarantees that either all operations of the transaction are reflected in the database, or none are.",
          },
          {
            text: "How does a DBMS verify whether an interleaved concurrent schedule of transactions is Conflict Serializable?",
            options: [
              "By verifying that all transactions execute on the same CPU core.",
              "By constructing a Precedence (Serialization) Graph and verifying that it contains no directed cycles.",
              "By executing transactions sequentially in alphabetical order of transaction IDs.",
              "By ensuring that no transaction reads any data written in the past 24 hours.",
            ],
            correctOption: 1,
            explanation:
              "A schedule is conflict serializable if and only if its precedence graph contains no directed cycles (it is a Directed Acyclic Graph, DAG).",
          },
          {
            text: "What concurrency anomaly is defined as Transaction T1 reading uncommitted data written by Transaction T2, where T2 subsequently executes a ROLLBACK?",
            options: [
              "Dirty Read (Temporary Update Anomaly)",
              "Non-Repeatable Read",
              "Phantom Read Anomaly",
              "Lost Update Anomaly",
            ],
            correctOption: 0,
            explanation:
              "A Dirty Read occurs when a transaction reads uncommitted modifications made by another concurrent transaction that later fails or rolls back.",
          },
          {
            text: "What does the Two-Phase Locking (2PL) protocol guarantee regarding concurrent transaction schedules?",
            options: [
              "It guarantees freedom from deadlocks without requiring timeouts.",
              "It guarantees that all queries execute in O(1) lock time.",
              "It guarantees conflict serializability, but does NOT prevent deadlocks.",
              "It ensures that no exclusive locks are ever acquired.",
            ],
            correctOption: 2,
            explanation:
              "The Two-Phase Locking (2PL) protocol guarantees conflict serializability, but transactions adhering to 2PL may still encounter deadlocks.",
          },
          {
            text: "Under the Write-Ahead Logging (WAL) protocol, when must log records describing transaction modifications be flushed to non-volatile disk storage?",
            options: [
              "Only when the operating system shuts down cleanly.",
              "Once every 24 hours during nightly maintenance.",
              "After the modified database pages have already been written to the physical database files.",
              "Before the corresponding dirty database page is written to disk, and before the transaction's COMMIT completes.",
            ],
            correctOption: 3,
            explanation:
              "WAL protocol dictates that log records must be written to stable non-volatile storage before the corresponding dirty database page overwrites disk, and before transaction commit is acknowledged.",
          },
        ];
      }

      // General DBMS fallback
      return [
        {
          text: "In relational database design, what is the primary role of a Foreign Key?",
          options: [
            "To establish and enforce a referential link between data in two tables by referencing the primary key of another table.",
            "To encrypt sensitive passwords before storing them on disk.",
            "To speed up arithmetic calculations on numeric columns.",
            "To allow tables to exist without primary keys.",
          ],
          correctOption: 0,
          explanation:
            "A foreign key matches the primary key of a parent table to enforce referential integrity and establish relational connections.",
        },
        {
          text: "Which SQL statement is used to remove an existing table and all of its structure, definitions, and rows from a database permanently?",
          options: [
            "DELETE TABLE table_name;",
            "TRUNCATE table_name;",
            "DROP TABLE table_name;",
            "REMOVE TABLE table_name;",
          ],
          correctOption: 2,
          explanation:
            "DROP TABLE is a DDL command that destroys the table schema, catalog metadata, indexes, and all stored rows permanently.",
        },
        {
          text: "What is the primary benefit of creating an index (such as a B+ tree index) on a relational table column?",
          options: [
            "It eliminates the need for foreign key constraints.",
            "It significantly accelerates data retrieval (SELECT queries) by avoiding full table scans, with a slight write overhead for INSERT/UPDATE.",
            "It automatically normalizes the relation into Boyce-Codd Normal Form.",
            "It compresses the entire database into a single file.",
          ],
          correctOption: 1,
          explanation:
            "Indexes provide balanced tree or hash lookups that speed up search and join predicates from O(N) to O(log N), at the cost of disk space and index update overhead.",
        },
        {
          text: "Which ACID property guarantees that once a transaction commits, its changes survive system crashes and power failures?",
          options: [
            "Atomicity",
            "Consistency",
            "Isolation",
            "Durability",
          ],
          correctOption: 3,
          explanation:
            "Durability guarantees that committed modifications are permanently preserved in non-volatile storage (via disk logs and checkpointing) even if the system crashes immediately afterward.",
        },
        {
          text: "What is the result of evaluating a comparison expression like 'salary > 50000' in SQL when 'salary' is NULL?",
          options: [
            "TRUE",
            "FALSE",
            "UNKNOWN (Three-Valued Logic)",
            "Compile Error",
          ],
          correctOption: 2,
          explanation:
            "SQL uses Three-Valued Logic (TRUE, FALSE, UNKNOWN). Any comparison involving a NULL operand evaluates to UNKNOWN.",
        },
      ];
    }

    if (
      (subLower.includes("java") || titleLower.includes("java")) &&
      (titleLower.includes("foundation") ||
        titleLower.includes("syntax") ||
        titleLower.includes("runtime") ||
        titleLower.includes("architecture") ||
        titleLower.includes("jvm") ||
        titleLower.includes("compilation"))
    ) {
      return [
        {
          text: "What is the primary role of the Java compiler (javac) in the Java compilation and execution lifecycle?",
          options: [
            "It translates Java source code directly into hardware-specific binary machine code.",
            "It compiles human-readable .java source code into platform-independent intermediate bytecode stored in .class files.",
            "It acts as a garbage collector to reclaim unused heap memory.",
            "It executes SQL database queries asynchronously.",
          ],
          correctOption: 1,
          explanation:
            "javac compiles high-level Java source files into architecture-neutral bytecode (.class files), which the JVM then interprets or JIT-compiles into native instructions at runtime.",
        },
        {
          text: "Where do object reference variables that are declared as instance fields of a class reside in the JVM runtime memory model?",
          options: [
            "Always on the thread stack inside the local variable array.",
            "In CPU instruction cache registers only.",
            "Inside the object's payload allocated on the Garbage-Collected Heap.",
            "Permanently in the non-volatile operating system page file.",
          ],
          correctOption: 2,
          explanation:
            "While local reference variables declared inside method frames live in the thread stack's local variable array, instance reference fields are physically stored on the Heap inside the parent object's memory payload.",
        },
        {
          text: "How does Java handle method parameter passing (pass-by-value semantics) for primitive types versus object references?",
          options: [
            "Java is strictly pass-by-value for all types; with object references, the value passed is a copy of the memory address pointing to the heap object.",
            "Primitives are passed by value, but objects are passed strictly by reference.",
            "Both primitives and objects are passed strictly by reference.",
            "Methods can dynamically choose passing mechanisms at runtime using annotations.",
          ],
          correctOption: 0,
          explanation:
            "Java is exclusively pass-by-value. For reference types, the parameter receives a copy of the reference address. Mutating the object payload affects the shared heap object, but reassigning the parameter reference has zero effect on the caller.",
        },
        {
          text: "What is the structural distinction between the JDK, JRE, and JVM?",
          options: [
            "The JVM contains the JDK, while the JRE is only used on mobile devices.",
            "The JRE contains the javac compiler, while the JDK only contains execution libraries.",
            "The JDK contains development tools (like javac) and the JRE; the JRE contains core class libraries and the JVM; the JVM executes bytecode.",
            "There is no distinction; they are identical tools with different version names.",
          ],
          correctOption: 2,
          explanation:
            "The JDK provides the development environment (compiler, debugger, tools) and bundles the JRE; the JRE provides the standard class libraries and bundles the JVM; the JVM executes bytecode.",
        },
        {
          text: "Which phase of the JVM ClassLoader subsystem is responsible for verifying that bytecode conforms to JVM safety constraints and does not cause stack overflows or illegal type casts?",
          options: [
            "The Linking: Verification phase.",
            "The Garbage Collection sweep phase.",
            "The Metaspace compilation phase.",
            "The JNI native binding phase.",
          ],
          correctOption: 0,
          explanation:
            "The Verification stage of the Linking phase inspects loaded bytecode to ensure it obeys JVM constraints, preventing operand stack overflows, illegal casts, and memory corruption before code execution begins.",
        },
      ];
    }

    if (titleLower.includes("class") || titleLower.includes("object") || titleLower.includes("oop")) {
      return [
        {
          text: "In object-oriented programming, what is the fundamental conceptual relationship between a Class and an Object?",
          options: [
            "A class is a concrete instance in memory, while an object is a compile-time configuration file.",
            "A class serves as a user-defined blueprint or template, while an object is a concrete runtime instance occupying memory.",
            "Classes can only have static variables, whereas objects can only have primitive types.",
            "There is no difference; the terms are interchangeable aliases in all programming languages.",
          ],
          correctOption: 1,
          explanation:
            "A class defines the state (fields) and behavior (methods) blueprint, while an object is a concrete realization allocated in memory (e.g. heap).",
        },
        {
          text: "Which keyword in languages like Java or C++ is used to dynamically instantiate an object and allocate its memory on the heap?",
          options: ["alloc", "create", "new", "instanceof"],
          correctOption: 2,
          explanation:
            "The 'new' operator allocates dynamic memory on the heap and invokes the constructor to initialize the newly created object.",
        },
        {
          text: "Why is encapsulation considered a core principle of object-oriented design?",
          options: [
            "It forces all fields to be public and globally mutable across modules.",
            "It bundles data and methods together while restricting direct external access to internal state through access modifiers and methods.",
            "It eliminates the need for constructors.",
            "It guarantees that code will run in O(1) time.",
          ],
          correctOption: 1,
          explanation:
            "Encapsulation hides internal implementation details (e.g. private fields) and exposes controlled public methods (getters/setters) to safeguard state integrity.",
        },
        {
          text: "What occurs when an object reference variable in a garbage-collected language like Java is assigned the value null?",
          options: [
            "The object is immediately erased from disk storage.",
            "The reference variable points to no memory address; if no other live references exist, the heap object becomes eligible for garbage collection.",
            "A compile-time syntax error is thrown immediately.",
            "The system triggers an unrecoverable kernel panic.",
          ],
          correctOption: 1,
          explanation:
            "Assigning null disassociates the reference. Unreferenced heap objects are recognized as unreachable and automatically collected by the garbage collector.",
        },
        {
          text: "What is constructor overloading in class design?",
          options: [
            "Defining multiple constructors within the same class with different parameter counts or types to initialize objects in multiple ways.",
            "Declaring multiple constructors with identical parameter signatures.",
            "Overriding the parent class constructor using an @Override annotation.",
            "Making constructors private to disable inheritance.",
          ],
          correctOption: 0,
          explanation:
            "Constructor overloading allows a class to supply multiple constructors with differing parameter signatures to support flexible object initialization.",
        },
      ];
    }
  }

  // 8. General Academic Fallback for any subject or custom topic
  return [
    {
      text: `What is the core definition and fundamental significance of ${topicTitle} within ${subject}?`,
      options: [
        `It establishes the foundational principles, analytical methods, and governing models within ${subject}.`,
        "It is an obsolete historical convention that has been formally discarded in modern academia.",
        "It applies exclusively to laboratory computer simulations and cannot be observed empirically.",
        "It eliminates all empirical variability and mandates identical outcomes in all scenarios.",
      ],
      correctOption: 0,
      explanation:
        `${topicTitle} provides the essential theoretical foundation and analytical framework necessary to structure understanding in ${subject}.`,
    },
    {
      text: `Which of the following is considered an essential academic best practice when analyzing ${topicTitle}?`,
      options: [
        "Relying entirely on intuition without consulting primary source evidence or analytical derivations.",
        "Verifying underlying assumptions, evaluating empirical evidence, and testing boundary conditions.",
        "Ignoring exceptions and anomalies that contradict an initial hypothesis.",
        "Accepting conclusions without checking intermediate steps or logical consistency.",
      ],
      correctOption: 1,
      explanation:
        "Rigorous academic analysis requires explicit verification of foundational assumptions, systematic evaluation of evidence, and testing for boundary conditions.",
    },
    {
      text: `What primary analytical error occurs when studying complex processes in ${topicTitle}?`,
      options: [
        "Structuring findings into organized comparative tables.",
        "Documenting references and empirical sources carefully.",
        "Confusing correlation with causation, or oversimplifying multi-faceted phenomena into single causes.",
        "Verifying calculations using standard units.",
      ],
      correctOption: 2,
      explanation:
        "A common pitfall is the monocausal fallacy or assuming that because two variables correlate, one must directly cause the other without investigating underlying mechanisms.",
    },
    {
      text: `How does comparative analysis strengthen understanding of ${topicTitle} in ${subject}?`,
      options: [
        "By proving that all theories within ${subject} are identical.",
        "By eliminating the need for empirical observation and definitions.",
        "By replacing qualitative understanding with arbitrary numerical indices.",
        "By highlighting structural similarities and fundamental distinctions between related concepts, models, or cases.",
      ],
      correctOption: 3,
      explanation:
        "Comparative analysis clarifies domain boundaries, highlights contrasting mechanisms, and prevents confusing closely related principles.",
    },
    {
      text: `When preparing for an academic examination on ${topicTitle}, what is the most effective revision strategy?`,
      options: [
        "Memorizing isolated keywords without understanding their underlying mechanisms.",
        "Synthesizing key definitions, working through representative problem exercises, and reviewing common misconceptions.",
        "Skipping foundational prerequisites to focus only on superficial summaries.",
        "Assuming that test questions will never test edge cases or practical application.",
      ],
      correctOption: 1,
      explanation:
        "High-yield revision combines active problem-solving with conceptual mastery of definitions, mechanisms, and common diagnostic errors.",
    },
  ];
}
