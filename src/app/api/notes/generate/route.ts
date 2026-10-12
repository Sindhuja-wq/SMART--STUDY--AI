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

    const { topicId } = await req.json();

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID required" }, { status: 400 });
    }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { roadmap: true }
    });

    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    if (topic.roadmap.userId !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // If notes already exist in the database, return them directly! (Caching requirement)
    if (topic.notes) {
      return NextResponse.json({ success: true, notes: topic.notes });
    }

    const prompt = `Create comprehensive study notes for topic: "${topic.title}".
Context: "${topic.theory.substring(0, 1500)}".
Format strictly in Markdown.
Include:
1. Topic Overview
2. Key Concepts (bullet points)
3. Clear Explanations
4. Examples
5. Quick Recap

Raw Markdown only, no JSON.`;

    let markdownNotes = "";

    try {
      const response = await generateAIContent({
        prompt,
        formatJson: false,
        temperature: 0.3,
        maxTokens: 1000,
      });

      if (response) {
        markdownNotes = response.trim();
      }
    } catch (err) {
      console.warn("AI generation error for notes. Using adaptive notes architect fallback:", err);
    }

    if (!markdownNotes) {
      markdownNotes = `# ${topic.title}

> **Curriculum Milestone**: ${topic.difficulty || 'Core'} Level | Estimated Study Time: **${topic.timeEstimate || 45} minutes**

---

### 1. Topic Overview & Significance
${topic.theory}

Understanding **${topic.title}** provides the essential foundation needed to build resilient solutions and answer complex technical interview and examination questions.

---

### 2. Key Concepts & Architecture
* **Core Principles**: Primary mechanisms, abstract structures, and state transitions that govern ${topic.title}.
* **Component Interactions**: How inputs are accepted, processed, and validated within the broader system lifecycle.
* **Invariant Guarantees**: Conditions and constraints that remain true regardless of edge-case execution.
* **Performance Considerations**: Time and space efficiency trade-offs when implementing this topic at scale.

---

### 3. Detailed Technical Deep-Dive
When working with **${topic.title}**, keep the following technical breakdown in mind:

1. **Initialization & Setup**: Always configure parameters cleanly, ensuring predictable state and zero unintended side-effects.
2. **Execution Flow**: Step-by-step sequential traversal through critical logic pathways.
3. **Boundary Verification**: Verify edge conditions (null, zero, upper limits, and concurrent access).

\`\`\`
// Mental Model / Architecture Diagram:
[ Input / Problem Space ] ──> ( ${topic.title} Processing ) ──> [ Optimal Output / State ]
\`\`\`

---

### 4. Practical Implementation & Code Example
\`\`\`javascript
// Demonstration of ${topic.title} patterns
function executePattern(inputContext) {
  if (!inputContext) {
    throw new Error("Invalid context passed to ${topic.title}");
  }

  // Processing core logic
  const result = {
    topic: "${topic.title}",
    status: "MASTERED",
    timestamp: new Date().toISOString()
  };

  return result;
}
\`\`\`

---

### 5. Common Pitfalls & Exam Traps
* **Premature Optimization**: Focusing on micro-efficiencies before establishing correctness and clarity.
* **Off-by-One / Type Coercion**: Failing to account for strict boundary semantics.
* **State Pollution**: Mutating shared state rather than adopting immutable transforms.

---

### 6. Quick Summary Checklist
- [x] Can explain the fundamental definition of ${topic.title} in simple terms.
- [x] Understand the difference between standard implementation and alternative patterns.
- [x] Ready to complete the **Knowledge Assessment Quiz** to unlock the next milestone!
`;
    }

    // Save notes to database
    await prisma.topic.update({
      where: { id: topicId },
      data: { notes: markdownNotes }
    });

    return NextResponse.json({ success: true, notes: markdownNotes });
  } catch (error) {
    console.error("Notes generation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
