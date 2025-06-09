
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Clock, RotateCcw } from 'lucide-react';
import Timer from '@/components/timer/Timer'; // Import Timer
import { useToast } from '@/hooks/use-toast';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategoryName: string | null;
  selectedWord: string | null;
  speakTimeSelection: (duration: number) => void;
}

const TIMER_OPTIONS = [
  { duration: 30, color: "bg-sky-500 hover:bg-sky-600", textColor: "text-white" },
  { duration: 60, color: "bg-emerald-500 hover:bg-emerald-600", textColor: "text-white" },
  { duration: 90, color: "bg-amber-500 hover:bg-amber-600", textColor: "text-white" },
  { duration: 120, color: "bg-rose-500 hover:bg-rose-600", textColor: "text-white" },
];

const ResultsModal: React.FC<ResultsModalProps> = ({
  isOpen,
  onClose,
  selectedCategoryName,
  selectedWord,
  speakTimeSelection,
}) => {
  const [activeTimerDuration, setActiveTimerDuration] = useState<number | null>(null);
  const [isPictionaryRoundActive, setIsPictionaryRoundActive] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // To reset Timer component
  const { toast } = useToast();

  useEffect(() => {
    // Reset timer state when modal is closed or reopened for a new word
    if (!isOpen) {
      setActiveTimerDuration(null);
      setIsPictionaryRoundActive(false);
    } else {
      // If opening for a new round (selectedWord might change), ensure timer is reset.
      // This might not be strictly necessary if timerKey is managed well, but good for safety.
      setActiveTimerDuration(null);
      setIsPictionaryRoundActive(false);
      setTimerKey(prev => prev + 1); 
    }
  }, [isOpen, selectedWord]);


  const handleTimeButtonClick = (duration: number) => {
    speakTimeSelection(duration);
    setActiveTimerDuration(duration);
    setIsPictionaryRoundActive(true);
    setTimerKey(prevKey => prevKey + 1); // Force Timer to re-mount/re-initialize
    toast({ title: "¡A dibujar!", description: `Tienes ${duration} segundos para "${selectedWord}".` });
  };

  const handleTimerEndInternal = () => {
    setIsPictionaryRoundActive(false);
    toast({ title: "¡Tiempo!", description: "La ronda ha terminado.", variant: "destructive" });
    // Optionally, allow selecting time again or show a "Round Over" message
    // For now, timer disappears, time buttons reappear.
  };
  
  const handleCloseDialog = () => {
    setActiveTimerDuration(null);
    setIsPictionaryRoundActive(false);
    onClose(); // Call the original onClose passed from parent
  };

  const handleResetTimerSelection = () => {
    setActiveTimerDuration(null);
    setIsPictionaryRoundActive(false);
    setTimerKey(prevKey => prevKey + 1);
  }

  if (!selectedCategoryName ) return null; // Word might not be available if timer active

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); else onClose();}}>
      <DialogContent className="sm:max-w-lg bg-card shadow-xl rounded-lg">
        <DialogHeader className="p-6">
          <DialogTitle className="flex items-center gap-2 text-3xl title-text">
            <Gift className="h-8 w-8 text-primary" />
            Ronda de Pictionary
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2 text-lg">
            Categoría: <span className="font-semibold text-foreground">{selectedCategoryName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Word Display: Only if timer is not active or about to start for this word */}
        {selectedWord && !activeTimerDuration && (
            <div className="p-6 pt-2 pb-8 text-center bg-primary/10 rounded-md m-6 mt-0">
                <p className="text-lg text-muted-foreground mb-1">Palabra a dibujar:</p>
                <p className="text-7xl font-bold text-primary break-words leading-tight">
                {selectedWord}
                </p>
            </div>
        )}
        
        {/* Timer or Time Selection */}
        <div className="px-6 pb-4">
          {activeTimerDuration && isPictionaryRoundActive && selectedWord ? (
            <div className="space-y-4">
               <p className="text-center text-lg">Dibujando: <span className="font-bold text-primary text-2xl">{selectedWord}</span></p>
              <Timer
                key={timerKey}
                initialDuration={activeTimerDuration}
                onTimerEnd={handleTimerEndInternal}
                autoStart={true}
              />
              <Button onClick={handleResetTimerSelection} variant="outline" className="w-full transition-transform hover:scale-105">
                <RotateCcw className="mr-2 h-4 w-4" /> Cambiar Tiempo / Reiniciar Palabra
              </Button>
            </div>
          ) : activeTimerDuration && !isPictionaryRoundActive && selectedWord ? (
             <div className="text-center space-y-4">
                <p className="text-2xl font-bold text-destructive">¡Se acabó el tiempo para "{selectedWord}"!</p>
                 <Button onClick={handleResetTimerSelection} variant="outline" className="w-full transition-transform hover:scale-105">
                    <Clock className="mr-2 h-4 w-4" /> Elegir Nuevo Tiempo Para Esta Palabra
                </Button>
             </div>
          ) : (
            <>
              <h3 className="text-xl font-medium text-center mb-4 text-foreground/90">Selecciona el Tiempo:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                {TIMER_OPTIONS.map(({ duration, color, textColor }) => (
                  <Button
                    key={duration}
                    onClick={() => handleTimeButtonClick(duration)}
                    className={`text-lg py-6 transition-transform hover:scale-105 w-full ${color} ${textColor}`}
                  >
                    <Clock className="mr-2 h-5 w-5" />
                    {duration}s
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="p-6 pt-4">
          <Button variant="outline" onClick={handleCloseDialog} className="transition-transform hover:scale-105 w-full sm:w-auto text-lg py-3">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResultsModal;
