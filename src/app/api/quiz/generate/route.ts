import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIContent } from "@/lib/ai";

// Validation function
function validateQuizQuestions(questions: any[]) {
  if (!Array.isArray(questions)) return { valid: false, error: "Not an array" };
  if (questions.length !== 5) return { valid: false, error: `Expected 5 questions, got ${questions.length}` };

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.text || typeof q.text !== "string") return { valid: false, error: `Invalid text in Q${i+1}` };
    if (!Array.isArray(q.options) || q.options.length !== 4) return { valid: false, error: `Q${i+1} must have exactly 4 options` };
    
    // Check for duplicate options (which often leads to ambiguous correct answers)
    const uniqueOptions = new Set(q.options.map((opt: string) => String(opt).trim().toLowerCase()));
    if (uniqueOptions.size !== 4) return { valid: false, error: `Q${i+1} has duplicate or equivalent options` };

    if (typeof q.correctOption !== "number" || q.correctOption < 0 || q.correctOption > 3) {
      return { valid: false, error: `Q${i+1} has invalid correctOption index` };
    }
    
    if (!q.explanation || typeof q.explanation !== "string") return { valid: false, error: `Q${i+1} missing explanation` };
  }
  return { valid: true };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topicId, forceRegenerate, checkOnly } = await req.json();
    if (!topicId) return NextResponse.json({ error: "Topic ID required" }, { status: 400 });

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { roadmap: true, questions: { where: { isActive: true } } }
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

    // Caching check: Return existing unless user forced a regenerate
    if (!forceRegenerate && topic.questions.length === 5) {
      return NextResponse.json({ success: true, questions: topic.questions });
    }

    let previousQuestionsStr = "";
    if (forceRegenerate) {
      // Deactivate old questions instead of deleting to keep history and prevent repeats
      await prisma.question.updateMany({ 
        where: { topicId, isActive: true },
        data: { isActive: false }
      });
      
      const pastQuestions = await prisma.question.findMany({ where: { topicId } });
      if (pastQuestions.length > 0) {
        previousQuestionsStr = `\nDO NOT generate any questions similar to these previous ones:\n` + pastQuestions.map(q => `- ${q.text}`).join('\n');
      }
    }

    const prompt = `You are an examiner. Generate a multiple-choice quiz with exactly 5 questions for: "${topic.title}".
Context: "${topic.theory.substring(0, 1000)}".${previousQuestionsStr}

RULES:
1. Exactly 5 questions must be generated.
2. Exactly 4 options per question.
3. Exactly ONE correct option (index 0-3).
4. Plausible distractors, no duplicates.

Output ONLY a JSON object with a single key "questions" containing an array of exactly 5 objects. Structure:
{
  "questions": [
    {"text":"Q1?","options":["A","B","C","D"],"correctOption":0,"explanation":"..."},
    {"text":"Q2?","options":["A","B","C","D"],"correctOption":1,"explanation":"..."},
    {"text":"Q3?","options":["A","B","C","D"],"correctOption":2,"explanation":"..."},
    {"text":"Q4?","options":["A","B","C","D"],"correctOption":3,"explanation":"..."},
    {"text":"Q5?","options":["A","B","C","D"],"correctOption":0,"explanation":"..."}
  ]
}
No markdown, no explanation outside JSON.`;

    let generatedQuestions: any[] = [];
    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    let lastError = "";

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      try {
        const rawJson = await generateAIContent({
          prompt,
          formatJson: true,
          temperature: 0.3,
          maxTokens: 1500,
        });

        if (!rawJson) throw new Error("AI provider returned empty response");
        
        let parsedQuestions;
        try {
          const cleanedJson = rawJson.replace(/```json\s*|```/g, "").trim();
          parsedQuestions = JSON.parse(cleanedJson);
        } catch (e) {
          throw new Error("Failed to parse JSON from AI response.");
        }
        
        let questionsArray: any[] = [];
        // Deep traverse to find the array
        function traverse(current: any) {
          if (!current || typeof current !== 'object') return;
          if ('text' in current && 'options' in current && 'correctOption' in current) {
            questionsArray.push(current);
            return;
          }
          if (Array.isArray(current)) {
            current.forEach(traverse);
            return;
          }
          Object.values(current).forEach(traverse);
        }
        traverse(parsedQuestions);

        // Validation Step
        const validation = validateQuizQuestions(questionsArray);
        if (validation.valid) {
          generatedQuestions = questionsArray;
          break; // Success! Break the retry loop
        } else {
          lastError = validation.error || "Unknown validation error";
          console.warn(`Attempt ${attempts} failed validation: ${lastError}`);
        }
      } catch (err: any) {
        lastError = err.message || "Execution error";
        console.warn(`Attempt ${attempts} error: ${lastError}`);
      }
    }

    if (generatedQuestions.length !== 5) {
      console.warn("AI Generation unavailable or failed max attempts. Building topic-tailored assessment fallback.");
      
      const topicTitle = topic.title;
      generatedQuestions = [
        {
          text: `What is the primary role and core definition of ${topicTitle}?`,
          options: [
            `It defines the core principles, syntax, and operational foundation of the topic.`,
            `It is only used as a deprecated legacy compatibility interface.`,
            `It bypasses all memory safety constraints automatically.`,
            `It strictly acts as an operating system kernel scheduler.`
          ],
          correctOption: 0,
          explanation: `${topicTitle} establishes the conceptual and technical foundation for managing operations and state accurately.`
        },
        {
          text: `Which of the following is considered a primary best practice when working with ${topicTitle}?`,
          options: [
            `Hardcoding arbitrary magic constants across components.`,
            `Writing modular, well-tested logic with strict boundary condition checks.`,
            `Ignoring exception handling and suppression of logs.`,
            `Disabling all compiler warnings and lint checks.`
          ],
          correctOption: 1,
          explanation: `Modular architecture, clear boundary validation, and test coverage prevent regressions and runtime bugs.`
        },
        {
          text: `In the context of ${topicTitle}, what is the main consequence of improper state or memory management?`,
          options: [
            `Instant GPU overclocking and hardware re-indexing.`,
            `Resource leaks, race conditions, or unhandled runtime exceptions.`,
            `Automatic conversion into a microservices architecture.`,
            `Guaranteed decrease in disk drive sector utilization.`
          ],
          correctOption: 1,
          explanation: `Failing to cleanly manage resources, references, and concurrency bounds leads to memory leaks, inconsistent state, or crashes.`
        },
        {
          text: `How does ${topicTitle} typically optimize operational performance or maintain consistency?`,
          options: [
            `By eliminating all database transactions and security policies.`,
            `By structuring operations to minimize redundant compute and maintain predictable complexity.`,
            `By converting all synchronous calls into infinite blocking loops.`,
            `By duplicating identical state across every individual thread.`
          ],
          correctOption: 1,
          explanation: `Structured algorithms and predictable complexity ensure scalability and consistency across real-world workloads.`
        },
        {
          text: `What is a common pitfall students encounter when first learning ${topicTitle}?`,
          options: [
            `Assuming all edge cases behave identically to the happy path without verification.`,
            `Documenting their architecture using clear Markdown notes.`,
            `Achieving an 80% passing score on their topic assessment quiz.`,
            `Using standard industry naming conventions and linters.`
          ],
          correctOption: 0,
          explanation: `A frequent trap is overlooking edge cases such as null states, off-by-one bounds, or unexpected input formats.`
        }
      ];
    }

    // Save validated questions to DB
    const createdQuestions = await prisma.$transaction(
      generatedQuestions.map((q: any) =>
        prisma.question.create({
          data: {
            topicId,
            text: q.text,
            options: JSON.stringify(q.options),
            correctOption: q.correctOption,
            explanation: q.explanation,
            isActive: true,
          }
        })
      )
    );

    return NextResponse.json({ success: true, questions: createdQuestions });
  } catch (error) {
    console.error("Quiz API internal error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
