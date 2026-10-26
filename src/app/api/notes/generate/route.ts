import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIContentDetailed } from "@/lib/ai";
import {
  classifySubject,
  getDomainProfile,
  buildSubjectAwareFallbackNotes,
} from "@/lib/subjectDomains";
import { validateNotesContent } from "@/lib/academicValidator";

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

    const subject = topic.roadmap.subject || "General Academic Studies";
    const syllabus = topic.roadmap.syllabus || "";
    const isExamMode = topic.roadmap.type === "EXAM";
    const difficulty = topic.difficulty || "Intermediate";
    const studyTime = topic.timeEstimate || 45;

    const domain = classifySubject(subject, topic.title, syllabus);
    const domainProfile = getDomainProfile(domain, subject);

    // Caching check:
    // If notes exist and forceRegenerate is false, inspect cached notes quality.
    // If the cached note contains legacy cross-domain contamination (e.g. old CS boilerplate in a Biology topic),
    // we safely bypass the stale cache to ensure educational accuracy.
    if (topic.notes && !forceRegenerate) {
      const cachedValidation = validateNotesContent(topic.notes, {
        subject,
        topic: topic.title,
        syllabus,
        domain,
      });

      if (cachedValidation.valid) {
        return NextResponse.json({
          success: true,
          notes: topic.notes,
          domain,
          cached: true,
        });
      }
      console.log(`[Notes Cache] Cached notes for '${topic.title}' failed current quality audit (${cachedValidation.issues.join(", ")}). Re-synthesizing fresh notes.`);
    }

    // Build discipline-specific, pedagogically grounded prompts
    const systemPrompt = `You are a ${domainProfile.systemRole} specializing in ${subject}.
Your mission is to produce comprehensive, rigorous, step-by-step, highly readable study notes in GitHub Flavored Markdown.
PEDAGOGICAL REQUIREMENTS FOR THIS DISCIPLINE:
- Focus: ${domainProfile.pedagogicalFocus}
- Mandatory Elements: ${domainProfile.requiredElements.join("; ")}
- Strict Prohibitions: ${domainProfile.forbiddenElements.join("; ")}

CRITICAL RULES:
1. Adapt explanations strictly to ${subject}. Do NOT insert computer code, programming terminology, or generic ASCII workflows into non-computing disciplines.
2. For computing and programming disciplines (e.g. Java, Python, SQL), all code must be 100% syntactically valid, complete, and runnable with main entry points, expected console output, and line-by-line explanations. Never use dummy stubs.
3. Complete all sentences and markdown sections. Never truncate mid-sentence.
4. If formulas or calculations are required, show the step-by-step derivation with concrete numbers and verify the final answer.
5. In the final section, provide exactly 5 high-yield practice questions with detailed answers and explanations in a separate section.
6. Output raw GitHub Flavored Markdown only.`;

    const userPrompt = `Generate comprehensive, exam-grade academic study notes for:
Subject: "${subject}" (Domain: ${domainProfile.displayName})
Topic Title: "${topic.title}"
Context / Theory: "${topic.theory}"
${syllabus ? `Mandatory Syllabus Scope to Ground Content In:\n"""\n${syllabus}\n"""\n` : ""}
Target Difficulty: ${difficulty}
Estimated Study Time: ${studyTime} minutes
Mode: ${isExamMode ? "High-Yield Exam Preparation & Problem Solving" : "Deep Course Mastery from Foundations to Advanced"}

STRUCTURE YOUR NOTES COVERING THESE EXACT SECTIONS:
# ${topic.title}
> **Subject**: ${subject} | **Domain**: ${domainProfile.displayName} | **Difficulty**: ${difficulty} | **Study Time**: ${studyTime} mins | **Mode**: ${isExamMode ? "Exam Preparation" : "Course Learning"}
${syllabus ? `> Grounded in requested syllabus scope: ${topic.title}\n` : ""}

Follow these structural sections in order:
${domainProfile.notesStructure.join("\n")}

Respond ONLY with complete, high-yield, academically rigorous markdown.`;

    let generatedMarkdown = "";
    let isFallback = false;

    // AI Generation Attempt 1
    try {
      const genResult = await generateAIContentDetailed({
        systemPrompt,
        prompt: userPrompt,
        formatJson: false,
        temperature: 0.25,
        maxTokens: 4000,
        timeoutMs: 28000,
      });

      if (genResult.content && genResult.content.trim().length > 300) {
        const initialValidation = validateNotesContent(genResult.content, {
          subject,
          topic: topic.title,
          syllabus,
          domain,
        });

        if (initialValidation.valid) {
          generatedMarkdown = genResult.content.trim();
        } else {
          console.warn(`[Notes Validation] Initial AI notes failed quality check (${initialValidation.issues.join("; ")}). Executing bounded repair retry...`);

          // Bounded Repair Retry: Send specific feedback back to the AI model
          const repairPrompt = `${userPrompt}\n\nATTENTION - PREVIOUS DRAFT DEFECTS TO CORRECT IMMEDIATELY:
Your previous draft had the following critical issues:
${initialValidation.issues.map((iss) => `- ${iss}`).join("\n")}

Please re-generate the complete study notes ensuring that ALL of the above issues are fully resolved. Ensure complete sentences, domain accuracy, runnable examples with output, and zero forbidden elements.`;

          const repairResult = await generateAIContentDetailed({
            systemPrompt,
            prompt: repairPrompt,
            formatJson: false,
            temperature: 0.2,
            maxTokens: 4000,
            timeoutMs: 28000,
          });

          if (repairResult.content && repairResult.content.trim().length > 300) {
            const repairValidation = validateNotesContent(repairResult.content, {
              subject,
              topic: topic.title,
              syllabus,
              domain,
            });
            if (repairValidation.valid) {
              generatedMarkdown = repairResult.content.trim();
            } else {
              console.warn(`[Notes Validation] Repaired draft still had issues (${repairValidation.issues.join("; ")}). Activating subject-aware educational fallback.`);
            }
          }
        }
      }
    } catch (err: unknown) {
      console.warn("[Notes Generation] AI generation encountered error, falling back to subject-aware engine:", err);
    }

    // High quality pedagogical fallback if cloud AI is offline or failed validation
    if (!generatedMarkdown) {
      isFallback = true;
      generatedMarkdown = buildSubjectAwareFallbackNotes({
        subject,
        topicTitle: topic.title,
        theory: topic.theory,
        difficulty: topic.difficulty,
        timeEstimate: topic.timeEstimate,
        isExamMode,
        syllabus,
      });
    }

    // Persist validated notes in database
    await prisma.topic.update({
      where: { id: topicId },
      data: { notes: generatedMarkdown },
    });

    return NextResponse.json({
      success: true,
      notes: generatedMarkdown,
      domain,
      isFallback,
    });
  } catch (error: unknown) {
    console.error("Notes generation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
