import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIContentDetailed } from "@/lib/ai";
import { executeDoubtSolver } from "@/lib/doubtSolver";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const result = await executeDoubtSolver({
      session,
      body,
      findTopic: (topicId: string) =>
        prisma.topic.findUnique({
          where: { id: topicId },
          include: { roadmap: true },
        }),
      callAI: (options) =>
        generateAIContentDetailed({
          ...options,
          temperature: 0.3,
          maxTokens: 1200,
          timeoutMs: 25000,
        }),
    });

    return NextResponse.json(result.body, {
      status: result.status,
      headers: result.headers,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    console.error("[Doubt Solver] Unexpected error:", errorMsg);
    return NextResponse.json(
      { error: "An unexpected error occurred while solving your doubt. Please try again." },
      { status: 500 }
    );
  }
}
