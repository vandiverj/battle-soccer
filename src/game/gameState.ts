import { GRID_SIZE } from './targets';
import { coordinateKey, placeTargets } from './placement';
import type { CellState, Coordinate, GameState, PlacedTarget, ShotResult } from './types';

const findTargetAt = (targets: PlacedTarget[], coordinate: Coordinate): PlacedTarget | undefined =>
  targets.find((target) => target.cells.some((cell) => coordinateKey(cell) === coordinateKey(coordinate)));

export const isTargetCleared = (target: PlacedTarget, shots: Record<string, CellState>): boolean =>
  target.cells.every((cell) => shots[coordinateKey(cell)] === 'hit');

export const getRemainingTargets = (state: GameState): PlacedTarget[] =>
  state.targets.filter((target) => !isTargetCleared(target, state.shots));

export const getHitCount = (state: GameState): number =>
  Object.values(state.shots).filter((shot) => shot === 'hit').length;

export const getShotAccuracy = (state: GameState): number | null => {
  if (state.shotCount === 0) {
    return null;
  }

  return Math.round((getHitCount(state) / state.shotCount) * 100);
};

export const createGame = (
  gridSize = GRID_SIZE,
  targets = placeTargets(undefined, gridSize),
  playerFormations = placeTargets(undefined, gridSize),
): GameState => ({
  gridSize,
  targets,
  playerFormations,
  shots: {},
  shotCount: 0,
  currentStreak: 0,
  isWon: false,
});

export const shootCell = (state: GameState, coordinate: Coordinate): GameState => {
  const key = coordinateKey(coordinate);
  const previousShot = state.shots[key];

  if (previousShot) {
    const repeatResult: ShotResult = {
      outcome: 'repeat',
      coordinate,
      shotCounted: false,
      won: state.isWon,
    };

    return {
      ...state,
      lastResult: repeatResult,
    };
  }

  const target = findTargetAt(state.targets, coordinate);
  const nextCellState: CellState = target ? 'hit' : 'miss';
  const nextShots = {
    ...state.shots,
    [key]: nextCellState,
  };
  const clearedTargetId = target && isTargetCleared(target, nextShots) ? target.id : undefined;
  const won = state.targets.every((placedTarget) => isTargetCleared(placedTarget, nextShots));
  const result: ShotResult = {
    outcome: target ? 'hit' : 'miss',
    coordinate,
    shotCounted: true,
    clearedTargetId,
    won,
  };
  const currentStreak = target ? state.currentStreak + 1 : 0;

  return {
    ...state,
    shots: nextShots,
    shotCount: state.shotCount + 1,
    currentStreak,
    lastResult: result,
    isWon: won,
  };
};
