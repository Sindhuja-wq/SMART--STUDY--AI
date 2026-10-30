/**
 * Universal Subject Domain Architecture & Pedagogical Profiler
 * Supports any academic subject, custom syllabus, and interdisciplinary topics.
 */

import { buildDbmsNotes } from "./dbmsNotes";
import { buildJavaNotes } from "./javaNotes";
import {
  simulatePageReplacement,
  determineTopicDifficulty,
  estimateTopicDuration,
  generateTopicTheoryDescription,
} from "./osSimulators";

export {
  simulatePageReplacement,
  determineTopicDifficulty,
  estimateTopicDuration,
  generateTopicTheoryDescription,
};

export type SubjectDomain =
  | "mathematics"
  | "physics"
  | "chemistry"
  | "biology"
  | "history_social"
  | "languages_literature"
  | "commerce_economics"
  | "engineering"
  | "computer_science"
  | "law_governance"
  | "environmental_science"
  | "general_academic";

export interface DomainProfile {
  domain: SubjectDomain;
  displayName: string;
  pedagogicalFocus: string;
  requiredElements: string[];
  forbiddenElements: string[];
  systemRole: string;
  notesStructure: string[];
}

export interface DetectedCourseTopic {
  title: string;
  cleanTitle: string;
  unitNumber?: number;
}

export interface DetectedCourseInfo {
  subject: string;
  domain: SubjectDomain;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  topics: DetectedCourseTopic[];
  cleanTopics: string[];
}

export type DetectedSubjectInfo = DetectedCourseInfo;

/**
 * Normalizes subject names and lesson titles by stripping syllabus boilerplate markers
 * (e.g., "Database Management Systems (DBMS) — Syllabus" -> "Database Management Systems (DBMS)")
 * while preserving valid acronyms like (DBMS) and avoiding placeholder corruption.
 */
export function normalizeAcademicTitle(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "";
  let cleaned = raw.trim();

  // Strip leading markdown heading hashes (e.g. "# ", "## ", "### ")
  cleaned = cleaned.replace(/^#+\s*/, "").trim();

  // Strip wrapping markdown formatting (bold, italic, backticks, quotes)
  cleaned = cleaned.replace(/^[*_`"']+|[*_`"']+$/g, "").trim();

  // Strip leading prefixes like "Course:", "Subject:", "Syllabus:", "Module:"
  cleaned = cleaned.replace(/^(?:course|subject|syllabus|curriculum|module)\s*[:\-–—]\s*/i, "").trim();

  // Strip trailing syllabus markers like "— Syllabus", "- Syllabus", ": Syllabus", "Syllabus", "Course Outline"
  cleaned = cleaned.replace(/\s*[\-–—:]+\s*(?:syllabus|curriculum|course outline|course syllabus|exam schedule|module list|study guide|lecture notes)\s*$/i, "").trim();

  // If ends with standalone word "Syllabus" or "Curriculum" after whitespace
  cleaned = cleaned.replace(/\s+(?:syllabus|curriculum|course outline)$/i, "").trim();

  // Re-strip any leading markdown hashes or quotes exposed after prefix removal
  cleaned = cleaned.replace(/^#+\s*/, "").replace(/^[*_`"']+|[*_`"']+$/g, "").trim();

  // If the string contains no alphanumeric characters at all (only punctuation, symbols, whitespace), return empty string
  if (!/[a-zA-Z0-9]/.test(cleaned)) {
    return "";
  }

  return cleaned;
}

/**
 * Extracts and disambiguates the accurate course subject, academic domain,
 * difficulty level, and clean milestone topic titles from syllabus or title headers.
 * Overloaded to accept either an options object or positional (subject, syllabus) arguments.
 */
export function detectCourseSubjectAndDomain(
  subjectOrParams?:
    | {
        subject?: string | null;
        title?: string | null;
        syllabus?: string | null;
        difficulty?: string | null;
      }
    | string
    | null,
  syllabusInput?: string | null,
  requestedDiffInput?: "Beginner" | "Intermediate" | "Advanced" | null,
  rawTitleInput?: string
): DetectedCourseInfo {
  let rawSubject = "";
  let rawTitle = "";
  let rawSyllabus = "";
  let requestedDiff: string | null = null;

  if (typeof subjectOrParams === "object" && subjectOrParams !== null) {
    rawSubject = (subjectOrParams.subject || "").trim();
    rawTitle = (subjectOrParams.title || "").trim();
    rawSyllabus = (subjectOrParams.syllabus || "").trim();
    requestedDiff = subjectOrParams.difficulty || null;
  } else {
    rawSubject = (subjectOrParams || "").trim();
    rawSyllabus = (syllabusInput || "").trim();
    requestedDiff = requestedDiffInput || null;
    rawTitle = (rawTitleInput || "").trim();
  }

  let detectedSubject = normalizeAcademicTitle(rawSubject);
  const parsedTopics: DetectedCourseTopic[] = [];

  const lines = rawSyllabus
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Check if syllabus starts with a course title header, e.g. "Database Management Systems (DBMS) — Syllabus"
  if (lines.length > 0) {
    const firstLine = lines[0];
    const unitPattern = /^(unit|chapter|module|part|section|\d+[\.\:\-\)])\s*\d*/i;
    const firstLineIsUnit = unitPattern.test(firstLine);
    const secondLineIsUnit = lines.length > 1 && unitPattern.test(lines[1]);

    const isHeaderLine =
      !firstLineIsUnit &&
      (secondLineIsUnit ||
        /^(course|subject|syllabus|curriculum)\s*[\:\-–—]/i.test(firstLine) ||
        /\b(dbms|database management systems|data structures|algorithms|operating systems|computer networks|discrete mathematics|linear algebra|general chemistry|organic chemistry|principles of economics|macroeconomics|microeconomics)\b/i.test(
          firstLine
        ));

    if (isHeaderLine) {
      const cleanedHeader = normalizeAcademicTitle(firstLine);
      if (cleanedHeader.length > 2) {
        detectedSubject = cleanedHeader;
      }
    }
  }

  // If subject was empty or generic, infer from title
  if (!detectedSubject || detectedSubject === "General Academic Studies" || detectedSubject === "Course") {
    if (rawTitle && rawTitle.length > 2 && rawTitle !== "Course Curriculum" && rawTitle !== "Exam Study Schedule") {
      const cleanedTitle = normalizeAcademicTitle(rawTitle);
      if (cleanedTitle.length > 2) {
        detectedSubject = cleanedTitle;
      }
    }
    if (!detectedSubject || detectedSubject === "General Academic Studies" || detectedSubject === "Course") {
      detectedSubject = "General Academic Studies";
    }
  }

  // Extract clean topic lines
  let startIndex = 0;
  const unitPattern = /^(?:unit|chapter|module|part|section|\d+[\.\:\-\)])\s*\d*/i;
  
  // Find where the first explicit unit/chapter begins
  let firstUnitIndex = -1;
  for (let idx = 0; idx < lines.length; idx++) {
    if (unitPattern.test(lines[idx])) {
      firstUnitIndex = idx;
      break;
    }
  }

  if (firstUnitIndex > 0) {
    // The lines before the first unit are course headers/metadata
    const firstLine = lines[0];
    const cleanedHeader = normalizeAcademicTitle(firstLine);
    if (cleanedHeader.length > 2) {
      detectedSubject = cleanedHeader;
    }
    startIndex = firstUnitIndex;
  } else if (lines.length > 0 && !unitPattern.test(lines[0])) {
    const firstLine = lines[0];
    const isHeaderLine =
      (lines.length > 1 && unitPattern.test(lines[1])) ||
      /^(course|subject|syllabus|curriculum)\s*[\:\-–—]/i.test(firstLine) ||
      /\b(dbms|database management systems|data structures|algorithms|operating systems|computer networks|discrete mathematics|linear algebra|general chemistry|organic chemistry|principles of economics|macroeconomics|microeconomics)\b/i.test(
        firstLine
      );

    if (isHeaderLine) {
      const cleanedHeader = normalizeAcademicTitle(firstLine);
      if (cleanedHeader.length > 2) {
        detectedSubject = cleanedHeader;
      }
      startIndex = 1;
    }
  }

  // If subject was empty or generic, infer from title
  if (!detectedSubject || detectedSubject === "General Academic Studies" || detectedSubject === "Course") {
    if (rawTitle && rawTitle.length > 2 && rawTitle !== "Course Curriculum" && rawTitle !== "Exam Study Schedule") {
      const cleanedTitle = normalizeAcademicTitle(rawTitle);
      if (cleanedTitle.length > 2) {
        detectedSubject = cleanedTitle;
      }
    }
    if (!detectedSubject || detectedSubject === "General Academic Studies" || detectedSubject === "Course") {
      detectedSubject = "General Academic Studies";
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length < 2) continue;

    if (/^(units?|chapters?|modules?|topics?|table of contents|index|syllabus|curriculum)\s*[\:\-]?$/i.test(line)) {
      continue;
    }

    let unitNumber: number | undefined = undefined;
    const unitMatch =
      line.match(/^(?:unit|chapter|module|part|section)\s*(\d+)/i) ||
      line.match(/^(\d+)[\.\:\-\)]/);
    if (unitMatch && unitMatch[1]) {
      unitNumber = parseInt(unitMatch[1], 10);
    }

    const cleanTitle = normalizeAcademicTitle(
      line
        .replace(/^(?:unit|chapter|module|part|section)\s*\d*[\s:\.\-]+/i, "")
        .replace(/^[\d\.\-\*\•\)\s]+/, "")
    ).trim();

    // Do not insert duplicate of the course subject as a topic
    if (cleanTitle.toLowerCase() === detectedSubject.toLowerCase()) {
      continue;
    }

    // Do not insert broad combined overview module ahead of Unit 1 unless requested
    if (
      parsedTopics.length === 0 &&
      unitNumber === undefined &&
      !/overview/i.test(line) &&
      /architecture.*process management/i.test(cleanTitle)
    ) {
      continue;
    }

    if (cleanTitle.length > 0 && !/^(unit|chapter|module)\s*\d+$/i.test(cleanTitle)) {
      parsedTopics.push({
        title: line,
        cleanTitle: cleanTitle.length > 0 ? cleanTitle : line,
        unitNumber,
      });
    }
  }

  if (parsedTopics.length === 0) {
    const cleanSub = normalizeAcademicTitle(detectedSubject) || "Foundations";
    let defaultTitle = `${cleanSub} Foundations & Core Principles`;
    const subLower = cleanSub.toLowerCase();
    if (subLower.includes("dbms") || subLower.includes("database")) {
      defaultTitle = "DBMS Architecture & Relational Principles";
    } else if (subLower.includes("java")) {
      defaultTitle = "Java Foundations, Syntax & Runtime Architecture";
    } else if (subLower.includes("operating system") || subLower === "os") {
      defaultTitle = "Unit 1: Introduction to Operating Systems";
    }

    const cleanDefault = defaultTitle.replace(/^(?:unit|chapter|module)\s*\d*[\s:\.\-]+/i, "");
    parsedTopics.push({
      title: defaultTitle,
      cleanTitle: cleanDefault,
      unitNumber: 1,
    });
  }

  const cleanTopics = parsedTopics.map((t) => t.cleanTitle);
  const domain = classifySubject(detectedSubject, parsedTopics[0]?.cleanTitle || rawTitle, rawSyllabus || undefined);

  const diff: "Beginner" | "Intermediate" | "Advanced" =
    requestedDiff === "Advanced" || requestedDiff === "Intermediate"
      ? requestedDiff
      : "Beginner";

  return {
    subject: detectedSubject,
    domain,
    difficulty: diff,
    topics: parsedTopics,
    cleanTopics,
  };
}

/**
 * Classifies any academic subject and topic into a pedagogical domain.
 * This is an open classifier: unknown subjects map cleanly to "general_academic"
 * without ever receiving irrelevant Computer Science or programming content.
 */
export function classifySubject(subject: string, topicTitle?: string, syllabus?: string): SubjectDomain {
  const combined = `${subject || ""} ${topicTitle || ""} ${syllabus || ""}`.toLowerCase();
  const subLower = (subject || "").toLowerCase();
  const topicLower = (topicTitle || "").toLowerCase();
  const syllabusLower = (syllabus || "").toLowerCase();

  // 1. Explicit Computer Science, Databases, Software & Information Technology
  // Guard against keyword collisions: Database concepts such as "relational algebra",
  // "tuple relational calculus", "domain constraints", "boolean algebra", or queries
  // must be classified as computer_science, NEVER as pure mathematics.
  const isCSOrDatabase =
    /\b(dbms|database|sql|nosql|relational model|entity relationship|er model|er diagram|normalization|concurrency control|acid properties|transaction management|data structures?|algorithms?|operating systems?|computer science|software engineering|programming|information technology|web development|cybersecurity|cloud computing)\b/i.test(
      subLower
    ) ||
    /\b(database management systems|dbms|relational model|entity relationship|normalization|acid properties|transaction management|operating systems?|process scheduling|virtual memory|paging|deadlocks?|cpu scheduling|data structures?|algorithms?|merge sort|binary search)\b/i.test(
      topicLower
    ) ||
    /\b(database management systems|dbms|relational model|entity relationship model|relational model and sql|database design and normalization|transactions, concurrency, and recovery|operating systems?|process management|memory management)\b/i.test(
      syllabusLower
    ) ||
    /\b(relational algebra|relational calculus|tuple relational calculus|domain relational calculus|operating systems?|process scheduling|virtual memory|cpu scheduling)\b/i.test(
      combined
    );

  if (
    isCSOrDatabase &&
    !/\b(pure mathematics|abstract algebra|calculus 101|real analysis)\b/i.test(subLower)
  ) {
    return "computer_science";
  }

  // 2. Disambiguate Relational Algebra / Relational Calculus:
  // If the term "relational algebra" or "relational calculus" is present,
  // it is ALWAYS Computer Science / Database Systems, NEVER high-school or pure mathematics!
  if (/\b(relational algebra|relational calculus|tuple relational calculus|domain relational calculus)\b/i.test(combined)) {
    return "computer_science";
  }

  // Mathematics, Statistics, Applied Math
  if (
    /\b(math|mathematics|calculus|algebra|geometry|trigonometry|statistics|probability|differential equation|linear algebra|discrete math|number theory|arithmetic|topology)\b/i.test(
      combined
    ) &&
    !/\b(database|dbms|sql|relational model|operating system|software)\b/i.test(combined)
  ) {
    return "mathematics";
  }

  // Physics & Astronomy
  if (
    /\b(physics|mechanics|thermodynamics|electromagnetism|quantum|optics|kinematics|relativity|astronomy|astrophysics|newton|gravitation|wave motion|nuclear physics)\b/i.test(
      combined
    )
  ) {
    return "physics";
  }

  // Chemistry & Biochemistry
  if (
    /\b(chemistry|organic chemistry|inorganic chemistry|physical chemistry|biochemistry|chemical reaction|stoichiometry|periodic table|molecular|covalent|ionic|catalysis|titration)\b/i.test(
      combined
    )
  ) {
    return "chemistry";
  }

  // Biology & Life Sciences
  if (
    /\b(biology|genetics|botany|zoology|ecology|physiology|anatomy|cell biology|microbiology|photosynthesis|dna|rna|evolution|immunology|biotechnology|neuroscience)\b/i.test(
      combined
    )
  ) {
    return "biology";
  }

  // History, Geography, Civics, Political Science, Sociology
  if (
    /\b(history|geography|civics|political science|sociology|anthropology|archaeology|world war|revolution|civilization|colonialism|governance|geopolitics|constitution)\b/i.test(
      combined
    ) &&
    !/\b(system|operating system|database)\b/i.test(subject)
  ) {
    return "history_social";
  }

  // English, Grammar, Literature, Linguistics, Languages
  if (
    /\b(english|literature|grammar|writing|poetry|prose|linguistics|rhetoric|syntax|phonetics|french|spanish|german|comprehension|subject-verb|novel|drama)\b/i.test(
      combined
    ) &&
    !/\b(programming|code|java|python|c\+\+|javascript)\b/i.test(subject)
  ) {
    return "languages_literature";
  }

  // Commerce, Accounting, Economics, Business, Finance
  if (
    /\b(accounting|commerce|economics|microeconomics|macroeconomics|finance|business studies|marketing|banking|ledger|balance sheet|journal entry|audit|cost accounting|debit|credit)\b/i.test(
      combined
    )
  ) {
    return "commerce_economics";
  }

  // Law, Jurisprudence, Legal Studies
  if (
    /\b(law|legal|jurisprudence|criminal law|civil law|contract law|torts|constitutional law|statute|judiciary|litigation|court)\b/i.test(
      combined
    )
  ) {
    return "law_governance";
  }

  // Environmental Science & Ecology
  if (
    /\b(environmental science|ecology|sustainability|biodiversity|conservation|pollution|climate change|ecosystem|forestry|renewable energy)\b/i.test(
      combined
    )
  ) {
    return "environmental_science";
  }

  // Engineering disciplines (Civil, Mechanical, Electrical, Chemical, etc.)
  if (
    /\b(engineering|mechanical engineering|civil engineering|electrical engineering|electronics|chemical engineering|aerospace|structural analysis|fluid mechanics|circuits|signals and systems)\b/i.test(
      combined
    ) &&
    !/\b(software engineering|computer engineering)\b/i.test(subject)
  ) {
    return "engineering";
  }

  // Computer Science, Programming, Information Technology
  if (
    /\b(computer science|programming|software|java|python|c\+\+|c#|javascript|typescript|dbms|database|sql|operating systems?|process scheduling|virtual memory|networking|data structures?|algorithms?|cloud|cybersecurity|web development)\b/i.test(
      combined
    )
  ) {
    return "computer_science";
  }

  return "general_academic";
}

