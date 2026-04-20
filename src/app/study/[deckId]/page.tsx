"use client";

import { createClient } from "@/lib/supabase/client";
import { sm2, isDue, NEW_CARD_DEFAULTS } from "@/lib/sm2";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

function ImageUploadField({
  preview,
  onSelect,
  onRemove,
  disabled,
}: {
  preview: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="mb-2">
      <label className="block text-xs font-medium text-gray-500 mb-1">
        Front image (optional)
      </label>
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Card front"
            className="max-h-32 rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          + Add image
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

interface Card {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  front_image_url?: string | null;
  repetitions: number;
  ease_factor: number;
  interval: number;
  next_review: string;
  created_at: string;
  deck_name?: string;
}

type Tab = "study" | "cards";

const QUALITY_BUTTONS = [
  { quality: 1, label: "Again", color: "bg-red-500 hover:bg-red-600" },
  { quality: 3, label: "Hard", color: "bg-amber-500 hover:bg-amber-600" },
  { quality: 4, label: "Good", color: "bg-emerald-500 hover:bg-emerald-600" },
  { quality: 5, label: "Easy", color: "bg-blue-500 hover:bg-blue-600" },
];

export default function StudyPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const deckId = params.deckId as string;

  const isAllMode = deckId === "all";
  const [deckName, setDeckName] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("study");

  // Card editor state
  const [showAddCard, setShowAddCard] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");

  // Image upload state
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Study-tab inline editing state
  const [editingStudyCard, setEditingStudyCard] = useState(false);
  const [studyEditFront, setStudyEditFront] = useState("");
  const [studyEditBack, setStudyEditBack] = useState("");
  const [studyEditImageFile, setStudyEditImageFile] = useState<File | null>(null);
  const [studyEditImagePreview, setStudyEditImagePreview] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (isAllMode) {
      setDeckName("All Decks");

      // Fetch all decks for name lookup
      const { data: allDecks } = await supabase
        .from("decks")
        .select("id, name");
      const deckMap = new Map(
        (allDecks ?? []).map((d) => [d.id, d.name])
      );

      // Fetch all cards across all decks
      const { data: allCards } = await supabase
        .from("cards")
        .select("*")
        .order("created_at", { ascending: true });

      if (allCards) {
        const enriched = allCards.map((c) => ({
          ...c,
          deck_name: deckMap.get(c.deck_id) ?? "Unknown",
        }));
        setCards(enriched);
        const due = enriched.filter((c) => isDue(c.next_review));
        due.sort(() => Math.random() - 0.5);
        setDueCards(due);
      }
    } else {
      const { data: deck } = await supabase
        .from("decks")
        .select("name")
        .eq("id", deckId)
        .single();

      if (deck) setDeckName(deck.name);

      const { data: allCards } = await supabase
        .from("cards")
        .select("*")
        .eq("deck_id", deckId)
        .order("created_at", { ascending: true });

      if (allCards) {
        setCards(allCards);
        const due = allCards.filter((c) => isDue(c.next_review));
        due.sort(() => Math.random() - 0.5);
        setDueCards(due);
      }
    }
    setLoading(false);
  }, [supabase, deckId, isAllMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentCard = dueCards[currentIndex];

  // Upload image to Supabase Storage and return public URL
  const uploadImage = async (file: File): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("card-images").upload(path, file);
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data } = supabase.storage.from("card-images").getPublicUrl(path);
    return data.publicUrl;
  };

  // Handle image file selection and generate preview
  const handleImageSelect = (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    if (!file) {
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRating = async (quality: number) => {
    if (!currentCard) return;

    const result = sm2(
      quality,
      currentCard.repetitions,
      currentCard.ease_factor,
      currentCard.interval
    );

    await supabase
      .from("cards")
      .update({
        repetitions: result.repetitions,
        ease_factor: result.ease_factor,
        interval: result.interval,
        next_review: result.next_review,
      })
      .eq("id", currentCard.id);

    setFlipped(false);

    // Remove reviewed card from due list
    const remaining = dueCards.filter((_, i) => i !== currentIndex);

    // If quality < 3, put the card back at the end
    if (quality < 3) {
      remaining.push({ ...currentCard, ...result });
    }

    setDueCards(remaining);
    if (currentIndex >= remaining.length) {
      setCurrentIndex(Math.max(0, remaining.length - 1));
    }
  };

  const addCard = async () => {
    if ((!newFront.trim() && !newImageFile) || !newBack.trim()) return;
    setUploading(true);
    let imageUrl: string | null = null;
    if (newImageFile) {
      imageUrl = await uploadImage(newImageFile);
    }
    await supabase.from("cards").insert({
      deck_id: deckId,
      front: newFront.trim(),
      back: newBack.trim(),
      front_image_url: imageUrl,
      ...NEW_CARD_DEFAULTS,
      next_review: new Date().toISOString(),
    });
    setNewFront("");
    setNewBack("");
    setNewImageFile(null);
    setNewImagePreview(null);
    setShowAddCard(false);
    setUploading(false);
    fetchData();
  };

  const updateCard = async (id: string) => {
    setUploading(true);
    let imageUrl: string | null | undefined = undefined;
    if (editImageFile) {
      imageUrl = await uploadImage(editImageFile);
    }
    const updateData: Record<string, unknown> = {
      front: editFront.trim(),
      back: editBack.trim(),
    };
    if (imageUrl !== undefined) {
      updateData.front_image_url = imageUrl;
    }
    await supabase.from("cards").update(updateData).eq("id", id);
    setEditingCard(null);
    setEditImageFile(null);
    setEditImagePreview(null);
    setUploading(false);
    fetchData();
  };

  const deleteCard = async (id: string) => {
    if (!confirm("Delete this card?")) return;
    await supabase.from("cards").delete().eq("id", id);
    fetchData();
  };

  const deleteStudyCard = async () => {
    if (!currentCard) return;
    if (!confirm("Delete this card?")) return;
    await supabase.from("cards").delete().eq("id", currentCard.id);
    // Remove from both lists
    const remainingDue = dueCards.filter((_, i) => i !== currentIndex);
    setDueCards(remainingDue);
    setCards((prev) => prev.filter((c) => c.id !== currentCard.id));
    if (currentIndex >= remainingDue.length) {
      setCurrentIndex(Math.max(0, remainingDue.length - 1));
    }
    setFlipped(false);
  };

  const startEditStudyCard = () => {
    if (!currentCard) return;
    setStudyEditFront(currentCard.front);
    setStudyEditBack(currentCard.back);
    setStudyEditImageFile(null);
    setStudyEditImagePreview(currentCard.front_image_url || null);
    setEditingStudyCard(true);
  };

  const saveStudyCard = async () => {
    if (!currentCard) return;
    const front = studyEditFront.trim();
    const back = studyEditBack.trim();
    if ((!front && !studyEditImagePreview && !studyEditImageFile) || !back) return;
    setUploading(true);
    let imageUrl: string | null | undefined = undefined;
    if (studyEditImageFile) {
      imageUrl = await uploadImage(studyEditImageFile);
    } else if (!studyEditImagePreview && currentCard.front_image_url) {
      // Image was removed
      imageUrl = null;
    }
    const updateData: Record<string, unknown> = { front, back };
    if (imageUrl !== undefined) {
      updateData.front_image_url = imageUrl;
    }
    await supabase
      .from("cards")
      .update(updateData)
      .eq("id", currentCard.id);
    const newImageUrlValue = imageUrl !== undefined ? imageUrl : currentCard.front_image_url;
    setDueCards((prev) =>
      prev.map((c) => (c.id === currentCard.id ? { ...c, front, back, front_image_url: newImageUrlValue } : c))
    );
    setCards((prev) =>
      prev.map((c) => (c.id === currentCard.id ? { ...c, front, back, front_image_url: newImageUrlValue } : c))
    );
    setEditingStudyCard(false);
    setStudyEditImageFile(null);
    setStudyEditImagePreview(null);
    setUploading(false);
    setFlipped(false);
  };

  const resetCard = async (id: string) => {
    await supabase
      .from("cards")
      .update({
        ...NEW_CARD_DEFAULTS,
        next_review: new Date().toISOString(),
      })
      .eq("id", id);
    fetchData();
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
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push("/")}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back
            </button>
            <h1 className="font-bold text-gray-900 truncate mx-4">
              {deckName}
            </h1>
            <div className="text-sm text-gray-400">
              {dueCards.length} due
            </div>
          </div>
          {/* Tabs — hide Cards tab in "all" mode since card management requires a specific deck */}
          {!isAllMode && (
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTab("study")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  tab === "study"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Study
              </button>
              <button
                onClick={() => setTab("cards")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  tab === "cards"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Cards ({cards.length})
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {tab === "study" ? (
          /* ==================== STUDY TAB ==================== */
          dueCards.length === 0 ? (
            <div className="text-center py-16">
              {cards.length === 0 ? (
                <>
                  <p className="text-4xl mb-4">📝</p>
                  <p className="text-gray-500 mb-4">
                    No cards in this deck yet.
                  </p>
                  <button
                    onClick={() => {
                      setTab("cards");
                      setShowAddCard(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                  >
                    Add your first card
                  </button>
                </>
              ) : (
                <>
                  <p className="text-4xl mb-4">🎉</p>
                  <p className="text-gray-700 font-medium mb-2">
                    All caught up!
                  </p>
                  <p className="text-gray-500 text-sm">
                    No cards are due for review right now. Come back later!
                  </p>
                </>
              )}
            </div>
          ) : (
            <div>
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>
                    {dueCards.length} remaining
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((cards.filter((c) => isDue(c.next_review)).length -
                          dueCards.length) /
                          Math.max(
                            1,
                            cards.filter((c) => isDue(c.next_review)).length
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Flashcard */}
              {currentCard && (
                editingStudyCard ? (
                  /* Inline edit mode */
                  <div className="bg-white rounded-2xl shadow-lg border border-indigo-200 p-6">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">
                      Edit Card
                    </p>
                    <ImageUploadField
                      preview={studyEditImagePreview}
                      onSelect={(file) => handleImageSelect(file, setStudyEditImageFile, setStudyEditImagePreview)}
                      onRemove={() => { setStudyEditImageFile(null); setStudyEditImagePreview(null); }}
                      disabled={uploading}
                    />
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Front (question)
                    </label>
                    <textarea
                      autoFocus
                      value={studyEditFront}
                      onChange={(e) => setStudyEditFront(e.target.value)}
                      rows={3}
                      className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    />
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Back (answer)
                    </label>
                    <textarea
                      value={studyEditBack}
                      onChange={(e) => setStudyEditBack(e.target.value)}
                      rows={3}
                      className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveStudyCard}
                        disabled={uploading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
                      >
                        {uploading ? "Uploading…" : "Save"}
                      </button>
                      <button
                        onClick={() => { setEditingStudyCard(false); setStudyEditImageFile(null); setStudyEditImagePreview(null); }}
                        className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Card action toolbar */}
                    <div className="flex justify-end gap-1 mb-2">
                      <button
                        onClick={startEditStudyCard}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-white/80"
                        title="Edit card"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={deleteStudyCard}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white/80"
                        title="Delete card"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    <div className="flip-card w-full" style={{ minHeight: 280 }}>
                      <div
                        className={`flip-card-inner relative w-full cursor-pointer ${
                          flipped ? "flipped" : ""
                        }`}
                        onClick={() => setFlipped(!flipped)}
                        style={{ minHeight: 280 }}
                      >
                        {/* Front */}
                        <div className="flip-card-front absolute inset-0 bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col items-center justify-center overflow-hidden">
                          {isAllMode && currentCard.deck_name && (
                            <span className="absolute top-4 left-4 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                              {currentCard.deck_name}
                            </span>
                          )}
                          <p className="text-xs uppercase tracking-wider text-gray-400 mb-4">
                            Question
                          </p>
                          {currentCard.front_image_url && (
                            <img
                              src={currentCard.front_image_url}
                              alt="Card front"
                              className="max-h-36 rounded-lg mb-3 object-contain"
                            />
                          )}
                          {currentCard.front && (
                            <p className="text-xl text-gray-900 text-center whitespace-pre-wrap">
                              {currentCard.front}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-6">
                            Tap to reveal
                          </p>
                        </div>
                        {/* Back */}
                        <div className="flip-card-back absolute inset-0 bg-white rounded-2xl shadow-lg border border-indigo-100 p-8 flex flex-col items-center justify-center">
                          {isAllMode && currentCard.deck_name && (
                            <span className="absolute top-4 left-4 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                              {currentCard.deck_name}
                            </span>
                          )}
                          <p className="text-xs uppercase tracking-wider text-indigo-400 mb-4">
                            Answer
                          </p>
                          <p className="text-xl text-gray-900 text-center whitespace-pre-wrap">
                            {currentCard.back}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )
              )}

              {/* Rating buttons — only show when flipped and not editing */}
              {flipped && !editingStudyCard && (
                <div className="mt-6 grid grid-cols-4 gap-2">
                  {QUALITY_BUTTONS.map(({ quality, label, color }) => (
                    <button
                      key={quality}
                      onClick={() => handleRating(quality)}
                      className={`${color} text-white py-3 rounded-xl font-medium text-sm transition-colors`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          /* ==================== CARDS TAB ==================== */
          <div>
            {/* Add card form */}
            {showAddCard ? (
              <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-indigo-200">
                <ImageUploadField
                  preview={newImagePreview}
                  onSelect={(file) => handleImageSelect(file, setNewImageFile, setNewImagePreview)}
                  onRemove={() => { setNewImageFile(null); setNewImagePreview(null); }}
                  disabled={uploading}
                />
                <textarea
                  autoFocus
                  placeholder={newImagePreview ? "Caption / question (optional with image)" : "Front (question)"}
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  rows={2}
                  className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
                <textarea
                  placeholder="Back (answer)"
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  rows={2}
                  className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addCard}
                    disabled={uploading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
                  >
                    {uploading ? "Uploading…" : "Add Card"}
                  </button>
                  <button
                    onClick={() => { setShowAddCard(false); setNewImageFile(null); setNewImagePreview(null); }}
                    className="px-4 py-2 text-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddCard(true)}
                className="mb-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors font-medium"
              >
                + Add Card
              </button>
            )}

            {/* Card list */}
            {cards.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No cards yet. Add some above!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                  >
                    {editingCard === card.id ? (
                      <>
                        <ImageUploadField
                          preview={editImagePreview}
                          onSelect={(file) => handleImageSelect(file, setEditImageFile, setEditImagePreview)}
                          onRemove={() => { setEditImageFile(null); setEditImagePreview(null); }}
                          disabled={uploading}
                        />
                        <textarea
                          autoFocus
                          value={editFront}
                          onChange={(e) => setEditFront(e.target.value)}
                          rows={2}
                          className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none text-sm"
                        />
                        <textarea
                          value={editBack}
                          onChange={(e) => setEditBack(e.target.value)}
                          rows={2}
                          className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateCard(card.id)}
                            disabled={uploading}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50"
                          >
                            {uploading ? "Uploading…" : "Save"}
                          </button>
                          <button
                            onClick={() => { setEditingCard(null); setEditImageFile(null); setEditImagePreview(null); }}
                            className="px-3 py-1.5 text-gray-600 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {card.front_image_url && (
                            <img
                              src={card.front_image_url}
                              alt="Card front"
                              className="max-h-16 rounded mb-1"
                            />
                          )}
                          <p className="text-sm font-medium text-gray-900">
                            {card.front}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {card.back}
                          </p>
                          <div className="flex gap-3 mt-2 text-xs text-gray-400">
                            <span>
                              {isDue(card.next_review)
                                ? "Due now"
                                : `Next: ${new Date(
                                    card.next_review
                                  ).toLocaleDateString()}`}
                            </span>
                            <span>
                              Ease: {card.ease_factor.toFixed(2)}
                            </span>
                            <span>
                              Interval: {card.interval}d
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingCard(card.id);
                              setEditFront(card.front);
                              setEditBack(card.back);
                              setEditImageFile(null);
                              setEditImagePreview(card.front_image_url || null);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => resetCard(card.id)}
                            className="p-1.5 text-gray-400 hover:text-amber-500"
                            title="Reset progress"
                          >
                            🔄
                          </button>
                          <button
                            onClick={() => deleteCard(card.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500"
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
          </div>
        )}
      </main>
    </div>
  );
}
