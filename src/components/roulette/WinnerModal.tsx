"use client";

import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Play } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  score: number;
}

interface WinnerModalProps {
  winner: Team | null;
  onPlayAgain: () => void;
  praiseMessage: string | null;
}

const confettiColors = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6'];

const Confetti = () => (
  <div className="confetti-container" aria-hidden="true">
    {Array.from({ length: 50 }).map((_, i) => (
      <div
        key={i}
        className="confetti-piece"
        style={{
          left: `${Math.random() * 100}%`,
          backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          animationDuration: `${2 + Math.random() * 3}s`,
          animationDelay: `${Math.random() * 5}s`,
          transform: `rotate(${Math.random() * 360}deg)`
        }}
      />
    ))}
  </div>
);


const WinnerModal: React.FC<WinnerModalProps> = ({ winner, onPlayAgain, praiseMessage }) => {
  const winnerSoundRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (winner && winnerSoundRef.current) {
      winnerSoundRef.current.volume = 0.5;
      winnerSoundRef.current.play().catch(console.error);
    }
  }, [winner]);

  if (!winner) {
    return null;
  }

  return (
    <Dialog open={!!winner} onOpenChange={(open) => { if (!open) onPlayAgain() }}>
      <DialogContent className="sm:max-w-md bg-card shadow-xl rounded-lg overflow-hidden">
        <Confetti />
        <audio
          ref={winnerSoundRef}
          src="https://cdn.pixabay.com/download/audio/2022/11/22/audio_5177114b82.mp3?filename=success-fanfare-trumpets-6185.mp3"
          preload="auto"
        />
        <DialogHeader className="p-6 items-center text-center z-20">
          <Trophy className="h-20 w-20 text-yellow-400 mb-4 drop-shadow-lg" />
          <DialogTitle className="title-text text-3xl">
            ¡Felicidades, {winner.name}!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2 text-lg">
            {praiseMessage ? praiseMessage : `¡Han ganado la partida!`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="p-6 pt-0 z-20">
          <Button onClick={onPlayAgain} className="w-full transition-transform hover:scale-105 text-lg py-3">
            <Play className="mr-2 h-5 w-5" />
            Jugar de Nuevo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WinnerModal;