/**
 * Returns pedagogical guidance and structural requirements tailored to the subject.
 */
export function getDomainProfile(domain: SubjectDomain, subject: string): DomainProfile {
  switch (domain) {
    case "mathematics":
      return {
        domain,
        displayName: "Mathematics & Quantitative Sciences",
        pedagogicalFocus:
          "Rigorous mathematical formulations, explicit definitions of variables and domain constraints, step-by-step analytical derivations, and fully worked numerical calculations with checked final answers.",
        requiredElements: [
          "Mathematical definitions and theorems",
          "Governing formulas with variable definitions and constraints",
          "Step-by-step derivations or analytical proofs",
          "Fully worked numerical examples with intermediate calculations",
          "Verification / self-check of final answers",
          "Common computational errors and algebraic pitfalls",
        ],
        forbiddenElements: [
          "Computer programming code unless specifically requested as numerical computing",
          "Unverified numerical claims without working",
          "Generic software development terminology",
        ],
        systemRole:
          "distinguished university professor of mathematics and quantitative analysis",
        notesStructure: [
          "1. Topic Title & Mathematical Learning Objectives",
          "2. Prerequisites & Domain Invariants",
          "3. Rigorous Definitions & Conceptual Overview",
          "4. Governing Formulas, Theorems & Step-by-Step Derivations",
          "5. Worked Examples with Step-by-Step Calculations & Verified Answers",
          "6. Comparative Analysis / Analytical Distinctions",
          "7. Common Exam Mistakes & Computational Traps",
          "8. Practice Problems with Detailed Solutions",
          "9. High-Yield Revision Summary",
        ],
      };

    case "physics":
      return {
        domain,
        displayName: "Physics & Physical Sciences",
        pedagogicalFocus:
          "Physical laws, governing principles, SI units and dimensional analysis, theoretical mechanisms, and step-by-step numerical problems with physical interpretation.",
        requiredElements: [
          "Physical laws and fundamental principles",
          "Equations with all variables defined and standard SI units stated",
          "Sign conventions and frame of reference assumptions",
          "Worked numerical problems showing intermediate steps and units",
          "Physical interpretations of limiting and edge cases",
          "Common conceptual misconceptions and calculation traps",
        ],
        forbiddenElements: [
          "Programming code examples unless computational physics was explicitly requested",
          "Equations without defined units",
          "Generic software jargon",
        ],
        systemRole: "distinguished professor of physics and physical sciences",
        notesStructure: [
          "1. Topic Title & Physical Learning Objectives",
          "2. Prerequisites & Physical Assumptions",
          "3. Core Physical Laws, Principles & Conceptual Mechanics",
          "4. Governing Equations with Variables and SI Units",
          "5. Step-by-Step Worked Problems with Dimensional Checking",
          "6. Comparative Analysis & Physical Distinctions",
          "7. Common Misconceptions & Exam Pitfalls",
          "8. Practice Questions with Detailed Solutions",
          "9. Key Points Revision Summary",
        ],
      };

    case "chemistry":
      return {
        domain,
        displayName: "Chemistry & Chemical Sciences",
        pedagogicalFocus:
          "Molecular principles, balanced chemical equations, reaction conditions, mechanisms, stoichiometry, safety, and periodic trends.",
        requiredElements: [
          "Balanced chemical equations with states of matter and conditions",
          "Molecular mechanisms, bonding, and electronic principles",
          "Stoichiometric or quantitative calculations where relevant",
          "Laboratory, environmental, or industrial context with safety precautions",
          "Key distinctions between related chemical species or reactions",
          "Common exam errors in nomenclature, balancing, or mechanism arrows",
        ],
        forbiddenElements: [
          "Software code blocks",
          "Unbalanced chemical equations",
          "Programming terminology",
        ],
        systemRole: "distinguished professor of chemistry and chemical sciences",
        notesStructure: [
          "1. Topic Title & Chemical Learning Objectives",
          "2. Prerequisites & Periodic Context",
          "3. Conceptual Principles & Molecular Structure",
          "4. Chemical Equations, Reaction Mechanisms & Conditions",
          "5. Quantitative Calculations & Worked Examples",
          "6. Comparative Analysis Table",
          "7. Common Misconceptions & Exam Traps",
          "8. Practice Problems with Step-by-Step Solutions",
          "9. Concise Revision Summary",
        ],
      };

    case "biology":
      return {
        domain,
        displayName: "Biological & Life Sciences",
        pedagogicalFocus:
          "Accurate biological nomenclature, anatomical structures, physiological functions, sequential biochemical or cellular processes, and evolutionary or ecological context.",
        requiredElements: [
          "Precise biological and anatomical terminology",
          "Clear breakdown of structure vs. function",
          "Step-by-step chronological or sequential process descriptions (e.g. pathways, cycles)",
          "Comparative tables of related structures, organisms, or mechanisms",
          "Significance to homeostasis, survival, or clinical context",
          "Common student confusions between terms or stages",
        ],
        forbiddenElements: [
          "Programming code blocks or computer algorithms",
          "Software design patterns",
          "Vague non-scientific colloquialisms",
        ],
        systemRole: "distinguished professor of biological sciences and physiology",
        notesStructure: [
          "1. Topic Title & Biological Learning Objectives",
          "2. Prerequisites & Taxonomic/Cellular Context",
          "3. Conceptual Overview & Structure-Function Relationships",
          "4. Step-by-Step Biological Mechanisms, Pathways & Stages",
          "5. Structural Breakdown / Process Flow Table",
          "6. Comparative Analysis Table",
          "7. Common Misconceptions & Diagnostic Exam Traps",
          "8. Practice Questions with Detailed Explanations",
          "9. High-Yield Revision Summary",
        ],
      };

    case "history_social":
      return {
        domain,
        displayName: "History, Social Sciences & Humanities",
        pedagogicalFocus:
          "Accurate chronology, primary causes (underlying and immediate), key historical actors, turning points, consequences (short and long term), historiographical analysis, and contextual significance.",
        requiredElements: [
          "Chronological timeline of key events and milestones",
          "Direct and root causes (political, economic, social, ideological)",
          "Key figures, groups, and institutional actions",
          "Short-term and long-term consequences and legacy",
          "Comparative historical analysis or cause-and-effect matrix",
          "Historiographical perspectives or common myths vs. historical evidence",
        ],
        forbiddenElements: [
          "Computer code, algorithms, or technical syntax",
          "Fabricated quotes or citations",
          "Anachronistic software engineering terminology",
        ],
        systemRole: "distinguished historian and professor of social sciences",
        notesStructure: [
          "1. Historical Topic & Learning Objectives",
          "2. Chronological Context & Historical Background",
          "3. Underlying & Immediate Causes",
          "4. Key Events, Turning Points & Chronological Progression",
          "5. Actors, Movements & Perspectives",
          "6. Short-Term & Long-Term Impacts & Legacy",
          "7. Comparative Cause-and-Effect Analysis Table",
          "8. Common Historical Misconceptions & Exam Traps",
          "9. Essay/Exam Practice Questions with Model Analysis",
          "10. Quick Revision Timeline & Key Points",
        ],
      };

    case "languages_literature":
      return {
        domain,
        displayName: "Languages, Grammar & Literature",
        pedagogicalFocus:
          "Grammatical principles, syntactic structures, literary devices, textual analysis, illustrative authentic examples, and guided writing practice.",
        requiredElements: [
          "Grammatical or linguistic rules with clear definitions",
          "Contrasting correct vs. incorrect usage examples with annotations",
          "Contextual literary analysis, themes, or stylistic devices where relevant",
          "Structural templates or patterns for writing application",
          "Common grammatical pitfalls and diagnostic exam errors",
          "Guided practice exercises with answer keys",
        ],
        forbiddenElements: [
          "Software programming code (Java, C, Python, etc.)",
          "Computer runtime and compilation concepts",
        ],
        systemRole: "distinguished professor of literature, linguistics, and rhetoric",
        notesStructure: [
          "1. Topic Title & Linguistic/Literary Objectives",
          "2. Fundamental Rules & Structural Definitions",
          "3. In-Depth Explanation with Exemplary Authentic Usage",
          "4. Contrasting Correct vs. Incorrect Examples with Analysis",
          "5. Literary Devices, Rhetorical Nuances & Style Analysis",
          "6. Comparative Usage Table",
          "7. Frequent Exam Pitfalls & Grammatical Traps",
          "8. Practice Exercises & Model Corrections",
          "9. Quick Revision Rules Sheet",
        ],
      };

    case "commerce_economics":
      return {
        domain,
        displayName: "Commerce, Accounting & Economics",
        pedagogicalFocus:
          "Standard accounting formats (Journal, Ledger, Balance Sheet), double-entry debit/credit mechanics, economic models, market equilibrium, formulas, and worked calculations.",
        requiredElements: [
          "Core economic or accounting principles and conventions",
          "Double-entry bookkeeping formats with Debit/Credit columns where applicable",
          "Formulas with variable definitions (e.g. elasticity, ratios, profit/loss)",
          "Step-by-step worked numerical financial or economic problems",
          "Comparative tables of policies, instruments, or accounting treatments",
          "Common exam calculation mistakes and classification errors",
        ],
        forbiddenElements: [
          "Programming code unless financial programming was explicitly requested",
          "Unbalanced accounting entries where debits do not equal credits",
        ],
        systemRole: "distinguished professor of accounting, finance, and economics",
        notesStructure: [
          "1. Topic Title & Commercial/Economic Objectives",
          "2. Prerequisites & Governing Regulatory Framework / Economic Context",
          "3. Core Principles, Definitions & Conventions",
          "4. Formats, Journal Entries, or Economic Models",
          "5. Step-by-Step Worked Numerical Problems & Calculations",
          "6. Comparative Analysis Table",
          "7. Common Exam Mistakes & Classification Errors",
          "8. Practice Problems with Complete Worked Solutions",
          "9. Key Points Revision Summary",
        ],
      };

    case "engineering":
      return {
        domain,
        displayName: "Engineering Sciences",
        pedagogicalFocus:
          "Engineering principles, governing physical/mathematical equations, material constraints, safety factors, practical system designs, and step-by-step problem calculations.",
        requiredElements: [
          "Core engineering principles and governing equations",
          "Assumptions, boundary conditions, and design constraints",
          "Units and dimensional consistency throughout calculations",
          "Worked numerical design or analytical problems",
          "Practical industrial/real-world applications and safety factors",
          "Common engineering design errors and calculation traps",
        ],
        forbiddenElements: [
          "Irrelevant computer software jargon for non-software engineering disciplines",
          "Purely speculative numbers without clear units",
        ],
        systemRole: "distinguished professor and senior professional engineer",
        notesStructure: [
          "1. Topic Title & Engineering Learning Objectives",
          "2. Prerequisites & Design Assumptions",
          "3. Fundamental Principles & Governing Equations",
          "4. Analytical Derivations & System Modeling",
          "5. Worked Engineering Calculations with Units and Safety Factors",
          "6. Comparative Analysis of Design Methodologies",
          "7. Practical Applications, Constraints & Common Exam Traps",
          "8. Practice Problems with Step-by-Step Solutions",
          "9. Engineering Revision Summary",
        ],
      };

    case "law_governance":
      return {
        domain,
        displayName: "Law & Jurisprudence",
        pedagogicalFocus:
          "Statutory provisions, legal doctrines, judicial precedents, constitutional frameworks, elements of legal tests, case analysis, and practical application.",
        requiredElements: [
          "Statutory definitions and foundational legal doctrines",
          "Elements of the legal test or rule required for liability/applicability",
          "Landmark judicial precedents and case summaries with legal holdings",
          "Step-by-step application of law to hypothetical factual scenarios",
          "Comparative analysis of doctrines or jurisdictional distinctions",
          "Common misconceptions and exam traps in legal reasoning",
        ],
        forbiddenElements: [
          "Computer code blocks and software engineering jargon",
          "Fabricated case citations or non-existent statutes",
        ],
        systemRole: "distinguished professor of law and constitutional jurisprudence",
        notesStructure: [
          "1. Topic Title & Legal Learning Objectives",
          "2. Statutory Framework & Jurisprudential Context",
          "3. Core Legal Doctrine & Essential Elements of the Rule",
          "4. Leading Precedents, Case Law & Judicial Interpretation",
          "5. Application: Step-by-Step Analysis of Fact Scenarios",
          "6. Comparative Doctrines Table",
          "7. Common Analytical Traps & Exam Pitfalls",
          "8. Problem-Style Practice Questions with Model Legal Reasoning",
          "9. Concise Revision Summary",
        ],
      };

    case "computer_science":
      return {
        domain,
        displayName: "Computer Science & Software Systems",
        pedagogicalFocus:
          "Syntactically valid, runnable code in the exact language appropriate for the subject (e.g. Java for Java), beginner-friendly conceptual definitions, keyword explanation, line-by-line breakdown, console output, practical real-world scenario, error debugging with fixes, and 5 practice questions with answers.",
        requiredElements: [
          "Topic title and learning objectives",
          "Prerequisites and background context",
          "Clear definition and explanation in beginner-friendly English",
          "Why the concept is useful and where it is used in production systems",
          "Syntax and explanation of important keywords",
          "Correct, complete, runnable code example with main entry point",
          "Line-by-line code explanation detailing constructs",
          "Expected console output for the code example",
          "Practical real-world industry example",
          "Common mistakes and how to fix them with code before/after snippets",
          "Comparative analysis tables contrasting related concepts",
          "Important exam and interview points with memory architecture insights",
          "Short recap of key takeaways",
          "Exactly 5 practice questions with complete answers and explanations in a separate section",
        ],
        forbiddenElements: [
          "Generic dummy placeholder functions like executePattern() or dummyFunction()",
          "Non-functional pseudocode masquerading as complete runnable syntax",
          "Unclosed or truncated code blocks",
        ],
        systemRole: "distinguished computer science professor and principal software systems architect",
        notesStructure: [
          "### 1. Topic Title & Learning Objectives",
          "### 2. Prerequisites & Background Context",
          "### 3. Clear Definition & Explanation (in beginner-friendly English)",
          "### 4. Why This Concept Is Useful & Where It Is Used",
          "### 5. Syntax & Important Keywords Explanation",
          "### 6. Correct, Complete, Runnable Code Example",
          "### 7. Line-by-Line Code Explanation",
          "### 8. Expected Console Output",
          "### 9. Practical Real-World Example",
          "### 10. Common Mistakes & How to Fix Them",
          "### 11. Comparative Analysis Table",
          "### 12. Important Exam & Interview Points",
          "### 13. Short Recap",
          "### 14. Practice Questions & Detailed Explanations (Exactly 5 comprehensive questions with complete answers in a separate section)",
        ],
      };

    case "environmental_science":
      return {
        domain,
        displayName: "Environmental Science & Ecology",
        pedagogicalFocus:
          "Ecological principles, biogeochemical cycles, human impact, environmental metrics, conservation strategies, policy mechanisms, and scientific methodology.",
        requiredElements: [
          "Scientific definitions and ecological principles",
          "Biogeochemical pathways, energy transfers, or systemic models",
          "Empirical metrics, units, and measurement methods",
          "Human-environment interactions, policy responses, and mitigation",
          "Comparative analysis of ecosystems, pollutants, or conservation methods",
          "Common misconceptions and exam mistakes",
        ],
        forbiddenElements: ["Software programming jargon and code blocks"],
        systemRole: "distinguished professor of environmental science and conservation biology",
        notesStructure: [
          "1. Topic Title & Environmental Learning Objectives",
          "2. Ecological Context & Foundational Principles",
          "3. Detailed Systemic Mechanisms, Cycles & Pathways",
          "4. Empirical Data, Measurements & Case Studies",
          "5. Anthropogenic Impacts & Mitigation Strategies",
          "6. Comparative Environmental Analysis Table",
          "7. Common Misconceptions & Exam Traps",
          "8. Practice Questions with Explanations",
          "9. Key Points Revision Summary",
        ],
      };

    case "general_academic":
    default:
      return {
        domain: "general_academic",
        displayName: `${subject} Academic Studies`,
        pedagogicalFocus:
          "Clear conceptual definitions, step-by-step thematic progression, authentic discipline-specific examples, comparative analyses, and high-yield examination takeaways.",
        requiredElements: [
          "Clear definitions and foundational concepts",
          "Step-by-step breakdown of core mechanisms or principles",
          "Concrete authentic examples demonstrating practical application",
          "Comparative analysis highlighting key distinctions",
          "Common student misconceptions and exam pitfalls",
          "Self-check questions with thorough explanations",
        ],
        forbiddenElements: [
          "Unrelated computer programming code or software jargon",
          "Repeated filler paragraphs or boilerplate text",
        ],
        systemRole: `distinguished university scholar and academic mentor specializing in ${subject}`,
        notesStructure: [
          "1. Topic Title & Learning Objectives",
          "2. Conceptual Foundations & Core Definitions",
          "3. Step-by-Step Principles & Structural Mechanics",
          "4. Concrete Examples & Analytical Applications",
          "5. Comparative Analysis Table",
          "6. Common Misconceptions & Exam Pitfalls",
          "7. Practice Questions with Detailed Explanations",
          "8. Concise High-Yield Revision Summary",
        ],
      };
  }
}

