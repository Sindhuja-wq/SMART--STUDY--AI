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

    const { title, subject, syllabus, examDate, dailyStudyTime } = await req.json();

    if (!title || !subject || !syllabus || !examDate || !dailyStudyTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const examDateObj = new Date(examDate);
    const daysLeft = Math.ceil((examDateObj.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

    const prompt = `
Given the subject "${subject}" and syllabus: "${syllabus}", the exam is in ${daysLeft} days, and I can study ${dailyStudyTime} minutes per day.
Generate a structured study roadmap with a realistic distribution of topics considering the time left.
Respond ONLY in valid JSON format with this exact structure, containing an array of objects:
[
  {
    "title": "Topic Name",
    "theory": "A brief but comprehensive theory/explanation of this topic.",
    "videoUrl": "https://www.youtube.com/results?search_query=Topic+Name"
  }
]
Do not include markdown tags like \`\`\`json or any other text. Return ONLY the raw JSON array.
`;

    let generatedTopics = [];
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

      if (!ollamaResponse.ok) {
        throw new Error("Failed to connect to Ollama");
      }

      const ollamaData = await ollamaResponse.json();
      let rawJson = ollamaData.response.trim();
      
      // Clean up if llama returns markdown
      if (rawJson.startsWith("\`\`\`json")) {
        rawJson = rawJson.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      } else if (rawJson.startsWith("\`\`\`")) {
        rawJson = rawJson.replace(/\`\`\`/g, "").trim();
      }

      generatedTopics = JSON.parse(rawJson);
    } catch (err) {
      console.error("AI Generation Error:", err);
      return NextResponse.json({ error: "Failed to generate roadmap using AI. Ensure Ollama is running with llama3.2." }, { status: 500 });
    }

    // Save to Database
    const roadmap = await prisma.roadmap.create({
      data: {
        userId: session.user.id as string,
        title,
        subject,
        syllabus,
        examDate: examDateObj,
        dailyStudyTime: parseInt(dailyStudyTime),
        topics: {
          create: generatedTopics.map((topic: any, index: number) => ({
            title: topic.title,
            theory: topic.theory,
            videoUrl: topic.videoUrl,
            order: index + 1,
            isUnlocked: index === 0, // Unlock only the first topic
          })),
        },
      },
    });

    return NextResponse.json({ success: true, roadmapId: roadmap.id });
  } catch (error) {
    console.error("Roadmap creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roadmaps = await prisma.roadmap.findMany({
      where: { userId: session.user.id as string },
      orderBy: { createdAt: 'desc' },
      include: {
        topics: true
      }
    });

    return NextResponse.json({ roadmaps });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
