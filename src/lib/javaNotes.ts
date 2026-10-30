/**
 * High-Yield Academic Engine for Java Programming Curriculum
 * Covers:
 * 1. Java Foundations, Syntax & Runtime Architecture:
 *    - JVM, JRE, JDK distinctions and compilation lifecycle (javac -> bytecode -> ClassLoader -> JVM)
 *    - Java runtime memory architecture: Thread Stacks (stack frames, local variable array), Heap (object payloads, instance reference fields),
 *      Metaspace (class structural metadata, bytecode, constant pool), PC Registers, Native Method Stacks
 *    - Syntax, primitive data types (8 primitives) vs. reference types
 *    - Variables, operators, operator precedence, type promotion, control flow (if/else, switch expressions, loops)
 *    - Methods, parameter passing (strictly pass-by-value in Java), method overloading
 * 2. Java Classes & Objects (Object-Oriented Programming):
 *    - Blueprint vs. instance paradigm, heap allocation via 'new'
 *    - Encapsulation, access modifiers, constructors (default vs parameterized, constructor chaining)
 *    - Instance state, getters, setters, defensive validation, and instance methods
 *    - Accurate reference mechanics (local references in stack frames vs reference fields inside heap objects)
 */

export function buildJavaNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  isExamMode: boolean
): string {
  const tLower = topic.toLowerCase();
  const sLower = (syllabusNote || "").toLowerCase();

  // If topic or syllabus explicitly requests Classes and Objects / OOP fundamentals:
  const isExplicitClassesObjects =
    (/class(es)?\s*(and|&)?\s*object/i.test(tLower) ||
      (/oop|constructor|encapsulation/i.test(tLower) && !/foundation|syntax|runtime|architecture/i.test(tLower))) ||
    (/class(es)?\s*(and|&)?\s*object/i.test(sLower) && !/foundation|syntax|runtime|architecture/i.test(tLower));

  if (isExplicitClassesObjects) {
    return buildJavaClassesObjectsNotes(subject, topic, theory, badge, syllabusNote, isExamMode);
  }

  // Broad foundations, syntax, runtime architecture, or general Java overview:
  return buildJavaFoundationsNotes(subject, topic, theory, badge, syllabusNote, isExamMode);
}

/**
 * Unit: Java Foundations, Syntax & Runtime Architecture
 */
