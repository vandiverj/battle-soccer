import { useMemo, useState } from 'react';
import { getShotHistory } from '../game/gameState';
import type { GameState, ShotHistoryEntry, ShotSide } from '../game/types';

type ShotHistoryProps = {
  state: GameState;
  side: ShotSide;
  title: string;
  emptyText: string;
};

const formatCoordinate = (row: number, col: number): string => `R${row + 1} C${col + 1}`;

type ShotFilter = 'all' | ShotHistoryEntry['outcome'];

export function ShotHistory({ state, side, title, emptyText }: ShotHistoryProps) {
  const [filter, setFilter] = useState<ShotFilter>('all');
  const allShots = useMemo(() => getShotHistory(state, side), [side, state]);
  const shots = allShots
    .filter((shot) => filter === 'all' || shot.outcome === filter)
    .slice(-5)
    .reverse();
  const counts = allShots.reduce(
    (summary, shot) => ({
      ...summary,
      [shot.outcome]: summary[shot.outcome] + 1,
    }),
    { hit: 0, miss: 0 },
  );

  return (
    <section className="shot-history" aria-label={title}>
      <h2>{title}</h2>
      <div className="shot-history__filters" aria-label={`${title} filters`}>
        {(['all', 'hit', 'miss'] as ShotFilter[]).map((filterOption) => (
          <button
            key={filterOption}
            type="button"
            className={filter === filterOption ? 'shot-history__filter shot-history__filter--active' : 'shot-history__filter'}
            onClick={() => setFilter(filterOption)}
          >
            {filterOption === 'all' ? `All ${allShots.length}` : `${filterOption} ${counts[filterOption]}`}
          </button>
        ))}
      </div>
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
