"use client";

import { useEffect, useState } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Plus, BookOpen, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ title: "", syllabus: "", examDate: "", dailyStudyTime: "" });

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    const res = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/roadmap/${data.roadmapId}`);
    } else {
      alert("Failed to create roadmap. Make sure Ollama is running with llama3.2 model.");
    }
    setIsCreating(false);
  };

  if (status === "loading" || loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

  return (
    <>
      <Navbar />
      <main className="container">
        <div className="flex-between mb-4">
          <h1 style={{ fontSize: '2rem' }}>My Study Roadmaps</h1>
        </div>

        <div className="grid-2">
          {/* Create New Form */}
          <div className="glass-card">
            <h2 className="mb-4 flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}>
              <Plus size={20} color="#10b981" /> Generate New Roadmap
            </h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Roadmap Title</label>
                <input required className="form-input" placeholder="e.g. React Mastery" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Syllabus (Topics to cover)</label>
                <textarea required className="form-input form-textarea" placeholder="Paste your syllabus here..." value={formData.syllabus} onChange={e => setFormData({...formData, syllabus: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Exam Date</label>
                <input required type="date" className="form-input" value={formData.examDate} onChange={e => setFormData({...formData, examDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Daily Study Time (minutes)</label>
                <input required type="number" min="15" className="form-input" value={formData.dailyStudyTime} onChange={e => setFormData({...formData, dailyStudyTime: e.target.value})} />
              </div>
              <button type="submit" disabled={isCreating} className={`btn btn-primary ${isCreating ? 'btn-disabled' : ''}`} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                {isCreating ? <><Loader2 className="animate-spin" /> Generating AI Plan...</> : 'Generate AI Roadmap'}
              </button>
            </form>
          </div>

          {/* List of existing roadmaps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {roadmaps.length === 0 ? (
              <div className="glass-card flex-center text-center" style={{ height: '100%', color: '#94a3b8' }}>
                You have no roadmaps yet. Generate one to start studying!
              </div>
            ) : (
              roadmaps.map((rm: any) => {
                const completed = rm.topics.filter((t: any) => t.quizScore && t.quizScore >= 70).length;
                const total = rm.topics.length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                
                return (
                  <Link href={`/roadmap/${rm.id}`} key={rm.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="flex-between">
                        <h3 style={{ fontSize: '1.25rem', color: '#3b82f6' }}>{rm.title}</h3>
                        <BookOpen size={20} color="#cbd5e1" />
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        Exam: {new Date(rm.examDate).toLocaleDateString()} | {rm.dailyStudyTime} mins/day
                      </div>
                      <div style={{ width: '100%', backgroundColor: '#1e293b', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, backgroundColor: '#10b981', height: '100%' }}></div>
                      </div>
                      <div style={{ fontSize: '0.875rem', textAlign: 'right', color: '#10b981' }}>{progress}% Completed</div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}} />
    </>
  );
}
