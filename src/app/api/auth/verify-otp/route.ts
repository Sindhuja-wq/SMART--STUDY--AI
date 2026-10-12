import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Missing email or OTP" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: "User already verified" }, { status: 400 });
    }

    if (!user.otpCode || user.otpCode !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // Mark as verified
    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return NextResponse.json({ success: true, message: "Email verified successfully. You can now login." });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
