
"use client";

import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Play } from 'lucide-react';
import AdBanner from '../ads/AdBanner';

interface Team {
  id: string;
  name: string;
  score: number;
  color?: string;
}

interface WinnerModalProps {
  winner: Team | null;
  onPlayAgain: () => void;
  praiseMessage: string | null;
  gameMode: 'teams' | 'players';
}

const confettiColors = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6'];

const Confetti = () => (
  <div className="confetti-container" aria-hidden="true">
    {Array.from({ length: 150 }).map((_, i) => (
      <div
        key={i}
        className="confetti-piece"
        style={{
          left: `${Math.random() * 100}%`,
          backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          animationDuration: `${3 + Math.random() * 4}s`,
          animationDelay: `${Math.random() * 5}s`,
          transform: `rotate(${Math.random() * 360}deg)`
        }}
      />
    ))}
  </div>
);


const WinnerModal: React.FC<WinnerModalProps> = ({ winner, onPlayAgain, praiseMessage, gameMode }) => {
  const winnerSoundRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (winner && winnerSoundRef.current) {
      winnerSoundRef.current.volume = 0.5;
      winnerSoundRef.current.play().catch(() => {});
    }
  }, [winner]);

  if (!winner) {
    return null;
  }

  const winnerNameStyle = {
    color: winner.color || 'hsl(var(--primary))',
  };

  const winnerNameLength = winner.name.length || 0;
  let winnerNameFontSizeClass = 'text-8xl';
  if (winnerNameLength > 8) {
    winnerNameFontSizeClass = 'text-7xl';
  }
  if (winnerNameLength > 12) {
    winnerNameFontSizeClass = 'text-6xl';
  }
  if (winnerNameLength > 16) {
    winnerNameFontSizeClass = 'text-5xl';
  }
  if (winnerNameLength > 20) {
    winnerNameFontSizeClass = 'text-4xl';
  }

  return (
    <Dialog open={!!winner} onOpenChange={(open) => { if (!open) onPlayAgain() }}>
      <DialogContent className="w-screen h-screen max-w-full max-h-full bg-card/80 backdrop-blur-xl border-0 shadow-none flex items-center justify-center p-0">
        <DialogTitle className="sr-only">¡Ganador!</DialogTitle>
        <DialogDescription className="sr-only">
          {`El ${gameMode === 'teams' ? 'equipo' : 'jugador'} ${winner.name} ha ganado la partida. ${praiseMessage || '¡Felicidades!'}`}
        </DialogDescription>
        <Confetti />
        <audio
          ref={winnerSoundRef}
          src="https://cdn.pixabay.com/download/audio/2022/11/22/audio_5177114b82.mp3?filename=success-fanfare-trumpets-6185.mp3"
          preload="auto"
        />
        <div className="flex flex-col items-center justify-center text-center p-6 z-20 space-y-8">
            <Trophy className="h-48 w-48 text-yellow-400 drop-shadow-[0_8px_8px_rgba(0,0,0,0.4)]" />
            <div className='space-y-4'>
                <h1 className="text-6xl font-bold title-text">
                    ¡Felicidades!
                </h1>
                <p className={`${winnerNameFontSizeClass} font-bold break-words`} style={winnerNameStyle}>
                    {winner.name}
                </p>
                <p className="text-2xl text-foreground/80 max-w-3xl mx-auto">
                    {praiseMessage ? praiseMessage : `¡${gameMode === 'teams' ? 'Han' : 'Has'} ganado la partida!`}
                </p>
            </div>
            <Button onClick={onPlayAgain} className="w-full max-w-xs transition-transform hover:scale-105 text-2xl py-8 mt-8 rounded-full">
                <Play className="mr-4 h-8 w-8" />
                Jugar de Nuevo
            </Button>
            <div className="w-full max-w-md">
              <AdBanner slot="winner" />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WinnerModal;
