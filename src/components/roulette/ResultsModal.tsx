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
import { TimerIcon, X, Play, ImageIcon, Loader2, Sparkles, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Timer from '@/components/timer/Timer';
import { useToast } from '@/hooks/use-toast';
import { generateQuickImage, generateArtisticImages } from '@/ai/flows/generate-image-flow';
import { cn } from '@/lib/utils';

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
  const [allImages, setAllImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { toast } = useToast();
  
  const resetAIState = useCallback(() => {
    setAiHelpActive(false);
    setIsGeneratingQuick(false);
    setIsGeneratingArtistic(false);
    setQuickImage(null);
    setReferenceImages([]);
    setArtisticText(null);
    setGenerationError(null);
    setAllImages([]);
    setCurrentImageIndex(0);
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
      
      if (quickResult.error) {
        setGenerationError(quickResult.error);
        toast({
          title: "Error de Generación de Imagen",
          description: quickResult.error,
          variant: "destructive",
          duration: 15000,
        });
        setIsGeneratingQuick(false); // Stop loading state
        return; // Abort
      }

      if (quickResult.imageDataUri) {
        setQuickImage(quickResult.imageDataUri);
        setIsGeneratingQuick(false); // Quick image part is done

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
        }).finally(() => {
            setIsGeneratingArtistic(false);
        });

      } else {
        const errorMessage = "La IA devolvió una respuesta vacía inesperada.";
        setGenerationError(errorMessage);
        toast({ title: "Error Inesperado", description: errorMessage, variant: "destructive" });
        setIsGeneratingQuick(false);
      }
    } catch (error: any) {
        console.error("Critical image generation flow error:", error);
        const errorMessage = "Ocurrió un problema de comunicación con el servicio de IA. Revisa la consola del navegador y del servidor.";
        setGenerationError("Error de comunicación.");
        toast({ title: "Error de IA", description: errorMessage, variant: "destructive" });
        setIsGeneratingQuick(false);
    }
  }, [toast, resetAIState]);

  // Effect to combine all images into a single array for the slideshow
  useEffect(() => {
    const newImages = [quickImage, ...referenceImages, artisticText].filter((img): img is string => !!img);
    setAllImages(newImages);
  }, [quickImage, referenceImages, artisticText]);
  
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

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % allImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + allImages.length) % allImages.length);
  };

  const wordLength = selectedWord?.length || 0;
  let wordFontSizeClass = 'text-6xl lg:text-7xl';
  if (wordLength > 8) {
    wordFontSizeClass = 'text-5xl lg:text-6xl';
  }
  if (wordLength > 15) {
    wordFontSizeClass = 'text-4xl lg:text-5xl';
  }
  if (wordLength > 20) {
    wordFontSizeClass = 'text-3xl lg:text-4xl';
  }
  if (wordLength > 24) {
    wordFontSizeClass = 'text-2xl lg:text-3xl';
  }

  const renderContent = () => {
    const ContentContainer: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
      <div className={cn("w-full aspect-square max-w-md lg:max-w-lg bg-transparent flex flex-col items-center justify-center p-0 relative gap-4", className)}>
        {children}
      </div>
    );
  
    const MainImageBox: React.FC<{children: React.ReactNode}> = ({ children }) => (
        <div className="w-full flex-grow bg-card rounded-2xl shadow-2xl flex items-center justify-center p-2 relative overflow-hidden border-4" style={{borderColor: selectedCategoryColor || 'hsl(var(--primary))'}}>
          {children}
        </div>
      );
    
    if (!aiHelpActive) {
      return (
        <ContentContainer>
          <MainImageBox>
            <div className="text-center flex flex-col items-center justify-center gap-6 p-4">
              <ImageIcon className="h-32 w-32 text-muted-foreground/20" />
              <p className="text-xl text-muted-foreground">La ayuda de IA está desactivada.</p>
              <Button onClick={handleRequestAiHelp} size="lg" className="transition-transform hover:scale-105">
                <Sparkles className="mr-2 h-5 w-5" />
                Obtener Inspiración de IA
              </Button>
            </div>
          </MainImageBox>
        </ContentContainer>
      );
    }
    
    if (isGeneratingQuick && allImages.length === 0) {
      return (
        <ContentContainer>
          <MainImageBox>
              <div className="flex flex-col items-center justify-center gap-4 text-primary">
                <Loader2 className="h-16 w-16 animate-spin" />
                <p className="text-xl font-medium">Generando inspiración...</p>
              </div>
          </MainImageBox>
        </ContentContainer>
      );
    }

    if (generationError && allImages.length === 0) {
      return (
        <ContentContainer>
          <MainImageBox>
              <div className="text-center flex flex-col items-center justify-center gap-6 p-4">
                <AlertCircle className="h-24 w-24 text-destructive" />
                <p className="text-lg text-white bg-destructive p-2 rounded-md max-w-sm">{generationError}</p>
                <Button onClick={handleRequestAiHelp} size="lg" variant="destructive" className="transition-transform hover:scale-105">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Reintentar
                </Button>
              </div>
          </MainImageBox>
        </ContentContainer>
      );
    }

    if (allImages.length > 0) {
      return (
        <ContentContainer>
          <MainImageBox>
            <Image src={allImages[currentImageIndex]} alt={`Inspiración para ${selectedWord}`} layout="fill" objectFit="contain" className="p-4" unoptimized />

            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 text-white transition-opacity opacity-50 hover:opacity-100"
                  onClick={handlePrevImage}
                  aria-label="Imagen Anterior"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 text-white transition-opacity opacity-50 hover:opacity-100"
                  onClick={handleNextImage}
                  aria-label="Siguiente Imagen"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
            
            {allImages.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            )}

            {isGeneratingArtistic && (
              <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Generando más...</span>
              </div>
            )}
          </MainImageBox>
        </ContentContainer>
      );
    }

    return (
      <ContentContainer>
           <MainImageBox>
              <div className="text-center flex flex-col items-center justify-center gap-6 p-4">
                <ImageIcon className="h-32 w-32 text-muted-foreground/20" />
              </div>
           </MainImageBox>
      </ContentContainer>
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
          
          <div className="flex-1 w-full lg:max-w-2xl flex flex-col items-center justify-center text-center gap-4">
             {renderContent()}
          </div>

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
                className={`${wordFontSizeClass} font-bold drop-shadow-md font-roulette break-words leading-tight`} 
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
