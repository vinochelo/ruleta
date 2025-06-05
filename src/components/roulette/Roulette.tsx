
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  words: string[];
}

interface RouletteProps {
  categories: Category[];
  onSpinEnd: (selectedCategory: Category) => void;
}

const rouletteColors = [
  "bg-red-400", "bg-blue-400", "bg-green-400", "bg-yellow-400", 
  "bg-purple-400", "bg-pink-400", "bg-indigo-400", "bg-teal-400",
  "bg-orange-400", "bg-lime-400", "bg-cyan-400", "bg-fuchsia-400"
];

const Roulette: React.FC<RouletteProps> = ({ categories, onSpinEnd }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [finalSelectedCategory, setFinalSelectedCategory] = useState<Category | null>(null); // Stores the actual selected category object

  const spin = useCallback(() => {
    if (isSpinning || categories.length === 0) return;

    const validCategories = categories.filter(cat => cat.words && cat.words.length > 0);
    if (validCategories.length === 0) {
        // Optionally, inform user that no categories have words
        // For now, if no valid categories, don't spin or pick the first one if it exists
        if (categories.length > 0) {
            setFinalSelectedCategory(categories[0]); // Default to first if no words anywhere
            onSpinEnd(categories[0]);
        }
        return;
    }


    setIsSpinning(true);
    setHighlightedIndex(0); 
    setFinalSelectedCategory(null); 

    let spinCount = 0;
    const minCycles = 2;
    // Spin through valid categories only for selection logic, but display can use all for effect
    const displayCategories = categories; // Could be all categories or just valid ones for display
    const totalSpinIterations = (displayCategories.length * minCycles) + Math.floor(Math.random() * displayCategories.length);
    const spinIntervalTime = 100; 

    const intervalId = setInterval(() => {
      const currentDisplayIndex = spinCount % displayCategories.length;
      setHighlightedIndex(currentDisplayIndex);
      spinCount++;

      if (spinCount > totalSpinIterations) {
        clearInterval(intervalId);
        setIsSpinning(false);
        
        // Actual selection from categories with words
        const randomIndexInValid = Math.floor(Math.random() * validCategories.length);
        const trulySelectedCategory = validCategories[randomIndexInValid];
        
        // Find the index of this truly selected category in the original full list for display consistency
        const finalDisplayIndex = displayCategories.findIndex(cat => cat.id === trulySelectedCategory.id);
        setHighlightedIndex(finalDisplayIndex !== -1 ? finalDisplayIndex : 0); // Fallback if not found

        setFinalSelectedCategory(trulySelectedCategory);
        onSpinEnd(trulySelectedCategory);
      }
    }, spinIntervalTime);
  }, [categories, isSpinning, onSpinEnd]);

  useEffect(() => {
    setIsSpinning(false);
    setHighlightedIndex(null);
    setFinalSelectedCategory(null);
  }, [categories]);

  const currentDisplayCategory = highlightedIndex !== null && categories[highlightedIndex] ? categories[highlightedIndex] : null;

  if (categories.length === 0) {
    return (
      <Card className="w-full max-w-lg mx-auto text-center shadow-xl">
        <CardHeader>
          <CardTitle className="title-text text-2xl">Ruleta de Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay categorías disponibles. Añade algunas en la sección de "Categorías y Palabras".</p>
        </CardContent>
      </Card>
    );
  }
  
  const categoriesWithWords = categories.filter(cat => cat.words && cat.words.length > 0);
   if (categoriesWithWords.length === 0 && categories.length > 0) {
    return (
      <Card className="w-full max-w-lg mx-auto text-center shadow-xl">
        <CardHeader>
          <CardTitle className="title-text text-2xl">Ruleta de Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Ninguna categoría tiene palabras. Añade palabras a las categorías para poder jugar.</p>
           <Button
            onClick={spin}
            disabled={true}
            className="w-full text-lg py-6 mt-4"
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
    <Card className="w-full max-w-lg mx-auto text-center shadow-xl transform transition-all duration-300 hover:shadow-2xl">
      <CardHeader>
        <CardTitle className="title-text text-3xl">¡Gira la Ruleta!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div 
          className={`min-h-[150px] p-4 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-150 ease-in-out
            ${isSpinning && currentDisplayCategory ? rouletteColors[highlightedIndex! % rouletteColors.length] : 'bg-primary/5 border-primary/50'}
            ${!isSpinning && finalSelectedCategory ? rouletteColors[categories.findIndex(c=>c.id === finalSelectedCategory.id) % rouletteColors.length] : ''}
          `}
        >
          {isSpinning && currentDisplayCategory && (
            <p className="text-4xl font-bold text-white animate-pulse">
              {currentDisplayCategory.name}
            </p>
          )}
          {!isSpinning && finalSelectedCategory && (
            <p className="text-4xl font-bold text-white"> {/* White text for better contrast on colored bg */}
              {finalSelectedCategory.name}
            </p>
          )}
          {!isSpinning && !finalSelectedCategory && (
            <p className="text-xl text-muted-foreground">Presiona "Girar" para empezar</p>
          )}
        </div>

        {!isSpinning && categories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-4 max-h-40 overflow-y-auto p-2 bg-muted/30 rounded-md">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className={`p-2 border rounded-md text-sm truncate transition-all duration-100
                  ${(finalSelectedCategory?.id === category.id) ? `${rouletteColors[index % rouletteColors.length]} text-white font-semibold shadow-lg scale-105` : 'bg-card hover:bg-secondary/80'}
                  ${(!category.words || category.words.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title={(!category.words || category.words.length === 0) ? `${category.name} (sin palabras)` : category.name}
              >
                {category.name}
                {(!category.words || category.words.length === 0) && <span className="text-xs"> (vacía)</span>}
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={spin}
          disabled={isSpinning || categoriesWithWords.length === 0}
          className="w-full text-lg py-6 transform transition-transform duration-150 hover:scale-105 active:scale-95"
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

    