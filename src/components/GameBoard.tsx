import { coordinateKey } from '../game/placement';
import type { Coordinate, GameState } from '../game/types';

type GameBoardProps = {
  state: GameState;
  onShoot: (coordinate: Coordinate) => void;
};

export function GameBoard({ state, onShoot }: GameBoardProps) {
  const cells = Array.from({ length: state.gridSize * state.gridSize }, (_, index) => ({
    row: Math.floor(index / state.gridSize),
    col: index % state.gridSize,
  }));

  return (
    <section className="board-card" aria-label="Battle Soccer shot grid">
      <div className="board-header">
        <span>Penalty Grid</span>
        <span>{state.gridSize} × {state.gridSize}</span>
      </div>
      <div className="game-board" role="grid" aria-label="Hidden target grid">
        {cells.map((cell) => {
          const key = coordinateKey(cell);
          const shot = state.shots[key];
          const label = shot
            ? `Row ${cell.row + 1}, column ${cell.col + 1}: ${shot}`
            : `Shoot row ${cell.row + 1}, column ${cell.col + 1}`;

          return (
            <button
              key={key}
              type="button"
              className={`grid-cell ${shot ? `grid-cell--${shot}` : ''}`}
              aria-label={label}
              disabled={state.isWon}
              onClick={() => onShoot(cell)}
            >
              <span aria-hidden="true">{shot === 'hit' ? '⚽' : shot === 'miss' ? '×' : ''}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
