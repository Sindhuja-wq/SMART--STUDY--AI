"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Sparkles, Book, Compass, ShieldCheck } from "lucide-react";

export function AuthVisualSide() {
  return (
    <div 
      className="auth-visual-container"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "3rem",
        borderRadius: "var(--radius-xl)",
        background: "var(--card-gradient)",
        border: "1px solid var(--border-medium)",
        boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(96, 165, 250, 0.15)",
        position: "relative",
        overflow: "hidden",
        minHeight: "620px"
      }}
    >
      {/* Ambient background glow */}
      <div 
        style={{
          position: "absolute",
          top: "-15%",
          right: "-15%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(96, 165, 250, 0.25) 0%, rgba(167, 139, 250, 0.15) 50%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />
      
      <div 
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "-15%",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(103, 232, 249, 0.2) 0%, rgba(52, 211, 153, 0.1) 50%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />

      {/* Top Branding */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <Link href="/" className="navbar-brand" style={{ marginBottom: "1rem" }}>
          <div className="brand-icon-wrapper">
            <BookOpen size={20} color="#60A5FA" />
          </div>
          <span className="brand-text">Smart Study AI</span>
          <span className="brand-badge">ED-TECH</span>
        </Link>
      </div>

      {/* Central Illustration Area with Floating Books & Cyber Runes */}
      <div 
        style={{ 
          position: "relative", 
          zIndex: 1, 
          margin: "1.5rem auto",
          width: "100%",
          maxWidth: "380px"
        }}
      >
        {/* Main Companion Image Card */}
        <div 
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1/1",
            borderRadius: "24px",
            overflow: "hidden",
            border: "1px solid rgba(96, 165, 250, 0.3)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 25px rgba(96, 165, 250, 0.2)"
          }}
        >
          <Image 
            src="/images/ai-companion.jpg" 
            alt="AI Study Companion in Futuristic Magical Library"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 380px"
            style={{ objectFit: "cover" }}
          />

          <div 
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, transparent 65%, rgba(8, 11, 24, 0.9) 100%)",
              pointerEvents: "none"
            }}
          />

          {/* Holographic Rune Status Pill */}
          <div 
            style={{
              position: "absolute",
              bottom: "14px",
              left: "14px",
              right: "14px",
              background: "rgba(11, 16, 32, 0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              padding: "0.6rem 0.9rem",
              borderRadius: "12px",
              border: "1px solid rgba(103, 232, 249, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div 
                style={{ 
                  width: "8px", 
                  height: "8px", 
                  borderRadius: "50%", 
                  background: "#67E8F9",
                  boxShadow: "0 0 8px #67E8F9" 
                }} 
              />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#F8FAFC" }}>
                Magical Digital Library
              </span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "var(--accent-highlight)", fontWeight: 700 }}>
              AI ASSISTANT
            </span>
          </div>
        </div>

        {/* Floating Book 1 - Top Left */}
        <div 
          className="animate-float"
          style={{
            position: "absolute",
            top: "-18px",
            left: "-22px",
            background: "rgba(17, 23, 43, 0.92)",
            backdropFilter: "blur(14px)",
            padding: "0.5rem 0.85rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(96, 165, 250, 0.35)",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4), 0 0 15px rgba(96, 165, 250, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            zIndex: 3
          }}
        >
          <Book size={16} color="#60A5FA" />
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#F8FAFC" }}>
            Quantum Algorithms
          </span>
        </div>

        {/* Floating Element 2 - Bottom Right */}
        <div 
          className="animate-float"
          style={{
            position: "absolute",
            bottom: "35px",
            right: "-20px",
            animationDelay: "-2.5s",
            background: "rgba(17, 23, 43, 0.92)",
            backdropFilter: "blur(14px)",
            padding: "0.5rem 0.85rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(167, 139, 250, 0.35)",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4), 0 0 15px rgba(167, 139, 250, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            zIndex: 3
          }}
        >
          <Sparkles size={16} color="#A78BFA" />
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#F8FAFC" }}>
            80% Mastery Unlocks
          </span>
        </div>
      </div>

      {/* Bottom Mission Headline & Supporting Text */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <h2 
          style={{ 
            fontSize: "1.75rem", 
            marginBottom: "0.6rem", 
            fontWeight: 800,
            lineHeight: 1.25
          }}
        >
          Your Next Chapter <span className="text-gradient">Starts Here.</span>
        </h2>
        <p 
          style={{ 
            fontSize: "0.95rem", 
            color: "var(--text-secondary)", 
            lineHeight: 1.6,
            marginBottom: "1rem" 
          }}
        >
          Learn smarter. Grow faster. Achieve more.
        </p>

        {/* Feature Badges */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <span className="badge badge-primary">
            <Compass size={12} /> Adaptive Path
          </span>
          <span className="badge badge-purple">
            <Sparkles size={12} /> Automated Notes
          </span>
          <span className="badge badge-success">
            <ShieldCheck size={12} /> Exam Ready
          </span>
        </div>
      </div>
    </div>
  );
}
