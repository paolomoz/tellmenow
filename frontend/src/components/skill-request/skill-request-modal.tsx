import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { chatSkillRequest, submitSkillRequest } from "@/lib/api/client";

interface Message {
  from: "system" | "user";
  text: string;
}

interface SkillSummary {
  name: string;
  description: string;
  input: string;
  output: string;
}

interface SkillRequestModalProps {
  open: boolean;
  onClose: () => void;
}

const INITIAL_MESSAGE: Message = {
  from: "system",
  text: "Hey! I'd love to help you shape a new skill idea. What kind of automated research or analysis would you find useful?",
};

export function SkillRequestModal({ open, onClose }: SkillRequestModalProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [summary, setSummary] = useState<SkillSummary | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, summary]);

  useEffect(() => {
    if (open && !thinking) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, thinking]);

  const reset = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setThinking(false);
    setSummary(null);
    setSubmitted(false);
    setSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 200);
  };

  // Build the messages array for the API (alternating user/assistant)
  const buildApiMessages = (msgs: Message[]) => {
    return msgs
      .filter((m) => m !== INITIAL_MESSAGE)
      .map((m) => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      }));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");

    const userMsg: Message = { from: "user", text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setThinking(true);

    try {
      const apiMessages = buildApiMessages(newMessages);
      const response = await chatSkillRequest(apiMessages);

      const assistantMsg: Message = { from: "system", text: response.text };
      setMessages((prev) => [...prev, assistantMsg]);

      if (response.summary) {
        setSummary(response.summary);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "system", text: "Sorry, I couldn't process that. Could you try again?" },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleSubmit = async () => {
    if (!summary) return;
    setSubmitting(true);
    try {
      const description = `${summary.name}: ${summary.description}`;
      const context = `Input: ${summary.input}\nOutput: ${summary.output}`;
      await submitSkillRequest(description, context);
      setSubmitted(true);
      setMessages((prev) => [
        ...prev,
        { from: "system", text: "Submitted! We'll review your idea and keep you posted." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "system", text: "Failed to submit. Please try again." },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  const showInput = !submitted;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div
        className="relative bg-card rounded-2xl shadow-xl w-full max-w-md mx-4 border border-border flex flex-col"
        style={{ maxHeight: "min(600px, 85vh)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Request a New Skill</h2>
          <button
            onClick={handleClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.from === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.from === "user"
                    ? "bg-foreground text-background rounded-br-md"
                    : "bg-accent text-foreground rounded-bl-md",
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {thinking && (
            <div className="flex justify-start">
              <div className="bg-accent text-foreground rounded-2xl rounded-bl-md px-4 py-2.5 text-sm">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                </span>
              </div>
            </div>
          )}

          {/* Summary card */}
          {summary && !submitted && (
            <div className="bg-accent/50 rounded-xl border border-border p-4 space-y-2.5">
              <div className="flex items-center gap-2 mb-1">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-primary shrink-0">
                  <rect x="1" y="1" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M4 5h6M4 7.5h4M4 10h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skill Proposal</span>
              </div>
              <p className="text-sm font-medium">{summary.name}</p>
              <p className="text-sm text-muted-foreground">{summary.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium text-muted-foreground">Input</span>
                  <p className="mt-0.5">{summary.input}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Output</span>
                  <p className="mt-0.5">{summary.output}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-foreground text-background py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Or keep chatting to refine the idea further
              </p>
            </div>
          )}

          {/* Success state */}
          {submitted && (
            <div className="flex flex-col items-center py-4 gap-3">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-500">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <button onClick={handleClose} className="text-sm text-primary hover:underline cursor-pointer">
                Close
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        {showInput && (
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your idea..."
                disabled={thinking}
                rows={1}
                className="flex-1 resize-none border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground py-1.5 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || thinking}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors cursor-pointer",
                  input.trim() && !thinking
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "text-muted-foreground",
                )}
                aria-label="Send"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 12V4M8 4L4 8M8 4l4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
