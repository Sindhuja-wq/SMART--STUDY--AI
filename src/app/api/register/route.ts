import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "@/lib/email";
import { validateRegistrationEmail } from "@/lib/emailValidator";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { name, email, password } = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields (name, email, password)" }, { status: 400 });
    }

    const emailValidation = validateRegistrationEmail(email);
    if (!emailValidation.valid || !emailValidation.sanitizedEmail) {
      return NextResponse.json(
        { error: emailValidation.error || "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const trimmedEmail = emailValidation.sanitizedEmail;
    const trimmedName = name.trim();

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    let existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser && existingUser.isVerified) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      // Cooldown of 60 seconds between resend requests
      if (existingUser.lastOtpSentAt && Date.now() - existingUser.lastOtpSentAt.getTime() < 60000) {
        return NextResponse.json({ error: "Please wait 60 seconds before requesting another verification code." }, { status: 429 });
      }

      existingUser = await prisma.user.update({
        where: { email: trimmedEmail },
        data: {
          password: hashedPassword,
          name: trimmedName,
          otpCode,
          otpExpiresAt,
          otpAttempts: 0, // Reset attempt counter on fresh OTP generation
          lastOtpSentAt: new Date(),
        },
      });
    } else {
      // CRITICAL SECURITY: Public registration must always strictly create "USER" role.
      // Admin privileges cannot be assigned via client request payloads.
      existingUser = await prisma.user.create({
        data: {
          name: trimmedName,
          email: trimmedEmail,
          password: hashedPassword,
          role: "USER",
          otpCode,
          otpExpiresAt,
          otpAttempts: 0,
          lastOtpSentAt: new Date(),
        },
      });
    }

    try {
      await sendOtpEmail(trimmedEmail, otpCode);
      return NextResponse.json({ success: true, message: "Verification code sent to your email." });
    } catch (emailError: unknown) {
      console.warn("Failed to deliver OTP email:", emailError);
      return NextResponse.json(
        { error: "Failed to send verification email. Please verify SMTP configuration or try again." },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
