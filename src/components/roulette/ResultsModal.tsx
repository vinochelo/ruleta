
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
import { Gift, Clock } from 'lucide-react';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategoryName: string | null;
  selectedWord: string | null;
  onStartPictionary: (duration: number) => void;
  speakTimeSelection: (duration: number) => void;
}

const TIMER_OPTIONS = [30, 60, 90, 120];

const ResultsModal: React.FC<ResultsModalProps> = ({
  isOpen,
  onClose,
  selectedCategoryName,
  selectedWord,
  onStartPictionary,
  speakTimeSelection,
}) => {
  if (!selectedCategoryName || !selectedWord) return null;

  const handleTimeButtonClick = (duration: number) => {
    speakTimeSelection(duration);
    onStartPictionary(duration);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card shadow-xl rounded-lg">
        <DialogHeader className="p-6">
          <DialogTitle className="flex items-center gap-2 text-2xl title-text">
            <Gift className="h-7 w-7 text-primary" />
            ¡A Dibujar!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            Categoría: <span className="font-semibold text-foreground">{selectedCategoryName}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 py-8 text-center bg-primary/10 rounded-md m-6 mt-0">
          <p className="text-sm text-muted-foreground mb-1">Palabra seleccionada:</p>
          <p className="text-6xl font-bold text-primary break-words leading-tight">
            {selectedWord}
          </p>
        </div>
        
        <div className="px-6 pb-4">
          <h3 className="text-md font-medium text-center mb-3 text-foreground/80">Selecciona el Tiempo:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIMER_OPTIONS.map((duration) => (
              <Button
                key={duration}
                onClick={() => handleTimeButtonClick(duration)}
                variant="secondary"
                className="transition-transform hover:scale-105 w-full"
              >
                <Clock className="mr-2 h-4 w-4" />
                {duration}s
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter className="p-6 pt-4">
          <Button variant="outline" onClick={onClose} className="transition-transform hover:scale-105 w-full sm:w-auto">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResultsModal;
    
