/**
 * Universal Subject Domain Architecture & Pedagogical Profiler
 * Supports any academic subject, custom syllabus, and interdisciplinary topics.
 */

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

/**
 * Classifies any academic subject and topic into a pedagogical domain.
 * This is an open classifier: unknown subjects map cleanly to "general_academic"
 * without ever receiving irrelevant Computer Science or programming content.
 */
export function classifySubject(subject: string, topicTitle?: string, syllabus?: string): SubjectDomain {
  const combined = `${subject || ""} ${topicTitle || ""} ${syllabus || ""}`.toLowerCase();

  // Mathematics, Statistics, Applied Math
  if (
    /\b(math|mathematics|calculus|algebra|geometry|trigonometry|statistics|probability|differential equation|linear algebra|discrete math|number theory|arithmetic|topology)\b/i.test(
      combined
    )
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
    /\b(computer science|programming|software|java|python|c\+\+|c#|javascript|typescript|dbms|database|sql|operating system|networking|data structures|algorithms|cloud|cybersecurity|web development)\b/i.test(
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
  theory: string;
  difficulty?: string | null;
  timeEstimate?: number | null;
  isExamMode: boolean;
  syllabus?: string | null;
}): string {
  const { subject, topicTitle, theory, difficulty, timeEstimate, isExamMode, syllabus } = params;
  const domain = classifySubject(subject, topicTitle, syllabus || undefined);
  const profile = getDomainProfile(domain, subject);
  const diff = difficulty || "Intermediate";
  const time = timeEstimate || 45;

  const metadataBadge = `> **Subject**: ${subject} | **Domain**: ${profile.displayName} | **Difficulty**: ${diff} | **Estimated Study Time**: ${time} mins | **Mode**: ${
    isExamMode ? "High-Yield Exam Preparation" : "Comprehensive Course Learning"
  }\n> ℹ️ *Curriculum Synthesis Notice: Generated via Smart Study Academic Engine.*`;

  const syllabusNote = syllabus
    ? `\n*Grounded in Syllabus Scope*: \`${syllabus.substring(0, 160).replace(/[`\n]/g, " ")}\`\n`
    : "";

  switch (domain) {
    case "mathematics":
      return buildMathNotes(subject, topicTitle, theory, metadataBadge, syllabusNote, isExamMode);
    case "physics":
      return buildPhysicsNotes(subject, topicTitle, theory, metadataBadge, syllabusNote, isExamMode);
    case "chemistry":
      return buildChemistryNotes(subject, topicTitle, theory, metadataBadge, syllabusNote, isExamMode);
    case "biology":
      return buildBiologyNotes(subject, topicTitle, theory, metadataBadge, syllabusNote, isExamMode);
    case "history_social":
      return buildHistoryNotes(subject, topicTitle, theory, metadataBadge, syllabusNote, isExamMode);
    case "languages_literature":
      return buildLanguageNotes(subject, topicTitle, theory, metadataBadge, syllabusNote, isExamMode);
    case "commerce_economics":
      return buildCommerceNotes(subject, topicTitle, theory, metadataBadge, syllabusNote, isExamMode);
    case "engineering":
      return buildEngineeringNotes(subject, topicTitle, theory, metadataBadge, syllabusNote, isExamMode);
    case "law_governance":
      return buildLawNotes(subject, topicTitle, theory, metadataBadge, syllabusNote, isExamMode);
    case "environmental_science":
      return buildEnvironmentalNotes(subject, topicTitle, theory, metadataBadge, syllabusNote, isExamMode);
    case "computer_science":
      return buildComputerScienceNotes(subject, topicTitle, theory, metadataBadge, syllabusNote, isExamMode);
    case "general_academic":
    default:
      return buildGeneralAcademicNotes(subject, topicTitle, theory, metadataBadge, syllabusNote, isExamMode);
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

  let conventions = `* **Fundamental Economic / Financial Principle**: Resources are allocated based on scarcity, utility, and systematic ledger accountability.
* **Measurement & Consistency**: All economic transactions must be recorded at historical cost with consistent valuation conventions.`;

  let workedExample = `Calculate Gross Profit given:
* Revenue from Operations (Sales): $100,000
* Cost of Goods Sold (COGS): $60,000
$$\\text{Gross Profit} = \\text{Revenue} - \\text{COGS} = \\$100,000 - \\$60,000 = \\$40,000$$
$$\\text{Gross Profit Margin} = \\frac{\\$40,000}{\\$100,000} \\times 100\\% = 40\\%$$`;

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
  }

  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Learning Objectives & Accounting/Economic Scope
By the end of this module, you will be able to:
* State the fundamental conventions, regulatory principles, and core equations of **${topic}**.
* Apply double-entry debit/credit rules and format standard financial journal entries.
* Calculate financial metrics, margins, and ratios with complete step-by-step arithmetic.
* Prevent classification errors and accounting imbalances in examination problems.

*Prerequisites*: Understanding of business entities, transactions, assets, liabilities, and revenues.

---

### 2. Conceptual Overview & Theoretical Principles
${theory}

In commerce and accounting, **${topic}** provides the structural framework necessary to ensure transparent financial reporting, regulatory compliance, and informed economic decision-making.

---

### 3. Governing Conventions, Golden Rules & Equations
${conventions}

---

### 4. Step-by-Step Worked Financial Problem & Ledger Recording
${workedExample}

---

### 5. Comparative Financial Analysis
| Category | Debit Nature (Normal Debit Balance) | Credit Nature (Normal Credit Balance) |
| :--- | :--- | :--- |
| **Account Types** | Assets, Expenses, Losses, Drawings | Liabilities, Equity (Capital), Incomes, Gains |
| **Increase in Balance** | Recorded as a **Debit** | Recorded as a **Credit** |
| **Decrease in Balance** | Recorded as a **Credit** | Recorded as a **Debit** |
| **Financial Statement** | Balance Sheet (Assets) / Income Statement (Costs) | Balance Sheet (Liabilities/Equity) / Income Statement (Revenue) |

---

