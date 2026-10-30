"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { 
  Brain, 
  Target, 
  ArrowRight, 
  Sparkles, 
  GraduationCap
} from "lucide-react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <>
      <div className="cyber-grid" />
      <Navbar />

      <main className="container" style={{ paddingTop: "3rem", paddingBottom: "5rem" }}>
        {/* Hero Section */}
        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", 
            gap: "3.5rem", 
            alignItems: "center",
            marginBottom: "5rem"
          }}
        >
          {/* Left Column: Headline and Call-To-Actions */}
          <div>
            <div 
              className="badge badge-purple mb-4" 
              style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem", gap: "0.4rem" }}
            >
              <Sparkles size={14} color="#A78BFA" /> Next-Generation AI Study Companion
            </div>

            <h1 
              style={{ 
                fontSize: "clamp(2.5rem, 5vw, 3.8rem)", 
                marginBottom: "1.5rem", 
                lineHeight: 1.15,
                fontWeight: 800
              }}
            >
              Learn Smarter. <br />
              <span className="text-gradient">Master Anything</span> <br />
              with Precision AI.
            </h1>

            <p 
              className="text-muted" 
              style={{ fontSize: "1.15rem", marginBottom: "2.25rem", lineHeight: 1.7, maxWidth: "540px" }}
            >
              Transform your syllabus into step-by-step milestones. Learn theory with AI notes, test your mastery with rigorous topic quizzes, and level up your knowledge systematically.
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              {session ? (
                <Link 
                  href="/dashboard" 
                  className="btn btn-primary" 
                  style={{ fontSize: "1.1rem", padding: "0.95rem 2rem", gap: "0.6rem" }}
                >
                  Go to Dashboard <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link 
                    href="/register" 
                    className="btn btn-primary" 
                    style={{ fontSize: "1.1rem", padding: "0.95rem 2rem", gap: "0.6rem" }}
                  >
                    Start Learning Free <ArrowRight size={18} />
                  </Link>
                  <Link 
                    href="/login" 
                    className="btn btn-outline" 
                    style={{ fontSize: "1.1rem", padding: "0.95rem 1.75rem" }}
                  >
                    Student Login
                  </Link>
                </>
              )}
            </div>

            {/* Quick Metrics */}
            <div 
              style={{ 
                display: "flex", 
                gap: "2.5rem", 
                marginTop: "3rem", 
                paddingTop: "2rem", 
                borderTop: "1px solid var(--border-subtle)" 
              }}
            >
              <div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-highlight)" }}>80%+</div>
                <div className="text-muted text-sm">Mastery Unlock Requirement</div>
              </div>
              <div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-primary)" }}>Adaptive</div>
                <div className="text-muted text-sm">Exam & Course Schedules</div>
              </div>
              <div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-emerald)" }}>Zero Fluff</div>
                <div className="text-muted text-sm">Curated Theory & Quizzes</div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Companion Showcase with Floating Atmospheric Elements */}
          <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            {/* Ambient Radial Halo */}
            <div 
              style={{ 
                position: "absolute", 
                inset: "-20px", 
                background: "radial-gradient(circle, rgba(96, 165, 250, 0.28) 0%, rgba(167, 139, 250, 0.2) 40%, transparent 70%)", 
                filter: "blur(40px)", 
                zIndex: 0,
                borderRadius: "50%"
              }} 
            />

            {/* Main Showcase Frame */}
            <div 
              className="glass-card" 
              style={{ 
                position: "relative", 
                zIndex: 1, 
                padding: "0.75rem", 
                borderRadius: "28px", 
                maxWidth: "480px", 
                width: "100%",
                boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(96, 165, 250, 0.25)",
                border: "1px solid rgba(96, 165, 250, 0.3)"
              }}
            >
              <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", borderRadius: "20px", overflow: "hidden" }}>
                <Image 
                  src="/images/ai-companion.jpg" 
                  alt="Smart Study AI - Anime Educational Companion" 
                  fill 
                  priority
                  sizes="(max-width: 768px) 100vw, 480px"
                  style={{ objectFit: "cover" }} 
                />
                
                {/* Luminous Inner Gradient */}
                <div 
                  style={{ 
                    position: "absolute", 
                    inset: 0, 
                    background: "linear-gradient(180deg, transparent 60%, rgba(8, 11, 24, 0.85) 100%)",
                    pointerEvents: "none"
                  }} 
                />

                {/* Floating HUD Card: Active Study Session */}
                <div 
                  style={{ 
                    position: "absolute", 
                    bottom: "16px", 
                    left: "16px", 
                    right: "16px",
                    background: "rgba(14, 20, 39, 0.88)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    borderRadius: "14px",
                    padding: "0.9rem 1.1rem",
                    border: "1px solid rgba(103, 232, 249, 0.3)",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)"
                  }}
                >
                  <div className="flex-between">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div 
                        style={{ 
                          width: "8px", 
                          height: "8px", 
                          borderRadius: "50%", 
                          backgroundColor: "#34D399", 
                          boxShadow: "0 0 8px #34D399" 
                        }} 
                      />
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#F8FAFC" }}>AI Companion Online</span>
                    </div>
                    <span className="badge badge-primary" style={{ fontSize: "0.65rem" }}>Llama 3.2 Engine</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
                    &ldquo;Ready to generate customized study roadmaps &amp; assess topic mastery.&rdquo;
                  </div>
                </div>
              </div>

              {/* Floating Badge HUD Top-Right */}
              <div 
                className="animate-float" 
                style={{ 
                  position: "absolute", 
                  top: "-15px", 
                  right: "-15px", 
                  background: "rgba(17, 23, 43, 0.95)",
                  backdropFilter: "blur(14px)",
                  padding: "0.6rem 1rem",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--border-medium)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4), 0 0 16px rgba(167, 139, 250, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  zIndex: 2
                }}
              >
                <Sparkles size={16} color="#A78BFA" />
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-secondary)" }}>
                  Digital Library Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div style={{ marginTop: "4rem" }}>
          <div className="text-center mb-8">
            <span className="badge badge-primary mb-2">Core Architecture</span>
            <h2 className="text-3xl mb-2">Designed for Serious Learners</h2>
            <p className="text-muted" style={{ maxWidth: "600px", margin: "0 auto" }}>
              A distraction-free, structured environment that replaces fragmented searching with disciplined mastery.
            </p>
          </div>

          <div className="grid-3">
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div 
                style={{ 
                  width: "52px", 
                  height: "52px", 
                  borderRadius: "14px", 
                  background: "rgba(96, 165, 250, 0.15)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  border: "1px solid rgba(96, 165, 250, 0.3)"
                }}
              >
                <Brain size={26} color="#60A5FA" />
              </div>
              <h3 className="text-xl">AI Curriculum Architect</h3>
              <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
                Paste any syllabus or pick a subject. Our system generates a logical sequence of subtopics, difficulty estimates, and daily study targets tailored to your timeline.
              </p>
            </div>

            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div 
                style={{ 
                  width: "52px", 
                  height: "52px", 
                  borderRadius: "14px", 
                  background: "rgba(52, 211, 153, 0.15)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  border: "1px solid rgba(52, 211, 153, 0.3)"
                }}
              >
                <Target size={26} color="#34D399" />
              </div>
              <h3 className="text-xl">80% Mastery Gate</h3>
              <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
                Next topics stay locked until you score at least 4 out of 5 on the topic assessment. Prove real comprehension before advancing.
              </p>
            </div>

            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div 
                style={{ 
                  width: "52px", 
                  height: "52px", 
                  borderRadius: "14px", 
                  background: "rgba(167, 139, 250, 0.15)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  border: "1px solid rgba(167, 139, 250, 0.3)"
                }}
              >
                <GraduationCap size={26} color="#A78BFA" />
              </div>
              <h3 className="text-xl">Theory & Video Hub</h3>
              <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
                Instant structured study notes rendered in beautiful markdown, code blocks for developers, and direct curated video resources for every milestone.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
