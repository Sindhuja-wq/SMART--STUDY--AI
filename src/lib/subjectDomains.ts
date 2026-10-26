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
          "Syntactically valid, runnable code in the exact language appropriate for the subject, theoretical mechanisms, computational complexity, memory management, edge cases, and debugging.",
        requiredElements: [
          "Conceptual definition and architectural role",
          "Syntactically valid, complete code examples in the topic language",
          "Line-by-line explanation of code mechanics and console output",
          "Time and space algorithmic complexity analysis where relevant",
          "Edge case handling (null states, boundaries, resource lifecycle)",
          "Common coding bugs, misconceptions, and exam traps",
        ],
        forbiddenElements: [
          "Generic dummy placeholder functions like executePattern()",
          "Non-functional pseudocode masquerading as complete runnable syntax",
        ],
        systemRole: "distinguished computer science professor and principal software systems architect",
        notesStructure: [
          "1. Topic Title & Learning Objectives",
          "2. Prerequisites & Architectural Context",
          "3. Core Concept Overview & Memory/Execution Mechanics",
          "4. Syntactically Valid, Runnable Code Implementation",
          "5. Algorithmic Complexity & Edge Case Analysis",
          "6. Comparative Analysis Table",
          "7. Common Coding Traps, Misconceptions & Exam Pitfalls",
          "8. Practice Exercises & Solutions",
          "9. High-Yield Revision Summary",
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

function buildComputerScienceNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  const isJava = /java/i.test(subject) || /java/i.test(topic);
  const isPython = /python/i.test(subject) || /python/i.test(topic);
  const isDbms = /dbms|sql|database/i.test(subject) || /dbms|sql|database|acid/i.test(topic);
  const isOs = /os|operating system/i.test(subject) || /scheduling|round robin|deadlock/i.test(topic);
  const titleLower = topic.toLowerCase();

  let lang = "java";
  let code = `// Demonstration of ${topic}
public class Demonstration {
    public static void main(String[] args) {
        System.out.println("Executing core logic for ${topic}");
    }
}`;

  let specializedBreakdown = `* **System Architecture**: Deconstructs foundational interfaces, execution pipelines, and data representations.
* **State & Lifecycle**: Clean state transitions and memory management ensure high availability and predictable operations.`;

  if (isJava && (titleLower.includes("class") || titleLower.includes("object") || titleLower.includes("oop"))) {
    lang = "java";
    specializedBreakdown = `* **Class as Blueprint**: A class defines state (fields) and behavior (methods) loaded once into JVM Metaspace.
* **Object as Heap Instance**: An object is an instantiated concrete realization created dynamically via \`new\` and allocated on the Garbage-Collected JVM Heap.
* **Encapsulation**: Internal object state is protected by declaring fields \`private\` and providing controlled public accessors (getters) and mutators (setters).
* **Constructor Initialization**: Constructors initialize newly instantiated heap objects to a consistent, valid state before exposure to caller threads.
* **Stack vs Heap Separation**: Object references reside on the thread call stack; actual object payload data resides on the JVM heap.`;

    code = `// Production Java: Classes, Objects, and Encapsulation
public class Student {
    // 1. Encapsulated instance fields (State)
    private final int studentId;
    private String fullName;
    private double gradePointAverage;

    // 2. Parameterized Constructor ensuring valid initialization
    public Student(int studentId, String fullName, double gpa) {
        if (studentId <= 0) throw new IllegalArgumentException("Invalid student ID");
        this.studentId = studentId;
        this.fullName = fullName;
        this.gradePointAverage = Math.max(0.0, Math.min(4.0, gpa));
    }

    // 3. Encapsulated Public Behavior (Methods)
    public int getStudentId() { return studentId; }
    public String getFullName() { return fullName; }
    public double getGpa() { return gradePointAverage; }

    public void updateGpa(double newGpa) {
        if (newGpa >= 0.0 && newGpa <= 4.0) {
            this.gradePointAverage = newGpa;
        }
    }

    public static void main(String[] args) {
        // Heap allocation via 'new' keyword
        Student scholar = new Student(101, "Ada Lovelace", 3.95);
        System.out.println("Scholar: " + scholar.getFullName() + " | GPA: " + scholar.getGpa());
    }
}`;
  } else if (isDbms && (titleLower.includes("acid") || titleLower.includes("transaction"))) {
    lang = "sql";
    specializedBreakdown = `* **Atomicity**: The "All-or-Nothing" transaction guarantee. If any statement fails or the system crashes, the entire transaction is rolled back via undo logs.
* **Consistency**: The database transitions only between valid states, preserving all schema integrity constraints (Primary Keys, Foreign Keys, Check constraints).
* **Isolation**: Intermediate uncommitted states of concurrent transactions remain invisible to each other, preventing anomalies according to the configured isolation level.
* **Durability**: Once a transaction is committed, its modifications survive crashes, power outages, and system restarts through Write-Ahead Logging (WAL) fsync disk flushes.`;

    code = `-- ACID Transaction in Relational DBMS (PostgreSQL / MySQL)
BEGIN TRANSACTION;

-- Step 1: Deduct $500 from Account 101 (Atomicity & Consistency check)
UPDATE accounts
SET balance = balance - 500
WHERE account_id = 101 AND balance >= 500;

-- Step 2: Credit $500 to Account 202
UPDATE accounts
SET balance = balance + 500
WHERE account_id = 202;

-- If constraints are satisfied, commit atomically and persist to WAL:
COMMIT;`;
  } else if (isOs && (titleLower.includes("round robin") || titleLower.includes("scheduling"))) {
    lang = "c";
    specializedBreakdown = `* **Preemptive Scheduling**: CPU allocation is granted for a fixed time quantum before forced preemption.
* **Circular Ready Queue**: Processes are maintained in a FIFO circular queue. Preempted processes return to the tail of the queue.
* **Turnaround & Waiting Metrics**: Turnaround Time ($TAT = CT - AT$) and Waiting Time ($WT = TAT - BT$) quantify scheduling efficiency.`;

    code = `// Operating Systems: Round Robin Scheduling Metric Calculation
#include <stdio.h>

struct Process {
    int id;
    int burstTime;
    int completionTime;
    int turnaroundTime;
    int waitingTime;
};

void calculateMetrics(struct Process p[], int n, int arrivalTime) {
    for (int i = 0; i < n; i++) {
        p[i].turnaroundTime = p[i].completionTime - arrivalTime;
        p[i].waitingTime = p[i].turnaroundTime - p[i].burstTime;
        printf("P%d: BT=%d, CT=%d, TAT=%d, WT=%d\\n",
               p[i].id, p[i].burstTime, p[i].completionTime, p[i].turnaroundTime, p[i].waitingTime);
    }
}`;
  } else if (isPython) {
    lang = "python";
    code = `# Clean, idiomatic Python implementation for ${topic}
def execute_workflow(items: list[int]) -> dict[str, float]:
    """Processes numeric data with clean validation."""
    if not items:
        raise ValueError("Collection cannot be empty")

    total = sum(items)
    avg = total / len(items)
    return {"count": len(items), "sum": total, "average": round(avg, 2)}

if __name__ == "__main__":
    sample = [12, 24, 36, 48]
    result = execute_workflow(sample)
    print(f"Computed Result: {result}")`;
  }

  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Learning Objectives & Prerequisites
By the end of this module, you will be able to:
* Define and explain the architecture, data structures, and lifecycle of **${topic}**.
* Write syntactically valid, runnable code in **${subject}** with defensive error handling.
* Analyze computational time and space complexity ($O$-notation).
* Diagnose edge cases (null inputs, boundary conditions) and runtime defects.

*Prerequisites*: Core programming constructs, control flow, functions, and memory basics.

---

### 2. Comprehensive Concept Overview & Execution Mechanics
${theory}

In computer science, **${topic}** ensures robust system design, predictable runtime state transitions, and clean modularity.

---

### 3. Key Concepts & Structural Breakdown
${specializedBreakdown}

---

### 4. Technical Implementation & Runnable Syntax
\`\`\`${lang}
${code}
\`\`\`

---

### 5. Algorithmic Complexity & Edge Cases
* **Time Complexity**: Optimal execution paths ensure operations complete within predictable algorithmic bounds ($O(1)$, $O(\\log n)$, or $O(n)$).
* **Space Complexity**: Efficient memory allocation prevents memory leaks and excessive heap pressure.
* **Edge Case Verification**: Always inspect null states, empty collections, and boundary extremes.

---

### 6. Comparative Analysis Table
| Dimension | Standard Approach | Optimized Approach |
| :--- | :--- | :--- |
| **Time Complexity** | $O(n^2)$ naive search / traversal | $O(n \\log n)$ or $O(1)$ indexed access |
| **Memory Allocation** | Redundant object creation on heap | In-place or cached reference reuse |
| **Error Handling** | Unchecked runtime crash | Defensive parameter validation and structured exceptions |

---

### 7. Common Coding Misconceptions & Exam Traps
1. **Confusing Reference Equality with Value Equality**: In languages like Java or Python, checking reference identity (\`==\` in Java) differs from checking logical value equivalence (\`.equals()\`).
2. **Overlooking Off-by-One Indices**: Accessing array index $n$ for an array of length $n$ triggers runtime index-out-of-bounds exceptions.
3. **Swallowing Exceptions Silently**: Catching exceptions in empty blocks hides defects and complicates root-cause isolation.

---

### 8. Practice Exercises & Solutions
**Exercise 1**: What is the primary advantage of defensive input validation?
* *Solution*: It rejects invalid inputs at system boundaries before corrupting application state or triggering unhandled exceptions.

---

### 9. High-Yield Revision Summary
* Ensure code is complete, syntactically valid, and cleanly formatted.
* Account for edge cases and time/space complexity trade-offs.
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
* *Explanation*: ${topic} establishes the foundational conceptual and practical rules required to analyze problems within ${subject}.

**Question 2**: How does a structured analytical framework improve problem-solving in ${topic}?
* *Explanation*: It eliminates guesswork by systematically evaluating assumptions, constraints, and empirical evidence step-by-step.

---

### 8. Concise Revision Summary
* Define core concepts accurately and verify underlying assumptions.
* Connect theoretical principles to concrete, authentic examples.
* Review comparative distinctions and common misconceptions before examinations.
`;
}
