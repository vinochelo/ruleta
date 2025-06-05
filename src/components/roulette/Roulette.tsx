
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface RouletteProps {
  categories: string[];
  onSpinEnd: (selectedCategory: string) => void;
}

const Roulette: React.FC<RouletteProps> = ({ categories, onSpinEnd }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const spin = useCallback(() => {
    if (isSpinning || categories.length === 0) return;

    setIsSpinning(true);
    setHighlightedIndex(0); // Start highlight from 0 for visual consistency
    setSelectedCategory(null); // Clear previous visual selection

    let spinCount = 0;
    // Ensure at least 2 full cycles + random part of a cycle for variability
    const minCycles = 2;
    const totalSpinIterations = (categories.length * minCycles) + Math.floor(Math.random() * categories.length);
    const spinIntervalTime = 100; // ms

    const intervalId = setInterval(() => {
      const currentDisplayIndex = spinCount % categories.length;
      setHighlightedIndex(currentDisplayIndex);
      spinCount++;

      if (spinCount > totalSpinIterations) {
        clearInterval(intervalId);
        setIsSpinning(false);
        // The category that was last set by setHighlightedIndex was categories[currentDisplayIndex]
        const finalCategory = categories[currentDisplayIndex];
        setSelectedCategory(finalCategory);
        onSpinEnd(finalCategory);
      }
    }, spinIntervalTime);
  }, [categories, isSpinning, onSpinEnd]);

  useEffect(() => {
    // Reset if categories change
    setIsSpinning(false);
    setHighlightedIndex(null);
    setSelectedCategory(null);
  }, [categories]);

  if (categories.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto text-center shadow-xl">
        <CardHeader>
          <CardTitle className="title-text text-2xl">Ruleta de Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay categorías disponibles. Añade algunas en la sección de "Categorías".</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto text-center shadow-xl transform transition-all duration-300 hover:shadow-2xl">
      <CardHeader>
        <CardTitle className="title-text text-3xl">¡Gira la Ruleta!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="min-h-[150px] p-4 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center bg-primary/5">
          {isSpinning && highlightedIndex !== null && (
            <p className="text-4xl font-bold text-primary animate-pulse">
              {categories[highlightedIndex]}
            </p>
          )}
          {!isSpinning && selectedCategory && (
            <p className="text-4xl font-bold text-accent">
              {selectedCategory}
            </p>
          )}
          {!isSpinning && !selectedCategory && (
            <p className="text-xl text-muted-foreground">Presiona "Girar" para empezar</p>
          )}
        </div>

        {/* Conditionally render the list of categories: only show when not spinning */}
        {!isSpinning && categories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-4 max-h-40 overflow-y-auto p-2 bg-muted/30 rounded-md">
            {categories.map((category, index) => (
              <div
                key={index}
                className={`p-2 border rounded-md text-sm truncate transition-all duration-100
                  ${(selectedCategory === category) ? 'bg-green-500 text-white font-semibold shadow-lg scale-105' : 'bg-card hover:bg-secondary/80'}
                `}
              >
                {category}
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={spin}
          disabled={isSpinning} // spin function already checks for categories.length === 0
          className="w-full text-lg py-6 transform transition-transform duration-150 hover:scale-105 active:scale-95"
          size="lg"
        >
          <Zap className="mr-2 h-6 w-6" />
          {isSpinning ? 'Girando...' : (selectedCategory ? 'Girar de Nuevo' : 'Girar')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Roulette;

    