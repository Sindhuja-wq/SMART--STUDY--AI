import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIContentDetailed } from "@/lib/ai";
import { classifySubject, getDomainProfile, SubjectDomain, detectCourseSubjectAndDomain, normalizeAcademicTitle, determineTopicDifficulty, estimateTopicDuration, generateTopicTheoryDescription } from "@/lib/subjectDomains";

interface GeneratedTopicInput {
  title: string;
  theory: string;
  timeEstimate: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  videoUrl?: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roadmaps = await prisma.roadmap.findMany({
      where: { userId: session.user.id },
      include: {
        topics: {
          select: {
            id: true,
            title: true,
            theory: true,
            isUnlocked: true,
            quizScore: true,
            order: true,
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ roadmaps });
  } catch (error: unknown) {
    console.error("Roadmap list fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      title?: string;
      subject?: string;
      syllabus?: string;
      examDate?: string;
      dailyStudyTime?: string | number;
      type?: "EXAM" | "COURSE";
      examLevel?: string;
      knowledgeLevel?: string;
    };

    const { title, subject, syllabus, examDate, dailyStudyTime, type, examLevel, knowledgeLevel } = body;

    if (!title || !subject || !dailyStudyTime || !type) {
      return NextResponse.json(
        { error: "Missing required fields (title, subject, dailyStudyTime, type)" },
        { status: 400 }
      );
    }

    const studyMinutes = Math.max(15, Math.min(480, Number(dailyStudyTime) || 60));
    let examDateObj: Date | null = null;
    let daysLeft = 30;

    if (type === "EXAM") {
      if (!examDate) {
        return NextResponse.json({ error: "Exam date is required for exam preparation mode" }, { status: 400 });
      }
      examDateObj = new Date(examDate);
      if (isNaN(examDateObj.getTime())) {
        return NextResponse.json({ error: "Invalid exam date provided" }, { status: 400 });
      }

      const diffMs = examDateObj.getTime() - Date.now();
      daysLeft = Math.ceil(diffMs / (1000 * 3600 * 24));
      if (daysLeft < 0) {
        return NextResponse.json({ error: "Exam date cannot be in the past" }, { status: 400 });
      }
    }

    const courseInfo = detectCourseSubjectAndDomain(subject, syllabus);
    const effectiveSubject = courseInfo.subject || subject;
    const domain = courseInfo.domain || classifySubject(effectiveSubject, title, syllabus);
    const domainProfile = getDomainProfile(domain, effectiveSubject);

    const systemPrompt = `You are a distinguished university curriculum architect and senior academic director specializing in ${domainProfile.displayName}.
Construct an authoritative, progressive learning roadmap tailored specifically for "${effectiveSubject}".
PEDAGOGICAL DISCIPLINE FOCUS: ${domainProfile.pedagogicalFocus}
OUTPUT SPECIFICATION:
Respond ONLY with a valid JSON array of milestone topic objects with the exact schema:
[
  {
    "title": "Clear Topic Title",
    "theory": "Substantive pedagogical description of key concepts, formulas, mechanisms, or principles covered in this milestone.",
    "timeEstimate": 60,
    "difficulty": "Beginner|Intermediate|Advanced"
  }
]
CRITICAL RULES:
1. Every milestone MUST relate directly to "${subject}". Do NOT include generic Computer Science or software programming topics unless the subject is Computer Science.
2. If a custom syllabus is provided, treat it as the primary scope and map the syllabus units directly into sequential milestones in exact order, starting with Unit 1 (do NOT insert a broad combined overview module ahead of Unit 1 unless explicitly requested as an overview).
3. Assign appropriate difficulty labels: introductory definitions, types, and foundational concepts MUST be marked "Beginner", core mechanisms "Intermediate", and advanced algorithms or proofs "Advanced".
4. Estimate realistic study times for each milestone based on topic scope and complexity (between 30 and 150 minutes), avoiding identical durations across all milestones.
5. Provide substantive pedagogical descriptions of core mechanisms without generic template phrases.
6. Respond ONLY with valid raw JSON. No markdown fences, no conversational preamble.`;

    let userPrompt = "";
    if (type === "EXAM") {
      userPrompt = `Build an intensive, syllabus-aligned Exam Preparation study schedule for:
Subject: "${subject}"
${examLevel ? `Target Exam Level / Type: "${examLevel}"` : ""}
${knowledgeLevel ? `Student's Current Knowledge Level: "${knowledgeLevel}"` : ""}
Time Remaining Until Examination: ${daysLeft} days
Daily Dedicated Study Commitment: ${studyMinutes} minutes per day
${
  syllabus
    ? `Mandatory Syllabus & Priority Chapters:\n"""\n${syllabus}\n"""\nEnsure EVERY requested chapter/unit from the syllabus is represented in the sequential milestones.`
    : "Ensure complete curriculum coverage spanning foundational principles to high-yield exam problem areas."
}

Generate 6 to 8 sequential milestone topics structured for exam success:
- Phase 1: Core Definitions, Foundational Principles & Governing Rules
- Phase 2: In-Depth Mechanisms, Methodologies & Structural Derivations
- Phase 3: Step-by-Step Worked Problems & Advanced Applications
- Phase 4: Formula / Rule Sheets, Common Misconceptions & Exam Traps
- Phase 5: Practice Problem Solving & Mock Assessment Review
- Phase 6: High-Yield Revision & Final Exam Readiness

Respond ONLY with a valid JSON array.`;
    } else {
      userPrompt = `Build a comprehensive, self-paced mastery curriculum for:
Subject: "${subject}"
${knowledgeLevel ? `Student's Starting Level: "${knowledgeLevel}"` : ""}
Daily Dedicated Time: ${studyMinutes} minutes
${
  syllabus
    ? `Student's Syllabus / Focus Topics:\n"""\n${syllabus}\n"""\nEnsure the curriculum covers each requested topic.`
    : "Build a comprehensive curriculum progressing smoothly from introductory foundations to advanced mastery."
}

Generate 6 to 8 sequential, cohesive milestone topics.
Respond ONLY with a valid JSON array.`;
    }

    let generatedTopics: GeneratedTopicInput[] = [];

    try {
      const genResult = await generateAIContentDetailed({
        systemPrompt,
        prompt: userPrompt,
        formatJson: true,
        temperature: 0.25,
        maxTokens: 2500,
        timeoutMs: 25000,
      });

      if (genResult.content) {
        const cleanedJson = genResult.content.replace(/```json\s*|```/g, "").trim();
        const parsed = JSON.parse(cleanedJson) as unknown;
        const candidateArray = Array.isArray(parsed)
          ? parsed
          : (parsed as { topics?: unknown[]; roadmap?: unknown[] })?.topics ||
            (parsed as { topics?: unknown[]; roadmap?: unknown[] })?.roadmap ||
            [];

        if (Array.isArray(candidateArray) && candidateArray.length >= 3) {
          for (const item of candidateArray) {
            const t = item as Partial<GeneratedTopicInput>;
            if (t && typeof t.title === "string" && typeof t.theory === "string") {
              const rawT = t.title.trim();
              const diff: "Beginner" | "Intermediate" | "Advanced" =
                t.difficulty === "Beginner" || t.difficulty === "Advanced" || t.difficulty === "Intermediate"
                  ? t.difficulty
                  : determineTopicDifficulty(rawT, rawT, undefined, domain);
              const est =
                typeof t.timeEstimate === "number" && t.timeEstimate > 0
                  ? t.timeEstimate
                  : estimateTopicDuration(rawT, rawT, diff, studyMinutes);

              generatedTopics.push({
                title: rawT,
                theory: t.theory.trim(),
                timeEstimate: est,
                difficulty: diff,
                videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                  `${subject} ${rawT} tutorial`
                )}`,
              });
            }
          }
        }
      }
    } catch (err: unknown) {
      console.warn("[Roadmap Generation] AI model generation encountered error. Activating subject-aware curriculum architect:", err);
    }

    // Adaptive Curriculum Fallback if AI provider is offline or returned invalid JSON
    if (generatedTopics.length === 0) {
      generatedTopics = buildSubjectAwareMilestoneRoadmap({
        subject: effectiveSubject,
        domain,
        syllabus,
        studyMinutes,
        isExamMode: type === "EXAM",
        daysLeft,
      });
    }

    // Persist new roadmap and its topics in database transaction
    const newRoadmap = await prisma.$transaction(async (tx) => {
      const rm = await tx.roadmap.create({
        data: {
          userId: session.user.id,
          title: title.trim(),
          subject: effectiveSubject.trim(),
          syllabus: syllabus ? syllabus.trim() : null,
          type,
          examDate: examDateObj,
          dailyStudyTime: studyMinutes,
        },
      });

      const topicCreations = generatedTopics.map((topic, index) =>
        tx.topic.create({
          data: {
            roadmapId: rm.id,
            title: topic.title,
            theory: topic.theory,
            timeEstimate: topic.timeEstimate,
            difficulty: topic.difficulty,
            videoUrl: topic.videoUrl,
            order: index + 1,
            isUnlocked: index === 0, // Unlock the first milestone initially
          },
        })
      );

      await Promise.all(topicCreations);
      return rm;
    });

    return NextResponse.json({ success: true, roadmapId: newRoadmap.id });
  } catch (error: unknown) {
    console.error("Roadmap creation API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Builds a subject-grounded milestone roadmap when AI is offline.
 * Directly maps user's custom syllabus if provided, or produces
 * discipline-appropriate milestones with ZERO Computer Science bias for non-CS subjects.
 */
function buildSubjectAwareMilestoneRoadmap(params: {
  subject: string;
  domain: SubjectDomain;
  syllabus?: string | null;
  studyMinutes: number;
  isExamMode: boolean;
  daysLeft: number;
}): GeneratedTopicInput[] {
  const { subject, domain, syllabus, studyMinutes, isExamMode } = params;

  // 1. If user supplied a custom syllabus, parse each line/chapter directly
  if (syllabus && syllabus.trim().length > 10) {
    const courseInfo = detectCourseSubjectAndDomain(subject, syllabus);
    if (courseInfo.topics.length >= 2) {
      const selectedTopics = courseInfo.topics.slice(0, 8);
      const cleanSub = normalizeAcademicTitle(courseInfo.subject || subject) || "Computer Science";
      return selectedTopics.map((item) => {
        const cleanTitle = normalizeAcademicTitle(item.cleanTitle || item.title);
        const originalHasUnit = /^(?:unit|chapter|module|part|section|\d+[\.\:\-\)])\s*\d*/i.test(item.title);
        const milestoneTitle = originalHasUnit
          ? normalizeAcademicTitle(item.title)
          : (item.unitNumber ? `Unit ${item.unitNumber}: ${cleanTitle}` : cleanTitle);

        const diff = determineTopicDifficulty(item.title, cleanTitle, item.unitNumber, domain);
        const timeEst = estimateTopicDuration(item.title, cleanTitle, diff, studyMinutes);
        const theoryStr = generateTopicTheoryDescription(item.title, cleanTitle, cleanSub, item.unitNumber);

        return {
          title: milestoneTitle,
          theory: theoryStr,
          timeEstimate: timeEst,
          difficulty: diff,
          videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            `${cleanSub} ${cleanTitle} lecture`
          )}`,
        };
      });
    }
  }

  // 2. Domain-tailored academic milestones
  let milestones: Array<{ title: string; diff: "Beginner" | "Intermediate" | "Advanced"; theory: string }> = [];

  switch (domain) {
    case "mathematics":
      milestones = [
        {
          title: `${subject} Foundations, Notation & Core Axioms`,
          diff: "Beginner",
          theory: "Master fundamental algebraic definitions, domain invariants, variable constraints, and basic operations.",
        },
        {
          title: "Analytical Formulations & Equation Derivations",
          diff: "Beginner",
          theory: "Derive standard governing equations, analytical formulas, and explore algebraic properties systematically.",
        },
        {
          title: "Step-by-Step Worked Problems & Solution Methods",
          diff: "Intermediate",
          theory: "Work through multi-step computational problems with complete intermediate arithmetic and back-substitution checks.",
        },
        {
          title: "Advanced Transformations & Geometric Interpretations",
          diff: "Intermediate",
          theory: "Connect algebraic solutions to geometric representations, graphical curves, and parameter sensitivity.",
        },
        {
          title: "Boundary Conditions & Edge Cases in Mathematical Modeling",
          diff: "Advanced",
          theory: "Analyze indeterminate forms, asymptotic behavior, domain boundary constraints, and complex roots.",
        },
        {
          title: isExamMode ? "High-Yield Exam Review & Formula Sheet" : "Comprehensive Review & Problem Synthesis",
          diff: "Advanced",
          theory: "Review comprehensive formulas, computational shortcuts, diagnostic traps, and multi-concept problem synthesis.",
        },
      ];
      break;

    case "physics":
      milestones = [
        {
          title: `${subject} Fundamental Principles & SI Units`,
          diff: "Beginner",
          theory: "Fundamental physical quantities, SI base units, dimensional analysis, and frame of reference assumptions.",
        },
        {
          title: "Governing Physical Laws & Mathematical Formulation",
          diff: "Beginner",
          theory: "Physical laws, vector components, force and energy relationships, and governing equations.",
        },
        {
          title: "Free-Body Diagrams & Analytical Problem Solving",
          diff: "Intermediate",
          theory: "Isolating systems, constructing free-body diagrams, applying conservation laws, and solving multi-body problems.",
        },
        {
          title: "Energy Transformations & Conservation Principles",
          diff: "Intermediate",
          theory: "Work-energy theorems, kinetic and potential energy conversions, power dissipation, and conservation laws.",
        },
        {
          title: "Limiting Cases, Dimensional Checks & Physical Misconceptions",
          diff: "Advanced",
          theory: "Evaluating physical limiting behavior, verifying dimensional consistency, and avoiding conceptual exam traps.",
        },
        {
          title: isExamMode ? "High-Yield Numerical Practice & Exam Preparation" : "Advanced Physical Applications & Synthesis",
          diff: "Advanced",
          theory: "Exam-oriented numerical problem sets, unit verification drills, and consolidated physical law sheets.",
        },
      ];
      break;

    case "chemistry":
      milestones = [
        {
          title: `${subject} Molecular Foundations & Stoichiometric Principles`,
          diff: "Beginner",
          theory: "Atomic structure, valence configurations, chemical nomenclature, and balancing chemical equations.",
        },
        {
          title: "Chemical Bonding, Intermolecular Forces & Molecular Geometry",
          diff: "Beginner",
          theory: "Ionic and covalent bonds, Lewis structures, molecular polarity, and VSEPR geometrical arrangements.",
        },
        {
          title: "Reaction Mechanisms, Catalysis & Energetics",
          diff: "Intermediate",
          theory: "Step-by-step reaction pathways, transition states, activation energy, and catalyst acceleration.",
        },
        {
          title: "Chemical Equilibrium, Le Chatelier & Thermodynamics",
          diff: "Intermediate",
          theory: "Equilibrium constant expressions, Le Chatelier's principle, enthalpy (ΔH), and entropy (ΔS) drivers.",
        },
        {
          title: "Quantitative Stoichiometric Calculations & Laboratory Safety",
          diff: "Advanced",
          theory: "Limiting reagents, theoretical and percent yield calculations, titration analysis, and chemical safety.",
        },
        {
          title: isExamMode ? "High-Yield Reaction Sheet & Exam Problem Review" : "Integrated Synthesis & Advanced Applications",
          diff: "Advanced",
          theory: "Consolidated reaction roadmap, common stoichiometry pitfalls, and multi-step synthesis problem solving.",
        },
      ];
      break;

    case "biology":
      milestones = [
        {
          title: `${subject} Cellular Architecture & Biomolecular Foundations`,
          diff: "Beginner",
          theory: "Cellular structures, organelle compartmentalization, membrane transport mechanisms, and essential biological macromolecules.",
        },
        {
          title: "Structure-Function Relationships in Biological Systems",
          diff: "Beginner",
          theory: "How specialized cellular and anatomical structures dictate biochemical and physiological performance.",
        },
        {
          title: "Biochemical Pathways & Cellular Energy Transductions",
          diff: "Intermediate",
          theory: "Sequential enzymatic pathways, electron transport, bioenergetic cycles, and metabolic regulation.",
        },
        {
          title: "Regulatory Mechanisms & Homeostatic Feedback Loops",
          diff: "Intermediate",
          theory: "Negative and positive feedback systems, hormonal and nervous signal transduction, and physiological balance.",
        },
        {
          title: "Genetic, Evolutionary & Ecological Interconnections",
          diff: "Advanced",
          theory: "DNA replication, gene expression, evolutionary adaptations, and trophic interactions across ecosystems.",
        },
        {
          title: isExamMode ? "Diagnostic Exam Review & High-Yield Concept Maps" : "Advanced Biological Synthesis & Case Studies",
          diff: "Advanced",
          theory: "Diagnostic comparison of biological stages, common terminology traps, and comprehensive concept review.",
        },
      ];
      break;

    case "history_social":
      milestones = [
        {
          title: `${subject} Historical Context & Chronological Foundations`,
          diff: "Beginner",
          theory: "Geopolitical setting, institutional background, and the chronological timeline leading into the era.",
        },
        {
          title: "Underlying Structural & Ideological Causes",
          diff: "Beginner",
          theory: "Long-term economic currents, social transformations, ideological movements, and institutional tensions.",
        },
        {
          title: "Key Historical Actors, Decisions & Turning Points",
          diff: "Intermediate",
          theory: "Critical turning points, key leaders, diplomatic negotiations, and institutional responses during major crises.",
        },
        {
          title: "Short-Term Outcomes & Institutional Transformations",
          diff: "Intermediate",
          theory: "Treaties, legislative enactments, boundary realignments, and immediate socio-political reorganizations.",
        },
        {
          title: "Long-Term Historical Legacy & Historiographical Perspectives",
          diff: "Advanced",
          theory: "Evaluating long-term consequences, differing historiographical interpretations, and contemporary relevance.",
        },
        {
          title: isExamMode ? "Essay Practice, Cause-and-Effect Matrix & Exam Review" : "Historical Synthesis & Thematic Review",
          diff: "Advanced",
          theory: "Structuring analytical history essays, cause-and-effect synthesis, and reviewing common historical myths.",
        },
      ];
      break;

    case "languages_literature":
      milestones = [
        {
          title: `${subject} Grammatical Foundations & Syntax Rules`,
          diff: "Beginner",
          theory: "Parts of speech, sentence clauses, core grammatical agreement, and syntactic structures.",
        },
        {
          title: "Subject-Verb & Pronoun-Antecedent Agreement Mastery",
          diff: "Beginner",
          theory: "Detailed rules for singular/plural agreement, intervening phrases, compound subjects, and inverted orders.",
        },
        {
          title: "Advanced Sentence Mechanics, Modifiers & Parallelism",
          diff: "Intermediate",
          theory: "Correcting dangling modifiers, run-on sentences, comma splices, and faulty parallelism in prose.",
        },
        {
          title: "Rhetorical Devices, Tone & Literary Interpretation",
          diff: "Intermediate",
          theory: "Identifying figurative language, analyzing stylistic nuance, rhetorical appeals, and textual themes.",
        },
        {
          title: "Academic Writing Structure & Analytical Composition",
          diff: "Advanced",
          theory: "Constructing thesis statements, supporting arguments with textual evidence, and editing for precision.",
        },
        {
          title: isExamMode ? "Error Identification Drills & Exam Review Sheet" : "Polished Composition & Advanced Linguistics",
          diff: "Advanced",
          theory: "Frequent grammar error traps, punctuation rules summary, and guided examination practice exercises.",
        },
      ];
      break;

    case "commerce_economics":
      milestones = [
        {
          title: `${subject} Foundational Principles & Accounting/Economic Frameworks`,
          diff: "Beginner",
          theory: "Core economic models, accounting conventions, business entity assumptions, and fundamental equations.",
        },
        {
          title: "The Double-Entry System, Ledgers & Transaction Recording",
          diff: "Beginner",
          theory: "Golden rules of accounting, debit and credit classification, journalizing transactions, and general ledger posting.",
        },
        {
          title: "Financial Statements Preparation & Valuation Mechanics",
          diff: "Intermediate",
          theory: "Preparing Income Statements, Balance Sheets, trial balances, and understanding revenue recognition.",
        },
        {
          title: "Financial Ratio Analysis & Economic Decision Making",
          diff: "Intermediate",
          theory: "Profitability, liquidity, and solvency ratios, market elasticity, cost structures, and break-even calculations.",
        },
        {
          title: "Adjusting Entries, Depreciation & Auditing Safeguards",
          diff: "Advanced",
          theory: "Accruals and deferrals, depreciation methods, bank reconciliations, and internal control frameworks.",
        },
        {
          title: isExamMode ? "High-Yield Worked Calculations & Exam Preparation" : "Comprehensive Business & Economic Synthesis",
          diff: "Advanced",
          theory: "Step-by-step numerical accounting problem sets, common classification traps, and format summaries.",
        },
      ];
      break;

    case "engineering":
      milestones = [
        {
          title: `${subject} Engineering Principles & Governing Laws`,
          diff: "Beginner",
          theory: "Core physical and mathematical principles, equilibrium equations, and dimensional consistency.",
        },
        {
          title: "Constitutive Equations & Material Constraints",
          diff: "Beginner",
          theory: "Stress-strain relationships, material properties, elastic limits, and boundary condition modeling.",
        },
        {
          title: "Analytical System Modeling & Derivations",
          diff: "Intermediate",
          theory: "Deriving governing system models, transfer functions, energy equations, and design equations.",
        },
        {
          title: "Worked Numerical Calculations & Factor of Safety (FoS)",
          diff: "Intermediate",
          theory: "Applying safety factors, calculating design tolerances, load capacities, and thermal/mechanical stresses.",
        },
        {
          title: "Practical Design Constraints & Failure Mode Analysis",
          diff: "Advanced",
          theory: "Fatigue, buckling, thermal expansion, environmental degradation, and industrial standards compliance.",
        },
        {
          title: isExamMode ? "Exam Design Problems & Engineering Formula Sheet" : "Advanced Engineering Synthesis & Design Project",
          diff: "Advanced",
          theory: "Exam problem calculation drills, consolidated equation sheets, and multi-variable design synthesis.",
        },
      ];
      break;

    case "law_governance":
      milestones = [
        {
          title: `${subject} Jurisprudential Context & Statutory Foundations`,
          diff: "Beginner",
          theory: "Constitutional framework, legislative statutes, sources of law, and doctrine of judicial precedent.",
        },
        {
          title: "Core Legal Doctrines & Elements of Liability",
          diff: "Beginner",
          theory: "Deconstructing legal tests into duty, breach, causation, and remedies across substantive legal domains.",
        },
        {
          title: "Landmark Precedents & Judicial Interpretation",
          diff: "Intermediate",
          theory: "Analyzing landmark case law, distinguishing ratio decidendi from obiter dicta, and appellate decisions.",
        },
        {
          title: "Factual Problem Application & Legal Reasoning (IRAC)",
          diff: "Intermediate",
          theory: "Applying the IRAC method (Issue, Rule, Application, Conclusion) to complex hypothetical fact scenarios.",
        },
        {
          title: "Statutory Interpretation & Conflicting Precedents",
          diff: "Advanced",
          theory: "Canons of statutory construction, reconciling divergent judicial authorities, and policy considerations.",
        },
        {
          title: isExamMode ? "Hypothetical Problem Drills & Legal Exam Strategy" : "Advanced Legal Analysis & Synthesis",
          diff: "Advanced",
          theory: "Model problem question answers, counter-argument analysis, and revision of essential statutory sections.",
        },
      ];
      break;

    case "computer_science":
      milestones = [
        {
          title: `${subject} Foundations, Syntax & Runtime Architecture`,
          diff: "Beginner",
          theory: "Language fundamentals, type system, runtime environment, memory model, and development workflow.",
        },
        {
          title: "Control Structures, Collections & Data Manipulation",
          diff: "Beginner",
          theory: "Control flow, collection types, iterative patterns, input validation, and defensive data handling.",
        },
        {
          title: "Modular Design, Encapsulation & Abstraction",
          diff: "Intermediate",
          theory: "Classes, functions, interfaces, modular decoupling, exception handling, and resource lifecycle management.",
        },
        {
          title: "Data Structures & Algorithmic Complexity (O-Notation)",
          diff: "Intermediate",
          theory: "Evaluating time and space complexity, indexing mechanics, and selecting optimal algorithms.",
        },
        {
          title: "Concurrency, Edge Cases & Performance Tuning",
          diff: "Advanced",
          theory: "Asynchronous patterns, thread safety, edge case validation, memory leak prevention, and debugging.",
        },
        {
          title: isExamMode ? "Exam Coding Traps, Syntax Reference & Practice Drills" : "Production Systems & Architecture Patterns",
          diff: "Advanced",
          theory: "Reviewing common coding bugs, off-by-one traps, reference vs value equality, and mock coding problems.",
        },
      ];
      break;

    case "general_academic":
    default:
      milestones = [
        {
          title: `${subject} Conceptual Foundations & Terminology`,
          diff: "Beginner",
          theory: "Foundational concepts, essential terminology, historical evolution, and analytical frameworks.",
        },
        {
          title: "Core Theoretical Models & Governing Principles",
          diff: "Beginner",
          theory: "Deconstructing fundamental models, categorization criteria, and structural mechanisms.",
        },
        {
          title: "Step-by-Step Analytical Applications & Methodologies",
          diff: "Intermediate",
          theory: "Applying theoretical principles to concrete case studies, worked examples, and problem solving.",
        },
        {
          title: "Comparative Analysis & Key Disciplinary Distinctions",
          diff: "Intermediate",
          theory: "Comparing competing paradigms, evaluating empirical evidence, and distinguishing related concepts.",
        },
        {
          title: "Advanced Scenarios, Constraints & Critical Evaluations",
          diff: "Advanced",
          theory: "Testing boundary conditions, questioning assumptions, and analyzing contemporary debates.",
        },
        {
          title: isExamMode ? "Comprehensive Exam Review & Self-Assessment" : "Curriculum Synthesis & Mastery Project",
          diff: "Advanced",
          theory: "High-yield review summary, self-test practice questions, and synthesized conceptual overview.",
        },
      ];
      break;
  }

  return milestones.map((m) => ({
    title: m.title,
    theory: m.theory,
    timeEstimate: studyMinutes,
    difficulty: m.diff,
    videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${subject} ${m.title} tutorial`)}`,
  }));
}
