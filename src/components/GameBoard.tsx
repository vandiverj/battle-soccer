import { coordinateKey } from '../game/placement';
import type { Coordinate, GameState } from '../game/types';

type GameBoardProps = {
  state: GameState;
  disabled?: boolean;
  shotMode?: 'normal' | 'power';
  onShoot: (coordinate: Coordinate) => void;
};

export function GameBoard({ state, disabled = false, shotMode = 'normal', onShoot }: GameBoardProps) {
  const cells = Array.from({ length: state.gridSize * state.gridSize }, (_, index) => ({
    row: Math.floor(index / state.gridSize),
    col: index % state.gridSize,
  }));

  return (
    <section className={`board-card ${shotMode === 'power' ? 'board-card--power-armed' : ''}`} aria-label="Opponent shot board">
      <div className="board-header">
        <span>Opponent board</span>
        <span>{shotMode === 'power' ? 'Power lane armed' : `${state.gridSize} × ${state.gridSize}`}</span>
      </div>
      <div className="game-board" role="grid" aria-label="Opponent shot board">
        {cells.map((cell) => {
          const key = coordinateKey(cell);
          const shot = state.shots[key];
          const isLatestShot = state.lastResult?.affectedCells.some((affectedCell) => coordinateKey(affectedCell) === key)
            || (state.lastResult?.coordinate && coordinateKey(state.lastResult.coordinate) === key);
          const label = shot
            ? `Opponent row ${cell.row + 1}, column ${cell.col + 1}: ${shot}`
            : shotMode === 'power'
              ? `Power shot opponent row ${cell.row + 1}, column ${cell.col + 1}`
              : `Shoot opponent row ${cell.row + 1}, column ${cell.col + 1}`;

          return (
            <button
              key={key}
              type="button"
              className={`grid-cell ${shot ? `grid-cell--${shot}` : ''} ${isLatestShot ? 'grid-cell--latest' : ''} ${
                shotMode === 'power' && !shot ? 'grid-cell--power-armed' : ''
              }`}
              aria-label={label}
              disabled={disabled || state.isWon || state.isLost}
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
