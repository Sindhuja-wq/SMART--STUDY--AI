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

    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 800,
          num_ctx: 2048
        }
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error("Failed to connect to Ollama");
    }

    const ollamaData = await ollamaResponse.json();
    const markdownNotes = ollamaData.response.trim();

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
