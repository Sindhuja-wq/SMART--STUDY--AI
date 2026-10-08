"use client";

import { useState } from "next";
import { CheckCircle2, Circle } from "lucide-react";

export function Quiz({ topicId, onComplete }: { topicId: string, onComplete: () => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);

  const startQuiz = async () => {
    setLoading(true);
    const res = await fetch("/api/quiz/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId }),
    });
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions);
    } else {
      alert("Failed to generate quiz.");
    }
    setLoading(false);
  };

  const submitQuiz = async () => {
    setLoading(true);
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, answers }),
    });
    if (res.ok) {
      const data = await res.json();
      setResult(data);
      onComplete(); // refresh parent
    }
    setLoading(false);
  };

  if (result) {
    return (
      <div className="glass-card text-center" style={{ marginTop: '1rem', background: result.score >= 70 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>You scored {result.score}%</h3>
        {result.score >= 70 ? (
          <p style={{ color: '#10b981' }}>Great job! You have unlocked the next topic.</p>
        ) : (
          <p style={{ color: '#ef4444' }}>You need 70% to unlock the next topic. Review the theory and try again.</p>
        )}
        <button onClick={() => {setResult(null); setAnswers({});}} className="btn btn-primary mt-4">Retake Quiz</button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ marginTop: '1rem' }}>
        <button onClick={startQuiz} disabled={loading} className="btn btn-accent">
          {loading ? 'Generating AI Quiz...' : 'Take Quiz to Proceed'}
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ marginTop: '1rem' }}>
      <h3 className="mb-4">Knowledge Check</h3>
      {questions.map((q, i) => {
        const opts = JSON.parse(q.options);
        return (
          <div key={q.id} className="mb-4">
            <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{i + 1}. {q.text}</p>
            <div>
              {opts.map((opt: string, optIdx: number) => {
                const isSelected = answers[q.id] === optIdx;
                return (
                  <div 
                    key={optIdx} 
                    className={`quiz-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => setAnswers({...answers, [q.id]: optIdx})}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                  >
                    {isSelected ? <CheckCircle2 size={18} color="#3b82f6" /> : <Circle size={18} color="#94a3b8" />}
                    {opt}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      <button 
        onClick={submitQuiz} 
        disabled={loading || Object.keys(answers).length !== questions.length} 
        className={`btn btn-primary ${loading || Object.keys(answers).length !== questions.length ? 'btn-disabled' : ''}`}
        style={{ width: '100%', marginTop: '1rem' }}
      >
        {loading ? 'Evaluating...' : 'Submit Quiz'}
      </button>
    </div>
  );
}
