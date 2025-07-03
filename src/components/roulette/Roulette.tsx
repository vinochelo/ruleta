"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  words: string[];
  isActive?: boolean;
}

interface RouletteProps {
  categories: Category[];
  onSpinEnd: (category: Category, color: string) => void;
}

// --- NEW BROWSER-NATIVE SOUND SYSTEM ---

const playRouletteTick = () => {
  if (typeof window === 'undefined' || !window.AudioContext) return;
  const audioContext = new window.AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // A triangle wave gives a more 'classic game' or 'chiptune' feel
  oscillator.type = 'triangle';
  // A higher frequency for a sharper, more distinct 'tick'
  oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
  // Lowered gain for a less intrusive sound
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  // A very fast decay to make it a short, sharp 'tick'
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.05);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.05);
  oscillator.onended = () => {
    audioContext.close().catch(() => {});
  };
};

const playRouletteEndSound = () => {
  if (typeof window === 'undefined' || !window.AudioContext) return;
  const audioContext = new window.AudioContext();
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.connect(audioContext.destination);

  const playTone = (freq: number, time: number, duration: number) => {
    const oscillator = audioContext.createOscillator();
    // Using 'triangle' for a consistent sound profile with the tick
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(freq, time);
    oscillator.connect(gainNode);
    oscillator.start(time);
    oscillator.stop(time + duration);
  };

  const now = audioContext.currentTime;
  // A happy, upwards C-major arpeggio
  playTone(523.25, now, 0.1); // C5
  playTone(659.25, now + 0.1, 0.1); // E5
  playTone(783.99, now + 0.2, 0.15); // G5

  const totalDuration = 0.35;
  setTimeout(() => {
    audioContext.close().catch(() => {});
  }, totalDuration * 1000 + 100);
};


// --- ROULETTE COMPONENT ---

const rouletteSegmentColors = [
  "#F87171", "#60A5FA", "#34D399", "#FBBF24", 
  "#A78BFA", "#F472B6", "#6366F1", "#2DD4BF",
  "#FB923C", "#A3E635", "#22D3EE", "#E879F9"
];

const WHEEL_SIZE = 600; 
const WHEEL_RADIUS = WHEEL_SIZE / 2 - 10; 
const CENTER_X = WHEEL_SIZE / 2; 
const CENTER_Y = WHEEL_SIZE / 2; 
const TEXT_MAX_LENGTH = 25;

const round = (num: number, decimalPlaces: number = 3): number => {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(num * factor) / factor;
};

