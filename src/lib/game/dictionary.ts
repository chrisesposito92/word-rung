import { FOUR_LETTER_WORDS } from '@/lib/game/word-list';

export const WORD_DICTIONARY = new Set<string>(FOUR_LETTER_WORDS);

export function isDictionaryWord(word: string): boolean {
  return WORD_DICTIONARY.has(word);
}

export function normalizeWord(rawWord: string): string {
  return rawWord.trim().toLowerCase();
}
