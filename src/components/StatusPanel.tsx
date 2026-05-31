import { getGameOutcome, getShotAccuracy } from '../game/gameState';
import type { GameState } from '../game/types';

type StatusPanelProps = {
  state: GameState;
  remainingCount: number;
  onReset: () => void;
};

const formatCoordinate = (coordinate: { row: number; col: number }): string =>
  `row ${coordinate.row + 1}, column ${coordinate.col + 1}`;

const formatLastResult = (state: GameState): string => {
  if (state.isWon) {
    return 'Final whistle! You cleared every hidden club.';
  }

  if (state.isLost) {
    return 'Full-time defeat. The computer found every one of your formations.';
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

const formatLastComputerResult = (state: GameState): string => {
  const result = state.lastComputerResult;

  if (!result) {
    return 'Computer is waiting for your first counted shot.';
  }

  if (result.outcome === 'exhausted' || !result.coordinate) {
    return 'Computer has no unrepeated player-board shots left.';
  }

  const shotLocation = formatCoordinate(result.coordinate);
  return result.outcome === 'hit'
    ? `Computer hit your formation at ${shotLocation}.`
    : `Computer missed at ${shotLocation}.`;
};

export function StatusPanel({ state, remainingCount, onReset }: StatusPanelProps) {
  const accuracy = getShotAccuracy(state);
  const outcome = getGameOutcome(state);
  const outcomeLabel = outcome === 'won' ? 'Win' : outcome === 'lost' ? 'Loss' : 'Playing';

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
        <div>
          <strong>{state.currentStreak}</strong>
          <span>Current streak</span>
        </div>
        <div>
          <strong>{state.computerShotCount}</strong>
          <span>Computer shots</span>
        </div>
        <div className={`outcome-stat outcome-stat--${outcome}`}>
          <strong>{outcomeLabel}</strong>
          <span>Outcome</span>
        </div>
      </div>

      <p className={`result result--${state.isLost ? 'lost' : state.lastResult?.outcome ?? 'ready'}`}>
        {formatLastResult(state)}
      </p>
      <p className={`computer-result computer-result--${state.lastComputerResult?.outcome ?? 'ready'}`}>
        {formatLastComputerResult(state)}
      </p>

      <button type="button" className="reset-button" onClick={onReset}>
        New game
      </button>
    </aside>
  );
}
