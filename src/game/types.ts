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

export type ShotSide = 'human' | 'computer';

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
