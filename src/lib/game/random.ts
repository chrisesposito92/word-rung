export type SeededRandom = {
  next: () => number;
  int: (maxExclusive: number) => number;
  pick: <T>(items: readonly T[]) => T;
  shuffle: <T>(items: readonly T[]) => T[];
};

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeededRandom(seed: number): SeededRandom {
  const generator = mulberry32(seed);

  return {
    next: () => generator(),
    int: (maxExclusive) => Math.floor(generator() * maxExclusive),
    pick: (items) => {
      if (items.length === 0) {
        throw new Error('Cannot pick from an empty collection.');
      }
      return items[Math.floor(generator() * items.length)];
    },
    shuffle: (items) => {
      const clone = [...items];
      for (let i = clone.length - 1; i > 0; i -= 1) {
        const j = Math.floor(generator() * (i + 1));
        [clone[i], clone[j]] = [clone[j], clone[i]];
      }
      return clone;
    },
  };
}
