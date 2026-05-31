import { describe, expect, it } from 'vitest';
import { createGame, getRemainingTargets, getShotAccuracy, shootCell } from './gameState';
import { coordinateKey, placeTargets, targetsOverlap } from './placement';
import type { PlacedTarget } from './types';

const testTargets: PlacedTarget[] = [
  {
    id: 'test-line',
    name: 'Test Line FC',
    shortName: 'Line',
    length: 2,
    chant: 'Test target',
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ],
  },
];

describe('Battle Soccer game logic', () => {
  it('places targets without overlapping cells', () => {
    for (let run = 0; run < 25; run += 1) {
      const targets = placeTargets();
      const allCells = targets.flatMap((target) => target.cells.map(coordinateKey));

      expect(targetsOverlap(targets)).toBe(false);
      expect(new Set(allCells).size).toBe(allCells.length);
    }
  });

  it('updates shot state for hits and misses', () => {
    let state = createGame(4, testTargets);

    state = shootCell(state, { row: 0, col: 0 });
    expect(state.lastResult?.outcome).toBe('hit');
    expect(state.shots['0,0']).toBe('hit');
    expect(state.shotCount).toBe(1);

    state = shootCell(state, { row: 3, col: 3 });
    expect(state.lastResult?.outcome).toBe('miss');
    expect(state.shots['3,3']).toBe('miss');
    expect(state.shotCount).toBe(2);
  });

  it('does not double count repeated shots', () => {
    let state = createGame(4, testTargets);

    state = shootCell(state, { row: 0, col: 0 });
    state = shootCell(state, { row: 0, col: 0 });

    expect(state.lastResult?.outcome).toBe('repeat');
    expect(state.lastResult?.shotCounted).toBe(false);
    expect(state.shotCount).toBe(1);
  });

  it('calculates shot accuracy from counted hits and shots', () => {
    let state = createGame(4, testTargets);

    expect(getShotAccuracy(state)).toBeNull();

    state = shootCell(state, { row: 0, col: 0 });
    expect(getShotAccuracy(state)).toBe(100);

    state = shootCell(state, { row: 3, col: 3 });
    expect(getShotAccuracy(state)).toBe(50);
  });

  it('keeps repeated shots out of shot accuracy', () => {
    let state = createGame(4, testTargets);

    state = shootCell(state, { row: 0, col: 0 });
    state = shootCell(state, { row: 3, col: 3 });
    state = shootCell(state, { row: 0, col: 0 });

    expect(state.shotCount).toBe(2);
    expect(getShotAccuracy(state)).toBe(50);
  });

  it('wins when all targets are cleared', () => {
    let state = createGame(4, testTargets);

    state = shootCell(state, { row: 0, col: 0 });
    expect(state.isWon).toBe(false);
    expect(getRemainingTargets(state)).toHaveLength(1);

    state = shootCell(state, { row: 0, col: 1 });
    expect(state.lastResult?.clearedTargetId).toBe('test-line');
    expect(state.lastResult?.won).toBe(true);
    expect(state.isWon).toBe(true);
    expect(getRemainingTargets(state)).toHaveLength(0);
  });
});