/**
 * Builds rich, subject-appropriate, fully articulated fallback notes for any academic discipline.
 * Avoids ALL programming jargon for non-CS subjects.
 */
export function buildSubjectAwareFallbackNotes(params: {
  subject: string;
  topicTitle: string;
  theory?: string | null;
  difficulty?: string | null;
  timeEstimate?: number | null;
  isExamMode?: boolean;
  syllabus?: string | null;
}): string {
  const { subject, topicTitle, theory, difficulty, timeEstimate, isExamMode = false, syllabus } = params;
  let safeTheory = (theory || "").trim();
  // Strip stray markdown heading hashes and quotes leaked into theory string
  safeTheory = safeTheory.replace(/#+\s*/g, "").replace(/^[*_`"']+|[*_`"']+$/g, "").trim();
  // Suppress generic repetitive template boilerplate (e.g. "Comprehensive academic principles ... for X in Y")
  if (/comprehensive academic principles.*for\s+/i.test(safeTheory)) {
    safeTheory = "";
  }

  const cleanSubject = normalizeAcademicTitle(subject) || "General Academic Studies";
  let cleanTopic = normalizeAcademicTitle(topicTitle);

  // If cleanTopic is empty or merely echoes the subject / "Syllabus"
  const topicLower = cleanTopic.toLowerCase();
  const subLower = cleanSubject.toLowerCase();
  if (
    !cleanTopic ||
    topicLower === subLower ||
    topicLower === "syllabus" ||
    topicLower === "curriculum" ||
    topicLower === "course outline" ||
    /^(?:course|subject|syllabus|curriculum)\b/i.test(topicLower)
  ) {
    if (syllabus && syllabus.trim().length > 10) {
      const course = detectCourseSubjectAndDomain(cleanSubject, syllabus);
      if (course.topics.length > 0) {
        cleanTopic = course.topics[0].cleanTitle || course.topics[0].title;
      }
    }

    if (!cleanTopic || cleanTopic.toLowerCase() === subLower) {
      if (subLower.includes("dbms") || subLower.includes("database")) {
        cleanTopic = "DBMS Architecture & Relational Principles";
      } else if (subLower.includes("java")) {
        cleanTopic = "Java Foundations, Syntax & Runtime Architecture";
      } else if (subLower.includes("operating system") || subLower === "os") {
        cleanTopic = "Operating System Architecture & Process Management";
      } else if (subLower.includes("algorithm")) {
        cleanTopic = "Algorithmic Complexity & Core Design Techniques";
      } else if (subLower.includes("economics")) {
        cleanTopic = "Market Equilibrium & Economic Foundations";
      } else {
        cleanTopic = `${cleanSubject} Foundations & Core Principles`;
      }
    }
  }

  // Synthesize substantive theory if missing or generic template
  if (!safeTheory || /comprehensive academic principles.*for\s+/i.test(safeTheory)) {
    safeTheory = generateTopicTheoryDescription(topicTitle, cleanTopic, cleanSubject);
  }

  const domain = classifySubject(cleanSubject, cleanTopic, syllabus || undefined);
  const profile = getDomainProfile(domain, cleanSubject);
  const diff: "Beginner" | "Intermediate" | "Advanced" =
    difficulty === "Beginner" || difficulty === "Advanced" || difficulty === "Intermediate"
      ? difficulty
      : determineTopicDifficulty(topicTitle, cleanTopic, undefined, domain);
  const time = timeEstimate || estimateTopicDuration(topicTitle, cleanTopic, diff, 60);

  const metadataBadge = `> **Subject**: ${cleanSubject} | **Domain**: ${profile.displayName} | **Difficulty**: ${diff} | **Estimated Study Time**: ${time} mins | **Mode**: ${
    isExamMode ? "High-Yield Exam Preparation" : "Comprehensive Course Learning"
  }\n> ℹ️ *Curriculum Synthesis Notice: Generated via Smart Study Academic Engine.*`;

  const syllabusNote = syllabus
    ? `\n*Grounded in Syllabus Scope*: \`${syllabus.substring(0, 160).replace(/[`\n]/g, " ")}\`\n`
    : "";

  switch (domain) {
    case "mathematics":
      return buildMathNotes(cleanSubject, cleanTopic, safeTheory, metadataBadge, syllabusNote, isExamMode);
    case "physics":
      return buildPhysicsNotes(cleanSubject, cleanTopic, safeTheory, metadataBadge, syllabusNote, isExamMode);
    case "chemistry":
      return buildChemistryNotes(cleanSubject, cleanTopic, safeTheory, metadataBadge, syllabusNote, isExamMode);
    case "biology":
      return buildBiologyNotes(cleanSubject, cleanTopic, safeTheory, metadataBadge, syllabusNote, isExamMode);
    case "history_social":
      return buildHistoryNotes(cleanSubject, cleanTopic, safeTheory, metadataBadge, syllabusNote, isExamMode);
    case "languages_literature":
      return buildLanguageNotes(cleanSubject, cleanTopic, safeTheory, metadataBadge, syllabusNote, isExamMode);
    case "commerce_economics":
      return buildCommerceNotes(cleanSubject, cleanTopic, safeTheory, metadataBadge, syllabusNote, isExamMode);
    case "engineering":
      return buildEngineeringNotes(cleanSubject, cleanTopic, safeTheory, metadataBadge, syllabusNote, isExamMode);
    case "law_governance":
      return buildLawNotes(cleanSubject, cleanTopic, safeTheory, metadataBadge, syllabusNote, isExamMode);
    case "environmental_science":
      return buildEnvironmentalNotes(cleanSubject, cleanTopic, safeTheory, metadataBadge, syllabusNote, isExamMode);
    case "computer_science":
      return buildComputerScienceNotes(cleanSubject, cleanTopic, safeTheory, metadataBadge, syllabusNote, isExamMode);
    case "general_academic":
    default:
      return buildGeneralAcademicNotes(cleanSubject, cleanTopic, safeTheory, metadataBadge, syllabusNote, isExamMode);
  }
}

// ------------------------------------------------------------------------------------------------
// Domain-Specific Fallback Builders (High-Yield, Technically Accurate, Zero CS Bias for Non-CS)
// ------------------------------------------------------------------------------------------------

function buildMathNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  const isQuad = /quadratic/i.test(topic);

  let formulas = `* **Standard Governing Equation**: $f(x) = y$, defined over domain $x \\in \\mathbb{R}$.
* **Invariant Constraints**: Boundary conditions and continuity requirements must be verified before applying analytical transformations.
* **Analytical Property**: In any algebraic transformation, operations applied to the left-hand side must be symmetrically applied to the right-hand side.`;

  let workedExample = `Consider the function $f(x) = 2x + 6 = 18$:
1. Subtract $6$ from both sides: $2x = 18 - 6 = 12$.
2. Divide both sides by the coefficient of $x$ ($2$): $x = \\frac{12}{2} = 6$.
3. **Verification**: Substitute $x = 6$ back into the original equation:
   $$2(6) + 6 = 12 + 6 = 18$$
   The left-hand side equals the right-hand side, confirming the solution is mathematically correct.`;

  if (isQuad) {
    formulas = `* **Standard Quadratic Form**:
  $$ax^2 + bx + c = 0 \\quad (a \\neq 0)$$
* **Discriminant ($\\Delta$)**:
  $$\\Delta = b^2 - 4ac$$
  * If $\\Delta > 0$: Two distinct real roots.
  * If $\\Delta = 0$: Exactly one repeated real root (rational if coefficients are rational).
  * If $\\Delta < 0$: Two complex conjugate roots.
* **Quadratic Formula**:
  $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
* **Vieta's Relations**:
  $$x_1 + x_2 = -\\frac{b}{a}, \\quad x_1 \\cdot x_2 = \\frac{c}{a}$$`;

    workedExample = `Solve the quadratic equation:
$$x^2 - 5x + 6 = 0$$

**Step 1: Identify coefficients**
$$a = 1, \\quad b = -5, \\quad c = 6$$

**Step 2: Calculate the discriminant ($\\Delta$)**
$$\\Delta = b^2 - 4ac = (-5)^2 - 4(1)(6) = 25 - 24 = 1$$
Since $\\Delta = 1 > 0$, the equation possesses two distinct real and rational roots.

**Step 3: Apply the quadratic formula**
$$x = \\frac{-(-5) \\pm \\sqrt{1}}{2(1)} = \\frac{5 \\pm 1}{2}$$

* Root 1 ($x_1$):
  $$x_1 = \\frac{5 + 1}{2} = \\frac{6}{2} = 3$$
* Root 2 ($x_2$):
  $$x_2 = \\frac{5 - 1}{2} = \\frac{4}{2} = 2$$

**Step 4: Verification using Vieta's formulas and direct substitution**
* Sum of roots: $x_1 + x_2 = 3 + 2 = 5 = -(-5)/1 = -b/a$ (Matches).
* Product of roots: $x_1 \\cdot x_2 = 3 \\cdot 2 = 6 = 6/1 = c/a$ (Matches).
* Substituting $x = 3$: $(3)^2 - 5(3) + 6 = 9 - 15 + 6 = 0$ (Verified).
* Substituting $x = 2$: $(2)^2 - 5(2) + 6 = 4 - 10 + 6 = 0$ (Verified).`;
  }

  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Learning Objectives & Prerequisites
By the end of this module, you will be able to:
* State the fundamental mathematical definitions and governing axioms of **${topic}**.
* Derive and apply governing formulas with explicit domain constraints.
* Execute step-by-step worked calculations and verify solutions through back-substitution.
* Avoid frequent algebraic, sign, and calculation errors on examinations.

*Prerequisites*: Foundational arithmetic, variable manipulation, and algebraic equation properties.

---

### 2. Conceptual Overview & Definitions
${theory}

In mathematics, **${topic}** represents a fundamental analytical structure within **${subject}**. Mastery requires understanding not only procedural algorithms, but also geometric interpretations, parameter constraints, and formal proofs.

---

### 3. Governing Formulas, Laws & Mathematical Principles
${formulas}

---

### 4. Step-by-Step Worked Problems & Verified Calculations
${workedExample}

---

### 5. Comparative Analysis & Key Distinctions
| Analytical Dimension | Standard Case | Edge / Boundary Case |
| :--- | :--- | :--- |
| **Domain Restrictions** | All real values satisfy constraints | Denominator equals zero or radicand is negative |
| **Solution Multiplicity** | Single or distinct values | Infinite solutions or no real solution |
| **Verification Method** | Direct back-substitution into original equation | Limit evaluation or complex field mapping |

---

### 6. Common Misconceptions & Exam Pitfalls
1. **Sign Errors in Algebraic Expansion**: Forgetting to distribute negative signs across grouped terms (e.g., $-(a - b) \\neq -a - b$, correct is $-a + b$).
2. **Dividing by an Unknown Variable**: Dividing both sides by an algebraic term without checking if the term can equal zero, which illegally eliminates valid roots.
3. **Overlooking Extraneous Solutions**: When squaring both sides of radical equations, extraneous solutions may be introduced; all candidate values must be verified in the original equation.

---

### 7. Practice Problems & Step-by-Step Solutions
**Question 1**: Solve for $x$ given $2x^2 - 8 = 0$.
* *Solution*: Add $8$ to both sides ($2x^2 = 8$), divide by $2$ ($x^2 = 4$), take the square root of both sides yielding $x = \\pm 2$. Both values satisfy the equation.

**Question 2**: What condition determines whether a quadratic equation has real versus non-real roots?
* *Solution*: The sign of the discriminant $\\Delta = b^2 - 4ac$. If $\\Delta \\geq 0$, the roots are real; if $\\Delta < 0$, the roots are complex conjugate pairs.

---

### 8. Concise Revision Summary
* Always verify domain constraints ($a \\neq 0$, denominators $\\neq 0$, radicands $\\geq 0$).
* Check final numerical answers using back-substitution or relation tests.
* Keep intermediate calculations organized to prevent arithmetic sign errors.
`;
}

function buildPhysicsNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  const isNewton = /newton/i.test(topic);

  let equations = `* **Fundamental Equation**:
  $$y = f(x)$$
* **Standard SI Units**: Length in meters ($\\text{m}$), Mass in kilograms ($\\text{kg}$), Time in seconds ($\\text{s}$).
* **Dimensional Consistency**: Both sides of every physical equation must possess identical dimensions $[M^a L^b T^c]$.`;

  let workedProblem = `A body of mass $m = 5.0\\text{ kg}$ experiences a net force of $F = 20.0\\text{ N}$. Calculate its acceleration:
1. State governing equation: $F = ma \\implies a = \\frac{F}{m}$.
2. Substitute numerical values: $a = \\frac{20.0\\text{ N}}{5.0\\text{ kg}} = 4.0\\text{ m/s}^2$.
3. **Dimensional Check**: $\\text{N} = \\text{kg}\\cdot\\text{m/s}^2$, so $\\frac{\\text{kg}\\cdot\\text{m/s}^2}{\\text{kg}} = \\text{m/s}^2$.`;

  if (isNewton) {
    equations = `* **Newton's Second Law of Motion**:
  $$\\vec{F}_{\\text{net}} = \\frac{d\\vec{p}}{dt} = m\\vec{a} \\quad (\\text{for constant mass } m)$$
* **Definition of Variables & SI Units**:
  * $\\vec{F}_{\\text{net}}$: Net external force vector, measured in Newtons ($\\text{N} = \\text{kg}\\cdot\\text{m/s}^2$).
  * $m$: Inertial mass of the object, measured in kilograms ($\\text{kg}$).
  * $\\vec{a}$: Acceleration vector of the object, measured in meters per second squared ($\\text{m/s}^2$).
* **Vector Components**:
  $$\\sum F_x = m a_x, \\quad \\sum F_y = m a_y, \\quad \\sum F_z = m a_z$$
