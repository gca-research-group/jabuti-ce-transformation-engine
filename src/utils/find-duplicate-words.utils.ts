/**
 * Finds duplicate words in a list of words.
 * @param words An array of words.
 * @returns An array of duplicate words.
 */
export function findDuplicateWords(words: string[]): string[] {
  const wordCountMap = new Map<string, number>();

  // Count occurrences of each word
  for (const word of words) {
    const count = wordCountMap.get(word) ?? 0;
    wordCountMap.set(word, count + 1);
  }

  // Find words with count greater than 1
  const duplicates = [];
  for (const [word, count] of wordCountMap.entries()) {
    if (count > 1) {
      duplicates.push(word);
    }
  }

  return duplicates;
}
