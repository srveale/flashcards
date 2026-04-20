/**
 * Splits text into chunks of roughly `targetWords` words each,
 * breaking only on paragraph boundaries (double newlines).
 *
 * If a single paragraph exceeds `targetWords`, it gets its own chunk
 * rather than being split mid-sentence.
 */
export function chunkByParagraphs(
  text: string,
  targetWords: number = 2000
): string[] {
  // Split on one or more blank lines
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  if (paragraphs.length === 0) return [];

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.trim().split(/\s+/).length;

    // If adding this paragraph would exceed the target and we already
    // have content in the current chunk, finalize it first
    if (currentWordCount + paragraphWords > targetWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join("\n\n"));
      currentChunk = [];
      currentWordCount = 0;
    }

    currentChunk.push(paragraph.trim());
    currentWordCount += paragraphWords;
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n\n"));
  }

  return chunks;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
