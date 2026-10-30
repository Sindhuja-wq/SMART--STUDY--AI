"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Send,
  Trash2,
  RotateCcw,
  Bot,
  User,
  Loader2,
  AlertCircle,
  HelpCircle,
  BookOpen,
} from "lucide-react";

export interface DoubtMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  isFallback?: boolean;
  timestamp: string;
}

interface NotesDoubtSolverProps {
  topicId: string;
  topicTitle: string;
  subject: string;
  notes?: string | null;
  notesGenerating?: boolean;
}

const STARTER_QUESTIONS = [
  "Explain this topic in simple English.",
  "Give me a practical example.",
  "Explain the difficult concepts step by step.",
  "Help me prepare an exam answer.",
];

function getFormattedTime(): string {
  try {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function NotesDoubtSolver({
  topicId,
  topicTitle,
  notes,
  notesGenerating = false,
}: NotesDoubtSolverProps) {
  const [messages, setMessages] = useState<DoubtMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageCounterRef = useRef(0);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const hasNotes = Boolean(notes && notes.trim().length > 0);

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText ?? input).trim();
    if (!textToSend || loading || notesGenerating || !hasNotes) return;

    setErrorMessage(null);
    setLastQuestion(textToSend);

    messageCounterRef.current += 1;
    const userMessage: DoubtMessage = {
      id: `user-${messageCounterRef.current}`,
      role: "user",
      content: textToSend,
      timestamp: getFormattedTime(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Send bounded conversation history (most recent turns)
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/notes/doubt-solver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          question: textToSend,
          conversationHistory: historyPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to solve doubt. Please try again.");
      }

      messageCounterRef.current += 1;
      const assistantMessage: DoubtMessage = {
        id: `assistant-${messageCounterRef.current}`,
        role: "assistant",
        content: data.answer || "No response generated.",
        provider: data.provider,
        isFallback: data.isFallback,
        timestamp: getFormattedTime(),
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error occurred.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setErrorMessage(null);
    setLastQuestion(null);
  };

  const handleRetry = () => {
    if (lastQuestion) {
      void handleSend(lastQuestion);
    }
  };

  return (
    <div
      className="glass-card"
      style={{
        marginTop: "2.5rem",
        padding: "1.5rem",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-medium)",
        background: "var(--bg-glass)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Header Bar */}
      <div
        className="flex-between"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(96, 165, 250, 0.15)",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HelpCircle size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              Ask AI About These Notes
              <span className="badge badge-primary" style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>
                <Sparkles size={11} /> Context-Aware
              </span>
            </h3>
            <p className="text-muted text-xs" style={{ margin: 0, marginTop: "0.2rem" }}>
              Answers are grounded strictly in your current study notes for <strong>{topicTitle}</strong>.
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearChat}
            className="btn btn-ghost"
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.75rem",
              gap: "0.35rem",
              color: "var(--text-muted)",
            }}
            title="Clear the current conversation"
          >
            <Trash2 size={13} /> Clear Chat
          </button>
        )}
      </div>

      {/* Suggested Starter Questions (shown when conversation is empty) */}
      {messages.length === 0 && hasNotes && !notesGenerating && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div className="text-muted text-xs mb-2" style={{ fontWeight: 600 }}>
            Suggested Questions:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {STARTER_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => void handleSend(q)}
                className="btn btn-outline"
                style={{
                  fontSize: "0.78rem",
                  padding: "0.4rem 0.85rem",
                  borderRadius: "var(--radius-full)",
                  background: "rgba(255, 255, 255, 0.03)",
                  textAlign: "left",
                  borderColor: "var(--border-subtle)",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation Scroll Area */}
      <div
        ref={scrollRef}
        style={{
          maxHeight: "420px",
          minHeight: messages.length > 0 ? "200px" : "80px",
          overflowY: "auto",
          paddingRight: "0.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        {/* State 1: Notes generating */}
        {notesGenerating && (
          <div
            className="flex-center flex-col text-muted"
            style={{
              padding: "2rem 1rem",
              background: "rgba(96, 165, 250, 0.05)",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--border-subtle)",
              gap: "0.5rem",
            }}
          >
            <Loader2 className="animate-spin text-primary" size={24} />
            <span className="text-xs">Study notes are currently generating. The AI tutor will unlock once notes are ready.</span>
          </div>
        )}

        {/* State 2: Notes missing */}
        {!notesGenerating && !hasNotes && (
          <div
            className="flex-center flex-col text-muted"
            style={{
              padding: "2rem 1rem",
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--border-subtle)",
              gap: "0.5rem",
            }}
          >
            <BookOpen size={24} className="text-muted" />
            <span className="text-xs">Please generate or load this topic&apos;s study notes above to ask grounded questions.</span>
          </div>
        )}

        {/* State 3: Empty conversation placeholder */}
        {!notesGenerating && hasNotes && messages.length === 0 && (
          <div
            className="text-muted text-xs text-center"
            style={{
              padding: "1.5rem 1rem",
              fontStyle: "italic",
            }}
          >
            Have a doubt about a formula, definition, code sample, or concept above? Ask below or pick a suggested question!
          </div>
        )}

        {/* Rendered Messages */}
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
                width: "100%",
              }}
            >
              {/* Message Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginBottom: "0.25rem",
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                }}
              >
                {isUser ? (
                  <>
                    <span>You</span>
                    <User size={12} />
                  </>
                ) : (
                  <>
                    <Bot size={13} className="text-primary" />
                    <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                      AI Notes Tutor
                    </span>
                    {msg.isFallback ? (
                      <span className="badge badge-neutral" style={{ fontSize: "0.65rem", padding: "0.05rem 0.35rem" }}>
                        Offline Academic Engine
                      </span>
                    ) : msg.provider === "gemini" ? (
                      <span className="badge badge-success" style={{ fontSize: "0.65rem", padding: "0.05rem 0.35rem" }}>
                        <Sparkles size={9} /> Gemini
                      </span>
                    ) : msg.provider ? (
                      <span className="badge badge-neutral" style={{ fontSize: "0.65rem", padding: "0.05rem 0.35rem" }}>
                        {msg.provider}
                      </span>
                    ) : null}
                    <span>• {msg.timestamp}</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                style={{
                  maxWidth: isUser ? "85%" : "92%",
                  padding: "0.85rem 1.15rem",
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: isUser ? "linear-gradient(135deg, rgba(96, 165, 250, 0.22), rgba(167, 139, 250, 0.18))" : "var(--bg-secondary)",
                  border: `1px solid ${isUser ? "var(--border-medium)" : "var(--border-subtle)"}`,
                  color: "var(--text-main)",
                  fontSize: "0.88rem",
                  lineHeight: "1.55",
                  boxShadow: "var(--shadow-sm)",
                  wordBreak: "break-word",
                }}
              >
                {isUser ? (
                  <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                ) : (
                  <div className="markdown-notes" style={{ fontSize: "0.88rem" }}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.7rem 1.1rem",
                borderRadius: "16px 16px 16px 4px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                fontSize: "0.82rem",
              }}
            >
              <Loader2 size={16} className="animate-spin text-primary" />
              <span>Analyzing notes & synthesizing verified explanation...</span>
            </div>
          </div>
        )}

        {/* Error Notification Banner */}
        {errorMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-sm)",
              background: "rgba(248, 113, 113, 0.1)",
              border: "1px solid rgba(248, 113, 113, 0.25)",
              color: "var(--accent-rose)",
              fontSize: "0.82rem",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
            {lastQuestion && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={loading}
                className="btn btn-outline"
                style={{
                  padding: "0.25rem 0.65rem",
                  fontSize: "0.75rem",
                  borderColor: "rgba(248, 113, 113, 0.4)",
                  color: "var(--accent-rose)",
                  gap: "0.3rem",
                }}
              >
                <RotateCcw size={12} /> Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Input Box Area */}
      <div
        className="doubt-solver-input-box quiz-question-input-container"
        style={{
          display: "flex",
          gap: "0.6rem",
          alignItems: "flex-end",
          padding: "0.5rem 0.6rem",
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          disabled={loading || notesGenerating || !hasNotes}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            notesGenerating
              ? "Notes generating... please wait"
              : !hasNotes
              ? "Generate study notes first to ask questions"
              : "Ask a doubt about these notes... (Enter to send, Shift+Enter for new line)"
          }
          rows={2}
          className="doubt-solver-input quiz-question-input"
          style={{
            flex: 1,
            fontSize: "0.88rem",
            resize: "none",
            fontFamily: "inherit",
            lineHeight: "1.4",
            padding: "0.3rem 0.4rem",
          }}
        />

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!input.trim() || loading || notesGenerating || !hasNotes}
          className="btn doubt-solver-send-btn quiz-send-btn"
          style={{
            padding: "0.6rem 1rem",
            fontSize: "0.85rem",
            borderRadius: "var(--radius-sm)",
            gap: "0.4rem",
            alignSelf: "flex-end",
          }}
          title={!input.trim() ? "Type a question to send" : "Send question (Enter)"}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Send size={15} />
              <span>Send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
