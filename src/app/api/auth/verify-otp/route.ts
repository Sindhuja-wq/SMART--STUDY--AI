import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, otp } = (await req.json()) as {
      email?: string;
      otp?: string;
    };

    if (!email || !otp) {
      return NextResponse.json({ error: "Missing email or OTP code" }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedOtp = otp.trim();

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: "Account is already verified. Please sign in." }, { status: 400 });
    }

    // Rate-limiting brute force check
    if (user.otpAttempts >= 5) {
      return NextResponse.json(
        { error: "Maximum verification attempts exceeded. Please re-register or request a new OTP code." },
        { status: 429 }
      );
    }

    // Expiration check
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      return NextResponse.json({ error: "Verification code has expired. Please request a new code." }, { status: 400 });
    }

    // Check code match
    if (!user.otpCode || user.otpCode !== trimmedOtp) {
      // Increment failed attempts in the database
      const updatedAttempts = user.otpAttempts + 1;
      await prisma.user.update({
        where: { email: trimmedEmail },
        data: { otpAttempts: updatedAttempts },
      });

      const attemptsRemaining = Math.max(0, 5 - updatedAttempts);
      return NextResponse.json(
        {
          error: `Invalid verification code. ${
            attemptsRemaining > 0
              ? `${attemptsRemaining} attempt(s) remaining before lockout.`
              : "Account locked out from further attempts. Please request a new code."
          }`,
        },
        { status: 400 }
      );
    }

    // Successful verification: clear OTP and mark verified
    await prisma.user.update({
      where: { email: trimmedEmail },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiresAt: null,
        otpAttempts: 0,
      },
    });

    return NextResponse.json({ success: true, message: "Email verified successfully. You can now login." });
  } catch (error: unknown) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
