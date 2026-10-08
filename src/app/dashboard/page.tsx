"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Plus, BookOpen, Loader2, GraduationCap, Target, Clock, ArrowRight, X } from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeModal, setActiveModal] = useState<"COURSE" | "EXAM" | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ 
    title: "", 
    subject: "", 
    syllabus: "", 
    examDate: "", 
    dailyStudyTime: "60" 
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchRoadmaps();
    }
  }, [status, router]);

  const fetchRoadmaps = async () => {
    const res = await fetch("/api/roadmap");
    if (res.ok) {
      const data = await res.json();
      setRoadmaps(data.roadmaps);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent, type: "COURSE" | "EXAM") => {
    e.preventDefault();
    setIsCreating(true);
    const res = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, type }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/roadmap/${data.roadmapId}`);
    } else {
      alert("Failed to create roadmap. Make sure Ollama is running with llama3.2 model.");
    }
    setIsCreating(false);
  };

  if (status === "loading" || loading) return <div className="flex-center" style={{ height: '100vh' }}><Loader2 className="animate-spin text-primary" size={40} /></div>;

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || "Student";

  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: '3rem' }}>
        
        {/* Header Section */}
        <div className="mb-8 text-center" style={{ animation: 'slideIn 0.6s ease' }}>
          <h1 className="text-3xl mb-2">{greeting}, {userName}</h1>
          <p className="text-muted text-xl">Learn smarter. Build skills. Reach your goals.</p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid-2 mb-8">
          <div className="glass-card mode-card" onClick={() => setActiveModal("COURSE")}>
            <div className="mode-icon">🎓</div>
            <h2 className="text-2xl text-primary">LEARN A COURSE</h2>
            <p className="text-muted mb-4" style={{ flex: 1 }}>Master a subject at your own pace with AI. No strict deadlines, just pure learning.</p>
            <button className="btn btn-primary" style={{ width: 'fit-content' }}>
              Start Learning <ArrowRight size={18} />
            </button>
          </div>

          <div className="glass-card mode-card" onClick={() => setActiveModal("EXAM")}>
            <div className="mode-icon">🎯</div>
            <h2 className="text-2xl text-accent">EXAM PREPARATION</h2>
            <p className="text-muted mb-4" style={{ flex: 1 }}>Prepare strategically with an AI-powered study plan optimized for your exam date.</p>
            <button className="btn btn-accent" style={{ width: 'fit-content' }}>
              Prepare for Exam <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* User Roadmaps */}
        <div className="mt-8">
          <h2 className="text-2xl mb-4">Your Learning Journeys</h2>
          <div className="grid-2">
            {roadmaps.length === 0 ? (
              <div className="glass-card flex-center text-center text-muted" style={{ gridColumn: '1 / -1', padding: '4rem' }}>
                You have no active learning journeys yet. Select a mode above to start!
              </div>
            ) : (
              roadmaps.map((rm: any) => {
                const completed = rm.topics.filter((t: any) => t.isUnlocked && t.quizScore && t.quizScore >= 80).length;
                const total = rm.topics.length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                const isExam = rm.type === "EXAM";
                
                return (
                  <Link href={`/roadmap/${rm.id}`} key={rm.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                      <div className="flex-between">
                        <span className={`badge ${isExam ? 'badge-warning' : 'badge-primary'}`}>
                          {isExam ? '🎯 EXAM' : '🎓 COURSE'}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} /> {rm.dailyStudyTime}m/day
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-xl mb-1">{rm.title}</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>{rm.subject}</p>
                      </div>

                      {isExam && rm.examDate && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-color)' }}>
                          <strong>Target Date:</strong> {new Date(rm.examDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </div>
                      )}

                      <div style={{ marginTop: 'auto' }}>
                        <div className="flex-between mb-2" style={{ fontSize: '0.875rem' }}>
                          <span className="text-muted">Progress</span>
                          <span style={{ color: isExam ? 'var(--warning)' : 'var(--primary)', fontWeight: 'bold' }}>{progress}%</span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: 'var(--secondary)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                          <div style={{ width: `${progress}%`, backgroundColor: isExam ? 'var(--warning)' : 'var(--primary)', height: '100%', transition: 'width 0.5s ease' }}></div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {activeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              onClick={() => setActiveModal(null)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={24} />
            </button>
            
            <h2 className={`text-2xl mb-2 ${activeModal === 'EXAM' ? 'text-accent' : 'text-primary'}`}>
              {activeModal === 'COURSE' ? '🎓 Start a Course' : '🎯 Exam Preparation'}
            </h2>
            <p className="text-muted mb-6">
              {activeModal === 'COURSE' 
                ? 'Enter the subject you want to master. Our AI will build a comprehensive curriculum.'
                : 'Enter your exam details. Our AI will build a strategic schedule to ensure you are ready.'}
            </p>

            <form onSubmit={(e) => handleCreate(e, activeModal)}>
              <div className="form-group">
                <label className="form-label">Roadmap Title</label>
                <input required className="form-input" placeholder={activeModal === 'COURSE' ? "e.g. Master Python 101" : "e.g. CS Final Exam Prep"} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Subject / Topic</label>
                <input required className="form-input" placeholder="e.g. Python, DBMS, Machine Learning" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
              </div>
              
              <div className="form-group">
                <label className="form-label">Syllabus / Goals (Optional)</label>
                <textarea className="form-input form-textarea" placeholder="Paste your syllabus or specific topics you want to cover..." value={formData.syllabus} onChange={e => setFormData({...formData, syllabus: e.target.value})} />
              </div>

              {activeModal === 'EXAM' && (
                <div className="form-group">
                  <label className="form-label">Exam Date <span className="text-error">*</span></label>
                  <input required type="date" className="form-input" value={formData.examDate} onChange={e => setFormData({...formData, examDate: e.target.value})} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Available Study Time (minutes per day) <span className="text-error">*</span></label>
                <input required type="number" min="15" className="form-input" value={formData.dailyStudyTime} onChange={e => setFormData({...formData, dailyStudyTime: e.target.value})} />
              </div>
              
              <button type="submit" disabled={isCreating} className={`btn ${activeModal === 'EXAM' ? 'btn-accent' : 'btn-primary'} mt-4`} style={{ width: '100%' }}>
                {isCreating ? <><Loader2 className="animate-spin" /> Generating AI Curriculum...</> : 'Generate AI Roadmap'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}} />
    </>
  );
}
