"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import { Navbar } from "@/components/Navbar";
import { Quiz } from "@/components/Quiz";
import { Lock, CheckCircle2, PlayCircle, BookOpen, Brain, Clock, ChevronDown, ChevronUp, Loader2, Calendar } from "lucide-react";

export default function RoadmapViewPage() {
  return (
    <Suspense fallback={<div className="flex-center" style={{ height: '100vh' }}><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <RoadmapView />
    </Suspense>
  );
}

function RoadmapView() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"NOTES" | "VIDEO" | "PRACTICE">("NOTES");
  const [notesGenerating, setNotesGenerating] = useState(false);
  const [topicNotes, setTopicNotes] = useState<Record<string, string>>({});

  const fetchRoadmap = async () => {
    const res = await fetch(`/api/roadmap/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setRoadmap(data.roadmap);
      // Preload saved notes
      const savedNotes: Record<string, string> = {};
      data.roadmap.topics.forEach((t: any) => {
        if (t.notes) savedNotes[t.id] = t.notes;
      });
      setTopicNotes(savedNotes);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchRoadmap();
    }
  }, [status, router, params.id]);

  const generatingNotesRef = useRef<Set<string>>(new Set());

  const loadNotes = async (topicId: string) => {
    if (topicNotes[topicId]) return;
    if (generatingNotesRef.current.has(topicId)) return;
    
    generatingNotesRef.current.add(topicId);
    setNotesGenerating(true);
    try {
      const res = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId })
      });
      if (res.ok) {
        const data = await res.json();
        setTopicNotes(prev => ({ ...prev, [topicId]: data.notes }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      generatingNotesRef.current.delete(topicId);
      setNotesGenerating(false);
    }
  };

  if (loading || status === "loading") return <div className="flex-center" style={{ height: '100vh' }}><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!roadmap) return <div className="flex-center" style={{ height: '100vh' }}>Roadmap not found.</div>;

  const isExam = roadmap.type === "EXAM";
  const completedTopics = roadmap.topics.filter((t: any) => t.isUnlocked && t.quizScore && t.quizScore >= 80).length;
  const progress = roadmap.topics.length > 0 ? Math.round((completedTopics / roadmap.topics.length) * 100) : 0;
  
  let daysLeft = 0;
  if (isExam && roadmap.examDate) {
    daysLeft = Math.ceil((new Date(roadmap.examDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  }

  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: '2rem' }}>
        
        {/* Header / Dashboard Area */}
        <div className="glass-card mb-8" style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: isExam ? 'rgba(245, 158, 11, 0.1)' : 'rgba(79, 70, 229, 0.1)', filter: 'blur(50px)', borderRadius: '50%' }}></div>
          
          <div className="flex-between mb-4">
            <span className={`badge ${isExam ? 'badge-warning' : 'badge-primary'}`}>
              {isExam ? '🎯 EXAM PREPARATION' : '🎓 COURSE LEARNING'}
            </span>
          </div>
          
          <h1 className="text-3xl mb-4" style={{ zIndex: 1, position: 'relative' }}>Your {roadmap.subject} Journey</h1>
          
          <div className="grid-2 mt-4" style={{ gap: '1rem', zIndex: 1, position: 'relative' }}>
            <div>
              <p className="text-muted mb-2">Overall Progress</p>
              <div className="flex-between mb-2">
                <span className="text-xl">{progress}%</span>
                <span className="text-muted">{completedTopics} / {roadmap.topics.length} topics</span>
              </div>
              <div style={{ width: '100%', backgroundColor: 'var(--secondary)', borderRadius: '999px', height: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, backgroundColor: isExam ? 'var(--warning)' : 'var(--primary)', height: '100%', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
              </div>
            </div>
            
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="glass-card flex-col flex-center" style={{ padding: '1rem' }}>
                <Clock className="text-muted mb-2" />
                <span className="text-xl">{roadmap.dailyStudyTime}m</span>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Daily Target</span>
              </div>
              {isExam && (
                <div className="glass-card flex-col flex-center" style={{ padding: '1rem' }}>
                  <Calendar className="text-warning mb-2" />
                  <span className="text-xl text-warning">{Math.max(0, daysLeft)}</span>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Days Remaining</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Journey */}
        <h2 className="text-2xl mb-4">Learning Path</h2>
        <div className="roadmap-timeline">
          {roadmap.topics.map((topic: any, index: number) => {
            const isCompleted = topic.isUnlocked && topic.quizScore !== null && topic.quizScore >= 80;
            const isLocked = !topic.isUnlocked;
            const isExpanded = activeTopic === topic.id;

            return (
              <div key={topic.id} className={`timeline-item ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}>
                <div className="timeline-node"></div>
                
                <div className="timeline-content" onClick={() => {
                  if (isLocked) return;
                  if (activeTopic === topic.id) {
                    setActiveTopic(null);
                  } else {
                    setActiveTopic(topic.id);
                    setActiveTab("NOTES");
                    if (!topicNotes[topic.id]) loadNotes(topic.id);
                  }
                }}>
                  <div className="flex-between">
                    <div>
                      <h3 className="text-xl mb-1" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="text-primary">#{index + 1}</span> {topic.title}
                      </h3>
                      <p className="text-muted mb-2">{topic.theory.substring(0, 80)}...</p>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {topic.difficulty && <span className="badge badge-neutral">{topic.difficulty}</span>}
                        {topic.timeEstimate && <span className="badge badge-neutral flex-center" style={{ gap: '0.25rem' }}><Clock size={12}/> {topic.timeEstimate}m</span>}
                        {isCompleted && <span className="badge badge-success flex-center" style={{ gap: '0.25rem' }}><CheckCircle2 size={12}/> Completed</span>}
                        {!isLocked && !isCompleted && <span className="badge badge-primary">In Progress</span>}
                      </div>
                    </div>
                    
                    <div className="flex-col" style={{ alignItems: 'flex-end', gap: '1rem' }}>
                      {isLocked ? (
                        <Lock className="text-muted" size={24} />
                      ) : isExpanded ? (
                        <ChevronUp className="text-primary" size={24} />
                      ) : (
                        <ChevronDown className="text-primary" size={24} />
                      )}
                      
                      {topic.quizScore !== null && (
                        <div className={`text-xl ${topic.quizScore >= 80 ? 'text-accent' : 'text-danger'}`}>
                          {topic.quizScore}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Learning Area */}
                  {isExpanded && !isLocked && (
                    <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }} onClick={e => e.stopPropagation()}>
                      
                      {/* Tabs */}
                      <div className="tabs">
                        <div className={`tab ${activeTab === 'NOTES' ? 'active' : ''}`} onClick={() => setActiveTab('NOTES')}>
                          <BookOpen size={18} /> NOTES
                        </div>
                        <div className={`tab ${activeTab === 'VIDEO' ? 'active' : ''}`} onClick={() => setActiveTab('VIDEO')}>
                          <PlayCircle size={18} /> VIDEO
                        </div>
                        <div className={`tab ${activeTab === 'PRACTICE' ? 'active' : ''}`} onClick={() => setActiveTab('PRACTICE')}>
                          <Brain size={18} /> PRACTICE
                        </div>
                      </div>

                      {/* Tab Content */}
                      <div className="tab-content" style={{ minHeight: '300px' }}>
                        
                        {activeTab === 'NOTES' && (
                          <div className="markdown-notes">
                            {notesGenerating ? (
                              <div className="flex-center flex-col text-muted" style={{ height: '300px', gap: '1rem' }}>
                                <Loader2 className="animate-spin text-primary" size={40} />
                                <p>AI is generating custom study notes...</p>
                              </div>
                            ) : topicNotes[topic.id] ? (
                              <ReactMarkdown>{topicNotes[topic.id]}</ReactMarkdown>
                            ) : (
                              <div className="flex-center flex-col text-muted" style={{ height: '300px', gap: '1rem' }}>
                                <p>Failed to load notes.</p>
                                <button className="btn btn-outline" onClick={() => loadNotes(topic.id)}>Try Again</button>
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'VIDEO' && (
                          <div>
                            <h3 className="mb-4">Recommended Resources</h3>
                            {topic.videoUrl ? (
                              <a href={topic.videoUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="video-card">
                                  <div className="video-thumbnail">
                                    <PlayCircle size={40} />
                                  </div>
                                  <div>
                                    <h4 className="text-xl mb-1">{topic.title} - Full Tutorial</h4>
                                    <p className="text-muted mb-2">Search results curated for {roadmap.subject}</p>
                                    <span className="badge badge-primary">Watch on YouTube →</span>
                                  </div>
                                </div>
                              </a>
                            ) : (
                              <p className="text-muted">No video resources available for this topic.</p>
                            )}
                          </div>
                        )}

                        {activeTab === 'PRACTICE' && (
                          <div>
                            <div className="mb-4 text-center">
                              <h3 className="text-xl">Topic Assessment</h3>
                              <p className="text-muted">Score 80% or higher to unlock the next topic.</p>
                            </div>
                            <Quiz topicId={topic.id} onComplete={fetchRoadmap} />
                          </div>
                        )}
                        
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
