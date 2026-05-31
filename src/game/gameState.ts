import { GRID_SIZE } from './targets';
import { coordinateKey, placeTargets } from './placement';
import type {
  CellState,
  ComputerShotResult,
  Coordinate,
  GameOutcome,
  GameState,
  PlacedTarget,
  ShotHistoryEntry,
  ShotResult,
  ShotSide,
} from './types';

const findTargetAt = (targets: PlacedTarget[], coordinate: Coordinate): PlacedTarget | undefined =>
  targets.find((target) => target.cells.some((cell) => coordinateKey(cell) === coordinateKey(coordinate)));

export const isTargetCleared = (target: PlacedTarget, shots: Record<string, CellState>): boolean =>
  target.cells.every((cell) => shots[coordinateKey(cell)] === 'hit');

export const getRemainingTargets = (state: GameState): PlacedTarget[] =>
  state.targets.filter((target) => !isTargetCleared(target, state.shots));

const arePlayerFormationsCleared = (state: GameState, playerShots = state.playerShots): boolean =>
  state.playerFormations.every((formation) => isTargetCleared(formation, playerShots));

export const getHitCount = (state: GameState): number =>
  Object.values(state.shots).filter((shot) => shot === 'hit').length;

export const getShotAccuracy = (state: GameState): number | null => {
  if (state.shotCount === 0) {
    return null;
  }

  return Math.round((getHitCount(state) / state.shotCount) * 100);
};

export const getGameOutcome = (state: Pick<GameState, 'isWon' | 'isLost'>): GameOutcome => {
  if (state.isWon) {
    return 'won';
  }

  return state.isLost ? 'lost' : 'playing';
};

const parseCoordinateKey = (key: string): Coordinate => {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
};

export const getShotHistory = (state: GameState, side: ShotSide): ShotHistoryEntry[] => {
  const shotMap = side === 'human' ? state.shots : state.playerShots;

  return Object.entries(shotMap).map(([key, outcome]) => ({
    key: `${side}-${key}`,
    coordinate: parseCoordinateKey(key),
    outcome: outcome as ShotHistoryEntry['outcome'],
  }));
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
  playerShots: {},
  shotCount: 0,
  computerShotCount: 0,
  currentStreak: 0,
  isWon: false,
  isLost: false,
});

const getAllCoordinates = (gridSize: number): Coordinate[] =>
  Array.from({ length: gridSize * gridSize }, (_, index) => ({
    row: Math.floor(index / gridSize),
    col: index % gridSize,
  }));

const getAvailableComputerShots = (state: GameState): Coordinate[] =>
  getAllCoordinates(state.gridSize).filter((coordinate) => !state.playerShots[coordinateKey(coordinate)]);

const takeComputerShot = (state: GameState, random = Math.random): GameState => {
  const availableShots = getAvailableComputerShots(state);

  if (availableShots.length === 0) {
    const result: ComputerShotResult = {
      outcome: 'exhausted',
      shotCounted: false,
    };

    return {
      ...state,
      lastComputerResult: result,
    };
  }

  const shotIndex = Math.max(0, Math.min(Math.floor(random() * availableShots.length), availableShots.length - 1));
  const coordinate = availableShots[shotIndex];
  const key = coordinateKey(coordinate);
  const target = findTargetAt(state.playerFormations, coordinate);
  const outcome: CellState = target ? 'hit' : 'miss';
  const nextPlayerShots = {
    ...state.playerShots,
    [key]: outcome,
  };
  const result: ComputerShotResult = {
    outcome,
    coordinate,
    shotCounted: true,
  };

  return {
    ...state,
    playerShots: nextPlayerShots,
    computerShotCount: state.computerShotCount + 1,
    lastComputerResult: result,
    isLost: arePlayerFormationsCleared(state, nextPlayerShots),
  };
};

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

export const playHumanTurn = (state: GameState, coordinate: Coordinate, random = Math.random): GameState => {
  if (state.isWon || state.isLost) {
    return state;
  }

  const afterHumanShot = shootCell(state, coordinate);

  if (!afterHumanShot.lastResult?.shotCounted || afterHumanShot.lastResult.won) {
    return afterHumanShot;
  }

  return takeComputerShot(afterHumanShot, random);
};
