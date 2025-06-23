
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
import { TimerIcon, X, Play, ImageIcon, Loader2, Sparkles } from 'lucide-react';
import Timer from '@/components/timer/Timer';
import { generateQuickImage, generateArtisticImages } from '@/ai/flows/generate-image-flow';
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
  const [timerDuration, setTimerDuration] = useState<number>(60);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  // AI Image Generation State
  const [aiHelpActive, setAiHelpActive] = useState(false);
  const [isGeneratingQuick, setIsGeneratingQuick] = useState(false);
  const [isGeneratingArtistic, setIsGeneratingArtistic] = useState(false);
  const [quickImage, setQuickImage] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [artisticText, setArtisticText] = useState<string | null>(null);
  const { toast } = useToast();

  // Slideshow state
  const [allImages, setAllImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const resetAIState = useCallback(() => {
    setAiHelpActive(false);
    setIsGeneratingQuick(false);
    setIsGeneratingArtistic(false);
    setQuickImage(null);
    setReferenceImages([]);
    setArtisticText(null);
    setAllImages([]);
    setCurrentImageIndex(0);
  }, []);

  const startImageGeneration = useCallback(async (word: string) => {
    if (!word) return;
    
    resetAIState();
    setAiHelpActive(true);
    setIsGeneratingQuick(true);

    try {
      // --- Stage 1: Generate Quick Image ---
      const quickResult = await generateQuickImage({ word });
      
      if (quickResult.error) {
        setAiHelpActive(false); // Go back to the "get inspiration" button
        setIsGeneratingQuick(false); // Stop loading state
        return; 
      }

      if (quickResult.imageDataUri) {
        setQuickImage(quickResult.imageDataUri);
        setIsGeneratingQuick(false); // Quick image part is done

        // --- Stage 2: Generate Elaborate Image (in background) ---
        setIsGeneratingArtistic(true);
        generateArtisticImages({ word }).then(artisticResult => {
            if (artisticResult.imageDataUri) {
                setReferenceImages([artisticResult.imageDataUri]);
                setArtisticText(null); // No more artistic text image
            }
            if (artisticResult.error) {
                // Log non-critical background errors without showing a toast
                console.warn("Elaborate image generation failed in background:", artisticResult.error);
            }
        }).catch(err => {
            console.error("Artistic image generation failed:", err);
             // No toast for non-critical background error.
        }).finally(() => {
            setIsGeneratingArtistic(false);
        });

      } else {
        // No toast, just revert the UI
        setAiHelpActive(false);
        setIsGeneratingQuick(false);
      }
    } catch (error: any) {
        console.error("Critical image generation flow error:", error);
        // No toast, just revert the UI
        setAiHelpActive(false);
        setIsGeneratingQuick(false);
    }
  }, [resetAIState, toast]);

  // Effect to combine all images into a single array for the slideshow
  useEffect(() => {
    const newImages = [quickImage, ...referenceImages, artisticText].filter((img): img is string => !!img);
    setAllImages(newImages);
  }, [quickImage, referenceImages, artisticText]);
  
  // Effect to manage state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset timer state
      setTimerDuration(60); // Default to 60s
      setIsTimerFinished(false);
      setTimerKey(prev => prev + 1);
      // Reset AI state
      resetAIState();

      if (useAIImages && selectedWord) {
        startImageGeneration(selectedWord);
      }
    }
  }, [isOpen, useAIImages, selectedWord, startImageGeneration, resetAIState]);

  // Effect for automatic slideshow, stops at the end
  useEffect(() => {
    if (allImages.length > 1 && currentImageIndex < allImages.length - 1) {
      const timer = setTimeout(() => {
        setCurrentImageIndex((prevIndex) => prevIndex + 1);
      }, 3000); // Change image every 3 seconds

      return () => clearTimeout(timer);
    }
  }, [allImages, currentImageIndex]);

  const handleTimeButtonClick = (duration: number) => {
    speakTimeSelection(duration);
    setTimerDuration(duration);
    setIsTimerFinished(false);
    setTimerKey(prevKey => prevKey + 1); // Remount timer with new duration and autoStart
  };
  
  const handleTimerEndInternal = useCallback(() => {
    setIsTimerFinished(true);
    if (selectedWord) {
      setTimeout(() => {
        speakFn(`La palabra era ${selectedWord}.`);
      }, 2000);
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
    const ContentContainer: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
      <div className={cn("w-full h-full lg:aspect-square flex flex-col items-center justify-center p-0 relative", className)}>
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
              <ImageIcon className="h-24 w-24 text-muted-foreground/20" />
              <p className="text-lg text-muted-foreground">La ayuda de IA está desactivada.</p>
              <Button onClick={handleRequestAiHelp} size="lg" className="transition-transform hover:scale-105">
                <Sparkles className="mr-2 h-5 w-5" />
                Obtener Inspiración
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

    if (allImages.length === 0) {
      return (
        <ContentContainer>
          <MainImageBox>
              <div className="text-center flex flex-col items-center justify-center gap-6 p-4">
                <ImageIcon className="h-32 w-32 text-muted-foreground/20" />
                <p className="text-lg text-muted-foreground">No se pudo generar la imagen.</p>
                 <Button onClick={handleRequestAiHelp} size="lg" className="transition-transform hover:scale-105">
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

        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch justify-evenly gap-6 h-full">
          
          <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-center text-center min-h-[300px] lg:min-h-0">
             {renderContent()}
          </div>

          <div className="flex flex-col justify-center items-center gap-4 lg:w-1/2">
            <div className="w-full max-w-md mx-auto space-y-4">

                <div className="text-center">
                    <p className="text-base text-muted-foreground">Categoría</p>
                    <p className="text-3xl font-bold font-roulette" style={{ color: selectedCategoryColor || 'hsl(var(--primary))' }}>
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TIMER_OPTIONS.map(({ duration }, index) => (
                        <Button
                        key={duration}
                        onClick={() => handleTimeButtonClick(duration)}
                        style={{ 
                            backgroundColor: TIMER_BUTTON_COLORS[index % TIMER_BUTTON_COLORS.length],
                        }}
                        className={cn(
                            "text-white text-3xl font-bold py-6 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 border-4 border-transparent"
                        )}
                        >
                        {duration}s
                        </Button>
                    ))}
                    </div>
                
                    <Timer
                      key={timerKey}
                      initialDuration={timerDuration}
                      onTimerEnd={handleTimerEndInternal}
                      autoStart={true}
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
