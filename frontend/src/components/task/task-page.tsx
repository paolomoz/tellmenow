import { useState, useEffect, useRef } from "react";
import { useTaskSSE } from "@/lib/hooks/use-task-sse";
import { useJobStatus } from "@/lib/hooks/use-query";
import { useQueryClient } from "@tanstack/react-query";
import { ProgressBar } from "@/components/ui/progress-bar";
import { publishReport } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface TaskPageProps {
  jobId: string;
}

export function TaskPage({ jobId }: TaskPageProps) {
  const sse = useTaskSSE(jobId);
  const { data: jobData } = useJobStatus(jobId);
  const queryClient = useQueryClient();
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const invalidatedRef = useRef(false);

  const status = sse.status || jobData?.status || "queued";

  // Invalidate history cache when task completes so sidebar updates
  useEffect(() => {
    if ((status === "completed" || status === "failed") && !invalidatedRef.current) {
      invalidatedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["history"] });
    }
  }, [status, queryClient]);
  const progress = sse.progress || jobData?.progress?.progress || 0;
  const message = sse.message || jobData?.progress?.message || "Starting...";
  const isComplete = status === "completed";
  const isFailed = status === "failed";

  // Get reasoning text from step data or result
  const reasoning =
    sse.stepData?.reasoning?.preview ||
    sse.result?.reasoning ||
    jobData?.step_data?.reasoning?.preview ||
    jobData?.result?.reasoning ||
    "";

  // Get HTML report from step data or result
  const htmlReport =
    sse.stepData?.html_report?.html ||
    sse.result?.html_report ||
    jobData?.step_data?.html_report?.html ||
    jobData?.result?.html_report ||
    "";

  const reportTitle =
    sse.stepData?.html_report?.title ||
    sse.result?.report_title ||
    jobData?.step_data?.html_report?.title ||
    jobData?.result?.report_title ||
    "";

  const query = jobData?.query || "";

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      const result = await publishReport(jobId);
      setPublishedUrl(result.url);
    } catch (e: unknown) {
      setPublishError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyLink = () => {
    if (publishedUrl) {
      navigator.clipboard.writeText(window.location.origin + publishedUrl);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with progress */}
      <div className="border-b border-border px-6 py-4 pr-16 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {query || "Processing query..."}
            </h1>
            <p className={cn(
              "text-sm mt-0.5",
              isComplete ? "text-success" : isFailed ? "text-destructive" : "text-muted text-shimmer"
            )}>
              {message}
            </p>
          </div>
          {isComplete && htmlReport && (
            <div className="flex items-center gap-2 shrink-0">
              {publishedUrl ? (
                <>
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors cursor-pointer rounded-md hover:bg-accent"
                    title="Copy link"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M6.5 10.5L3.75 10.5C2.51 10.5 1.5 9.49 1.5 8.25V8.25C1.5 7.01 2.51 6 3.75 6L6.5 6M9.5 6L12.25 6C13.49 6 14.5 7.01 14.5 8.25V8.25C14.5 9.49 13.49 10.5 12.25 10.5L9.5 10.5M5.5 8.25H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Copy link
                  </button>
                  <a
                    href={publishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-full cursor-pointer hover:bg-green-100 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Published
                  </a>
                </>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full cursor-pointer transition-colors",
                    "border border-border text-foreground hover:bg-accent",
                    "disabled:opacity-50 disabled:pointer-events-none"
                  )}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v9M4.5 5.5L8 2l3.5 3.5M3 11v2h10v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {publishing ? "Publishing..." : "Publish"}
                </button>
              )}
              {publishError && (
                <span className="text-xs text-destructive">{publishError}</span>
              )}
            </div>
          )}
        </div>
        {!isComplete && !isFailed && (
          <ProgressBar value={progress} />
        )}
      </div>

      {/* Main content: 2-column layout */}
      <div className="flex flex-1 min-h-0">
        {/* Middle column: Reasoning */}
        <div className="flex-1 border-r border-border overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted shrink-0">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 6.5a2 2 0 013.5 1.5c0 1-1.5 1.5-1.5 1.5M8 11.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <h2 className="text-sm font-medium text-muted uppercase tracking-wider">Reasoning</h2>
            </div>

            {reasoning ? (
              <div className="prose prose-sm max-w-none">
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-mono bg-accent/50 rounded-[var(--radius-md)] p-4 border border-border">
                  {reasoning}
                </div>
              </div>
            ) : status === "reasoning" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: "pulse-dot 1.4s ease-in-out infinite" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: "pulse-dot 1.4s ease-in-out 0.2s infinite" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: "pulse-dot 1.4s ease-in-out 0.4s infinite" }} />
                  </div>
                  Analyzing your query...
                </div>
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            ) : status === "queued" ? (
              <p className="text-sm text-muted">Waiting to start...</p>
            ) : null}
          </div>
        </div>

        {/* Right column: HTML Preview / Answer */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted shrink-0">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 6h6M5 8h4M5 10h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              <h2 className="text-sm font-medium text-muted uppercase tracking-wider">
                {reportTitle || "Report"}
              </h2>
            </div>

            {htmlReport ? (
              <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden bg-white shadow-sm">
                <iframe
                  srcDoc={htmlReport}
                  title={reportTitle || "Report"}
                  className="w-full border-0"
                  style={{ height: "calc(100vh - 200px)", minHeight: "600px" }}
                  sandbox="allow-scripts"
                />
              </div>
            ) : status === "generating" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: "pulse-dot 1.4s ease-in-out infinite" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: "pulse-dot 1.4s ease-in-out 0.2s infinite" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: "pulse-dot 1.4s ease-in-out 0.4s infinite" }} />
                  </div>
                  Generating report...
                </div>
                <div className="skeleton h-48 w-full rounded-[var(--radius-lg)]" />
              </div>
            ) : isComplete && !htmlReport ? (
              <p className="text-sm text-muted">No report generated.</p>
            ) : isFailed ? (
              <div className="rounded-[var(--radius-md)] border border-destructive/30 bg-red-50 p-4">
                <p className="text-sm text-destructive">
                  {jobData?.error || "An error occurred during processing."}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">Report will appear here once reasoning is complete.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
