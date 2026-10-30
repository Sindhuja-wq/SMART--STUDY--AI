"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Navbar } from "@/components/Navbar";
import { Quiz } from "@/components/Quiz";
import { NotesDoubtSolver } from "@/components/NotesDoubtSolver";
import { 
  Lock, 
  CheckCircle2, 
  PlayCircle, 
  BookOpen, 
  Brain, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Calendar,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface TopicItem {
  id: string;
  title: string;
  theory: string;
  notes?: string | null;
  videoUrl?: string | null;
  timeEstimate?: number | null;
  difficulty?: string | null;
  order: number;
  isUnlocked: boolean;
  quizScore?: number | null;
}

interface RoadmapDetail {
  id: string;
  title: string;
  subject: string;
  type: "EXAM" | "COURSE";
  dailyStudyTime: number;
  examDate?: string | null;
  topics: TopicItem[];
}

export default function RoadmapViewPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex-center" style={{ height: "100vh", gap: "1rem", flexDirection: "column" }}>
          <Loader2 className="animate-spin text-primary" size={44} />
          <p className="text-muted text-sm">Loading learning journey...</p>
        </div>
      }
    >
      <RoadmapView />
    </Suspense>
  );
}

function RoadmapView() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"NOTES" | "VIDEO" | "PRACTICE">("NOTES");
  const [notesGenerating, setNotesGenerating] = useState(false);
  const [topicNotes, setTopicNotes] = useState<Record<string, string>>({});
  const [topicProvider, setTopicProvider] = useState<Record<string, { isFallback?: boolean; provider?: string }>>({});
  const generatingNotesRef = useRef<Set<string>>(new Set());

  const loadNotes = useCallback(async (topicId: string, force = false) => {
    if (!force && topicNotes[topicId]) return;
    if (generatingNotesRef.current.has(topicId)) return;

    generatingNotesRef.current.add(topicId);
    setNotesGenerating(true);
    try {
      const res = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, forceRegenerate: force })
      });
      if (res.ok) {
        const data = await res.json();
        setTopicNotes(prev => ({ ...prev, [topicId]: data.notes }));
        if (data.provider || typeof data.isFallback === "boolean") {
          setTopicProvider(prev => ({ ...prev, [topicId]: { isFallback: data.isFallback, provider: data.provider } }));
        }
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      generatingNotesRef.current.delete(topicId);
      setNotesGenerating(false);
    }
  }, [topicNotes]);

  const fetchRoadmap = useCallback(async () => {
    try {
      const res = await fetch(`/api/roadmap/${params.id}`);
      if (res.ok) {
        const data = (await res.json()) as { roadmap: RoadmapDetail };
        setRoadmap(data.roadmap);
        
        // Preload saved notes
        const savedNotes: Record<string, string> = {};
        data.roadmap.topics.forEach((t: TopicItem) => {
          if (t.notes) savedNotes[t.id] = t.notes;
        });
        setTopicNotes(savedNotes);

        // Auto-open first unlocked topic if none is selected
        if (!activeTopic && data.roadmap.topics.length > 0) {
          const firstUnlocked = data.roadmap.topics.find((t: TopicItem) => t.isUnlocked && (!t.quizScore || t.quizScore < 80)) || data.roadmap.topics[0];
          if (firstUnlocked && firstUnlocked.isUnlocked) {
            setActiveTopic(firstUnlocked.id);
            if (!savedNotes[firstUnlocked.id]) {
              loadNotes(firstUnlocked.id);
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error("Error loading roadmap:", err);
    } finally {
      setLoading(false);
    }
  }, [params.id, activeTopic, loadNotes]);

  useEffect(() => {
    let ignore = false;
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !ignore) {
      void fetchRoadmap();
    }
    return () => {
      ignore = true;
    };
  }, [status, router, fetchRoadmap]);

  if (loading || status === "loading") {
    return (
      <div className="flex-center" style={{ height: "100vh", gap: "1rem", flexDirection: "column" }}>
        <Loader2 className="animate-spin text-primary" size={44} />
        <p className="text-muted text-sm">Preparing milestone curriculum...</p>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="flex-center flex-col" style={{ height: "100vh", gap: "1.5rem" }}>
        <h2 className="text-2xl">Roadmap Not Found</h2>
        <p className="text-muted text-sm">The curriculum you requested could not be retrieved.</p>
        <Link href="/dashboard" className="btn btn-primary">Return to Dashboard</Link>
      </div>
    );
  }

  const isExam = roadmap.type === "EXAM";
  const completedTopics = roadmap.topics.filter((t: TopicItem) => t.isUnlocked && t.quizScore && t.quizScore >= 80).length;
  const progress = roadmap.topics.length > 0 ? Math.round((completedTopics / roadmap.topics.length) * 100) : 0;
  
  let daysLeft = 0;
  if (isExam && roadmap.examDate) {
    daysLeft = Math.ceil((new Date(roadmap.examDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  }

  // Find index of active topic for next/prev navigation
  // Topic navigation helper

  const navigateToTopic = (index: number) => {
    if (index >= 0 && index < roadmap.topics.length) {
      const targetTopic = roadmap.topics[index];
      if (targetTopic.isUnlocked) {
        setActiveTopic(targetTopic.id);
        setActiveTab("NOTES");
        if (!topicNotes[targetTopic.id]) {
          loadNotes(targetTopic.id);
        }
      }
    }
  };

  return (
    <>
      <div className="cyber-grid" />
      <Navbar />

      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "5rem" }}>
        
        {/* Back Navigation Bar */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link 
            href="/dashboard" 
            className="btn btn-ghost" 
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", gap: "0.4rem" }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        {/* Header / Dashboard Area */}
        <div 
          className="glass-card mb-8" 
          style={{ 
            padding: "2.5rem 3rem", 
            position: "relative", 
            overflow: "hidden",
            background: "var(--card-gradient)",
            borderLeft: isExam ? "4px solid var(--accent-amber)" : "4px solid var(--accent-primary)"
          }}
        >
          <div 
            style={{ 
              position: "absolute", 
              top: "-50%", 
              right: "-10%", 
              width: "350px", 
              height: "350px", 
              background: isExam ? "rgba(251, 191, 36, 0.12)" : "rgba(96, 165, 250, 0.15)", 
              filter: "blur(60px)", 
              borderRadius: "50%",
              pointerEvents: "none"
            }} 
          />
          
          <div className="flex-between mb-4">
            <span className={`badge ${isExam ? 'badge-warning' : 'badge-primary'}`}>
              {isExam ? '🎯 EXAM SCHEDULE' : '🎓 COURSE CURRICULUM'}
            </span>
            <span className="badge badge-neutral" style={{ fontSize: "0.75rem" }}>
              {roadmap.subject}
            </span>
          </div>
          
          <h1 className="text-3xl mb-4" style={{ zIndex: 1, position: "relative" }}>
            {roadmap.title}
          </h1>
          
          <div className="grid-2 mt-4" style={{ gap: "2rem", zIndex: 1, position: "relative", alignItems: "center" }}>
            <div>
              <div className="flex-between mb-2">
                <span className="text-muted text-sm">Overall Milestone Progress</span>
                <span className="text-xl font-bold" style={{ color: isExam ? "var(--accent-amber)" : "var(--accent-primary)" }}>
                  {progress}%
                </span>
              </div>
              <div style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "999px", height: "10px", overflow: "hidden" }}>
                <div 
                  style={{ 
                    width: `${progress}%`, 
                    backgroundColor: isExam ? "var(--accent-amber)" : "var(--accent-primary)", 
                    height: "100%", 
                    transition: "width 0.8s ease" 
                  }} 
                />
              </div>
              <div className="text-muted text-xs mt-2">
                {completedTopics} of {roadmap.topics.length} milestones mastered (80%+ quiz score)
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "1rem" }}>
              <div className="glass-card flex-col flex-center" style={{ flex: 1, padding: "1rem" }}>
                <Clock className="text-muted mb-1" size={20} />
                <span className="text-xl font-bold">{roadmap.dailyStudyTime}m</span>
                <span className="text-muted text-xs">Daily Goal</span>
              </div>
              {isExam && (
                <div className="glass-card flex-col flex-center" style={{ flex: 1, padding: "1rem" }}>
                  <Calendar className="text-warning mb-1" size={20} />
                  <span className="text-xl font-bold text-warning">{Math.max(0, daysLeft)}d</span>
                  <span className="text-muted text-xs">Exam Countdown</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Journey / Milestone Tree */}
        <div className="mb-4">
          <h2 className="text-2xl mb-1">Learning Milestones</h2>
          <p className="text-muted text-sm">
            Select an unlocked milestone to review notes, explore curated resources, and take the unlock quiz.
          </p>
        </div>

        <div className="roadmap-timeline">
          {roadmap.topics.map((topic: TopicItem, index: number) => {
            const isCompleted = topic.isUnlocked && typeof topic.quizScore === 'number' && topic.quizScore >= 80;
            const isLocked = !topic.isUnlocked;
            const isExpanded = activeTopic === topic.id;

            return (
              <div 
                key={topic.id} 
                className={`timeline-item ${isCompleted ? 'completed' : ''} ${!isLocked && !isCompleted ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
              >
                <div className="timeline-node">
                  {isCompleted ? (
                    <CheckCircle2 size={16} color="#080B18" />
                  ) : isLocked ? (
                    <Lock size={13} />
                  ) : (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{index + 1}</span>
                  )}
                </div>
                
                <div 
                  className="timeline-content" 
                  onClick={() => {
                    if (isLocked) return;
                    if (activeTopic === topic.id) {
                      setActiveTopic(null);
                    } else {
                      setActiveTopic(topic.id);
                      setActiveTab("NOTES");
                      if (!topicNotes[topic.id]) loadNotes(topic.id);
                    }
                  }}
                  style={{
                    borderColor: isExpanded ? "var(--accent-primary)" : undefined,
                    boxShadow: isExpanded ? "0 0 25px rgba(96, 165, 250, 0.2)" : undefined
                  }}
                >
                  <div className="flex-between" style={{ flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <h3 className="text-xl mb-1" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span className="text-primary font-bold">#{index + 1}</span> {topic.title}
                      </h3>
                      <p className="text-muted text-sm mb-3">
                        {topic.theory ? topic.theory.substring(0, 110) + "..." : "Structured technical theory and practice."}
                      </p>
                      
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {topic.difficulty && <span className="badge badge-neutral">{topic.difficulty}</span>}
                        {topic.timeEstimate && (
                          <span className="badge badge-neutral" style={{ gap: "0.25rem" }}>
                            <Clock size={12} /> {topic.timeEstimate}m
                          </span>
                        )}
                        {isCompleted && (
                          <span className="badge badge-success" style={{ gap: "0.25rem" }}>
                            <CheckCircle2 size={12} /> Mastered ({topic.quizScore}%)
                          </span>
                        )}
                        {!isLocked && !isCompleted && (
                          <span className="badge badge-primary">In Progress</span>
                        )}
                        {isLocked && (
                          <span className="badge badge-neutral" style={{ gap: "0.25rem" }}>
                            <Lock size={12} /> Locked (Pass #{index} Quiz)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-col" style={{ alignItems: "flex-end", gap: "0.75rem" }}>
                      {isLocked ? (
                        <div style={{ padding: "0.5rem", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }}>
                          <Lock className="text-muted" size={20} />
                        </div>
                      ) : isExpanded ? (
                        <div style={{ padding: "0.5rem", borderRadius: "50%", background: "rgba(96, 165, 250, 0.15)" }}>
                          <ChevronUp className="text-primary" size={20} />
                        </div>
                      ) : (
                        <div style={{ padding: "0.5rem", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }}>
                          <ChevronDown className="text-primary" size={20} />
                        </div>
                      )}
                      
                      {typeof topic.quizScore === "number" && (
                        <div 
                          className="badge"
                          style={{
                            background: topic.quizScore >= 80 ? "rgba(52, 211, 153, 0.15)" : "rgba(248, 113, 113, 0.15)",
                            color: topic.quizScore >= 80 ? "var(--accent-emerald)" : "var(--accent-rose)",
                            border: "none",
                            fontWeight: 700
                          }}
                        >
                          Quiz: {topic.quizScore}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Distraction-Free Learning Space */}
                  {isExpanded && !isLocked && (
                    <div 
                      style={{ 
                        marginTop: "2rem", 
                        borderTop: "1px solid var(--border-subtle)", 
                        paddingTop: "2rem" 
                      }} 
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Tabs Bar */}
                      <div className="tabs">
                        <div 
                          className={`tab ${activeTab === 'NOTES' ? 'active' : ''}`} 
                          onClick={() => setActiveTab('NOTES')}
                        >
                          <BookOpen size={18} /> THEORY & STUDY NOTES
                        </div>
                        <div 
                          className={`tab ${activeTab === 'VIDEO' ? 'active' : ''}`} 
                          onClick={() => setActiveTab('VIDEO')}
                        >
                          <PlayCircle size={18} /> VIDEO TUTORIAL
                        </div>
                        <div 
                          className={`tab ${activeTab === 'PRACTICE' ? 'active' : ''}`} 
                          onClick={() => setActiveTab('PRACTICE')}
                        >
                          <Brain size={18} /> MASTERY ASSESSMENT QUIZ
                        </div>
                      </div>

                      {/* Tab Content Panel */}
                      <div className="tab-content" style={{ minHeight: "320px" }}>
                        
                        {/* Tab 1: Theory Notes */}
                        {activeTab === 'NOTES' && (
                          <div className="markdown-notes">
                            {notesGenerating ? (
                              <div className="flex-center flex-col text-muted" style={{ height: "300px", gap: "1rem" }}>
                                <Loader2 className="animate-spin text-primary" size={40} />
                                <p className="text-sm">Neural AI is synthesizing comprehensive study notes...</p>
                              </div>
                            ) : topicNotes[topic.id] ? (
                              <div>
                                <div className="flex-between mb-4" style={{ flexWrap: "wrap", gap: "0.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                    <span className="badge badge-primary" style={{ fontSize: "0.8rem", gap: "0.35rem" }}>
                                      <BookOpen size={13} /> Curriculum Study Notes
                                    </span>
                                    {topicProvider[topic.id]?.isFallback ? (
                                      <span className="badge badge-neutral" style={{ fontSize: "0.75rem", gap: "0.3rem" }} title="Synthesized by Smart Study Offline Academic Engine">
                                        Offline Academic Engine
                                      </span>
                                    ) : topicProvider[topic.id]?.provider === "gemini" ? (
                                      <span className="badge badge-success" style={{ fontSize: "0.75rem", gap: "0.3rem" }} title="Generated live by Google Gemini AI">
                                        <Sparkles size={11} /> Google Gemini AI
                                      </span>
                                    ) : null}
                                  </div>
                                  <button
                                    type="button"
                                    disabled={notesGenerating}
                                    onClick={() => loadNotes(topic.id, true)}
                                    className="btn btn-ghost"
                                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", gap: "0.4rem" }}
                                    title="Regenerate notes with fresh curriculum coverage"
                                  >
                                    {notesGenerating ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />}
                                    Regenerate Notes
                                  </button>
                                </div>
                                <ReactMarkdown>{topicNotes[topic.id]}</ReactMarkdown>
                                
                                {/* AI Doubt Solver Context-Aware Assistant */}
                                <NotesDoubtSolver
                                  key={topic.id}
                                  topicId={topic.id}
                                  topicTitle={topic.title}
                                  subject={roadmap.subject}
                                  notes={topicNotes[topic.id]}
                                  notesGenerating={notesGenerating}
                                />
                                
                                {/* Call to action after reading notes */}
                                <div 
                                  style={{ 
                                    marginTop: "2.5rem", 
                                    padding: "1.5rem", 
                                    borderRadius: "var(--radius-md)", 
                                    background: "rgba(96, 165, 250, 0.08)", 
                                    border: "1px solid var(--border-subtle)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "1rem"
                                  }}
                                >
                                  <div>
                                    <h4 className="text-lg mb-1">Finished reviewing this topic?</h4>
                                    <p className="text-muted text-xs">Test your mastery with 5 quick questions to unlock the next milestone.</p>
                                  </div>
                                  <button 
                                    onClick={() => setActiveTab('PRACTICE')}
                                    className="btn btn-primary"
                                    style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem" }}
                                  >
                                    Take Milestone Quiz →
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-center flex-col text-muted" style={{ height: "300px", gap: "1rem" }}>
                                <p>Failed to load notes.</p>
                                <button className="btn btn-outline" onClick={() => loadNotes(topic.id)}>
                                  Try Again
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tab 2: Video Resources */}
                        {activeTab === 'VIDEO' && (
                          <div>
                            <div className="mb-4">
                              <h3 className="text-xl mb-1">Curated Video Resources</h3>
                              <p className="text-muted text-sm">
                                High-yield video tutorials specifically matching <strong>{topic.title}</strong>.
                              </p>
                            </div>

                            {topic.videoUrl ? (
                              <a 
                                href={topic.videoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ textDecoration: "none", color: "inherit", display: "block" }}
                              >
                                <div className="video-card">
                                  <div className="video-thumbnail">
                                    <PlayCircle size={44} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div className="badge badge-primary mb-2">Recommended Guide</div>
                                    <h4 className="text-xl mb-1">{topic.title} — Video Masterclass</h4>
                                    <p className="text-muted text-sm mb-3">
                                      Search query optimized for {roadmap.subject}: {topic.title} concepts, examples, and walkthroughs.
                                    </p>
                                    <span className="btn btn-outline" style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem", gap: "0.4rem" }}>
                                      Watch Tutorial on YouTube <ExternalLink size={14} />
                                    </span>
                                  </div>
                                </div>
                              </a>
                            ) : (
                              <div className="glass-card text-center text-muted" style={{ padding: "3rem 1rem" }}>
                                <p>No direct video link found for this milestone.</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tab 3: Practice Assessment */}
                        {activeTab === 'PRACTICE' && (
                          <div>
                            <Quiz topicId={topic.id} onComplete={fetchRoadmap} />
                          </div>
                        )}
                        
                      </div>

                      {/* Navigation Controls: Previous / Next Milestone */}
                      <div 
                        style={{ 
                          marginTop: "2.5rem", 
                          paddingTop: "1.5rem", 
                          borderTop: "1px solid var(--border-subtle)",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "1rem",
                          flexWrap: "wrap"
                        }}
                      >
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => navigateToTopic(index - 1)}
                          className="btn btn-outline"
                          style={{ fontSize: "0.85rem", gap: "0.4rem" }}
                        >
                          <ArrowLeft size={16} /> Previous Topic
                        </button>

                        <button
                          type="button"
                          disabled={index >= roadmap.topics.length - 1 || !roadmap.topics[index + 1]?.isUnlocked}
                          onClick={() => navigateToTopic(index + 1)}
                          className="btn btn-primary"
                          style={{ fontSize: "0.85rem", gap: "0.4rem" }}
                        >
                          Next Milestone <ArrowRight size={16} />
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
