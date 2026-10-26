import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "@/lib/email";
import { validateRegistrationEmail } from "@/lib/emailValidator";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { name, email, password, resendOnly } = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
      resendOnly?: boolean;
    };

    if (!email) {
      return NextResponse.json({ error: "Missing required email address." }, { status: 400 });
    }

    const emailValidation = validateRegistrationEmail(email);
    if (!emailValidation.valid || !emailValidation.sanitizedEmail) {
      return NextResponse.json(
        { error: emailValidation.error || "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const trimmedEmail = emailValidation.sanitizedEmail;
    let existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser && existingUser.isVerified) {
      return NextResponse.json({ error: "An account with this email already exists and is verified." }, { status: 400 });
    }

    // Handle dedicated resend requests for existing unverified accounts
    if (resendOnly) {
      if (!existingUser) {
        return NextResponse.json(
          { error: "No pending registration found for this email. Please register first." },
          { status: 404 }
        );
      }

      // Enforce 60-second cooldown between resend attempts
      if (existingUser.lastOtpSentAt && Date.now() - existingUser.lastOtpSentAt.getTime() < 60000) {
        const remainingSeconds = Math.ceil((60000 - (Date.now() - existingUser.lastOtpSentAt.getTime())) / 1000);
        return NextResponse.json(
          { error: `Please wait ${remainingSeconds} second(s) before requesting another verification code.` },
          { status: 429 }
        );
      }

      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      const previousLastOtp = existingUser.lastOtpSentAt;

      await prisma.user.update({
        where: { email: trimmedEmail },
        data: {
          otpCode,
          otpExpiresAt,
          otpAttempts: 0,
          lastOtpSentAt: new Date(),
        },
      });

      try {
        await sendOtpEmail(trimmedEmail, otpCode);
        return NextResponse.json({ success: true, message: "A fresh verification code was sent to your email." });
      } catch (emailError: unknown) {
        console.warn("Failed to deliver OTP email (safe summary):", emailError instanceof Error ? emailError.message : "SMTP delivery failed");
        await prisma.user.update({
          where: { email: trimmedEmail },
          data: { lastOtpSentAt: previousLastOtp },
        });

        const isConfigError = emailError instanceof Error && emailError.message.includes("configuration missing");
        return NextResponse.json(
          {
            error: isConfigError
              ? "Email delivery service is currently unconfigured. Please check SMTP configuration."
              : "Failed to send verification email. Please check your email address or try again in a few moments.",
          },
          { status: 500 }
        );
      }
    }

    // Standard registration flow
    if (!password || !name) {
      return NextResponse.json({ error: "Missing required fields (name, password)" }, { status: 400 });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return NextResponse.json({ error: "Full name must be at least 2 characters long." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
    const hashedPassword = await bcrypt.hash(password, 10);
    const previousLastOtp = existingUser?.lastOtpSentAt;

    if (existingUser) {
      // Cooldown of 60 seconds between resend requests
      if (existingUser.lastOtpSentAt && Date.now() - existingUser.lastOtpSentAt.getTime() < 60000) {
        const remainingSeconds = Math.ceil((60000 - (Date.now() - existingUser.lastOtpSentAt.getTime())) / 1000);
        return NextResponse.json(
          { error: `Please wait ${remainingSeconds} second(s) before requesting another verification code.` },
          { status: 429 }
        );
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
      console.warn("Failed to deliver OTP email (safe summary):", emailError instanceof Error ? emailError.message : "SMTP delivery failed");

      // Rollback lastOtpSentAt so failed delivery does not unjustly lock out user retry
      await prisma.user.update({
        where: { email: trimmedEmail },
        data: { lastOtpSentAt: previousLastOtp ?? null },
      });

      const isConfigError = emailError instanceof Error && emailError.message.includes("configuration missing");
      return NextResponse.json(
        {
          error: isConfigError
            ? "Email delivery service is currently unconfigured. Please check SMTP configuration."
            : "Failed to send verification email. Please check your email address or try again in a few moments.",
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