function buildJavaFoundationsNotes(
  subject: string,
  topic: string,
  _theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic} (Java Programming)

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* **The Compilation & Execution Pipeline**: Trace how human-readable \`.java\` source files compile via \`javac\` into platform-independent \`.class\` bytecode, which is executed across heterogeneous operating systems via the Java Virtual Machine (JVM).
* **JDK vs. JRE vs. JVM Distinctions**: Define the structural boundaries and components of the Java Development Kit (JDK), Java Runtime Environment (JRE), and Java Virtual Machine (JVM).
* **ClassLoader Subsystem**: Deconstruct the three-phase class loading lifecycle: **Loading** (Bootstrap, Platform, Application), **Linking** (Verification, Preparation, Resolution), and **Initialization**.
* **JVM Runtime Memory Areas**: Formulate an accurate mental model of JVM memory conforming to the JVM Specification and modern HotSpot implementations:
  - **Thread Stacks & Stack Frames**: LIFO execution, Local Variable Array, Operand Stack, and Frame Data.
  - **Garbage-Collected Heap**: Allocation of all instantiated object payloads, arrays, and their instance reference fields.
  - **Metaspace**: Native memory holding class metadata, method bytecode, and the runtime constant pool (with static fields located in heap-based \`java.lang.Class\` mirrors).
  - **Program Counter (PC) Registers & Native Method Stacks**: Per-thread execution tracking and JNI integration.
* **Primitive vs. Reference Type Semantics**: Contrast the 8 primitive data types (sizes, ranges, default values) with reference types, variable scopes, and type promotion.
* **Operators & Control Flow**: Apply arithmetic, relational, short-circuit logical (\`&&\`, \`||\`), bitwise, and ternary operators alongside robust control flow structures (\`if-else\`, modern \`switch\` expressions, \`for\`, enhanced for-each, \`while\`, \`do-while\`).
* **Method Anatomy & Strict Pass-by-Value**: Understand method declarations, overloading rules, and the definitive fact that Java is strictly **pass-by-value** (where references are copied as value addresses).

*Prerequisites*: General programming familiarity, text editing, and command-line execution concepts.

---

### 2. JDK, JRE, and JVM Architecture
Java's "Write Once, Run Anywhere" (WORA) philosophy relies on a modular three-tier runtime hierarchy:

\`\`\`text
+-----------------------------------------------------------------------+
| Java Development Kit (JDK)                                            |
| [javac, jar, javadoc, jdb, jshell, diagnostic tools]                  |
| +-------------------------------------------------------------------+ |
| | Java Runtime Environment (JRE)                                    | |
| | [Standard Class Libraries: java.base, java.sql, java.util, rt.jar] | |
| | +---------------------------------------------------------------+ | |
| | | Java Virtual Machine (JVM)                                    | | |
| | | [ClassLoader | Execution Engine (JIT + GC) | Runtime Memory]  | | |
| | +---------------------------------------------------------------+ | |
| +-------------------------------------------------------------------+ |
+-----------------------------------------------------------------------+
\`\`\`

1. **Java Virtual Machine (JVM)**: An abstract computing machine defined by a strict specification. It loads, verifies, and executes bytecode. JVM implementations (such as Oracle HotSpot, Eclipse OpenJ9, and GraalVM) exist natively for Windows, macOS, Linux, and various CPU architectures (x86_64, ARM64).
2. **Java Runtime Environment (JRE)**: The runtime package containing the JVM plus the core Java Class Library (standard packages like \`java.lang\`, \`java.util\`, \`java.io\`) necessary to run pre-compiled Java applications.
3. **Java Development Kit (JDK)**: The complete software development environment containing the JRE plus command-line development tools, primarily the Java compiler (\`javac\`), archiver (\`jar\`), documentation generator (\`javadoc\`), and debugging tools.

#### The Lifecycle from Source Code to Machine Execution
1. **Source Code (\`.java\`)**: Human-readable source written in high-level Java syntax.
2. **Bytecode Compilation (\`javac\`)**: The \`javac\` compiler parses syntax, checks types, and compiles source code into platform-neutral, hardware-agnostic intermediate bytecode saved in \`.class\` files.
3. **Class Loading**: When an application launches, the JVM ClassLoader dynamically loads binary \`.class\` bytecode into memory:
   - **Loading**: Finds binary representations of types using hierarchical loaders: *Bootstrap ClassLoader* (core platform classes), *Platform ClassLoader* (platform extension modules), and *Application/System ClassLoader* (application classpath).
   - **Linking**:
     * *Verification*: Guarantees that bytecode is structurally valid, conforms to JVM constraints, and causes no operand stack overflows, illegal type casts, or pointer corruptions.
     * *Preparation*: Allocates memory for static fields and initializes them to standard zero/null defaults.
     * *Resolution*: Transforms symbolic references in the runtime constant pool into direct physical memory addresses.
   - **Initialization**: Executes static initializer blocks (\`static { ... }\`) and assigns explicit values to static variables in source order.
4. **Execution Engine**:
   - **Interpreter**: Reads bytecode instructions sequentially and translates them immediately into native CPU instructions for rapid application startup.
   - **Just-In-Time (JIT) Compiler (HotSpot C1 / C2)**: Analyzes runtime profiling data to identify frequently executed code paths ("hot spots"). It compiles these hot bytecode sequences directly into optimized native machine code with method inlining, loop unrolling, and dead-code elimination.
   - **Garbage Collector (GC)**: Automatically tracks object allocations and reclaims heap memory occupied by objects that are no longer reachable from any GC root.

---

### 3. Detailed JVM Runtime Memory Structure
The JVM Specification divides runtime memory into five primary data areas:

\`\`\`text
+-------------------------------------------------------------------------+
| Shared Memory (All Threads)                                             |
| +-------------------------------------+ +-----------------------------+ |
| | Garbage-Collected Heap               | | Metaspace (Native Memory)   | |
| | - All instantiated objects & arrays  | | - Class metadata & bytecode | |
| | - Object instance reference fields  | | - Runtime Constant Pool     | |
| | - java.lang.Class objects & statics | | - Method & field metadata   | |
| +-------------------------------------+ +-----------------------------+ |
+-------------------------------------------------------------------------+
| Per-Thread Memory (Private to Each Executing Thread)                    |
| +---------------------------------------------------------------------+ |
| | JVM Thread Stack (One per thread)                                   | |
| | [Stack Frame for Method A] -> [Stack Frame for Method B (Top)]      | |
| |  - Local Variable Array (primitives & reference address pointers)   | |
| |  - Operand Stack (calculation workspace)                            | |
| |  - Frame Data (return address, constant pool resolution)            | |
| +---------------------------------------------------------------------+ |
| | Program Counter (PC) Register: Current instruction bytecode offset   | |
| | Native Method Stack: C/C++ native code frames executed via JNI       | |
| +---------------------------------------------------------------------+ |
+-------------------------------------------------------------------------+
\`\`\`

#### 1. Garbage-Collected Heap
* **Scope**: Shared across all threads in the JVM process.
* **Target**: Dynamically allocated memory where **all instantiated object payloads and arrays reside**.
* **Instance Reference Fields**: When an object has fields that reference other objects (e.g., \`private String name;\`), the reference field pointer itself resides **on the Heap inside the parent object's memory payload**, *not* on the thread stack.
* **Management**: Monitored and cleaned by the Garbage Collector (e.g., G1, ZGC, Parallel GC).

#### 2. JVM Thread Stacks & Stack Frames
* **Scope**: Dedicated, private memory allocated to each individual thread.
* **Target**: Manages method invocation lifecycles using Last-In, First-Out (LIFO) stack frames.
* **Stack Frame Structure**: Each time a method is called, a new frame is pushed onto the thread stack, containing:
  - **Local Variable Array**: Stores method parameters and locally declared variables. Local primitive variables hold their raw binary values directly in the slot. Local reference variables store memory address pointers referencing objects on the Heap.
  - **Operand Stack**: A pushdown workspace where bytecode operations push values, execute arithmetic/logic operations, and pop results.
  - **Frame Data**: Contains dispatch information, method return addresses, and references to the class's constant pool.
* **Crucial Architectural Fact**: Only *local* variables (variables declared inside a method body or constructor) reside on the thread call stack. Fields belonging to an object reside inside that object on the Heap.

#### 3. Metaspace (Formerly PermGen)
* **Scope**: Shared across all threads; allocated out of native host memory since Java 8.
* **Target**: Stores class structural metadata, method bytecode, field signatures, annotations, and the runtime constant pool.
* **Static Fields Location**: In modern HotSpot JVM implementations, static reference variables and static primitives are stored within the heap-based \`java.lang.Class\` object that mirrors the loaded class, allowing them to be garbage-collected if their custom ClassLoader is unloaded.

#### 4. Program Counter (PC) Registers
* Each active thread maintains its own independent PC register recording the memory address of the bytecode instruction currently being executed by that thread.

#### 5. Native Method Stacks
* Dedicated stack memory allocated to execute native C/C++ functions called via the Java Native Interface (JNI).

---

### 4. Java Syntax, Primitives, Variables & Operators

#### 1. The 8 Primitive Data Types
Java is statically typed. Primitives store raw binary values directly in memory:

| Type | Bit Size | Default Value | Range / Precision | Example Declaration |
| :--- | :--- | :--- | :--- | :--- |
| **\`byte\`** | 8 bits | \`0\` | \`-128\` to \`127\` | \`byte b = 100;\` |
| **\`short\`** | 16 bits | \`0\` | \`-32,768\` to \`32,767\` | \`short s = 5000;\` |
| **\`int\`** | 32 bits | \`0\` | \`-2,147,483,648\` to \`2,147,483,647\` | \`int count = 42;\` |
| **\`long\`** | 64 bits | \`0L\` | \`-9.22 × 10^{18}\` to \`9.22 × 10^{18}\` | \`long pop = 8000000000L;\` |
| **\`float\`** | 32 bits | \`0.0f\` | IEEE 754 floating-point (~7 decimal digits) | \`float price = 19.99f;\` |
| **\`double\`** | 64 bits | \`0.0d\` | IEEE 754 floating-point (~15 decimal digits) | \`double gpa = 3.95;\` |
| **\`char\`** | 16 bits | \`'\\u0000'\` | \`0\` to \`65,535\` (Unicode UTF-16 code units) | \`char grade = 'A';\` |
| **\`boolean\`** | 1 bit (nominal) | \`false\` | \`true\` or \`false\` | \`boolean active = true;\` |

*Primitives vs. Reference Types*: Reference types (classes, interfaces, arrays, enums, records) store an address pointer to an object on the heap, defaulting to \`null\`.

#### 2. Variables & Type Inference
* **Declaration & Initialization**: \`int age = 21;\`
* **Local Variable Type Inference (\`var\`)**: Introduced in Java 10 for local variables with initializers: \`var message = "Hello, World!";\` (compiler infers \`String\`). \`var\` cannot be used for fields, method parameters, or return types.

#### 3. Operators & Evaluation Precedence
* **Arithmetic**: \`+\`, \`-\`, \`*\`, \`/\` (integer division truncates towards zero), \`%\` (modulus).
* **Relational**: \`==\` (primitives compare values; reference variables compare memory addresses), \`!=\`, \`<\`, \`>\`, \`<=\`, \`>=\`.
* **Logical**: Short-circuit AND (\`&&\`), short-circuit OR (\`||\`), and logical NOT (\`!\`). In short-circuit evaluation, the right-hand operand is skipped if the left-hand operand determines the outcome.
* **Bitwise & Bit-Shift**: \`&\`, \`|\`, \`^\`, \`~\`, signed left-shift \`<<\`, signed right-shift \`>>\`, unsigned right-shift \`>>>\`.
* **Assignment**: \`=\`, \`+=\`, \`-=\`, \`*=\`, \`/=\`, \`%=\`.
* **Ternary**: \`condition ? exprIfTrue : exprIfFalse\`.

#### 4. Control Flow Structures
* **Conditional Branching**:
  \`\`\`java
  if (score >= 90) {
      grade = 'A';
  } else if (score >= 80) {
      grade = 'B';
  } else {
      grade = 'C';
  }
  \`\`\`
* **Modern Switch Expressions (Java 14+)**:
  \`\`\`java
  String status = switch (dayOfWeek) {
      case 1, 7 -> "Weekend";
      case 2, 3, 4, 5, 6 -> "Workday";
      default -> throw new IllegalArgumentException("Invalid day: " + dayOfWeek);
  };
  \`\`\`
* **Loops**:
  - \`while (condition) { ... }\`: Pre-test loop.
  - \`do { ... } while (condition);\`: Post-test loop; executes at least once.
  - \`for (int i = 0; i < n; i++) { ... }\`: Counter-controlled loop.
  - \`for (Type item : collection) { ... }\`: Enhanced for-each loop over arrays and \`Iterable\` structures.

#### 5. Method Anatomy & Parameter Passing Semantics
* **Method Declaration**: \`public static int calculateSum(int a, int b) { return a + b; }\`
* **Strict Pass-by-Value Rule**: Java is strictly pass-by-value:
  - For primitive arguments, a direct binary copy of the value is passed. Modifications inside the method have zero effect on the caller's variable.
  - For reference arguments, a copy of the reference address is passed. Mutating the object's fields via this copied reference affects the underlying heap object, but reassigning the parameter reference (e.g., \`param = new Object();\`) has zero effect on the caller's reference.

---

### 5. Correct, Complete, Runnable Java Code Example
The following complete, self-contained Java program demonstrates primitive types, reference variables, control flow, methods, and memory mechanics. You can save this file as \`JavaFoundationsDemo.java\`, compile it with \`javac JavaFoundationsDemo.java\`, and run it with \`java JavaFoundationsDemo\`.

\`\`\`java
// File: JavaFoundationsDemo.java
// Complete, verified Java application demonstrating Foundations, Syntax, and Runtime Semantics

public class JavaFoundationsDemo {

    // Simple helper class representing an object on the JVM Heap
    static class DataHolder {
        int value;

        DataHolder(int initialValue) {
            this.value = initialValue;
        }
    }

    // Demonstrates pass-by-value with primitives (no external mutation)
    public static void tryModifyPrimitive(int number) {
        number = number + 100;
        System.out.println("Inside tryModifyPrimitive: number = " + number);
    }

    // Demonstrates pass-by-value with object references (mutates heap object payload)
    public static void modifyObjectPayload(DataHolder holder) {
        holder.value = holder.value + 50;
        System.out.println("Inside modifyObjectPayload: holder.value = " + holder.value);
    }

    // Demonstrates pass-by-value reference reassignment (caller reference remains unchanged)
    public static void tryReassignReference(DataHolder holder) {
        holder = new DataHolder(999);
        System.out.println("Inside tryReassignReference: new local holder.value = " + holder.value);
    }

    // Demonstrates control flow and modern switch logic
    public static String classifyScore(int score) {
        if (score < 0 || score > 100) {
            return "Invalid Score";
        }
        int tier = score / 10;
        return switch (tier) {
            case 10, 9 -> "Exemplary (Grade A)";
            case 8     -> "Proficient (Grade B)";
            case 7     -> "Competent (Grade C)";
            default    -> "Developing (Review Needed)";
        };
    }

    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println(" SMART STUDY AI - JAVA FOUNDATIONS ARCHITECTURE");
        System.out.println("==================================================");

        // 1. Primitive Declarations & Type Promotion
        byte sampleByte = 127;
        int primitiveInt = 42;
        double floatingVal = 3.14159;
        boolean isActive = true;
        char symbol = 'J';

        System.out.println();
        System.out.println("--- 1. Primitive Variables on Stack ---");
        System.out.println("byte: " + sampleByte + " | int: " + primitiveInt +
                           " | double: " + floatingVal + " | active: " + isActive +
                           " | char: " + symbol);

        // 2. Control Flow: Loop and Switch Classification
        System.out.println();
        System.out.println("--- 2. Control Flow & Switch Evaluation ---");
        int[] scores = { 95, 82, 74, 58 };
        for (int i = 0; i < scores.length; i++) {
            String classification = classifyScore(scores[i]);
            System.out.println("Score: " + scores[i] + " -> " + classification);
        }

        // 3. Method Parameter Passing: Primitive Pass-by-Value
        System.out.println();
        System.out.println("--- 3. Primitive Pass-by-Value Verification ---");
        int originalValue = 50;
        System.out.println("Before call: originalValue = " + originalValue);
        tryModifyPrimitive(originalValue);
        System.out.println("After call:  originalValue = " + originalValue + " (Unchanged: value copy was passed)");

        // 4. Method Parameter Passing: Reference Pass-by-Value
        System.out.println();
        System.out.println("--- 4. Reference Pass-by-Value (Heap Mutation) ---");
        DataHolder myHolder = new DataHolder(25);
        System.out.println("Before call: myHolder.value = " + myHolder.value);
        modifyObjectPayload(myHolder);
        System.out.println("After call:  myHolder.value = " + myHolder.value + " (Mutated: reference address accessed same heap object)");

        // 5. Reference Reassignment Inside Method
        System.out.println();
        System.out.println("--- 5. Reference Reassignment Verification ---");
        tryReassignReference(myHolder);
        System.out.println("After call:  myHolder.value = " + myHolder.value + " (Caller reference still points to original heap object)");
        System.out.println("==================================================");
    }
}
\`\`\`

---

### 6. Line-by-Line Code Explanation
* **Lines 7–13**: Defines \`static class DataHolder\`, a simple class whose instances reside on the JVM Heap.
* **Lines 16–19**: \`tryModifyPrimitive(int number)\` receives an independent copy of \`originalValue\`. Mutating \`number\` leaves the caller's stack frame variable completely unmodified.
* **Lines 22–25**: \`modifyObjectPayload(DataHolder holder)\` receives a copy of the reference address. Accessing \`holder.value\` dereferences the memory pointer and mutates the shared heap object.
* **Lines 28–31**: \`tryReassignReference(DataHolder holder)\` rebinds the local parameter to a newly created heap instance (\`new DataHolder(999)\`). Because the reference parameter was passed by value, this reassignment does not modify \`myHolder\` in \`main()\`.
* **Lines 34–47**: \`classifyScore(int score)\` validates range invariants and employs a modern \`switch\` expression returning a concise classification without requiring traditional \`break\` statements.
* **Lines 55–65**: Primitives are allocated in the local variable array of \`main\`'s stack frame.
* **Lines 68–74**: The array \`scores\` is allocated on the Heap; the local variable \`scores\` on the stack holds its heap reference. The loop traverses elements and invokes the classifier.
* **Lines 85–97**: Concretely proves the difference between mutating a heap payload and attempting to rebind a caller's reference.

---

### 7. Expected Console Output
When compiled and run, the program produces the following exact console output:

\`\`\`text
==================================================
 SMART STUDY AI - JAVA FOUNDATIONS ARCHITECTURE
==================================================

--- 1. Primitive Variables on Stack ---
byte: 127 | int: 42 | double: 3.14159 | active: true | char: J

--- 2. Control Flow & Switch Evaluation ---
Score: 95 -> Exemplary (Grade A)
Score: 82 -> Proficient (Grade B)
Score: 74 -> Competent (Grade C)
Score: 58 -> Developing (Review Needed)

--- 3. Primitive Pass-by-Value Verification ---
Before call: originalValue = 50
Inside tryModifyPrimitive: number = 150
After call:  originalValue = 50 (Unchanged: value copy was passed)

--- 4. Reference Pass-by-Value (Heap Mutation) ---
Before call: myHolder.value = 25
Inside modifyObjectPayload: holder.value = 75
After call:  myHolder.value = 75 (Mutated: reference address accessed same heap object)

--- 5. Reference Reassignment Verification ---
Inside tryReassignReference: new local holder.value = 999
After call:  myHolder.value = 75 (Caller reference still points to original heap object)
==================================================
\`\`\`

---

### 8. Common Mistakes & How to Fix Them

#### Mistake 1: Primitive Integer Overflow
\`\`\`java
// WRONG: Integer arithmetic silently overflows when exceeding Integer.MAX_VALUE
int max = Integer.MAX_VALUE; // 2147483647
int result = max + 1; // Wraps around to -2147483648!

// CORRECT: Use 'long' or Math.addExact() to detect overflow
long safeResult = (long) max + 1;
// Or: Math.addExact(max, 1); // Throws ArithmeticException on overflow
\`\`\`

#### Mistake 2: Assuming Java is Pass-by-Reference
\`\`\`java
// WRONG ASSUMPTION: Believing that passing an object allows swapping the caller's reference
public static void swap(DataHolder a, DataHolder b) {
    DataHolder temp = a;
    a = b;
    b = temp; // Only rebinds local parameter copies! Zero effect on caller.
}

// CORRECT: Mutate the object's internal fields or return a new data container
public static void update(DataHolder target, int newValue) {
    target.value = newValue; // Modifies the object payload on the heap
}
\`\`\`

#### Mistake 3: Fall-Through in Traditional Switch Statements
\`\`\`java
// WRONG: Forgetting 'break' causes unintended cascade execution
switch (grade) {
    case 'A': System.out.println("Excellent");
    case 'B': System.out.println("Good"); // Executes even when grade is 'A'!
}

// CORRECT: Use modern arrow switch expressions or explicit 'break' statements
switch (grade) {
    case 'A' -> System.out.println("Excellent");
    case 'B' -> System.out.println("Good");
}
\`\`\`

#### Mistake 4: Claiming All Reference Variables Reside on the Stack
\`\`\`java
// CONCEPTUAL MISTAKE: "Every reference variable lives on the stack."
// REALITY:
class Person {
    String name; // 'name' is an instance reference field. It resides on the HEAP inside Person!
}
void myMethod() {
    Person p = new Person(); // 'p' is a local reference variable. It resides on the STACK.
}
\`\`\`

---

### 9. Comparative Analysis Tables

#### Table 1: JDK vs. JRE vs. JVM
| Component | Primary Function | Contents | Target User |
| :--- | :--- | :--- | :--- |
| **JVM** | Executes bytecode instructions into machine code | ClassLoader, Execution Engine (JIT + GC), Memory Areas | Runtime machine environment |
| **JRE** | Provides environment to run Java applications | JVM + Core Class Libraries (\`java.base\`, etc.) | End users running Java apps |
| **JDK** | Comprehensive developer kit for building applications | JRE + Compiler (\`javac\`), Archiver (\`jar\`), Debugger | Software developers |

#### Table 2: Primitive Types vs. Reference Types
| Dimension | Primitive Types | Reference Types |
| :--- | :--- | :--- |
| **Storage Content** | Direct binary values (e.g., bits representing \`42\`) | Memory address pointer referencing an object on the Heap |
| **Memory Location** | In stack frame (if local) or inside heap object (if field) | The reference is on stack/heap; the object payload is always on Heap |
| **Default Value** | \`0\`, \`0.0\`, \`false\`, \`'\\u0000'\` (for fields) | \`null\` |
| **Method Invocation** | Cannot invoke methods (e.g., \`int.toString()\` is illegal) | Can invoke methods declared on the class or \`Object\` |
| **Equality Operator (\`==\`)** | Compares raw binary value equality | Compares reference memory addresses (identity) |

#### Table 3: JVM Stack vs. Heap vs. Metaspace
| Feature | JVM Stack | Garbage-Collected Heap | Metaspace |
| :--- | :--- | :--- | :--- |
| **Memory Allocation** | Allocated per thread | Shared across all threads | Shared across all threads (Native Memory) |
| **Content Stored** | Stack frames: local variables, operand stacks | Instantiated objects, arrays, instance fields | Class structural metadata, bytecode, constant pool |
| **Deallocation** | Automatic when method frame pops (LIFO) | Automatic via Garbage Collector cycles | When associated ClassLoader is unloaded |
| **Overflow Error** | \`java.lang.StackOverflowError\` | \`java.lang.OutOfMemoryError: Java heap space\` | \`java.lang.OutOfMemoryError: Metaspace\` |

---

### 10. Important Exam & Interview Points
1. **Pass-by-Value Definitive Rule**: Java is 100% pass-by-value. When an object reference is passed to a method, the reference address is copied by value. You can mutate the referenced object's internal fields, but you cannot change the caller's reference variable to point to a different object.
2. **Bytecode Portability**: \`javac\` does not produce native machine code. It generates bytecode instructions conforming to the JVM specification, ensuring that any compliant JVM on any platform can execute the class file.
3. **Local Variable Initialization**: Local variables in Java are **not** given default values. Attempting to read an uninitialized local variable results in a compile-time error. Instance and static fields are automatically initialized to default values.
4. **ClassLoader Delegation Model**: Standard class loaders delegate requests upward to their parent before attempting to load a class themselves, protecting core platform classes from being overridden.
5. **Static Field Storage in HotSpot**: While class structural metadata resides in Metaspace native memory, static fields are stored in the \`java.lang.Class\` object allocated on the Garbage-Collected Heap.

---

### 11. Short High-Yield Recap
* **JDK** contains tools like \`javac\`; **JRE** contains runtime libraries; **JVM** executes bytecode.
* The 8 primitives store direct binary bits; reference types hold addresses pointing to heap objects.
* Local variables in methods live in thread **Stack Frames**; object payloads and instance reference fields reside on the **Heap**; class metadata resides in **Metaspace**.
* Java is strictly **pass-by-value**: primitive values and reference addresses are passed by copy.
* Modern switch expressions and enhanced loops provide concise, bug-resistant control flow.

---

### 12. Practice Questions & Detailed Explanations

#### Question 1 (Memory Architecture)
**Question**: Where in JVM memory do: (a) a local variable holding an \`int\`, (b) an instantiated \`String\` object, and (c) an instance field referencing another object reside?
* **Answer / Explanation**:
  - (a) A local \`int\` variable declared inside a method resides in the **Local Variable Array of that thread's Stack Frame** on the thread stack.
  - (b) The instantiated \`String\` object payload resides on the **Garbage-Collected JVM Heap**.
  - (c) An instance field referencing another object is stored **on the Heap inside the parent object's memory payload**. The reference variable itself is an offset inside the heap object pointing to another heap location.

#### Question 2 (Pass-by-Value Mechanics)
**Question**: Explain what the following code prints and why:
\`\`\`java
public static void update(int[] arr) {
    arr[0] = 99;
    arr = new int[] { 1, 2, 3 };
}
public static void main(String[] args) {
    int[] nums = { 10, 20 };
    update(nums);
    System.out.println(nums[0] + ", " + nums.length);
}
\`\`\`
* **Answer / Explanation**: It prints **\`99, 2\`**. The reference to \`nums\` is passed by value (copied). The statement \`arr[0] = 99\` dereferences that copied pointer and mutates index 0 of the original heap array. However, \`arr = new int[] { 1, 2, 3 }\` rebinds only the local parameter variable \`arr\` to a new array on the heap. \`nums\` in \`main\` remains bound to the original 2-element array.

#### Question 3 (Compilation & Bytecode)
**Question**: What is the difference between \`javac\` and the JVM execution engine?
* **Answer / Explanation**: \`javac\` is the static frontend compiler in the JDK that translates human-readable Java source files into platform-neutral bytecode (\`.class\`). The JVM execution engine is the runtime subsystem (interpreter and JIT compiler) that executes that bytecode by converting it into native CPU instructions on the host machine.

#### Question 4 (ClassLoader Lifecycle)
**Question**: What are the three phases of the ClassLoader Linking stage, and what does the bytecode verifier do?
* **Answer / Explanation**: The three linking phases are **Verification**, **Preparation**, and **Resolution**. The bytecode verifier inspects the loaded \`.class\` binary to ensure that instructions conform to Java language specifications, verifying type safety, preventing stack overflows/underflows, and guarding against illegal memory access.

#### Question 5 (Control Flow Evaluation)
**Question**: Given \`int x = 5, y = 10;\`, what does \`if (x > 10 && ++y > 10)\` evaluate to, and what will be the final value of \`y\`?
* **Answer / Explanation**: The condition evaluates to \`false\`, and **\`y\` remains \`10\`**. Because Java logical AND (\`&&\`) uses short-circuit evaluation, the left-hand expression \`x > 10\` evaluates to \`false\`, so the right-hand operand \`++y > 10\` is never evaluated, skipping the increment.

---

### 13. Revision Summary & Key Takeaways
* **Compilation & Execution Pipeline**: Human-readable \`.java\` code compiles via \`javac\` into hardware-neutral \`.class\` bytecode, loaded dynamically by the ClassLoader (Loading, Linking, Initialization) and executed by the JVM (Interpreter + JIT Compiler + GC).
* **JDK vs. JRE vs. JVM**: The JDK includes developer tools (e.g. \`javac\`, \`jar\`) + JRE; the JRE includes core class libraries (\`java.base\`) + JVM; the JVM executes bytecode.
* **JVM Runtime Memory Model**: Thread Stacks store stack frames containing local primitives and local reference pointers; the Garbage-Collected Heap stores all instantiated object payloads and their instance reference fields; Metaspace stores class structural metadata.
* **Strict Pass-by-Value**: Java is exclusively pass-by-value. Passing an object reference copies the address pointer; mutating the payload affects the shared heap object, but reassigning the local parameter reference cannot rebind the caller's reference variable.
* **Primitive Types & Control Flow**: Master the 8 primitive types, type promotion, operator precedence, short-circuit logic (\`&&\`, \`||\`), and modern arrow \`switch\` expressions.
`;
}

