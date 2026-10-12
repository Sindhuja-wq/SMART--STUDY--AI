import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIContent } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, subject, syllabus, examDate, dailyStudyTime, type } = await req.json();

    if (!title || !subject || !dailyStudyTime || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let prompt = "";
    let examDateObj = null;

    if (type === "EXAM") {
      if (!examDate) return NextResponse.json({ error: "Exam date required for exam mode" }, { status: 400 });
      examDateObj = new Date(examDate);
      const daysLeft = Math.ceil((examDateObj.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      
      prompt = `
You are an expert tutor. The student is preparing for an exam on the subject "${subject}".
They have provided this syllabus/goals: "${syllabus || 'General comprehensive coverage'}".
The exam is in ${daysLeft} days, and they can study ${dailyStudyTime} minutes per day.
Generate a structured study roadmap with a realistic sequence of topics considering the time left.
Respond ONLY in valid JSON format with this exact structure, containing an array of objects:
[
  {
    "title": "Topic Name",
    "theory": "A brief but comprehensive theory/explanation of this topic.",
    "timeEstimate": 45,
    "difficulty": "Intermediate"
  }
]
Note: timeEstimate must be an integer representing minutes. difficulty should be Beginner, Intermediate, or Advanced.
Do not include markdown tags like \`\`\`json. Return ONLY the raw JSON array.
`;
    } else {
      // COURSE MODE
      prompt = `
You are an expert tutor. The student wants to deeply learn a course about "${subject}".
${syllabus ? `Their specific goals/syllabus: "${syllabus}"` : "Create a comprehensive beginner-to-advanced curriculum."}
They can dedicate ${dailyStudyTime} minutes per day. There is no strict deadline.
Generate a structured, logical learning journey to master this subject from scratch.
Respond ONLY in valid JSON format with this exact structure, containing an array of objects:
[
  {
    "title": "Topic Name",
    "theory": "A brief but comprehensive theory/explanation of this topic.",
    "timeEstimate": 60,
    "difficulty": "Beginner"
  }
]
Note: timeEstimate must be an integer representing minutes. difficulty should be Beginner, Intermediate, or Advanced.
Do not include markdown tags like \`\`\`json. Return ONLY the raw JSON array.
`;
    }

    let generatedTopics: any[] = [];

    try {
      const rawJson = await generateAIContent({
        prompt,
        formatJson: true,
        temperature: 0.3,
        maxTokens: 1500,
      });

      if (rawJson) {
        // Strip any accidental markdown blocks if returned
        const cleanedJson = rawJson.replace(/```json\s*|```/g, "").trim();
        const parsedTopics = JSON.parse(cleanedJson);
        const topicsArray: any[] = [];

        function traverse(current: any) {
          if (!current || typeof current !== 'object') return;
          if ('title' in current && 'theory' in current) {
            topicsArray.push({
              title: current.title,
              theory: current.theory,
              timeEstimate: typeof current.timeEstimate === 'number' ? current.timeEstimate : parseInt(current.timeEstimate) || 45,
              difficulty: current.difficulty || 'Intermediate',
              videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' ' + current.title)}`
            });
            return;
          }
          if (Array.isArray(current)) {
            current.forEach(traverse);
            return;
          }
          Object.values(current).forEach(traverse);
        }

        traverse(parsedTopics);
        if (topicsArray.length > 0) {
          generatedTopics = topicsArray;
        }
      }
    } catch (err) {
      console.warn("AI generation threw an error. Employing adaptive curriculum architect fallback:", err);
    }

    // Adaptive Curriculum Architect Fallback if Ollama was offline or returned empty
    if (generatedTopics.length === 0) {
      console.log(`Generating adaptive curriculum for ${subject}`);
      
      // Check if syllabus was provided and parse lines/items
      const syllabusLines = (syllabus || "")
        .split(/\n|,|;/)
        .map((s: string) => s.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter((s: string) => s.length > 2);

      if (syllabusLines.length >= 3) {
        // Build curriculum directly from parsed student syllabus
        generatedTopics = syllabusLines.slice(0, 8).map((line: string, idx: number) => {
          const diff = idx === 0 ? "Beginner" : idx < syllabusLines.length - 2 ? "Intermediate" : "Advanced";
          const est = Math.max(30, Math.min(90, parseInt(dailyStudyTime) || 45));
          return {
            title: line,
            theory: `Fundamental concepts, internal mechanisms, syntax rules, and practical problem-solving strategies for ${line} in ${subject}.`,
            timeEstimate: est,
            difficulty: diff,
            videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' ' + line + ' tutorial')}`
          };
        });
      } else {
        // Generate a comprehensive progression tailored to the subject
        const normalizedSub = subject.toLowerCase().trim();
        let topicTemplates = [
          { title: `${subject} Fundamentals & Core Syntax`, diff: "Beginner", theory: `Master foundational principles, setup environments, core data representations, and standard patterns in ${subject}.` },
          { title: "Control Flow, Logic & State Management", diff: "Beginner", theory: `Explore conditional execution, loops, branch predictions, and structural logic essential for ${subject}.` },
          { title: "Modular Architecture & Function Design", diff: "Intermediate", theory: `Deconstruct problems into reusable functions, scope boundaries, closures, and modular components in ${subject}.` },
          { title: "Data Structures & Memory Efficiency", diff: "Intermediate", theory: `Deep dive into complex collection types, hashing mechanisms, traversal efficiency, and memory allocations.` },
          { title: "Error Handling, Debugging & Testing", diff: "Intermediate", theory: `Implement robust exception handling, logging strategies, automated assertions, and unit testing practices in ${subject}.` },
          { title: "Advanced Patterns & Optimization", diff: "Advanced", theory: `Production-ready design patterns, asynchronous processing, concurrency, and performance tuning techniques.` }
        ];

        if (normalizedSub.includes("python")) {
          topicTemplates = [
            { title: "Python Basics, Types & Virtual Environments", diff: "Beginner", theory: "Variables, dynamic typing, primitive collections, PEP 8 conventions, and pip/virtualenv configuration." },
            { title: "Control Flow, Iterables & List Comprehensions", diff: "Beginner", theory: "Branching conditions, for/while loops, zip/enumerate, generator expressions, and Pythonic comprehensions." },
            { title: "Functions, Args/Kwargs & First-Class Objects", diff: "Intermediate", theory: "Positional/keyword parameters, default arguments, lambda expressions, decorators, and scope resolutions." },
            { title: "Object-Oriented Programming (OOP) in Python", diff: "Intermediate", theory: "Classes, encapsulation, inheritance, dunder methods (__init__, __str__, __repr__), and polymorphism." },
            { title: "File I/O, Serialization & Exception Handling", diff: "Intermediate", theory: "Context managers (with statements), JSON/Pickle manipulation, custom exception classes, and robust defensive coding." },
            { title: "Advanced Python: Generators, Itertools & Concurrency", diff: "Advanced", theory: "Memory-efficient yields, itertools/functools, asyncio event loops, multithreading vs multiprocessing GIL nuances." }
          ];
        } else if (normalizedSub.includes("dbms") || normalizedSub.includes("sql") || normalizedSub.includes("database")) {
          topicTemplates = [
            { title: "Relational Database Foundations & ER Modeling", diff: "Beginner", theory: "Entities, attributes, relationships, cardinality, ER to relational schema mapping, and relational algebra." },
            { title: "Core SQL: DDL, DML & Schema Constraints", diff: "Beginner", theory: "Table creation, primary/foreign keys, check constraints, default values, and data insertion/updating." },
            { title: "Advanced Queries: Joins, Aggregations & Grouping", diff: "Intermediate", theory: "Inner/Left/Right/Full outer joins, GROUP BY, HAVING, subqueries, and window functions." },
            { title: "Normalization & Functional Dependencies", diff: "Intermediate", theory: "1NF, 2NF, 3NF, BCNF, lossless joins, dependency preservation, and decomposition anomalies." },
            { title: "Transactions & ACID Properties", diff: "Advanced", theory: "Atomicity, Consistency, Isolation levels (dirty reads, phantom reads), Durability, and write-ahead logging." },
            { title: "Indexing, B-Trees & Query Optimization", diff: "Advanced", theory: "Clustered vs non-clustered indexing, B-Tree lookups, execution plans, table scans, and query tuning." }
          ];
        } else if (normalizedSub.includes("java")) {
          topicTemplates = [
            { title: "Java Architecture, JVM, JDK & Primitive Types", diff: "Beginner", theory: "Bytecode compilation, JVM memory model (Stack vs Heap), Garbage Collection basics, and strongly-typed primitives." },
            { title: "OOP Principles & Class Hierarchies in Java", diff: "Beginner", theory: "Inheritance, abstract classes, interfaces, method overloading vs overriding, and access modifiers." },
            { title: "Java Collections Framework (JCF)", diff: "Intermediate", theory: "ArrayList, LinkedList, HashMap, HashSet, TreeMap, equals() and hashCode() contracts, and Iterator protocols." },
            { title: "Exception Handling, Generics & Type Erasure", diff: "Intermediate", theory: "Checked vs unchecked exceptions, try-with-resources, custom generics, bounded wildcards (extends/super)." },
            { title: "Java Streams API, Lambdas & Functional Interfaces", diff: "Intermediate", theory: "Functional interfaces (Predicate, Function, Consumer), map-filter-reduce pipelines, and Collectors." },
            { title: "Multithreading & Concurrency in Java", diff: "Advanced", theory: "Thread lifecycles, synchronized blocks, volatile keywords, ReentrantLocks, and java.util.concurrent Executors." }
          ];
        }

        const est = Math.max(30, Math.min(90, parseInt(dailyStudyTime) || 45));
        generatedTopics = topicTemplates.map(t => ({
          title: t.title,
          theory: t.theory,
          timeEstimate: est,
          difficulty: t.diff,
          videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' ' + t.title + ' tutorial')}`
        }));
      }
    }

    // Save to Database
    const roadmap = await prisma.roadmap.create({
      data: {
        userId: session.user.id as string,
        type: type,
        title,
        subject,
        syllabus: syllabus || "",
        examDate: examDateObj,
        dailyStudyTime: parseInt(dailyStudyTime),
        topics: {
          create: generatedTopics.map((topic: any, index: number) => ({
            title: topic.title,
            theory: topic.theory,
            videoUrl: topic.videoUrl,
            timeEstimate: topic.timeEstimate,
            difficulty: topic.difficulty,
            order: index + 1,
            isUnlocked: index === 0, // Unlock only the first topic
          })),
        },
      },
    });

    return NextResponse.json({ success: true, roadmapId: roadmap.id });
  } catch (error) {
    console.error("Roadmap creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roadmaps = await prisma.roadmap.findMany({
      where: { userId: session.user.id as string },
      orderBy: { createdAt: 'desc' },
      include: {
        topics: true
      }
    });

    return NextResponse.json({ roadmaps });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
