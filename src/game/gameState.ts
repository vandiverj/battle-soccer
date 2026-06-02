import { GRID_SIZE } from './targets';
import { coordinateKey, placeTargets } from './placement';
import type {
  CellState,
  CoachHint,
  ComputerShotResult,
  Coordinate,
  DifficultyLevel,
  GameOutcome,
  MatchLength,
  MatchSettings,
  MatchStats,
  GameState,
  MomentumLevel,
  PlacedTarget,
  ShotHistoryEntry,
  ShotResult,
  ShotSide,
} from './types';

export const DEFAULT_MATCH_SETTINGS: MatchSettings = {
  difficulty: 'derby',
  matchLength: 'standard',
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  friendly: 'Friendly',
  derby: 'Derby',
  'cup-final': 'Cup Final',
};

export const COMPUTER_TURN_DELAYS_MS: Record<DifficultyLevel, number> = {
  friendly: 900,
  derby: 700,
  'cup-final': 520,
};

export const MATCH_LENGTH_LABELS: Record<MatchLength, string> = {
  quick: 'Quick 18',
  standard: 'Standard 26',
  marathon: 'Marathon 34',
};

export const MATCH_SHOT_LIMITS: Record<MatchLength, number> = {
  quick: 18,
  standard: 26,
  marathon: 34,
};

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

export const getHumanMissCount = (state: GameState): number =>
  Object.values(state.shots).filter((shot) => shot === 'miss').length;

export const getComputerHitCount = (state: GameState): number =>
  Object.values(state.playerShots).filter((shot) => shot === 'hit').length;

export const getComputerMissCount = (state: GameState): number =>
  Object.values(state.playerShots).filter((shot) => shot === 'miss').length;

export const getPlayerFormationDamage = (state: GameState): number => {
  const formationCells = state.playerFormations.flatMap((formation) => formation.cells);

  if (formationCells.length === 0) {
    return 0;
  }

  const damagedCells = formationCells.filter((cell) => state.playerShots[coordinateKey(cell)] === 'hit');

  return Math.round((damagedCells.length / formationCells.length) * 100);
};

export const getGameOutcome = (state: Pick<GameState, 'isWon' | 'isLost'>): GameOutcome => {
  if (state.isWon) {
    return 'won';
  }

  return state.isLost ? 'lost' : 'playing';
};

export const getMatchStats = (state: GameState): MatchStats => ({
  humanHits: getHitCount(state),
  humanMisses: getHumanMissCount(state),
  computerHits: getComputerHitCount(state),
  computerMisses: getComputerMissCount(state),
  accuracy: getShotAccuracy(state),
  formationDamage: getPlayerFormationDamage(state),
  turnsPlayed: Math.max(state.shotCount, state.computerShotCount),
});

export const getMomentumLevel = (state: Pick<GameState, 'currentStreak'>): MomentumLevel => {
  if (state.currentStreak >= 3) {
    return 'surging';
  }

  if (state.currentStreak >= 1) {
    return 'pressing';
  }

  return 'steady';
};

