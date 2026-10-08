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

    const { title, subject, syllabus, examDate, dailyStudyTime, type } = await req.json();

    if (!title || !subject || !dailyStudyTime || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let prompt = "";
    let examDateObj = null;

    if (type === "EXAM") {
      if (!examDate) return NextResponse.json({ error: "Exam date required for exam mode" }, { status: 400 });
      examDateObj = new Date(examDate);
      const daysLeft = Math.ceil((examDateObj.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      
      prompt = `
You are an expert tutor. The student is preparing for an exam on the subject "${subject}".
They have provided this syllabus/goals: "${syllabus || 'General comprehensive coverage'}".
The exam is in ${daysLeft} days, and they can study ${dailyStudyTime} minutes per day.
Generate a structured study roadmap with a realistic sequence of topics considering the time left.
Respond ONLY in valid JSON format with this exact structure, containing an array of objects:
[
  {
    "title": "Topic Name",
    "theory": "A brief but comprehensive theory/explanation of this topic.",
    "timeEstimate": 45,
    "difficulty": "Intermediate"
  }
]
Note: timeEstimate must be an integer representing minutes. difficulty should be Beginner, Intermediate, or Advanced.
Do not include markdown tags like \`\`\`json. Return ONLY the raw JSON array.
`;
    } else {
      // COURSE MODE
      prompt = `
You are an expert tutor. The student wants to deeply learn a course about "${subject}".
${syllabus ? `Their specific goals/syllabus: "${syllabus}"` : "Create a comprehensive beginner-to-advanced curriculum."}
They can dedicate ${dailyStudyTime} minutes per day. There is no strict deadline.
Generate a structured, logical learning journey to master this subject from scratch.
Respond ONLY in valid JSON format with this exact structure, containing an array of objects:
[
  {
    "title": "Topic Name",
    "theory": "A brief but comprehensive theory/explanation of this topic.",
    "timeEstimate": 60,
    "difficulty": "Beginner"
  }
]
Note: timeEstimate must be an integer representing minutes. difficulty should be Beginner, Intermediate, or Advanced.
Do not include markdown tags like \`\`\`json. Return ONLY the raw JSON array.
`;
    }

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
      
      let parsedTopics;
      try {
        parsedTopics = JSON.parse(rawJson);
      } catch (e) {
        console.error("Failed to parse JSON. Raw:", rawJson);
        throw new Error("Failed to parse JSON from Ollama.");
      }
      
      let topicsArray: any[] = [];
      function traverse(current: any) {
        if (!current || typeof current !== 'object') return;
        if ('title' in current && 'theory' in current) {
          topicsArray.push({
            title: current.title,
            theory: current.theory,
            timeEstimate: typeof current.timeEstimate === 'number' ? current.timeEstimate : parseInt(current.timeEstimate) || 45,
            difficulty: current.difficulty || 'Intermediate',
            videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' ' + current.title)}`
          });
          return;
        }
        if (Array.isArray(current)) {
          current.forEach(traverse);
          return;
        }
        Object.values(current).forEach(traverse);
      }
      traverse(parsedTopics);

      if (topicsArray.length === 0) {
        console.error("Parsed object:", parsedTopics);
        throw new Error("AI response could not be parsed into a topics array.");
      }
      generatedTopics = topicsArray;
    } catch (err) {
      console.error("AI Generation Error:", err);
      return NextResponse.json({ error: "Failed to generate roadmap using AI. Ensure Ollama is running with llama3.2." }, { status: 500 });
    }

    // Save to Database
    const roadmap = await prisma.roadmap.create({
      data: {
        userId: session.user.id as string,
        type: type,
        title,
        subject,
        syllabus: syllabus || "",
        examDate: examDateObj,
        dailyStudyTime: parseInt(dailyStudyTime),
        topics: {
          create: generatedTopics.map((topic: any, index: number) => ({
            title: topic.title,
            theory: topic.theory,
            videoUrl: topic.videoUrl,
            timeEstimate: topic.timeEstimate,
            difficulty: topic.difficulty,
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
