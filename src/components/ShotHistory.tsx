import { getShotHistory } from '../game/gameState';
import type { GameState, ShotSide } from '../game/types';

type ShotHistoryProps = {
  state: GameState;
  side: ShotSide;
  title: string;
  emptyText: string;
};

const formatCoordinate = (row: number, col: number): string => `R${row + 1} C${col + 1}`;

export function ShotHistory({ state, side, title, emptyText }: ShotHistoryProps) {
  const shots = getShotHistory(state, side).slice(-5).reverse();

  return (
    <section className="shot-history" aria-label={title}>
      <h2>{title}</h2>
      {shots.length === 0 ? (
        <p className="shot-history__empty">{emptyText}</p>
      ) : (
        <ol className="shot-history__list">
          {shots.map((shot) => (
            <li className={`shot-history__item shot-history__item--${shot.outcome}`} key={shot.key}>
              <span>{formatCoordinate(shot.coordinate.row, shot.coordinate.col)}</span>
              <strong>{shot.outcome}</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
