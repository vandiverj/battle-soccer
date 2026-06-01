import { GRID_SIZE, TARGET_DEFINITIONS } from './targets';
import type { Coordinate, Orientation, PlacedTarget, TargetDefinition } from './types';

export const coordinateKey = ({ row, col }: Coordinate): string => `${row},${col}`;

const randomOrientation = (): Orientation => (Math.random() > 0.5 ? 'horizontal' : 'vertical');

export const buildCells = (
  start: Coordinate,
  length: number,
  orientation: Orientation,
): Coordinate[] =>
  Array.from({ length }, (_, index) => ({
    row: start.row + (orientation === 'vertical' ? index : 0),
    col: start.col + (orientation === 'horizontal' ? index : 0),
  }));

const cellsFit = (cells: Coordinate[], gridSize: number): boolean =>
  cells.every(
    (cell) => cell.row >= 0 && cell.row < gridSize && cell.col >= 0 && cell.col < gridSize,
  );

const cellsAvailable = (cells: Coordinate[], occupied: Set<string>): boolean =>
  cells.every((cell) => !occupied.has(coordinateKey(cell)));

export const canPlaceTarget = (
  definition: TargetDefinition,
  start: Coordinate,
  orientation: Orientation,
  existingTargets: PlacedTarget[],
  gridSize = GRID_SIZE,
): boolean => {
  const occupied = new Set(existingTargets.flatMap((target) => target.cells.map(coordinateKey)));
  const cells = buildCells(start, definition.length, orientation);

  return cellsFit(cells, gridSize) && cellsAvailable(cells, occupied);
};

export const placeTargetAt = (
  definition: TargetDefinition,
  start: Coordinate,
  orientation: Orientation,
  existingTargets: PlacedTarget[],
  gridSize = GRID_SIZE,
): PlacedTarget | null => {
  if (!canPlaceTarget(definition, start, orientation, existingTargets, gridSize)) {
    return null;
  }

  return {
    ...definition,
    cells: buildCells(start, definition.length, orientation),
  };
};

export const targetsOverlap = (targets: PlacedTarget[]): boolean => {
  const seen = new Set<string>();

  for (const target of targets) {
    for (const cell of target.cells) {
      const key = coordinateKey(cell);
      if (seen.has(key)) {
        return true;
      }
      seen.add(key);
    }
  }

  return false;
};

export const placeTargets = (
  definitions: TargetDefinition[] = TARGET_DEFINITIONS,
  gridSize = GRID_SIZE,
): PlacedTarget[] => {
  const occupied = new Set<string>();
  const placed: PlacedTarget[] = [];

  for (const definition of definitions) {
    let targetCells: Coordinate[] | null = null;

    for (let attempts = 0; attempts < 300 && !targetCells; attempts += 1) {
      const orientation = randomOrientation();
      const maxRow = orientation === 'vertical' ? gridSize - definition.length : gridSize - 1;
      const maxCol = orientation === 'horizontal' ? gridSize - definition.length : gridSize - 1;
      const start = {
        row: Math.floor(Math.random() * (maxRow + 1)),
        col: Math.floor(Math.random() * (maxCol + 1)),
      };
      const cells = buildCells(start, definition.length, orientation);

      if (cellsFit(cells, gridSize) && cellsAvailable(cells, occupied)) {
        targetCells = cells;
      }
    }

    if (!targetCells) {
      throw new Error(`Could not place target: ${definition.name}`);
    }

    targetCells.forEach((cell) => occupied.add(coordinateKey(cell)));
    placed.push({ ...definition, cells: targetCells });
  }

  return placed;
};