export const getCoachHint = (state: GameState): CoachHint => {
  if (state.isWon) {
    return {
      title: 'Cup secured',
      detail: 'You cleared the scouting board. Start a new match to try a cleaner run.',
      tone: 'victory',
    };
  }

  if (state.isLost) {
    return {
      title: 'Reset the shape',
      detail:
        state.shotCount >= state.shotLimit
          ? 'The shot clock ran out. Use the power shot earlier when lanes look promising.'
          : 'The computer broke the wall. Spread your next setup across more rows and columns.',
      tone: 'warning',
    };
  }

  if (!state.lastResult) {
    return {
      title: 'Scout the corners',
      detail: 'Open with spaced shots to locate a formation before committing the power shot.',
      tone: 'neutral',
    };
  }

  if (state.lastResult.outcome === 'repeat') {
    return {
      title: 'Pick fresh grass',
      detail: 'Repeated squares do not count, but they also give the computer no extra turn.',
      tone: 'neutral',
    };
  }

  const shotsLeft = state.shotLimit - state.shotCount;
  const formationDamage = getPlayerFormationDamage(state);

  if (shotsLeft <= 5) {
    return {
      title: 'Late match pressure',
      detail: 'Prioritize adjacent squares around known hits before the final whistle.',
      tone: 'warning',
    };
  }

  if (formationDamage >= 75) {
    return {
      title: 'Wall under siege',
      detail: 'The computer is close to clearing your defense. Finish targets quickly.',
      tone: 'warning',
    };
  }

  if (state.currentStreak >= 3) {
    return {
      title: 'Press the lane',
      detail: 'Your streak is hot. Keep testing cells next to recent hits.',
      tone: 'attack',
    };
  }

  if (state.lastResult.outcome === 'hit') {
    return {
      title: 'Follow the touchline',
      detail: 'Hits usually belong to a longer wall. Probe nearby rows or columns.',
      tone: 'attack',
    };
  }

  if (state.powerShotAvailable) {
    return {
      title: 'Power shot ready',
      detail: 'Save it for a likely lane, or use it now to reveal three cells as one shot.',
      tone: 'neutral',
    };
  }

  return {
    title: 'Keep spacing shots',
    detail: 'Use misses to rule out open grass and narrow the next target lane.',
    tone: 'neutral',
  };
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
  settings: Partial<MatchSettings> = DEFAULT_MATCH_SETTINGS,
): GameState => {
  const resolvedSettings = { ...DEFAULT_MATCH_SETTINGS, ...settings };

  return {
    gridSize,
    settings: resolvedSettings,
    targets,
    playerFormations,
    shots: {},
    playerShots: {},
    shotCount: 0,
    computerShotCount: 0,
    currentStreak: 0,
    powerShotAvailable: true,
    shotLimit: MATCH_SHOT_LIMITS[resolvedSettings.matchLength],
    isWon: false,
    isLost: false,
  };
};

const getAllCoordinates = (gridSize: number): Coordinate[] =>
  Array.from({ length: gridSize * gridSize }, (_, index) => ({
    row: Math.floor(index / gridSize),
    col: index % gridSize,
  }));

const getAvailableComputerShots = (state: GameState): Coordinate[] =>
  getAllCoordinates(state.gridSize).filter((coordinate) => !state.playerShots[coordinateKey(coordinate)]);

const getAdjacentCoordinates = (coordinate: Coordinate, gridSize: number): Coordinate[] =>
  [
    { row: coordinate.row - 1, col: coordinate.col },
    { row: coordinate.row + 1, col: coordinate.col },
    { row: coordinate.row, col: coordinate.col - 1 },
    { row: coordinate.row, col: coordinate.col + 1 },
  ].filter((cell) => cell.row >= 0 && cell.row < gridSize && cell.col >= 0 && cell.col < gridSize);

const getHuntCandidates = (state: GameState): Coordinate[] => {
  const hitCoordinates = Object.entries(state.playerShots)
    .filter(([, outcome]) => outcome === 'hit')
    .map(([key]) => parseCoordinateKey(key));
  const availableKeys = new Set(getAvailableComputerShots(state).map(coordinateKey));

  return hitCoordinates
    .flatMap((coordinate) => getAdjacentCoordinates(coordinate, state.gridSize))
    .filter((coordinate) => availableKeys.has(coordinateKey(coordinate)));
};

const chooseComputerShot = (state: GameState, random: () => number): Coordinate | null => {
  const availableShots = getAvailableComputerShots(state);

  if (availableShots.length === 0) {
    return null;
  }

  if (state.settings.difficulty !== 'friendly') {
    const huntCandidates = getHuntCandidates(state);
    const huntChance = state.settings.difficulty === 'cup-final' ? 0.9 : 0.58;

    if (huntCandidates.length > 0 && random() < huntChance) {
      const huntIndex = Math.max(0, Math.min(Math.floor(random() * huntCandidates.length), huntCandidates.length - 1));
      return huntCandidates[huntIndex];
    }
  }

  const shotIndex = Math.max(0, Math.min(Math.floor(random() * availableShots.length), availableShots.length - 1));
  return availableShots[shotIndex];
};

