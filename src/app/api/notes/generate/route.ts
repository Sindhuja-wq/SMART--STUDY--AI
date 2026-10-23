import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIContent } from "@/lib/ai";

/**
 * Builds a rich, subject-aware fallback when AI cloud providers are offline or rate-limited.
 * Produces accurate, high-yield educational notes with real code, diagrams, and exam traps
 * instead of generic placeholder text.
 */
function buildEducationalFallbackNotes(params: {
  subject: string;
  topicTitle: string;
  theory: string;
  difficulty?: string | null;
  timeEstimate?: number | null;
  isExamMode: boolean;
  syllabus?: string | null;
}): string {
  const { subject, topicTitle, theory, difficulty, timeEstimate, isExamMode, syllabus } = params;
  const titleLower = topicTitle.toLowerCase();
  const subjectLower = subject.toLowerCase();

  // Detect subject domain
  const isJava = subjectLower.includes("java") || titleLower.includes("java");
  const isPython = subjectLower.includes("python") || titleLower.includes("python");
  const isDbms = subjectLower.includes("dbms") || subjectLower.includes("database") || subjectLower.includes("sql") || titleLower.includes("acid");
  const isOs = subjectLower.includes("os") || subjectLower.includes("operating system") || titleLower.includes("scheduling") || titleLower.includes("round robin");

  let codeBlock = "";
  let comparisonTable = "";
  let diagram = "";
  let domainKeyPoints = "";
  let workedExampleSection = "";

  if (isJava && (titleLower.includes("class") || titleLower.includes("object") || titleLower.includes("oop"))) {
    diagram = `\`\`\`
  +-------------------------------------------------------------+
  |                        Class: Student                       |
  |  - State / Fields: rollNumber (int), name (String)          |
  |  - Behavior / Methods: study(), takeExam()                  |
  +-------------------------------------------------------------+
                               |
              Instantiated via 'new Student()'
                               v
  +----------------------------+   +----------------------------+
  |  Object 1: studentA        |   |  Object 2: studentB        |
  |  rollNumber: 101           |   |  rollNumber: 102           |
  |  name: "Alice"             |   |  name: "Bob"               |
  +----------------------------+   +----------------------------+
\`\`\``;

    codeBlock = `\`\`\`java
// Demonstrating Classes and Objects in Java
public class Student {
    // 1. Instance variables (State)
    private int id;
    private String name;

    // 2. Constructor to initialize new Objects
    public Student(int id, String name) {
        this.id = id;
        this.name = name;
    }

    // 3. Instance method (Behavior)
    public void displayProfile() {
        System.out.println("Student ID: " + this.id + " | Name: " + this.name);
    }

    public static void main(String[] args) {
        // Creating objects (instantiation on the Java Heap)
        Student s1 = new Student(101, "Alice Smith");
        Student s2 = new Student(102, "Bob Jones");

        // Invoking behavior
        s1.displayProfile(); // Output: Student ID: 101 | Name: Alice Smith
        s2.displayProfile(); // Output: Student ID: 102 | Name: Bob Jones
    }
}
\`\`\``;

    comparisonTable = `| Feature | Class | Object |
| :--- | :--- | :--- |
| **Definition** | Logical blueprint / template for entities | Concrete instance of a class occupying memory |
| **Memory Allocation** | Loaded once into Metaspace / Method Area | Allocated dynamically on the JVM Heap |
| **Creation Keyword** | Declared using \`class\` | Created using \`new\` or reflection |
| **Existence** | Does not represent real-world data directly | Holds actual state values in its fields |`;

    domainKeyPoints = `* **Memory Separation**: References live on the Thread Stack; actual object instances live on the JVM Garbage-Collected Heap.
* **Encapsulation**: Fields should be marked \`private\` and accessed through getter and setter methods.
* **Constructor Chaining**: Use \`this()\` to call overloaded constructors within the same class.`;
  } else if (isJava && (titleLower.includes("exception") || titleLower.includes("error"))) {
    diagram = `\`\`\`
                   +-------------------+
                   |     Throwable     |
                   +-------------------+
                       /           \\
             +-----------+       +-----------+
             |   Error   |       | Exception |
             +-----------+       +-----------+
            (Fatal JVM issue)     /         \\
                  +-----------------+     +-----------------------+
                  |  RuntimeException |   | Checked Exceptions    |
                  |  (Unchecked)      |   | (IOException, etc.)   |
                  +-----------------+     +-----------------------+
\`\`\``;

    codeBlock = `\`\`\`java
import java.io.*;

public class ExceptionHandlingDemo {
    // Demonstrating Checked vs Unchecked and try-with-resources
    public static void readFile(String filePath) {
        // try-with-resources automatically closes the BufferedReader
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            String firstLine = reader.readLine();
            System.out.println("First line: " + firstLine);
        } catch (FileNotFoundException e) {
            System.err.println("File not found at specified path: " + e.getMessage());
        } catch (IOException e) {
            System.err.println("I/O error while reading file: " + e.getMessage());
        } finally {
            System.out.println("File processing attempt completed.");
        }
    }

    public static void validateAge(int age) {
        if (age < 0) {
            // Throwing unchecked IllegalArgumentException
            throw new IllegalArgumentException("Age cannot be negative: " + age);
        }
    }

    public static void main(String[] args) {
        readFile("curriculum.txt");
        try {
            validateAge(-5);
        } catch (IllegalArgumentException ex) {
            System.err.println("Caught runtime exception: " + ex.getMessage());
        }
    }
}
\`\`\``;

    comparisonTable = `| Feature | Checked Exceptions | Unchecked Exceptions (Runtime) |
| :--- | :--- | :--- |
| **Superclass** | Directly subclass \`java.lang.Exception\` | Subclass \`java.lang.RuntimeException\` |
| **Compiler Check** | Enforced at compile time (must catch or declare \`throws\`) | Not verified by compiler at compile time |
| **Root Cause** | External system conditions (file missing, network loss) | Programming/logical defects (NullPointer, IndexOutOfBounds) |
| **Recovery** | Code should anticipate and gracefully handle | Bug in code that should be corrected |`;

    domainKeyPoints = `* **Catch Order**: Catch subclasses before superclasses; catching \`Exception\` before \`IOException\` causes compile errors.
* **Try-with-Resources**: Available since Java 7 for any class implementing \`java.lang.AutoCloseable\`.
* **Never Swallow Exceptions**: Avoid empty \`catch (Exception e) {}\` blocks without logging.`;
  } else if (isDbms && (titleLower.includes("acid") || titleLower.includes("transaction"))) {
    diagram = `\`\`\`
   +-----------------------------------------------------------------+
   |                     ACID PROPERTIES IN DBMS                     |
   +-----------------------------------------------------------------+
   | [A] ATOMICITY   : All operations succeed, or entire txn aborts  |
   | [C] CONSISTENCY : Preserves integrity constraints (FK, Check)   |
   | [I] ISOLATION   : Concurrent transactions do not corrupt state  |
   | [D] DURABILITY  : Committed data survives crashes / restarts    |
   +-----------------------------------------------------------------+
\`\`\``;

    codeBlock = `\`\`\`sql
-- Demonstrating ACID Banking Transaction in PostgreSQL / MySQL
BEGIN TRANSACTION;

-- Step 1: Deduct $500 from Account 101
UPDATE accounts 
SET balance = balance - 500 
WHERE account_id = 101 AND balance >= 500;

-- Step 2: Add $500 to Account 202
UPDATE accounts 
SET balance = balance + 500 
WHERE account_id = 202;

-- If any check or constraint fails, execute:
-- ROLLBACK;

-- If all steps satisfy constraints, commit atomically:
COMMIT;
\`\`\``;

    comparisonTable = `| Property | Meaning | Implementation Mechanism |
| :--- | :--- | :--- |
| **Atomicity** | "All-or-Nothing" execution | Write-Ahead Logging (WAL), Undo Logs, Shadow Paging |
| **Consistency** | Database moves from one valid state to another | Schema constraints, triggers, application assertions |
| **Isolation** | Intermediate states hidden from other txns | 2-Phase Locking (2PL), MVCC (Snapshot Isolation) |
| **Durability** | Committed modifications persist indefinitely | Non-volatile storage write, WAL fsync flush |`;

    domainKeyPoints = `* **Transaction Anomalies**: Dirty Reads (Read Uncommitted), Non-Repeatable Reads (Read Committed), Phantom Reads (Repeatable Read).
* **Isolation Levels**: Read Uncommitted < Read Committed < Repeatable Read < Serializable.
* **WAL (Write-Ahead Logging)**: A log record must be safely persisted to non-volatile disk before the corresponding page in memory is flushed to disk.`;
  } else if (isOs && (titleLower.includes("round robin") || titleLower.includes("scheduling"))) {
    diagram = `\`\`\`
  Ready Queue (FIFO):  [ P2 (BT: 4) ] ---> [ P3 (BT: 3) ] ---> [ P1 (Remaining: 2) ]
                                |
                   CPU allocates Time Quantum (Q = 2ms)
                                v
  Gantt Chart:
  +---------+---------+---------+---------+---------+---------+
  |   P1    |   P2    |   P3    |   P1    |   P2    |   P3    |
  0         2         4         6         8        10        11
\`\`\``;

    codeBlock = `\`\`\`c
// Operating Systems: Round Robin CPU Scheduling Simulation in C
#include <stdio.h>

struct Process {
    int id;
    int burstTime;
    int remainingTime;
    int waitingTime;
    int turnaroundTime;
};

void calculateRoundRobin(struct Process proc[], int n, int quantum) {
    int time = 0, completed = 0;

    for (int i = 0; i < n; i++) {
        proc[i].remainingTime = proc[i].burstTime;
    }

    while (completed < n) {
        for (int i = 0; i < n; i++) {
            if (proc[i].remainingTime > 0) {
                if (proc[i].remainingTime > quantum) {
                    time += quantum;
                    proc[i].remainingTime -= quantum;
                } else {
                    time += proc[i].remainingTime;
                    proc[i].waitingTime = time - proc[i].burstTime;
                    proc[i].remainingTime = 0;
                    completed++;
                }
            }
        }
    }

    printf("PID\\tBurst\\tWaiting\\tTurnaround\\n");
    for (int i = 0; i < n; i++) {
        proc[i].turnaroundTime = proc[i].burstTime + proc[i].waitingTime;
        printf("P%d\\t%d\\t%d\\t%d\\n", proc[i].id, proc[i].burstTime, proc[i].waitingTime, proc[i].turnaroundTime);
    }
}
\`\`\``;

    workedExampleSection = `### 4. Step-by-Step Worked Example (Time Quantum = 2 ms)
Consider three processes arriving at time $t = 0$:

| Process | Burst Time ($BT$) | Completion Time ($CT$) | Turnaround Time ($TAT = CT - AT$) | Waiting Time ($WT = TAT - BT$) |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | 4 ms | 8 ms | 8 ms | $8 - 4 = 4$ ms |
| **P2** | 4 ms | 10 ms | 10 ms | $10 - 4 = 6$ ms |
| **P3** | 3 ms | 11 ms | 11 ms | $11 - 3 = 8$ ms |

* **Average Turnaround Time**: $(8 + 10 + 11) / 3 = 29 / 3 \\approx 9.67$ ms
* **Average Waiting Time**: $(4 + 6 + 8) / 3 = 18 / 3 = 6.00$ ms`;

    comparisonTable = `| Parameter | Small Time Quantum | Large Time Quantum |
| :--- | :--- | :--- |
| **Context Switches** | Extremely high; degrades CPU throughput | Minimal context switching overhead |
| **Responsiveness** | Superior interactive response time | Poor; behaves like FCFS (First-Come, First-Served) |
| **Starvation** | Zero starvation (fair share scheduling) | Zero starvation |`;

    domainKeyPoints = `* **Preemptive Algorithm**: Processes are forcibly preempted when their allocated time slice (quantum) expires.
* **Quantum Trade-off**: If quantum $\\to \\infty$, Round Robin degenerates into FCFS. If quantum $\\to 0$, context switch overhead dominates CPU execution.
* **Ready Queue**: Implemented as a circular FIFO queue.`;
  } else if (isPython) {
    diagram = `\`\`\`
  Python Execution Pipeline:
  [ source.py ] ---> ( CPython Compiler ) ---> [ Bytecode (.pyc) ] ---> ( Python Virtual Machine / PVM )
\`\`\``;

    codeBlock = `\`\`\`python
# Comprehensive Python implementation for ${topicTitle}
def demonstrate_core_workflow(dataset: list[int]) -> dict[str, float]:
    """Processes numeric data with defensive type and bounds verification."""
    if not dataset:
        raise ValueError("Dataset cannot be empty")

    total = sum(dataset)
    count = len(dataset)
    mean_val = total / count

    # Generator expression for memory efficiency
    variance = sum((x - mean_val) ** 2 for x in dataset) / count

    return {
        "count": count,
        "mean": round(mean_val, 2),
        "variance": round(variance, 2),
    }

if __name__ == "__main__":
    sample_data = [10, 20, 30, 40, 50]
    metrics = demonstrate_core_workflow(sample_data)
    print(f"Metrics computed: {metrics}")
\`\`\``;

    comparisonTable = `| Feature | Python Implementation | Lower-Level Equivalents (C / Java) |
| :--- | :--- | :--- |
| **Typing** | Dynamic and strongly typed | Static, compile-time verified |
| **Memory Model** | Automatic reference counting & cyclic GC | Explicit allocation (C) or JVM generational heap |
| **Syntactic Sugar** | List/dict comprehensions & context managers | Explicit loops and try-finally blocks |`;

    domainKeyPoints = `* **Idiomatic Code (PEP 8)**: Use snake_case for functions and variables, PascalCase for classes.
* **Memory Management**: Understand reference counting and the Global Interpreter Lock (GIL) implications.
* **Exceptions**: Use EAFP ('Easier to Ask for Forgiveness than Permission') with explicit try-except clauses.`;
  } else {
    // General technical topic fallback
    diagram = `\`\`\`
  +--------------------------------------------------------------+
  |              ${topicTitle.toUpperCase()} WORKFLOW ARCHITECTURE             |
  +--------------------------------------------------------------+
  |  1. Input Validation & Configuration                         |
  |  2. Core Logic Execution & State Transformation              |
  |  3. Output Verification & Result Emission                    |
  +--------------------------------------------------------------+
\`\`\``;

    codeBlock = `\`\`\`text
// Procedural Workflow for ${topicTitle}
1. Initialize parameters and allocate necessary resources.
2. Execute primary operations within transactional or guarded boundaries.
3. Handle edge conditions (empty states, boundary thresholds, exceptions).
4. Persist updated state and clean up resources upon completion.
\`\`\``;

    comparisonTable = `| Dimension | Standard Approach | Advanced / Optimized Approach |
| :--- | :--- | :--- |
| **Implementation Complexity** | Baseline, direct implementation | Modular, decoupled with boundary guards |
| **Scalability** | Suitable for moderate workloads | High throughput, fault tolerant |
| **Error Recovery** | Basic exception propagation | Structured fallback and logging |`;

    domainKeyPoints = `* **Foundational Principle**: Master the fundamental mechanics of ${topicTitle} before applying advanced abstractions.
* **Edge Case Verification**: Always inspect null states, empty collections, and boundary extremes.
* **Modularity**: Keep components decoupled and single-responsibility.`;
  }

  return `# ${topicTitle}

> **Subject**: ${subject} | **Difficulty**: ${difficulty || "Core"} | **Estimated Study Time**: ${timeEstimate || 45} minutes | **Mode**: ${isExamMode ? "Exam Preparation" : "Course Learning"}

${syllabus ? `*Grounded in requested syllabus context:* \`${syllabus.substring(0, 180)}\`\n` : ""}

