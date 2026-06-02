import { DIFFICULTY_LABELS, getGameOutcome, getMatchStats, getMomentumLevel, getPlayerFormationDamage, getShotAccuracy } from '../game/gameState';
import type { GameState } from '../game/types';
import { ShotHistory } from './ShotHistory';

type StatusPanelProps = {
  state: GameState;
  remainingCount: number;
  isComputerThinking?: boolean;
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

const formatLastComputerResult = (state: GameState, isComputerThinking: boolean): string => {
  if (isComputerThinking) {
    return 'Computer is sizing up your wall...';
  }

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

export function StatusPanel({ state, remainingCount, isComputerThinking = false, onReset }: StatusPanelProps) {
  const accuracy = getShotAccuracy(state);
  const formationDamage = getPlayerFormationDamage(state);
  const matchStats = getMatchStats(state);
  const outcome = getGameOutcome(state);
  const momentum = getMomentumLevel(state);
  const outcomeLabel = outcome === 'won' ? 'Win' : outcome === 'lost' ? 'Loss' : 'Playing';
  const momentumLabel = momentum === 'surging' ? 'Surging attack' : momentum === 'pressing' ? 'Pressing high' : 'Build-up play';
  const momentumDetail =
    momentum === 'surging'
      ? 'Three-hit streak. The crowd is on its feet.'
      : momentum === 'pressing'
        ? 'Keep the pressure on with another clean hit.'
        : 'Find a target to build momentum.';

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
          <strong>{DIFFICULTY_LABELS[state.settings.difficulty]}</strong>
          <span>Difficulty</span>
        </div>
        <div>
          <strong>{state.computerShotCount}</strong>
          <span>Computer shots</span>
        </div>
        <div className={`damage-stat ${formationDamage >= 75 ? 'damage-stat--danger' : ''}`}>
          <strong>{formationDamage}%</strong>
          <span>Formation damage</span>
        </div>
        <div className={`outcome-stat outcome-stat--${outcome}`}>
          <strong>{outcomeLabel}</strong>
          <span>Outcome</span>
        </div>
      </div>

      <div className="match-statline" aria-label="Match statline">
        <span>Human: {matchStats.humanHits} hits / {matchStats.humanMisses} misses</span>
        <span>Computer: {matchStats.computerHits} hits / {matchStats.computerMisses} misses</span>
      </div>

      <p className={`result result--${state.isLost ? 'lost' : state.lastResult?.outcome ?? 'ready'}`}>
        {formatLastResult(state)}
      </p>
      <div className={`momentum-card momentum-card--${momentum}`} aria-label="Attack momentum">
        <span>{momentumLabel}</span>
        <strong>{state.currentStreak}</strong>
        <p>{momentumDetail}</p>
      </div>
      <p
        className={`computer-result computer-result--${
          isComputerThinking ? 'thinking' : state.lastComputerResult?.outcome ?? 'ready'
        }`}
      >
        {formatLastComputerResult(state, isComputerThinking)}
      </p>

      <div className="shot-history-grid">
        <ShotHistory
          state={state}
          side="human"
          title="Your recent shots"
          emptyText="Your first shot will appear here."
        />
        <ShotHistory
          state={state}
          side="computer"
          title="Computer recent shots"
          emptyText="Computer shots appear after counted turns."
        />
      </div>

      <button type="button" className="reset-button" onClick={onReset}>
        New game
      </button>
    </aside>
  );
}
