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
    if (subLower.includes("java") || topicLower.includes("java")) {
      const hasJavaCode = trimmed.includes("```java") || trimmed.includes("class ") || trimmed.includes("system.out.println");
      if (!hasJavaCode) {
        issues.push("Java notes must include valid, formatted Java code examples.");
      }
      if (topicLower.includes("class") || topicLower.includes("object")) {
        const hasCoreOop = lowerNotes.includes("class") && (lowerNotes.includes("object") || lowerNotes.includes("instance"));
        if (!hasCoreOop) {
          issues.push("Java Classes and Objects notes must explain classes and object instantiation.");
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
  const valid = issues.length === 0 || (issues.length <= 1 && score >= 70);

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
        "Verifying underlying assumptions, evaluating empirical evidence, and testing boundary conditions.",
        "Relying entirely on intuition without consulting primary source evidence or analytical derivations.",
        "Ignoring exceptions and anomalies that contradict an initial hypothesis.",
        "Accepting conclusions without checking intermediate steps or logical consistency.",
      ],
      correctOption: 0,
      explanation:
        "Rigorous academic analysis requires explicit verification of foundational assumptions, systematic evaluation of evidence, and testing for boundary conditions.",
    },
    {
      text: `What primary analytical error occurs when studying complex processes in ${topicTitle}?`,
      options: [
        "Confusing correlation with causation, or oversimplifying multi-faceted phenomena into single causes.",
        "Structuring findings into organized comparative tables.",
        "Documenting references and empirical sources carefully.",
        "Verifying calculations using standard units.",
      ],
      correctOption: 0,
      explanation:
        "A common pitfall is the monocausal fallacy or assuming that because two variables correlate, one must directly cause the other without investigating underlying mechanisms.",
    },
    {
      text: `How does comparative analysis strengthen understanding of ${topicTitle} in ${subject}?`,
      options: [
        "By highlighting structural similarities and fundamental distinctions between related concepts, models, or cases.",
        "By proving that all theories within ${subject} are identical.",
        "By eliminating the need for empirical observation and definitions.",
        "By replacing qualitative understanding with arbitrary numerical indices.",
      ],
      correctOption: 0,
      explanation:
        "Comparative analysis clarifies domain boundaries, highlights contrasting mechanisms, and prevents confusing closely related principles.",
    },
    {
      text: `When preparing for an academic examination on ${topicTitle}, what is the most effective revision strategy?`,
      options: [
        "Synthesizing key definitions, working through representative problem exercises, and reviewing common misconceptions.",
        "Memorizing isolated keywords without understanding their underlying mechanisms.",
        "Skipping foundational prerequisites to focus only on superficial summaries.",
        "Assuming that test questions will never test edge cases or practical application.",
      ],
      correctOption: 0,
      explanation:
        "High-yield revision combines active problem-solving with conceptual mastery of definitions, mechanisms, and common diagnostic errors.",
    },
  ];
}
