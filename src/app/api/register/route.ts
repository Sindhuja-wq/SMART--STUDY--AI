import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 });
      }
      // If not verified, we can regenerate OTP for them
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      if (existingUser.otpAttempts >= 5) {
        return NextResponse.json({ error: "Maximum OTP attempts reached. Try again later." }, { status: 429 });
      }
      
      // Cooldown of 60 seconds
      if (existingUser.lastOtpSentAt && (Date.now() - existingUser.lastOtpSentAt.getTime() < 60000)) {
        return NextResponse.json({ error: "Please wait 60 seconds before requesting another OTP." }, { status: 429 });
      }

      existingUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name,
          otpCode,
          otpExpiresAt,
          otpAttempts: existingUser.otpAttempts + 1,
          lastOtpSentAt: new Date(),
        },
      });
    } else {
      existingUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role === "ADMIN" ? "ADMIN" : "USER",
          otpCode,
          otpExpiresAt,
          otpAttempts: 1,
          lastOtpSentAt: new Date(),
        },
      });
    }

    try {
      await sendOtpEmail(email, otpCode);
      return NextResponse.json({ success: true, message: "OTP sent successfully. Please check your email." });
    } catch (emailError: any) {
      // If email failed, do not claim success.
      return NextResponse.json({ error: "Failed to send OTP email. Please check provider configuration." }, { status: 500 });
    }
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
