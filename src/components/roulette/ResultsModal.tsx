
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
import { TimerIcon, X, ImageIcon, Loader2, Sparkles } from 'lucide-react';
import Timer from '@/components/timer/Timer';
import { generateQuickImage } from '@/ai/flows/generate-image-flow';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

const TIMER_OPTIONS = [
  { duration: 30 },
  { duration: 60 },
  { duration: 90 },
  { duration: 120 },
];

const TIMER_BUTTON_COLORS = ['#34D399', '#60A5FA', '#FBBF24', '#F87171'];

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
  // Timer and game state
  const [timerDuration, setTimerDuration] = useState<number>(0);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [timerShouldAutoStart, setTimerShouldAutoStart] = useState(false);
  const [animatingButton, setAnimatingButton] = useState<number | null>(null); // For button animation

  // AI Image Generation State
  const [aiHelpActive, setAiHelpActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const resetAIState = useCallback(() => {
    setAiHelpActive(false);
    setIsGenerating(false);
    setGeneratedImage(null);
  }, []);

  const startImageGeneration = useCallback(async (word: string) => {
    if (!word) return;
    
    resetAIState();
    setAiHelpActive(true);
    setIsGenerating(true);

    try {
      const result = await generateQuickImage({ word });
      
      if (result.error) {
        toast({
            title: "Error al generar imagen",
            description: result.error,
            variant: "destructive",
        });
        setAiHelpActive(false); // Go back to the "get inspiration" button
      } else if (result.imageDataUri) {
        setGeneratedImage(result.imageDataUri);
      } else {
         toast({
            title: "Error Inesperado",
            description: "La IA no devolvió una imagen pero no especificó un error. Inténtalo de nuevo.",
            variant: "destructive",
        });
        setAiHelpActive(false);
      }
    } catch (error: any) {
        toast({
            title: "Error Crítico de Conexión",
            description: error.message || "Ocurrió un error irrecuperable al contactar el servicio de IA. Revisa tu conexión o la configuración de la API.",
            variant: "destructive",
        });
        setAiHelpActive(false);
    } finally {
        setIsGenerating(false);
    }
  }, [resetAIState, toast]);
  
  // Effect to manage state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset timer state
      setTimerDuration(0); // Start with 0 duration
      setIsTimerFinished(false);
      setTimerKey(prev => prev + 1);
      setTimerShouldAutoStart(false); // Don't start on open
      // Reset AI state
      resetAIState();

      if (useAIImages && selectedWord) {
        startImageGeneration(selectedWord);
      }
    }
  }, [isOpen, useAIImages, selectedWord, startImageGeneration, resetAIState]);

  const handleTimeButtonClick = (duration: number) => {
    speakTimeSelection(duration);
    setTimerDuration(duration);
    setIsTimerFinished(false);
    setTimerShouldAutoStart(true); // This will trigger the timer to start on remount
    setTimerKey(prevKey => prevKey + 1);

    // Button animation logic
    setAnimatingButton(duration);
    setTimeout(() => {
      setAnimatingButton(null);
    }, 300); // Duration of the animation
  };
  
  const handleTimerEndInternal = useCallback(() => {
    setIsTimerFinished(true);
    setTimerShouldAutoStart(false); // Stop trying to autostart on future renders
    if (selectedWord) {
      setTimeout(() => {
        speakFn(`La palabra era ${selectedWord}.`);
      }, 3000);
    }
  }, [selectedWord, speakFn]);


  const handleCloseDialog = () => {
    onClose();
  };
  
  const handleRequestAiHelp = () => {
    if (selectedWord) {
      startImageGeneration(selectedWord);
    }
  };

  const wordLength = selectedWord?.length || 0;
  let wordFontSizeClass = 'text-4xl sm:text-6xl lg:text-7xl';
  if (wordLength > 8) {
    wordFontSizeClass = 'text-3xl sm:text-5xl lg:text-6xl';
  }
  if (wordLength > 15) {
    wordFontSizeClass = 'text-2xl sm:text-4xl lg:text-5xl';
  }
  if (wordLength > 20) {
    wordFontSizeClass = 'text-xl sm:text-3xl lg:text-4xl';
  }
  if (wordLength > 24) {
    wordFontSizeClass = 'text-lg sm:text-2xl lg:text-3xl';
  }

  const renderContent = () => {
    const ImageBox: React.FC<{children: React.ReactNode}> = ({ children }) => (
      <div className="w-full h-full lg:aspect-square flex flex-col items-center justify-center p-0 relative">
        <div className="w-full flex-grow bg-card rounded-2xl shadow-2xl flex items-center justify-center p-2 relative overflow-hidden border-4" style={{borderColor: selectedCategoryColor || 'hsl(var(--primary))'}}>
          {children}
        </div>
      </div>
    );
    
    if (!aiHelpActive) {
      return (
        <ImageBox>
          <div className="text-center flex flex-col items-center justify-center gap-6 p-4">
            <ImageIcon className="h-24 w-24 text-muted-foreground/20" />
            <p className="text-lg text-muted-foreground">La ayuda de IA está desactivada.</p>
            <Button
              onClick={handleRequestAiHelp}
              size="lg"
              className="transition-transform hover:scale-105 py-6 px-10 text-xl rounded-full"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Obtener Inspiración
            </Button>
          </div>
        </ImageBox>
      );
    }
    
    if (isGenerating) {
      return (
        <ImageBox>
          <div className="flex flex-col items-center justify-center gap-4 text-primary">
            <Loader2 className="h-16 w-16 animate-spin" />
            <p className="text-xl font-medium">Generando inspiración...</p>
          </div>
        </ImageBox>
      );
    }

    if (generatedImage) {
      return (
        <ImageBox>
          <Image src={generatedImage} alt={`Inspiración para ${selectedWord}`} layout="fill" objectFit="contain" className="p-4" unoptimized />
        </ImageBox>
      );
    }

    // This case handles when AI generation was attempted but failed and is no longer loading
    return (
      <ImageBox>
        <div className="text-center flex flex-col items-center justify-center gap-6 p-4">
          <ImageIcon className="h-32 w-32 text-muted-foreground/20" />
          <p className="text-lg text-muted-foreground">No se pudo generar la imagen.</p>
          <Button
            onClick={handleRequestAiHelp}
            size="lg"
            className="transition-transform hover:scale-105 py-6 px-10 text-xl rounded-full"
          >
              <Sparkles className="mr-2 h-5 w-5" />
              Reintentar
          </Button>
        </div>
      </ImageBox>
    );
  };

  if (!selectedCategoryName) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
      <DialogContent 
        showCloseButton={false} 
        className="w-screen h-screen max-w-full max-h-full bg-card/90 backdrop-blur-lg border-0 shadow-none flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto"
      >
        <DialogTitle className="sr-only">Resultado de la Ruleta</DialogTitle>
        <DialogDescription className="sr-only">
          La categoría seleccionada es {selectedCategoryName} y la palabra a dibujar es {selectedWord}.
        </DialogDescription>
        
        <DialogClose asChild>
          <Button
            variant="default"
            size="icon"
            className="absolute top-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-110 bg-red-600 hover:bg-red-700"
            aria-label="Cerrar"
          >
            <X className="h-8 w-8 text-white" />
          </Button>
        </DialogClose>

        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch justify-evenly gap-6 flex-grow h-full">
          
          <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-center text-center min-h-[300px] lg:min-h-0">
             {renderContent()}
          </div>

          <div className="flex flex-col justify-center items-center gap-4 lg:w-1/2">
            <div className="w-full max-w-md mx-auto space-y-4">

                <div className="text-center">
                    <p className="text-base text-muted-foreground">Categoría</p>
                    <p className="text-2xl sm:text-4xl lg:text-6xl font-bold font-roulette" style={{ color: selectedCategoryColor || 'hsl(var(--primary))' }}>
                        {selectedCategoryName}
                    </p>
                </div>
                
                <div className="text-center bg-card/50 backdrop-blur-sm p-3 rounded-xl shadow-lg border w-full min-h-[120px] flex flex-col justify-center">
                    <p className="text-sm text-muted-foreground">Palabra a dibujar</p>
                    <p 
                        className={`${wordFontSizeClass} font-bold drop-shadow-md font-roulette break-words leading-tight`} 
                        style={{ color: selectedCategoryColor || 'hsl(var(--foreground))' }}
                    >
                        {selectedWord}
                    </p>
                </div>

                <div className="w-full space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {TIMER_OPTIONS.map(({ duration }, index) => (
                        <Button
                        key={duration}
                        onClick={() => handleTimeButtonClick(duration)}
                        style={{ 
                            backgroundColor: TIMER_BUTTON_COLORS[index % TIMER_BUTTON_COLORS.length],
                        }}
                        className={cn(
                            "text-white text-xl sm:text-3xl font-bold py-3 sm:py-6 rounded-lg sm:rounded-2xl shadow-lg border-2 sm:border-4 border-transparent",
                            animatingButton === duration ? "animate-button-press" : "transition-transform hover:scale-105"
                        )}
                        disabled={timerShouldAutoStart && !isTimerFinished}
                        >
                        {duration}s
                        </Button>
                    ))}
                    </div>
                
                    <Timer
                      key={timerKey}
                      initialDuration={timerDuration}
                      onTimerEnd={handleTimerEndInternal}
                      autoStart={timerShouldAutoStart}
                    />
                </div>
            </div>
          </div>
        </div>
        
      </DialogContent>
    </Dialog>
  );
};

export default ResultsModal;
