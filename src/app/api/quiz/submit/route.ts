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

    const { topicId, answers } = await req.json(); 
    // answers = { [questionId]: selectedOptionIndex }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { questions: true, roadmap: { include: { topics: { orderBy: { order: 'asc' } } } } }
    });

    if (!topic || topic.roadmap.userId !== session.user.id) {
      return NextResponse.json({ error: "Topic not found or unauthorized" }, { status: 404 });
    }

    let correctCount = 0;
    const total = topic.questions.length;

    topic.questions.forEach((q) => {
      if (answers[q.id] === q.correctOption) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / total) * 100);

    // Update topic score
    await prisma.topic.update({
      where: { id: topicId },
      data: { quizScore: score }
    });

    // If score >= 80, unlock next topic
    let unlockedNext = false;
    if (score >= 80) {
      const allTopics = topic.roadmap.topics;
      const currentIndex = allTopics.findIndex(t => t.id === topicId);
      if (currentIndex !== -1 && currentIndex + 1 < allTopics.length) {
        const nextTopic = allTopics[currentIndex + 1];
        await prisma.topic.update({
          where: { id: nextTopic.id },
          data: { isUnlocked: true }
        });
        unlockedNext = true;
      }
    }

    return NextResponse.json({ success: true, score, unlockedNext, questions: topic.questions });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
