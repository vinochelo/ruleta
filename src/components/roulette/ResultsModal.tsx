"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, TimerIcon, X, Play, Image as ImageIcon, Loader2 } from 'lucide-react';
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
  useAIImages: boolean;
}

type DisplayState = 'generating' | 'sequencing' | 'revealed';

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
  useAIImages,
}) => {
  const [activeTimerDuration, setActiveTimerDuration] = useState<number | null>(null);
  const [isPictionaryRoundActive, setIsPictionaryRoundActive] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  
  const [displayState, setDisplayState] = useState<DisplayState>('revealed');
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    // This effect runs whenever the modal is opened with a new word.
    if (isOpen) {
      // Reset state for the new round
      setActiveTimerDuration(null);
      setIsPictionaryRoundActive(false);
      setTimerKey(prev => prev + 1);
      
      setGeneratedImageUrls([]);
      setCurrentImageIndex(0);

      if (selectedWord && useAIImages) {
        setDisplayState('generating');
        generateImageForWord({ word: selectedWord })
          .then(result => {
            if (result.imageDataUris && result.imageDataUris.length > 0) {
              setGeneratedImageUrls(result.imageDataUris);
              setDisplayState('sequencing');
            } else {
              toast({
                  title: "Error de Imagen",
                  description: "No se pudieron generar imágenes. Mostrando la palabra.",
                  variant: "destructive"
              });
              setDisplayState('revealed');
            }
          })
          .catch(error => {
            console.error("AI image generation error:", error);
            toast({
              title: "Error de Imagen",
              description: "No se pudo generar una imagen para la palabra.",
              variant: "destructive"
            });
            setDisplayState('revealed');
          });
      } else {
        setDisplayState('revealed');
      }
    }
  }, [isOpen, selectedWord, useAIImages, toast]);

  useEffect(() => {
    if (displayState !== 'sequencing') return;

    const timer = setTimeout(() => {
      if (currentImageIndex < generatedImageUrls.length - 1) {
        setCurrentImageIndex(prev => prev + 1);
      } else {
        setDisplayState('revealed');
      }
    }, 3000); // 3 seconds per image

    return () => clearTimeout(timer);
  }, [displayState, currentImageIndex, generatedImageUrls]);


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

  const renderImageAndWordContent = () => {
    const wordStyle = { color: selectedCategoryColor || 'hsl(var(--primary))' };
    
    switch (displayState) {
      case 'generating':
        return (
          <div className="flex flex-col items-center justify-center gap-4 text-primary">
            <Loader2 className="h-16 w-16 animate-spin" />
            <p className="text-xl font-medium">Creando imágenes...</p>
          </div>
        );
      case 'sequencing':
        const currentImageUrl = generatedImageUrls[currentImageIndex];
        return (
          <>
            {currentImageUrl ? (
              <Image src={currentImageUrl} alt={`Generated image ${currentImageIndex + 1} for ${selectedWord}`} layout="fill" objectFit="contain" className="p-4" unoptimized/>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <ImageIcon className="h-16 w-16" />
                <p className="text-xl font-medium">Error al cargar imagen</p>
              </div>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center flex-col gap-2">
                <p className="text-2xl font-bold text-foreground/80 animate-pulse">¡Adivina la palabra!</p>
                <div className="flex gap-2">
                    {generatedImageUrls.map((_, index) => (
                        <div key={index} className={`h-3 w-3 rounded-full transition-all ${index === currentImageIndex ? 'bg-primary scale-125' : 'bg-muted'}`} />
                    ))}
                </div>
            </div>
          </>
        );
      case 'revealed':
        return (
          <div className="text-center">
            <p className="text-xl text-muted-foreground">Palabra a dibujar</p>
            <p className="text-7xl lg:text-8xl font-bold break-words leading-tight" style={wordStyle}>
              {selectedWord}
            </p>
          </div>
        );
    }
  };


  if (!selectedCategoryName) return null;

  const wordStyle = { color: selectedCategoryColor || 'hsl(var(--primary))' };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
      <DialogContent 
        showCloseButton={false} 
        className="w-screen h-screen max-w-full max-h-full bg-card/90 backdrop-blur-lg border-0 shadow-none flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto"
      >
        <DialogTitle className="sr-only">Resultado de la Ruleta</DialogTitle>
        <DialogDescription className="sr-only">
          La categoría seleccionada es {selectedCategoryName} y la palabra a dibujar es {selectedWord}.
        </DialogDescription>
        
        <DialogClose asChild>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110"
            aria-label="Cerrar"
          >
            <X className="h-8 w-8" />
          </Button>
        </DialogClose>

        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 h-full">
          
          {/* Image and Word Section */}
          <div className="flex-1 w-full lg:max-w-2xl flex flex-col items-center justify-center text-center gap-4">
            <div className="w-full aspect-square max-w-md lg:max-w-lg bg-card rounded-2xl shadow-2xl flex items-center justify-center p-4 relative overflow-hidden border-4" style={{borderColor: selectedCategoryColor || 'hsl(var(--primary))'}}>
                {renderImageAndWordContent()}
            </div>
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
                      disabled={displayState !== 'revealed'}
                    >
                      <TimerIcon className="mr-2 h-6 w-6" />
                      {duration}s
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {!isPictionaryRoundActive && activeTimerDuration && (
              <div className="text-center space-y-4 p-6 mt-4 bg-card/80 backdrop-blur-sm rounded-2xl w-full max-w-md shadow-xl border border-border/20">
                <p className="text-3xl font-bold text-destructive">¡Se acabó el tiempo!</p>
                <p className="text-muted-foreground pb-2">¿Qué hacemos ahora?</p>
                <div className="flex flex-col gap-4">
                  <Button onClick={handleCloseDialog} size="lg" className="w-full transition-transform hover:scale-105 text-lg py-7 rounded-xl shadow-lg">
                    <Play className="mr-3 h-6 w-6" /> Girar la Ruleta
                  </Button>
                  <Button onClick={handleResetTimerSelection} size="lg" variant="outline" className="w-full transition-transform hover:scale-105 text-md py-6 rounded-xl">
                    <RotateCcw className="mr-2 h-5 w-5" /> Intentar de Nuevo
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
