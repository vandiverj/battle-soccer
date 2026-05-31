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

export type ShotResult = {
  outcome: ShotOutcome;
  coordinate: Coordinate;
  shotCounted: boolean;
  clearedTargetId?: string;
  won: boolean;
};

export type GameState = {
  gridSize: number;
  targets: PlacedTarget[];
  shots: Record<string, CellState>;
  shotCount: number;
  currentStreak: number;
  lastResult?: ShotResult;
  isWon: boolean;
};
