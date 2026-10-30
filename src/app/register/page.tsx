"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AuthVisualSide } from "@/components/AuthVisualSide";
import { 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  KeyRound 
} from "lucide-react";

export default function Register() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Resend OTP Cooldown (60 seconds)
  const [cooldown, setCooldown] = useState(0);

  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "A 6-digit verification code was sent to your email.");
        setStep(2);
        setCooldown(60); // Start 60s cooldown timer
      } else {
        setError(data.error || "Registration failed. Please check your details.");
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), resendOnly: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("A fresh verification code has been dispatched to your inbox.");
        setCooldown(60);
      } else {
        setError(data.error || "Failed to resend verification code.");
      }
    } catch {
      setError("Network error while resending code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Email verified successfully! Preparing your account...");
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 1200);
      } else {
        setError(data.error || "Verification failed. Please check the code.");
      }
    } catch {
      setError("An unexpected error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="cyber-grid" />
      <Navbar />

      <main 
        className="container" 
        style={{ 
          minHeight: "calc(100vh - 120px)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          paddingTop: "2rem",
          paddingBottom: "2rem"
        }}
      >
        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", 
            gap: "2.5rem", 
            width: "100%", 
            maxWidth: "1040px",
            alignItems: "stretch"
          }}
        >
          {/* Left Column: Visual Atmosphere & AI Companion */}
          <AuthVisualSide />

          {/* Right Column: Premium Registration / OTP Verification Card */}
          <div 
            className="glass-card" 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "center",
              padding: "3rem 2.5rem" 
            }}
          >
            {step === 1 ? (
              <>
                <div style={{ marginBottom: "1.75rem" }}>
                  <div 
                    className="badge badge-purple mb-2" 
                    style={{ fontSize: "0.75rem", gap: "0.35rem" }}
                  >
                    <Sparkles size={13} /> Begin Your Journey
                  </div>
                  <h2 className="text-3xl mb-1">Create Student Account</h2>
                  <p className="text-muted text-sm">
                    Join Smart Study AI to generate adaptive learning curriculums.
                  </p>
                </div>

                {error && (
                  <div 
                    style={{ 
                      display: "flex", 
                      alignItems: "flex-start", 
                      gap: "0.75rem", 
                      padding: "0.85rem 1rem", 
                      borderRadius: "var(--radius-md)", 
                      background: "rgba(248, 113, 113, 0.12)", 
                      border: "1px solid rgba(248, 113, 113, 0.3)",
                      color: "var(--accent-rose)",
                      fontSize: "0.875rem",
                      marginBottom: "1.5rem"
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="register-name">Full Name</label>
                    <input
                      id="register-name"
                      type="text"
                      required
                      className="form-input"
                      placeholder="Alex Mercer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="register-email">Email Address</label>
                    <input
                      id="register-email"
                      type="email"
                      required
                      className="form-input"
                      placeholder="alex@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="register-password">Password</label>
                    <div className="form-input-wrapper">
                      <input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        className="form-input"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ paddingRight: "40px" }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="register-confirm">Confirm Password</label>
                    <div className="form-input-wrapper">
                      <input
                        id="register-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        className="form-input"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ paddingRight: "40px" }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: "1rem", padding: "0.95rem" }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Registering Account...
                      </>
                    ) : (
                      <>
                        Continue to Verification <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                <div 
                  style={{ 
                    marginTop: "2.25rem", 
                    paddingTop: "1.25rem", 
                    borderTop: "1px solid var(--border-subtle)",
                    textAlign: "center" 
                  }}
                >
                  <p className="text-muted text-sm" style={{ marginBottom: "0.5rem" }}>
                    Already have a pending verification code?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setMessage("");
                        setStep(2);
                      }}
                      className="btn btn-ghost"
                      style={{
                        color: "var(--accent-primary)",
                        fontWeight: 600,
                        padding: "0.1rem 0.35rem",
                        display: "inline",
                        fontSize: "0.875rem"
                      }}
                    >
                      Enter OTP Code →
                    </button>
                  </p>
                  <p className="text-muted text-sm">
                    Already registered and verified?{" "}
                    <Link 
                      href="/login" 
                      style={{ 
                        color: "var(--accent-primary)", 
                        fontWeight: 600, 
                        textDecoration: "none" 
                      }}
                    >
                      Sign In here →
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: "2rem" }}>
                  <div 
                    className="badge badge-primary mb-2" 
                    style={{ fontSize: "0.75rem", gap: "0.35rem" }}
                  >
                    <KeyRound size={13} /> Security Verification
                  </div>
                  <h2 className="text-3xl mb-1">Verify Email</h2>
                  <p className="text-muted text-sm">
                    We sent a 6-digit confirmation OTP code to <strong style={{ color: "var(--text-main)" }}>{email}</strong>.
                  </p>
                </div>

                {message && (
                  <div 
                    style={{ 
                      display: "flex", 
                      alignItems: "flex-start", 
                      gap: "0.75rem", 
                      padding: "0.85rem 1rem", 
                      borderRadius: "var(--radius-md)", 
                      background: "rgba(52, 211, 153, 0.12)", 
                      border: "1px solid rgba(52, 211, 153, 0.3)",
                      color: "var(--accent-emerald)",
                      fontSize: "0.875rem",
                      marginBottom: "1.5rem"
                    }}
                  >
                    <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{message}</span>
                  </div>
                )}

                {error && (
                  <div 
                    style={{ 
                      display: "flex", 
                      alignItems: "flex-start", 
                      gap: "0.75rem", 
                      padding: "0.85rem 1rem", 
                      borderRadius: "var(--radius-md)", 
                      background: "rgba(248, 113, 113, 0.12)", 
                      border: "1px solid rgba(248, 113, 113, 0.3)",
                      color: "var(--accent-rose)",
                      fontSize: "0.875rem",
                      marginBottom: "1.5rem"
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="otp-input">
                      6-Digit OTP Code
                    </label>
                    <input
                      id="otp-input"
                      type="text"
                      required
                      maxLength={6}
                      className="form-input"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      style={{ 
                        letterSpacing: "0.4em", 
                        fontSize: "1.35rem", 
                        textAlign: "center",
                        fontWeight: 700 
                      }}
                      autoComplete="one-time-code"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: "1rem", padding: "0.95rem" }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Verifying Code...
                      </>
                    ) : (
                      <>
                        Verify & Complete Setup <CheckCircle2 size={18} />
                      </>
                    )}
                  </button>

                  {/* Resend Cooldown Controls */}
                  <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
                    {cooldown > 0 ? (
                      <span className="text-muted text-sm">
                        Resend code available in <strong style={{ color: "var(--accent-primary)" }}>{cooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="btn btn-ghost"
                        style={{ fontSize: "0.875rem", color: "var(--accent-primary)" }}
                      >
                        <RotateCcw size={15} /> Resend OTP Code
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn btn-outline"
                    style={{ width: "100%", marginTop: "1rem" }}
                  >
                    ← Edit Registration Info
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
