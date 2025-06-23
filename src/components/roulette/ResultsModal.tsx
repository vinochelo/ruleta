
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
import { TimerIcon, X, Play, Image as ImageIcon, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import Timer from '@/components/timer/Timer';
import { useToast } from '@/hooks/use-toast';
import { generateQuickImage, generateArtisticImages } from '@/ai/flows/generate-image-flow';

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
  // Timer and game state
  const [activeTimerDuration, setActiveTimerDuration] = useState<number | null>(null);
  const [isPictionaryRoundActive, setIsPictionaryRoundActive] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  // AI Image Generation State
  const [aiHelpActive, setAiHelpActive] = useState(false);
  const [isGeneratingQuick, setIsGeneratingQuick] = useState(false);
  const [isGeneratingArtistic, setIsGeneratingArtistic] = useState(false);
  const [quickImage, setQuickImage] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [artisticText, setArtisticText] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Slideshow state
  const [slideshowImages, setSlideshowImages] = useState<string[]>([]);
  const [currentSlideshowIndex, setCurrentSlideshowIndex] = useState(0);
  const [displayState, setDisplayState] = useState<'initial' | 'slideshow' | 'final_reveal'>('initial');

  const { toast } = useToast();
  
  const resetAIState = useCallback(() => {
    setAiHelpActive(false);
    setIsGeneratingQuick(false);
    setIsGeneratingArtistic(false);
    setQuickImage(null);
    setReferenceImages([]);
    setArtisticText(null);
    setGenerationError(null);
    setSlideshowImages([]);
    setCurrentSlideshowIndex(0);
    setDisplayState('initial');
  }, []);

  const startImageGeneration = useCallback(async (word: string) => {
    if (!word) return;
    
    resetAIState();
    setAiHelpActive(true);
    setIsGeneratingQuick(true);
    setGenerationError(null);

    try {
      // --- Stage 1: Generate Quick Image ---
      const quickResult = await generateQuickImage({ word });
      if (quickResult.imageDataUri) {
        setQuickImage(quickResult.imageDataUri);
        
        // --- Stage 2: Generate Artistic Images (in background) ---
        setIsGeneratingArtistic(true);
        generateArtisticImages({ word }).then(artisticResult => {
            if (artisticResult.imageDataUris && artisticResult.imageDataUris.length > 0) {
                const allArtistic = [...artisticResult.imageDataUris];
                const newArtisticText = allArtistic.pop() || null;
                setReferenceImages(allArtistic);
                setArtisticText(newArtisticText);
            }
        }).catch(err => {
            console.error("Artistic image generation failed:", err);
            // Non-critical error, we still have the quick image.
        }).finally(() => {
            setIsGeneratingArtistic(false);
        });

      } else {
        // Handle failure gracefully without throwing an error to avoid Next.js overlay
        const errorMessage = "Ocurrió un problema al generar la imagen. Inténtalo de nuevo.";
        setGenerationError(errorMessage);
        toast({
          title: "Error de IA",
          description: "La IA no pudo generar la imagen inicial.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
        console.error("Quick image generation error:", error);
        const errorMessage = "Ocurrió un problema al generar la imagen. Inténtalo de nuevo.";
        setGenerationError(errorMessage);
        toast({
          title: "Error de IA",
          description: errorMessage,
          variant: "destructive"
        });
    } finally {
        setIsGeneratingQuick(false);
    }
  }, [toast, resetAIState]);
  
  // Effect to manage state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset timer state
      setActiveTimerDuration(null);
      setIsPictionaryRoundActive(false);
      setTimerKey(prev => prev + 1);
      // Reset AI state
      resetAIState();

      if (useAIImages && selectedWord) {
        startImageGeneration(selectedWord);
      }
    }
  }, [isOpen, useAIImages, selectedWord, startImageGeneration, resetAIState]);
  
  // Effect to build and start slideshow when images are ready
  useEffect(() => {
    const newSlideshowImages: string[] = [];
    if (quickImage) newSlideshowImages.push(quickImage);
    if (referenceImages.length > 0) newSlideshowImages.push(...referenceImages);

    if (newSlideshowImages.length > 0) {
        setSlideshowImages(newSlideshowImages);
        setDisplayState('slideshow');
        setCurrentSlideshowIndex(0);
    }
  }, [quickImage, referenceImages]);
  
  // Effect for cycling through slideshow images
  useEffect(() => {
    if (displayState !== 'slideshow' || slideshowImages.length === 0) return;

    const timer = setTimeout(() => {
      if (currentSlideshowIndex < slideshowImages.length - 1) {
        setCurrentSlideshowIndex(prev => prev + 1);
      } else {
        setDisplayState('final_reveal');
      }
    }, 4000); // 4 seconds per image

    return () => clearTimeout(timer);
  }, [displayState, currentSlideshowIndex, slideshowImages]);

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
  
  const handleRequestAiHelp = () => {
    if (selectedWord) {
      startImageGeneration(selectedWord);
    }
  };

  const wordLength = selectedWord?.length || 0;
  let wordFontSizeClass = 'text-7xl lg:text-8xl';
  if (wordLength > 10) {
    wordFontSizeClass = 'text-6xl lg:text-7xl';
  }
  if (wordLength > 15) {
    wordFontSizeClass = 'text-5xl lg:text-6xl';
  }
  if (wordLength > 20) {
    wordFontSizeClass = 'text-4xl lg:text-5xl';
  }
  if (wordLength > 25) {
    wordFontSizeClass = 'text-3xl lg:text-4xl';
  }

  const renderContent = () => {
    const ContentBox: React.FC<{children: React.ReactNode}> = ({ children }) => (
      <div className="w-full aspect-square max-w-md lg:max-w-lg bg-card rounded-2xl shadow-2xl flex items-center justify-center p-4 relative overflow-hidden border-4" style={{borderColor: selectedCategoryColor || 'hsl(var(--primary))'}}>
        {children}
      </div>
    );
    
    // Initial State: No AI help requested or enabled
    if (!aiHelpActive) {
      return (
        <ContentBox>
          <div className="text-center flex flex-col items-center justify-center gap-6 p-4">
              <ImageIcon className="h-32 w-32 text-muted-foreground/20" />
              <p className="text-xl text-muted-foreground">La ayuda de IA está desactivada.</p>
              <Button onClick={handleRequestAiHelp} size="lg" className="transition-transform hover:scale-105">
                <Sparkles className="mr-2 h-5 w-5" />
                Obtener Inspiración de IA
              </Button>
          </div>
        </ContentBox>
      );
    }
    
    // State: Loading the first quick image
    if (isGeneratingQuick) {
        return (
          <ContentBox>
            <div className="flex flex-col items-center justify-center gap-4 text-primary">
              <Loader2 className="h-16 w-16 animate-spin" />
              <p className="text-xl font-medium">Generando imagen de referencia...</p>
            </div>
          </ContentBox>
        );
    }

    // State: Error during generation
    if (generationError && !quickImage) {
        return (
          <ContentBox>
            <div className="text-center flex flex-col items-center justify-center gap-6 p-4">
              <AlertCircle className="h-24 w-24 text-destructive" />
              <p className="text-xl text-white bg-destructive p-2 rounded-md">{generationError}</p>
              <Button onClick={handleRequestAiHelp} size="lg" variant="destructive" className="transition-transform hover:scale-105">
                <Sparkles className="mr-2 h-5 w-5" />
                Reintentar
              </Button>
            </div>
          </ContentBox>
        );
    }
    
    // State: Displaying slideshow
    if (displayState === 'slideshow' && slideshowImages.length > 0) {
      const currentImageUrl = slideshowImages[currentSlideshowIndex];
      return (
        <ContentBox>
          {currentImageUrl && <Image src={currentImageUrl} alt={`Referencia ${currentSlideshowIndex + 1}`} layout="fill" objectFit="contain" className="p-4" unoptimized />}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center flex-col gap-2">
            <p className="text-lg font-semibold text-foreground/80 bg-card/80 backdrop-blur-sm px-3 py-1 rounded-full">Referencia {currentSlideshowIndex + 1} de {slideshowImages.length}</p>
          </div>
          {isGeneratingArtistic && <Loader2 className="absolute top-4 right-4 h-6 w-6 text-primary animate-spin" />}
        </ContentBox>
      );
    }

    // State: Final reveal with artistic text
    if (displayState === 'final_reveal') {
        return (
          <ContentBox>
            {artisticText ? (
              <Image src={artisticText} alt={`Palabra: ${selectedWord}`} layout="fill" objectFit="contain" className="p-4" unoptimized />
            ) : (
              // Fallback if artistic text fails but others succeed
              quickImage ? <Image src={quickImage} alt={`Palabra: ${selectedWord}`} layout="fill" objectFit="contain" className="p-4" unoptimized /> :
              <div className="text-center flex flex-col items-center justify-center gap-4">
                <ImageIcon className="h-32 w-32 text-muted-foreground/20" />
                <p className="text-muted-foreground">No se generó la imagen artística final.</p>
              </div>
            )}
             {isGeneratingArtistic && <Loader2 className="absolute top-4 right-4 h-6 w-6 text-primary animate-spin" />}
          </ContentBox>
        );
    }
    
    // Default/fallback view if something unexpected happens
    return (
        <ContentBox>
            <div className="text-center flex flex-col items-center justify-center gap-6 p-4">
                <ImageIcon className="h-32 w-32 text-muted-foreground/20" />
            </div>
        </ContentBox>
    );
  };


  if (!selectedCategoryName) return null;

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
            variant="default"
            size="icon"
            className="absolute top-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110 bg-red-600 hover:bg-red-700"
            aria-label="Cerrar"
          >
            <X className="h-9 w-9 text-white" />
          </Button>
        </DialogClose>

        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 h-full">
          
          {/* Image and Word Section */}
          <div className="flex-1 w-full lg:max-w-2xl flex flex-col items-center justify-center text-center gap-4">
             {renderContent()}
          </div>

          {/* Timer and Controls Section */}
          <div className="flex-1 w-full lg:max-w-md flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Categoría</p>
              <p className="text-3xl lg:text-4xl font-bold font-roulette" style={{ color: selectedCategoryColor || 'hsl(var(--primary))' }}>
                {selectedCategoryName}
              </p>
            </div>
            
            <div className="text-center bg-card/50 backdrop-blur-sm p-4 rounded-xl shadow-lg border w-full min-h-[190px] flex flex-col justify-center">
              <p className="text-md text-muted-foreground">Palabra a dibujar</p>
              <p 
                className={`${wordFontSizeClass} font-bold drop-shadow-md font-roulette`} 
                style={{ color: selectedCategoryColor || 'hsl(var(--foreground))' }}
              >
                {selectedWord}
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
                      disabled={isPictionaryRoundActive}
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
                <div className="flex flex-col gap-4 pt-2">
                  <Button onClick={handleCloseDialog} size="lg" className="w-full transition-transform hover:scale-105 text-lg py-7 rounded-xl shadow-lg">
                    <Play className="mr-3 h-6 w-6" /> Girar la Ruleta
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
