"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Quiz } from "@/components/Quiz";
import { Lock, Unlock, PlayCircle, FileText } from "lucide-react";

export default function RoadmapView() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const fetchRoadmap = async () => {
    const res = await fetch(`/api/roadmap/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setRoadmap(data.roadmap);
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

  if (loading || status === "loading") return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  if (!roadmap) return <div className="flex-center" style={{ height: '100vh' }}>Roadmap not found.</div>;

  return (
    <>
      <Navbar />
      <main className="container">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {roadmap.title}
        </h1>
        <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>
          Syllabus: {roadmap.syllabus} <br />
          Exam Date: {new Date(roadmap.examDate).toLocaleDateString()} | Daily Study: {roadmap.dailyStudyTime} mins
        </p>

        <div className="topic-list">
          {roadmap.topics.map((topic: any, index: number) => (
            <div key={topic.id} className={`topic-item ${!topic.isUnlocked ? 'locked' : ''}`}>
              <div 
                className="topic-header" 
                style={{ cursor: topic.isUnlocked ? 'pointer' : 'not-allowed' }}
                onClick={() => topic.isUnlocked && setActiveTopic(activeTopic === topic.id ? null : topic.id)}
              >
                <div className="topic-title">
                  <span style={{ color: '#3b82f6', fontSize: '1.5rem' }}>{index + 1}.</span> {topic.title}
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {topic.quizScore !== null && (
                    <span className={`badge ${topic.quizScore >= 70 ? 'badge-success' : 'badge-warning'}`}>
                      Score: {topic.quizScore}%
                    </span>
                  )}
                  {topic.isUnlocked ? <Unlock color="#10b981" /> : <Lock color="#94a3b8" />}
                </div>
              </div>

              {activeTopic === topic.id && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <FileText size={18} color="#3b82f6" /> Theory
                    </h4>
                    <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{topic.theory}</p>
                  </div>
                  
                  {topic.videoUrl && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <a href={topic.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline flex-center" style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <PlayCircle size={18} /> Watch Video Lesson
                      </a>
                    </div>
                  )}

                  <Quiz topicId={topic.id} onComplete={fetchRoadmap} />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
