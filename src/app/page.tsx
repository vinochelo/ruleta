
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

interface Category {
  id: string;
  name: string;
  words: string[];
}

const DEFAULT_CATEGORIES_WITH_WORDS: Category[] = [
  { id: crypto.randomUUID(), name: "Objetos", words: ["Silla", "Mesa", "Lámpara", "Libro", "Teléfono", "Taza", "Reloj", "Gafas"] },
  { id: crypto.randomUUID(), name: "Animales", words: ["Perro", "Gato", "Elefante", "León", "Jirafa", "Tigre", "Oso", "Pájaro"] },
  { id: crypto.randomUUID(), name: "Comida", words: ["Manzana", "Pizza", "Hamburguesa", "Pasta", "Helado", "Sushi", "Ensalada", "Pan"] },
  { id: crypto.randomUUID(), name: "Acciones", words: ["Correr", "Saltar", "Nadar", "Escribir", "Leer", "Cantar", "Bailar", "Cocinar"] },
  { id: crypto.randomUUID(), name: "Lugares", words: ["Playa", "Montaña", "Ciudad", "Bosque", "Desierto", "Parque", "Escuela", "Museo"] },
  { id: crypto.randomUUID(), name: "Personajes Famosos", words: ["Einstein", "Chaplin", "Picasso", "Mozart", "Cleopatra", "Da Vinci", "Marie Curie", "Shakespeare"] },
  { id: crypto.randomUUID(), name: "Películas y Series", words: ["Titanic", "Star Wars", "Friends", "Stranger Things", "Harry Potter", "El Padrino", "Juego de Tronos", "Breaking Bad"] }
];

const PICTIONARY_DURATION = 60; // seconds

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES_WITH_WORDS.map(c => ({...c, id: crypto.randomUUID()})));
  const [selectedCategoryFull, setSelectedCategoryFull] = useState<Category | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
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

        if (Array.isArray(parsedStoredCategories) && parsedStoredCategories.length > 0) {
          const firstItem = parsedStoredCategories[0];
          if (typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem && 'words' in firstItem && Array.isArray(firstItem.words)) {
            // Valid Category[] format
            setCategories(parsedStoredCategories as Category[]);
          } else {
             // If format is old (string[] or {id, name}[]) or malformed, CategoryManagement will handle migration on its page.
             // Here, we prefer defaults if the format isn't perfect to avoid runtime errors.
             // Or, try a light migration here too if it's just missing 'words'
             if (typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem && !('words' in firstItem)) {
                setCategories((parsedStoredCategories as Array<{id: string, name: string}>).map(cat => ({...cat, words: []})));
             } else {
                console.warn("Categories from localStorage in HomePage are not in the expected Category[] format. Using defaults.");
                setCategories(DEFAULT_CATEGORIES_WITH_WORDS.map(c => ({...c, id: crypto.randomUUID()})));
             }
          }
        } else if (Array.isArray(parsedStoredCategories) && parsedStoredCategories.length === 0) {
            // Empty array, use defaults
            setCategories(DEFAULT_CATEGORIES_WITH_WORDS.map(c => ({...c, id: crypto.randomUUID()})));
        }
      } catch (error) {
        console.error("Failed to parse categories from localStorage in HomePage", error);
        // Default categories are already set by useState or will be set above.
        setCategories(DEFAULT_CATEGORIES_WITH_WORDS.map(c => ({...c, id: crypto.randomUUID()})));
      }
    }
    // If storedCategoriesRaw is null, default categories are used from useState.
  }, []);

  const handleSpinEnd = useCallback((category: Category) => {
    setSelectedCategoryFull(category);
    let wordToDraw = category.name; // Default to category name if no words
    if (category.words && category.words.length > 0) {
      wordToDraw = category.words[Math.floor(Math.random() * category.words.length)];
    }
    setSelectedWord(wordToDraw);
    setIsModalOpen(true);

    const announcement = `Categoría: ${category.name}. Palabra: ${wordToDraw}.`;
    if (speechSupported) {
      speak(announcement);
    } else {
      toast({ title: "Seleccionado", description: announcement });
    }
  }, [speak, speechSupported, toast]);

  const handleStartPictionary = useCallback(() => {
    setIsModalOpen(false);
    setShowTimer(true);
    setIsTimerActive(true);
    if (selectedCategoryFull && selectedWord) {
       const pictionaryTask = selectedWord; // Use the specific word
       toast({ title: "¡A dibujar!", description: `Tienes ${PICTIONARY_DURATION} segundos para "${pictionaryTask}".` });
       if(speechSupported) speak(`¡Tiempo para ${pictionaryTask}! ${PICTIONARY_DURATION} segundos.`);
    }
  }, [selectedCategoryFull, selectedWord, toast, speechSupported]);

  const handleTimerEnd = useCallback(() => {
    setIsTimerActive(false);
    toast({ title: "¡Tiempo!", description: "La ronda ha terminado.", variant: "destructive" });
    if (speechSupported) {
      speak("¡Se acabó el tiempo!");
    }
  }, [toast, speechSupported]);

  return (
    <div className="space-y-12">
      <Roulette categories={categories} onSpinEnd={handleSpinEnd} />

      {showTimer && selectedCategoryFull && selectedWord && (
        <div className="mt-12 flex flex-col items-center">
           <h2 className="text-2xl font-bold text-center mb-1 title-text">Ronda de Pictionary</h2>
           <p className="text-lg text-center mb-4 text-foreground/80">Categoría: {selectedCategoryFull.name} - Palabra: <span className="font-semibold text-primary">{selectedWord}</span></p>
          <Timer
            key={`${selectedCategoryFull.id}-${selectedWord}`} // Re-mount timer if category or word changes
            initialDuration={PICTIONARY_DURATION}
            onTimerEnd={handleTimerEnd}
            autoStart={isTimerActive}
          />
        </div>
      )}

      <ResultsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCategoryName={selectedCategoryFull?.name || null}
        selectedWord={selectedWord}
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
            ¿Quieres añadir tus propias categorías y palabras? ¡Es fácil!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Visita la página de gestión de categorías para crear, editar o eliminar las temáticas y palabras de tu ruleta.
          </p>
          <Button asChild variant="secondary" className="transition-transform hover:scale-105">
            <Link href="/manage-categories">Administrar Categorías y Palabras</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    