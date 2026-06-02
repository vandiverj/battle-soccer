import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { GameBoard } from './components/GameBoard';
import { PlayerBoard } from './components/PlayerBoard';
import { StatusPanel } from './components/StatusPanel';
import { TargetList } from './components/TargetList';
import { placeTargetAt, placeTargets } from './game/placement';
import {
  COMPUTER_TURN_DELAYS_MS,
  DEFAULT_MATCH_SETTINGS,
  DIFFICULTY_LABELS,
  MATCH_LENGTH_LABELS,
  MATCH_SHOT_LIMITS,
  createGame,
  getMatchStats,
  getRemainingTargets,
  playComputerTurn,
  shootPowerShot,
  shootCell,
} from './game/gameState';
import { GRID_SIZE, TARGET_DEFINITIONS } from './game/targets';
import type { Coordinate, DifficultyLevel, GameState, MatchLength, MatchSettings, Orientation, PlacedTarget } from './game/types';

function App() {
  const [matchSettings, setMatchSettings] = useState<MatchSettings>(DEFAULT_MATCH_SETTINGS);
  const [placedFormations, setPlacedFormations] = useState<PlacedTarget[]>([]);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [placementMessage, setPlacementMessage] = useState('Place your defensive wall before kickoff.');
  const [shotMode, setShotMode] = useState<'normal' | 'power'>('normal');
  const [game, setGame] = useState<GameState>(() => createGame(GRID_SIZE, undefined, [], DEFAULT_MATCH_SETTINGS));
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const remainingTargets = useMemo(() => getRemainingTargets(game), [game]);
  const matchStats = useMemo(() => getMatchStats(game), [game]);
  const outcome = game.isWon ? 'won' : game.isLost ? 'lost' : null;
  const activeTarget = TARGET_DEFINITIONS[placedFormations.length];
  const isSetupComplete = placedFormations.length === TARGET_DEFINITIONS.length;

  useEffect(() => {
    if (!isComputerThinking) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setGame((currentGame) => playComputerTurn(currentGame));
      setIsComputerThinking(false);
    }, COMPUTER_TURN_DELAYS_MS[game.settings.difficulty]);

    return () => window.clearTimeout(timer);
  }, [game.settings.difficulty, isComputerThinking]);

  const handleShoot = (coordinate: Coordinate) => {
    if (!isGameStarted || isComputerThinking || game.isWon || game.isLost) {
      return;
    }

    const nextGame = shotMode === 'power' ? shootPowerShot(game, coordinate) : shootCell(game, coordinate);
    setGame(nextGame);
    if (nextGame.lastResult?.shotCounted || !nextGame.powerShotAvailable) {
      setShotMode('normal');
    }

    if (nextGame.lastResult?.shotCounted && !nextGame.lastResult.won && !nextGame.isLost) {
      setIsComputerThinking(true);
    }
  };

  const handleReset = () => {
    setIsComputerThinking(false);
    setIsGameStarted(false);
    setShotMode('normal');
    setPlacedFormations([]);
    setPlacementMessage('Place your defensive wall before kickoff.');
    setGame(createGame(GRID_SIZE, undefined, [], matchSettings));
  };

  const handleDifficultyChange = (difficulty: DifficultyLevel) => {
    if (isGameStarted) {
      return;
    }

    const nextSettings = { ...matchSettings, difficulty };
    setMatchSettings(nextSettings);
    setGame((currentGame) => ({
      ...currentGame,
      settings: nextSettings,
      shotLimit: MATCH_SHOT_LIMITS[nextSettings.matchLength],
    }));
    setPlacementMessage(`${DIFFICULTY_LABELS[difficulty]} selected. Place your defensive wall before kickoff.`);
  };

  const handleMatchLengthChange = (matchLength: MatchLength) => {
    if (isGameStarted) {
      return;
    }

    const nextSettings = { ...matchSettings, matchLength };
    setMatchSettings(nextSettings);
    setGame((currentGame) => ({
      ...currentGame,
      settings: nextSettings,
      shotLimit: MATCH_SHOT_LIMITS[nextSettings.matchLength],
    }));
    setPlacementMessage(`${MATCH_LENGTH_LABELS[matchLength]} selected. Place your defensive wall before kickoff.`);
  };

  const handlePlaceFormation = (coordinate: Coordinate) => {
    if (!activeTarget) {
      return;
    }

    const placedTarget = placeTargetAt(activeTarget, coordinate, orientation, placedFormations, GRID_SIZE);

    if (!placedTarget) {
      setPlacementMessage(`${activeTarget.name} will not fit there. Rotate or choose a clear lane.`);
      return;
    }

    const nextPlacedFormations = [...placedFormations, placedTarget];
    setPlacedFormations(nextPlacedFormations);
    setGame((currentGame) => ({
      ...currentGame,
      playerFormations: nextPlacedFormations,
    }));
    setPlacementMessage(
      nextPlacedFormations.length === TARGET_DEFINITIONS.length
        ? 'Wall complete. Kick off when ready.'
        : `Placed ${activeTarget.name}. Next: ${TARGET_DEFINITIONS[nextPlacedFormations.length].name}.`,
    );
  };

  const handleUndoPlacement = () => {
    const nextPlacedFormations = placedFormations.slice(0, -1);
    setPlacedFormations(nextPlacedFormations);
    setGame((currentGame) => ({
      ...currentGame,
      playerFormations: nextPlacedFormations,
    }));
    setPlacementMessage(nextPlacedFormations.length ? 'Last placement removed.' : 'Place your defensive wall before kickoff.');
  };

  const handleRandomPlacement = () => {
    const randomFormations = placeTargets(TARGET_DEFINITIONS, GRID_SIZE);
    setPlacedFormations(randomFormations);
    setGame((currentGame) => ({
      ...currentGame,
      playerFormations: randomFormations,
    }));
    setPlacementMessage('Wall auto-filled. Kick off when ready.');
  };

  const handleKickoff = () => {
    if (!isSetupComplete) {
      setPlacementMessage('Place every wall piece before kickoff.');
      return;
    }

    setIsGameStarted(true);
    setIsComputerThinking(false);
    setShotMode('normal');
    setGame(createGame(GRID_SIZE, undefined, placedFormations, matchSettings));
  };

  return (
    <main className={`app-shell ${outcome ? `app-shell--${outcome}` : ''}`}>
      <div className="hero-glow" aria-hidden="true" />
      {outcome ? (
        <div className={`endgame-fx endgame-fx--${outcome}`} aria-hidden="true">
          <span className="endgame-fx__beam endgame-fx__beam--one" />
          <span className="endgame-fx__beam endgame-fx__beam--two" />
          <span className="endgame-fx__beam endgame-fx__beam--three" />
        </div>
      ) : null}
      {outcome ? (
        <div className={`outcome-burst outcome-burst--${outcome}`} role="status" aria-live="polite">
          <div className="outcome-burst__badge" aria-hidden="true">
            {outcome === 'won' ? 'FT' : '90'}
          </div>
          <div>
            <p className="outcome-burst__eyebrow">{outcome === 'won' ? 'Full-time victory' : 'Final whistle'}</p>
            <p className="outcome-burst__title">
              {outcome === 'won' ? 'You lifted the cup!' : 'The wall came down.'}
            </p>
            <p className="outcome-burst__stats">
              {matchStats.turnsPlayed} turns · {matchStats.accuracy ?? 0}% accuracy · {matchStats.formationDamage}% wall damage
            </p>
          </div>
        </div>
      ) : null}
      <section className="game-layout">
        <StatusPanel
          state={game}
          remainingCount={remainingTargets.length}
          isComputerThinking={isComputerThinking}
          shotMode={shotMode}
          onToggleShotMode={() => setShotMode((current) => (current === 'normal' && game.powerShotAvailable ? 'power' : 'normal'))}
          onReset={handleReset}
        />
        <div className="boards-panel" aria-label="Battle Soccer boards">
          {!isGameStarted ? (
            <section className="setup-panel" aria-label="Placement controls">
              <div>
                <p className="setup-panel__eyebrow">Pre-match setup</p>
                <h2>{activeTarget ? `Place ${activeTarget.name}` : 'Ready for kickoff'}</h2>
                <p>{placementMessage}</p>
              </div>
              <div className="setup-controls" aria-label="Formation placement controls">
                <div className="difficulty-selector" aria-label="Difficulty selection">
                  {(Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[]).map((difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      className={matchSettings.difficulty === difficulty ? 'difficulty-selector__button difficulty-selector__button--active' : 'difficulty-selector__button'}
                      onClick={() => handleDifficultyChange(difficulty)}
                    >
                      {DIFFICULTY_LABELS[difficulty]}
                    </button>
                  ))}
                </div>
                <div className="match-length-selector" aria-label="Match length selection">
                  {(Object.keys(MATCH_LENGTH_LABELS) as MatchLength[]).map((matchLength) => (
                    <button
                      key={matchLength}
                      type="button"
                      className={matchSettings.matchLength === matchLength ? 'difficulty-selector__button difficulty-selector__button--active' : 'difficulty-selector__button'}
                      onClick={() => handleMatchLengthChange(matchLength)}
                    >
                      {MATCH_LENGTH_LABELS[matchLength]}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setOrientation((current) => (current === 'horizontal' ? 'vertical' : 'horizontal'))}>
                  Rotate: {orientation}
                </button>
                <button type="button" onClick={handleUndoPlacement} disabled={!placedFormations.length}>
                  Undo
                </button>
                <button type="button" onClick={handleRandomPlacement}>
                  Auto-fill
                </button>
                <button type="button" className="setup-controls__primary" onClick={handleKickoff} disabled={!isSetupComplete}>
                  Kick off
                </button>
              </div>
              <div className="setup-pieces" aria-label="Formation pieces">
                {TARGET_DEFINITIONS.map((target, index) => (
                  <span
                    key={target.id}
                    className={`setup-piece ${index < placedFormations.length ? 'setup-piece--placed' : ''} ${
                      index === placedFormations.length ? 'setup-piece--active' : ''
                    }`}
                  >
                    {target.shortName} {target.length}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
          <PlayerBoard
            state={game}
            isComputerThinking={isComputerThinking}
            isPlacementMode={!isGameStarted}
            orientation={orientation}
            activeTarget={activeTarget}
            onPlace={handlePlaceFormation}
          />
          <GameBoard state={game} disabled={!isGameStarted || isComputerThinking} shotMode={shotMode} onShoot={handleShoot} />
        </div>
        <TargetList state={game} />
      </section>
    </main>
  );
}

export default App;
