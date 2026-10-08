import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topicId } = await req.json();
    if (!topicId) return NextResponse.json({ error: "Topic ID required" }, { status: 400 });

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { roadmap: true, questions: true }
    });

    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    if (topic.roadmap.userId !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // If questions already exist, just return them
    if (topic.questions.length > 0) {
      return NextResponse.json({ success: true, questions: topic.questions });
    }

    const prompt = `
Generate a multiple-choice quiz with exactly 3 questions for the topic: "${topic.title}".
Based on this theory: "${topic.theory.substring(0, 500)}...".
Respond ONLY in valid JSON format with an array of objects:
[
  {
    "text": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOption": 1
  }
]
Note: correctOption is the zero-based index of the correct answer in the options array.
Do not include markdown tags. Return ONLY the raw JSON array.
`;

    let generatedQuestions = [];
    try {
      const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2",
          prompt: prompt,
          stream: false,
          format: "json"
        }),
      });

      if (!ollamaResponse.ok) throw new Error("Ollama error");

      const ollamaData = await ollamaResponse.json();
      let rawJson = ollamaData.response.trim();
      if (rawJson.startsWith("\`\`\`json")) {
        rawJson = rawJson.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      } else if (rawJson.startsWith("\`\`\`")) {
        rawJson = rawJson.replace(/\`\`\`/g, "").trim();
      }

      generatedQuestions = JSON.parse(rawJson);
    } catch (err) {
      console.error("Quiz generation error", err);
      return NextResponse.json({ error: "Failed to generate quiz. Is Ollama running?" }, { status: 500 });
    }

    // Save questions to DB
    const createdQuestions = await prisma.$transaction(
      generatedQuestions.map((q: any) =>
        prisma.question.create({
          data: {
            topicId,
            text: q.text,
            options: JSON.stringify(q.options),
            correctOption: q.correctOption,
          }
        })
      )
    );

    return NextResponse.json({ success: true, questions: createdQuestions });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
