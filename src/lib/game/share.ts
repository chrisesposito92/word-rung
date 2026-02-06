import type { PuzzleScoreSummary } from '@/lib/game/types';

function ladderEmoji(points: number): string {
  if (points >= 280) {
    return '🟩';
  }
  if (points >= 220) {
    return '🟨';
  }
  if (points > 0) {
    return '🟧';
  }
  return '🟥';
}

export function buildShareText(dateKey: string, result: PuzzleScoreSummary): string {
  const row = result.ladders.map((ladder) => ladderEmoji(ladder.finalPoints)).join('');
  return [`Word Rung ${dateKey}`, `Score ${result.totalScore}`, row].join('\n');
}
