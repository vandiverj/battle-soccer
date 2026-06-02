export type CellState = 'unknown' | 'hit' | 'miss';

export type Coordinate = {
  row: number;
  col: number;
};

export type Orientation = 'horizontal' | 'vertical';

export type TargetDefinition = {
  id: string;
  name: string;
  shortName: string;
  length: number;
  chant: string;
};

export type PlacedTarget = TargetDefinition & {
  cells: Coordinate[];
};

export type ShotOutcome = 'hit' | 'miss' | 'repeat';

export type ComputerShotOutcome = 'hit' | 'miss' | 'exhausted';

export type GameOutcome = 'playing' | 'won' | 'lost';

export type MomentumLevel = 'steady' | 'pressing' | 'surging';

export type ShotSide = 'human' | 'computer';

export type DifficultyLevel = 'friendly' | 'derby' | 'cup-final';

export type MatchSettings = {
  difficulty: DifficultyLevel;
};

export type MatchStats = {
  humanHits: number;
  humanMisses: number;
  computerHits: number;
  computerMisses: number;
  accuracy: number | null;
  formationDamage: number;
  turnsPlayed: number;
};

export type ShotHistoryEntry = {
  key: string;
  coordinate: Coordinate;
  outcome: Extract<CellState, 'hit' | 'miss'>;
};

export type ShotResult = {
  outcome: ShotOutcome;
  coordinate: Coordinate;
  shotCounted: boolean;
  clearedTargetId?: string;
  won: boolean;
};

export type ComputerShotResult = {
  outcome: ComputerShotOutcome;
  coordinate?: Coordinate;
  shotCounted: boolean;
};

export type GameState = {
  gridSize: number;
  settings: MatchSettings;
  targets: PlacedTarget[];
  playerFormations: PlacedTarget[];
  shots: Record<string, CellState>;
  playerShots: Record<string, CellState>;
  shotCount: number;
  computerShotCount: number;
  currentStreak: number;
  lastResult?: ShotResult;
  lastComputerResult?: ComputerShotResult;
  isWon: boolean;
  isLost: boolean;
};
