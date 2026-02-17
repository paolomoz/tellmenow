import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { submitSkillRequest } from "@/lib/api/client";

type Step = "describe" | "refine" | "confirm" | "success";

interface Message {
  from: "system" | "user";
  text: string;
}

interface SkillRequestModalProps {
  open: boolean;
  onClose: () => void;
}

export function SkillRequestModal({ open, onClose }: SkillRequestModalProps) {
  const [step, setStep] = useState<Step>("describe");
  const [messages, setMessages] = useState<Message[]>([
    { from: "system", text: "What kind of skill would you like us to build? Describe what it should do." },
  ]);
  const [input, setInput] = useState("");
  const [description, setDescription] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, step]);

  const reset = () => {
    setStep("describe");
    setMessages([
      { from: "system", text: "What kind of skill would you like us to build? Describe what it should do." },
    ]);
    setInput("");
    setDescription("");
    setAdditionalContext("");
    setSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 200);
  };

  const addMessages = (...msgs: Message[]) => {
    setMessages((prev) => [...prev, ...msgs]);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    if (step === "describe") {
      setDescription(text);
      addMessages(
        { from: "user", text },
        { from: "system", text: "Got it! Any details on what inputs it should take or outputs it should produce? You can also skip this." },
      );
      setStep("refine");
    } else if (step === "refine") {
      setAdditionalContext(text);
      addMessages(
        { from: "user", text },
        { from: "system", text: "Here's a summary of your request:" },
      );
      setStep("confirm");
    }
  };

  const handleSkipRefine = () => {
    addMessages(
      { from: "user", text: "(skipped)" },
      { from: "system", text: "Here's a summary of your request:" },
    );
    setStep("confirm");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitSkillRequest(description, additionalContext || undefined);
      addMessages({ from: "system", text: "Thanks! We've recorded your skill request." });
      setStep("success");
    } catch {
      addMessages({ from: "system", text: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    reset();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-md mx-4 border border-border flex flex-col" style={{ maxHeight: "min(540px, 85vh)" }}>
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
                    : "bg-accent text-foreground rounded-bl-md"
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Summary card on confirm step */}
          {step === "confirm" && (
            <div className="bg-accent/50 rounded-xl border border-border p-4 space-y-2">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Skill description</span>
                <p className="text-sm mt-0.5">{description}</p>
              </div>
              {additionalContext && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional context</span>
                  <p className="text-sm mt-0.5">{additionalContext}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-foreground text-background py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
                <button
                  onClick={handleEdit}
                  disabled={submitting}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>
          )}

          {/* Success checkmark */}
          {step === "success" && (
            <div className="flex flex-col items-center py-4 gap-3">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-500">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">We'll review your request and keep you posted.</p>
              <button
                onClick={handleClose}
                className="text-sm text-primary hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area — visible on describe & refine steps */}
        {(step === "describe" || step === "refine") && (
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={step === "describe" ? "Describe the skill..." : "Add more context..."}
                rows={1}
                className="flex-1 resize-none border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground py-1.5"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                {step === "refine" && (
                  <button
                    onClick={handleSkipRefine}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1.5 px-2"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors cursor-pointer",
                    input.trim()
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "text-muted-foreground"
                  )}
                  aria-label="Send"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 12V4M8 4L4 8M8 4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
