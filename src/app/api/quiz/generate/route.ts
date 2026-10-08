import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
      include: { roadmap: true, questions: true }
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

    if (forceRegenerate && topic.questions.length > 0) {
      // Clear old questions
      await prisma.question.deleteMany({ where: { topicId } });
    }

    const prompt = `You are an examiner. Generate a multiple-choice quiz with exactly 5 questions for: "${topic.title}".
Context: "${topic.theory.substring(0, 1000)}".

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
        const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3.2",
            prompt: prompt,
            stream: false,
            format: "json",
            options: {
              temperature: 0.2,
              num_predict: 1500,
              num_ctx: 2048
            }
          }),
        });

        if (!ollamaResponse.ok) throw new Error("Ollama connection failed");

        const ollamaData = await ollamaResponse.json();
        const rawJson = ollamaData.response.trim();
        
        let parsedQuestions;
        try {
          parsedQuestions = JSON.parse(rawJson);
        } catch (e) {
          throw new Error("Failed to parse JSON from Ollama.");
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
      console.error("AI Generation failed after max attempts:", lastError);
      return NextResponse.json({ error: `Failed to generate a valid quiz. Last error: ${lastError}` }, { status: 500 });
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