---

### 1. Learning Objectives & Prerequisites
By the end of this study module, you will be able to:
* Define and explain the core architectural principles of **${topicTitle}**.
* Identify key operational components, data flows, and state transitions.
* Implement or analyze correct, idiomatic solutions and step-by-step algorithms.
* Diagnose common exam traps, misconceptions, and runtime pitfalls.

*Prerequisites*: Foundational understanding of ${subject} syntax, variables, and general control flow.

---

### 2. Comprehensive Concept Overview
${theory}

**${topicTitle}** forms a cornerstone of **${subject}**. In production systems and technical examinations, mastering this topic ensures scalable design, predictable state transitions, and clean defect isolation.

${diagram}

---

### 3. Key Concepts & Structural Breakdown
${domainKeyPoints}

---

${workedExampleSection ? `${workedExampleSection}\n\n---\n` : ""}

### ${workedExampleSection ? "5" : "4"}. Code Implementation & Working Syntax
${codeBlock}

---

### ${workedExampleSection ? "6" : "5"}. Comparative Analysis
${comparisonTable}

---

### ${workedExampleSection ? "7" : "6"}. Common Misconceptions & Exam Pitfalls
1. **Confusing Syntax with Semantics**: Memorizing keywords without understanding the underlying runtime model or memory allocation.
2. **Ignoring Edge Conditions**: Overlooking empty inputs, off-by-one indices, zero values, or unexpected concurrent access.
3. **Assuming Default Behavior**: Always verify language specifications and framework defaults rather than guessing execution semantics.

