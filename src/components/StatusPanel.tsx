import { getShotAccuracy } from '../game/gameState';
import type { GameState } from '../game/types';

type StatusPanelProps = {
  state: GameState;
  remainingCount: number;
  onReset: () => void;
};

const formatLastResult = (state: GameState): string => {
  if (state.isWon) {
    return 'Final whistle! You cleared every hidden club.';
  }

  const result = state.lastResult;
  if (!result) {
    return 'Pick a square and launch your first shot.';
  }

  if (result.outcome === 'repeat') {
    return 'That spot was already tested. No extra shot counted.';
  }

  if (result.clearedTargetId) {
    return 'Goal rush! A hidden club has been cleared.';
  }

  return result.outcome === 'hit' ? 'Hit! Keep pressing that formation.' : 'Miss. The ball rolls wide.';
};

export function StatusPanel({ state, remainingCount, onReset }: StatusPanelProps) {
  const accuracy = getShotAccuracy(state);

  return (
    <aside className="status-card" aria-live="polite">
      <p className="eyebrow">Single-player scouting report</p>
      <h1>Battle Soccer</h1>
      <p className="intro">
        Fire soccer balls into the hidden grid. Find every fictional club formation before
        your shot count climbs too high.
      </p>

      <div className="score-strip" aria-label="Game score">
        <div>
          <strong>{state.shotCount}</strong>
          <span>Shots</span>
        </div>
        <div>
          <strong>{remainingCount}</strong>
          <span>Targets left</span>
        </div>
        <div>
          <strong>{accuracy === null ? '--' : `${accuracy}%`}</strong>
          <span>Accuracy</span>
        </div>
      </div>

      <p className={`result result--${state.lastResult?.outcome ?? 'ready'}`}>{formatLastResult(state)}</p>

      <button type="button" className="reset-button" onClick={onReset}>
        New game
      </button>
    </aside>
  );
}