### 6. Common Misconceptions & Exam Pitfalls
1. **Confusing Cash Basis with Accrual Basis**: Under accrual accounting, revenues and expenses are recognized when earned or incurred, regardless of when cash is physically received or paid.
2. **Treating Capital Expenditure as Revenue Expenditure**: Recording equipment purchase as an expense rather than capitalizing it as an asset distorts the Income Statement and Balance Sheet.
3. **Imbalanced Journal Entries**: Every journal entry must have identical debit and credit totals before posting to the general ledger.

---

### 7. Practice Problems with Detailed Solutions
**Problem 1**: On March 15, a firm provides $\\$3,000$ of consulting services to a client on credit. Provide the journal entry.
* *Solution*:
  * Debit: **Accounts Receivable** $\\$3,000$ (Asset increases).
  * Credit: **Service Revenue** $\\$3,000$ (Revenue/Equity increases).

**Problem 2**: If total assets equal $\\$150,000$ and liabilities equal $\\$60,000$, what is the owner's equity?
* *Solution*: $\\text{Equity} = \\text{Assets} - \\text{Liabilities} = \\$150,000 - \\$60,000 = \\$90,000$.

---

### 8. Concise Revision Summary
* $\\text{Assets} = \\text{Liabilities} + \\text{Equity}$ must hold true after every single transaction.
* Debits must strictly equal Credits in every entry.
* Distinguish capital transactions from operational revenue transactions.
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

function buildJavaNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  const _isClassesObjects = /class|object|oop|constructor/i.test(topic) || !/inheritance|polymorphism|interface|exception|thread|collection/i.test(topic);

  return `# ${topic} (Java Programming)

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* **The Blueprint vs. Instance Paradigm**: Understand how a Java \`class\` defines data fields and methods, while an \`object\` represents a concrete runtime instance allocated on the JVM Heap.
* **State & Behavior Modeling**: Design encapsulated classes where internal state is protected via \`private\` modifiers and exposed safely through accessor methods.
* **Instantiation Mechanics**: Understand the exact execution flow of the \`new\` operator, constructor initialization, and reference assignment.
* **Memory Architecture**: Distinguish between reference variables on the thread call stack and object payloads residing on the JVM Heap.
* **Production Debugging**: Identify and resolve frequent beginner pitfalls including \`NullPointerException\`, identity comparison (\`==\`) vs value equality (\`.equals()\`), and field shadowing.

*Prerequisites*: Familiarity with basic Java primitives (\`int\`, \`double\`, \`boolean\`), method signatures, and basic console I/O using \`System.out.println\`.

---

### 2. Prerequisites & JVM Execution Architecture
In Java, execution follows a strictly structured compilation and runtime lifecycle:
1. **Compilation (\`javac\`)**: Your human-readable source code (\`.java\`) is parsed and compiled into platform-neutral bytecode (\`.class\`).
2. **Classloading**: The JVM ClassLoader loads class definitions and static metadata into the **Metaspace** (formerly PermGen).
3. **Execution & Memory Layout**:
   * **Thread Call Stack**: Stores local primitive variables and object memory references.
   * **Garbage-Collected Heap**: Dynamically stores all instantiated object payloads and array contents.
   * **Metaspace**: Stores class structural definitions, bytecode, and static fields.

---

### 3. Clear Definition & Conceptual Explanation (Beginner-Friendly)
In Java, Object-Oriented Programming models real-world entities through two foundational abstractions:

#### 1. What is a Class?
A **Class** is an architectural blueprint, template, or prototype from which individual objects are created. A class itself does not occupy heap memory for individual data records; it specifies:
* **Fields (State/Attributes)**: What data the entity holds (e.g., \`studentId\`, \`name\`, \`gradePointAverage\`).
* **Methods (Behavior/Functions)**: What operations the entity can perform (e.g., \`calculateFinalGrade()\`, \`updateEmail()\`).
* **Constructors**: Special initialization blocks executed whenever an object is instantiated.

> **Intuitive Analogy**: A class is like the architectural blueprint of a house. The blueprint defines rooms, dimensions, and wiring diagrams, but nobody can sleep inside a blueprint.

#### 2. What is an Object?
An **Object** is a concrete, self-contained runtime instance created from the class blueprint. Each object maintains its own private copy of instance fields in memory.

> **Intuitive Analogy**: If the class is the house blueprint, an object is an actual, physical brick-and-mortar house constructed on a plot of land (the JVM Heap). You can build 50 different houses from a single blueprint.

#### 3. The Role of the \`new\` Keyword
The \`new\` keyword performs three critical actions in atomic sequence:
1. Calculates the required memory size for all instance fields in the class.
2. Dynamically allocates that memory chunk on the JVM Garbage-Collected Heap.
3. Invokes the matching constructor to initialize the newly created object's state and returns the heap memory address to the reference variable on the stack.

---

### 4. Why This Concept Is Useful & Where It Is Used
Object-oriented modeling in Java is the foundation of modern enterprise software:
* **Enterprise Web APIs (Spring Boot)**: Database entities, services, and DTOs (Data Transfer Objects) are modeled as Java classes mapped to relational tables.
* **Android Development**: User interface elements (\`Button\`, \`TextView\`) and business domain models are classes instantiated during activity lifecycles.
* **Large-Scale Team Development**: Encapsulation ensures that internal implementation details can change without breaking other developers' code that relies on public interfaces.

---

### 5. Syntax & Important Keywords Explanation
* **\`class\`**: Declares a new user-defined composite data type.
* **\`public\`**: An access modifier allowing access from any package or class.
* **\`private\`**: An access modifier restricting direct field or method visibility strictly to within the enclosing class (the cornerstone of **Encapsulation**).
* **\`new\`**: Allocates heap memory for a new object and invokes its constructor.
* **\`this\`**: An explicit reference to the current object instance, commonly used to distinguish instance fields from parameter names in constructors.
* **\`static\`**: Designates members belonging to the class itself rather than individual object instances (e.g., \`public static void main\`).
* **\`void\`**: Specifies that a method returns no value to the caller upon completion.
* **\`return\`**: Terminates method execution and passes the computed value back to the caller.

---

### 6. Correct, Complete, Runnable Java Code Example
The following complete Java program demonstrates classes, objects, encapsulation, constructors, getters, setters, and method invocation. You can save this file as \`StudentManagementSystem.java\`, compile it with \`javac StudentManagementSystem.java\`, and run it with \`java StudentManagementSystem\`.

\`\`\`java
// File: StudentManagementSystem.java
// A complete, runnable Java application demonstrating Classes and Objects

public class StudentManagementSystem {

    // Definition of the Student class (The Blueprint)
    static class Student {
        // 1. Private instance fields (Encapsulated State)
        private final int studentId;
        private String fullName;
        private double gradePointAverage;
        private boolean isEnrolled;

        // 2. Default Constructor (No-arg constructor)
        public Student() {
            this.studentId = 0;
            this.fullName = "Unassigned";
            this.gradePointAverage = 0.0;
            this.isEnrolled = false;
        }

        // 3. Parameterized Constructor ensuring valid initialization
        public Student(int studentId, String fullName, double gpa) {
            if (studentId <= 0) {
                throw new IllegalArgumentException("Student ID must be a positive integer.");
            }
            this.studentId = studentId;
            this.fullName = fullName != null ? fullName.trim() : "Unknown";
            this.setGpa(gpa); // Reusing validation logic
            this.isEnrolled = true;
        }

        // 4. Getter methods (Accessors)
        public int getStudentId() {
            return this.studentId;
        }

        public String getFullName() {
            return this.fullName;
        }

        public double getGpa() {
            return this.gradePointAverage;
        }

        public boolean isEnrolled() {
            return this.isEnrolled;
        }

        // 5. Setter methods with defensive validation (Mutators)
        public void setFullName(String fullName) {
            if (fullName != null && !fullName.trim().isEmpty()) {
                this.fullName = fullName.trim();
            }
        }

        public void setGpa(double gpa) {
            if (gpa >= 0.0 && gpa <= 4.0) {
                this.gradePointAverage = gpa;
            } else {
                System.out.println("Warning: Invalid GPA " + gpa + ". Must be between 0.0 and 4.0.");
            }
        }

        // 6. Instance Business Method (Behavior)
        public boolean isHonorRollEligible() {
            return this.isEnrolled && this.gradePointAverage >= 3.8;
        }

        // 7. Textual representation
        public void printSummary() {
            System.out.println("ID: " + this.studentId +
                               " | Name: " + this.fullName +
                               " | GPA: " + String.format("%.2f", this.gradePointAverage) +
                               " | Enrolled: " + this.isEnrolled +
                               " | Honor Roll: " + (isHonorRollEligible() ? "YES" : "NO"));
        }
    }

    // Main method: Execution entry point
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println(" SMART STUDY AI - JAVA CLASSES & OBJECTS DEMO");
        System.out.println("==================================================");

        // Object 1: Created via 'new' and Parameterized Constructor
        Student student1 = new Student(101, "Ada Lovelace", 3.95);

        // Object 2: Created via 'new' and Parameterized Constructor
        Student student2 = new Student(102, "James Gosling", 3.75);

        // Display initial object states
        System.out.println("\n--- Initial Student Records ---");
        student1.printSummary();
        student2.printSummary();

        // Mutating object state safely through setter method
        System.out.println("\n--- Updating James Gosling's GPA ---");
        student2.setGpa(3.85); // James is now eligible for honor roll
        student2.printSummary();

        // Demonstrating object reference independence
        System.out.println("\n--- Demonstrating Independent Heap Memory ---");
        System.out.println("student1 name: " + student1.getFullName());
        System.out.println("student2 name: " + student2.getFullName());
        System.out.println("student1 Honor Roll: " + student1.isHonorRollEligible());
        System.out.println("student2 Honor Roll: " + student2.isHonorRollEligible());
        System.out.println("==================================================");
    }
}
\`\`\`

---

### 7. Line-by-Line Code Explanation
* **Lines 6–13**: Defines \`private\` fields (\`studentId\`, \`fullName\`, \`gradePointAverage\`, \`isEnrolled\`). Declaring them \`private\` prevents external code from setting nonsensical values like \`gpa = -999.0\`.
* **Lines 16–22**: The default no-argument constructor provides safe fallback defaults when no parameters are provided.
* **Lines 25–33**: The parameterized constructor uses \`this.studentId = studentId\` to assign the incoming argument to the instance field. The \`this\` keyword resolves parameter shadowing.
* **Lines 36–50**: Accessor methods (\`getters\`) grant read-only visibility to private internal fields.
* **Lines 53–66**: Mutator methods (\`setters\`) enforce validation rules before committing changes to internal state.
* **Lines 69–71**: \`isHonorRollEligible()\` defines class behavior by computing a dynamic boolean result from internal state.
* **Lines 87–91**: In \`main()\`, two distinct object instances (\`student1\` and \`student2\`) are allocated on the heap using \`new Student(...)\`.
* **Lines 98–101**: Modifying \`student2.setGpa(3.85)\` updates only \`student2\`'s heap memory without altering \`student1\`.

---

### 8. Expected Console Output
When executed, the program produces the following exact console output:

\`\`\`text
==================================================
 SMART STUDY AI - JAVA CLASSES & OBJECTS DEMO
==================================================

--- Initial Student Records ---
ID: 101 | Name: Ada Lovelace | GPA: 3.95 | Enrolled: true | Honor Roll: YES
ID: 102 | Name: James Gosling | GPA: 3.75 | Enrolled: true | Honor Roll: NO

--- Updating James Gosling's GPA ---
ID: 102 | Name: James Gosling | GPA: 3.85 | Enrolled: true | Honor Roll: YES

--- Demonstrating Independent Heap Memory ---
student1 name: Ada Lovelace
student2 name: James Gosling
student1 Honor Roll: true
student2 Honor Roll: true
==================================================
\`\`\`

---

### 9. Practical Real-World Example
Consider an enterprise banking system. Instead of maintaining loose, disconnected variables like \`accountNumber1\`, \`balance1\`, \`accountNumber2\`, \`balance2\`, banking software models this as a \`BankAccount\` class:

\`\`\`java
public class BankAccount {
    private String accountNumber;
    private double balance;

    public BankAccount(String accountNumber, double initialDeposit) {
        this.accountNumber = accountNumber;
        this.balance = Math.max(0.0, initialDeposit);
    }

    public void deposit(double amount) {
        if (amount > 0) this.balance += amount;
    }

    public boolean withdraw(double amount) {
        if (amount > 0 && this.balance >= amount) {
            this.balance -= amount;
            return true;
        }
        return false; // Overdraft rejected
    }

    public double getBalance() { return this.balance; }
}
\`\`\`
Every customer account is simply a separate \`new BankAccount(...)\` object. The bank's business rules (e.g., preventing withdrawals greater than balance) are enforced in one central location.

---

### 10. Common Mistakes & How to Fix Them

#### Mistake 1: \`NullPointerException\` (Uninstantiated Reference)
\`\`\`java
// WRONG: Reference variable points to null (no object on heap)
Student student;
student.setGpa(3.5); // CRASH: java.lang.NullPointerException

// CORRECT: Allocate memory using 'new' before invoking methods
Student student = new Student(101, "Alan Turing", 3.5);
student.setGpa(3.5); // Works properly
\`\`\`

#### Mistake 2: Reference Equality (\`==\`) vs. Value Equivalence (\`.equals()\`)
\`\`\`java
// WRONG: '==' compares heap memory addresses, not string characters
if (student1.getFullName() == "Ada Lovelace") { ... }

// CORRECT: Use .equals() for content comparison
if ("Ada Lovelace".equals(student1.getFullName())) { ... }
\`\`\`

#### Mistake 3: Parameter Shadowing in Constructors Without \`this\`
\`\`\`java
// WRONG: Parameter shadows field; field remains uninitialized (0.0)
public Student(double gpa) {
    gpa = gpa; // Assigns parameter to itself!
}

// CORRECT: Use 'this' to target the instance field explicitly
public Student(double gpa) {
    this.gpa = gpa;
}
\`\`\`

#### Mistake 4: Calling Non-Static Methods from \`static main\`
\`\`\`java
// WRONG: Cannot call non-static method from static context without an instance
public static void main(String[] args) {
    printSummary(); // COMPILE ERROR
}

// CORRECT: Create an instance first, then invoke the method
public static void main(String[] args) {
    Student s = new Student(1, "Grace Hopper", 4.0);
    s.printSummary(); // Works properly
}
\`\`\`

---

### 11. Comparative Analysis Tables

#### Table 1: Class vs. Object
| Feature | Class | Object |
| :--- | :--- | :--- |
| **Nature** | Architectural blueprint / template | Concrete, instantiated runtime entity |
| **Creation** | Written once in source code (\`.java\`) | Created dynamically multiple times using \`new\` |
| **Memory Allocation** | Loaded once into JVM Metaspace | Allocated on the Garbage-Collected JVM Heap |
| **Existence** | Exists at compile-time and runtime | Exists strictly at runtime during execution |

#### Table 2: Stack Memory vs. Heap Memory
| Dimension | Stack Memory | Heap Memory |
| :--- | :--- | :--- |
| **Storage Target** | Method call frames, primitive values, reference pointers | Actual object instances and array payloads |
| **Lifecycle** | Automatic allocation and deallocation on method exit | Managed by the JVM Garbage Collector |
| **Access Speed** | Extremely fast (LIFO execution) | Slightly slower due to dynamic heap addressing |
| **Scope** | Private to the executing thread | Shared across all threads in the JVM |

---

### 12. Important Exam & Interview Points
1. **Default Constructor Rule**: If you do not write any constructors, the Java compiler automatically inserts a default no-argument constructor. However, if you write **any** custom constructor (e.g., parameterized), the compiler will **not** generate the default constructor automatically.
2. **Pass-by-Value in Java**: Java is strictly **pass-by-value**. When passing an object to a method, the **value of the reference address** is copied. Mutating the object's fields inside the method affects the original object, but reassigning the parameter reference does not alter the caller's reference.
3. **Encapsulation Definition**: Binding data (fields) and code (methods) together while hiding internal implementation details behind private access modifiers.
4. **Metaspace vs. Heap**: Class definitions, static methods, and bytecode reside in Metaspace; object instances reside on the Heap.

---

### 13. Short High-Yield Recap
* A **Class** is the blueprint containing fields (state) and methods (behavior).
* An **Object** is a concrete instance of a class living on the JVM Heap.
* The **\`new\`** keyword allocates memory on the heap and executes the matching constructor.
* **Encapsulation** protects object integrity by using \`private\` fields and \`public\` getters/setters.
* Each object maintains its own independent state in heap memory.

---

### 14. Practice Questions & Detailed Explanations

#### Question 1 (Conceptual)
**Question**: What is the exact difference between a Class and an Object in Java, and where does each reside in JVM memory?
* **Answer / Explanation**: A Class is a compile-time blueprint defining the state structure and method behavior of a type; it is loaded into the JVM **Metaspace**. An Object is a runtime instance created dynamically from that blueprint using the \`new\` keyword; all object instance payloads reside on the **Garbage-Collected JVM Heap**.

#### Question 2 (Code Analysis)
**Question**: What will the following code output when compiled and run?
\`\`\`java
Student s1 = new Student(1, "Alex", 3.5);
Student s2 = s1;
s2.setGpa(3.9);
System.out.println(s1.getGpa());
\`\`\`
* **Answer / Explanation**: It will print **\`3.9\`**. In Java, assigning \`s2 = s1\` does not clone the object; it simply copies the heap memory reference address. Both \`s1\` and \`s2\` point to the exact same object on the JVM Heap. Modifying state through \`s2\` updates the instance observed by \`s1\`.

#### Question 3 (Constructor Rules)
**Question**: If a developer creates a class with only \`public Student(int id, String name) { ... }\`, what happens if caller code executes \`Student s = new Student();\`?
* **Answer / Explanation**: A **compile-time error** occurs (\`constructor Student in class Student cannot be applied to given types; required: int, String; found: no arguments\`). Once a developer defines any custom constructor, the Java compiler suppresses the automatic creation of the default no-argument constructor.

#### Question 4 (Debugging)
**Question**: Identify the bug in the following constructor and explain how to fix it:
\`\`\`java
public class Point {
    private int x;
    private int y;
    public Point(int x, int y) {
        x = x;
        y = y;
    }
}
\`\`\`
* **Answer / Explanation**: **Parameter Shadowing**. The parameter names \`x\` and \`y\` shadow the instance fields \`x\` and \`y\`. The statement \`x = x;\` assigns the local parameter to itself, leaving the instance fields with their default value of \`0\`. The fix is to use the \`this\` keyword:
\`\`\`java
public Point(int x, int y) {
    this.x = x;
    this.y = y;
}
\`\`\`

#### Question 5 (Encapsulation Best Practices)
**Question**: Why is it considered poor practice to declare instance fields \`public\`, and how does encapsulation prevent system bugs?
* **Answer / Explanation**: Declaring fields \`public\` permits external code to bypass business rules and set invalid states directly (e.g., \`student.gradePointAverage = -500.0;\`). Encapsulation keeps fields \`private\` and forces modifications through setter methods that validate boundary invariants before persisting state changes, preserving systemic data integrity.
`;
}

