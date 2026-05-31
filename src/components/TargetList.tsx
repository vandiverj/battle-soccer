import { isTargetCleared } from '../game/gameState';
import type { GameState } from '../game/types';

type TargetListProps = {
  state: GameState;
};

export function TargetList({ state }: TargetListProps) {
  return (
    <section className="target-card" aria-label="Hidden fictional targets">
      <h2>Hidden clubs</h2>
      <ul className="target-list">
        {state.targets.map((target) => {
          const hitCount = target.cells.filter((cell) => state.shots[`${cell.row},${cell.col}`] === 'hit').length;
          const cleared = isTargetCleared(target, state.shots);

          return (
            <li key={target.id} className={cleared ? 'target target--cleared' : 'target'}>
              <div>
                <strong>{cleared ? target.name : target.shortName}</strong>
                <span>{target.chant}</span>
              </div>
              <span className="target-progress" aria-label={`${hitCount} of ${target.length} cells hit`}>
                {hitCount}/{target.length}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
