import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPublishedPage } from "@/lib/api/client";

export default function Published() {
  const { id: pageId } = useParams<{ id: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pageId) return;
    async function load() {
      try {
        const page = await fetchPublishedPage(pageId!);
        setHtml(page.html);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Page not found");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pageId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <a href="/" className="text-sm text-primary hover:underline">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html || ""}
      title="Published Report"
      className="w-full h-full border-0"
      sandbox="allow-scripts"
    />
  );
}
