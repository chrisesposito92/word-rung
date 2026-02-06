# Word Rung Game Design

## Core idea
Word Rung is a daily 3-round word ladder puzzle.

Each round shows:
- a start word
- an end word
- a par (target minimum number of moves)

Players must transform the start into the end by changing one letter per move.

## Rules
1. Every bridge word must be exactly 4 letters.
2. Every bridge word must be in the game dictionary.
3. Adjacent words must differ by exactly one letter.
4. You cannot reuse words within a ladder.
5. Each ladder has a maximum move cap (`par + 4`).

## Difficulty model
Each daily puzzle has three ladders:
- Ladder 1: target par ~3
- Ladder 2: target par ~4
- Ladder 3: target par ~5

The generator creates shortest-path ladders from a curated four-letter dictionary.

## Scoring
Per ladder (if solved):
- Base: `300`
- Move penalty: `40 * moves_over_par`
- Hint penalty: `35 * hints_used`
- Time penalty: `min(80, floor(seconds / 12))`
- Minimum solved score: `50`

Puzzle bonuses:
- `+120` if all ladders are solved at par with no hints
- `+60` if all ladders are solved with no hints (but not all at par)

## Win condition
Players begin a timed run by clicking a start button, then can finish at any time.

- Solved ladders score normally.
- Unsolved ladders score `0`.
- Score is submitted to the daily leaderboard when the run is finished.

If all 3 ladders are solved, the run auto-finishes immediately.

## UI behavior
- Ladder cards remain hidden until the player explicitly starts the run.
- The game header includes a dark/light mode toggle.
- Theme preference is stored in browser local storage (`word-rung-theme`) for future visits.
