"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { StepDataMap } from "@/types/job";

interface TaskSSEState {
  status: string | null;
  progress: number;
  message: string;
  stepData: StepDataMap;
  result: {
    html_report: string | null;
    report_title: string | null;
    reasoning: string | null;
  } | null;
  reasoningChunks: string;
  htmlChunks: string;
  connected: boolean;
}

const TERMINAL_STATUSES = ["completed", "failed"];

export function useTaskSSE(jobId: string | null) {
  const [state, setState] = useState<TaskSSEState>({
    status: null,
    progress: 0,
    message: "",
    stepData: {},
    result: null,
    reasoningChunks: "",
    htmlChunks: "",
    connected: false,
  });

  const esRef = useRef<EventSource | null>(null);

  const close = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setState((s) => ({ ...s, connected: false }));
  }, []);

  useEffect(() => {
    if (!jobId) return;

    const es = new EventSource(`/api/jobs/${jobId}/stream`);
    esRef.current = es;

    es.onopen = () => {
      setState((s) => ({ ...s, connected: true }));
    };

    es.addEventListener("status", (e) => {
      const data = JSON.parse(e.data);
      setState((s) => ({
        ...s,
        status: data.status,
        progress: data.progress,
        message: data.message,
      }));
    });

    es.addEventListener("step_data", (e) => {
      const data = JSON.parse(e.data);
      setState((s) => ({
        ...s,
        stepData: {
          ...s.stepData,
          [data.step]: data.data,
        },
      }));
    });

    es.addEventListener("reasoning_chunk", (e) => {
      const data = JSON.parse(e.data);
      setState((s) => ({
        ...s,
        reasoningChunks: data.full_text,
      }));
    });

    es.addEventListener("html_chunk", (e) => {
      const data = JSON.parse(e.data);
      setState((s) => ({
        ...s,
        htmlChunks: data.full_html,
      }));
    });

    es.addEventListener("result", (e) => {
      const data = JSON.parse(e.data);
      setState((s) => ({
        ...s,
        result: data,
      }));
    });

    es.onerror = () => {
      setState((s) => {
        if (s.status && TERMINAL_STATUSES.includes(s.status)) {
          es.close();
          return { ...s, connected: false };
        }
        return s;
      });
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [jobId]);

  useEffect(() => {
    if (state.status && TERMINAL_STATUSES.includes(state.status)) {
      const timer = setTimeout(close, 500);
      return () => clearTimeout(timer);
    }
  }, [state.status, close]);

  return state;
}
