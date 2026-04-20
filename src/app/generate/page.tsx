"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "generating" | "success" | "error";

interface GenerateResult {
  deck_id: string;
  deck_name: string;
  is_existing_deck: boolean;
  cards_created: number;
  chunks_processed: number;
}

export default function GeneratePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [instructions, setInstructions] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const chunkCount = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 2000));
  }, [content]);

  const handleGenerate = async () => {
    if (!content.trim()) return;

    setStatus("generating");
    setErrorMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/generate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), instructions: instructions.trim() || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong");
        return;
      }

      setResult(data);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  };

  const handleReset = () => {
    setContent("");
    setInstructions("");
    setStatus("idle");
    setResult(null);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back
            </button>
            <h1 className="font-bold text-gray-900">Generate Flashcards</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {status === "success" && result ? (
          /* ==================== SUCCESS STATE ==================== */
          <div className="text-center py-12">
            <p className="text-4xl mb-4">✨</p>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {result.cards_created} cards created!
            </h2>
            <p className="text-gray-500 mb-8">
              {result.is_existing_deck
                ? `Added to your existing deck "${result.deck_name}"`
                : `Created new deck "${result.deck_name}"`}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => router.push(`/study/${result.deck_id}`)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
              >
                Study Now
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium border border-gray-200"
              >
                Generate More
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium border border-gray-200"
              >
                Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* ==================== INPUT STATE ==================== */
          <>
            <div className="mb-2">
              <p className="text-sm text-gray-500">
                Paste any text — notes, articles, textbook excerpts — and AI
                will generate flashcards from it.
              </p>
            </div>

            <textarea
              autoFocus
              placeholder="Paste your content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={status === "generating"}
              rows={14}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y text-sm leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed bg-white"
            />

            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {content.length > 0
                  ? `${content.trim().split(/\s+/).filter(Boolean).length} words`
                  : ""}
              </span>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extra instructions{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                placeholder='e.g. "Each card should correspond to one definition" or "Focus on key dates and events"'
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                disabled={status === "generating"}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y text-sm leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              />
            </div>

            {status === "error" && (
              <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
            )}

            <div className="mt-4">
              <button
                onClick={handleGenerate}
                disabled={!content.trim() || status === "generating"}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === "generating" ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {chunkCount > 1
                      ? `Generating flashcards (${chunkCount} sections)...`
                      : "Generating flashcards..."}
                  </>
                ) : chunkCount > 1 ? (
                  `Generate Flashcards (${chunkCount} sections)`
                ) : (
                  "Generate Flashcards"
                )}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
