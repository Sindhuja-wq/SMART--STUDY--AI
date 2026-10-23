import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIContent } from "@/lib/ai";

interface GeneratedTopicInput {
  title: string;
  theory: string;
  timeEstimate: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  videoUrl?: string;
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
    };

    const { title, subject, syllabus, examDate, dailyStudyTime, type } = body;

    if (!title || !subject || !dailyStudyTime || !type) {
      return NextResponse.json({ error: "Missing required fields (title, subject, dailyStudyTime, type)" }, { status: 400 });
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

    const systemPrompt = `You are a curriculum architect specializing in higher education and technical curriculum design.
You will construct a logical, step-by-step learning roadmap for "${subject}".
The output MUST be a valid JSON array of objects with the exact keys:
[{"title": "...", "theory": "...", "timeEstimate": 45, "difficulty": "Beginner|Intermediate|Advanced"}]
Respond ONLY with raw JSON. No markdown backticks.`;

    let prompt = "";
    if (type === "EXAM") {
      prompt = `Student is preparing for an exam on "${subject}".
${syllabus ? `Syllabus / Focus Areas:\n"${syllabus}"\n` : "Ensure complete core curriculum coverage."}
Time Remaining: ${daysLeft} days.
Daily Study Time: ${studyMinutes} minutes.
Design 5 to 8 sequential milestone topics prioritized for exam success, progressing from foundational to high-yield advanced topics.
Respond ONLY with a valid JSON array of topic objects.`;
    } else {
      prompt = `Student wants to master "${subject}" from foundations to advanced.
${syllabus ? `Student's Goals / Custom Syllabus:\n"${syllabus}"\n` : "Build a comprehensive full-stack curriculum."}
Dedicated Daily Time: ${studyMinutes} minutes.
Design 6 to 8 sequential, cohesive milestone topics.
Respond ONLY with a valid JSON array of topic objects.`;
    }

    let generatedTopics: GeneratedTopicInput[] = [];

    try {
      const rawJson = await generateAIContent({
        systemPrompt,
        prompt,
        formatJson: true,
        temperature: 0.25,
        maxTokens: 2500,
        timeoutMs: 25000,
      });

      if (rawJson) {
        const cleanedJson = rawJson.replace(/```json\s*|```/g, "").trim();
        const parsed = JSON.parse(cleanedJson) as unknown;
        const candidateArray = Array.isArray(parsed)
          ? parsed
          : (parsed as { topics?: unknown[]; roadmap?: unknown[] })?.topics ||
            (parsed as { topics?: unknown[]; roadmap?: unknown[] })?.roadmap ||
            [];

        if (Array.isArray(candidateArray) && candidateArray.length > 0) {
          for (const item of candidateArray) {
            const t = item as Partial<GeneratedTopicInput>;
            if (t && typeof t.title === "string" && typeof t.theory === "string") {
              const diff: "Beginner" | "Intermediate" | "Advanced" =
                t.difficulty === "Beginner" || t.difficulty === "Advanced" ? t.difficulty : "Intermediate";
              const est = typeof t.timeEstimate === "number" && t.timeEstimate > 0 ? t.timeEstimate : studyMinutes;

              generatedTopics.push({
                title: t.title.trim(),
                theory: t.theory.trim(),
                timeEstimate: est,
                difficulty: diff,
                videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                  `${subject} ${t.title} tutorial`
                )}`,
              });
            }
          }
        }
      }
    } catch (err: unknown) {
      console.warn("AI generation failed for roadmap. Employing syllabus-grounded curriculum architect fallback:", err);
    }

    // Adaptive Curriculum Architect Fallback if AI provider is offline or returned empty
    if (generatedTopics.length === 0) {
      const syllabusLines = (syllabus || "")
        .split(/\n|,|;/)
        .map((s) => s.replace(/^[\d\.\-\*\•\)]+\s*/, "").trim())
        .filter((s) => s.length > 2);

      if (syllabusLines.length >= 2) {
        // Build curriculum directly from student's custom syllabus items
        generatedTopics = syllabusLines.slice(0, 10).map((line, idx) => {
          const totalItems = Math.min(syllabusLines.length, 10);
          const diff: "Beginner" | "Intermediate" | "Advanced" =
            idx === 0 ? "Beginner" : idx < totalItems - 2 ? "Intermediate" : "Advanced";
          return {
            title: line,
            theory: `Fundamental architectural principles, core mechanisms, syntax rules, and problem-solving strategies for ${line} in ${subject}.`,
            timeEstimate: studyMinutes,
            difficulty: diff,
            videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
              `${subject} ${line} tutorial`
            )}`,
          };
        });
      } else {
        // Subject-tailored progressions
        const normSub = subject.toLowerCase().trim();
        let templates: Array<{ title: string; diff: "Beginner" | "Intermediate" | "Advanced"; theory: string }> = [
          {
            title: `${subject} Fundamentals & Core Architecture`,
            diff: "Beginner",
            theory: `Master foundational principles, setup environments, core data representations, and standard conventions in ${subject}.`,
          },
          {
            title: "Control Flow, State Management & Logic Traversal",
            diff: "Beginner",
            theory: `Explore conditional branching, execution loops, state transformations, and structural invariants in ${subject}.`,
          },
          {
            title: "Modular Design, Scope & Function Abstractions",
            diff: "Intermediate",
            theory: `Deconstruct problems into reusable functions, clean interfaces, lifecycle boundaries, and modular components.`,
          },
          {
            title: "Data Structures & Memory Efficiency",
            diff: "Intermediate",
            theory: `Deep-dive into collection types, indexing mechanics, memory allocation models, and traversal time/space complexity.`,
          },
          {
            title: "Error Handling, Testing & Defensive Architecture",
            diff: "Intermediate",
            theory: `Implement robust exception handling, logging strategies, automated unit assertions, and boundary validation in ${subject}.`,
          },
          {
            title: "Production Patterns, Concurrency & Optimization",
            diff: "Advanced",
            theory: `Production-ready design patterns, asynchronous processing, concurrency safety, and performance tuning techniques.`,
          },
        ];

        if (normSub.includes("python")) {
          templates = [
            {
              title: "Python Foundations: Types, Virtual Environments & PEP 8",
              diff: "Beginner",
              theory: "Dynamic typing, primitive collections, memory model, PEP 8 styling, pip packaging, and virtual environment isolation.",
            },
            {
              title: "Control Flow, Iterators & List Comprehensions",
              diff: "Beginner",
              theory: "Branching conditions, for/while loops, zip/enumerate, generator expressions, and idiomatic Pythonic comprehensions.",
            },
            {
              title: "Functions, Scope, *args/**kwargs & Decorators",
              diff: "Intermediate",
              theory: "Positional/keyword parameters, default mutable trap, closures, first-class functions, and custom decorator wrappers.",
            },
            {
              title: "Object-Oriented Python: Dunder Methods & Inheritance",
              diff: "Intermediate",
              theory: "Class structure, __init__, __str__, __repr__, encapsulation, multiple inheritance, Method Resolution Order (MRO), and polymorphism.",
            },
            {
              title: "Context Managers, File I/O & Exception Handling",
              diff: "Intermediate",
              theory: "The 'with' statement, __enter__ and __exit__, custom exception classes, defensive programming, and JSON/Pickle serialization.",
            },
            {
              title: "Advanced Python: Generators, Asyncio & GIL Nuances",
              diff: "Advanced",
              theory: "Memory-efficient yields, itertools/functools, asyncio event loops, coroutines, and multithreading vs multiprocessing GIL trade-offs.",
            },
          ];
        } else if (normSub.includes("dbms") || normSub.includes("database") || normSub.includes("sql")) {
          templates = [
            {
              title: "Relational Modeling, ER Diagrams & Schema Design",
              diff: "Beginner",
              theory: "Entities, attributes, cardinality, ER-to-relational schema mapping, relational algebra operations, and integrity constraints.",
            },
            {
              title: "SQL Mastery: DDL, DML & Schema Constraints",
              diff: "Beginner",
              theory: "Table creation, primary/foreign keys, check constraints, default values, and data insertion/updating mechanics.",
            },
            {
              title: "Advanced SQL: Complex Joins, Subqueries & Aggregations",
              diff: "Intermediate",
              theory: "Inner/Outer joins, cross joins, GROUP BY, HAVING, correlated subqueries, and window functions (ROW_NUMBER, RANK).",
            },
            {
              title: "Database Normalization & Functional Dependencies",
              diff: "Intermediate",
              theory: "1NF, 2NF, 3NF, Boyce-Codd Normal Form (BCNF), lossless join decomposition, and dependency preservation.",
            },
            {
              title: "Transactions, ACID Properties & Concurrency Control",
              diff: "Advanced",
              theory: "Atomicity, Consistency, Isolation levels (dirty/phantom reads), Durability, 2-Phase Locking (2PL), and Write-Ahead Logging (WAL).",
            },
            {
              title: "Indexing, B+ Trees & Query Execution Plans",
              diff: "Advanced",
              theory: "Clustered vs non-clustered indexing, B+ tree traversals, EXPLAIN plan analysis, table scans, and query optimization tuning.",
            },
          ];
        } else if (normSub.includes("java")) {
          templates = [
            {
              title: "Java Architecture, JVM, Memory Model & Primitives",
              diff: "Beginner",
              theory: "Bytecode compilation, JVM memory structure (Stack vs Heap vs Metaspace), garbage collection basics, and primitive types.",
            },
            {
              title: "Object-Oriented Programming: Classes, Objects & Methods",
              diff: "Beginner",
              theory: "Encapsulation, constructors, heap instantiation via 'new', access modifiers, and method overloading.",
            },
            {
              title: "Inheritance, Abstract Classes & Interface Design",
              diff: "Intermediate",
              theory: "Superclass extension, method overriding (@Override), interface default methods, multiple interface implementation, and runtime polymorphism.",
            },
            {
              title: "Exception Handling: Checked vs Unchecked & Try-with-Resources",
              diff: "Intermediate",
              theory: "Throwable hierarchy, Checked vs Runtime exceptions, try-catch-finally ordering, AutoCloseable, and custom exceptions.",
            },
            {
              title: "Java Collections Framework (JCF) & Generics",
              diff: "Intermediate",
              theory: "List, Set, Map implementations (ArrayList, HashMap, TreeSet), hashCode() and equals() contracts, and generic type parameters.",
            },
            {
              title: "Multithreading, Concurrency & Synchronization",
              diff: "Advanced",
              theory: "Thread lifecycles, Runnable/Callable, synchronized blocks, volatile memory guarantees, and java.util.concurrent ExecutorServices.",
            },
          ];
        } else if (normSub.includes("os") || normSub.includes("operating system")) {
          templates = [
            {
              title: "OS Architecture: Kernel, Dual Mode & System Calls",
              diff: "Beginner",
              theory: "Monolithic vs Microkernel architecture, User Mode vs Kernel Mode transitions, traps, interrupts, and system call interfaces.",
            },
            {
              title: "Process Management, PCB & Context Switching",
              diff: "Beginner",
              theory: "Process Control Block (PCB), state transitions (Ready, Running, Waiting), context-switch mechanics, and fork/exec semantics.",
            },
            {
              title: "CPU Scheduling Algorithms: FCFS, SJF, Priority & Round Robin",
              diff: "Intermediate",
              theory: "Preemptive vs non-preemptive scheduling, Gantt charts, Time Quantum selection in Round Robin, Waiting and Turnaround calculations.",
            },
            {
              title: "Process Synchronization: Critical Section & Semaphores",
              diff: "Intermediate",
              theory: "Race conditions, Mutual Exclusion, Peterson's algorithm, binary and counting semaphores, and classic dining philosophers problem.",
            },
            {
              title: "Deadlocks: Necessary Conditions, Prevention & Banker's Algorithm",
              diff: "Intermediate",
              theory: "Coffman's 4 conditions (Mutual exclusion, Hold & wait, No preemption, Circular wait), resource allocation graphs, and avoidance.",
            },
            {
              title: "Memory Management: Paging, Segmentation & Virtual Memory",
              diff: "Advanced",
              theory: "Logical vs physical addresses, page tables, TLB cache lookups, Page Fault handling, and LRU/FIFO page replacement algorithms.",
            },
          ];
        }

        generatedTopics = templates.map((t) => ({
          title: t.title,
          theory: t.theory,
          timeEstimate: studyMinutes,
          difficulty: t.diff,
          videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            `${subject} ${t.title} tutorial`
          )}`,
        }));
      }
    }

    // Save to Database in transaction
    const roadmap = await prisma.roadmap.create({
      data: {
        userId: session.user.id as string,
        type: type,
        title,
        subject,
        syllabus: syllabus || "",
        examDate: examDateObj,
        dailyStudyTime: studyMinutes,
        topics: {
          create: generatedTopics.map((topic, index) => ({
            title: topic.title,
            theory: topic.theory,
            videoUrl: topic.videoUrl,
            timeEstimate: topic.timeEstimate,
            difficulty: topic.difficulty,
            order: index + 1,
            isUnlocked: index === 0, // Unlock only first milestone initially
          })),
        },
      },
    });

    return NextResponse.json({ success: true, roadmapId: roadmap.id });
  } catch (error: unknown) {
    console.error("Roadmap creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roadmaps = await prisma.roadmap.findMany({
      where: { userId: session.user.id as string },
      orderBy: { createdAt: "desc" },
      include: {
        topics: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ roadmaps });
  } catch (error: unknown) {
    console.error("Roadmap fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
