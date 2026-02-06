import { words as popularWords } from 'popular-english-words';
import { readFileSync, writeFileSync } from 'node:fs';
import wordListPath from 'word-list';

const MAX_WORDS = 2400;
const blockedWords = new Set([
  'anal',
  'arse',
  'cunt',
  'dick',
  'fuck',
  'nazi',
  'piss',
  'porn',
  'shit',
  'slut',
  'whore',
]);

const canonicalDictionary = new Set(readFileSync(wordListPath, 'utf8').split('\n'));

const filteredWords = popularWords
  .getMostPopularLength(5000, 4)
  .filter((word) => /^[a-z]{4}$/.test(word))
  .filter((word) => canonicalDictionary.has(word))
  .filter((word) => !blockedWords.has(word))
  .slice(0, MAX_WORDS);

const output = `export const FOUR_LETTER_WORDS = ${JSON.stringify(filteredWords, null, 2)} as const;\n`;

writeFileSync('src/lib/game/word-list.ts', output);
console.log(`Generated src/lib/game/word-list.ts with ${filteredWords.length} words.`);