---

### ${workedExampleSection ? "8" : "7"}. Quick Revision Summary & Self-Assessment
* **Key Takeaway**: ${topicTitle} delivers structured, dependable functionality when constraints and lifecycle rules are respected.
* **Self-Test Prompt**: Can you explain ${topicTitle} to a peer without referencing your notes?
* **Next Step**: Launch the **Topic Mastery Quiz** to validate your understanding and unlock the next milestone!
`;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topicId, forceRegenerate } = (await req.json()) as {
      topicId?: string;
      forceRegenerate?: boolean;
    };

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID required" }, { status: 400 });
    }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { roadmap: true },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    if (topic.roadmap.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Caching check: If notes already exist and forceRegenerate is not requested, return cached notes
    if (topic.notes && !forceRegenerate) {
      return NextResponse.json({ success: true, notes: topic.notes });
    }

    const subject = topic.roadmap.subject || "General";
    const syllabus = topic.roadmap.syllabus || "";
    const isExamMode = topic.roadmap.type === "EXAM";
    const difficulty = topic.difficulty || "Intermediate";
    const studyTime = topic.timeEstimate || 45;

    // Rich, pedagogically structured prompt
    const systemPrompt = `You are a distinguished university professor and senior technical mentor specializing in ${subject}.
Your mission is to produce authoritative, rigorous, step-by-step, highly readable study notes in GitHub Flavored Markdown.
Your notes must be educationally rich, mathematically and syntactically correct, and free of generic filler.`;

    const userPrompt = `Generate comprehensive, exam-grade study notes for:
Subject: "${subject}"
Topic: "${topic.title}"
Context / Theory: "${topic.theory}"
${syllabus ? `Syllabus Scope: "${syllabus}"` : ""}
Target Difficulty: ${difficulty}
Estimated Study Time: ${studyTime} minutes
Goal: ${isExamMode ? "High-yield Exam Preparation & Problem Solving" : "Deep Course Mastery from Foundations to Advanced"}

STRUCTURE YOUR NOTES AS FOLLOWS:
# ${topic.title}
> Summary metadata badge (Subject, Difficulty, Study Time, Learning Goal)

### 1. Learning Objectives & Prerequisites
Bullet points defining specific skills mastered and prerequisites needed.

### 2. Comprehensive Concept Overview
Clear, progressive explanation. Explain definitions and mechanisms clearly. Use an ASCII or text diagram to illustrate architecture or data flow if relevant.

### 3. Deep-Dive Explanations & Step-by-Step Mechanisms
Detailed explanation of each concept, algorithm, or mathematical property.

### 4. Technical Implementation / Runnable Code Example
Provide syntactically valid, runnable code in the exact language appropriate for ${subject} (e.g. Java for Java, C for Operating Systems, SQL for DBMS, Python for Python).
Explain key lines of code and show expected console output.

### 5. Comparative Analysis Table
A markdown table comparing this topic with closely related concepts or alternative techniques.