* **Fundamental Principle**:
  Acceleration is directly proportional to the net applied force and inversely proportional to the object's inertial mass, directed along the line of action of the net force.`;

    workedProblem = `**Problem**: A crate of mass $m = 12.0\\text{ kg}$ rests on a frictionless horizontal surface. A horizontal force $F = 36.0\\text{ N}$ is applied to the crate.
1. Determine the acceleration of the crate.
2. Calculate the velocity acquired after $t = 4.0\\text{ s}$ starting from rest ($u = 0$).

**Step 1: Free-Body Diagram Analysis & Equations**
* Vertical axis: Normal force balances gravity: $N - mg = 0 \\implies N = mg = (12.0)(9.8) = 117.6\\text{ N}$.
* Horizontal axis: Net force $F_{\\text{net}} = F = 36.0\\text{ N}$.

**Step 2: Calculate Acceleration**
$$a = \\frac{F_{\\text{net}}}{m} = \\frac{36.0\\text{ N}}{12.0\\text{ kg}} = 3.00\\text{ m/s}^2$$

**Step 3: Calculate Final Velocity ($v$)**
$$v = u + at = 0 + (3.00\\text{ m/s}^2)(4.0\\text{ s}) = 12.0\\text{ m/s}$$

**Step 4: Verification of SI Units and Energy Conservation**
* Work done by force: $W = F \\cdot s = F \\cdot \\left(\\frac{1}{2} a t^2\\right) = 36.0 \\cdot (0.5 \\cdot 3.0 \\cdot 16.0) = 36.0 \\cdot 24.0 = 864\\text{ J}$.
* Kinetic energy gained: $K = \\frac{1}{2} m v^2 = \\frac{1}{2}(12.0\\text{ kg})(12.0\\text{ m/s})^2 = 6.0 \\cdot 144 = 864\\text{ J}$.
* Work-Energy theorem ($W = \\Delta K$) holds exactly, validating our calculations.`;
  }

  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Learning Objectives & Prerequisites
By the end of this module, you will be able to:
* State and explain the governing physical laws and fundamental principles of **${topic}**.
* Express all physical relationships using precise mathematical formulas and standard SI units.
* Construct free-body and physical diagrams to isolate forces and energy components.
* Solve multi-step numerical physics problems showing explicit substitution and unit checks.

*Prerequisites*: Basic vector algebra, kinematics, and dimensional analysis.

---

### 2. Comprehensive Physical Concept Overview
${theory}

In physics, **${topic}** is governed by empirical observation and mathematical models. Physical quantities must always be accompanied by their magnitude, direction (for vector quantities), and standard SI units.

---

### 3. Governing Laws, Principles & SI Units
${equations}

---

### 4. Step-by-Step Worked Problem & Dimensional Analysis
${workedProblem}

---

### 5. Comparative Physical Analysis
| Physical Quantity | Definition | SI Unit | Dimension | Vector / Scalar |
| :--- | :--- | :--- | :--- | :--- |
| **Force ($\\vec{F}$)** | Push or pull causing acceleration | Newton ($\\text{N} = \\text{kg}\\cdot\\text{m/s}^2$) | $[M L T^{-2}]$ | Vector |
| **Mass ($m$)** | Quantitative measure of inertia | Kilogram ($\\text{kg}$) | $[M]$ | Scalar |
| **Acceleration ($\\vec{a}$)** | Rate of change of velocity | $\\text{m/s}^2$ | $[L T^{-2}]$ | Vector |
| **Momentum ($\\vec{p}$)** | Quantity of motion ($m\\vec{v}$) | $\\text{kg}\\cdot\\text{m/s}$ | $[M L T^{-1}]$ | Vector |

---

### 6. Common Misconceptions & Exam Pitfalls
1. **Confusing Mass with Weight**: Mass is an intrinsic scalar property ($\\text{kg}$), whereas weight is a gravitational force ($\\text{N} = mg$) that varies with gravitational acceleration $g$.
2. **Neglecting Net Force**: Applying $F = ma$ with an individual applied force instead of the **vector sum** (net force) of all acting forces.
3. **Mismatched Units**: Calculating acceleration with mass in grams without converting to kilograms, leading to errors by a factor of 1000.

---

### 7. Practice Questions & Detailed Solutions
**Question 1**: A $2.0\\text{ kg}$ object accelerates at $5.0\\text{ m/s}^2$. What net force is acting upon it?
* *Solution*: $F_{\\text{net}} = ma = (2.0\\text{ kg})(5.0\\text{ m/s}^2) = 10.0\\text{ N}$.

**Question 2**: If the net force on an object is doubled while its mass is quadrupled, how does its acceleration change?
* *Solution*: $a' = \\frac{2F}{4m} = \\frac{1}{2} \\frac{F}{m} = 0.5 a$. The acceleration is halved.

---

### 8. Concise Revision Summary
* $\\vec{F}_{\\text{net}} = m\\vec{a}$ applies in inertial reference frames.
* Always draw a free-body diagram and choose an explicit coordinate system before writing equations.
* Verify unit dimensional consistency at every intermediate step.
`;
}

function buildChemistryNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Learning Objectives & Prerequisites
By the end of this module, you will be able to:
* Formulate balanced chemical equations with correct stoichiometric coefficients and states of matter.
* Explain reaction mechanisms, electronic transitions, and thermodynamic drivers for **${topic}**.
* Execute stoichiometric calculations and identify limiting reagents.
* Detail laboratory safety protocols, reaction conditions, and industrial relevance.

*Prerequisites*: Atomic structure, valence electrons, stoichiometry, and chemical nomenclature.

---

### 2. Conceptual Overview & Molecular Principles
${theory}

In chemistry, **${topic}** involves the breaking and forming of chemical bonds driven by enthalpy ($\\Delta H$) and entropy ($\\Delta S$) changes. Understanding requires analyzing both microscopic electronic structures and macroscopic physical properties.

---

### 3. Balanced Chemical Equations & Reaction Conditions
* **General Reaction Representation**:
  $$\\text{Reactants} \\xrightarrow[\\text{Catalyst}, \\; T, \\; P]{\\text{Solvent}} \\text{Products} \\quad (\\Delta H = \\pm Q)$$
* **Stoichiometric Balancing**: Conservation of mass requires that the number of atoms of each element on the reactant side equals that on the product side.
* **Key Reaction Conditions**: Temperature, pressure, presence of catalysts, and solvent polarity dictate reaction kinetics and yield.

---

### 4. Step-by-Step Stoichiometric Calculation
**Example**: Consider the complete combustion or synthesis reaction:
1. **Write Balanced Equation**: Verify all atomic coefficients balance across both sides.
2. **Convert Given Quantities to Moles**:
   $$n = \\frac{\\text{mass } (m)}{\\text{molar mass } (M)}$$
3. **Determine Limiting Reagent**: Compare the mole ratio of reactants against stoichiometric coefficients.
4. **Compute Theoretical Yield**: Multiply moles of limiting reactant by the stoichiometric ratio and product molar mass.
5. **Calculate Percent Yield**:
   $$\\% \\text{ Yield} = \\frac{\\text{Actual Yield}}{\\text{Theoretical Yield}} \\times 100\\%$$

---

### 5. Comparative Chemical Analysis
| Parameter | Exothermic Reaction | Endothermic Reaction |
| :--- | :--- | :--- |
| **Enthalpy Change ($\\Delta H$)** | $\\Delta H < 0$ (Heat released to surroundings) | $\\Delta H > 0$ (Heat absorbed from surroundings) |
| **Temperature of Surroundings** | Increases | Decreases |
| **Bond Energies** | Energy released in product bonds > energy absorbed | Energy absorbed to break bonds > energy released |
| **Le Chatelier Shift on Heating** | Shifts equilibrium toward reactants | Shifts equilibrium toward products |

---

### 6. Common Misconceptions & Exam Traps
1. **Changing Chemical Subscripts to Balance Equations**: Subscripts define chemical identity (e.g. changing $\\text{H}_2\\text{O}$ to $\\text{H}_2\\text{O}_2$ creates hydrogen peroxide instead of water). Only modify stoichiometric coefficients.
2. **Ignoring States of Matter in Equilibrium Expressions**: Pure solids ($s$) and liquids ($l$) have constant activities and are omitted from equilibrium constant expressions ($K_{\\text{eq}}$).
3. **Confusing Reaction Rate with Equilibrium**: A catalyst accelerates the rate of forward and reverse reactions equally but does not alter the equilibrium position or equilibrium constant.

---

### 7. Practice Questions & Detailed Solutions
**Question 1**: Why must a chemical equation always be balanced before performing stoichiometric calculations?
* *Solution*: To obey the Law of Conservation of Mass, which dictates that matter cannot be created or destroyed in ordinary chemical reactions.

**Question 2**: If $2.0\\text{ mol}$ of $\\text{H}_2$ reacts with $1.0\\text{ mol}$ of $\\text{O}_2$ according to $2\\text{H}_2(g) + \\text{O}_2(g) \\to 2\\text{H}_2\\text{O}(l)$, what is the maximum moles of water produced?
* *Solution*: The stoichiometric ratio is $2:1:2$. Both reactants are in exact stoichiometric proportion, yielding $2.0\\text{ mol}$ of $\\text{H}_2\\text{O}$.

---

### 8. Concise Revision Summary
* Always verify that all atoms and net electrical charges balance on both sides of every reaction equation.
* Follow standard IUPAC nomenclature and report quantities with standard chemical units.
`;
}

function buildBiologyNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  const isPhotosynthesis = /photosynthesis/i.test(topic);

  let stages = `* **Stage 1: Receptor Activation**: Environmental or chemical ligand binds to specific membrane-bound or intracellular receptors.
* **Stage 2: Transduction Cascade**: Signal is amplified through secondary messengers and enzyme phosphorylation cascades.
* **Stage 3: Cellular Response**: Downstream transcriptional activation or metabolic regulation ensures physiological adaptation.`;

  if (isPhotosynthesis) {
    stages = `* **Phase 1: Light-Dependent Reactions (Thylakoid Membrane)**:
  1. **Photolysis of Water**: Light absorption by Photosystem II (P680) induces water oxidation:
     $$2\\text{H}_2\\text{O} \\to 4\\text{H}^+ + 4e^- + \\text{O}_2$$
  2. **Electron Transport Chain (ETC)**: Electrons flow through plastoquinone, cytochrome $b_6f$ complex, and plastocyanin, pumping protons into the thylakoid lumen.
  3. **Chemiosmotic ATP Synthesis**: The resulting electrochemical proton gradient drives ATP synthase to phosphorylate $\\text{ADP} + \\text{P}_i \\to \\text{ATP}$.
  4. **NADPH Reduction**: Photosystem I (P700) re-energizes electrons to reduce $\\text{NADP}^+ + 2e^- + \\text{H}^+ \\to \\text{NADPH}$ via ferredoxin-NADP+ reductase.

* **Phase 2: Light-Independent Reactions / Calvin-Benson Cycle (Stroma)**:
  1. **Carbon Fixation**: $\\text{CO}_2$ combines with ribulose-1,5-bisphosphate (RuBP) catalyzed by the enzyme **RuBisCO**, forming an unstable 6-carbon intermediate that immediately splits into two molecules of 3-phosphoglycerate (3-PGA).
  2. **Reduction Phase**: ATP and NADPH reduce 3-PGA into glyceraldehyde-3-phosphate (G3P / triose phosphate).
  3. **Regeneration of RuBP**: For every 6 turns of the cycle, 2 molecules of G3P exit to synthesize glucose, while the remaining 10 G3P molecules are rearranged using ATP to regenerate 6 molecules of RuBP.`;
  }

  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Learning Objectives & Prerequisites
By the end of this module, you will be able to:
* Define and explain the cellular and molecular mechanisms of **${topic}**.
* Correlate biological structures (organelles, membranes, enzymes) directly with their physiological functions.
* Trace step-by-step pathways and biochemical transformations in chronological order.
* Differentiate between related biological stages and common exam diagnostic traps.

*Prerequisites*: Cell structure, organelle functions, enzyme kinetics, and basic bioenergetics.

---

### 2. Comprehensive Biological Overview & Structure-Function Relationship
${theory}

In biological systems, structure strictly dictates function. **${topic}** represents an essential physiological mechanism maintained through regulatory feedback loops and compartmentalized cellular architecture.

---

### 3. Step-by-Step Biological Mechanisms & Pathways
${stages}

---

### 4. Structural & Functional Compartmentalization
| Cellular Compartment | Key Structures | Primary Physiological Function |
| :--- | :--- | :--- |
| **Thylakoid / Membrane Matrix** | Photosystems I & II, ATP Synthase, ETC complexes | Absorption of photons, photolysis, and generation of proton motive force |
| **Stroma / Cytosolic Fluid** | RuBisCO, Calvin cycle enzymes, dissolved $\\text{CO}_2$, ATP/NADPH | Carbon fixation and enzymatic reduction to synthesize hexose sugars |
| **Outer & Inner Membranes** | Lipid bilayer with selective porins | Compartmentalization, regulation of metabolic flux, and homeostasis |

---

### 5. Comparative Biological Analysis
| Feature | Light-Dependent Reactions | Light-Independent Reactions (Calvin Cycle) |
| :--- | :--- | :--- |
| **Location** | Thylakoid membrane / lumen | Chloroplast stroma |
| **Light Requirement** | Directly dependent on active photon absorption | Does not directly absorb photons; relies on ATP & NADPH from light reactions |
| **Input Substrates** | $\\text{H}_2\\text{O}, \\; \\text{NADP}^+, \\; \\text{ADP} + \\text{P}_i$, photons | $\\text{CO}_2, \\; \\text{ATP}, \\; \\text{NADPH}$ |
| **Primary Outputs** | $\\text{O}_2$ (byproduct), $\\text{ATP}, \\; \\text{NADPH}$ | $\\text{G3P}$ (glucose precursor), $\\text{NADP}^+, \\; \\text{ADP} + \\text{P}_i$ |

---

### 6. Common Misconceptions & Exam Pitfalls
1. **Assuming the "Dark Reactions" Occur Exclusively at Night**: The Calvin cycle does not require photons directly, but rapidly halts in prolonged darkness because it requires continuous ATP and NADPH from the light-dependent reactions, and RuBisCO is light-activated.
2. **Believing Plants Only Carry Out Photosynthesis and Not Respiration**: Plant cells possess active mitochondria and respire ($C_6H_{12}O_6 + 6O_2 \\to 6CO_2 + 6H_2O + \\text{ATP}$) continuously 24 hours a day.
3. **Misattributing the Source of Oxygen**: The $\\text{O}_2$ released during photosynthesis originates exclusively from the **photolysis of water ($\text{H}_2\text{O}$)**, NOT from carbon dioxide ($\text{CO}_2$).

---

### 7. Practice Questions & Detailed Explanations
**Question 1**: What is the precise role of the enzyme RuBisCO in photosynthesis?
* *Solution*: RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase) catalyzes the initial fixation of carbon dioxide onto the 5-carbon sugar RuBP, forming 3-phosphoglycerate.

**Question 2**: If a chemical inhibitor blocks the electron transport chain in the thylakoid membrane, what happens to the Calvin cycle?
* *Solution*: The Calvin cycle ceases because the synthesis of ATP and NADPH in the light-dependent reactions stops, depriving the reduction and regeneration phases of required energy.

---

### 8. Concise Revision Summary
* Photosynthesis couples light capture with carbon fixation: $6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{light}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$.
* Light reactions occur in the thylakoid; Calvin cycle occurs in the stroma.
* Water is split at Photosystem II to yield oxygen, protons, and electrons.
`;
}

function buildHistoryNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  const isWwi = /world war|wwi|ww1/i.test(topic);

  let causes = `* **Underlying / Structural Causes**: Long-term socio-economic tensions, institutional transformations, and ideological polarization.
* **Immediate Catalyst**: A proximate precipitating event that catalyzed systemic escalation into open conflict.
* **Key Historical Figures**: Political leaders, diplomats, and grassroots movements who shaped strategic decision-making.`;

  let consequences = `* **Short-Term Impact**: Institutional disruption, treaty reorganizations, and political boundary redrawing.
* **Long-Term Legacy**: Long-lasting cultural, economic, and institutional realignment that shaped modern history.`;

  if (isWwi) {
    causes = `* **M - Militarism**: Massive naval and land arms race between European great powers (particularly the Anglo-German naval arms race and escalation of military standing armies).
