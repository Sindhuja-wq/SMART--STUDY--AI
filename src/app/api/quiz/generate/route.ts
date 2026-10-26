import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIContentDetailed } from "@/lib/ai";
import { classifySubject, getDomainProfile } from "@/lib/subjectDomains";
import {
  validateQuizQuestions,
  buildSubjectAwareFallbackQuestions,
  QuizQuestionCandidate,
} from "@/lib/academicValidator";

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

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID required" }, { status: 400 });
    }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        roadmap: true,
        questions: { where: { isActive: true } },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    if (topic.roadmap.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check-only query from UI component
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

    const subject = topic.roadmap.subject || "General Academic Studies";
    const theorySummary = (topic.notes || topic.theory).substring(0, 1800);
    const domain = classifySubject(subject, topic.title, topic.roadmap.syllabus || undefined);
    const domainProfile = getDomainProfile(domain, subject);

    const systemPrompt = `You are a university examiner and senior academic assessment specialist in ${domainProfile.displayName}.
Create a high-yield, academically rigorous multiple-choice assessment of EXACTLY 5 questions for "${subject}".
ASSESSMENT RULES:
1. Output JSON only matching the schema:
   {"questions": [{"text": "...", "options": ["A", "B", "C", "D"], "correctOption": 0, "explanation": "..."}]}
2. EXACTLY 5 questions.
3. EXACTLY 4 distinct options per question.
4. EXACTLY ONE correct answer per question (integer index 0, 1, 2, or 3).
5. Distribute the correct answer index across 0, 1, 2, and 3 (do NOT place every correct answer at option 0).
6. Provide a detailed, pedagogical explanation explaining WHY the correct option is right and why distractors are incorrect.
7. Focus strictly on ${subject}. Do NOT include computer programming distractors for non-computing subjects.
8. No 'All of the above' or 'None of the above'.`;

    const userPrompt = `Create a 5-question mastery assessment for:
Subject: "${subject}" (Domain: ${domainProfile.displayName})
Topic: "${topic.title}"
Context / Notes Excerpt: "${theorySummary}"

PEDAGOGICAL INSTRUCTIONS FOR THIS DISCIPLINE:
- Focus: ${domainProfile.pedagogicalFocus}
- Prohibited: ${domainProfile.forbiddenElements.join("; ")}

Respond ONLY with valid JSON with root key "questions" containing 5 question objects.`;

    let generatedQuestions: QuizQuestionCandidate[] = [];

    // Attempt 1: AI Generation
    try {
      const genResult = await generateAIContentDetailed({
        systemPrompt,
        prompt: userPrompt,
        formatJson: true,
        temperature: 0.2,
        maxTokens: 2000,
        timeoutMs: 22000,
      });

      if (genResult.content) {
        const cleanedJson = genResult.content.replace(/```json\s*|```/g, "").trim();
        const parsed = JSON.parse(cleanedJson) as { questions?: unknown };
        const candidateQuestions = Array.isArray(parsed) ? parsed : parsed.questions;

        const validation = validateQuizQuestions(candidateQuestions, {
          subject,
          topic: topic.title,
          domain,
        });

        if (validation.valid && validation.cleanQuestions) {
          generatedQuestions = validation.cleanQuestions;
        } else {
          console.warn(`[Quiz Validation] AI questions failed validation (${validation.error}). Executing bounded repair retry...`);

          // Bounded Repair Retry
          const repairPrompt = `${userPrompt}\n\nATTENTION - PREVIOUS QUIZ DEFECTS TO FIX:
${validation.error}
Please regenerate the 5 questions in valid JSON adhering strictly to all requirements.`;

          const repairResult = await generateAIContentDetailed({
            systemPrompt,
            prompt: repairPrompt,
            formatJson: true,
            temperature: 0.15,
            maxTokens: 2000,
            timeoutMs: 20000,
          });

          if (repairResult.content) {
            const cleanedRepair = repairResult.content.replace(/```json\s*|```/g, "").trim();
            const parsedRepair = JSON.parse(cleanedRepair) as { questions?: unknown };
            const candidateRepair = Array.isArray(parsedRepair) ? parsedRepair : parsedRepair.questions;

            const secondValidation = validateQuizQuestions(candidateRepair, {
              subject,
              topic: topic.title,
              domain,
            });

            if (secondValidation.valid && secondValidation.cleanQuestions) {
              generatedQuestions = secondValidation.cleanQuestions;
            }
          }
        }
      }
    } catch (err: unknown) {
      console.warn("[Quiz Generation] AI generation failed, using subject-aware assessment generator:", err);
    }

    // High quality topic-tailored questions if AI is offline or failed validation
    if (generatedQuestions.length !== 5) {
      generatedQuestions = buildSubjectAwareFallbackQuestions(subject, topic.title);
    }

    // Save active questions in a single database transaction
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

    return NextResponse.json({ success: true, questions: createdQuestions, domain });
  } catch (error: unknown) {
    console.error("Quiz API internal error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
