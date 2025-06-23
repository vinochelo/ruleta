"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, TimerIcon, XCircle, Play, Image as ImageIcon, Loader2 } from 'lucide-react';
import Timer from '@/components/timer/Timer';
import { useToast } from '@/hooks/use-toast';
import { generateImageForWord } from '@/ai/flows/generate-image-flow';

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
  selectedCategoryColor,
  speakTimeSelection,
  speakFn,
}) => {
  const [activeTimerDuration, setActiveTimerDuration] = useState<number | null>(null);
  const [isPictionaryRoundActive, setIsPictionaryRoundActive] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setActiveTimerDuration(null);
      setIsPictionaryRoundActive(false);
      setGeneratedImageUrl(null);
    } else {
      setActiveTimerDuration(null);
      setIsPictionaryRoundActive(false);
      setTimerKey(prev => prev + 1);

      if (selectedWord) {
        setIsGeneratingImage(true);
        setGeneratedImageUrl(null);
        
        generateImageForWord({ word: selectedWord })
          .then(result => {
            if (result.imageDataUri) {
              setGeneratedImageUrl(result.imageDataUri);
            } else {
                toast({
                    title: "Error de Imagen",
                    description: "No se pudo generar una imagen para esta palabra.",
                    variant: "destructive"
                });
            }
          })
          .catch(error => {
            console.error("AI image generation error:", error);
            toast({
              title: "Error de Imagen",
              description: "No se pudo generar una imagen para la palabra.",
              variant: "destructive"
            });
          })
          .finally(() => {
            setIsGeneratingImage(false);
          });
      }
    }
  }, [isOpen, selectedWord, toast]);

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
  };

  if (!selectedCategoryName) return null;

  const wordStyle = { color: selectedCategoryColor || 'hsl(var(--primary))' };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
      <DialogContent className="w-screen h-screen max-w-full max-h-full bg-card/90 backdrop-blur-lg border-0 shadow-none flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
        
        <div className="absolute top-4 right-4 z-50">
            <Button variant="ghost" onClick={handleCloseDialog} className="transition-transform hover:scale-110 h-12 w-12 rounded-full bg-black/20 hover:bg-black/30">
              <XCircle className="h-8 w-8 text-white" />
              <span className="sr-only">Cerrar</span>
            </Button>
        </div>

        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 h-full">
          
          {/* Image and Word Section */}
          <div className="flex-1 w-full lg:max-w-2xl flex flex-col items-center justify-center text-center gap-4">
            <div className="w-full aspect-square max-w-md lg:max-w-lg bg-card rounded-2xl shadow-2xl flex items-center justify-center p-4 relative overflow-hidden border-4" style={{borderColor: selectedCategoryColor || 'hsl(var(--primary))'}}>
                {isGeneratingImage && (
                    <div className="flex flex-col items-center justify-center gap-4 text-primary">
                        <Loader2 className="h-16 w-16 animate-spin" />
                        <p className="text-xl font-medium">Creando imagen...</p>
                    </div>
                )}
                {!isGeneratingImage && generatedImageUrl && (
                    <Image src={generatedImageUrl} alt={`Generated image for ${selectedWord}`} layout="fill" objectFit="contain" className="p-4" unoptimized/>
                )}
                 {!isGeneratingImage && !generatedImageUrl && (
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                        <ImageIcon className="h-16 w-16" />
                        <p className="text-xl font-medium">No se pudo generar la imagen</p>
                    </div>
                )}
            </div>
            
            {selectedWord && (
                <div className="mt-4">
                    <p className="text-xl text-muted-foreground">Palabra a dibujar</p>
                    <p className="text-7xl lg:text-8xl font-bold break-words leading-tight" style={wordStyle}>
                    {selectedWord}
                    </p>
                </div>
            )}
          </div>

          {/* Timer and Controls Section */}
          <div className="flex-1 w-full lg:max-w-md flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Categoría</p>
              <p className="text-5xl lg:text-6xl font-bold font-roulette" style={wordStyle}>
                {selectedCategoryName}
              </p>
            </div>
            
            {activeTimerDuration && selectedWord ? (
              <div className="w-full space-y-4">
                <Timer
                  key={timerKey}
                  initialDuration={activeTimerDuration}
                  onTimerEnd={handleTimerEndInternal}
                  autoStart={isPictionaryRoundActive}
                />
              </div>
            ) : (
              <div className="w-full space-y-6">
                <h3 className="text-xl font-medium text-center text-foreground/90">Selecciona el Tiempo:</h3>
                <div className="grid grid-cols-2 gap-4">
                  {TIMER_OPTIONS.map(({ duration, color, textColor }) => (
                    <Button
                      key={duration}
                      onClick={() => handleTimeButtonClick(duration)}
                      className={`text-2xl font-bold py-8 transition-transform hover:scale-105 w-full rounded-lg shadow-lg ${color} ${textColor}`}
                    >
                      <TimerIcon className="mr-2 h-6 w-6" />
                      {duration}s
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {!isPictionaryRoundActive && activeTimerDuration && (
                <div className="text-center space-y-4 p-6 mt-4 bg-background/50 rounded-2xl w-full shadow-lg">
                    <p className="text-2xl font-bold text-destructive">¡Se acabó el tiempo!</p>
                    <div className="grid sm:grid-cols-2 gap-4 pt-4">
                        <Button onClick={handleResetTimerSelection} className="w-full transition-transform hover:scale-105 text-lg py-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg">
                            <RotateCcw className="mr-2 h-5 w-5" /> Intentar de Nuevo
                        </Button>
                        <Button onClick={handleCloseDialog} className="w-full transition-transform hover:scale-105 text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg">
                            <Play className="mr-2 h-5 w-5" /> Girar Ruleta
                        </Button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResultsModal;
