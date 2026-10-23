import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIContent } from "@/lib/ai";

interface QuizQuestion {
  text: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

// Strict validation function for 5-question multiple choice quizzes
function validateQuizQuestions(questions: unknown): { valid: boolean; error?: string; cleanQuestions?: QuizQuestion[] } {
  if (!Array.isArray(questions)) return { valid: false, error: "Questions payload is not an array" };
  if (questions.length !== 5) return { valid: false, error: `Expected exactly 5 questions, received ${questions.length}` };

  const cleanList: QuizQuestion[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] as Partial<QuizQuestion>;
    if (!q || typeof q.text !== "string" || q.text.trim().length === 0) {
      return { valid: false, error: `Invalid text in Question #${i + 1}` };
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return { valid: false, error: `Question #${i + 1} must have exactly 4 options` };
    }

    const uniqueOptions = new Set(q.options.map((opt) => String(opt).trim().toLowerCase()));
    if (uniqueOptions.size !== 4) {
      return { valid: false, error: `Question #${i + 1} contains duplicate options` };
    }

    if (typeof q.correctOption !== "number" || q.correctOption < 0 || q.correctOption > 3) {
      return { valid: false, error: `Question #${i + 1} has invalid correctOption index (${q.correctOption})` };
    }

    if (!q.explanation || typeof q.explanation !== "string" || q.explanation.trim().length === 0) {
      return { valid: false, error: `Question #${i + 1} is missing an explanation` };
    }

    cleanList.push({
      text: q.text.trim(),
      options: q.options.map((opt) => String(opt).trim()),
      correctOption: q.correctOption,
      explanation: q.explanation.trim(),
    });
  }

  return { valid: true, cleanQuestions: cleanList };
}

/**
 * Builds accurate, topic-grounded 5-question assessment if cloud AI is offline
 */
