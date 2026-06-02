import { coordinateKey } from '../game/placement';
import type { Coordinate, GameState, Orientation, PlacedTarget, TargetDefinition } from '../game/types';

const buildFormationLookup = (formations: PlacedTarget[]): Map<string, PlacedTarget> => {
  const lookup = new Map<string, PlacedTarget>();

  formations.forEach((formation) => {
    formation.cells.forEach((cell) => {
      lookup.set(coordinateKey(cell), formation);
    });
  });

  return lookup;
};

type PlayerBoardProps = {
  state: GameState;
  isComputerThinking?: boolean;
  isPlacementMode?: boolean;
  orientation?: Orientation;
  activeTarget?: TargetDefinition;
  onPlace?: (coordinate: Coordinate) => void;
};

export function PlayerBoard({
  state,
  isComputerThinking = false,
  isPlacementMode = false,
  orientation = 'horizontal',
  activeTarget,
  onPlace,
}: PlayerBoardProps) {
  const occupiedCells = buildFormationLookup(state.playerFormations);
  const cells = Array.from({ length: state.gridSize * state.gridSize }, (_, index) => ({
    row: Math.floor(index / state.gridSize),
    col: index % state.gridSize,
  }));

  return (
    <section className="board-card" aria-label="Player formation board">
      <div className="board-header">
        <span>Player board</span>
        <span>{isPlacementMode && activeTarget ? `${activeTarget.length} ${orientation}` : `${state.gridSize} × ${state.gridSize}`}</span>
      </div>
      <div
        className={`game-board player-board ${isComputerThinking ? 'player-board--thinking' : ''}`}
        role="grid"
        aria-label="Player formation board"
        aria-busy={isComputerThinking}
      >
        {cells.map((cell) => {
          const key = coordinateKey(cell);
          const formation = occupiedCells.get(key);
          const computerShot = state.playerShots[key];
          const isLatestComputerShot = state.lastComputerResult?.coordinate && coordinateKey(state.lastComputerResult.coordinate) === key;
          const computerShotLabel = computerShot ? `, computer ${computerShot}` : ', not yet shot by computer';
          const label = formation
            ? `Row ${cell.row + 1}, column ${cell.col + 1}: occupied by ${formation.name}${computerShotLabel}`
            : `Row ${cell.row + 1}, column ${cell.col + 1}: empty player-side cell${computerShotLabel}`;

          if (isPlacementMode) {
            return (
              <button
                key={key}
                type="button"
                className={`grid-cell player-cell player-cell--placement ${formation ? 'player-cell--occupied' : ''}`}
                aria-label={
                  formation
                    ? `Row ${cell.row + 1}, column ${cell.col + 1}: occupied by ${formation.name}`
                    : `Place ${activeTarget?.name ?? 'formation'} starting at row ${cell.row + 1}, column ${cell.col + 1}`
                }
                disabled={Boolean(formation)}
                onClick={() => onPlace?.(cell)}
              >
                <span aria-hidden="true">{formation ? '▌▌' : ''}</span>
              </button>
            );
          }

          return (
            <div
              key={key}
              className={`grid-cell player-cell ${formation ? 'player-cell--occupied' : ''} ${
                computerShot ? `player-cell--computer-${computerShot}` : ''
              } ${isLatestComputerShot ? 'grid-cell--latest' : ''}`}
              role="gridcell"
              aria-label={label}
            >
              <span aria-hidden="true">{computerShot === 'hit' ? '⚽' : computerShot === 'miss' ? '×' : formation ? '▌▌' : ''}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
