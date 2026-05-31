import { useMemo, useState } from 'react';
import './App.css';
import { GameBoard } from './components/GameBoard';
import { PlayerBoard } from './components/PlayerBoard';
import { StatusPanel } from './components/StatusPanel';
import { TargetList } from './components/TargetList';
import { createGame, getRemainingTargets, shootCell } from './game/gameState';
import type { Coordinate, GameState } from './game/types';

function App() {
  const [game, setGame] = useState<GameState>(() => createGame());
  const remainingTargets = useMemo(() => getRemainingTargets(game), [game]);

  const handleShoot = (coordinate: Coordinate) => {
    setGame((currentGame) => shootCell(currentGame, coordinate));
  };

  const handleReset = () => {
    setGame(createGame());
  };

  return (
    <main className="app-shell">
      <div className="hero-glow" aria-hidden="true" />
      <section className="game-layout">
        <StatusPanel state={game} remainingCount={remainingTargets.length} onReset={handleReset} />
        <div className="boards-panel" aria-label="Battle Soccer boards">
          <PlayerBoard state={game} />
          <GameBoard state={game} onShoot={handleShoot} />
        </div>
        <TargetList state={game} />
      </section>
    </main>
  );
}

export default App;
