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

    const { topicId, answers } = (await req.json()) as {
      topicId?: string;
      answers?: Record<string, number>;
    };

    if (!topicId || !answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Topic ID and answers object required" }, { status: 400 });
    }

    // Only include currently active questions for scoring
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        questions: { where: { isActive: true } },
        roadmap: {
          include: {
            topics: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!topic || topic.roadmap.userId !== session.user.id) {
      return NextResponse.json({ error: "Topic not found or unauthorized" }, { status: 404 });
    }

    const activeQuestions = topic.questions;
    const total = activeQuestions.length;

    if (total === 0) {
      return NextResponse.json({ error: "No active assessment questions found for this topic" }, { status: 400 });
    }

    let correctCount = 0;
    activeQuestions.forEach((q) => {
      if (answers[q.id] === q.correctOption) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / total) * 100);

    // Update topic score in database
    await prisma.topic.update({
      where: { id: topicId },
      data: { quizScore: score },
    });

    // If score >= 80% (4 out of 5), unlock the next topic in sequence
    let unlockedNext = false;
    if (score >= 80) {
      const allTopics = topic.roadmap.topics;
      const currentIndex = allTopics.findIndex((t) => t.id === topicId);
      if (currentIndex !== -1 && currentIndex + 1 < allTopics.length) {
        const nextTopic = allTopics[currentIndex + 1];
        if (!nextTopic.isUnlocked) {
          await prisma.topic.update({
            where: { id: nextTopic.id },
            data: { isUnlocked: true },
          });
          unlockedNext = true;
        }
      }
    }

    return NextResponse.json({
      success: true,
      score,
      correctCount,
      total,
      unlockedNext,
      questions: activeQuestions,
    });
  } catch (error: unknown) {
    console.error("Quiz submission error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
