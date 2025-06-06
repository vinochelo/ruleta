
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, AlertTriangle, Loader2 } from 'lucide-react';
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
const WHEEL_RADIUS = WHEEL_SIZE / 2 - 10; // 190
const CENTER_X = WHEEL_SIZE / 2; // 200
const CENTER_Y = WHEEL_SIZE / 2; // 200
const TEXT_RADIUS_OFFSET = 15; 
const TEXT_MAX_LENGTH = 20;

// Helper function to round numbers to a fixed number of decimal places
const round = (num: number, decimalPlaces: number = 3): number => {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(num * factor) / factor;
};

// Helper function to determine text color (black or white) based on background brightness
function getTextColorForBackground(hexcolor: string): string {
  hexcolor = hexcolor.replace("#", "");
  const r = parseInt(hexcolor.substring(0, 2), 16);
  const g = parseInt(hexcolor.substring(2, 4), 16);
  const b = parseInt(hexcolor.substring(4, 6), 16);
  // Calculate YIQ (perceived brightness)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF'; 
}


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
        `M ${CENTER_X},${CENTER_Y}`,
        `L ${startX},${startY}`,
        `A ${WHEEL_RADIUS},${WHEEL_RADIUS} 0 ${largeArcFlag} 1 ${endX},${endY}`,
        `Z`,
      ].join(' ');

      const midAngle = startAngle + anglePerSegment / 2;
      const textPathAngleSpread = Math.min(anglePerSegment * 0.65, 65); 
      const textArcRadius = WHEEL_RADIUS - TEXT_RADIUS_OFFSET; // e.g. 190 - 15 = 175
      
      const [textPathStartX, textPathStartY] = getCoordinatesForAngle(midAngle - textPathAngleSpread / 2, textArcRadius);
      const [textPathEndX, textPathEndY] = getCoordinatesForAngle(midAngle + textPathAngleSpread / 2, textArcRadius);
      
      const textPathId = `textPath_${category.id.replace(/[^a-zA-Z0-9]/g, '')}_${i}`;
      // Determine sweep-flag for text path: 0 for shorter arc, 1 for longer.
      // Since textPathAngleSpread is max 65, it will always be the shorter arc (0)
      const textArcSweepFlag = textPathAngleSpread <= 180 ? 0 : 1; // Should generally be 0
      // For text path, ensure arc direction is consistent (e.g., always clockwise, '1')
      const textArcPathData = `M ${textPathStartX},${textPathStartY} A ${textArcRadius},${textArcRadius} 0 ${textArcSweepFlag} 1 ${textPathEndX},${textPathEndY}`;
      
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
        textPathId,
        textArcPathData,
        textAnchor: "middle",
        fontSize: Math.max(9, Math.min(14, anglePerSegment * 0.30)), 
      };
    });
  }, [displayCategories, numSegments, anglePerSegment, getCoordinatesForAngle]);

  const spin = useCallback(() => {
    if (isSpinning || selectableCategories.length === 0) return;

    setIsSpinning(true);
    setFinalSelectedCategory(null);

    const randomIndex = Math.floor(Math.random() * selectableCategories.length);
    const selectedCategory = selectableCategories[randomIndex];
    
    // Find the index in displayCategories for rotation calculation
    const displayIndex = displayCategories.findIndex(cat => cat.id === selectedCategory.id);
    const targetDisplayIndex = displayIndex !== -1 ? displayIndex : 0; // Fallback, should always be found

    const spins = 5 + Math.floor(Math.random() * 3); 
    const baseRotation = 360 * spins; 
    
    // Calculate the target angle to align the pointer with the middle of the selected segment
    const targetSegmentMidpointAngle = (targetDisplayIndex * anglePerSegment) + (anglePerSegment / 2);
    
    // The pointer is at the top (0 degrees in standard SVG coordinate systems, but our angles might be different)
    // We want the targetSegmentMidpointAngle to end up at the pointer position (e.g. 0 or 360)
    // The rotation is applied to the wheel, so if a segment's midpoint is at `targetAngle`,
    // we need to rotate the wheel by `-targetAngle` for it to align with a 0-degree pointer.
    // However, our pointer is effectively at 270 degrees (top) in the context of angle calculation starting from right horizontal.
    // Let's adjust so the selected segment's *start* angle aligns with the top, then shift by half segment.
    // The pointer is at the 12 o'clock position. Angles are calculated clockwise starting from 3 o'clock.
    // The 12 o'clock position is -90 degrees or 270 degrees.
    // The final rotation value needs to make the *middle* of the selected segment land under the pointer.
    // The pointer is at the top.
    // `currentRotation` increases clockwise.
    // If a segment's middle is at angle A (0 deg = right, 90 = bottom, 180 = left, 270 = top),
    // we want to rotate the wheel so that A becomes 270 (or -90).
    // So, targetRotation = currentRotation_offset - A.
    // The pointer is fixed at what corresponds to 270 degrees in a typical Cartesian to SVG angle.
    // The initial state is 0 rotation. The segments are drawn. Segment 0 is from 0 to anglePerSegment.
    // If segment 0 is selected, its middle is anglePerSegment/2. We want anglePerSegment/2 to be at the top.
    // The top is equivalent to an angle of 270 degrees in a system where 0 is to the right.
    // `finalRotationValue` is the total accumulated rotation.
    // Rotation `R` means segment originally at angle `theta` moves to `theta + R`.
    // We want `targetSegmentMidpointAngle + finalRotationValue` to effectively be at the pointer (270 deg or -90 deg).
    // Let `P` be the pointer angle (270). `targetSegmentMidpointAngle + R = P (mod 360) + k*360`
    // `R = P - targetSegmentMidpointAngle + k*360`. We want R to be large and positive.
    // So `finalRotationValue = baseRotation + (270 - targetSegmentMidpointAngle)`
    // Or, more simply, the pointer is at the "top", so the target angle is 0 if we imagine the coordinate system is rotated.
    // The formula `baseRotation - targetSegmentMidpointAngle` effectively tries to bring the target segment's midpoint to angle 0 (right).
    // We need to align it to the top (which is -90 or 270 in a system where 0 is right).
    // Let's adjust `finalRotationValue` to align the center of the segment to the top pointer.
    // The pointer is at 12 o'clock. An angle of 0 for a segment usually starts at 3 o'clock and goes CCW for math, CW for SVG paths.
    // Our `getCoordinatesForAngle` uses `angleDegrees - 90` for radians, meaning 0 degrees is top.
    // So we want `targetSegmentMidpointAngle` (where 0 means start of first segment at the top) to be 0.
    // Thus, `finalRotationValue = baseRotation - targetSegmentMidpointAngle` is correct if 0 is the top.
    
    // Let's re-verify the coordinate system and rotation:
    // `getCoordinatesForAngle` uses `(angleDegrees - 90) * Math.PI / 180`.
    // This means angleDegrees = 0 is mapped to -90 rad (-PI/2), which is (0, -radius) -> top.
    // angleDegrees = 90 is mapped to 0 rad, which is (radius, 0) -> right.
    // So, 0 degrees in our system IS the top.
    // Therefore, `targetSegmentMidpointAngle` should align with 0 after rotation.
    // `finalRotationValue` should be `baseRotation - targetSegmentMidpointAngle`.

    const finalRotationValue = baseRotation - targetSegmentMidpointAngle;

    setCurrentRotation(finalRotationValue);

    setTimeout(() => {
      setIsSpinning(false);
      setFinalSelectedCategory(selectedCategory);
      onSpinEnd(selectedCategory);
      // Reset rotation for next spin to be clean, but keep visual state until modal interaction.
      // The actual rotation displayed is `currentRotation`.
      // To make the selected segment stay at the top after spinning:
      // Set currentRotation to a value that makes targetSegmentMidpointAngle be at 0.
      // const restingRotation = -(targetSegmentMidpointAngle % 360);
      // setCurrentRotation(restingRotation); // This would make it snap after spin. Not desired.
      // The CSS transition handles the spin. The `finalRotationValue` is the end state.
    }, 4000); 
  }, [isSpinning, selectableCategories, displayCategories, anglePerSegment, onSpinEnd]);

  useEffect(() => {
    // Reset visual rotation when categories change (e.g. navigating away and back)
    // But not to 0 if a category was just selected.
    // This useEffect might be too broad.
    // Let's only reset if it's not a spin finalization.
    if (!isSpinning && !finalSelectedCategory) {
       setCurrentRotation(0);
    }
  }, [categories, isSpinning, finalSelectedCategory]); 

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
      <CardContent className="space-y-8 flex flex-col items-center p-6 pt-2 sm:p-8 sm:pt-4">
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
                    fill={segment.textColor} 
                    dominantBaseline="middle"
                    className="pointer-events-none select-none font-semibold"
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
          {/* Center spin button */}
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
                <Gamepad2 className="w-10 h-10 text-primary" />
             )}
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
};

export default Roulette;


    