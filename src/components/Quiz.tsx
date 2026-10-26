"use client";

import { useState, useEffect } from "react";
import { 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  Award, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  Check, 
  X 
} from "lucide-react";

interface QuestionItem {
  id: string;
  topicId?: string;
  text: string;
  options: string;
  correctOption: number;
  explanation?: string | null;
  isActive?: boolean;
}

interface QuizSubmissionResult {
  success: boolean;
  score: number;
  correctCount?: number;
  total?: number;
  unlockedNext?: boolean;
  questions?: QuestionItem[];
}

export function Quiz({ topicId, onComplete }: { topicId: string; onComplete: () => void }) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Check if questions already exist on mount using safe effect pattern
  useEffect(() => {
    let ignore = false;

    const fetchExisting = async () => {
      try {
        const res = await fetch("/api/quiz/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId, forceRegenerate: false, checkOnly: true }),
        });
        if (res.ok && !ignore) {
          const data = (await res.json()) as { questions?: QuestionItem[] };
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
          }
        }
      } catch (err: unknown) {
        console.error("Error fetching existing quiz:", err);
      }
    };

    void fetchExisting();

    return () => {
      ignore = true;
    };
  }, [topicId]);

  const startQuiz = async (forceRegenerate = false) => {
    if (loading) return;
    setLoading(true);
    setErrorMessage("");
    setLoadingStep("Connecting to Neural Examiner...");
    
    const steps = [
      "Analyzing topic theory...",
      "Drafting conceptual questions...",
      "Validating answer keys & distractors...",
      "Finalizing 5-question assessment..."
    ];
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setLoadingStep(steps[stepIdx]);
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
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || "Failed to generate assessment.");
      }
    } catch {
      clearInterval(stepInterval);
      setErrorMessage("Network error while generating quiz.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, answers }),
      });
      if (res.ok) {
        const data = (await res.json()) as QuizSubmissionResult;
        setResult(data);
        if (data.unlockedNext) {
          onComplete(); // refresh parent roadmap
        }
      } else {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMessage(errData.error || "Failed to submit assessment.");
      }
    } catch {
      setErrorMessage("Network error while submitting quiz.");
    } finally {
      setLoading(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const optionLetters = ["A", "B", "C", "D"];

  // Loading Screen
  if (loading && questions.length === 0) {
    return (
      <div 
        className="glass-card flex-center flex-col" 
        style={{ marginTop: "1rem", padding: "4rem 2rem", gap: "1.5rem", textAlign: "center" }}
      >
        <div 
          style={{ 
            width: "68px", 
            height: "68px", 
            borderRadius: "50%", 
            background: "rgba(96, 165, 250, 0.12)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            boxShadow: "0 0 25px rgba(96, 165, 250, 0.25)" 
          }}
        >
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
        <div>
          <h3 className="text-xl mb-1">Generating Topic Assessment</h3>
          <p className="text-muted text-sm">{loadingStep}</p>
        </div>
      </div>
    );
  }

  // Quiz Result Screen
  if (result) {
    const passed = result.score >= 80;
    const correctAnswersCount = Math.round((result.score / 100) * (result.questions?.length || 5));

    return (
      <div 
        className="glass-card" 
        style={{ 
          marginTop: "1.5rem", 
          borderLeft: passed ? "4px solid var(--accent-emerald)" : "4px solid var(--accent-rose)",
          background: passed 
            ? "linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(17, 23, 43, 0.9) 100%)" 
            : "linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(17, 23, 43, 0.9) 100%)"
        }}
      >
        <div className="text-center mb-6">
          <div 
            style={{ 
              width: "72px", 
              height: "72px", 
              borderRadius: "50%", 
              margin: "0 auto 1rem", 
              background: passed ? "rgba(52, 211, 153, 0.15)" : "rgba(248, 113, 113, 0.15)",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: passed ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid rgba(248, 113, 113, 0.3)"
            }}
          >
            {passed ? <Award size={36} color="#34D399" /> : <AlertCircle size={36} color="#F87171" />}
          </div>

          <h3 className="text-3xl mb-1">
            You Scored <span style={{ color: passed ? "var(--accent-emerald)" : "var(--accent-rose)" }}>{result.score}%</span>
          </h3>

          <p className="text-muted text-sm mb-2">
            ({correctAnswersCount} of {result.questions?.length || 5} questions answered correctly)
          </p>

          {passed ? (
            <div 
              className="badge badge-success" 
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", gap: "0.4rem" }}
            >
              🎉 Milestone Passed! Next topic milestone unlocked.
            </div>
          ) : (
            <div 
              className="badge badge-neutral" 
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", color: "var(--accent-rose)", borderColor: "rgba(248, 113, 113, 0.3)" }}
            >
              ⚠️ Passing criteria: 80% (4 out of 5). Review theory notes and retake to advance.
            </div>
          )}
        </div>

        {/* Detailed Question Review with Explanations */}
        <div style={{ marginTop: "2rem" }}>
          <h4 className="text-lg mb-4" style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
            Question Review & AI Explanations
          </h4>

          {result.questions && result.questions.map((q: QuestionItem, i: number) => {
            const opts = JSON.parse(q.options) as string[];
            const userAns = answers[q.id];
            const isCorrect = userAns === q.correctOption;

            return (
              <div 
                key={q.id} 
                style={{ 
                  marginBottom: "1.25rem", 
                  padding: "1.25rem", 
                  background: "rgba(11, 16, 32, 0.8)", 
                  borderRadius: "var(--radius-md)", 
                  border: isCorrect ? "1px solid rgba(52, 211, 153, 0.25)" : "1px solid rgba(248, 113, 113, 0.25)"
                }}
              >
                <div className="flex-between mb-2">
                  <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                    Q{i + 1}. {q.text}
                  </span>
                  <span 
                    className={`badge ${isCorrect ? 'badge-success' : 'badge-neutral'}`}
                    style={{ fontSize: "0.7rem", color: isCorrect ? undefined : "var(--accent-rose)" }}
                  >
                    {isCorrect ? <Check size={12} /> : <X size={12} />} {isCorrect ? "Correct" : "Incorrect"}
                  </span>
                </div>

                <div style={{ marginTop: "0.75rem", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <div style={{ color: isCorrect ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                    <strong>Your Answer:</strong> {opts[userAns] !== undefined ? `(${optionLetters[userAns]}) ${opts[userAns]}` : "Not answered"}
                  </div>
                  {!isCorrect && (
                    <div style={{ color: "var(--accent-emerald)" }}>
                      <strong>Correct Key:</strong> ({optionLetters[q.correctOption]}) {opts[q.correctOption]}
                    </div>
                  )}
                </div>

                {q.explanation && (
                  <div 
                    style={{ 
                      marginTop: "0.75rem", 
                      padding: "0.75rem", 
                      borderRadius: "6px", 
                      background: "rgba(255, 255, 255, 0.03)", 
                      fontSize: "0.85rem", 
                      color: "var(--text-secondary)",
                      borderLeft: "3px solid var(--accent-primary)" 
                    }}
                  >
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex-center" style={{ gap: "1rem", marginTop: "2.5rem", flexWrap: "wrap" }}>
          <button 
            onClick={() => { setResult(null); setAnswers({}); }} 
            className="btn btn-primary"
            style={{ gap: "0.5rem" }}
          >
            <RotateCcw size={16} /> Retake Assessment
          </button>
          <button 
            onClick={() => startQuiz(true)} 
            disabled={loading} 
            className="btn btn-outline"
            style={{ gap: "0.5rem" }}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} 
            Generate Fresh Questions
          </button>
        </div>
      </div>
    );
  }

  // Initial State: Start Quiz Button
  if (questions.length === 0) {
    return (
      <div 
        className="glass-card text-center" 
        style={{ marginTop: "1rem", padding: "3rem 2rem" }}
      >
        <div 
          style={{ 
            width: "60px", 
            height: "60px", 
            borderRadius: "50%", 
            background: "rgba(96, 165, 250, 0.12)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            margin: "0 auto 1.25rem" 
          }}
        >
          <Award size={28} color="#60A5FA" />
        </div>
        <h3 className="text-xl mb-2">Milestone Mastery Assessment</h3>
        <p className="text-muted text-sm mb-6" style={{ maxWidth: "460px", margin: "0 auto 1.5rem" }}>
          Complete 5 focused multiple-choice questions to prove your understanding. Score 80%+ to unlock the next milestone!
        </p>

        {errorMessage && (
          <div className="text-error text-sm mb-4">{errorMessage}</div>
        )}

        <button 
          onClick={() => startQuiz(false)} 
          disabled={loading} 
          className="btn btn-primary" 
          style={{ padding: "0.9rem 2rem", fontSize: "1rem", gap: "0.5rem" }}
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} 
          Start Topic Assessment
        </button>
      </div>
    );
  }

  // Active Quiz Interface
  return (
    <div className="glass-card" style={{ marginTop: "1rem", padding: "2.25rem" }}>
      {/* Quiz Header & Progress */}
      <div className="flex-between mb-4" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span className="badge badge-primary mb-1">Knowledge Check</span>
          <h3 className="text-xl">Topic Mastery Quiz</h3>
        </div>

        <button 
          onClick={() => startQuiz(true)} 
          disabled={loading} 
          className="btn btn-ghost" 
          style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", gap: "0.4rem" }}
        >
          <RefreshCw size={14} /> Regenerate Questions
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="flex-between mb-1 text-xs text-muted">
          <span>Answered: {answeredCount} / {questions.length}</span>
          <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
        </div>
        <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
          <div 
            style={{ 
              width: `${(answeredCount / questions.length) * 100}%`, 
              height: "100%", 
              background: "linear-gradient(90deg, #60A5FA, #67E8F9)", 
              transition: "width 0.3s ease" 
            }} 
          />
        </div>
      </div>

      {errorMessage && (
        <div 
          style={{ 
            padding: "0.75rem 1rem", 
            borderRadius: "var(--radius-sm)", 
            background: "rgba(248, 113, 113, 0.15)", 
            color: "var(--accent-rose)", 
            fontSize: "0.85rem", 
            marginBottom: "1.5rem" 
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Questions List */}
      {questions.map((q, i) => {
        const opts = JSON.parse(q.options);
        return (
          <div 
            key={q.id} 
            style={{ 
              marginBottom: "2rem", 
              paddingBottom: "1.75rem", 
              borderBottom: i < questions.length - 1 ? "1px solid var(--border-subtle)" : "none" 
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: "1rem", fontSize: "1.05rem", color: "var(--text-main)" }}>
              <span className="text-primary font-bold">#{i + 1}.</span> {q.text}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {opts.map((opt: string, optIdx: number) => {
                const isSelected = answers[q.id] === optIdx;
                return (
                  <div 
                    key={optIdx} 
                    className={`quiz-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => setAnswers({ ...answers, [q.id]: optIdx })}
                  >
                    <div 
                      style={{ 
                        width: "28px", 
                        height: "28px", 
                        borderRadius: "8px", 
                        background: isSelected ? "var(--accent-primary)" : "rgba(255,255,255,0.06)",
                        color: isSelected ? "#080B18" : "var(--text-secondary)",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        flexShrink: 0,
                        transition: "all 0.2s ease"
                      }}
                    >
                      {optionLetters[optIdx]}
                    </div>
                    <span style={{ fontSize: "0.95rem", color: isSelected ? "#F8FAFC" : "var(--text-secondary)" }}>
                      {opt}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {/* Submit Button */}
      <button 
        onClick={submitQuiz} 
        disabled={loading || answeredCount !== questions.length} 
        className={`btn btn-primary flex-center ${loading || answeredCount !== questions.length ? 'btn-disabled' : ''}`}
        style={{ width: "100%", marginTop: "1.5rem", padding: "1rem", fontSize: "1rem", gap: "0.5rem" }}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} /> Evaluating Responses...
          </>
        ) : (
          <>
            Submit Assessment ({answeredCount}/{questions.length} answered) <ArrowRight size={18} />
          </>
        )}
      </button>
    </div>
  );
}