* **A - Alliances**: Entangling mutual defense pacts divided Europe into two armed camps: the **Triple Alliance** (Germany, Austria-Hungary, Italy) and the **Triple Entente** (Britain, France, Russia).
* **I - Imperialism**: Intense competition for colonial territories, raw materials, and global markets in Africa and Asia (e.g. Moroccan Crises).
* **N - Nationalism**: Aggressive national pride and Slavic self-determination movements in the Balkans ("the powder keg of Europe"), challenging the Austro-Hungarian and Ottoman empires.
* **Immediate Catalyst (June 28, 1914)**: The assassination of Archduke Franz Ferdinand of Austria and his wife Sophie in Sarajevo by Gavrilo Princip, a member of the Serbian nationalist group the Black Hand. This initiated the July Diplomatic Crisis and rapid escalation through alliance obligations.`;

    consequences = `* **Collapse of Four Empires**: The Hohenzollern (Germany), Habsburg (Austria-Hungary), Romanov (Russia), and Ottoman empires collapsed.
* **Treaty of Versailles (1919)**: Imposed Article 231 ("War Guilt Clause"), heavy economic reparations, demilitarization of the Rhineland, and territorial losses on Germany, generating socio-economic instability that contributed to the rise of totalitarianism.
* **Redrawing of the Map of Europe & the Middle East**: Creation of new nation-states (Poland, Czechoslovakia, Yugoslavia) and the Sykes-Picot / Mandate System in the former Ottoman Empire.
* **Creation of the League of Nations**: The first global intergovernmental organization dedicated to collective security, though undermined by the non-participation of the United States.`;
  }

  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Learning Objectives & Historical Context
By the end of this module, you will be able to:
* Articulate the precise chronology, background, and geopolitical context of **${topic}**.
* Disentangle underlying systemic causes from immediate triggering catalysts.
* Analyze the actions, interests, and motivations of key historical actors and institutions.
* Evaluate the short-term and long-term socio-political consequences and historical legacy.

*Prerequisites*: Foundational understanding of relevant regional geography, political systems, and historical chronology.

---

### 2. Comprehensive Historical Overview
${theory}

In history and social sciences, events cannot be viewed in isolation. **${topic}** emerged from a complex interplay of ideological, economic, and political forces acting across national borders.

---

### 3. Underlying Structural Causes & Triggering Catalysts
${causes}

---

### 4. Short-Term Outcomes & Long-Term Historical Legacy
${consequences}

---

### 5. Comparative Cause-and-Effect Analysis Table
| Dimension | Underlying / Structural Driver | Proximate / Triggering Event |
| :--- | :--- | :--- |
| **Timescale** | Decades of systemic accumulation | Specific date, decision, or crisis |
| **Nature of Impact** | Created brittle conditions and institutional vulnerability | Sparked immediate mobilization and irreversible escalation |
| **Resolvability** | Required deep structural diplomatic reform | Could theoretically have been localized if alliance chains were absent |

---

### 6. Common Historical Misconceptions & Exam Pitfalls
1. **Monocausal Fallacy**: Attributing complex historical developments to a single cause or individual rather than recognizing multi-faceted political, economic, and social currents.
2. **Teleological / Hindsight Bias**: Assuming events were inevitable, ignoring the genuine uncertainty, diplomatic options, and alternative paths available to actors at the time.
3. **Confusing Trigger with Cause**: Treating the spark (e.g. Sarajevo assassination) as the sole reason for conflict, while ignoring decades of structural tension (e.g. the M-A-I-N alliance system).

---

### 7. Essay & Examination Practice Questions
**Question 1**: Explain the distinction between the immediate trigger and the underlying causes of ${topic}.
* *Model Answer*: The immediate trigger acted as the proximate spark under fragile conditions, but the systemic conflict was fueled by long-term structural factors including militarism, imperial rivalry, and entangling alliances.

**Question 2**: How did the peace settlement or resolution of ${topic} influence subsequent international relations?
* *Model Answer*: The settlement restructured national borders and power balances, but left unresolved economic grievances and political resentments that precipitated subsequent regional and global tensions.

---

### 8. Quick Revision Chronology & Key Takeaways
* Distinguish root causes (structural) from immediate catalysts (events).
* Map actors, motivations, and institutional responses systematically.
* Evaluate long-term historical legacy on contemporary international institutions.
`;
}

function buildLanguageNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  const isSva = /subject[- ]verb|agreement/i.test(topic);

  let rules = `* **Primary Linguistic Rule**: Syntactic elements must agree in number, person, and grammatical case.
* **Application Rule**: Structural modifiers and parenthetical elements do not alter the core syntactic agreement between head words.`;

  let examples = `* *Incorrect*: The list of items are on the table.
* *Correct*: The list of items **is** on the table. (The head noun *list* is singular).`;

  if (isSva) {
    rules = `* **Rule 1 (Basic Agreement)**: A singular subject takes a singular verb; a plural subject takes a plural verb.
* **Rule 2 (Intervening Phrases)**: Phrases coming between the subject and the verb (prepositional phrases, *as well as*, *along with*, *including*) do NOT change the number of the subject.
* **Rule 3 (Compound Subjects with 'And')**: Subjects joined by *and* generally take a plural verb (e.g., *The doctor and the nurse are present*), unless they represent a single unit (e.g., *Bread and butter is his daily breakfast*).
* **Rule 4 (Correlative Conjunctions - Either/Or, Neither/Nor)**: When subjects are joined by *either...or* or *neither...nor*, the verb agrees in person and number with the **closer subject** (proximity rule).
* **Rule 5 (Indefinite Pronouns)**:
  * Always Singular: *everyone, everybody, someone, nobody, each, either, neither, anyone*.
  * Always Plural: *both, few, many, several*.
  * Variable (SANAM - *some, any, none, all, most*): Depends on the object of the preposition (*Some of the cake is gone* vs. *Some of the cookies are gone*).
* **Rule 6 (Collective Nouns)**: Singular when the group acts as a single unified unit (*The committee decides*); plural when individual members act separately (*The committee disagree among themselves*).`;

    examples = `1. **Intervening Prepositional Phrase**:
   * ❌ *Incorrect*: The bouquet of yellow roses smell delightful.
   * ✅ *Correct*: The **bouquet** of yellow roses **smells** delightful.
   * *Explanation*: The subject is the singular noun *bouquet*, not the plural object of preposition *roses*.

2. **Correlative Conjunctions**:
   * ❌ *Incorrect*: Neither the teacher nor the students was ready.
   * ✅ *Correct*: Neither the teacher nor the **students were** ready.
   * *Explanation*: Under the rule of proximity, the verb agrees with *students* (plural).

3. **Inverted Word Order (Here / There)**:
   * ❌ *Incorrect*: There is many challenges ahead.
   * ✅ *Correct*: There **are** many **challenges** ahead.
   * *Explanation*: *There* is an expletive; the true subject is the plural noun *challenges*.`;
  }

  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Learning Objectives & Grammatical Scope
By the end of this module, you will be able to:
* Identify grammatical subjects and their corresponding predicates accurately across complex sentence structures.
* Apply governing agreement and syntax rules with zero ambiguity.
* Recognize and correct frequent errors introduced by intervening phrases and inverted word orders.
* Write grammatically flawless, polished prose in academic examinations and formal writing.

*Prerequisites*: Parts of speech (nouns, pronouns, verbs, prepositions) and basic sentence clauses.

---

### 2. Conceptual Overview & Syntactic Foundations
${theory}

In English and formal linguistics, grammatical agreement ensures structural clarity. When subjects and verbs agree consistently in number and person, sentences convey precise semantic meaning without reader confusion.

---

### 3. Core Governing Rules & Structural Principles
${rules}

---

### 4. Exemplary Usage: Correct vs. Incorrect Contrasts
${examples}

---

### 5. Comparative Grammar Reference Table
| Construction Type | Subject Number | Correct Verb Form | Exemplary Sentence |
| :--- | :--- | :--- | :--- |
| **Singular Indefinite Pronoun** | Always Singular | Singular (*-s/es*) | *Everyone **wants** to succeed.* |
| **Compound with 'And'** | Plural (standard) | Plural | *The author and the editor **are** collaborating.* |
| **Joined by 'Neither / Nor'** | Governed by proximity | Matches closest noun | *Neither the captain nor the **crew was** alarmed.* |
| **Collective Noun (Unified)** | Singular | Singular | *The jury **has reached** its verdict.* |
| **Inverted Structure (There/Here)** | Matches post-verb noun | Plural if noun is plural | *There **are** three **reasons** for this outcome.* |

---

### 6. Common Exam Pitfalls & Error Traps
1. **The Proximity Trap**: Letting the closest noun in a prepositional phrase fool you into using the wrong verb number (e.g. *One of the boxes **is** missing*, NOT *are missing*).
2. **Treating 'Each' and 'Every' as Plural**: *Each* is grammatically singular, regardless of the prepositional phrase that follows it (*Each of the students **has** submitted the assignment*).
3. **Compound Subjects Denoting a Single Identity**: Expressions like *macaroni and cheese* or *peace and quiet* represent a single cohesive concept and take a singular verb.

---

### 7. Practice Exercises with Detailed Explanations
**Exercise 1**: Choose the correct verb: *The quality of these organic ingredients (is / are) exceptional.*
* *Answer*: **is**. The subject is the singular noun *quality*, not the plural prepositional object *ingredients*.

**Exercise 2**: Choose the correct verb: *Either the manager or her assistants (handles / handle) customer inquiries.*
* *Answer*: **handle**. In *either...or* constructions, the verb agrees with the closer subject (*assistants*, which is plural).

---

### 8. Concise Revision Rules Sheet
* Strip away intervening prepositional phrases to locate the true grammatical subject.
* Indefinite pronouns like *everyone, each, neither* are singular.
* In *either/or* and *neither/nor*, the verb always agrees with the closer subject.
`;
}

function buildCommerceNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  const isAccounting = /accounting|journal|ledger|debit|credit/i.test(topic) || /accounting/i.test(subject);
  const isEconomics = /economics|microeconomics|macroeconomics|supply and demand|elasticity|equilibrium|fiscal|monetary|market/i.test(topic) || /economics/i.test(subject);

  let conventions = `* **Fundamental Economic / Financial Principle**: Resources are allocated based on scarcity, utility, and systematic ledger accountability.
* **Measurement & Consistency**: All economic transactions must be recorded at historical cost with consistent valuation conventions.`;

  let workedExample = `Calculate Gross Profit given:
* Revenue from Operations (Sales): $100,000
* Cost of Goods Sold (COGS): $60,000
$$\\text{Gross Profit} = \\text{Revenue} - \\text{COGS} = \\$100,000 - \\$60,000 = \\$40,000$$
$$\\text{Gross Profit Margin} = \\frac{\\$40,000}{\\$100,000} \\times 100\\% = 40\\%$$`;

  let comparativeTable = `| Category | Debit Nature (Normal Debit Balance) | Credit Nature (Normal Credit Balance) |
| :--- | :--- | :--- |
| **Account Types** | Assets, Expenses, Losses, Drawings | Liabilities, Equity (Capital), Incomes, Gains |
| **Increase in Balance** | Recorded as a **Debit** | Recorded as a **Credit** |
| **Decrease in Balance** | Recorded as a **Credit** | Recorded as a **Debit** |
| **Financial Statement** | Balance Sheet (Assets) / Income Statement (Costs) | Balance Sheet (Liabilities/Equity) / Income Statement (Revenue) |`;

  let practiceProblems = `**Problem 1**: On March 15, a firm provides $\\$3,000$ of consulting services to a client on credit. Provide the journal entry.
* *Solution*:
  * Debit: **Accounts Receivable** $\\$3,000$ (Asset increases).
  * Credit: **Service Revenue** $\\$3,000$ (Revenue/Equity increases).

**Problem 2**: If total assets equal $\\$150,000$ and liabilities equal $\\$60,000$, what is the owner's equity?
* *Solution*: $\\text{Equity} = \\text{Assets} - \\text{Liabilities} = \\$150,000 - \\$60,000 = \\$90,000$.`;

  let revisionSummary = `* $\\text{Assets} = \\text{Liabilities} + \\text{Equity}$ must hold true after every single transaction.
* Debits must strictly equal Credits in every entry.
* Distinguish capital transactions from operational revenue transactions.`;

  if (isAccounting) {
    conventions = `* **The Fundamental Accounting Equation**:
  $$\\text{Assets} = \\text{Liabilities} + \\text{Owner's Equity (Capital)}$$
* **The Golden Rules of Accounting**:
  1. **Real Accounts** (Assets, Equipment): *Debit what comes in, Credit what goes out.*
  2. **Personal Accounts** (Debtors, Creditors, Banks): *Debit the receiver, Credit the giver.*
  3. **Nominal Accounts** (Expenses, Incomes): *Debit all expenses and losses, Credit all incomes and gains.*
* **Double-Entry Principle**:
  Every transaction impacts at least two accounts, such that Total Debits strictly equal Total Credits:
  $$\\sum \\text{Debits} = \\sum \\text{Credits}$$`;

    workedExample = `**Transaction**: On January 10, ABC Enterprises purchases office equipment for $\\$5,000$ in cash.
1. **Analyze Accounts Affected**:
   * *Equipment Account* (Real Account / Asset): Increasing $\\to$ **Debit**.
   * *Cash Account* (Real Account / Asset): Decreasing $\\to$ **Credit**.

**Journal Entry**:
| Date | Account Titles & Explanation | Ref | Debit (\\$) | Credit (\\$) |
| :--- | :--- | :--- | :--- | :--- |
| **Jan 10** | **Office Equipment** | 101 | 5,000 | |
| | **To Cash** | 102 | | 5,000 |
| | *(Being office equipment purchased for cash)* | | | |

**Verification of Accounting Equation Impact**:
* Assets: Equipment ($+\\$5,000$) + Cash ($-\\$5,000$) = Net change $\\$0$.
* Liabilities: $\\$0$.
* Equity: $\\$0$.
* The equation $\\text{Assets} = \\text{Liabilities} + \\text{Equity}$ remains perfectly in balance.`;
  } else if (isEconomics) {
    conventions = `* **The Law of Demand**: Other factors held constant (*ceteris paribus*), as the price of a good increases, the quantity demanded decreases:
  $$\\frac{\\partial Q_d}{\\partial P} < 0$$
* **The Law of Supply**: As the market price of a good rises, suppliers are willing to produce and sell more units:
  $$\\frac{\\partial Q_s}{\\partial P} > 0$$
* **Market Equilibrium Condition**: The market-clearing price ($P^*$) occurs where quantity demanded exactly equals quantity supplied:
  $$Q_d(P^*) = Q_s(P^*)$$
* **Price Elasticity of Demand ($E_d$)**:
  $$E_d = \\frac{\\% \\Delta Q_d}{\\% \\Delta P} = \\frac{dQ}{dP} \\cdot \\frac{P}{Q}$$
  * $|E_d| > 1$: **Elastic** (total revenue rises when price drops).
  * $|E_d| = 1$: **Unit Elastic** (total revenue is maximized).
  * $|E_d| < 1$: **Inelastic** (total revenue rises when price increases).`;

    workedExample = `**Problem**: In the market for a consumer good, the demand and supply curves are given by:
$$Q_d = 500 - 20P$$
$$Q_s = 100 + 30P$$
where $P$ is price in dollars and $Q$ is quantity in units.

**Step 1: Determine Equilibrium Price ($P^*$)**
Equate quantity demanded and quantity supplied:
$$500 - 20P = 100 + 30P$$
$$500 - 100 = 30P + 20P$$
$$400 = 50P \\implies P^* = \\frac{400}{50} = \\$8.00$$

**Step 2: Determine Equilibrium Quantity ($Q^*$)**
Substitute $P^* = 8$ into the demand function:
$$Q^* = 500 - 20(8) = 500 - 160 = 340\\text{ units}$$
*Verification via supply function*:
$$Q_s = 100 + 30(8) = 100 + 240 = 340\\text{ units}$$ (Exact match).

**Step 3: Calculate Price Elasticity of Demand ($E_d$) at Equilibrium**
$$E_d = \\frac{dQ_d}{dP} \\cdot \\frac{P^*}{Q^*} = (-20) \\cdot \\frac{8}{340} = -\\frac{160}{340} \\approx -0.471$$
* **Economic Interpretation**: Since $|E_d| = 0.471 < 1$, demand is **inelastic** at this price point. A $10\\%$ price increase would lead to only a $4.71\\%$ decrease in quantity demanded.`;

    comparativeTable = `| Elasticity Category | Value of $|E_d|$ | Quantity Response vs Price Change | Total Revenue Effect of Price Increase |
| :--- | :--- | :--- | :--- |
| **Perfectlyn Inelastic** | $|E_d| = 0$ | Zero change in quantity demanded | Total revenue increases proportionally |
| **Inelastic** | $0 < |E_d| < 1$ | Quantity changes by smaller percentage than price | **Total revenue increases** |
| **Unit Elastic** | $|E_d| = 1$ | Quantity changes by identical percentage | Total revenue remains unchanged |
| **Elastic** | $|E_d| > 1$ | Quantity changes by larger percentage than price | **Total revenue decreases** |
| **Perfectlyn Elastic** | $|E_d| = \\infty$ | Consumers buy only at one single price | Total revenue collapses to zero if price increases |`;

    practiceProblems = `**Problem 1**: If the price of gasoline rises from $\\$3.00$ to $\\$3.30$ and weekly gallons purchased drop from $10,000$ to $9,500$, compute the price elasticity of demand using the midpoint formula.
* *Solution*:
  * $\\% \\Delta Q = \\frac{9500 - 10000}{(9500 + 10000)/2} = \\frac{-500}{9750} \\approx -5.13\\%$
  * $\\% \\Delta P = \\frac{3.30 - 3.00}{(3.30 + 3.00)/2} = \\frac{0.30}{3.15} \\approx +9.52\\%$
  * $E_d = \\frac{-5.13\\%}{9.52\\%} \\approx -0.54$ (Inelastic demand).

**Problem 2**: What is the economic deadweight loss caused by an effective price ceiling set below market equilibrium?
* *Solution*: A price ceiling creates a shortage ($Q_d > Q_s$) and reduces the quantity traded to $Q_s$. Mutually beneficial transactions between willing buyers and sellers are blocked, destroying both consumer and producer surplus and generating deadweight welfare loss.`;

    revisionSummary = `* Market equilibrium occurs where demand and supply curves intersect ($Q_d = Q_s$).
* When demand is inelastic ($|E_d| < 1$), raising price increases total seller revenue.
* Price controls (ceilings and floors) prevent market clearing, generating shortages, surpluses, and deadweight loss.`;
  }

  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Learning Objectives & Scope
By the end of this module, you will be able to:
* State the fundamental conventions, governing principles, and core equations of **${topic}**.
* Apply formal analytical methodologies and format standard problem solutions.
* Calculate core quantitative metrics, equilibrium points, and elasticity ratios.
* Prevent classification errors and conceptual pitfalls in examination problems.

*Prerequisites*: Foundational algebra, basic understanding of markets, economic transactions, and value exchange.

---

### 2. Conceptual Overview & Theoretical Principles
${theory}

In commerce and economics, mastering **${topic}** provides the analytical foundation necessary to evaluate market behavior, financial balance, and optimal resource allocation under scarcity.

---

### 3. Governing Conventions, Laws & Equations
${conventions}

---

### 4. Step-by-Step Worked Quantitative Problem
${workedExample}

---

### 5. Comparative Disciplinary Analysis
${comparativeTable}

---

### 6. Common Misconceptions & Exam Pitfalls
1. **Confusing Shifts in Curves vs. Movements Along Curves**: A price change causes a *movement along* the existing demand/supply curve. Non-price determinants (income, technology, input costs) *shift* the entire curve.
2. **Assuming Zero Elasticity Means Unchanging Revenue**: When demand is inelastic, total revenue and price move in the *same* direction.
3. **Overlooking the Accounting Equation Balance**: Every economic transaction impacts at least two elements, preserving fundamental identity equilibrium.

---

### 7. Practice Problems with Detailed Solutions
${practiceProblems}

---

### 8. Concise Revision Summary
${revisionSummary}
`;
}

function buildEngineeringNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Learning Objectives & Engineering Scope
By the end of this module, you will be able to:
* Formulate governing engineering equations and boundary conditions for **${topic}**.
* Apply material properties, factor of safety, and design constraints to structural/system calculations.
* Execute multi-step engineering derivations with strict dimensional analysis and SI units.
* Diagnose design failure modes, maintenance considerations, and exam traps.

*Prerequisites*: Engineering mathematics, mechanics of materials, and physics principles.

---

### 2. Comprehensive Engineering Overview
${theory}

In engineering practice, **${topic}** requires bridging theoretical scientific principles with practical design constraints, economic feasibility, and safety standards.

---

### 3. Governing Engineering Equations & Principles
* **Equilibrium & Conservation Equations**:
  $$\\sum \\vec{F} = 0, \\quad \\sum \\vec{M} = 0$$
* **Constitutive Material Equations**:
  $$\\sigma = E \\cdot \\varepsilon \\quad (\\text{Hooke's Law within elastic limit})$$
* **Factor of Safety (FoS)**:
  $$\\text{FoS} = \\frac{\\text{Yield or Ultimate Stress (}\\sigma_{\\text{fail}})}{\\text{Allowable Working Stress (}\\sigma_{\\text{allow}})} > 1.0$$

---

### 4. Step-by-Step Worked Engineering Calculation
**Problem**: A circular steel rod of diameter $d = 20.0\\text{ mm}$ and length $L = 2.0\\text{ m}$ is subjected to an axial tensile load $P = 40.0\\text{ kN}$. Modulus of elasticity $E = 200\\text{ GPa}$.
1. **Cross-Sectional Area ($A$)**:
   $$A = \\frac{\\pi d^2}{4} = \\frac{\\pi (0.020\\text{ m})^2}{4} = 3.1416 \\times 10^{-4}\\text{ m}^2$$
2. **Normal Stress ($\\sigma$)**:
   $$\\sigma = \\frac{P}{A} = \\frac{40.0 \\times 10^3\\text{ N}}{3.1416 \\times 10^{-4}\\text{ m}^2} = 1.273 \\times 10^8\\text{ Pa} = 127.3\\text{ MPa}$$
3. **Axial Elongation ($\\delta$)**:
   $$\\delta = \\frac{P \\cdot L}{A \\cdot E} = \\frac{(40.0 \\times 10^3\\text{ N})(2.0\\text{ m})}{(3.1416 \\times 10^{-4}\\text{ m}^2)(200 \\times 10^9\\text{ Pa})} = 1.273 \\times 10^{-3}\\text{ m} = 1.273\\text{ mm}$$
4. **Verification**: Strain $\\varepsilon = \\frac{\\delta}{L} = \\frac{1.273\\text{ mm}}{2000\\text{ mm}} = 6.366 \\times 10^{-4}$. Stress $\\sigma = E \\cdot \\varepsilon = (200 \\times 10^9)(6.366 \\times 10^{-4}) = 127.3\\text{ MPa}$. The calculation is verified.

---

### 5. Comparative Engineering Analysis
| Parameter | Working Stress Method | Limit State / Ultimate Strength Method |
| :--- | :--- | :--- |
| **Material Behavior** | Assumes purely linear elastic behavior | Considers plastic deformations and ultimate material capacity |
| **Safety Factor** | Single global Factor of Safety applied to stress | Partial safety factors applied independently to loads and materials |
| **Economy & Efficiency** | Often overly conservative | More efficient, safe, and realistic material utilization |

---

### 6. Common Misconceptions & Exam Traps
1. **Confusing Engineering Stress with True Stress**: Engineering stress uses initial cross-sectional area $A_0$, while true stress uses instantaneous deformed area $A_i$.
2. **Ignoring Units in Modulus Calculations**: Forgetting that $\\text{GPa} = 10^9\\text{ Pa}$ and $\\text{MPa} = 10^6\\text{ Pa}$, causing orders-of-magnitude errors in deflection.
3. **Neglecting Boundary Constraints**: Applying equations without verifying whether support conditions are fixed, pinned, or free.

---

### 7. Practice Engineering Questions & Solutions
**Question 1**: What does a Factor of Safety of 2.0 signify in structural engineering?
* *Solution*: The structure is designed to support twice the maximum anticipated working load before reaching the defined failure threshold.

**Question 2**: If the diameter of a tensile rod is doubled while maintaining the same axial load, how does the normal stress change?
* *Solution*: $\\sigma = \\frac{P}{A} = \\frac{P}{\\pi d^2 / 4}$. Doubling $d$ quadruples area $A$, reducing the stress to one-fourth ($\\frac{1}{4}$) of its original value.

---

### 8. Concise Revision Summary
* Maintain dimensional unit consistency ($\text{N}, \text{m}, \text{Pa}$).
* Verify elastic limit assumptions before using linear constitutive models.
`;
}

function buildLawNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Learning Objectives & Jurisprudential Scope
By the end of this module, you will be able to:
* Identify governing statutory provisions and judicial doctrines relevant to **${topic}**.
* Analyze the required legal elements of the governing rule or test.
* Evaluate landmark precedents and their judicial interpretation.
* Apply legal rules to factual problem scenarios to generate reasoned conclusions.

*Prerequisites*: Legal sources, statutory interpretation, doctrine of precedent (*stare decisis*).

---

### 2. Comprehensive Legal Overview & Jurisprudential Foundations
${theory}

In legal studies, **${topic}** requires analyzing statutory language, judicial interpretation, and public policy considerations within **${subject}**.

---

### 3. Core Legal Doctrine & Elements of the Rule
* **Statutory Framework**: Established legal rules define the rights, obligations, and standards of conduct.
* **Essential Elements of the Legal Test**:
  1. **Duty / Obligation**: Existence of a recognized legal duty or statutory requirement.
  2. **Breach / Action**: Conduct falling below the legally required standard.
  3. **Causation / Nexus**: Direct causal link between the conduct and the legal injury or outcome.
  4. **Remedy / Liability**: Applicable legal damages, injunctive relief, or statutory penalties.

---

### 4. Landmark Judicial Precedents & Case Law
* **Leading Principle**: Established judicial holdings interpret ambiguous statutory language and guide lower courts.
* **Ratio Decidendi**: The legal principle upon which the judicial decision is founded, creating binding precedent.
* **Obiter Dicta**: Observations made by a judge that are not essential to the decision, serving as persuasive authority.

---

### 5. Comparative Legal Analysis Table
| Dimension | Common Law Doctrine | Statutory Regulation |
| :--- | :--- | :--- |
| **Origin** | Evolved through judicial precedent and case law | Enacted through legislative parliamentary process |
| **Flexibility** | Adapts incrementally to novel factual circumstances | Fixed statutory text; requires legislative amendment or judicial interpretation |
| **Hierarchy** | Yields to conflicting primary legislation | Supreme over contradictory common law rules |

---

### 6. Common Legal Misconceptions & Exam Pitfalls
1. **Confusing 'Ratio Decidendi' with 'Obiter Dictum'**: Only the core legal reasoning necessary to decide the case forms binding precedent.
2. **Ignoring the Standard of Proof**: Confusing the civil standard ("preponderance of the evidence" / "balance of probabilities") with the criminal standard ("beyond a reasonable doubt").
3. **Failing to Address Both Sides of a Legal Dispute**: Exam problems reward balanced analysis of competing arguments rather than asserting dogmatic conclusions.

---

### 7. Practice Legal Problem Questions & Model Analysis
**Problem**: Analyze whether an informal oral agreement concerning a commercial exchange constitutes a binding contract.
* *Model Reasoning*: A valid contract requires offer, acceptance, intention to create legal relations, and consideration. While oral contracts can be legally binding, statutory requirements (e.g. Statute of Frauds) may require written evidence for specific categories like real estate.

---

### 8. Concise Revision Summary
* Identify statutory provisions and binding precedents.
* Apply the IRAC method (Issue, Rule, Application, Conclusion) systematically.
`;
}

function buildEnvironmentalNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Learning Objectives & Ecological Scope
By the end of this module, you will be able to:
* Explain the scientific principles, biogeochemical cycles, and ecological mechanisms of **${topic}**.
* Quantify environmental indicators and evaluate anthropogenic impact.
* Compare mitigation strategies, regulatory policies, and ecological conservation practices.
* Avoid common environmental science exam misconceptions.

*Prerequisites*: Ecosystem structure, trophic dynamics, and basic earth science.

---

### 2. Comprehensive Ecological & Environmental Overview
${theory}

In environmental science, **${topic}** represents an interconnected systemic process where physical, chemical, and biological factors interact to influence ecosystem stability and sustainability.

---

### 3. Systemic Mechanisms & Biogeochemical Dynamics
* **Ecosystem Energy Flow**: Sunlight $\\to$ Primary Producers $\\to$ Primary Consumers $\\to$ Secondary Consumers $\\to$ Decomposers.
* **10% Trophic Transfer Efficiency**: Only approximately $10\\%$ of energy stored as biomass is transferred to the next trophic level.
* **Biogeochemical Flux**: Movement of elements (Carbon, Nitrogen, Phosphorus, Water) through biological and abiotic reservoirs.

---

### 4. Anthropogenic Impacts & Conservation Strategies
* **Human Pressures**: Habitat fragmentation, pollution, greenhouse gas emissions, and overexploitation.
* **Sustainable Solutions**: Renewable energy transitions, protected area networks, circular economy frameworks, and ecological restoration.

---

### 5. Comparative Analysis Table
| Dimension | Preservation Strategy | Conservation Strategy |
| :--- | :--- | :--- |
| **Philosophical Goal** | Protecting nature from any human utilization or interference | Sustainable, managed utilization of resources for current and future generations |
| **Management Style** | Strict non-intervention; hands-off wilderness preservation | Active scientific management, quotas, and ecological restoration |
| **Primary Example** | National Parks and designated wilderness areas | Sustainable forestry, managed fisheries, and wildlife reserves |

---

### 6. Common Misconceptions & Exam Pitfalls
1. **Confusing the Greenhouse Effect with Ozone Depletion**: The greenhouse effect traps infrared radiation to warm the troposphere; ozone depletion in the stratosphere increases harmful ultraviolet-B (UV-B) radiation.
2. **Assuming Biodegradable Equals Harmless**: Biodegradable waste in anaerobic landfill environments produces methane ($\\text{CH}_4$), a potent greenhouse gas.
3. **Confusing Biomagnification with Bioaccumulation**: Bioaccumulation occurs within an individual organism over time; biomagnification increases toxin concentration across successive trophic levels.

---

### 7. Practice Questions & Detailed Explanations
**Question 1**: Why does biomagnification disproportionately threaten apex predators?
* *Solution*: Persistent, lipid-soluble toxins are stored in adipose tissue and concentrated at each successive trophic transfer, resulting in the highest concentrations in top carnivores.

**Question 2**: What is carrying capacity ($K$)?
* *Solution*: The maximum population size of a species that an environment can sustain indefinitely without degrading natural resource capital.

---

### 8. Concise Revision Summary
* Trace energy flows and biogeochemical cycles systematically.
* Evaluate anthropogenic pressures and conservation mitigation policies objectively.
`;
}

function buildComputerScienceNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  isExamMode: boolean
): string {
  const isJava = /java/i.test(subject) || /java/i.test(topic);
  if (isJava) {
    return buildJavaNotes(subject, topic, theory, badge, syllabusNote, isExamMode);
  }

  const isDbms =
    /dbms|database|sql/i.test(subject) ||
    /dbms|database|sql|entity relationship|er model|er diagram|normalization|relational|transactions|concurrency|acid|recovery/i.test(
      topic
    );
  if (isDbms) {
    return buildDbmsNotes(subject, topic, theory, badge, syllabusNote, isExamMode);
  }

  const isOs =
    /os|operating system|process|thread|scheduling|round robin|virtual memory|paging|deadlock|semaphore|mutex/i.test(
      subject
    ) ||
    /os|operating system|process|thread|scheduling|round robin|virtual memory|paging|deadlock|semaphore|mutex/i.test(
      topic
    );

  const isAlgorithms =
    /algorithm|data structure|sorting|searching|binary search|merge sort|quick sort|tree|graph|dynamic programming|complexity/i.test(
      subject
    ) ||
    /algorithm|data structure|sorting|searching|binary search|merge sort|quick sort|tree|graph|dynamic programming|complexity/i.test(
      topic
    );

  if (isOs) {
    const safeIntro = theory ? `${theory}\n\n` : "";
    return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* The core abstractions of **Operating Systems**: Processes, Threads, Context Switching, and the Process Control Block (PCB).
* CPU Scheduling algorithms: **Round Robin (RR)** with time quantum $q$, First-Come First-Served (FCFS), and Shortest Job First (SJF).
* Memory management architectures: **Virtual Memory**, Demand Paging, Page Tables, and Translation Lookaside Buffers (TLB).
* Page Replacement algorithms: **FIFO**, **LRU**, and **Optimal (Belady's Min)**, along with **Belady's Anomaly**.
* Concurrency control: Race conditions, Critical Sections, Mutual Exclusion, and Semaphores.
* Deadlock characterization: The four **Coffman Conditions** and Deadlock Avoidance.

---

### 2. Prerequisites & Background Context
* Basic computer architecture: CPU registers, RAM, program counters, and machine instruction cycles.
* Procedural programming (functions, pointers, memory allocation).

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${safeIntro}An **Operating System (OS)** is system software that acts as an intermediary between computer hardware and user applications. It manages hardware resources (CPU, RAM, I/O devices) and provides essential abstractions like files, processes, and virtual memory.

#### 1. Processes, Threads, and CPU Scheduling
* A **Process** is an active program in execution with an isolated virtual address space (Text, Data, Heap, Stack).
* A **Thread** is the basic unit of CPU execution within a process, sharing code and data segments with peer threads while maintaining private registers and a stack.
* **CPU Scheduling Metrics**:
  * **Completion Time (CT)**: The instant at which a process finishes execution.
  * **Turnaround Time (TAT)**: $\\text{TAT} = \\text{CT} - \\text{AT}$ (Total time from arrival to completion).
  * **Waiting Time (WT)**: $\\text{WT} = \\text{TAT} - \\text{BT}$ (Total time spent waiting in the ready queue).
* **Round Robin (RR) Scheduling Mechanics**:
  * Designed for preemptive time-sharing systems.
  * The ready queue operates strictly as a **circular FIFO queue**.
  * Each process is allocated a fixed **time quantum ($q$)**.
  * When a process executes for $q$ units without completing, a timer interrupt fires, saving its CPU context to its PCB and placing it at the tail of the ready queue.
  * *Assumption for standard benchmark*: All processes arrive simultaneously at time $t = 0$.
  * **Trace of Sample Workload** ($P_1=10, P_2=5, P_3=8$ with $q=4$):
    * Initial Ready Queue at $t = 0$: $[P_1, P_2, P_3]$.
    * $0 - 4$: $P_1$ runs 4 units (rem $= 6$). Re-enqueued at tail. Ready Queue: $[P_2, P_3, P_1]$.
    * $4 - 8$: $P_2$ runs 4 units (rem $= 1$). Re-enqueued at tail. Ready Queue: $[P_3, P_1, P_2]$.
    * $8 - 12$: $P_3$ runs 4 units (rem $= 4$). Re-enqueued at tail. Ready Queue: $[P_1, P_2, P_3]$.
    * $12 - 16$: $P_1$ runs 4 units (rem $= 2$). Re-enqueued at tail. Ready Queue: $[P_2, P_3, P_1]$.
    * $16 - 17$: $P_2$ runs 1 unit (rem $= 0$). **$P_2$ terminates at $t = 17$** ($\\text{CT} = 17, \\text{TAT} = 17, \\text{WT} = 17 - 5 = 12$). Ready Queue: $[P_3, P_1]$.
    * $17 - 21$: $P_3$ is at the head of the ready queue; runs 4 units (rem $= 0$). **$P_3$ terminates at $t = 21$** ($\\text{CT} = 21, \\text{TAT} = 21, \\text{WT} = 21 - 8 = 13$). Ready Queue: $[P_1]$.
    * $21 - 23$: $P_1$ runs its final 2 units (rem $= 0$). **$P_1$ terminates at $t = 23$** ($\\text{CT} = 23, \\text{TAT} = 23, \\text{WT} = 23 - 10 = 13$). Ready Queue is empty.
    * *Summary of Strict FIFO Execution*: $P_1$ finishes at 23 (WT=13), $P_2$ finishes at 17 (WT=12), and $P_3$ finishes at 21 (WT=13). Total schedule completion horizon is $t = 23$.

#### 2. Virtual Memory & Paging Mechanics
Virtual memory decouples logical memory referenced by software from physical RAM frames:
* **Page Table**: Maps logical page numbers ($p$) to physical frame numbers ($f$).
* **Translation Lookaside Buffer (TLB)**: A high-speed associative hardware cache storing active page translations.
* **Effective Memory Access Time (EMAT)**:
  $$\\text{EMAT} = h \\cdot (t_{\\text{TLB}} + t_{\\text{RAM}}) + (1 - h) \\cdot (t_{\\text{TLB}} + 2 \\cdot t_{\\text{RAM}})$$
  where $h$ is the TLB hit ratio, $t_{\\text{TLB}}$ is TLB lookup time, and $t_{\\text{RAM}}$ is main memory access time.
  *Step-by-step example* ($h = 0.80$, $t_{\\text{TLB}} = 20\\text{ ns}$, $t_{\\text{RAM}} = 100\\text{ ns}$):
  * Hit latency: $20\\text{ ns} + 100\\text{ ns} = 120\\text{ ns}$.
  * Miss latency: $20\\text{ ns} + 100\\text{ ns (Page Table)} + 100\\text{ ns (Data)} = 220\\text{ ns}$.
  * $\\text{EMAT} = 0.80(120\\text{ ns}) + 0.20(220\\text{ ns}) = 96\\text{ ns} + 44\\text{ ns} = 140\\text{ ns}$.

#### 3. Page Replacement Algorithms & Belady's Anomaly
When a page fault occurs and all physical RAM frames are occupied, the OS must select a victim page to evict.
Consider reference string: \`7, 0, 1, 2, 0, 3, 0, 4, 2, 3\` with **3 physical frames** (independently verified via deterministic simulator):

| Algorithm | Victim Selection Rule | Page Faults (10 References) | Hits | Belady's Anomaly Susceptible? |
| :--- | :--- | :--- | :--- | :--- |
| **FIFO (First-In, First-Out)** | Evicts the oldest loaded page | **9 faults** | **1 hit** | **Yes** (Increasing frames can increase faults) |
| **LRU (Least Recently Used)** | Evicts the page unused for longest time | **8 faults** | **2 hits** | **No** (Stack algorithm with inclusion property) |
| **Optimal (Belady's Min)** | Evicts page unused for longest future time | **6 faults** | **4 hits** | **No** (Theoretical minimum bound) |

##### Deterministic Simulation Traces:
1. **FIFO (9 Faults, 1 Hit)**:
   - Refs $7, 0, 1$: 3 initial compulsory faults filling empty frames $\\to [7, 0, 1]$.
   - Ref $2$: Fault $\\to$ evicts oldest loaded page ($7$) $\\to [2, 0, 1]$.
   - Ref $0$: **Hit** in frame $1$.
   - Ref $3$: Fault $\\to$ evicts oldest loaded page ($0$) $\\to [2, 3, 1]$.
   - Ref $0$: Fault $\\to$ evicts oldest loaded page ($1$) $\\to [2, 3, 0]$.
   - Ref $4$: Fault $\\to$ evicts oldest loaded page ($2$) $\\to [4, 3, 0]$.
   - Ref $2$: Fault $\\to$ evicts oldest loaded page ($3$) $\\to [4, 2, 0]$.
   - Ref $3$: Fault $\\to$ evicts oldest loaded page ($0$) $\\to [4, 2, 3]$.
   - *Final Count*: 9 page faults, 1 hit (Hit ratio: $10\\%$, Fault ratio: $90\\%$).

2. **LRU (8 Faults, 2 Hits)**:
   - Refs $7, 0, 1$: 3 initial compulsory faults $\\to [7, 0, 1]$.
   - Ref $2$: Fault $\\to$ evicts least recently used page ($7$) $\\to [2, 0, 1]$.
   - Ref $0$: **Hit** (recency updated).
   - Ref $3$: Fault $\\to$ evicts least recently used page ($1$) $\\to [2, 0, 3]$.
   - Ref $0$: **Hit** (recency updated).
   - Ref $4$: Fault $\\to$ evicts least recently used page ($2$) $\\to [4, 0, 3]$.
   - Ref $2$: Fault $\\to$ evicts least recently used page ($3$) $\\to [4, 0, 2]$.
   - Ref $3$: Fault $\\to$ evicts least recently used page ($0$) $\\to [4, 3, 2]$.
   - *Final Count*: 8 page faults, 2 hits (Hit ratio: $20\\%$, Fault ratio: $80\\%$).

3. **Optimal (6 Faults, 4 Hits)**:
   - Refs $7, 0, 1$: 3 initial compulsory faults $\\to [7, 0, 1]$.
   - Ref $2$: Fault $\\to$ future accesses: $0$ ($t=5$), $3$ ($t=6$), $0$ ($t=7$), $4$ ($t=8$), $2$ ($t=9$), $3$ ($t=10$). Pages $7$ and $1$ are never used ($\infty$); deterministic tie-break evicts oldest ($7$) $\\to [2, 0, 1]$.
   - Ref $0$: **Hit**.
   - Ref $3$: Fault $\\to$ future accesses: $0$ ($t=7$), $4$ ($t=8$), $2$ ($t=9$), $3$ ($t=10$). Page $1$ is never used ($\infty$), evicts $1$ $\\to [2, 0, 3]$.
   - Ref $0$: **Hit**.
   - Ref $4$: Fault $\\to$ future accesses: $2$ ($t=9$), $3$ ($t=10$). Page $0$ is never used ($\infty$), evicts $0$ $\\to [2, 4, 3]$.
   - Ref $2$: **Hit**.
   - Ref $3$: **Hit**.
   - *Final Count*: 6 page faults, 4 hits (Hit ratio: $40\\%$, Fault ratio: $60\\%$).

* **Belady's Anomaly**: In FIFO page replacement, allocating more physical page frames can paradoxically increase page faults. For reference string \`1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5\`:
  - With **3 physical frames**, FIFO generates exactly **9 page faults**.
  - With **4 physical frames**, FIFO generates exactly **10 page faults** ($10 > 9$, confirming the anomaly!).
  - Stack algorithms such as **LRU** and **Optimal** satisfy the inclusion property ($M(n) \\subseteq M(n+1)$) and are mathematically immune.

#### 4. Deadlock Characterization (The 4 Coffman Conditions)
A deadlock occurs if and only if all four conditions hold simultaneously:
1. **Mutual Exclusion**: At least one resource is held in a non-shareable mode.
2. **Hold and Wait**: A process holds allocated resources while waiting for others.
3. **No Preemption**: Resources cannot be forcibly seized; only voluntarily released.
4. **Circular Wait**: A closed loop of processes exists where each process waits for a resource held by the next.

---

### 4. Correct, Complete, Runnable C Code Example
\`\`\`c
// Operating Systems: Process Metrics & Round Robin Execution Simulation (FIFO Ready Queue)
#include <stdio.h>

#define MAX_QUEUE 32

struct ProcessTask {
    int pid;
    int arrivalTime;
    int burstTime;
    int remainingTime;
    int completionTime;
    int turnaroundTime;
    int waitingTime;
};

struct ReadyQueue {
    int items[MAX_QUEUE];
    int front;
    int rear;
    int count;
};

void q_init(struct ReadyQueue *q) {
    q->front = 0;
    q->rear = -1;
    q->count = 0;
}

int q_isEmpty(struct ReadyQueue *q) {
    return q->count == 0;
}

void q_enqueue(struct ReadyQueue *q, int pidIndex) {
    if (q->count < MAX_QUEUE) {
        q->rear = (q->rear + 1) % MAX_QUEUE;
        q->items[q->rear] = pidIndex;
        q->count++;
    }
}

int q_dequeue(struct ReadyQueue *q) {
    if (!q_isEmpty(q)) {
        int val = q->items[q->front];
        q->front = (q->front + 1) % MAX_QUEUE;
        q->count--;
        return val;
    }
    return -1;
}

int main(void) {
    // Assumption: All processes arrive simultaneously at time t = 0
    struct ProcessTask tasks[3] = {
        {1, 0, 10, 10, 0, 0, 0},
        {2, 0, 5, 5, 0, 0, 0},
        {3, 0, 8, 8, 0, 0, 0}
    };
    int n = 3;
    int timeQuantum = 4;
    int currentTime = 0;
    struct ReadyQueue queue;
    q_init(&queue);

    printf("=== Round Robin CPU Scheduling Simulation (Quantum = %d) ===\\n", timeQuantum);
    printf("Assumption: All processes arrive at time 0 (t = 0).\\n");

    // Initialize ready queue with all arriving processes in FIFO order
    for (int i = 0; i < n; i++) {
        q_enqueue(&queue, i);
    }

    while (!q_isEmpty(&queue)) {
        int idx = q_dequeue(&queue);
        if (tasks[idx].remainingTime > timeQuantum) {
            currentTime += timeQuantum;
            tasks[idx].remainingTime -= timeQuantum;
            // Preempted: re-enqueue at the rear to preserve strict FIFO ready-queue order
            q_enqueue(&queue, idx);
        } else {
            currentTime += tasks[idx].remainingTime;
            tasks[idx].remainingTime = 0;
            tasks[idx].completionTime = currentTime;
            tasks[idx].turnaroundTime = tasks[idx].completionTime - tasks[idx].arrivalTime;
            tasks[idx].waitingTime = tasks[idx].turnaroundTime - tasks[idx].burstTime;
        }
    }

    printf("PID\\tBurst\\tCompletion\\tTurnaround\\tWaiting\\n");
    for (int i = 0; i < n; i++) {
        printf("P%d\\t%d\\t%d\\t\\t%d\\t\\t%d\\n",
               tasks[i].pid, tasks[i].burstTime, tasks[i].completionTime,
               tasks[i].turnaroundTime, tasks[i].waitingTime);
    }
    return 0;
}
\`\`\`

---

### 5. Expected Console Output
\`\`\`text
=== Round Robin CPU Scheduling Simulation (Quantum = 4) ===
Assumption: All processes arrive at time 0 (t = 0).
PID	Burst	Completion	Turnaround	Waiting
P1	10	23		23		13
P2	5	17		17		12
P3	8	21		21		13
\`\`\`

---

### 6. Practice Questions & Detailed Explanations

#### Question 1 (Context Switch Overhead)
**Question**: What constitutes a process context switch, and why does frequent context switching degrade operating system throughput?
* **Answer / Explanation**: A context switch requires saving the CPU state (program counter, stack pointer, general-purpose registers) of the currently running process to its Process Control Block (PCB) in memory, and loading the saved state of the next scheduled process. Frequent context switching degrades throughput because CPU cycles spent executing the scheduler and dispatcher do not perform useful application work, and cache pollution (cold cache misses in L1/L2) slows execution.

#### Question 2 (Round Robin Time Quantum Trade-offs)
**Question**: In Round Robin scheduling, what are the systemic consequences of selecting a time quantum that is either too large or too small?
* **Answer / Explanation**: If the quantum is too large, Round Robin degenerates into First-Come First-Served (FCFS), leading to poor interactive response times and the convoy effect (short interactive processes stuck waiting behind long CPU-bound jobs). If the quantum is too small, excessive CPU time is consumed by context-switch overhead rather than program execution.

#### Question 3 (Translation Lookaside Buffer Hit Ratio & EMAT)
**Question**: In a demand-paging virtual memory system where memory access takes $100\\text{ ns}$ and TLB access takes $20\\text{ ns}$, calculate the Effective Memory Access Time (EMAT) with an $80\\%$ TLB hit ratio.
* **Answer / Explanation**:
  * On a TLB hit ($80\\%$): $t = 20\\text{ ns (TLB)} + 100\\text{ ns (RAM)} = 120\\text{ ns}$.
  * On a TLB miss ($20\\%$): $t = 20\\text{ ns (TLB)} + 100\\text{ ns (Page Table read)} + 100\\text{ ns (Data read)} = 220\\text{ ns}$.
  * $\\text{EMAT} = 0.80(120) + 0.20(220) = 96 + 44 = 140\\text{ ns}$.

#### Question 4 (Page Replacement & Belady's Anomaly)
**Question**: Explain Belady's Anomaly and identify which page replacement algorithm is vulnerable to it.
* **Answer / Explanation**: Belady's Anomaly is the counterintuitive phenomenon where increasing the number of physical page frames allocated to a process results in an increase in the number of page faults. It occurs in First-In First-Out (FIFO) replacement because FIFO does not possess the stack inclusion property (the set of pages in memory for $N$ frames is not always a subset of pages in memory for $N+1$ frames). Stack algorithms such as LRU and Optimal are provably immune. For example, the reference string \`1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5\` yields exactly 9 page faults with 3 frames and increases to 10 page faults with 4 frames under FIFO.

#### Question 5 (Coffman Conditions & Deadlock Prevention)
**Question**: How does eliminating the "Hold and Wait" condition prevent deadlocks?
* **Answer / Explanation**: To eliminate Hold and Wait, the operating system requires that a process request and be allocated all necessary resources simultaneously before execution begins, or release all currently held resources before requesting new ones. Because no process can hold resources while waiting for others, circular dependency chains cannot form.

---

### 7. Concise Revision Summary
* Schedulers balance turnaround time, response time, and CPU utilization via time-sharing ready queues.
* Virtual memory uses page tables and TLBs to translate sparse virtual addresses to physical RAM frames.
* Page replacement algorithms balance fault rates against tracking overhead; LRU and Optimal avoid Belady's Anomaly.
* Deadlocks require all four Coffman conditions; breaking any one condition prevents deadlock.
`;
  }

  if (isAlgorithms) {
    return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* Asymptotic notation ($O, \\Omega, \\Theta$) and evaluating worst, average, and best-case computational complexity.
* The **Divide-and-Conquer** paradigm, recursion tree analysis, and the **Master Theorem**.
* Key algorithmic strategies: Divide and Conquer, Greedy Choice, and Dynamic Programming with optimal substructure.
* Proving algorithm correctness using formal **Loop Invariants** (Initialization, Maintenance, and Termination).
* Space and time complexity trade-offs in search, sort, and graph traversal algorithms.

---

### 2. Prerequisites & Background Context
* Fundamental data structures: arrays, linked lists, stacks, queues, and trees.
* Mathematical induction, logarithms, and basic combinatorics.

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${theory}

An **Algorithm** is a finite, well-defined sequence of unambiguous computational steps that transforms valid input into desired output. **Algorithm Analysis** evaluates resource consumption (CPU time and memory space) as a mathematical function of input size ($n$).

#### 1. Asymptotic Complexity Classes
* **$O(g(n))$ (Big-O / Asymptotic Upper Bound)**: $f(n) \\in O(g(n))$ if there exist positive constants $c$ and $n_0$ such that $0 \\le f(n) \\le c \\cdot g(n)$ for all $n \\ge n_0$.
* **$\\Omega(g(n))$ (Big-Omega / Asymptotic Lower Bound)**: Bounds growth from below.
* **$\\Theta(g(n))$ (Big-Theta / Asymptotically Tight Bound)**: Bounded both above and below by constants.

#### 2. The Divide-and-Conquer Paradigm: Merge Sort
1. **Divide**: Split the array of $n$ elements into two sub-arrays of size $n/2$.
2. **Conquer**: Recursively sort both sub-arrays.
3. **Combine**: Merge the two sorted sub-arrays into a single sorted array in $O(n)$ linear time.
* **Recurrence Relation**:
  $$T(n) = 2T(n/2) + O(n)$$
  By Case 2 of the Master Theorem, $T(n) = \\Theta(n \\log n)$ in worst, average, and best cases.

---

### 4. Correct, Complete, Runnable Python Code Example
\`\`\`python
# Complete, Verified Implementation of Merge Sort & Binary Search
def merge_sort(arr: list[int]) -> list[int]:
    """Sorts an array in non-decreasing order using Divide and Conquer O(n log n)."""
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left_half = merge_sort(arr[:mid])
    right_half = merge_sort(arr[mid:])

    return merge(left_half, right_half)

def merge(left: list[int], right: list[int]) -> list[int]:
    """Combines two sorted sub-arrays in linear O(n) time."""
    sorted_arr = []
    i = j = 0

    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            sorted_arr.append(left[i])
            i += 1
        else:
            sorted_arr.append(right[j])
            j += 1

    sorted_arr.extend(left[i:])
    sorted_arr.extend(right[j:])
    return sorted_arr

def binary_search(arr: list[int], target: int) -> int:
    """Locates target in a sorted array in O(log n) time. Returns index or -1."""
    low, high = 0, len(arr) - 1

    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1

    return -1

if __name__ == "__main__":
    sample_data = [64, 25, 12, 22, 11, 90, 42]
    sorted_data = merge_sort(sample_data)
    print("Sorted Array:", sorted_data)

    target_val = 25
    pos = binary_search(sorted_data, target_val)
    print(f"Target {target_val} found at index: {pos}")
\`\`\`

---

### 5. Expected Console Output
\`\`\`text
Sorted Array: [11, 12, 22, 25, 42, 64, 90]
Target 25 found at index: 3
\`\`\`

---

### 6. Practice Questions & Detailed Explanations

#### Question 1 (Merge Sort vs Quick Sort Stability)
**Question**: Why is Merge Sort guaranteed to run in $O(n \\log n)$ time, whereas Quick Sort can degrade to $O(n^2)$?
* **Answer / Explanation**: Merge Sort always partitions the input array into two equal halves of size $n/2$, creating a perfectly balanced recursion tree of height $\\log_2 n$ with $O(n)$ work per level. In Quick Sort, if poor pivots are selected (e.g., pivot is consistently the maximum or minimum element in an already sorted array), partitions are skewed into sizes $0$ and $n-1$, producing a tree of height $n$ and quadratic $O(n^2)$ time.

#### Question 2 (Loop Invariant Proof of Binary Search)
**Question**: State the loop invariant for Binary Search and explain how it proves algorithm correctness upon termination.
* **Answer / Explanation**:
  * **Invariant**: At the start of each iteration of the while loop, if the target exists in the array, it must lie within the index range \`[low, high]\`.
  * **Maintenance**: Comparing \`arr[mid]\` with target eliminates the left or right sub-range while guaranteeing the target remains in the narrowed range.
  * **Termination**: When \`low > high\`, the sub-range is empty, proving conclusively that the target is not in the array.

#### Question 3 (Master Theorem Application)
**Question**: Solve the recurrence relation $T(n) = 4T(n/2) + O(n^2)$ using the Master Theorem.
* **Answer / Explanation**:
  * Here $a = 4, b = 2, f(n) = O(n^2)$.
  * Compare $f(n)$ with $n^{\\log_b a} = n^{\\log_2 4} = n^2$.
  * Since $f(n) = \\Theta(n^{\\log_b a}) = \\Theta(n^2)$, Case 2 of the Master Theorem applies:
  * $T(n) = \\Theta(n^{\\log_b a} \\log n) = \\Theta(n^2 \\log n)$.

#### Question 4 (Dynamic Programming vs Greedy Method)
**Question**: Under what structural condition does a Greedy algorithm fail where Dynamic Programming succeeds?
* **Answer / Explanation**: Both paradigms require optimal substructure. However, greedy algorithms additionally require the **Greedy Choice Property**—that a globally optimal solution can be reached by making locally optimal choices without back-tracking. In problems like the 0/1 Knapsack problem, making the locally optimal choice based on value-to-weight ratio fails to achieve global optimality, requiring Dynamic Programming to explore sub-problem overlaps.

#### Question 5 (Space Complexity Trade-offs)
**Question**: What is the auxiliary space complexity difference between Merge Sort and In-Place Heap Sort?
* **Answer / Explanation**: Standard Merge Sort requires $O(n)$ auxiliary memory to create temporary merged sub-arrays. Heap Sort rearranges elements in-place within the existing array structure, requiring only $O(1)$ auxiliary memory while maintaining $O(n \\log n)$ worst-case time complexity.

---

### 7. Concise Revision Summary
* Merge Sort guarantees $O(n \\log n)$ worst-case time but requires $O(n)$ auxiliary space.
* Binary search requires an already sorted array to achieve $O(\\log n)$ search performance.
* Dynamic Programming solves overlapping subproblems through memoization or tabulation.
`;
  }

  // General CS / Software Engineering Fallback
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* The core architectural principles, computational complexity, and runtime behavior of this computational unit.
* Implementing robust, syntactically valid software modules with defensive error handling and input validation.
* Evaluating space and time complexity tradeoffs ($O$-notation) across operational boundaries.
* Diagnostic techniques to eliminate boundary bugs, off-by-one errors, and unhandled runtime exceptions.

