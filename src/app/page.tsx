"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Deck {
  id: string;
  name: string;
  description: string;
  created_at: string;
  due_count?: number;
  total_count?: number;
}

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [editingDeck, setEditingDeck] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [userName, setUserName] = useState("");

  const fetchDecks = useCallback(async () => {
    // Get decks
    const { data: deckData } = await supabase
      .from("decks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!deckData) return;

    // Get card counts and due counts for each deck
    const enriched = await Promise.all(
      deckData.map(async (deck) => {
        const { count: total } = await supabase
          .from("cards")
          .select("*", { count: "exact", head: true })
          .eq("deck_id", deck.id);

        const { count: due } = await supabase
          .from("cards")
          .select("*", { count: "exact", head: true })
          .eq("deck_id", deck.id)
          .lte("next_review", new Date().toISOString());

        return { ...deck, total_count: total ?? 0, due_count: due ?? 0 };
      })
    );

    setDecks(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(
          user.user_metadata?.full_name || user.email || "there"
        );
      }
    });
    fetchDecks();
  }, [fetchDecks, supabase.auth]);

  const createDeck = async () => {
    if (!newDeckName.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("decks").insert({
      name: newDeckName.trim(),
      description: newDeckDesc.trim(),
      user_id: user.id,
    });

    setNewDeckName("");
    setNewDeckDesc("");
    setShowNewDeck(false);
    fetchDecks();
  };

  const deleteDeck = async (id: string) => {
    if (!confirm("Delete this deck and all its cards?")) return;
    await supabase.from("decks").delete().eq("id", id);
    fetchDecks();
  };

  const updateDeck = async (id: string) => {
    await supabase
      .from("decks")
      .update({ name: editName.trim(), description: editDesc.trim() })
      .eq("id", id);
    setEditingDeck(null);
    fetchDecks();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <h1 className="text-xl font-bold text-gray-900">Flashcards</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline">
              {userName}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Summary */}
        {decks.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-600">
              <span className="font-semibold text-indigo-600">
                {decks.reduce((sum, d) => sum + (d.due_count ?? 0), 0)}
              </span>{" "}
              cards due for review across{" "}
              <span className="font-semibold">{decks.length}</span> deck
              {decks.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* New deck form */}
        {showNewDeck ? (
          <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-indigo-200">
            <input
              autoFocus
              placeholder="Deck name"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createDeck()}
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              placeholder="Description (optional)"
              value={newDeckDesc}
              onChange={(e) => setNewDeckDesc(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createDeck()}
              className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <div className="flex gap-2">
              <button
                onClick={createDeck}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewDeck(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewDeck(true)}
            className="mb-6 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors font-medium"
          >
            + New Deck
          </button>
        )}

        {/* Deck list */}
        {decks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-4">📚</p>
            <p>No decks yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {editingDeck === deck.id ? (
                  <div className="p-4">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateDeck(deck.id)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingDeck(null)}
                        className="px-3 py-1.5 text-gray-600 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {deck.name}
                      </h3>
                      {deck.description && (
                        <p className="text-sm text-gray-500 truncate">
                          {deck.description}
                        </p>
                      )}
                      <div className="flex gap-4 mt-1 text-sm">
                        <span className="text-gray-400">
                          {deck.total_count} card
                          {deck.total_count !== 1 ? "s" : ""}
                        </span>
                        {(deck.due_count ?? 0) > 0 && (
                          <span className="text-indigo-600 font-medium">
                            {deck.due_count} due
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() =>
                          router.push(`/study/${deck.id}`)
                        }
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                      >
                        Study
                      </button>
                      <button
                        onClick={() => {
                          setEditingDeck(deck.id);
                          setEditName(deck.name);
                          setEditDesc(deck.description);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteDeck(deck.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