function buildTopicSpecificFallbackQuestions(subject: string, topicTitle: string): QuizQuestion[] {
  const subLower = subject.toLowerCase();
  const titleLower = topicTitle.toLowerCase();

  if ((subLower.includes("java") || titleLower.includes("java")) && (titleLower.includes("class") || titleLower.includes("object") || titleLower.includes("oop"))) {
    return [
      {
        text: "In Java, what is the fundamental difference between a Class and an Object?",
        options: [
          "A class is a blueprint or template loaded into memory, while an object is an instance occupying heap space.",
          "A class is allocated on the JVM Heap at runtime, while an object resides in the Metaspace.",
          "Classes can be instantiated without constructors, but objects require pointers.",
          "There is no difference in Java; both terms are interchangeable aliases."
        ],
        correctOption: 0,
        explanation: "In Java, a class serves as the type definition loaded into memory, whereas an object is created on the heap via the `new` operator."
      },
      {
        text: "Which keyword in Java is used to instantiate an object and dynamically allocate memory on the heap?",
        options: [
          "alloc",
          "create",
          "new",
          "instanceof"
        ],
        correctOption: 2,
        explanation: "The `new` keyword allocates memory for the new object on the Java Heap and invokes the corresponding constructor."
      },
      {
        text: "What happens when an object reference variable in Java is assigned the value null?",
        options: [
          "The object is immediately deleted from disk.",
          "The reference points to no memory address; unreferenced heap objects become eligible for Garbage Collection.",
          "A NullPointerException is thrown immediately upon declaration.",
          "The JVM terminates with a critical stack overflow error."
        ],
        correctOption: 1,
        explanation: "Assigning `null` clears the reference. If no other live references point to the heap object, it becomes eligible for automatic Garbage Collection."
      },
      {
        text: "Why is encapsulation considered a core principle in object-oriented class design?",
        options: [
          "It forces all methods to be static and globally accessible.",
          "It protects internal object state by making fields private and exposing controlled public accessors/mutators.",
          "It eliminates the need for constructors in subclasses.",
          "It automatically compiles Java bytecode to native machine code."
        ],
        correctOption: 1,
        explanation: "Encapsulation binds data and functions together, restricting direct modification of state and enforcing validation via getters and setters."
      },
      {
        text: "What is constructor overloading in Java?",
        options: [
          "Declaring multiple constructors in the same class with identical parameter lists.",
          "Defining multiple constructors in the same class with different parameter counts or types.",
          "Overriding the parent class constructor using the @Override annotation.",
          "Preventing the creation of objects using a private modifier."
        ],
        correctOption: 1,
        explanation: "Constructor overloading allows a class to have more than one constructor with distinct signatures (different parameter lists) to initialize objects in multiple ways."
      }
    ];
  }

  if ((subLower.includes("java") || titleLower.includes("java")) && (titleLower.includes("exception") || titleLower.includes("error"))) {
    return [
      {
        text: "What is the primary difference between Checked and Unchecked exceptions in Java?",
        options: [
          "Checked exceptions are checked by the compiler at compile-time, while unchecked exceptions occur at runtime.",
          "Unchecked exceptions must always be declared in the method signature using the `throws` keyword.",
          "Checked exceptions inherit directly from Error, while unchecked exceptions inherit from Throwable.",
          "Only unchecked exceptions can be caught using a try-catch block."
        ],
        correctOption: 0,
        explanation: "Checked exceptions (subclasses of Exception excluding RuntimeException) are verified by the compiler and must be caught or declared. Unchecked exceptions subclass RuntimeException."
      },
      {
        text: "Which block in a Java try-catch statement is guaranteed to execute, regardless of whether an exception was thrown or caught?",
        options: [
          "catch",
          "finally",
          "throw",
          "assert"
        ],
        correctOption: 1,
        explanation: "The `finally` block always executes upon leaving the try-catch structure, ensuring cleanup of resources like streams and database connections."
      },
      {
        text: "What is the key benefit of Java's try-with-resources statement introduced in Java 7?",
        options: [
          "It eliminates all checked exceptions from the language.",
          "It automatically closes resources implementing AutoCloseable without requiring explicit finally blocks.",
          "It allows catching multiple exceptions in an infinite background loop.",
          "It converts unchecked runtime exceptions into compile-time warnings."
        ],
        correctOption: 1,
        explanation: "Try-with-resources ensures that any resource declared in the try parentheses is closed automatically when the block finishes, preventing resource leaks."
      },
      {
        text: "Which of the following classes is an example of an UNCHECKED (runtime) exception in Java?",
        options: [
          "java.io.IOException",
          "java.sql.SQLException",
          "java.lang.NullPointerException",
          "java.lang.ClassNotFoundException"
        ],
        correctOption: 2,
        explanation: "`NullPointerException` extends `RuntimeException`, making it an unchecked exception that indicates a defect in program logic."
      },
      {
        text: "When handling multiple exceptions in Java, what rule governs the order of multiple `catch` blocks?",
        options: [
          "More specific subclass exceptions must be caught BEFORE more general superclass exceptions.",
          "Superclass `Exception` must always be caught first, followed by specific subclasses.",
          "The order does not matter; the JVM randomly selects an active catch block.",
          "Only one catch block is legally permitted per try statement in Java."
        ],
        correctOption: 0,
        explanation: "Subclasses must precede superclasses in catch blocks; placing `catch (Exception e)` above `catch (IOException e)` results in an 'unreachable code' compile error."
      }
    ];
  }

  if (subLower.includes("dbms") || subLower.includes("sql") || titleLower.includes("acid") || titleLower.includes("transaction")) {
    return [
      {
        text: "What does the 'Atomicity' property guarantee in a database transaction?",
        options: [
          "All operations of the transaction complete successfully, or the entire transaction is rolled back with no partial effects.",
          "Transactions executing concurrently produce the same state as serial execution.",
          "Data modifications are strictly confined to atomic single-core CPUs.",
          "Every table has a clustered primary index."
        ],
        correctOption: 0,
        explanation: "Atomicity adheres to the 'all-or-nothing' principle: if any operation inside the transaction fails, the entire transaction is aborted and rolled back."
      },
      {
        text: "Which ACID property ensures that committed changes persist even across sudden power failures or system crashes?",
        options: [
          "Atomicity",
          "Consistency",
          "Isolation",
          "Durability"
        ],
        correctOption: 3,
        explanation: "Durability guarantees that once a transaction commits, its modifications are permanently recorded in non-volatile storage (via WAL/disk flushes)."
      },
      {
        text: "In database isolation levels, what is a 'Dirty Read' anomaly?",
        options: [
          "A transaction reads updated data written by another concurrent transaction that has NOT yet committed.",
          "A transaction re-reads a row and finds data modified by a committed transaction.",
          "A transaction executes a range query and discovers new phantom rows inserted by another transaction.",
          "A disk block sector fails read integrity validation during a backup."
        ],
        correctOption: 0,
        explanation: "A dirty read occurs when Transaction A reads data modified by uncommitted Transaction B. If B aborts, A has acted on invalid data."
      },
      {
        text: "What mechanism is primarily employed by relational database engines to enforce Durability and Atomicity across crashes?",
        options: [
          "Write-Ahead Logging (WAL) and undo/redo logs",
          "Client-side local storage caching",
          "B-tree index reorganization",
          "Garbage Collection in JVM heap"
        ],
        correctOption: 0,
        explanation: "Write-Ahead Logging (WAL) ensures log records are flushed to non-volatile disk before dirty database pages are written, enabling undo/redo recovery."
      },
      {
        text: "Which SQL isolation level provides the highest degree of isolation by completely preventing dirty reads, non-repeatable reads, and phantom reads?",
        options: [
          "Read Uncommitted",
          "Read Committed",
          "Repeatable Read",
          "Serializable"
        ],
        correctOption: 3,
        explanation: "Serializable is the highest ANSI SQL isolation level, executing concurrent transactions as if they were executed sequentially."
      }
    ];
  }

  if (subLower.includes("os") || subLower.includes("operating system") || titleLower.includes("round robin") || titleLower.includes("scheduling")) {
    return [
      {
        text: "What is the defining characteristic of the Round Robin (RR) CPU scheduling algorithm?",
        options: [
          "It is a preemptive scheduling algorithm where each process receives a fixed time slice (quantum) in circular order.",
          "It is a non-preemptive algorithm that always selects the process with the shortest burst time.",
          "It assigns the CPU indefinitely to the highest-priority thread until completion.",
          "It allocates CPU cores according to process memory footprint."
        ],
        correctOption: 0,
        explanation: "Round Robin uses a FIFO ready queue and preempts running processes when their allotted Time Quantum expires, moving them to the back of the queue."
      },
      {
        text: "In Round Robin scheduling, what occurs if the chosen Time Quantum is set to an excessively large value?",
        options: [
          "The scheduling behavior degenerates into First-Come, First-Served (FCFS).",
          "The CPU enters infinite thrashing due to continuous context switching.",
          "Process starvation becomes mathematically impossible.",
          "Turnaround time for short processes automatically drops to zero."
        ],
        correctOption: 0,
        explanation: "If the time quantum is larger than the burst time of any ready process, no preemption occurs, and Round Robin functions identically to FCFS."
      },
      {
        text: "What is the primary drawback of configuring an extremely small Time Quantum in Round Robin scheduling?",
        options: [
          "Long processes will starve and never receive CPU time.",
          "Excessive context-switching overhead wastes CPU cycles and reduces system throughput.",
          "The ready queue overflows and crashes the kernel.",
          "Memory fragmentation increases proportionally."
        ],
        correctOption: 1,
        explanation: "A very small time quantum causes the CPU to spend a significant fraction of its time saving and restoring process state (context switching), degrading overall throughput."
      },
      {
        text: "Given Arrival Time (AT) = 0, Burst Time (BT) = 6 ms, and Completion Time (CT) = 10 ms, what is the Waiting Time (WT)?",
        options: [
          "16 ms",
          "4 ms",
          "10 ms",
          "6 ms"
        ],
        correctOption: 1,
        explanation: "Turnaround Time (TAT) = CT - AT = 10 - 0 = 10 ms. Waiting Time (WT) = TAT - BT = 10 - 6 = 4 ms."
      },
      {
        text: "Which data structure is typically utilized by an operating system to maintain processes in Round Robin scheduling?",
        options: [
          "Circular First-In, First-Out (FIFO) Queue",
          "Last-In, First-Out (LIFO) Stack",
          "Binary Search Tree",
          "Min-Heap Priority Queue"
        ],
        correctOption: 0,
        explanation: "Round Robin manages the ready queue as a circular FIFO queue; newly arriving or preempted processes are appended to the tail of the queue."
      }
    ];
  }

  // Default topic-tailored questions for general subjects
  return [
    {
      text: `What is the core definition and architectural purpose of ${topicTitle}?`,
      options: [
        `It establishes the foundational operational rules, data flows, and constraints within ${subject}.`,
        `It is a deprecated configuration file no longer recognized by modern compilers.`,
        `It serves solely as an unmonitored background logging daemon.`,
        `It bypasses all algorithmic invariants and state safeguards.`
      ],
      correctOption: 0,
      explanation: `${topicTitle} provides the essential technical foundation and interfaces required to structure solutions in ${subject}.`
    },
    {
      text: `Which of the following is considered an essential best practice when implementing ${topicTitle}?`,
      options: [
        `Validating boundary conditions, handling exceptions cleanly, and decoupling logic into modular components.`,
        `Hardcoding arbitrary numerical constants across all modules without documentation.`,
        `Disabling compiler warnings and automated testing suites.`,
        `Suppressing all error messages to conceal execution faults.`
      ],
      correctOption: 0,
      explanation: "Modular structure, input validation, and comprehensive error handling guarantee reliability and prevent regressions."
    },
    {
      text: `What primary risk or defect is introduced by failing to manage resources or state properly in ${topicTitle}?`,
      options: [
        `Memory leaks, race conditions, or unhandled runtime exceptions.`,
        `Instant physical hardware degradation of disk drives.`,
        `Automatic unscheduled operating system updates.`,
        `Inability of the display monitor to render RGB colors.`
      ],
      correctOption: 0,
      explanation: "Poor lifecycle or concurrency management directly causes resource exhaustion, inconsistent state, or crashes."
    },
    {
      text: `How does a well-designed implementation of ${topicTitle} optimize performance and scalability?`,
      options: [
        `By minimizing redundant computations, selecting appropriate data structures, and respecting algorithmic complexity bounds.`,
        `By removing all data constraints and data integrity checks.`,
        `By substituting asynchronous non-blocking patterns with infinite busy-wait loops.`,
        `By duplicating identical state across every memory address.`
      ],
      correctOption: 0,
      explanation: "Predictable time complexity, efficient memory allocation, and reduced overhead are essential for production scalability."
    },
    {
      text: `What is a frequent exam misconception or implementation trap associated with ${topicTitle}?`,
      options: [
        `Focusing exclusively on the happy path while ignoring edge cases like null values, empty collections, or boundary limits.`,
        `Formatting notes in structured Markdown tables.`,
        `Using standard linting conventions and automated build checks.`,
        `Achieving 80%+ on knowledge assessment quizzes.`
      ],
      correctOption: 0,
      explanation: "A frequent trap is overlooking edge cases and boundary conditions that cause edge-case failure in examinations and production."
    }
  ];
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topicId, forceRegenerate, checkOnly } = (await req.json()) as {
      topicId?: string;
      forceRegenerate?: boolean;
      checkOnly?: boolean;
    };

    if (!topicId) return NextResponse.json({ error: "Topic ID required" }, { status: 400 });

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        roadmap: true,
        questions: { where: { isActive: true } },
      },
    });

    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    if (topic.roadmap.userId !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (checkOnly) {
      if (topic.questions.length === 5) {
        return NextResponse.json({ success: true, questions: topic.questions });
      } else {
        return NextResponse.json({ success: true, questions: [] });
      }
    }

    // Caching check: Return active existing questions unless user explicitly requested regeneration
    if (!forceRegenerate && topic.questions.length === 5) {
      return NextResponse.json({ success: true, questions: topic.questions });
    }

    if (forceRegenerate) {
      // Deactivate previous questions to retain audit trail while clearing active pool
      await prisma.question.updateMany({
        where: { topicId, isActive: true },
        data: { isActive: false },
      });
    }

    const subject = topic.roadmap.subject || "General";
    const theorySummary = (topic.notes || topic.theory).substring(0, 1800);

    const systemPrompt = `You are a university examiner. You will create a multiple-choice quiz of EXACTLY 5 questions for ${subject}.
Every question must be technically accurate, have exactly 4 options, exactly ONE correct answer (index 0 to 3), and include a detailed explanation explaining WHY the correct option is right.
Output JSON only with the schema:
{"questions": [{"text": "...", "options": ["A", "B", "C", "D"], "correctOption": 0, "explanation": "..."}]}`;

    const prompt = `Create a 5-question mastery assessment for:
Subject: "${subject}"
Topic: "${topic.title}"
Context / Notes: "${theorySummary}"

RULES:
1. Exactly 5 questions.
2. Exactly 4 distinct options per question.
3. Plausible distractors, no 'All of the above' or 'None of the above'.
4. "correctOption" must be integer 0, 1, 2, or 3.
5. Provide a clear technical explanation for each answer.

Respond ONLY in valid JSON format with a root "questions" array of 5 objects.`;

    let generatedQuestions: QuizQuestion[] = [];

    try {
      const rawJson = await generateAIContent({
        systemPrompt,
        prompt,
        formatJson: true,
        temperature: 0.25,
        maxTokens: 2000,
        timeoutMs: 22000,
      });

      if (rawJson) {
        const cleanedJson = rawJson.replace(/```json\s*|```/g, "").trim();
        const parsed = JSON.parse(cleanedJson) as { questions?: unknown };
        const candidateQuestions = Array.isArray(parsed) ? parsed : parsed.questions;

        const validation = validateQuizQuestions(candidateQuestions);
        if (validation.valid && validation.cleanQuestions) {
          generatedQuestions = validation.cleanQuestions;
        } else {
          console.warn("Quiz JSON failed validation:", validation.error);
        }
      }
    } catch (err: unknown) {
      console.warn("AI generation failed for quiz, activating topic-specific fallback:", err);
    }

    // High quality topic-tailored questions if AI is offline
    if (generatedQuestions.length !== 5) {
      generatedQuestions = buildTopicSpecificFallbackQuestions(subject, topic.title);
    }

    // Save active questions in a transaction
    const createdQuestions = await prisma.$transaction(
      generatedQuestions.map((q) =>
        prisma.question.create({
          data: {
            topicId,
            text: q.text,
            options: JSON.stringify(q.options),
            correctOption: q.correctOption,
            explanation: q.explanation,
            isActive: true,
          },
        })
      )
    );

    return NextResponse.json({ success: true, questions: createdQuestions });
  } catch (error: unknown) {
    console.error("Quiz API internal error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
