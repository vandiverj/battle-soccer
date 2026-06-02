import { describe, expect, it } from 'vitest';
import {
  createGame,
  getGameOutcome,
  getMatchStats,
  getMomentumLevel,
  getPlayerFormationDamage,
  getRemainingTargets,
  getShotAccuracy,
  getShotHistory,
  playHumanTurn,
  shootCell,
} from './gameState';
import { canPlaceTarget, coordinateKey, placeTargetAt, placeTargets, targetsOverlap } from './placement';
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
  it('starts new games with no current streak', () => {
    const state = createGame(4, testTargets, testTargets);

    expect(state.currentStreak).toBe(0);
    expect(state.settings.difficulty).toBe('derby');
  });

  it('starts new games with no computer shots', () => {
    const state = createGame(4, testTargets, testTargets);

    expect(state.playerShots).toEqual({});
    expect(state.computerShotCount).toBe(0);
    expect(state.lastComputerResult).toBeUndefined();
    expect(state.isLost).toBe(false);
  });

  it('reports the game outcome for playing, won, and lost states', () => {
    const state = createGame(4, testTargets, testTargets);

    expect(getGameOutcome(state)).toBe('playing');
    expect(getGameOutcome({ ...state, isWon: true })).toBe('won');
    expect(getGameOutcome({ ...state, isLost: true })).toBe('lost');
  });

  it('reports a win before a loss if both game-over flags are present', () => {
    const state = createGame(4, testTargets, testTargets);

    expect(getGameOutcome({ ...state, isWon: true, isLost: true })).toBe('won');
  });

  it('reports attack momentum from the current hit streak', () => {
    const state = createGame(4, testTargets, testTargets);

    expect(getMomentumLevel(state)).toBe('steady');
    expect(getMomentumLevel({ ...state, currentStreak: 1 })).toBe('pressing');
    expect(getMomentumLevel({ ...state, currentStreak: 3 })).toBe('surging');
  });

  it('places targets without overlapping cells', () => {
    for (let run = 0; run < 25; run += 1) {
      const targets = placeTargets();
      const allCells = targets.flatMap((target) => target.cells.map(coordinateKey));

      expect(targetsOverlap(targets)).toBe(false);
      expect(new Set(allCells).size).toBe(allCells.length);
    }
  });

  it('supports manual player formation placement with battleship-style sizes', () => {
    const firstPlacement = placeTargetAt(testTargets[0], { row: 0, col: 0 }, 'horizontal', [], 4);

    expect(firstPlacement?.cells).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
    expect(firstPlacement).not.toBeNull();
    expect(canPlaceTarget(testTargets[0], { row: 0, col: 1 }, 'vertical', [firstPlacement!], 4)).toBe(false);
    expect(placeTargetAt(testTargets[0], { row: 3, col: 3 }, 'horizontal', [], 4)).toBeNull();
  });

  it('starts new games with separate non-overlapping player formations', () => {
    const state = createGame();

    expect(state.playerFormations).toHaveLength(state.targets.length);
    expect(state.playerFormations).not.toBe(state.targets);
    expect(targetsOverlap(state.playerFormations)).toBe(false);
  });

  it('updates shot state for hits and misses', () => {
    let state = createGame(4, testTargets, testTargets);

    state = shootCell(state, { row: 0, col: 0 });
    expect(state.lastResult?.outcome).toBe('hit');
    expect(state.shots['0,0']).toBe('hit');
    expect(state.shotCount).toBe(1);
    expect(state.currentStreak).toBe(1);

    state = shootCell(state, { row: 3, col: 3 });
    expect(state.lastResult?.outcome).toBe('miss');
    expect(state.shots['3,3']).toBe('miss');
    expect(state.shotCount).toBe(2);
    expect(state.currentStreak).toBe(0);
  });

  it('does not double count repeated shots', () => {
    let state = createGame(4, testTargets, testTargets);

    state = shootCell(state, { row: 0, col: 0 });
    state = shootCell(state, { row: 0, col: 0 });

    expect(state.lastResult?.outcome).toBe('repeat');
    expect(state.lastResult?.shotCounted).toBe(false);
    expect(state.shotCount).toBe(1);
    expect(state.currentStreak).toBe(1);
  });

  it('does not use player formations for shot results or win state', () => {
    const playerOnlyFormation: PlacedTarget[] = [
      {
        ...testTargets[0],
        id: 'player-only',
        cells: [{ row: 3, col: 3 }],
      },
    ];
    let state = createGame(4, testTargets, playerOnlyFormation);

    state = shootCell(state, { row: 3, col: 3 });

    expect(state.lastResult?.outcome).toBe('miss');
    expect(state.shotCount).toBe(1);
    expect(state.currentStreak).toBe(0);
    expect(state.isWon).toBe(false);
    expect(getRemainingTargets(state)).toHaveLength(1);
  });

  it('preserves the current streak when repeating a missed shot', () => {
    let state = createGame(4, testTargets, testTargets);

    state = shootCell(state, { row: 3, col: 3 });
    expect(state.currentStreak).toBe(0);

    state = shootCell(state, { row: 0, col: 0 });
    state = shootCell(state, { row: 0, col: 1 });
    expect(state.currentStreak).toBe(2);

    state = shootCell(state, { row: 3, col: 3 });
    expect(state.lastResult?.outcome).toBe('repeat');
    expect(state.lastResult?.shotCounted).toBe(false);
    expect(state.shotCount).toBe(3);
    expect(state.currentStreak).toBe(2);
  });

  it('tracks consecutive hits and resets the current streak on a miss', () => {
    let state = createGame(4, testTargets, testTargets);

    state = shootCell(state, { row: 0, col: 0 });
    expect(state.currentStreak).toBe(1);

    state = shootCell(state, { row: 0, col: 1 });
    expect(state.currentStreak).toBe(2);

    state = shootCell(state, { row: 3, col: 3 });
    expect(state.currentStreak).toBe(0);
  });

  it('calculates shot accuracy from counted hits and shots', () => {
    let state = createGame(4, testTargets, testTargets);

    expect(getShotAccuracy(state)).toBeNull();

    state = shootCell(state, { row: 0, col: 0 });
    expect(getShotAccuracy(state)).toBe(100);

    state = shootCell(state, { row: 3, col: 3 });
    expect(getShotAccuracy(state)).toBe(50);
  });

  it('keeps repeated shots out of shot accuracy', () => {
    let state = createGame(4, testTargets, testTargets);

    state = shootCell(state, { row: 0, col: 0 });
    state = shootCell(state, { row: 3, col: 3 });
    state = shootCell(state, { row: 0, col: 0 });

    expect(state.shotCount).toBe(2);
    expect(getShotAccuracy(state)).toBe(50);
  });

  it('reports counted human shots in shot history order', () => {
    let state = createGame(4, testTargets, testTargets);

    state = shootCell(state, { row: 3, col: 3 });
    state = shootCell(state, { row: 0, col: 0 });
    state = shootCell(state, { row: 3, col: 3 });

    expect(getShotHistory(state, 'human')).toEqual([
      {
        key: 'human-3,3',
        coordinate: { row: 3, col: 3 },
        outcome: 'miss',
      },
      {
        key: 'human-0,0',
        coordinate: { row: 0, col: 0 },
        outcome: 'hit',
      },
    ]);
  });

  it('wins when all targets are cleared', () => {
    let state = createGame(4, testTargets, testTargets);

    state = shootCell(state, { row: 0, col: 0 });
    expect(state.isWon).toBe(false);
    expect(getRemainingTargets(state)).toHaveLength(1);

    state = shootCell(state, { row: 0, col: 1 });
    expect(state.lastResult?.clearedTargetId).toBe('test-line');
    expect(state.lastResult?.won).toBe(true);
    expect(state.isWon).toBe(true);
    expect(getRemainingTargets(state)).toHaveLength(0);
  });

  it('plays one computer shot after a valid non-winning human turn', () => {
    let state = createGame(4, testTargets, testTargets);

    state = playHumanTurn(state, { row: 3, col: 3 }, () => 0);

    expect(state.lastResult?.outcome).toBe('miss');
    expect(state.shotCount).toBe(1);
    expect(state.computerShotCount).toBe(1);
    expect(state.lastComputerResult).toEqual({
      outcome: 'hit',
      coordinate: { row: 0, col: 0 },
      shotCounted: true,
    });
    expect(state.playerShots['0,0']).toBe('hit');
  });

  it('reports computer shots in shot history order', () => {
    let state = createGame(4, testTargets, testTargets);

    state = playHumanTurn(state, { row: 3, col: 3 }, () => 0);
    state = playHumanTurn(state, { row: 3, col: 2 }, () => 0.99);

    expect(getShotHistory(state, 'computer')).toEqual([
      {
        key: 'computer-0,0',
        coordinate: { row: 0, col: 0 },
        outcome: 'hit',
      },
      {
        key: 'computer-3,3',
        coordinate: { row: 3, col: 3 },
        outcome: 'miss',
      },
    ]);
  });

  it('reports no player formation damage at the start of a game', () => {
    const state = createGame(4, testTargets, testTargets);

    expect(getPlayerFormationDamage(state)).toBe(0);
  });

  it('keeps computer misses out of player formation damage', () => {
    let state = createGame(4, testTargets, testTargets);

    state = playHumanTurn(state, { row: 3, col: 3 }, () => 0.99);

    expect(state.lastComputerResult?.outcome).toBe('miss');
    expect(getPlayerFormationDamage(state)).toBe(0);
  });

  it('calculates player formation damage from computer hits on occupied cells', () => {
    let state = createGame(4, testTargets, testTargets);

    state = playHumanTurn(state, { row: 3, col: 3 }, () => 0);

    expect(state.lastComputerResult?.outcome).toBe('hit');
    expect(getPlayerFormationDamage(state)).toBe(50);
  });

  it('summarizes match stats for human and computer shots', () => {
    let state = createGame(4, testTargets, testTargets);

    state = playHumanTurn(state, { row: 3, col: 3 }, () => 0);

    expect(getMatchStats(state)).toEqual({
      humanHits: 0,
      humanMisses: 1,
      computerHits: 1,
      computerMisses: 0,
      accuracy: 0,
      formationDamage: 50,
      turnsPlayed: 1,
    });
  });

  it('uses cup-final pressure to target cells adjacent to previous computer hits', () => {
    const state = {
      ...createGame(4, testTargets, testTargets, { difficulty: 'cup-final' }),
      playerShots: {
        '0,0': 'hit' as const,
      },
      computerShotCount: 1,
    };

    const randomValues = [0, 0.99];
    const nextState = playHumanTurn(state, { row: 3, col: 3 }, () => randomValues.shift() ?? 0);

    expect(nextState.lastComputerResult).toEqual({
      outcome: 'hit',
      coordinate: { row: 0, col: 1 },
      shotCounted: true,
    });
    expect(nextState.isLost).toBe(true);
  });

  it('keeps friendly computer shots random instead of hunting adjacent cells', () => {
    const state = {
      ...createGame(4, testTargets, testTargets, { difficulty: 'friendly' }),
      playerShots: {
        '0,0': 'hit' as const,
      },
      computerShotCount: 1,
    };

    const nextState = playHumanTurn(state, { row: 3, col: 3 }, () => 0.99);

    expect(nextState.lastComputerResult).toEqual({
      outcome: 'miss',
      coordinate: { row: 3, col: 3 },
      shotCounted: true,
    });
    expect(nextState.isLost).toBe(false);
  });

  it('does not play a computer shot after a repeated human shot', () => {
    let state = createGame(4, testTargets, testTargets);

    state = playHumanTurn(state, { row: 3, col: 3 }, () => 0);
    state = playHumanTurn(state, { row: 3, col: 3 }, () => 0.5);

    expect(state.lastResult?.outcome).toBe('repeat');
    expect(state.computerShotCount).toBe(1);
    expect(Object.keys(state.playerShots)).toEqual(['0,0']);
  });

  it('does not play a computer shot after a human winning shot', () => {
    let state = createGame(4, testTargets, testTargets);

    state = playHumanTurn(state, { row: 0, col: 0 }, () => 0);
    state = playHumanTurn(state, { row: 0, col: 1 }, () => 0.5);

    expect(state.isWon).toBe(true);
    expect(state.isLost).toBe(false);
    expect(state.lastResult?.won).toBe(true);
    expect(state.computerShotCount).toBe(1);
    expect(Object.keys(state.playerShots)).toEqual(['0,0']);
  });

  it('records computer misses against empty player-board cells', () => {
    let state = createGame(4, testTargets, testTargets);

    state = playHumanTurn(state, { row: 3, col: 3 }, () => 0.99);

    expect(state.lastComputerResult).toEqual({
      outcome: 'miss',
      coordinate: { row: 3, col: 3 },
      shotCounted: true,
    });
    expect(state.playerShots['3,3']).toBe('miss');
  });

  it('does not repeat computer shots while unshot player-board cells remain', () => {
    const longPlayerFormation: PlacedTarget[] = [
      {
        ...testTargets[0],
        length: 4,
        cells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      },
    ];
    let state = createGame(4, testTargets, longPlayerFormation);

    state = playHumanTurn(state, { row: 3, col: 3 }, () => 0);
    state = playHumanTurn(state, { row: 3, col: 2 }, () => 0);
    state = playHumanTurn(state, { row: 3, col: 1 }, () => 0);

    expect(state.computerShotCount).toBe(3);
    expect(state.isLost).toBe(false);
    expect(new Set(Object.keys(state.playerShots)).size).toBe(3);
  });

  it('enters a loss state when computer clears every player formation cell', () => {
    let state = createGame(4, testTargets, testTargets);
    const randomValues = [0, 0, 0.99];

    state = playHumanTurn(state, { row: 3, col: 3 }, () => randomValues.shift() ?? 0);
    state = playHumanTurn(state, { row: 3, col: 2 }, () => randomValues.shift() ?? 0);

    expect(state.playerShots['0,0']).toBe('hit');
    expect(state.playerShots['0,1']).toBe('hit');
    expect(state.isWon).toBe(false);
    expect(state.isLost).toBe(true);
    expect(getPlayerFormationDamage(state)).toBe(100);
  });

  it('does not count human shots or play computer shots after a loss', () => {
    const lostState = {
      ...createGame(4, testTargets, testTargets),
      playerShots: {
        '0,0': 'hit' as const,
        '0,1': 'hit' as const,
      },
      computerShotCount: 2,
      isLost: true,
    };

    const nextState = playHumanTurn(lostState, { row: 3, col: 3 }, () => 0.5);

    expect(nextState).toBe(lostState);
    expect(nextState.shotCount).toBe(0);
    expect(nextState.computerShotCount).toBe(2);
    expect(nextState.shots).toEqual({});
    expect(nextState.playerShots).toEqual(lostState.playerShots);
  });

  it('records exhausted computer turns when no player-board cells remain', () => {
    const state = createGame(2, testTargets, testTargets);
    const exhaustedState = {
      ...state,
      playerShots: {
        '0,0': 'hit' as const,
        '0,1': 'hit' as const,
        '1,0': 'miss' as const,
        '1,1': 'miss' as const,
      },
      computerShotCount: 4,
    };

    const nextState = playHumanTurn(exhaustedState, { row: 1, col: 1 }, () => 0);

    expect(nextState.lastResult?.outcome).toBe('miss');
    expect(nextState.computerShotCount).toBe(4);
    expect(nextState.playerShots).toEqual(exhaustedState.playerShots);
    expect(nextState.lastComputerResult).toEqual({
      outcome: 'exhausted',
      shotCounted: false,
    });
  });
});