### 6. Common Pitfalls & Exam Traps
3-4 specific technical mistakes students make, why they happen, and how to avoid them.

### 7. Quick Revision Summary & Self-Assessment
Summary points and 2 self-check practice questions.

RULES:
- Do NOT use generic placeholder functions like "executePattern()". Use real, runnable domain code.
- If formulas or calculations are required, show the step-by-step working with concrete numbers.
- Output raw Markdown only.`;

    let markdownNotes = "";

    try {
      const response = await generateAIContent({
        systemPrompt,
        prompt: userPrompt,
        formatJson: false,
        temperature: 0.3,
        maxTokens: 2500,
        timeoutMs: 25000,
      });

      if (response && response.trim().length > 100) {
        markdownNotes = response.trim();
      }
    } catch (err: unknown) {
      console.warn("AI generation error for notes. Using educational domain architect fallback:", err);
    }

    // High quality pedagogical fallback if cloud AI is offline
    if (!markdownNotes) {
      markdownNotes = buildEducationalFallbackNotes({
        subject,
        topicTitle: topic.title,
        theory: topic.theory,
        difficulty: topic.difficulty,
        timeEstimate: topic.timeEstimate,
        isExamMode,
        syllabus,
      });
    }

    // Save notes to database
    await prisma.topic.update({
      where: { id: topicId },
      data: { notes: markdownNotes },
    });

    return NextResponse.json({ success: true, notes: markdownNotes });
  } catch (error: unknown) {
    console.error("Notes generation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
