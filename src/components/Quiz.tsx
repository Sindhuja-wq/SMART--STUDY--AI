"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Loader2, RefreshCw } from "lucide-react";

export function Quiz({ topicId, onComplete }: { topicId: string, onComplete: () => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);

  // Check if questions already exist on mount
  useEffect(() => {
    fetchExistingQuiz();
  }, [topicId]);

  const fetchExistingQuiz = async () => {
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, forceRegenerate: false, checkOnly: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startQuiz = async (forceRegenerate = false) => {
    if (loading) return;
    setLoading(true);
    setLoadingStep("Connecting to AI...");
    
    // Simulate steps for better UX since generation can take 5-10s
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev === "Connecting to AI...") return "Generating questions...";
        if (prev === "Generating questions...") return "Checking answer logic...";
        if (prev === "Checking answer logic...") return "Removing ambiguities...";
        if (prev === "Removing ambiguities...") return "Finalizing quiz...";
        return prev;
      });
    }, 2000);

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, forceRegenerate }),
      });
      
      clearInterval(stepInterval);
      
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
        setAnswers({});
        setResult(null);
      } else {
        const data = await res.json();
        alert(`Failed to generate quiz: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      clearInterval(stepInterval);
      alert("Network error while generating quiz.");
    }
    
    setLoading(false);
    setLoadingStep("");
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, answers }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (data.unlockedNext) {
          onComplete(); // refresh parent roadmap
        }
      }
    } catch (err) {
      alert("Failed to submit quiz.");
    }
    setLoading(false);
  };

  if (loading && questions.length === 0) {
    return (
      <div className="glass-card flex-center flex-col" style={{ marginTop: '1rem', padding: '3rem 1rem', gap: '1.5rem', textAlign: 'center' }}>
        <Loader2 className="animate-spin text-primary" size={48} />
        <div>
          <h3 className="text-xl mb-2">Preparing your Quiz</h3>
          <p className="text-muted">{loadingStep}</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="glass-card text-center" style={{ marginTop: '1rem', background: result.score >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>You scored {result.score}%</h3>
        {result.score >= 80 ? (
          <p style={{ color: 'var(--success)' }}>Great job! You have unlocked the next topic.</p>
        ) : (
          <p style={{ color: 'var(--danger)' }}>You need 80% to unlock the next topic. Review the theory and try again.</p>
        )}
        
        <div style={{ marginTop: '2rem', textAlign: 'left' }}>
          {result.questions && result.questions.map((q: any, i: number) => {
            const opts = JSON.parse(q.options);
            const userAns = answers[q.id];
            const isCorrect = userAns === q.correctOption;
            return (
              <div key={q.id} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <p style={{ fontWeight: '600' }}>{i + 1}. {q.text}</p>
                <p style={{ color: isCorrect ? 'var(--success)' : 'var(--danger)', marginTop: '0.5rem' }}>
                  Your Answer: {opts[userAns]} {isCorrect ? '✅' : '❌'}
                </p>
                {!isCorrect && (
                  <p style={{ color: 'var(--success)', marginTop: '0.25rem' }}>
                    Correct Answer: {opts[q.correctOption]}
                  </p>
                )}
                <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  <strong>Explanation:</strong> {q.explanation}
                </p>
              </div>
            )
          })}
        </div>

        <div className="flex-center" style={{ gap: '1rem', marginTop: '2rem' }}>
          <button onClick={() => {setResult(null); setAnswers({});}} className="btn btn-primary">Retake Same Quiz</button>
          <button onClick={() => startQuiz(true)} disabled={loading} className="btn btn-outline flex-center" style={{ gap: '0.5rem' }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />} Generate New Questions
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => startQuiz(false)} disabled={loading} className="btn btn-primary flex-center" style={{ width: '100%', gap: '0.5rem' }}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : null} Take Topic Assessment
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ marginTop: '1rem' }}>
      <div className="flex-between mb-6">
        <h3 className="text-xl">Knowledge Check</h3>
        <button onClick={() => startQuiz(true)} disabled={loading} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
          {loading ? 'Regenerating...' : 'Regenerate Quiz'}
        </button>
      </div>

      {questions.map((q, i) => {
        const opts = JSON.parse(q.options);
        return (
          <div key={q.id} className="mb-6">
            <p style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1.05rem' }}>{i + 1}. {q.text}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {opts.map((opt: string, optIdx: number) => {
                const isSelected = answers[q.id] === optIdx;
                return (
                  <div 
                    key={optIdx} 
                    className={`quiz-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => setAnswers({...answers, [q.id]: optIdx})}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease', background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--glass-bg)', border: isSelected ? '1px solid var(--primary)' : '1px solid var(--glass-border)' }}
                  >
                    {isSelected ? <CheckCircle2 size={20} className="text-primary" /> : <Circle size={20} className="text-muted" />}
                    <span>{opt}</span>
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
        className={`btn btn-primary flex-center ${loading || Object.keys(answers).length !== questions.length ? 'btn-disabled' : ''}`}
        style={{ width: '100%', marginTop: '2rem', gap: '0.5rem', padding: '1rem' }}
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : null}
        {loading ? 'Evaluating...' : 'Submit Answers'}
      </button>
    </div>
  );
}
