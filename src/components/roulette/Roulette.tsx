
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  words: string[];
}

interface RouletteProps {
  categories: Category[];
  onSpinEnd: (selectedCategory: Category) => void;
}

const rouletteSegmentColors = [
  "#F87171", "#60A5FA", "#34D399", "#FBBF24", 
  "#A78BFA", "#F472B6", "#6366F1", "#2DD4BF",
  "#FB923C", "#A3E635", "#22D3EE", "#E879F9"
];

const WHEEL_SIZE = 400;
const WHEEL_RADIUS = WHEEL_SIZE / 2 - 10; 
const CENTER_X = WHEEL_SIZE / 2;
const CENTER_Y = WHEEL_SIZE / 2;
const TEXT_RADIUS_OFFSET = 40; // Adjusted: text path radius is WHEEL_RADIUS - TEXT_RADIUS_OFFSET
const TEXT_MAX_LENGTH = 18; // Adjusted: max characters before "..."

const Roulette: React.FC<RouletteProps> = ({ categories, onSpinEnd }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [finalSelectedCategory, setFinalSelectedCategory] = useState<Category | null>(null);
  
  const selectableCategories = useMemo(() => categories.filter(cat => cat.words && cat.words.length > 0), [categories]);
  const displayCategories = selectableCategories.length > 0 ? selectableCategories : categories;

  const numSegments = displayCategories.length;
  const anglePerSegment = numSegments > 0 ? 360 / numSegments : 360;

  const getCoordinatesForAngle = useCallback((angleDegrees: number, radius: number) => {
    const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;
    return [
      CENTER_X + radius * Math.cos(angleRadians),
      CENTER_Y + radius * Math.sin(angleRadians),
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
        `M ${CENTER_X},${CENTER_Y}`,
        `L ${startX},${startY}`,
        `A ${WHEEL_RADIUS},${WHEEL_RADIUS} 0 ${largeArcFlag} 1 ${endX},${endY}`,
        `Z`,
      ].join(' ');

      const midAngle = startAngle + anglePerSegment / 2;
      // Adjusted text arc path to be slightly wider for more text room if needed
      const textPathAngleSpread = Math.min(anglePerSegment * 0.45, 45); // Max spread of 45deg for text path
      const [textPathStartX, textPathStartY] = getCoordinatesForAngle(midAngle - textPathAngleSpread, WHEEL_RADIUS - TEXT_RADIUS_OFFSET);
      const [textPathEndX, textPathEndY] = getCoordinatesForAngle(midAngle + textPathAngleSpread, WHEEL_RADIUS - TEXT_RADIUS_OFFSET);
      
      const textPathId = `textPath_${category.id.replace(/[^a-zA-Z0-9]/g, '')}_${i}`;
      const textArcPathData = `M ${textPathStartX},${textPathStartY} A ${WHEEL_RADIUS - TEXT_RADIUS_OFFSET},${WHEEL_RADIUS - TEXT_RADIUS_OFFSET} 0 0 1 ${textPathEndX},${textPathEndY}`;
      
      let displayText = category.name;
      if (displayText.length > TEXT_MAX_LENGTH) {
        displayText = displayText.substring(0, TEXT_MAX_LENGTH - 3) + "...";
      }
      
      return {
        id: category.id,
        name: category.name,
        displayText,
        path: pathData,
        fill: rouletteSegmentColors[i % rouletteSegmentColors.length],
        textPathId,
        textArcPathData,
        textAnchor: "middle",
        // Adjusted font size calculation for larger wheel and better text fit
        fontSize: Math.max(9, Math.min(15, anglePerSegment * 0.32)), 
      };
    });
  }, [displayCategories, numSegments, anglePerSegment, getCoordinatesForAngle]);

  const spin = useCallback(() => {
    if (isSpinning || selectableCategories.length === 0) return;

    setIsSpinning(true);
    setFinalSelectedCategory(null);

    const randomIndex = Math.floor(Math.random() * selectableCategories.length);
    const selectedCategory = selectableCategories[randomIndex];
    const displayIndex = displayCategories.findIndex(cat => cat.id === selectedCategory.id);
    const targetDisplayIndex = displayIndex !== -1 ? displayIndex : 0;

    const spins = 5 + Math.floor(Math.random() * 3); 
    const baseRotation = 360 * spins; 
    const targetSegmentMidpointAngle = targetDisplayIndex * anglePerSegment + anglePerSegment / 2;
    
    const randomOffsetDegrees = (Math.random() - 0.5) * (anglePerSegment * 0.4); 
    const finalRotationValue = baseRotation - (targetSegmentMidpointAngle + randomOffsetDegrees);

    setCurrentRotation(finalRotationValue);

    setTimeout(() => {
      setIsSpinning(false);
      setFinalSelectedCategory(selectedCategory);
      onSpinEnd(selectedCategory);
      // Keep the final rotation without modulo to ensure pointer stays aligned
      // setCurrentRotation(prev => prev % 360); // This can cause slight misalignment
    }, 4000); 
  }, [isSpinning, selectableCategories, displayCategories, anglePerSegment, onSpinEnd]);

  useEffect(() => {
    setCurrentRotation(0);
    setFinalSelectedCategory(null);
    setIsSpinning(false);
  }, [categories]);

  if (categories.length === 0) {
    return (
      <Card className="w-full max-w-lg mx-auto text-center shadow-xl">
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
      <Card className="w-full max-w-lg mx-auto text-center shadow-xl">
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
    <Card className="w-full max-w-lg mx-auto text-center shadow-xl transform transition-all duration-300 hover:shadow-2xl">
      <CardHeader>
        <CardTitle className="title-text text-3xl">¡Gira la Ruleta!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 flex flex-col items-center">
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
                transition: isSpinning ? 'transform 4000ms cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
              }}
            >
              {segments.map((segment) => (
                <g key={segment.id}>
                  <path d={segment.path} fill={segment.fill} stroke="#FFFFFF" strokeWidth="2"/>
                  <text 
                    fill="#000000" // Changed text color to black for better contrast on light segment colors
                    dy="-3" // Slightly adjust vertical position of text on path
                    className="pointer-events-none select-none font-semibold" // Made font bolder
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
            className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '15px solid transparent',
              borderRight: '15px solid transparent',
              borderTop: '28px solid hsl(var(--primary))',
              zIndex: 10,
            }}
          />
          {/* Center decorative circle - NOW THE SPIN BUTTON */}
          <div 
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-card border-[6px] border-primary rounded-full shadow-lg z-5 flex items-center justify-center",
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
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
             ) : (
                <Zap className="w-10 h-10 text-primary" />
             )}
          </div>
        </div>

        {finalSelectedCategory && !isSpinning && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg shadow">
            <p className="text-sm text-muted-foreground">Categoría seleccionada:</p>
            <p className="text-2xl font-bold text-primary">{finalSelectedCategory.name}</p>
          </div>
        )}
        
      </CardContent>
    </Card>
  );
};

export default Roulette;
