
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, AlertTriangle } from 'lucide-react';

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

const WHEEL_SIZE = 320; 
const WHEEL_RADIUS = WHEEL_SIZE / 2 - 10; // Outer radius of segments
const CENTER_X = WHEEL_SIZE / 2;
const CENTER_Y = WHEEL_SIZE / 2;
const TEXT_RADIUS_OFFSET = 35; // How far from the center the text baseline is
const TEXT_MAX_LENGTH = 12; // Max characters before truncating

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
      const [textPathStartX, textPathStartY] = getCoordinatesForAngle(midAngle - anglePerSegment / 2.5, WHEEL_RADIUS - TEXT_RADIUS_OFFSET);
      const [textPathEndX, textPathEndY] = getCoordinatesForAngle(midAngle + anglePerSegment / 2.5, WHEEL_RADIUS - TEXT_RADIUS_OFFSET);
      
      // Create a unique ID for the textPath
      const textPathId = `textPath_${category.id.replace(/[^a-zA-Z0-9]/g, '')}_${i}`;

      // Invisible path for text to follow (arc)
      // The direction of the arc matters for text orientation. A_rx,ry x-axis-rotation large-arc-flag sweep-flag x,y
      // sweep-flag 1 for clockwise, 0 for counter-clockwise.
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
        fontSize: Math.max(8, Math.min(12, anglePerSegment * 0.25)), // Dynamic font size based on segment width
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

    const spins = 5 + Math.floor(Math.random() * 3); // Random number of full spins
    const baseRotation = 360 * spins; 
    const targetSegmentMidpointAngle = targetDisplayIndex * anglePerSegment + anglePerSegment / 2;
    
    // Calculate rotation to align the middle of the selected segment with the top pointer (0 degrees effective)
    // Add a slight random offset within the segment for variability
    const randomOffsetDegrees = (Math.random() - 0.5) * (anglePerSegment * 0.4); // up to 20% of segment width from center
    const finalRotationValue = baseRotation - (targetSegmentMidpointAngle + randomOffsetDegrees);

    setCurrentRotation(finalRotationValue);

    setTimeout(() => {
      setIsSpinning(false);
      setFinalSelectedCategory(selectedCategory);
      onSpinEnd(selectedCategory);
      // Normalize rotation state for the next spin's calculation
      setCurrentRotation(prev => prev % 360);
    }, 4000); // Duration matches CSS transition
  }, [isSpinning, selectableCategories, displayCategories, anglePerSegment, onSpinEnd]);

  useEffect(() => {
    setCurrentRotation(0);
    setFinalSelectedCategory(null);
    setIsSpinning(false);
  }, [categories]);

  if (categories.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto text-center shadow-xl">
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
      <Card className="w-full max-w-md mx-auto text-center shadow-xl">
        <CardHeader>
          <CardTitle className="title-text text-2xl">Ruleta de Categorías</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
           <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <p className="text-amber-600">Ninguna categoría tiene palabras.</p>
          <p className="text-sm text-muted-foreground">Añade palabras a las categorías para poder jugar.</p>
           <Button
            onClick={spin}
            disabled={true}
            className="w-full text-lg py-6 mt-6"
            size="lg"
            >
            <Zap className="mr-2 h-6 w-6" />
            Girar
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto text-center shadow-xl transform transition-all duration-300 hover:shadow-2xl">
      <CardHeader>
        <CardTitle className="title-text text-3xl">¡Gira la Ruleta!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex flex-col items-center">
        <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
          <svg 
            viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`} 
            className="overflow-visible" // Allow pointer to peek out
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
                  <path d={segment.path} fill={segment.fill} stroke="#FFFFFF" strokeWidth="1.5"/>
                  <text 
                    fill="#000000" 
                    dy="-2" // Offset text slightly from the path
                    className="pointer-events-none select-none font-medium"
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
            className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1.5" // Adjusted to sit on the line
            style={{
              width: 0,
              height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '22px solid hsl(var(--primary))', 
              zIndex: 10,
            }}
          />
          {/* Center decorative circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-card border-[5px] border-primary rounded-full shadow-lg z-5 flex items-center justify-center">
             <Zap className="w-8 h-8 text-primary" />
          </div>
        </div>

        {finalSelectedCategory && !isSpinning && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg shadow">
            <p className="text-sm text-muted-foreground">Categoría seleccionada:</p>
            <p className="text-2xl font-bold text-primary">{finalSelectedCategory.name}</p>
          </div>
        )}
        
        <Button
          onClick={spin}
          disabled={isSpinning || selectableCategories.length === 0}
          className="w-full text-lg py-6 transform transition-transform duration-150 hover:scale-105 active:scale-95 mt-4"
          size="lg"
        >
          <Zap className="mr-2 h-6 w-6" />
          {isSpinning ? 'Girando...' : (finalSelectedCategory ? 'Girar de Nuevo' : 'Girar')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Roulette;

