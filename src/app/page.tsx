"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Brain, Target, Award, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '3rem', paddingTop: '4rem' }}>
        <div style={{ maxWidth: '800px' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', background: 'linear-gradient(to right, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Master Any Subject with AI
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Generate personalized study roadmaps, watch curated theory videos, and take AI-generated quizzes. Level up your knowledge step by step.
          </p>
          <Link href="/register" className="btn btn-primary" style={{ fontSize: '1.25rem', padding: '1rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            Get Started Free <ArrowRight size={20} />
          </Link>
        </div>

        <div className="grid-2" style={{ marginTop: '4rem', width: '100%' }}>
          <div className="glass-card flex-col flex-center text-center" style={{ gap: '1rem' }}>
            <Brain size={48} color="#3b82f6" />
            <h3 style={{ fontSize: '1.5rem' }}>AI Roadmaps</h3>
            <p style={{ color: '#94a3b8' }}>Provide your syllabus and exam date. Our local Llama 3.2 model creates a structured daily plan.</p>
          </div>
          <div className="glass-card flex-col flex-center text-center" style={{ gap: '1rem' }}>
            <Target size={48} color="#10b981" />
            <h3 style={{ fontSize: '1.5rem' }}>Topic Quizzes</h3>
            <p style={{ color: '#94a3b8' }}>Unlock topics only when you prove your knowledge. Score 70%+ to proceed.</p>
          </div>
        </div>
      </main>
    </>
  );
}
