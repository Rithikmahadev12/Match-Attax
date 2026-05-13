/**
 * Given raw OCR text from a Match Attax card, extract the player name
 * and search the API for a matching card.
 */
export async function matchCardFromText(rawText) {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2 && l.length < 40);

  // The player name is usually the longest line near the top
  // Filter out common non-name strings
  const skip = /^(attack|defense|defence|star|rating|topps|match attax|\d+)$/i;
  const candidates = lines.filter(l => !skip.test(l));

  // Try each candidate against the search API, return first hit
  for (const candidate of candidates.slice(0, 5)) {
    try {
      const res = await fetch(`/api/cards/search?q=${encodeURIComponent(candidate)}`);
      const cards = await res.json();
      if (cards.length > 0) return cards[0];
    } catch {
      // continue
    }
  }

  return null;
}

/**
 * Extract numeric stats directly from OCR text.
 * Useful as a fallback if the card isn't in the database.
 */
export function extractStatsFromText(rawText) {
  const numbers = rawText.match(/\b(\d{2,3})\b/g);
  if (!numbers || numbers.length < 3) return null;
  const vals = numbers.map(Number).filter(n => n >= 1 && n <= 100);
  if (vals.length < 3) return null;
  return { attack: vals[0], defense: vals[1], star: vals[2] };
}
