"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { 
  Loader2, 
  GraduationCap, 
  Target, 
  Clock, 
  ArrowRight, 
  X, 
  Calendar, 
  Flame, 
  TrendingUp, 
  Compass, 
  BrainCircuit, 
  Layers 
} from "lucide-react";

interface RoadmapTopic {
  id: string;
  title: string;
  isUnlocked: boolean;
  quizScore?: number | null;
}

interface RoadmapSummary {
  id: string;
  title: string;
  subject: string;
  type: "EXAM" | "COURSE";
  dailyStudyTime: number;
  examDate?: string | null;
  createdAt: string;
  topics: RoadmapTopic[];
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeModal, setActiveModal] = useState<"COURSE" | "EXAM" | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState("Analyzing curriculum requirements...");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({ 
    title: "", 
    subject: "", 
    syllabus: "", 
    examDate: "", 
    dailyStudyTime: "60",
    examLevel: "University / College",
    knowledgeLevel: "Intermediate"
  });

  const popularSubjects = [
    { name: "Mathematics", title: "Calculus & Linear Algebra Foundations", time: "60" },
    { name: "Physics", title: "Newtonian Mechanics & Thermodynamics", time: "60" },
    { name: "Chemistry", title: "Organic Reactions & Chemical Equilibrium", time: "60" },
    { name: "Biology", title: "Cellular Biology & Molecular Genetics", time: "45" },
    { name: "World History", title: "Modern World History & Global Revolutions", time: "45" },
    { name: "English", title: "English Grammar, Syntax & Essay Composition", time: "45" },
    { name: "Accounting", title: "Financial Accounting & Double-Entry Principles", time: "60" },
    { name: "Computer Science", title: "Data Structures, Algorithms & Systems", time: "60" },
  ];

  const fetchRoadmaps = async () => {
    try {
      const res = await fetch("/api/roadmap");
      if (res.ok) {
        const data = (await res.json()) as { roadmaps?: RoadmapSummary[] };
        setRoadmaps(data.roadmaps || []);
      }
    } catch (err: unknown) {
      console.error("Error fetching roadmaps:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchRoadmaps();
    }
  }, [status, router]);

  const selectPresetSubject = (sub: typeof popularSubjects[0]) => {
    setFormData(prev => ({
      ...prev,
      subject: sub.name,
      title: activeModal === "EXAM" ? `${sub.name} Final Exam Prep` : sub.title,
      dailyStudyTime: sub.time
    }));
  };

  const resetFormForMode = (mode: "COURSE" | "EXAM") => {
    setActiveModal(mode);
    setFormData({
      title: "",
      subject: "",
      syllabus: "",
      examDate: "",
      dailyStudyTime: "60",
      examLevel: "University / College",
      knowledgeLevel: "Intermediate",
    });
  };

  const handleCreate = async (e: React.FormEvent, type: "COURSE" | "EXAM") => {
    e.preventDefault();
    setIsCreating(true);

    const steps = [
      "Connecting to Neural Curriculum Engine...",
      "Structuring milestone hierarchy...",
      "Optimizing daily study allocations...",
      "Linking curated tutorials & notes...",
      "Finalizing study roadmap..."
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setCreationStep(steps[stepIndex]);
    }, 2200);

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type }),
      });

      clearInterval(interval);

      if (res.ok) {
        const data = await res.json();
        setActiveModal(null);
        router.push(`/roadmap/${data.roadmapId}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to create roadmap. Please verify details.");
      }
    } catch (err) {
      clearInterval(interval);
      alert("Network error while creating roadmap.");
    } finally {
      setIsCreating(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex-center" style={{ height: "100vh", gap: "1rem", flexDirection: "column" }}>
        <Loader2 className="animate-spin text-primary" size={44} />
        <p className="text-muted text-sm">Loading your learning space...</p>
      </div>
    );
  }

  // Personalized greeting & formatted date
  const hours = new Date().getHours();
  const greeting = hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening";
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || "Scholar";
  
  const currentDateFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  interface ExamCountdownInfo {
    days: number;
    title: string;
    date: string;
  }

  // Calculate Metrics
  const totalCourses = roadmaps.length;
  let totalTopics = 0;
  let totalCompletedTopics = 0;
  let nearestExamInfo: ExamCountdownInfo | null = null;
  let continueRoadmap: any = null;
  let continueTopic: any = null;

  for (const rm of roadmaps) {
    const rmTotal = rm.topics?.length || 0;
    totalTopics += rmTotal;
    const completed = rm.topics?.filter((t: any) => t.isUnlocked && t.quizScore && t.quizScore >= 80).length || 0;
    totalCompletedTopics += completed;

    // Exam countdown
    if (rm.type === "EXAM" && rm.examDate) {
      const diffDays = Math.ceil((new Date(rm.examDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 0 && (!nearestExamInfo || diffDays < nearestExamInfo.days)) {
        nearestExamInfo = {
          days: diffDays,
          title: rm.title,
          date: new Date(rm.examDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        };
      }
    }

    // Determine "Continue Learning" target
    if (!continueRoadmap) {
      const nextIncomplete = rm.topics?.find((t: any) => t.isUnlocked && (!t.quizScore || t.quizScore < 80));
      if (nextIncomplete) {
        continueRoadmap = rm;
        continueTopic = nextIncomplete;
      }
    }
  }

  // If all unlocked are completed, pick first roadmap's last topic or fallback
  if (!continueRoadmap && roadmaps.length > 0) {
    continueRoadmap = roadmaps[0];
    continueTopic = roadmaps[0].topics?.[0];
  }

  const overallProgress = totalTopics > 0 ? Math.round((totalCompletedTopics / totalTopics) * 100) : 0;

  // Filter roadmaps by search
  const filteredRoadmaps = roadmaps.filter(rm => 
    rm.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    rm.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="cyber-grid" />
      <Navbar />

      <main className="container" style={{ paddingTop: "2.5rem", paddingBottom: "5rem" }}>
        
        {/* Welcome Header */}
        <div 
          className="glass-card mb-8" 
          style={{ 
            padding: "2.25rem 2.5rem", 
            background: "linear-gradient(135deg, rgba(23, 32, 56, 0.8) 0%, rgba(17, 23, 43, 0.9) 100%)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div 
            style={{ 
              position: "absolute", 
              top: "-40%", 
              right: "-5%", 
              width: "300px", 
              height: "300px", 
              background: "radial-gradient(circle, rgba(96, 165, 250, 0.18) 0%, transparent 70%)", 
              filter: "blur(40px)",
              pointerEvents: "none"
            }} 
          />

          <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <div 
                className="badge badge-purple mb-2" 
                style={{ fontSize: "0.75rem", gap: "0.35rem" }}
              >
                <Calendar size={13} /> {currentDateFormatted}
              </div>
              <h1 className="text-3xl mb-1">
                {greeting}, <span className="text-gradient">{userName}</span>
              </h1>
              <p className="text-muted text-sm">
                Track your active roadmaps, complete topic quizzes, and advance toward mastery.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button 
                onClick={() => resetFormForMode("COURSE")}
                className="btn btn-primary"
                style={{ gap: "0.5rem" }}
              >
                <GraduationCap size={18} /> New Course
              </button>
              <button 
                onClick={() => resetFormForMode("EXAM")}
                className="btn btn-accent"
                style={{ gap: "0.5rem" }}
              >
                <Target size={18} /> Exam Plan
              </button>
            </div>
          </div>
        </div>

        {/* Study Summary Metrics Row */}
        <div className="grid-4 mb-8">
          {/* Card 1: Overall Progress */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div className="flex-between mb-2">
              <span className="text-muted text-xs" style={{ textTransform: "uppercase", fontWeight: 700 }}>Overall Mastery</span>
              <TrendingUp size={18} color="#60A5FA" />
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-primary)" }}>
              {overallProgress}%
            </div>
            <div className="text-muted text-xs mt-2">
              {totalCompletedTopics} of {totalTopics} topics mastered
            </div>
            <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", marginTop: "0.75rem", overflow: "hidden" }}>
              <div style={{ width: `${overallProgress}%`, height: "100%", background: "linear-gradient(90deg, #60A5FA, #67E8F9)", transition: "width 0.8s ease" }} />
            </div>
          </div>

          {/* Card 2: Active Roadmaps */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div className="flex-between mb-2">
              <span className="text-muted text-xs" style={{ textTransform: "uppercase", fontWeight: 700 }}>Curriculums</span>
              <Layers size={18} color="#A78BFA" />
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-secondary)" }}>
              {totalCourses}
            </div>
            <div className="text-muted text-xs mt-2">
              Active learning pathways
            </div>
            <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.75rem" }}>
              <span className="badge badge-purple" style={{ fontSize: "0.65rem" }}>Adaptive AI</span>
              <span className="badge badge-neutral" style={{ fontSize: "0.65rem" }}>Structured</span>
            </div>
          </div>

          {/* Card 3: Study Streak & Weekly Activity */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div className="flex-between mb-2">
              <span className="text-muted text-xs" style={{ textTransform: "uppercase", fontWeight: 700 }}>Study Streak</span>
              <Flame size={18} color="#FBBF24" />
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-amber)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              5 <span style={{ fontSize: "1rem", fontWeight: 600 }}>Days</span>
            </div>
            {/* Weekly Days Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "4px", marginTop: "0.75rem" }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    flex: 1, 
                    textAlign: "center", 
                    fontSize: "0.65rem", 
                    fontWeight: 700, 
                    padding: "3px 0", 
                    borderRadius: "4px",
                    background: idx < 5 ? "rgba(251, 191, 36, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    color: idx < 5 ? "var(--accent-amber)" : "var(--text-muted)",
                    border: idx < 5 ? "1px solid rgba(251, 191, 36, 0.4)" : "1px solid transparent"
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Upcoming Exam Countdown */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div className="flex-between mb-2">
              <span className="text-muted text-xs" style={{ textTransform: "uppercase", fontWeight: 700 }}>Exam Countdown</span>
              <Target size={18} color="#34D399" />
            </div>
            {nearestExamInfo ? (
              <>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-emerald)" }}>
                  {nearestExamInfo.days} <span style={{ fontSize: "1rem", fontWeight: 600 }}>Days</span>
                </div>
                <div className="text-muted text-xs mt-2" style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {nearestExamInfo.title} ({nearestExamInfo.date})
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginTop: "0.5rem" }}>
                  Self-Paced
                </div>
                <div className="text-muted text-xs mt-2">
                  No strict exam deadlines set
                </div>
              </>
            )}
          </div>
        </div>

        {/* Prominent "Continue Learning" Action Hero (if any course exists) */}
        {continueRoadmap && continueTopic && (
          <div 
            className="glass-card mb-8" 
            style={{ 
              padding: "2rem 2.5rem", 
              borderLeft: "4px solid var(--accent-primary)",
              background: "linear-gradient(90deg, rgba(23, 32, 56, 0.9) 0%, rgba(17, 23, 43, 0.8) 100%)"
            }}
          >
            <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.5rem" }}>
              <div style={{ maxWidth: "680px" }}>
                <div className="flex-between mb-2" style={{ justifyContent: "flex-start", gap: "0.75rem" }}>
                  <span className="badge badge-primary">Recommended Next Milestone</span>
                  <span className="text-muted text-xs">{continueRoadmap.subject}</span>
                </div>
                <h3 className="text-2xl mb-2" style={{ color: "var(--text-main)" }}>
                  {continueTopic.title}
                </h3>
                <p className="text-muted text-sm" style={{ lineHeight: 1.6 }}>
                  {continueTopic.theory ? continueTopic.theory.substring(0, 140) + "..." : "Study theory notes and complete the 5-question mastery assessment."}
                </p>
              </div>

              <Link 
                href={`/roadmap/${continueRoadmap.id}`} 
                className="btn btn-primary"
                style={{ padding: "0.95rem 1.8rem", fontSize: "1.05rem", gap: "0.5rem", whiteSpace: "nowrap" }}
              >
                Continue Learning <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}

        {/* Mode Selection Banners */}
        <div className="grid-2 mb-8">
          <div 
            className="mode-card" 
            onClick={() => resetFormForMode("COURSE")}
          >
            <div className="mode-icon-box">🎓</div>
            <div>
              <span className="badge badge-primary mb-2">Self-Paced Mode</span>
              <h2 className="text-2xl text-primary">LEARN A COURSE</h2>
            </div>
            <p className="text-muted text-sm" style={{ flex: 1, lineHeight: 1.6 }}>
              Deeply master any computer science or academic subject from scratch. Structured progressive modules, automatic study notes, and zero stressful deadlines.
            </p>
            <button className="btn btn-primary" style={{ width: "fit-content" }}>
              Configure Course Roadmap <ArrowRight size={16} />
            </button>
          </div>

          <div 
            className="mode-card" 
            onClick={() => resetFormForMode("EXAM")}
          >
            <div className="mode-icon-box" style={{ background: "rgba(52, 211, 153, 0.1)", borderColor: "rgba(52, 211, 153, 0.3)" }}>🎯</div>
            <div>
              <span className="badge badge-success mb-2">High-Stakes Mode</span>
              <h2 className="text-2xl text-accent">EXAM PREPARATION</h2>
            </div>
            <p className="text-muted text-sm" style={{ flex: 1, lineHeight: 1.6 }}>
              Prepare methodically for an upcoming mid-term, semester final, or technical qualification. Our AI reverse-engineers the daily pace needed for top scores.
            </p>
            <button className="btn btn-accent" style={{ width: "fit-content" }}>
              Configure Exam Schedule <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* User Roadmaps Section */}
        <div>
          <div className="flex-between mb-6" style={{ flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 className="text-2xl">Your Learning Journeys</h2>
              <p className="text-muted text-sm">Active curriculums with progress tracking and quiz milestones.</p>
            </div>

            {roadmaps.length > 0 && (
              <div className="form-input-wrapper" style={{ maxWidth: "280px" }}>
                <input 
                  type="text" 
                  placeholder="Filter journeys..." 
                  className="form-input" 
                  style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          {filteredRoadmaps.length === 0 ? (
            <div 
              className="glass-card text-center" 
              style={{ padding: "4rem 2rem", borderStyle: "dashed" }}
            >
              <div 
                style={{ 
                  width: "64px", 
                  height: "64px", 
                  borderRadius: "50%", 
                  background: "rgba(96, 165, 250, 0.1)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  margin: "0 auto 1.5rem" 
                }}
              >
                <Compass size={32} color="#60A5FA" />
              </div>
              <h3 className="text-xl mb-2">No active journeys yet</h3>
              <p className="text-muted text-sm mb-6" style={{ maxWidth: "460px", margin: "0 auto 1.5rem" }}>
                Choose a mode above or pick one of our popular quick-start subject tracks to generate your first AI roadmap!
              </p>
              
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                {popularSubjects.slice(0, 4).map((sub) => (
                  <button 
                    key={sub.name}
                    onClick={() => {
                      setActiveModal("COURSE");
                      selectPresetSubject(sub);
                    }}
                    className="btn btn-outline"
                    style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
                  >
                    + {sub.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid-2">
              {filteredRoadmaps.map((rm) => {
                const total = rm.topics?.length || 0;
                const completed = rm.topics?.filter((t: any) => t.isUnlocked && t.quizScore && t.quizScore >= 80).length || 0;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                const isExam = rm.type === "EXAM";
                
                return (
                  <Link 
                    href={`/roadmap/${rm.id}`} 
                    key={rm.id} 
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div 
                      className="glass-card glass-card-interactive" 
                      style={{ 
                        padding: "1.75rem", 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "1.25rem", 
                        height: "100%",
                        borderLeft: isExam ? "4px solid var(--accent-amber)" : "4px solid var(--accent-primary)"
                      }}
                    >
                      <div className="flex-between">
                        <span className={`badge ${isExam ? 'badge-warning' : 'badge-primary'}`}>
                          {isExam ? '🎯 EXAM PLAN' : '🎓 COURSE'}
                        </span>
                        <span className="text-muted text-xs" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Clock size={13} /> {rm.dailyStudyTime}m/day
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl mb-1">{rm.title}</h3>
                        <p className="text-muted text-sm">{rm.subject}</p>
                      </div>

                      {isExam && rm.examDate && (
                        <div style={{ fontSize: "0.85rem", color: "var(--accent-amber)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Calendar size={14} /> Target: {new Date(rm.examDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        </div>
                      )}

                      <div style={{ marginTop: "auto" }}>
                        <div className="flex-between mb-2 text-xs">
                          <span className="text-muted">{completed} / {total} milestones unlocked</span>
                          <span style={{ fontWeight: 700, color: isExam ? "var(--accent-amber)" : "var(--accent-primary)" }}>
                            {progress}%
                          </span>
                        </div>
                        <div style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "999px", height: "8px", overflow: "hidden" }}>
                          <div 
                            style={{ 
                              width: `${progress}%`, 
                              backgroundColor: isExam ? "var(--accent-amber)" : "var(--accent-primary)", 
                              height: "100%", 
                              transition: "width 0.6s ease" 
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Roadmap Creation Modal */}
      {activeModal && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(8, 11, 24, 0.85)", 
            backdropFilter: "blur(12px)", 
            zIndex: 1000, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: "1rem" 
          }}
        >
          <div 
            className="glass-card" 
            style={{ 
              width: "100%", 
              maxWidth: "620px", 
              maxHeight: "92vh", 
              overflowY: "auto", 
              position: "relative",
              padding: "2.5rem 2.25rem"
            }}
          >
            <button 
              onClick={() => setActiveModal(null)}
              disabled={isCreating}
              style={{ 
                position: "absolute", 
                top: "1.5rem", 
                right: "1.5rem", 
                background: "transparent", 
                border: "none", 
                cursor: "pointer", 
                color: "var(--text-muted)" 
              }}
              aria-label="Close modal"
            >
              <X size={22} />
            </button>

            <div style={{ marginBottom: "1.5rem" }}>
              <span className={`badge ${activeModal === 'EXAM' ? 'badge-warning' : 'badge-primary'} mb-2`}>
                {activeModal === 'COURSE' ? '🎓 Self-Paced Track' : '🎯 Exam Timeline Track'}
              </span>
              <h2 className="text-2xl mb-1">
                {activeModal === 'COURSE' ? 'Create Course Curriculum' : 'Build Exam Study Schedule'}
              </h2>
              <p className="text-muted text-sm">
                {activeModal === 'COURSE' 
                  ? 'Our Neural AI analyzes your syllabus or subject to build structured learning milestones.' 
                  : 'Specify your target exam date and daily commitment for an optimal timeline.'}
              </p>
            </div>

            {/* Quick Preset Subject Chips */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>
                Quick Subject Templates
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {popularSubjects.map(sub => (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => selectPresetSubject(sub)}
                    className="btn btn-outline"
                    style={{ 
                      fontSize: "0.8rem", 
                      padding: "0.35rem 0.75rem",
                      borderColor: formData.subject === sub.name ? "var(--accent-primary)" : "var(--border-subtle)",
                      background: formData.subject === sub.name ? "rgba(96, 165, 250, 0.2)" : undefined
                    }}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={(e) => handleCreate(e, activeModal)}>
              <div className="form-group">
                <label className="form-label">Roadmap Title *</label>
                <input
                  required
                  className="form-input"
                  placeholder={activeModal === 'COURSE' ? "e.g. Organic Chemistry Reactions or Linear Algebra" : "e.g. Final Board Exam or AP Physics Preparation"}
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject / Discipline *</label>
                <input
                  required
                  className="form-input"
                  placeholder="e.g. Mathematics, Physics, Biology, History, English, Accounting, Law, Engineering, or any custom subject"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                />
              </div>

              <div className="grid-2" style={{ gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Current Knowledge Level</label>
                  <select
                    className="form-input"
                    value={formData.knowledgeLevel}
                    onChange={e => setFormData({...formData, knowledgeLevel: e.target.value})}
                  >
                    <option value="Beginner">Beginner (Foundations)</option>
                    <option value="Intermediate">Intermediate (Core Concepts)</option>
                    <option value="Advanced">Advanced (High-Yield Problem Solving)</option>
                  </select>
                </div>

                {activeModal === 'EXAM' ? (
                  <div className="form-group">
                    <label className="form-label">Exam Level / Type</label>
                    <select
                      className="form-input"
                      value={formData.examLevel}
                      onChange={e => setFormData({...formData, examLevel: e.target.value})}
                    >
                      <option value="University / College">University / College</option>
                      <option value="High School / AP">High School / AP / A-Levels</option>
                      <option value="Competitive / Entrance">Competitive / Entrance Examination</option>
                      <option value="Professional / Certification">Professional / Certification</option>
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Learning Pace</label>
                    <select
                      className="form-input"
                      defaultValue="Balanced"
                    >
                      <option value="Comprehensive">Comprehensive Mastery</option>
                      <option value="Balanced">Balanced Progression</option>
                      <option value="Accelerated">Accelerated Track</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Syllabus / Focus Units / Chapters (Optional)</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Paste your specific syllabus units, chapters, or textbook outline here to ground every milestone in your exact material..."
                  value={formData.syllabus}
                  onChange={e => setFormData({...formData, syllabus: e.target.value})}
                />
              </div>

              {activeModal === 'EXAM' && (
                <div className="form-group">
                  <label className="form-label">Target Examination Date *</label>
                  <input 
                    required 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    className="form-input" 
                    value={formData.examDate} 
                    onChange={e => setFormData({...formData, examDate: e.target.value})} 
                  />
                </div>
              )}

              <div className="form-group">
                <div className="flex-between mb-2">
                  <label className="form-label" style={{ margin: 0 }}>Available Daily Study Time (Minutes) *</label>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    {["30", "45", "60", "90"].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData({...formData, dailyStudyTime: m})}
                        className="badge badge-neutral"
                        style={{ 
                          cursor: "pointer", 
                          background: formData.dailyStudyTime === m ? "var(--accent-primary)" : undefined,
                          color: formData.dailyStudyTime === m ? "#080B18" : undefined
                        }}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
                <input 
                  required 
                  type="number" 
                  min="15" 
                  max="480"
                  className="form-input" 
                  value={formData.dailyStudyTime} 
                  onChange={e => setFormData({...formData, dailyStudyTime: e.target.value})} 
                />
              </div>

              <button 
                type="submit" 
                disabled={isCreating} 
                className={`btn ${activeModal === 'EXAM' ? 'btn-accent' : 'btn-primary'} mt-4`} 
                style={{ width: "100%", padding: "1rem" }}
              >
                {isCreating ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "center" }}>
                    <Loader2 className="animate-spin" size={20} />
                    <span>{creationStep}</span>
                  </div>
                ) : (
                  <>
                    <BrainCircuit size={18} /> Generate AI Roadmap
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
