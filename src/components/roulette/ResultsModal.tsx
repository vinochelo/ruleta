"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, RotateCcw, TimerIcon, XCircle, Play } from 'lucide-react';
import Timer, { type TimerProps } from '@/components/timer/Timer';
import { useToast } from '@/hooks/use-toast';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategoryName: string | null;
  selectedWord: string | null;
  selectedCategoryColor: string | null;
  speakTimeSelection: (duration: number) => void;
  speakFn: (text: string) => void;
}

const TIMER_OPTIONS = [
  { duration: 30, color: "bg-sky-500 hover:bg-sky-600", textColor: "text-white", Icon: TimerIcon },
  { duration: 60, color: "bg-emerald-500 hover:bg-emerald-600", textColor: "text-white", Icon: TimerIcon },
  { duration: 90, color: "bg-amber-500 hover:bg-amber-600", textColor: "text-white", Icon: TimerIcon },
  { duration: 120, color: "bg-rose-500 hover:bg-rose-600", textColor: "text-white", Icon: TimerIcon },
];

const ResultsModal: React.FC<ResultsModalProps> = ({
  isOpen,
  onClose,
  selectedCategoryName,
  selectedWord,
  selectedCategoryColor,
  speakTimeSelection,
  speakFn,
}) => {
  const [activeTimerDuration, setActiveTimerDuration] = useState<number | null>(null);
  const [isPictionaryRoundActive, setIsPictionaryRoundActive] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setActiveTimerDuration(null);
      setIsPictionaryRoundActive(false);
    } else {
      setActiveTimerDuration(null);
      setIsPictionaryRoundActive(false);
      setTimerKey(prev => prev + 1); 
    }
  }, [isOpen]);


  const handleTimeButtonClick = (duration: number) => {
    speakTimeSelection(duration);
    setActiveTimerDuration(duration);
    setIsPictionaryRoundActive(true);
    setTimerKey(prevKey => prevKey + 1); 
    toast({ title: "¡A dibujar!", description: `Tienes ${duration} segundos para "${selectedWord}".` });
  };

  const handleTimerEndInternal = useCallback(() => {
    setIsPictionaryRoundActive(false);
    toast({ title: "¡Tiempo!", description: "La ronda ha terminado.", variant: "destructive" });
    
    if (selectedWord) {
        setTimeout(() => {
            speakFn(`La palabra era ${selectedWord}.`);
        }, 2000); 
    }
  }, [selectedWord, speakFn, toast]);
  
  const handleCloseDialog = () => {
    setActiveTimerDuration(null);
    setIsPictionaryRoundActive(false);
    onClose();
  };

  const handleResetTimerSelection = () => {
    setActiveTimerDuration(null);
    setIsPictionaryRoundActive(false);
    setTimerKey(prevKey => prevKey + 1); 
  }

  if (!selectedCategoryName ) return null;
  const wordStyle = { color: selectedCategoryColor || 'hsl(var(--primary))' };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseDialog();}}>
      <DialogContent className="sm:max-w-lg bg-card shadow-xl rounded-lg">
        <DialogHeader className="p-6">
          <DialogTitle className="flex items-center gap-2 text-3xl title-text">
            <Gift className="h-8 w-8 text-primary" />
            Ronda de Pictionary
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2 text-xl">
            Categoría: <span className="font-semibold text-foreground">{selectedCategoryName}</span>
          </DialogDescription>
        </DialogHeader>

        
        {selectedWord && !activeTimerDuration && (
            <div className="p-6 pt-0 pb-4 text-center">
                <p className="text-xl text-muted-foreground mb-1">
                    Palabra a dibujar:
                </p>
                <p className="text-7xl font-bold break-words leading-tight" style={wordStyle}>
                {selectedWord}
                </p>
            </div>
        )}
        
        <div className="px-6 pb-4">
          {activeTimerDuration && selectedWord ? ( 
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-xl text-muted-foreground">Dibujando:</p>
                <p className="text-7xl font-bold break-words leading-tight" style={wordStyle}>{selectedWord}</p>
              </div>
              <Timer
                key={timerKey}
                initialDuration={activeTimerDuration}
                onTimerEnd={handleTimerEndInternal}
                autoStart={isPictionaryRoundActive} 
              />
               {isPictionaryRoundActive && ( 
                 <Button onClick={handleResetTimerSelection} variant="outline" className="w-full transition-transform hover:scale-105">
                    <RotateCcw className="mr-2 h-4 w-4" /> Cambiar Tiempo / Reiniciar Palabra
                 </Button>
               )}
            </div>
          ) : ( 
            <>
              <h3 className="text-xl font-medium text-center mb-6 text-foreground/90">Selecciona el Tiempo:</h3>
              <div className="grid grid-cols-2 gap-4">
                {TIMER_OPTIONS.map(({ duration, color, textColor, Icon }) => (
                  <Button
                    key={duration}
                    onClick={() => handleTimeButtonClick(duration)}
                    className={`text-xl py-8 transition-transform hover:scale-105 w-full rounded-lg shadow-md ${color} ${textColor}`}
                  >
                    <Icon className="mr-2 h-6 w-6" />
                    {duration}s
                  </Button>
                ))}
              </div>
            </>
          )}
           {!isPictionaryRoundActive && activeTimerDuration && ( 
                <div className="text-center space-y-4 p-4 mt-4 bg-destructive/10 rounded-md">
                  <p className="text-2xl font-bold text-destructive">¡Se acabó el tiempo!</p>
                  <p className="text-lg text-muted-foreground">
                    La palabra era: <span className="font-bold text-foreground">{selectedWord}</span>
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 pt-4">
                    <Button onClick={handleResetTimerSelection} variant="outline" className="w-full transition-transform hover:scale-105 text-lg py-3">
                        <RotateCcw className="mr-2 h-5 w-5" /> Intentar de Nuevo
                    </Button>
                    <Button onClick={handleCloseDialog} className="w-full transition-transform hover:scale-105 text-lg py-3">
                        <Play className="mr-2 h-5 w-5" /> Girar Ruleta
                    </Button>
                  </div>
                </div>
              )}
        </div>

        <DialogFooter className="p-6 pt-4">
           {(!activeTimerDuration || isPictionaryRoundActive) && (
            <Button variant="outline" onClick={handleCloseDialog} className="transition-transform hover:scale-105 w-full sm:w-auto text-lg py-3">
              <XCircle className="mr-2 h-5 w-5" />
              Cerrar y Nueva Palabra
            </Button>
           )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResultsModal;