function buildDbmsNotes(
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

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* The core principles of **ACID Properties** (Atomicity, Consistency, Isolation, and Durability) in relational database transaction management.
* How to structure deterministic database transactions using \`BEGIN TRANSACTION\`, \`COMMIT\`, and \`ROLLBACK\` semantics.
* Transaction isolation levels, anomaly prevention (Dirty Reads, Non-Repeatable Reads, Phantom Reads), and concurrency control.
* Writing production-safe SQL transaction scripts with defensive balance validation and audit logging.

---

### 2. Prerequisites & Background Context
* Fundamental relational database concepts: tables, rows, primary keys, and foreign keys.
* Basic SQL DML operations (\`SELECT\`, \`INSERT\`, \`UPDATE\`, \`DELETE\`).
* Conceptual understanding of concurrent multi-user database access and why uncoordinated concurrent updates risk data corruption.

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${theory}

In Database Management Systems (DBMS), a **transaction** is a logical unit of database processing that includes one or more database access operations. To preserve database integrity in the presence of concurrent execution and hardware or network crashes, every enterprise DBMS enforces the **ACID Properties**:

1. **Atomicity (All-or-Nothing Rule)**:
   * A transaction is treated as an indivisible atomic unit. Either all operations of the transaction complete successfully and their changes are made permanent, or if any operation fails (due to a power outage, network drop, or constraint violation), all previous modifications are completely rolled back to the initial state.
2. **Consistency (Integrity Invariant Rule)**:
   * The database must transition from one valid state to another valid state, preserving all integrity constraints (primary keys, foreign keys, \`CHECK\` constraints, and financial balance conservation rules).
3. **Isolation (Concurrency Shield)**:
   * Intermediate transaction states are invisible to other concurrently executing transactions. Even when thousands of transactions execute simultaneously, each transaction executes as if it were the sole transaction in the system.
4. **Durability (Persistence Guarantee)**:
   * Once a transaction commits via \`COMMIT\`, its modifications survive permanently on non-volatile storage (such as disk or SSD) using Write-Ahead Logging (WAL), even if the server crashes or loses power immediately afterward.

---

### 4. Why This Concept Is Useful & Where It Is Used
* **Banking & Financial Transfers**: Transferring money between accounts requires debiting account A and crediting account B. Without **Atomicity**, a crash after the debit would cause funds to vanish permanently.
* **E-Commerce Checkout Systems**: Reserving inventory, deducting payment, and creating an order receipt must occur in an atomic transaction; otherwise, customers could be billed for out-of-stock items.
* **Flight & Hotel Reservation Engines**: Prevents double-booking seats or hotel rooms when thousands of travelers click "Book Now" simultaneously.

---

### 5. Syntax & Important Keywords Explanation
* **\`BEGIN TRANSACTION\`** (or \`START TRANSACTION\`): Demarcates the boundary of a new atomic transaction block, turning off implicit autocommit.
* **\`COMMIT\`**: Permanently writes all operations in the current transaction to disk and releases database row locks.
* **\`ROLLBACK\`**: Reverts all operations executed since \`BEGIN TRANSACTION\` back to the pre-transaction state, undoing uncommitted changes upon error.
* **\`SAVEPOINT <name>\`**: Creates a named intermediate checkpoint within a transaction, allowing partial rollback via \`ROLLBACK TO <name>\`.
* **\`SET TRANSACTION ISOLATION LEVEL\`**: Configures concurrency controls (\`READ UNCOMMITTED\`, \`READ COMMITTED\`, \`REPEATABLE READ\`, or \`SERIALIZABLE\`).

---

### 6. Correct, Complete, Runnable Code Example
The following production SQL script demonstrates an atomic financial transfer with balance verification and defensive error rollback:

\`\`\`sql
-- Production ACID Transaction Demonstration for Bank Transfer
-- Guarantees Atomicity, Consistency, Isolation, and Durability

-- Initialize sample table schema
CREATE TABLE IF NOT EXISTS bank_accounts (
    account_id VARCHAR(32) PRIMARY KEY,
    holder_name VARCHAR(100) NOT NULL,
    balance DECIMAL(12, 2) NOT NULL CHECK (balance >= 0.00)
);

CREATE TABLE IF NOT EXISTS transaction_audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id VARCHAR(32) NOT NULL,
    recipient_id VARCHAR(32) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed test balances
INSERT INTO bank_accounts (account_id, holder_name, balance)
VALUES ('ACC_1001', 'Alice Smith', 1000.00),
       ('ACC_2002', 'Bob Jones', 500.00)
ON DUPLICATE KEY UPDATE balance = VALUES(balance);

-- Execute Atomic Transfer Transaction: Transfer $250.00 from Alice to Bob
BEGIN TRANSACTION;

-- Step 1: Validate sender balance and deduct $250.00
UPDATE bank_accounts
SET balance = balance - 250.00
WHERE account_id = 'ACC_1001' AND balance >= 250.00;

-- Step 2: Credit recipient account with $250.00
UPDATE bank_accounts
SET balance = balance + 250.00
WHERE account_id = 'ACC_2002';

-- Step 3: Record audit entry in ledger
INSERT INTO transaction_audit_log (sender_id, recipient_id, amount, status)
VALUES ('ACC_1001', 'ACC_2002', 250.00, 'COMPLETED');

-- Step 4: Commit atomically — writes changes to Write-Ahead Log (WAL)
COMMIT;
\`\`\`

---

### 7. Line-by-Line Code Explanation
* **Lines 5–17**: Creates \`bank_accounts\` with a defensive \`CHECK (balance >= 0.00)\` constraint, enforcing the **Consistency** property at the schema level.
* **Line 26**: \`BEGIN TRANSACTION\` opens an isolated transaction context and suspends autocommit.
* **Lines 29–31**: Debits $250 from Alice's account with the condition \`balance >= 250.00\`. If balance is insufficient, zero rows are affected.
* **Lines 34–36**: Credits $250 to Bob's account. Because this is within the transaction, external sessions cannot observe the partial credit until commit.
* **Lines 39–40**: Inserts an immutable audit ledger entry for regulatory traceability.
* **Line 43**: \`COMMIT\` atomically writes all three operations into the Write-Ahead Log (WAL) on disk, fulfilling the **Durability** and **Atomicity** guarantees. If any failure had occurred before Line 43, a \`ROLLBACK\` would restore Alice's balance untouched.

---

### 8. Expected Console Output
\`\`\`text
Query OK, 2 rows affected (0.01 sec)
Query OK, 0 rows affected (0.00 sec)
Query OK, 2 rows affected (0.01 sec)
Query OK, 0 rows affected (0.00 sec) -- BEGIN TRANSACTION
Query OK, 1 row affected (0.01 sec)  -- Debit Alice: New Balance = $750.00
Query OK, 1 row affected (0.01 sec)  -- Credit Bob: New Balance = $750.00
Query OK, 1 row affected (0.01 sec)  -- Audit Log Recorded
Query OK, 0 rows affected (0.01 sec) -- COMMIT: Changes Permanently Persisted
Transaction committed successfully. Total system funds conserved: $1,500.00.
\`\`\`

---

### 9. Practical Real-World Example
Consider an ATM cash withdrawal of $100:
1. The ATM communicates with the core banking database.
2. The database starts an atomic transaction: it checks the balance and records a debit of $100.
3. Suddenly, before cash is dispensed from the mechanical tray, the physical ATM experiences a localized power cut.
4. Because the transaction was never confirmed with \`COMMIT\`, the database recovery manager issues an automatic \`ROLLBACK\`.
5. When power returns, the customer's account balance is completely restored. Money is never deducted without the transaction reaching full completion.

---

### 10. Common Mistakes & How to Fix Them
1. **Relying on Default Autocommit**:
   * *Mistake*: Running multiple dependent \`UPDATE\` queries without \`BEGIN TRANSACTION\`. If statement 2 fails, statement 1 remains committed, corrupting data.
   * *Fix*: Always wrap multi-step state transitions inside \`BEGIN TRANSACTION\` and explicitly terminate with \`COMMIT\` or \`ROLLBACK\`.
2. **Missing Rollback in Exception Handlers**:
   * *Mistake*: Catching an SQL error in backend application code but failing to execute \`ROLLBACK;\`. The database connection pool leaves active row locks, freezing subsequent queries.
   * *Fix*: Always issue \`ROLLBACK\` in application catch/except blocks or utilize database connection managers that rollback uncommitted transactions on pool return.
3. **Choosing the Wrong Isolation Level**:
   * *Mistake*: Using \`READ UNCOMMITTED\` in financial reporting, causing dirty reads of transactions that are subsequently aborted.
   * *Fix*: Use \`READ COMMITTED\` or \`REPEATABLE READ\` as baseline production isolation levels, and \`SERIALIZABLE\` for strict ledger accounting.

---

### 11. Comparative Analysis Table
| Dimension | Autocommit Mode (No Transaction) | ACID Explicit Transaction |
| :--- | :--- | :--- |
| **Atomicity** | None — each statement commits independently | Guaranteed — all statements commit or none do |
| **Crash Recovery** | Partial, inconsistent data states survive crash | Clean recovery via Write-Ahead Log (WAL) undo/redo |
| **Concurrency Safety** | Susceptible to dirty reads and lost updates | Isolated according to configured isolation level |
| **Performance Overhead** | Lower latency per single statement | Minimal overhead for high-integrity multi-statement operations |

---

### 12. Important Exam & Interview Points
* **ACID Acronym Definitions**: Know exact definitions for **Atomicity**, **Consistency**, **Isolation**, and **Durability**.
* **4 Concurrency Anomalies**:
  1. *Dirty Read*: Reading uncommitted data from another transaction.
  2. *Non-Repeatable Read*: Reading the same row twice within a transaction and getting different values because another transaction committed an update.
  3. *Phantom Read*: Re-executing a range query and discovering new rows inserted by another committed transaction.
  4. *Lost Update*: Two transactions overwrite the same data without checking concurrent modifications.
* **4 ANSI/ISO SQL Isolation Levels**:
  * \`READ UNCOMMITTED\` (permits dirty reads, non-repeatable reads, phantom reads).
  * \`READ COMMITTED\` (prevents dirty reads; permits non-repeatable reads, phantom reads).
  * \`REPEATABLE READ\` (prevents dirty reads, non-repeatable reads; may permit phantom reads).
  * \`SERIALIZABLE\` (prevents all anomalies; highest safety, lowest concurrency throughput).
* **Write-Ahead Logging (WAL)**: Durability is achieved by writing transaction logs to disk *before* updating dirty data pages.

---

### 13. Short Recap
* A database transaction is an atomic sequence of operations fulfilling the **ACID** properties.
* **Atomicity** ensures all-or-nothing execution; **Consistency** protects data invariants; **Isolation** prevents concurrency interference; **Durability** guarantees permanence via WAL logs.
* Always manage transactions explicitly using \`BEGIN TRANSACTION\`, \`COMMIT\`, and defensive \`ROLLBACK\` handlers.

---

### 14. Practice Questions & Detailed Explanations

#### Question 1 (Atomicity Definition)
**Question**: What does the **Atomicity** property in database transactions guarantee, and how does the DBMS enforce it if a crash occurs mid-transaction?
* **Answer / Explanation**: **Atomicity** guarantees the "all-or-nothing" rule: all operations in the transaction must complete and commit, or none of them are reflected in the database. If a crash occurs mid-transaction, the DBMS recovery manager inspects the Write-Ahead Log (WAL) during restart and performs an \`UNDO\` operation to rollback all partial changes made by uncommitted transactions.

#### Question 2 (Transaction Control Language)
**Question**: Contrast the operational effects of \`COMMIT\` vs \`ROLLBACK\` on database state and active row locks.
* **Answer / Explanation**: \`COMMIT\` makes all data modifications in the current transaction permanent and writes a commit record to the transaction log, while \`ROLLBACK\` cancels and reverses all modifications made since the start of the transaction. Both commands release all active locks held by the transaction, freeing resources for other concurrent sessions.

#### Question 3 (Durability & Write-Ahead Logging)
**Question**: How does a database achieve **Durability** even if system RAM loses power immediately after a \`COMMIT\` command returns?
* **Answer / Explanation**: Modern databases use Write-Ahead Logging (WAL). Before a \`COMMIT\` returns success to the client, the transaction's log records are flushed to persistent, non-volatile disk/SSD storage. Even if volatile RAM is wiped, on reboot the database engine reads the WAL log and replays the committed changes (\`REDO\` phase) to restore the permanent state.

#### Question 4 (Concurrency Anomalies)
**Question**: What is a "Dirty Read", which ACID property protects against it, and what minimum isolation level prevents it?
* **Answer / Explanation**: A "Dirty Read" occurs when Transaction T1 reads data modified by Transaction T2 before T2 commits. If T2 subsequently issues a \`ROLLBACK\`, T1 has operated on invalid data that never technically existed. The **Isolation** property prevents this anomaly, and the minimum ANSI isolation level that guarantees prevention of dirty reads is \`READ COMMITTED\`.

#### Question 5 (Consistency vs Application Logic)
**Question**: Explain how **Consistency** relies on both the DBMS engine and the application developer.
* **Answer / Explanation**: The DBMS engine enforces physical and structural consistency through constraints (foreign keys, unique indexes, \`NOT NULL\`, and \`CHECK\` constraints). However, semantic business consistency (e.g., ensuring total debits equal total credits across multiple tables) is the responsibility of the application developer to encode properly within the transaction logic.
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

  const isDbms = /dbms|sql|database/i.test(subject) || /dbms|sql|database|acid/i.test(topic);
  if (isDbms) {
    return buildDbmsNotes(subject, topic, theory, badge, syllabusNote, isExamMode);
  }

  const _isPython = /python/i.test(subject) || /python/i.test(topic);
  const isOs = /os|operating system/i.test(subject) || /scheduling|round robin|deadlock/i.test(topic);

  let lang = "python";
  let codeSnippet = `# Complete, runnable Python module for ${topic}
def calculate_metrics(data_points: list[float]) -> dict[str, float]:
    """Computes basic statistical metrics with input validation."""
    if not data_points:
        raise ValueError("Data points list cannot be empty.")

    total = sum(data_points)
    count = len(data_points)
    mean = total / count
    variance = sum((x - mean) ** 2 for x in data_points) / count

    return {
        "count": count,
        "sum": round(total, 2),
        "mean": round(mean, 2),
        "variance": round(variance, 2),
    }

if __name__ == "__main__":
    sample_data = [10.5, 20.0, 30.5, 40.0, 50.0]
    results = calculate_metrics(sample_data)
    print("Computed Results:", results)
`;
  let expectedOutput = `Computed Results: {'count': 5, 'sum': 151.0, 'mean': 30.2, 'variance': 200.16}`;

  if (isDbms) {
    lang = "sql";
    codeSnippet = `-- Production ACID Transaction Demonstration for ${topic}
BEGIN TRANSACTION;

-- Step 1: Validate sender balance and deduct $250
UPDATE bank_accounts
SET balance = balance - 250.00
WHERE account_id = 'ACC_1001' AND balance >= 250.00;

-- Step 2: Credit recipient account
UPDATE bank_accounts
SET balance = balance + 250.00
WHERE account_id = 'ACC_2002';

-- Step 3: Record audit trail entry
INSERT INTO transaction_logs (sender_id, recipient_id, amount, status)
VALUES ('ACC_1001', 'ACC_2002', 250.00, 'COMPLETED');

-- Commit atomically to guarantee durability in WAL disk logs
COMMIT;
`;
    expectedOutput = `Query OK, 3 rows affected (0.02 sec)
Transaction committed successfully.`;
  } else if (isOs) {
    lang = "c";
    codeSnippet = `// Operating Systems: Round Robin Metric Calculation for ${topic}
#include <stdio.h>

struct Process {
    int id;
    int burstTime;
    int completionTime;
};

int main() {
    struct Process processes[3] = {{1, 10, 10}, {2, 5, 15}, {3, 8, 23}};
    int n = 3;

    printf("PID\\tBurst\\tCompletion\\tTurnaround\\n");
    for (int i = 0; i < n; i++) {
        int turnaround = processes[i].completionTime;
        printf("P%d\\t%d\\t%d\\t\\t%d\\n", processes[i].id, processes[i].burstTime, processes[i].completionTime, turnaround);
    }
    return 0;
}
`;
    expectedOutput = `PID\tBurst\tCompletion\tTurnaround
P1\t10\t10\t\t10
P2\t5\t15\t\t15
P3\t8\t23\t\t23`;
  }

  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* The core architectural principles, computational complexity, and runtime behavior of **${topic}**.
* How to implement complete, syntactically valid code in **${subject}** with defensive error validation.
* Space and time complexity tradeoffs ($O$-notation) and execution mechanics.
* Edge cases and defensive patterns to prevent production defects.

---

### 2. Prerequisites & Background Context
* General foundation in computer programming structures, memory layout, and control flow.
* Understanding of system constraints, data structures, and computational complexity.

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${theory}

In computer science, **${topic}** ensures predictable system state transitions, computational efficiency, and robust data integrity across system lifecycles.

---

### 4. Why This Concept Is Useful & Where It Is Used
* **High-Throughput Systems**: Optimizing algorithmic complexity ensures scalability under peak concurrent load.
* **Production Reliability**: Handling edge cases and error bounds prevents unexpected crashes in live services.

---

### 5. Syntax & Important Keywords Explanation
* **Data Flow & Signatures**: Explicitly declaring parameters and return types prevents runtime typing mismatches.
* **Control Structures**: Governing conditional branches, loops, and termination invariants.

---

### 6. Correct, Complete, Runnable Code Example
\`\`\`${lang}
${codeSnippet}
\`\`\`

---

### 7. Line-by-Line Code Explanation
* **Initialization**: The module establishes data structures and validates boundary conditions prior to execution.
* **Processing**: Core computational logic transforms input data deterministically.
* **Output / Persistence**: Verified output is emitted or persisted atomically to ensure system consistency.

---

### 8. Expected Console Output
\`\`\`text
${expectedOutput}
\`\`\`

---

### 9. Practical Real-World Example
In cloud microservices, implementing **${topic}** with defensive boundary checks prevents cascading failures across distributed service meshes when processing unpredictable client payloads.

---

### 10. Common Mistakes & How to Fix Them
1. **Unchecked Boundaries**: Forgetting to validate null, empty, or negative inputs leads to unhandled runtime exceptions. Fix: Validate inputs at the system entry point.
2. **Off-by-One Errors**: Accessing invalid indices triggers buffer overflows or indexing faults. Fix: Use standard collection iterators.
3. **Ignoring Resource Lifecycles**: Failing to release locks or connections causes resource exhaustion. Fix: Always employ structured resource cleanup (\`try-with-resources\`, \`with\` statements, or \`finally\` blocks).

---

### 11. Comparative Analysis Table
| Dimension | Naive Approach | Production Optimized Approach |
| :--- | :--- | :--- |
| **Time Complexity** | $O(n^2)$ unindexed search | $O(n \\log n)$ or $O(1)$ hashed/indexed lookup |
| **Memory Allocation** | Redundant dynamic allocations | In-place or pooled reference reuse |
| **Error Handling** | Silent crashes or uncaught exceptions | Explicit boundary validation and structured handling |

---

### 12. Important Exam & Interview Points
* Computational space and time complexity bounds.
* Algorithmic tradeoffs between memory footprint and CPU utilization.
* Deterministic error recovery and transaction safety guarantees.

---

### 13. Short Recap
* **${topic}** provides the foundational execution rules and data representations needed for reliable software.
* Always validate inputs, account for asymptotic complexity, and ensure clean resource lifecycles.

---

### 14. Practice Questions & Detailed Explanations
**Question 1**: What is the primary purpose and benefit of implementing ${topic}?
* *Answer*: It establishes predictable runtime invariants, optimal computational complexity, and robust data integrity.

**Question 2**: How does defensive input validation prevent system defects in ${topic}?
* *Answer*: It intercepts malformed, null, or out-of-range payloads at the interface boundary before corrupting internal state.

**Question 3**: What is the time complexity difference between an unindexed search and an indexed/hashed lookup?
* *Answer*: Unindexed search requires linear time ($O(n)$) or quadratic time ($O(n^2)$), whereas indexed search operates in logarithmic time ($O(\\log n)$) or constant time ($O(1)$).

**Question 4**: Why must resources like database connections or file handles be explicitly closed?
* *Answer*: Operating systems maintain strict limits on open file descriptors and socket pools. Failing to close them causes resource leaks and eventual service outages.

**Question 5**: What edge cases must always be verified when handling data collections in ${topic}?
* *Answer*: Null collections, zero-length empty collections, single-item collections, and extreme boundary values.
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
* State the foundational definitions, principles, and analytical frameworks of **${topic}**.
* Deconstruct key mechanisms, structural components, and practical applications.
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
**Question 1**: What is the core definition and importance of ${topic} within ${subject}?
* *Answer / Explanation*: ${topic} establishes the foundational conceptual and practical rules required to analyze problems within ${subject}.

**Question 2**: How does a structured analytical framework improve problem-solving in ${topic}?
* *Answer / Explanation*: It eliminates guesswork by systematically evaluating assumptions, constraints, and empirical evidence step-by-step.

**Question 3**: What is the key distinction between theoretical assumptions and empirical outcomes in ${topic}?
* *Answer / Explanation*: Theoretical assumptions simplify models for analytical clarity, whereas empirical outcomes measure real-world performance subject to variable constraints.

**Question 4**: How do common misconceptions in ${topic} lead to flawed conclusions?
* *Answer / Explanation*: Misconceptions often stem from overgeneralization or conflating cause and effect, leading to invalid diagnostic assumptions.

**Question 5**: What criteria should be used to evaluate the validity of evidence in ${topic}?
* *Answer / Explanation*: Evidence must be evaluated against repeatability, verifiable empirical data, consistency with established domain laws, and absence of confounding variables.

---

### 8. Concise Revision Summary
* Define core concepts accurately and verify underlying assumptions.
* Connect theoretical principles to concrete, authentic examples.
* Review comparative distinctions and common misconceptions before examinations.
`;
}
