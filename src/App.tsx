import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { GameBoard } from './components/GameBoard';
import { PlayerBoard } from './components/PlayerBoard';
import { StatusPanel } from './components/StatusPanel';
import { TargetList } from './components/TargetList';
import { createGame, getRemainingTargets, playComputerTurn, shootCell } from './game/gameState';
import type { Coordinate, GameState } from './game/types';

const COMPUTER_TURN_DELAY_MS = 700;

function App() {
  const [game, setGame] = useState<GameState>(() => createGame());
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const remainingTargets = useMemo(() => getRemainingTargets(game), [game]);
  const outcome = game.isWon ? 'won' : game.isLost ? 'lost' : null;

  useEffect(() => {
    if (!isComputerThinking) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setGame((currentGame) => playComputerTurn(currentGame));
      setIsComputerThinking(false);
    }, COMPUTER_TURN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isComputerThinking]);

  const handleShoot = (coordinate: Coordinate) => {
    if (isComputerThinking || game.isWon || game.isLost) {
      return;
    }

    const nextGame = shootCell(game, coordinate);
    setGame(nextGame);

    if (nextGame.lastResult?.shotCounted && !nextGame.lastResult.won) {
      setIsComputerThinking(true);
    }
  };

  const handleReset = () => {
    setIsComputerThinking(false);
    setGame(createGame());
  };

  return (
    <main className="app-shell">
      <div className="hero-glow" aria-hidden="true" />
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
          </div>
        </div>
      ) : null}
      <section className="game-layout">
        <StatusPanel
          state={game}
          remainingCount={remainingTargets.length}
          isComputerThinking={isComputerThinking}
          onReset={handleReset}
        />
        <div className="boards-panel" aria-label="Battle Soccer boards">
          <PlayerBoard state={game} isComputerThinking={isComputerThinking} />
          <GameBoard state={game} disabled={isComputerThinking} onShoot={handleShoot} />
        </div>
        <TargetList state={game} />
      </section>
    </main>
  );
}

export default App;