function getTextColorForBackground(hexcolor: string): string {
  hexcolor = hexcolor.replace("#", "");
  const r = parseInt(hexcolor.substring(0, 2), 16);
  const g = parseInt(hexcolor.substring(2, 4), 16);
  const b = parseInt(hexcolor.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF'; 
}

const Roulette: React.FC<RouletteProps> = ({ categories, onSpinEnd }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const animationFrameId = useRef<number | null>(null);
  const lastKnownAngle = useRef(0);
  const recentlyPickedRef = useRef<string[]>([]);

  const selectableCategories = useMemo(() => categories.filter(cat => cat.words && cat.words.length > 0 && (cat.isActive ?? true)), [categories]);
  const displayCategories = selectableCategories.length > 0 ? selectableCategories : categories;

  const numSegments = displayCategories.length;
  const anglePerSegment = numSegments > 0 ? 360 / numSegments : 360;

  const getCoordinatesForAngle = useCallback((angleDegrees: number, radius: number) => {
    const angleRadians = ((angleDegrees - 90) * Math.PI) / 180; 
    return [
      round(CENTER_X + radius * Math.cos(angleRadians)),
      round(CENTER_Y + radius * Math.sin(angleRadians)),
    ];
  }, []);

  const segments = useMemo(() => {
    if (numSegments === 0) return [];

    const FONT_SIZE_CATEGORY = Math.min(20, Math.max(14, 300 / numSegments));
    
    return displayCategories.map((category, i) => {
      const startAngle = i * anglePerSegment;
      const endAngle = (i + 1) * anglePerSegment;

      const [startX, startY] = getCoordinatesForAngle(startAngle, WHEEL_RADIUS * 0.95);
      const [endX, endY] = getCoordinatesForAngle(endAngle, WHEEL_RADIUS * 0.95);

      const largeArcFlag = anglePerSegment > 180 ? 1 : 0;

      const pathData = [
        `M ${round(CENTER_X)},${round(CENTER_Y)}`,
        `L ${round(startX)},${round(startY)}`,
        `A ${round(WHEEL_RADIUS * 0.95)},${round(WHEEL_RADIUS * 0.95)} 0 ${largeArcFlag} 1 ${round(endX)},${round(endY)}`,
        `Z`,
      ].join(' ');
      
      const textPathStartRadiusFactor = 0.25;
      const textPathEndRadiusFactor = 0.9;
      
      const midAngle = startAngle + anglePerSegment / 2;
      const [lineStartX, lineStartY] = getCoordinatesForAngle(midAngle, WHEEL_RADIUS * textPathStartRadiusFactor);
      const [lineEndX, lineEndY] = getCoordinatesForAngle(midAngle, WHEEL_RADIUS * textPathEndRadiusFactor);
      
      const radialLinePathId = `radialTextPath_${category.id.replace(/[^a-zA-Z0-9_]/g, '')}_${i}`;
      const radialLinePathData = `M ${round(lineStartX)},${round(lineStartY)} L ${round(lineEndX)},${round(lineEndY)}`;
      
      let displayText = category.name;
      if (displayText.length > TEXT_MAX_LENGTH) {
        displayText = displayText.substring(0, TEXT_MAX_LENGTH) + "...";
      }
      
      const segmentColor = rouletteSegmentColors[i % rouletteSegmentColors.length];
      const textColor = getTextColorForBackground(segmentColor);

      return {
        id: category.id,
        name: category.name,
        displayText,
        path: pathData,
        fill: segmentColor,
        textColor: textColor,
        textPathId: radialLinePathId,
        textArcPathData: radialLinePathData,
        textAnchor: "start",
        fontSize: FONT_SIZE_CATEGORY, 
      };
    });
  }, [displayCategories, numSegments, anglePerSegment, getCoordinatesForAngle]);

  const spin = useCallback(() => {
    if (isSpinning || selectableCategories.length === 0) return;
    
    setIsSpinning(true);

    // --- IMPROVED RANDOMNESS LOGIC ---
    // Determine the number of recent categories to avoid. At least 1, up to a third of the total.
    const maxRecent = Math.max(1, Math.floor(selectableCategories.length / 3));

    // Filter out categories that were picked recently.
    let potentialCategories = selectableCategories.filter(
      (cat) => !recentlyPickedRef.current.includes(cat.id)
    );
    
    // If filtering leaves no options (i.e., all categories have been picked recently),
    // reset the pool to the full list to avoid getting stuck.
    if (potentialCategories.length === 0) {
      potentialCategories = selectableCategories;
      recentlyPickedRef.current = []; // Clear recent list as we are forced to reuse.
    }

    // Select a random category from the filtered, smarter list.
    const selectedCategory = potentialCategories[Math.floor(Math.random() * potentialCategories.length)];
    
    // Update the list of recently picked categories for the next spin.
    recentlyPickedRef.current.push(selectedCategory.id);
    if (recentlyPickedRef.current.length > maxRecent) {
      recentlyPickedRef.current.shift(); // Remove the oldest item to keep the list size constrained.
    }
    // --- END OF IMPROVED RANDOMNESS LOGIC ---

    const displayIndex = displayCategories.findIndex(cat => cat.id === selectedCategory.id) ?? 0;
    const selectedSegment = segments.find(seg => seg.id === selectedCategory.id);
    const selectedColor = selectedSegment ? selectedSegment.fill : rouletteSegmentColors[0];

    const spins = 5 + Math.floor(Math.random() * 3);
    const duration = 4000;
    
    const currentRotationNormalized = rotation % 360;
    const targetSegmentMidpointAngle = (displayIndex * anglePerSegment) + (anglePerSegment / 2);
    const targetAngle = 360 - targetSegmentMidpointAngle;
    const finalRotationValue = rotation - currentRotationNormalized + (360 * spins) + targetAngle;
    
    const startTime = performance.now();
    const startRotation = rotation;
    lastKnownAngle.current = startRotation;

    const easeOutQuint = (x: number): number => 1 - Math.pow(1 - x, 5);

    const animate = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easedProgress = easeOutQuint(progress);
        
        const newRotation = startRotation + (finalRotationValue - startRotation) * easedProgress;
        
        // Sound logic: Play tick when crossing a segment boundary
        const currentSegmentIndex = Math.floor((newRotation % 360) / anglePerSegment);
        const lastSegmentIndex = Math.floor((lastKnownAngle.current % 360) / anglePerSegment);
        if (currentSegmentIndex !== lastSegmentIndex) {
            playRouletteTick();
        }
        lastKnownAngle.current = newRotation;
        
        setRotation(newRotation);

        if (progress < 1) {
            animationFrameId.current = requestAnimationFrame(animate);
        } else {
            setRotation(finalRotationValue);
            setIsSpinning(false);
            playRouletteEndSound();
            onSpinEnd(selectedCategory, selectedColor);
        }
    };
    animationFrameId.current = requestAnimationFrame(animate);

  }, [isSpinning, selectableCategories, displayCategories, anglePerSegment, onSpinEnd, segments, rotation]);


  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  if (categories.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto text-center shadow-xl">
        <CardHeader>
          <CardTitle className="title-text text-2xl">Ruleta de Categorías</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay categorías disponibles.</p>
          <p className="text-sm text-muted-foreground">Añade algunas en "Gestionar Categorías".</p>
        </CardContent>
      </Card>
    );
  }
  
  if (selectableCategories.length === 0 && categories.length > 0) {
     return (
      <Card className="w-full max-w-2xl mx-auto text-center shadow-xl">
        <CardHeader>
          <CardTitle className="title-text text-2xl">Ruleta de Categorías</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
           <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <p className="text-amber-600">Ninguna categoría tiene palabras o todas están desactivadas.</p>
          <p className="text-sm text-muted-foreground">Añade palabras a las categorías o actívalas para poder jugar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto text-center shadow-xl transform transition-all duration-300 hover:shadow-2xl">
      <CardHeader>
        <CardTitle className="title-text text-3xl">¡Gira la Ruleta!</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center p-4 sm:p-6">
        <div 
          className={cn(
            "relative w-full h-auto aspect-square max-w-[340px] sm:max-w-[500px] lg:max-w-[600px]", 
            (isSpinning || selectableCategories.length === 0)
              ? "cursor-not-allowed opacity-70"
              : "cursor-pointer"
          )}
          onClick={!(isSpinning || selectableCategories.length === 0) ? spin : undefined}
          role="button"
          aria-label={isSpinning ? "Girando ruleta" : "Girar la ruleta"}
          tabIndex={(isSpinning || selectableCategories.length === 0) ? -1 : 0}
          onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                  if (!(isSpinning || selectableCategories.length === 0)) {
                      spin();
                  }
              }
          }}
        >
          <svg 
            viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`} 
            className="overflow-visible" 
          >
            <defs>
              {segments.map(segment => (
                <path id={segment.textPathId} d={segment.textArcPathData} key={segment.textPathId} />
              ))}
            </defs>
            <g 
              style={{ 
                transform: `rotate(${rotation}deg)`, 
                transformOrigin: `${CENTER_X}px ${CENTER_Y}px`,
              }}
            >
              {segments.map((segment) => (
                <g key={segment.id}>
                  <path d={segment.path} fill={segment.fill} stroke="#FFFFFF" strokeWidth="2"/>
                  <text 
                    fill={segment.textColor} 
                    dominantBaseline="middle" 
                    className="pointer-events-none select-none font-roulette font-bold"
                    style={{fontSize: `${segment.fontSize}px`}} 
                  >
                    <textPath 
                      href={`#${segment.textPathId}`} 
                      startOffset="5%"
                      textAnchor={segment.textAnchor}
                    >
                      {segment.displayText}
                    </textPath>
                  </text>
                </g>
              ))}
            </g>
          </svg>
          {/* Pointer */}
          <svg
              width="36"
              height="48"
              viewBox="0 0 36 48"
              className="absolute top-[-16px] left-1/2 -translate-x-1/2 z-10"
              style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}
          >
              <path
                  d="M18 48 C18 48 0 24 0 18 A18 18 0 1 1 36 18 C36 24 18 48 18 48 Z"
                  fill="hsl(var(--primary))"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinejoin="round"
              />
              <circle cx="18" cy="18" r="6" fill="white" />
          </svg>

          {/* Center decorative element */}
          <div 
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-red-600 rounded-full z-5 flex items-center justify-center pointer-events-none shadow-md"
            )}
          >
             {isSpinning ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" /> 
             ) : (
                <Play className="w-8 h-8 text-white" /> 
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Roulette;
