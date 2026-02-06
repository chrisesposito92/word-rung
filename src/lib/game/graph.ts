import { WORD_LENGTH } from '@/lib/game/types';

export type WordGraph = Map<string, string[]>;

export function differsByOneLetter(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let differences = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      differences += 1;
      if (differences > 1) {
        return false;
      }
    }
  }

  return differences === 1;
}

export function buildWordGraph(words: readonly string[]): WordGraph {
  const graph: WordGraph = new Map();
  const patternMap = new Map<string, string[]>();

  for (const word of words) {
    if (!graph.has(word)) {
      graph.set(word, []);
    }

    for (let index = 0; index < WORD_LENGTH; index += 1) {
      const pattern = `${word.slice(0, index)}*${word.slice(index + 1)}`;
      const bucket = patternMap.get(pattern);
      if (bucket) {
        bucket.push(word);
      } else {
        patternMap.set(pattern, [word]);
      }
    }
  }

  for (const bucket of patternMap.values()) {
    for (const word of bucket) {
      const neighbors = graph.get(word);
      if (!neighbors) {
        continue;
      }

      for (const candidate of bucket) {
        if (candidate !== word && !neighbors.includes(candidate)) {
          neighbors.push(candidate);
        }
      }
    }
  }

  for (const [word, neighbors] of graph.entries()) {
    graph.set(word, neighbors.sort());
  }

  return graph;
}

export function shortestPath(
  graph: WordGraph,
  start: string,
  end: string,
  maxDepth = 10,
): string[] | null {
  if (!graph.has(start) || !graph.has(end)) {
    return null;
  }

  if (start === end) {
    return [start];
  }

  const queue: Array<{ word: string; depth: number }> = [{ word: start, depth: 0 }];
  const parent = new Map<string, string | null>([[start, null]]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    if (current.depth >= maxDepth) {
      continue;
    }

    const neighbors = graph.get(current.word) ?? [];
    for (const nextWord of neighbors) {
      if (parent.has(nextWord)) {
        continue;
      }

      parent.set(nextWord, current.word);
      if (nextWord === end) {
        const path: string[] = [end];
        let cursor: string | null = current.word;
        while (cursor) {
          path.push(cursor);
          cursor = parent.get(cursor) ?? null;
        }
        return path.reverse();
      }

      queue.push({ word: nextWord, depth: current.depth + 1 });
    }
  }

  return null;
}

export function distancesFrom(graph: WordGraph, start: string, maxDepth: number): Map<string, number> {
  const distances = new Map<string, number>();
  if (!graph.has(start)) {
    return distances;
  }

  const queue: string[] = [start];
  distances.set(start, 0);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    const currentDepth = distances.get(current) ?? 0;
    if (currentDepth >= maxDepth) {
      continue;
    }

    const neighbors = graph.get(current) ?? [];
    for (const neighbor of neighbors) {
      if (distances.has(neighbor)) {
        continue;
      }

      distances.set(neighbor, currentDepth + 1);
      queue.push(neighbor);
    }
  }

  return distances;
}
