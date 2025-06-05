
"use client";

import { useState, useEffect, useCallback } from 'react';
import Roulette from '@/components/roulette/Roulette';
import ResultsModal from '@/components/roulette/ResultsModal';
import Timer from '@/components/timer/Timer';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const DEFAULT_CATEGORIES = ["Objetos", "Animales", "Comida", "Acciones", "Lugares", "Personajes Famosos", "Películas y Series"];
const PICTIONARY_DURATION = 60; // seconds

interface StoredCategory {
  id: string;
  name: string;
}

export default function HomePage() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const { speak, isSupported: speechSupported } = useSpeechSynthesis();
  const { toast } = useToast();

  useEffect(() => {
    const storedCategoriesRaw = localStorage.getItem('ruletaRupestreCategories');
    if (storedCategoriesRaw) {
      try {
        const parsedStoredCategories: unknown = JSON.parse(storedCategoriesRaw);

        if (
          Array.isArray(parsedStoredCategories) &&
          parsedStoredCategories.length > 0
        ) {
          // Check if the items are objects with a 'name' property (new format)
          if (
            parsedStoredCategories.every(
              (cat: any) => typeof cat === 'object' && cat !== null && typeof cat.name === 'string'
            )
          ) {
            setCategories((parsedStoredCategories as StoredCategory[]).map(cat => cat.name));
          }
          // Check if the items are strings (potentially old format, though CategoryManagement should migrate)
          else if (parsedStoredCategories.every((cat: any) => typeof cat === 'string')) {
            setCategories(parsedStoredCategories as string[]);
          }
          // If neither, the format is unexpected; defaults are already set.
        }
        // If parsedStoredCategories is an empty array or not an array, defaults are used.
      } catch (error) {
        console.error("Failed to parse categories from localStorage in HomePage", error);
        localStorage.removeItem('ruletaRupestreCategories'); // Clear corrupted data
        // Default categories are already set by useState.
      }
    }
    // If storedCategoriesRaw is null, default categories (string[]) are used from useState.
  }, []);

  const handleSpinEnd = useCallback((category: string) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
    if (speechSupported) {
      speak(`Categoría seleccionada: ${category}`);
    } else {
      toast({ title: "Categoría Seleccionada", description: category });
    }
  }, [speak, speechSupported, toast]);

  const handleStartPictionary = useCallback(() => {
    setIsModalOpen(false);
    setShowTimer(true);
    setIsTimerActive(true);
    if (selectedCategory) {
       toast({ title: "¡A dibujar!", description: `Tienes ${PICTIONARY_DURATION} segundos para ${selectedCategory}.` });
       if(speechSupported) speak(`¡Tiempo para ${selectedCategory}! ${PICTIONARY_DURATION} segundos.`);
    }
  }, [selectedCategory, toast, speechSupported]);

  const handleTimerEnd = useCallback(() => {
    setIsTimerActive(false);
    // setShowTimer(false); // Optionally hide timer after end
    toast({ title: "¡Tiempo!", description: "La ronda ha terminado.", variant: "destructive" });
    if (speechSupported) {
      speak("¡Se acabó el tiempo!");
    }
  }, [toast, speechSupported]);

  return (
    <div className="space-y-12">
      <Roulette categories={categories} onSpinEnd={handleSpinEnd} />

      {showTimer && selectedCategory && (
        <div className="mt-12 flex flex-col items-center">
           <h2 className="text-2xl font-bold text-center mb-4 title-text">Ronda de Pictionary: {selectedCategory}</h2>
          <Timer
            key={selectedCategory} // Re-mount timer if category changes to reset it properly
            initialDuration={PICTIONARY_DURATION}
            onTimerEnd={handleTimerEnd}
            autoStart={isTimerActive}
          />
        </div>
      )}

      <ResultsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCategory={selectedCategory}
        onStartPictionary={handleStartPictionary}
      />

      {!speechSupported && (
        <Card className="mt-8 bg-destructive/10 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><Volume2 /> Aviso de Audio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive/80">Tu navegador no soporta la síntesis de voz. Los anuncios se mostrarán como notificaciones.</p>
          </CardContent>
        </Card>
      )}
       <Card className="mt-8">
        <CardHeader>
          <CardTitle className="title-text flex items-center gap-2"><Settings2 /> Personaliza tu Juego</CardTitle>
          <CardDescription>
            ¿Quieres añadir tus propias categorías? ¡Es fácil!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Visita la página de gestión de categorías para crear, editar o eliminar las temáticas de tu ruleta.
          </p>
          <Button asChild variant="secondary" className="transition-transform hover:scale-105">
            <Link href="/manage-categories">Administrar Categorías</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
