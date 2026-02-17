import { Hono } from "hono";
import { Env, Job, STEP_PROGRESS, STEP_MESSAGES } from "../types";
import { getJob, claimJob } from "../db/queries";
import { runPipelineSSE } from "../engine/pipeline";

const app = new Hono<{ Bindings: Env }>();

app.get("/jobs/:id", async (c) => {
  const job = await getJob(c.env.DB, c.req.param("id"));
  if (!job) {
    return c.json({ detail: "Job not found" }, 404);
  }

  const progress = {
    step: job.status,
    message: STEP_MESSAGES[job.status] ?? "",
    progress: STEP_PROGRESS[job.status] ?? 0,
  };

  const result =
    job.status === "completed"
      ? {
          html_report: job.html_report,
          report_title: job.report_title,
          reasoning: job.reasoning,
        }
      : null;

  return c.json({
    job_id: job.id,
    status: job.status,
    progress,
    result,
    error: job.error,
    query: job.query,
    skill_id: job.skill_id,
  });
});

app.get("/jobs/:id/stream", async (c) => {
  const jobId = c.req.param("id");
  const db = c.env.DB;

  const job = await getJob(db, jobId);
  if (!job) {
    return c.json({ detail: "Job not found" }, 404);
  }

  // Stale job recovery: if stuck in reasoning/generating for >5 min, reset
  if (job.status === "reasoning" || job.status === "generating") {
    const createdAt = new Date(job.created_at).getTime();
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    if (createdAt < fiveMinAgo) {
      // Reset to queued for re-processing
      await db
        .prepare("UPDATE jobs SET status = 'queued' WHERE id = ? AND status IN ('reasoning', 'generating')")
        .bind(jobId)
        .run();
      job.status = "queued";
    }
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const send = (event: string, data: Record<string, unknown>) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    writer.write(encoder.encode(payload)).catch(() => {});
  };

  // Handle different job states
  if (job.status === "completed" || job.status === "failed") {
    // Terminal state — send current state and close
    sendCurrentState(send, job);
    writer.close();
  } else if (job.status === "queued") {
    // Attempt to claim and run inline
    const claimed = await claimJob(db, jobId, "reasoning");
    if (claimed) {
      // We own this job — run pipeline inline
      send("status", {
        type: "status",
        status: "queued",
        progress: STEP_PROGRESS.queued,
        message: STEP_MESSAGES.queued,
      });

      // Re-fetch the job with updated status
      const freshJob = await getJob(db, jobId);
      if (freshJob) {
        runPipelineSSE(freshJob, c.env, db, send).finally(() => {
          writer.close();
        });
      } else {
        writer.close();
      }
    } else {
      // Another request claimed it — poll
      pollUntilDone(db, jobId, send, writer);
    }
  } else {
    // reasoning/generating — another request owns it, poll
    sendCurrentState(send, job);
    pollUntilDone(db, jobId, send, writer);
  }

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

function sendCurrentState(
  send: (event: string, data: Record<string, unknown>) => void,
  job: Job,
) {
  send("status", {
    type: "status",
    status: job.status,
    progress: STEP_PROGRESS[job.status] ?? 0,
    message: STEP_MESSAGES[job.status] ?? "",
  });

  if (job.reasoning) {
    send("step_data", {
      type: "step_data",
      step: "reasoning",
      data: { preview: job.reasoning },
    });
  }
  if (job.html_report) {
    send("step_data", {
      type: "step_data",
      step: "html_report",
      data: { html: job.html_report, title: job.report_title },
    });
  }

  if (job.status === "completed") {
    send("result", {
      html_report: job.html_report,
      report_title: job.report_title,
      reasoning: job.reasoning,
    });
  }
}

async function pollUntilDone(
  db: D1Database,
  jobId: string,
  send: (event: string, data: Record<string, unknown>) => void,
  writer: WritableStreamDefaultWriter<Uint8Array>,
) {
  let lastStatus = "";
  let polls = 0;
  const maxPolls = 150; // 5 min at 2s intervals

  const interval = setInterval(async () => {
    polls++;
    if (polls > maxPolls) {
      clearInterval(interval);
      send("timeout", {});
      writer.close();
      return;
    }

    try {
      const job = await getJob(db, jobId);
      if (!job) {
        clearInterval(interval);
        writer.close();
        return;
      }

      if (job.status !== lastStatus) {
        lastStatus = job.status;
        sendCurrentState(send, job);

        if (job.status === "completed" || job.status === "failed") {
          clearInterval(interval);
          writer.close();
        }
      }
    } catch {
      clearInterval(interval);
      writer.close();
    }
  }, 2000);
}

export default app;
