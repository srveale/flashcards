import { createServerSupabaseClient } from "@/lib/supabase/server";
import { chunkByParagraphs } from "@/lib/chunker";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CHUNK_TARGET_WORDS = 2000;

// How many chunks to process in parallel at once
const CONCURRENCY_LIMIT = 3;

interface GeneratedCard {
  front: string;
  back: string;
}

interface FirstChunkResult {
  deck_name: string;
  deck_description: string;
  cards: GeneratedCard[];
  is_existing_deck: boolean;
}

interface SubsequentChunkResult {
  cards: GeneratedCard[];
}

// ─── Prompt builders ─────────────────────────────────────────────

function buildFirstChunkSystemPrompt(deckList: string): string {
  return `You are a flashcard generator. Given some content, you create high-quality flashcards for spaced-repetition study.

Rules for card creation:
- Create concise, focused cards — one concept per card
- Front should be a clear question or prompt
- Back should be a precise, memorable answer
- Avoid yes/no questions; prefer questions that test understanding
- Use cloze-deletion style when appropriate (e.g., "The capital of France is ___")
- Generate between 5 and 20 cards depending on content density

You must also decide which deck these cards belong in.

The user's existing decks:
${deckList || "(no existing decks)"}

If the content clearly belongs in one of the existing decks, use that exact deck name. Otherwise, create a new descriptive deck name.

Respond with ONLY valid JSON in this exact format (no markdown fencing):
{
  "deck_name": "Exact existing deck name or a new descriptive name",
  "deck_description": "A short description of what this deck covers",
  "is_existing_deck": true or false,
  "cards": [
    { "front": "Question or prompt", "back": "Answer" }
  ]
}`;
}

function buildSubsequentChunkSystemPrompt(deckName: string): string {
  return `You are a flashcard generator. Given some content, you create high-quality flashcards for spaced-repetition study.

Rules for card creation:
- Create concise, focused cards — one concept per card
- Front should be a clear question or prompt
- Back should be a precise, memorable answer
- Avoid yes/no questions; prefer questions that test understanding
- Use cloze-deletion style when appropriate (e.g., "The capital of France is ___")
- Generate between 5 and 20 cards depending on content density, unless otherwise specified

These cards will be added to the deck: "${deckName}"

Respond with ONLY valid JSON in this exact format (no markdown fencing):
{
  "cards": [
    { "front": "Question or prompt", "back": "Answer" }
  ]
}`;
}

function buildUserMessage(chunkContent: string, instructions?: string): string {
  if (instructions) {
    return `Generate flashcards from this content:\n\n${chunkContent}\n\nAdditional instructions for how to generate the cards:\n${instructions}`;
  }
  return `Generate flashcards from this content:\n\n${chunkContent}`;
}

// ─── API call helpers ────────────────────────────────────────────

async function generateFirstChunk(
  content: string,
  deckList: string,
  instructions?: string
): Promise<FirstChunkResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: buildFirstChunkSystemPrompt(deckList),
    messages: [{ role: "user", content: buildUserMessage(content, instructions) }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(text);
}

async function generateSubsequentChunk(
  content: string,
  deckName: string,
  instructions?: string
): Promise<SubsequentChunkResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: buildSubsequentChunkSystemPrompt(deckName),
    messages: [{ role: "user", content: buildUserMessage(content, instructions) }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(text);
}

/**
 * Process an array of items with a concurrency limit.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─── Main route handler ──────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, instructions } = await request.json();
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Fetch user's existing decks
    const { data: existingDecks } = await supabase
      .from("decks")
      .select("id, name, description")
      .eq("user_id", user.id);

    const deckList = (existingDecks ?? [])
      .map((d) => `- "${d.name}" (${d.description || "no description"})`)
      .join("\n");

    // Split content into chunks
    const chunks = chunkByParagraphs(content.trim(), CHUNK_TARGET_WORDS);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No content to process" },
        { status: 400 }
      );
    }

    const totalChunks = chunks.length;
    const allCards: GeneratedCard[] = [];

    // ── First chunk: determines the deck ──
    let firstResult: FirstChunkResult;
    try {
      firstResult = await generateFirstChunk(chunks[0], deckList, instructions);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response for the first chunk. Please try again." },
        { status: 500 }
      );
    }

    if (!firstResult.deck_name || !Array.isArray(firstResult.cards)) {
      return NextResponse.json(
        { error: "AI returned an invalid response structure. Please try again." },
        { status: 500 }
      );
    }

    allCards.push(...firstResult.cards);

    // ── Remaining chunks: run concurrently, cards-only ──
    if (chunks.length > 1) {
      const remainingChunks = chunks.slice(1);
      const results = await mapWithConcurrency(
        remainingChunks,
        async (chunk) => {
          try {
            return await generateSubsequentChunk(chunk, firstResult.deck_name, instructions);
          } catch {
            // If a single chunk fails, return empty cards rather than failing everything
            return { cards: [] };
          }
        },
        CONCURRENCY_LIMIT
      );

      for (const r of results) {
        if (Array.isArray(r.cards)) {
          allCards.push(...r.cards);
        }
      }
    }

    // ── Resolve deck ──
    let deckId: string;

    if (firstResult.is_existing_deck) {
      const match = (existingDecks ?? []).find(
        (d) => d.name.toLowerCase() === firstResult.deck_name.toLowerCase()
      );

      if (match) {
        deckId = match.id;
      } else {
        const { data: newDeck, error: deckError } = await supabase
          .from("decks")
          .insert({
            name: firstResult.deck_name,
            description: firstResult.deck_description,
            user_id: user.id,
          })
          .select("id")
          .single();

        if (deckError || !newDeck) {
          return NextResponse.json(
            { error: "Failed to create deck" },
            { status: 500 }
          );
        }
        deckId = newDeck.id;
      }
    } else {
      const { data: newDeck, error: deckError } = await supabase
        .from("decks")
        .insert({
          name: firstResult.deck_name,
          description: firstResult.deck_description,
          user_id: user.id,
        })
        .select("id")
        .single();

      if (deckError || !newDeck) {
        return NextResponse.json(
          { error: "Failed to create deck" },
          { status: 500 }
        );
      }
      deckId = newDeck.id;
    }

    // ── Insert all cards ──
    const now = new Date().toISOString();
    const cardsToInsert = allCards.map((card) => ({
      deck_id: deckId,
      front: card.front,
      back: card.back,
      repetitions: 0,
      ease_factor: 2.5,
      interval: 0,
      next_review: now,
    }));

    const { error: cardsError } = await supabase
      .from("cards")
      .insert(cardsToInsert);

    if (cardsError) {
      return NextResponse.json(
        { error: "Failed to insert cards" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deck_id: deckId,
      deck_name: firstResult.deck_name,
      is_existing_deck: firstResult.is_existing_deck,
      cards_created: allCards.length,
      chunks_processed: totalChunks,
    });
  } catch (error) {
    console.error("Generate cards error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
