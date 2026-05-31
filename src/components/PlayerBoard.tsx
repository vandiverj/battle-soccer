import { coordinateKey } from '../game/placement';
import type { GameState, PlacedTarget } from '../game/types';

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
};

export function PlayerBoard({ state }: PlayerBoardProps) {
  const occupiedCells = buildFormationLookup(state.playerFormations);
  const cells = Array.from({ length: state.gridSize * state.gridSize }, (_, index) => ({
    row: Math.floor(index / state.gridSize),
    col: index % state.gridSize,
  }));

  return (
    <section className="board-card" aria-label="Player formation board">
      <div className="board-header">
        <span>Player board</span>
        <span>{state.gridSize} × {state.gridSize}</span>
      </div>
      <div className="game-board player-board" role="grid" aria-label="Player formation board">
        {cells.map((cell) => {
          const key = coordinateKey(cell);
          const formation = occupiedCells.get(key);
          const label = formation
            ? `Row ${cell.row + 1}, column ${cell.col + 1}: occupied by ${formation.name}`
            : `Row ${cell.row + 1}, column ${cell.col + 1}: empty player-side cell`;

          return (
            <div
              key={key}
              className={`grid-cell player-cell ${formation ? 'player-cell--occupied' : ''}`}
              role="gridcell"
              aria-label={label}
            >
              <span aria-hidden="true">{formation ? formation.shortName.slice(0, 2) : ''}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
