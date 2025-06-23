"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  words: string[];
}

interface RouletteProps {
  categories: Category[];
  onSpinEnd: (category: Category, color: string) => void;
}

const rouletteSegmentColors = [
  "#F87171", "#60A5FA", "#34D399", "#FBBF24", 
  "#A78BFA", "#F472B6", "#6366F1", "#2DD4BF",
  "#FB923C", "#A3E635", "#22D3EE", "#E879F9"
];

const WHEEL_SIZE = 600; 
const WHEEL_RADIUS = WHEEL_SIZE / 2 - 10; 
const CENTER_X = WHEEL_SIZE / 2; 
const CENTER_Y = WHEEL_SIZE / 2; 
const TEXT_MAX_LENGTH = 20;
const FONT_SIZE_CATEGORY = 18;

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
  const [currentRotation, setCurrentRotation] = useState(0);
  const [finalSelectedCategoryInfo, setFinalSelectedCategoryInfo] = useState<{category: Category, color: string} | null>(null);
  const spinSoundRef = useRef<HTMLAudioElement>(null);
  
  const selectableCategories = useMemo(() => categories.filter(cat => cat.words && cat.words.length > 0), [categories]);
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
    return displayCategories.map((category, i) => {
      const startAngle = i * anglePerSegment;
      const endAngle = (i + 1) * anglePerSegment;

      const [startX, startY] = getCoordinatesForAngle(startAngle, WHEEL_RADIUS);
      const [endX, endY] = getCoordinatesForAngle(endAngle, WHEEL_RADIUS);

      const largeArcFlag = anglePerSegment > 180 ? 1 : 0;

      const pathData = [
        `M ${round(CENTER_X)},${round(CENTER_Y)}`,
        `L ${round(startX)},${round(startY)}`,
        `A ${round(WHEEL_RADIUS)},${round(WHEEL_RADIUS)} 0 ${largeArcFlag} 1 ${round(endX)},${round(endY)}`,
        `Z`,
      ].join(' ');

      const midAngle = startAngle + anglePerSegment / 2;
      
      const textPathStartRadiusFactor = 0.15; 
      const textPathEndRadiusFactor = 0.85;   
      
      const [lineStartX, lineStartY] = getCoordinatesForAngle(midAngle, WHEEL_RADIUS * textPathStartRadiusFactor);
      const [lineEndX, lineEndY] = getCoordinatesForAngle(midAngle, WHEEL_RADIUS * textPathEndRadiusFactor);
      
      const radialLinePathId = `radialTextPath_${category.id.replace(/[^a-zA-Z0-9_]/g, '')}_${i}`;
      const radialLinePathData = `M ${round(lineStartX)},${round(lineStartY)} L ${round(lineEndX)},${round(lineEndY)}`;
      
      let displayText = category.name;
      if (displayText.length > TEXT_MAX_LENGTH) {
        displayText = displayText.substring(0, TEXT_MAX_LENGTH - 3) + "...";
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
        textAnchor: "middle", 
        fontSize: FONT_SIZE_CATEGORY, 
      };
    });
  }, [displayCategories, numSegments, anglePerSegment, getCoordinatesForAngle]);

  const spin = useCallback(() => {
    if (isSpinning || selectableCategories.length === 0) return;

    if (spinSoundRef.current) {
        spinSoundRef.current.currentTime = 0;
        spinSoundRef.current.volume = 0.5;
        spinSoundRef.current.play().catch(console.error);
    }

    setIsSpinning(true);
    setFinalSelectedCategoryInfo(null);

    const randomIndex = Math.floor(Math.random() * selectableCategories.length);
    const selectedCategory = selectableCategories[randomIndex];
    
    const displayIndex = displayCategories.findIndex(cat => cat.id === selectedCategory.id);
    const targetDisplayIndex = displayIndex !== -1 ? displayIndex : 0; 

    const spins = 8 + Math.floor(Math.random() * 4);
    const baseRotation = 360 * spins; 
    
    const targetSegmentMidpointAngle = (targetDisplayIndex * anglePerSegment) + (anglePerSegment / 2);
    
    const finalRotationValue = baseRotation - targetSegmentMidpointAngle;

    setCurrentRotation(finalRotationValue);

    const selectedSegment = segments.find(seg => seg.id === selectedCategory.id);
    const selectedColor = selectedSegment ? selectedSegment.fill : rouletteSegmentColors[0];


    setTimeout(() => {
      setIsSpinning(false);
      setFinalSelectedCategoryInfo({ category: selectedCategory, color: selectedColor});
      onSpinEnd(selectedCategory, selectedColor);
      if (spinSoundRef.current) {
        spinSoundRef.current.pause();
        spinSoundRef.current.currentTime = 0;
      }
    }, 6000);
  }, [isSpinning, selectableCategories, displayCategories, anglePerSegment, onSpinEnd, segments]);

  useEffect(() => {
    if (!isSpinning && !finalSelectedCategoryInfo) {
       setCurrentRotation(0); 
    }
  }, [categories, isSpinning, finalSelectedCategoryInfo]); 

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
          <p className="text-amber-600">Ninguna categoría tiene palabras.</p>
          <p className="text-sm text-muted-foreground">Añade palabras a las categorías para poder jugar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto text-center shadow-xl transform transition-all duration-300 hover:shadow-2xl">
      <audio
        ref={spinSoundRef}
        src="https://cdn.pixabay.com/download/audio/2022/03/15/audio_2db91a629f.mp3?filename=roulette-wheel-105953.mp3"
        loop
        preload="auto"
      />
      <CardHeader>
        <CardTitle className="title-text text-3xl">¡Gira la Ruleta!</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center p-4 sm:p-6">
        <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
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
                transform: `rotate(${currentRotation}deg)`, 
                transformOrigin: `${CENTER_X}px ${CENTER_Y}px`,
                transition: isSpinning ? 'transform 6000ms cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
              }}
            >
              {segments.map((segment) => (
                <g key={segment.id}>
                  <path d={segment.path} fill={segment.fill} stroke="#FFFFFF" strokeWidth="2"/>
                  <text 
                    fill={segment.textColor} 
                    dominantBaseline="middle" 
                    className="pointer-events-none select-none"
                    style={{fontSize: `${segment.fontSize}px`}} 
                  >
                    <textPath 
                      href={`#${segment.textPathId}`} 
                      startOffset="50%" 
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
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1" 
            style={{
              width: 0,
              height: 0,
              borderLeft: '15px solid transparent', 
              borderRight: '15px solid transparent', 
              borderTop: '30px solid hsl(var(--primary))', 
              zIndex: 10,
              filter: 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.25))'
            }}
          />
          {/* Center spin button */}
          <div 
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-card border-[6px] border-primary rounded-full shadow-lg z-5 flex items-center justify-center", 
              "transition-transform duration-150",
              (isSpinning || selectableCategories.length === 0)
                ? "cursor-not-allowed opacity-70"
                : "cursor-pointer hover:scale-110 active:scale-100"
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
             {isSpinning ? (
                <Loader2 className="w-14 h-14 text-primary animate-spin" /> 
             ) : (
                <Play className="w-14 h-14 text-primary" /> 
             )}
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
};

export default Roulette;