const takeComputerShot = (state: GameState, random = Math.random): GameState => {
  const coordinate = chooseComputerShot(state, random);

  if (!coordinate) {
    const result: ComputerShotResult = {
      outcome: 'exhausted',
      shotCounted: false,
    };

    return {
      ...state,
      lastComputerResult: result,
    };
  }

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

export const playComputerTurn = (state: GameState, random = Math.random): GameState => {
  if (state.isWon || state.isLost) {
    return state;
  }

  return takeComputerShot(state, random);
};

export const shootCell = (state: GameState, coordinate: Coordinate): GameState => {
  return shootCells(state, [coordinate], 'normal');
};

const getPowerShotCells = (state: GameState, coordinate: Coordinate): Coordinate[] => [
  coordinate,
  { row: coordinate.row, col: coordinate.col + 1 },
  { row: coordinate.row + 1, col: coordinate.col },
].filter((cell) => cell.row >= 0 && cell.row < state.gridSize && cell.col >= 0 && cell.col < state.gridSize);

export const shootPowerShot = (state: GameState, coordinate: Coordinate): GameState => {
  if (!state.powerShotAvailable) {
    return shootCells(state, [coordinate], 'normal');
  }

  return shootCells(state, getPowerShotCells(state, coordinate), 'power');
};

const shootCells = (state: GameState, coordinates: Coordinate[], mode: 'normal' | 'power'): GameState => {
  const unshotCoordinates = coordinates.filter((cell) => !state.shots[coordinateKey(cell)]);

  if (!unshotCoordinates.length) {
    const repeatResult: ShotResult = {
      outcome: 'repeat',
      coordinate: coordinates[0],
      mode,
      shotCounted: false,
      affectedCells: [],
      hitCount: 0,
      missCount: 0,
      won: state.isWon,
      clearedTargetIds: [],
    };

    return {
      ...state,
      lastResult: repeatResult,
    };
  }

  const nextShots = unshotCoordinates.reduce<Record<string, CellState>>((shots, cell) => {
    const target = findTargetAt(state.targets, cell);
    return {
      ...shots,
      [coordinateKey(cell)]: target ? 'hit' : 'miss',
    };
  }, state.shots);
  const hitCount = unshotCoordinates.filter((cell) => nextShots[coordinateKey(cell)] === 'hit').length;
  const missCount = unshotCoordinates.length - hitCount;
  const clearedTargetIds = state.targets
    .filter((target) => !isTargetCleared(target, state.shots) && isTargetCleared(target, nextShots))
    .map((target) => target.id);
  const won = state.targets.every((placedTarget) => isTargetCleared(placedTarget, nextShots));
  const nextShotCount = state.shotCount + 1;
  const shotLimitReached = !won && nextShotCount >= state.shotLimit;
  const result: ShotResult = {
    outcome: hitCount ? 'hit' : 'miss',
    coordinate: unshotCoordinates[0],
    mode,
    shotCounted: true,
    affectedCells: unshotCoordinates,
    hitCount,
    missCount,
    clearedTargetId: clearedTargetIds[0],
    clearedTargetIds,
    won,
  };
  const currentStreak = hitCount ? state.currentStreak + hitCount : 0;

  return {
    ...state,
    shots: nextShots,
    shotCount: nextShotCount,
    currentStreak,
    powerShotAvailable: mode === 'power' ? false : state.powerShotAvailable,
    lastResult: result,
    isWon: won,
    isLost: shotLimitReached,
  };
};

export const playHumanTurn = (state: GameState, coordinate: Coordinate, random = Math.random): GameState => {
  if (state.isWon || state.isLost) {
    return state;
  }

  const afterHumanShot = shootCell(state, coordinate);

  if (!afterHumanShot.lastResult?.shotCounted || afterHumanShot.lastResult.won || afterHumanShot.isLost) {
    return afterHumanShot;
  }

  return playComputerTurn(afterHumanShot, random);
};
