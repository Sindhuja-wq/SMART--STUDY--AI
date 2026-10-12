"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AuthVisualSide } from "@/components/AuthVisualSide";
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Sparkles
} from "lucide-react";

function ForgotPasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8, 11, 24, 0.8)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}
    >
      <div 
        className="glass-card" 
        style={{ width: "100%", maxWidth: "440px", position: "relative" }}
      >
        <h3 className="text-xl mb-2 text-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <HelpCircle size={20} /> Reset Password
        </h3>
        <p className="text-muted text-sm mb-4">
          Enter your registered email address to receive password recovery instructions or contact your system administrator.
        </p>

        {sent ? (
          <div 
            style={{ 
              padding: "1rem", 
              borderRadius: "var(--radius-md)", 
              background: "rgba(52, 211, 153, 0.15)", 
              border: "1px solid rgba(52, 211, 153, 0.3)",
              color: "var(--accent-emerald)",
              fontSize: "0.9rem",
              marginBottom: "1rem"
            }}
          >
            Instructions have been sent if an account exists for {email}.
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                required 
                className="form-input" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              Send Reset Instructions
            </button>
          </form>
        )}

        <button 
          onClick={onClose} 
          className="btn btn-outline" 
          style={{ width: "100%", marginTop: "0.75rem" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.toLowerCase().includes("verify")) {
          setError("Please verify your email before logging in. If needed, re-register to receive an OTP.");
        } else {
          setError("Invalid email or password. Please try again.");
        }
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected network error occurred.");
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
            maxWidth: "1020px",
            alignItems: "stretch"
          }}
        >
          {/* Left Column: Visual Atmosphere & AI Companion */}
          <AuthVisualSide />

          {/* Right Column: Premium Login Form Card */}
          <div 
            className="glass-card" 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "center",
              padding: "3rem 2.5rem" 
            }}
          >
            <div style={{ marginBottom: "2rem" }}>
              <div 
                className="badge badge-primary mb-2" 
                style={{ fontSize: "0.75rem", gap: "0.35rem" }}
              >
                <Sparkles size={13} /> Welcome Back
              </div>
              <h2 className="text-3xl mb-1">Scholar Login</h2>
              <p className="text-muted text-sm">
                Enter your credentials to access your active roadmaps and study notes.
              </p>
            </div>

            {error && (
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "flex-start", 
                  gap: "0.75rem", 
                  padding: "0.9rem 1rem", 
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

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Email Address
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="login-email"
                    type="email"
                    required
                    className="form-input"
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="flex-between mb-2">
                  <label className="form-label" htmlFor="login-password" style={{ margin: 0 }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--accent-primary)",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="form-input-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: "40px" }}
                    autoComplete="current-password"
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

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "1rem", padding: "0.95rem" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Study <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div 
              style={{ 
                marginTop: "2.5rem", 
                paddingTop: "1.5rem", 
                borderTop: "1px solid var(--border-subtle)",
                textAlign: "center" 
              }}
            >
              <p className="text-muted text-sm">
                Don't have an account yet?{" "}
                <Link 
                  href="/register" 
                  style={{ 
                    color: "var(--accent-primary)", 
                    fontWeight: 600, 
                    textDecoration: "none" 
                  }}
                >
                  Create one now →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}