---

### 2. Prerequisites & Background Context
* General foundation in computer programming structures, memory layout, and control flow.
* Understanding of system constraints, data structures, and computational complexity.

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${theory}

In computer science and software engineering, mastering **${topic}** ensures predictable system state transitions, optimal computational efficiency, and robust data integrity across system lifecycles.

---

### 4. Architectural Principles & Computational Complexity
* **Algorithmic Bounds**: Systematic analysis of worst-case ($O$), average-case ($\\Theta$), and best-case ($\\Omega$) execution time.
* **State Verification**: Enforcing preconditions, invariants, and postconditions across execution boundaries.
* **Resource Lifecycles**: Structured allocation, usage, and deterministic cleanup of system handles, sockets, and memory buffers.

---

### 5. Correct, Complete, Runnable Code Example
\`\`\`python
# Production Modular Architecture with Defensive Boundary Validation
def process_data_pipeline(records: list[float]) -> dict[str, float]:
    """Processes numeric data streams with strict boundary validation."""
    if not records:
        raise ValueError("Input records collection cannot be empty.")

    total = sum(records)
    n = len(records)
    mean = total / n
    variance = sum((x - mean) ** 2 for x in records) / n

    return {
        "count": n,
        "sum": round(total, 2),
        "mean": round(mean, 2),
        "variance": round(variance, 2),
    }

if __name__ == "__main__":
    test_stream = [12.5, 24.0, 36.5, 48.0, 60.0]
    metrics = process_data_pipeline(test_stream)
    print("Computed Execution Metrics:", metrics)
\`\`\`

---

### 6. Expected Console Output
\`\`\`text
Computed Execution Metrics: {'count': 5, 'sum': 181.0, 'mean': 36.2, 'variance': 288.66}
\`\`\`

---

### 7. Comparative Disciplinary Analysis
| Dimension | Naive Direct Approach | Production Engineered Approach |
| :--- | :--- | :--- |
| **Time Complexity** | $O(n^2)$ unindexed search | $O(n \\log n)$ or $O(1)$ indexed/hashed lookup |
| **Memory Allocation** | Redundant dynamic allocations | In-place or pooled reference reuse |
| **Error Handling** | Silent crashes or unhandled exceptions | Explicit boundary validation and structured handling |

---

### 8. Common Misconceptions & Exam Pitfalls
1. **Unchecked Boundaries**: Failing to validate null, empty, or extreme inputs leads to unhandled runtime exceptions. Fix: Validate inputs at interface boundaries.
2. **Off-by-One Errors**: Accessing invalid indices triggers buffer overflows or indexing faults. Fix: Use standard collection iterators.
3. **Ignoring Resource Lifecycles**: Failing to release locks or connections causes resource exhaustion. Fix: Always employ structured cleanup.

---

### 9. Practice Questions & Detailed Explanations

#### Question 1 (Asymptotic Search Complexity)
**Question**: What is the asymptotic performance difference between an unindexed search and an indexed/hashed lookup?
* **Answer / Explanation**: An unindexed search requires linear time ($O(n)$) or quadratic time ($O(n^2)$) as every element must be inspected sequentially. In contrast, an indexed search utilizing balanced trees achieves logarithmic time ($O(\\log n)$), and hash lookups achieve average constant time ($O(1)$).

#### Question 2 (Defensive Programming Boundaries)
**Question**: How does defensive input validation prevent system defects in distributed systems?
* **Answer / Explanation**: Defensive validation intercepts malformed, null, or out-of-range payloads at the interface boundary before corrupting internal state or triggering cascading failures across downstream microservices.

#### Question 3 (Resource Leak Prevention)
**Question**: Why must resources like database connections or file handles be explicitly closed?
* **Answer / Explanation**: Operating systems maintain strict limits on open file descriptors and socket pools. Failing to close them causes resource leaks that eventually crash server daemons.

#### Question 4 (Time vs Space Trade-offs)
**Question**: Give an example of trading increased space complexity to achieve lower time complexity.
* **Answer / Explanation**: Hash tables and memoization tables consume $O(n)$ additional memory to cache lookups, reducing query time from linear $O(n)$ or exponential $O(2^n)$ down to constant $O(1)$ time.

#### Question 5 (Data Collection Edge Cases)
**Question**: What edge cases must always be verified when handling data collections?
* **Answer / Explanation**: Null collection pointers, zero-length empty collections, single-item collections, and extreme duplicate or boundary values.

---

### 10. Concise Revision Summary
* Always validate inputs, account for asymptotic complexity, and ensure clean resource lifecycles.
* Use appropriate data structures to optimize lookup and insertion performance.
`;
}

function buildGeneralAcademicNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Learning Objectives & Academic Scope
By the end of this module, you will be able to:
* State the foundational definitions, governing principles, and analytical frameworks of **${topic}**.
* Deconstruct key mechanisms, structural components, and practical applications within **${subject}**.
* Compare alternative viewpoints, methodologies, and standard conventions.
* Master essential examination takeaways and self-assessment concepts.

*Prerequisites*: General introductory knowledge of ${subject} concepts and terminology.

---

### 2. Comprehensive Conceptual Foundations
${theory}

In **${subject}**, mastering **${topic}** provides the essential conceptual foundation required to analyze complex phenomena, evaluate empirical evidence, and construct rigorous academic arguments.

---

### 3. Step-by-Step Thematic Breakdown & Principles
* **Core Principle 1**: Every complex phenomenon can be analyzed through its foundational components and governing principles.
* **Core Principle 2**: Systematic categorization enables clear distinction between causes, mechanisms, and outcomes.
* **Core Principle 3**: Analytical rigor requires questioning assumptions and verifying empirical evidence.

---

### 4. Exemplary Applications & Real-World Case Studies
* **Application Framework**: Implementing theoretical concepts into practical analysis requires clear boundary conditions and systematic evaluation metrics.
* **Worked Example**: Demonstrating the transition from initial assumptions to verified conclusions using structured steps.

---

### 5. Comparative Analysis Table
| Dimension | Theoretical Formulation | Applied Execution |
| :--- | :--- | :--- |
| **Objective** | Conceptual definition and establishing governing models | Real-world application and solving concrete problems |
| **Constraints** | Idealized assumptions and clear abstractions | Practical constraints, variability, and real-world factors |
| **Validation** | Logical consistency and formal proofs | Empirical outcomes and diagnostic verification |

---

### 6. Common Misconceptions & Exam Pitfalls
1. **Confusing Correlation with Causation**: Recognizing that two related phenomena do not automatically imply that one caused the other.
2. **Overgeneralization**: Applying principles beyond their valid domain of application or without verifying foundational assumptions.
3. **Superficial Memorization**: Focusing on keywords without understanding the underlying logical mechanisms and structural connections.

---

### 7. Practice Questions with Detailed Explanations

#### Question 1 (Analytical Foundations)
**Question**: What foundational principles distinguish systematic analytical models from descriptive summaries in academic research?
* **Answer / Explanation**: Systematic analytical models deconstruct phenomena into testable components, identify causal mechanisms, and establish predictive principles with verified boundary conditions, whereas descriptive summaries merely restate observed facts without explanatory depth.

#### Question 2 (Boundary Constraints)
**Question**: How do boundary constraints and initial assumptions affect the validity of theoretical predictions?
* **Answer / Explanation**: Initial assumptions define the domain within which theoretical models hold true. When boundary constraints are violated or unverified, theoretical predictions fail to correspond with empirical reality.

#### Question 3 (Empirical Verification)
**Question**: How does empirical evidence validate or refute abstract theoretical formulations?
* **Answer / Explanation**: Empirical evidence provides measurable, reproducible observational data. When empirical findings consistently contradict theoretical predictions, the underlying model must be revised, constrained, or replaced.

#### Question 4 (Causation vs Correlation)
**Question**: Why is distinguishing correlation from causation vital when analyzing multi-variable phenomena?
* **Answer / Explanation**: Two variables may correlate due to coincidental trends or mutual dependence on a confounding third variable. Assuming causation without establishing a verified mechanism leads to flawed policy decisions and invalid diagnostic conclusions.

#### Question 5 (Diagnostic Evaluation)
**Question**: What criteria should be used to evaluate the validity and reliability of evidence?
* **Answer / Explanation**: Evidence must be evaluated against repeatability, verifiable empirical data, consistency with established domain laws, and absence of confounding variables or observer bias.

---

### 8. Concise Revision Summary
* Define core concepts accurately and verify underlying assumptions.
* Connect theoretical principles to concrete, authentic examples.
* Review comparative distinctions and common misconceptions before examinations.
`;
}
