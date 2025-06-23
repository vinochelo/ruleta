
"use client";

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
}

const WinnerModal: React.FC<WinnerModalProps> = ({ winner, onPlayAgain }) => {
  if (!winner) {
    return null;
  }

  return (
    <Dialog open={!!winner} onOpenChange={(open) => { if (!open) onPlayAgain() }}>
      <DialogContent className="sm:max-w-md bg-card shadow-xl rounded-lg">
        <DialogHeader className="p-6 items-center text-center">
          <Trophy className="h-20 w-20 text-yellow-400 mb-4" />
          <DialogTitle className="title-text text-3xl">
            ¡Felicidades, {winner.name}!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2 text-lg">
            Han ganado la partida con {winner.score} puntos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="p-6 pt-0">
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