/**
 * Unit: Java Classes & Objects (Object-Oriented Programming)
 */
function buildJavaClassesObjectsNotes(
  subject: string,
  topic: string,
  _theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic} (Java Programming)

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* **The Blueprint vs. Instance Paradigm**: Understand how a Java \`class\` defines data fields and methods, while an \`object\` represents a concrete runtime instance allocated on the JVM Heap.
* **State & Behavior Modeling**: Design encapsulated classes where internal state is protected via \`private\` modifiers and exposed safely through accessor and mutator methods.
* **Instantiation Mechanics**: Understand the exact execution flow of the \`new\` operator, constructor initialization, and reference assignment.
* **Accurate Memory Architecture**: Master the distinction between local reference variables in method stack frames and object payloads on the JVM Heap, including the fact that instance reference fields reside inside the object payload on the heap.
* **Production Debugging**: Identify and resolve frequent beginner pitfalls including \`NullPointerException\`, identity comparison (\`==\`) vs value equality (\`.equals()\`), parameter shadowing, and static context traps.

*Prerequisites*: Basic Java syntax, primitive variables, and method signatures.

---

### 2. Prerequisites & JVM Execution Architecture
In Java, object execution follows a strictly structured compilation and runtime lifecycle:
1. **Compilation (\`javac\`)**: Human-readable source code (\`.java\`) is parsed and compiled into platform-neutral bytecode (\`.class\`).
2. **Classloading**: The JVM ClassLoader loads class definitions, bytecode, and structural metadata into native **Metaspace**.
3. **Execution & Memory Layout**:
   - **Thread Call Stack**: Holds stack frames for active methods. Local reference variables store memory address pointers referencing objects on the heap.
   - **Garbage-Collected Heap**: Dynamically stores all instantiated object payloads, arrays, and their instance fields (including instance reference fields).
   - **Metaspace**: Stores class structural definitions, method bytecode, field signatures, and the runtime constant pool. Static fields are stored in the associated \`java.lang.Class\` object on the heap.

---

### 3. Clear Definition & Conceptual Explanation (Beginner-Friendly)
In Java, Object-Oriented Programming models real-world systems through two foundational abstractions:

#### 1. What is a Class?
A **Class** is an architectural blueprint, template, or prototype from which individual objects are created. A class specifies:
* **Fields (State/Attributes)**: What data the entity holds (e.g., \`studentId\`, \`fullName\`, \`gradePointAverage\`).
* **Methods (Behavior/Functions)**: What operations the entity can perform (e.g., \`isHonorRollEligible()\`, \`printSummary()\`).
* **Constructors**: Special initialization blocks executed whenever an object is instantiated.

> **Intuitive Analogy**: A class is like the architectural blueprint of a house. The blueprint defines rooms, dimensions, and wiring diagrams, but nobody can sleep inside a blueprint.

#### 2. What is an Object?
An **Object** is a concrete, self-contained runtime instance created from the class blueprint. Each object maintains its own private copy of instance fields in heap memory.

> **Intuitive Analogy**: If the class is the house blueprint, an object is an actual, physical brick-and-mortar house constructed on a plot of land (the JVM Heap). You can build 50 different houses from a single blueprint.

#### 3. The Role of the \`new\` Keyword
The \`new\` keyword performs three critical actions in atomic sequence:
1. Calculates the required memory size for all instance fields in the class.
2. Dynamically allocates that memory block on the JVM Garbage-Collected Heap.
3. Invokes the matching constructor to initialize the newly created object's state and returns the heap memory address to the reference variable.

---

### 4. Why This Concept Is Useful & Where It Is Used
Object-oriented modeling in Java is the foundation of modern enterprise software:
* **Enterprise Web APIs (Spring Boot)**: Database entities, services, and DTOs (Data Transfer Objects) are modeled as Java classes mapped to relational tables.
* **Android Development**: User interface elements (\`Button\`, \`TextView\`) and business domain models are classes instantiated during activity lifecycles.
* **Maintainability & Encapsulation**: Restricting direct field access ensures that internal validation invariants can change without breaking client code that depends on public interfaces.

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
        // 1. Private instance fields (Encapsulated State on the Heap)
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
        System.out.println();
        System.out.println("--- Initial Student Records ---");
        student1.printSummary();
        student2.printSummary();

        // Mutating object state safely through setter method
        System.out.println();
        System.out.println("--- Updating James Gosling's GPA ---");
        student2.setGpa(3.85); // James is now eligible for honor roll
        student2.printSummary();

        // Demonstrating object reference independence
        System.out.println();
        System.out.println("--- Demonstrating Independent Heap Memory ---");
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
* **Lines 8–14**: Defines private instance fields (\`studentId\`, \`fullName\`, \`gradePointAverage\`, \`isEnrolled\`). Declaring them private prevents external callers from directly corrupting state (e.g., setting a negative GPA).
* **Lines 17–23**: The default no-argument constructor sets sensible fallbacks when parameters are omitted.
* **Lines 26–34**: The parameterized constructor uses \`this.studentId = studentId\` to resolve parameter shadowing, delegating GPA assignment to \`setGpa()\` to enforce validation.
* **Lines 37–51**: Accessor methods (\`getters\`) grant read-only visibility to private internal fields.
* **Lines 54–67**: Mutator methods (\`setters\`) enforce validation rules before committing changes to internal state.
* **Lines 70–72**: \`isHonorRollEligible()\` defines dynamic class behavior derived from internal state.
* **Lines 75–81**: \`printSummary()\` outputs a formatted record without broken string literals.
* **Lines 90–94**: In \`main()\`, two distinct object instances (\`student1\` and \`student2\`) are allocated on the heap using \`new Student(...)\`.
* **Lines 102–105**: Modifying \`student2.setGpa(3.85)\` updates only \`student2\`'s heap memory without altering \`student1\`.

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
| **Storage Target** | Method call frames, local variables, reference pointers | Actual object instances, arrays, and instance fields |
| **Lifecycle** | Automatic allocation and deallocation on method exit (LIFO) | Managed by the JVM Garbage Collector |
| **Access Speed** | Extremely fast (LIFO execution) | Slightly slower due to dynamic heap addressing |
| **Scope** | Private to the executing thread | Shared across all threads in the JVM |

---

### 12. Important Exam & Interview Points
1. **Default Constructor Rule**: If you do not write any constructors, the Java compiler automatically inserts a default no-argument constructor. However, if you write **any** custom constructor (e.g., parameterized), the compiler will **not** generate the default constructor automatically.
2. **Pass-by-Value in Java**: Java is strictly **pass-by-value**. When passing an object to a method, the **value of the reference address** is copied. Mutating the object's fields inside the method affects the original object, but reassigning the parameter reference does not alter the caller's reference.
3. **Encapsulation Definition**: Binding data (fields) and code (methods) together while hiding internal implementation details behind private access modifiers.
4. **Metaspace vs. Heap**: Class definitions, static methods, and bytecode reside in Metaspace; object instances and their instance fields reside on the Heap.

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
* **Answer / Explanation**: A Class is a compile-time blueprint defining the state structure and method behavior of a type; its structural definition is loaded into the JVM **Metaspace**. An Object is a runtime instance created dynamically from that blueprint using the \`new\` keyword; all object instance payloads reside on the **Garbage-Collected JVM Heap**.

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
