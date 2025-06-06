
"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit3, PlusCircle, ListChecks, X, Plus, Brain, Loader2 } from 'lucide-react';
import EditCategoryDialog from './EditCategoryDialog';
import SuggestWordsDialog from './SuggestWordsDialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { suggestWordsForCategory, type SuggestWordsInput, type SuggestWordsOutput } from '@/ai/flows/suggest-words-flow';

const STORAGE_KEY = 'ruletaRupestreCategories';

interface Category {
  id: string;
  name: string;
  words: string[];
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "default-objetos-uuid", name: "Objetos", words: ["Silla", "Mesa", "Lámpara", "Libro", "Teléfono", "Taza", "Reloj", "Gafas", "Llave", "Peine"] },
  { id: "default-animales-uuid", name: "Animales", words: ["Perro", "Gato", "Elefante", "León", "Jirafa", "Tigre", "Oso", "Pájaro", "Serpiente", "Mariposa"] },
  { id: "default-comida-uuid", name: "Comida", words: ["Manzana", "Pizza", "Hamburguesa", "Pasta", "Helado", "Sushi", "Ensalada", "Pan", "Chocolate", "Queso"] },
  { id: "default-acciones-uuid", name: "Acciones", words: ["Correr", "Saltar", "Nadar", "Escribir", "Leer", "Cantar", "Bailar", "Cocinar", "Volar", "Pintar"] },
  { id: "default-lugares-uuid", name: "Lugares", words: ["Playa", "Montaña", "Ciudad", "Bosque", "Desierto", "Parque", "Escuela", "Museo", "Hospital", "Restaurante"] },
  { id: "default-personajes-uuid", name: "Personajes Famosos", words: ["Einstein", "Chaplin", "Picasso", "Mozart", "Cleopatra", "Da Vinci", "Marie Curie", "Shakespeare", "Gandhi", "Frida Kahlo"] },
  { id: "default-peliculas-uuid", name: "Películas y Series", words: ["Titanic", "Star Wars", "Friends", "Stranger Things", "Harry Potter", "El Padrino", "Juego de Tronos", "Breaking Bad", "Matrix", "Casablanca"] }
];

interface MultiAiContext {
  isActive: boolean;
  names: string[];
  currentIndex: number;
  originalInput: string;
}

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newWordInputs, setNewWordInputs] = useState<{ [categoryId: string]: string }>({});
  const { toast } = useToast();

  const [isSuggestWordsDialogOpen, setIsSuggestWordsDialogOpen] = useState(false);
  const [aiSuggestedWords, setAiSuggestedWords] = useState<string[]>([]);
  const [categoryForAISuggestion, setCategoryForAISuggestion] = useState<string>('');
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [targetCategoryIdForAIWords, setTargetCategoryIdForAIWords] = useState<string | null>(null);

  const [multiAiContext, setMultiAiContext] = useState<MultiAiContext>({ 
    isActive: false, names: [], currentIndex: 0, originalInput: '' 
  });
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);


  useEffect(() => {
    const storedCategoriesRaw = localStorage.getItem(STORAGE_KEY);
    if (storedCategoriesRaw) {
      try {
        const parsedCategories = JSON.parse(storedCategoriesRaw);
        if (Array.isArray(parsedCategories)) {
          if (parsedCategories.length > 0) {
            const validatedCategories = (parsedCategories as any[]).map(cat => ({
                id: cat.id || crypto.randomUUID(),
                name: cat.name || "Categoría sin nombre",
                words: Array.isArray(cat.words) ? cat.words : [],
            }));
            setCategories(validatedCategories as Category[]);
          } else { 
            setCategories([...DEFAULT_CATEGORIES]);
          }
        } else { 
          console.warn("Malformed categories in localStorage (not an array), resetting to default.");
          resetToDefaultCategories();
        }
      } catch (error) {
        console.error("Failed to parse categories from localStorage", error);
        resetToDefaultCategories();
      }
    } else {
      resetToDefaultCategories();
    }
  }, []);
  
  const persistCategories = useCallback((updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCategories));
  }, []);
  
  const resetToDefaultCategories = useCallback(() => {
    persistCategories([...DEFAULT_CATEGORIES]);
    toast({ title: "Categorías Restauradas", description: "Se han restaurado las categorías y palabras por defecto." });
  }, [persistCategories, toast]);


  const handleAddCategory = async (e: FormEvent, suggestWithAI: boolean = false) => {
    e.preventDefault();
    const originalInput = newCategoryName.trim();

    if (originalInput === '') {
      toast({ title: "Error", description: "El nombre de la categoría no puede estar vacío.", variant: "destructive" });
      return;
    }

    if (suggestWithAI) {
      const categoryNamesArray = originalInput.split(',').map(name => name.trim()).filter(name => name !== '');
      if (categoryNamesArray.length === 0) {
        toast({ title: "Error", description: "Por favor, introduce nombres de categoría válidos.", variant: "destructive" });
        return;
      }

      const uniqueLowerNames = new Set(categoryNamesArray.map(name => name.toLowerCase()));
      if (uniqueLowerNames.size !== categoryNamesArray.length) {
        toast({ title: "Error", description: "Nombres de categoría duplicados en la entrada. Por favor, usa nombres únicos.", variant: "destructive" });
        return;
      }

      for (const catName of categoryNamesArray) {
        if (categories.some(cat => cat.name.toLowerCase() === catName.toLowerCase())) {
          toast({ title: "Error", description: `La categoría "${catName}" ya existe. No se procesarán las categorías con IA.`, variant: "destructive" });
          return;
        }
      }
      
      setNewCategoryName(''); // Clear input as batch processing will start
      setMultiAiContext({ isActive: true, names: categoryNamesArray, currentIndex: 0, originalInput: originalInput });
      setIsBatchProcessing(true);

    } else { // Manual add (single category, name can include commas if user types it)
      if (categories.some(cat => cat.name.toLowerCase() === originalInput.toLowerCase())) {
        toast({ title: "Error", description: "Esta categoría ya existe.", variant: "destructive" });
        return;
      }
      const newCategory: Category = { id: crypto.randomUUID(), name: originalInput, words: [] };
      persistCategories([...categories, newCategory]);
      setNewCategoryName('');
      toast({ title: "Categoría Añadida", description: `"${newCategory.name}" ha sido añadida.` });
    }
  };

  const proceedToNextMultiAiCategory = useCallback(() => {
    setIsSuggestWordsDialogOpen(false); // Ensure dialog is closed
    if (multiAiContext.isActive) {
      setMultiAiContext(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    }
  }, [multiAiContext.isActive]);

  useEffect(() => {
    if (!multiAiContext.isActive) {
      setIsBatchProcessing(false);
      return;
    }
    setIsBatchProcessing(true);

    const processCurrentAiCategory = async () => {
      if (multiAiContext.currentIndex >= multiAiContext.names.length) {
        // All categories processed
        setMultiAiContext({ isActive: false, names: [], currentIndex: 0, originalInput: '' });
        toast({title: "Proceso Completado", description: "Todas las categorías solicitadas con IA han sido procesadas."});
        // setNewCategoryName(''); // Already cleared when starting batch
        return;
      }

      const currentName = multiAiContext.names[multiAiContext.currentIndex];
      
      // Double check for existence in case it was added another way during a long pause
      if (categories.some(cat => cat.name.toLowerCase() === currentName.toLowerCase())) {
        toast({ title: "Categoría Omitida", description: `"${currentName}" ya existe o fue añadida mientras se procesaba. Omitiendo sugerencias IA.`, variant: "default" });
        proceedToNextMultiAiCategory();
        return;
      }

      setCategoryForAISuggestion(currentName);
      setTargetCategoryIdForAIWords(null); // Crucial for new category flow in handleAddAISuggestedWords
      setIsAISuggesting(true);
      setAiSuggestedWords([]);
      setIsSuggestWordsDialogOpen(true); // Open the dialog

      try {
        const result: SuggestWordsOutput = await suggestWordsForCategory({ categoryName: currentName });
        const suggested = result.suggestedWords || [];
        setAiSuggestedWords(suggested);
        if (suggested.length === 0) {
            toast({ title: "Sugerencias IA", description: `La IA no generó ninguna palabra para "${currentName}". Aún puedes añadirlas manualmente.`});
        }
      } catch (error) {
        console.error(`AI suggestion error for ${currentName}:`, error);
        toast({ title: "Error de IA", description: `No se pudieron sugerir palabras para "${currentName}".`, variant: "destructive" });
        setAiSuggestedWords([]); // Ensure it's empty on error
      } finally {
        setIsAISuggesting(false); // Loading finished for AI call, dialog remains open
      }
    };

    processCurrentAiCategory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiAiContext.isActive, multiAiContext.currentIndex, multiAiContext.names, categories, persistCategories, toast, proceedToNextMultiAiCategory]);


  const handleDeleteCategory = (id: string) => {
    const categoryToDelete = categories.find(cat => cat.id === id);
    persistCategories(categories.filter((category) => category.id !== id));
    if (categoryToDelete) {
      toast({ title: "Categoría Eliminada", description: `"${categoryToDelete.name}" ha sido eliminada.`, variant: "destructive" });
    }
  };

  const handleEditCategorySubmit = (updatedCategory: Category) => {
    if (updatedCategory.name.trim() === '') {
      toast({ title: "Error", description: "El nombre de la categoría no puede estar vacío.", variant: "destructive" });
      return;
    }
    if (categories.some(cat => cat.id !== updatedCategory.id && cat.name.toLowerCase() === updatedCategory.name.trim().toLowerCase())) {
      toast({ title: "Error", description: "Ya existe otra categoría con este nombre.", variant: "destructive" });
      return;
    }
    persistCategories(
      categories.map((cat) => (cat.id === updatedCategory.id ? {...cat, name: updatedCategory.name.trim()} : cat))
    );
    setEditingCategory(null);
    toast({ title: "Categoría Actualizada", description: `Categoría renombrada a "${updatedCategory.name}".` });
  };

  const handleWordInputChange = (categoryId: string, value: string) => {
    setNewWordInputs(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleAddWordToCategory = (categoryId: string, word: string) => {
    const newWordClean = word.trim();
    if (!newWordClean) {
      toast({ title: "Error", description: "La palabra no puede estar vacía.", variant: "destructive" });
      return false;
    }
    let wordAdded = false;
    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        if (cat.words.some(w => w.toLowerCase() === newWordClean.toLowerCase())) {
          toast({ title: "Palabra Duplicada", description: `La palabra "${newWordClean}" ya existe en "${cat.name}".`, variant: "default" });
          return cat;
        }
        wordAdded = true;
        return { ...cat, words: [...cat.words, newWordClean] };
      }
      return cat;
    });
    
    if (wordAdded) {
        persistCategories(updatedCategories);
        toast({ title: "Palabra Añadida", description: `"${newWordClean}" añadida a la categoría.` });
    }
    return wordAdded;
  };


  const handleAddWordFormSubmit = (e: FormEvent, categoryId: string) => {
    e.preventDefault();
    const wordToAdd = newWordInputs[categoryId]?.trim();
    if (wordToAdd) {
        if(handleAddWordToCategory(categoryId, wordToAdd)) {
            setNewWordInputs(prev => ({ ...prev, [categoryId]: '' }));
        }
    } else {
        toast({ title: "Error", description: "La palabra no puede estar vacía.", variant: "destructive" });
    }
  };

  const handleDeleteWord = (categoryId: string, wordIndex: number) => {
    let deletedWordName = "";
    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        deletedWordName = cat.words[wordIndex];
        const updatedWords = cat.words.filter((_, index) => index !== wordIndex);
        return { ...cat, words: updatedWords };
      }
      return cat;
    });
    persistCategories(updatedCategories);
    toast({ title: "Palabra Eliminada", description: `"${deletedWordName}" eliminada.`, variant: "destructive" });
  };

  const handleAISuggestWordsForExistingCategory = async (category: Category) => {
    if (isBatchProcessing) {
      toast({ title: "Procesando", description: "Hay un proceso de IA en lote activo. Por favor, espera.", variant: "default"});
      return;
    }
    setCategoryForAISuggestion(category.name);
    setTargetCategoryIdForAIWords(category.id);
    setIsAISuggesting(true);
    setIsSuggestWordsDialogOpen(true);
    setAiSuggestedWords([]);
    try {
      const result: SuggestWordsOutput = await suggestWordsForCategory({ categoryName: category.name });
      const allSuggestions = result.suggestedWords || [];
      const newUniqueSuggestions = allSuggestions.filter(suggestedWord =>
        !category.words.some(existingWord => existingWord.toLowerCase() === suggestedWord.toLowerCase())
      );
      setAiSuggestedWords(newUniqueSuggestions);

      if (allSuggestions.length === 0) {
        toast({ title: "Sugerencias IA", description: "La IA no generó ninguna palabra para esta categoría."});
      } else if (newUniqueSuggestions.length === 0 && allSuggestions.length > 0) { 
        toast({ title: "Sugerencias IA", description: "Todas las palabras sugeridas por la IA ya existen en esta categoría."});
      }
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast({ title: "Error de IA", description: "No se pudieron sugerir palabras.", variant: "destructive" });
      setAiSuggestedWords([]);
    } finally {
      setIsAISuggesting(false);
    }
  };

  const handleAddAISuggestedWords = (wordsToAdd: string[]) => {
    let categoryNameForToast = categoryForAISuggestion; // This is set by the multi-AI loop or single existing category click

    if (targetCategoryIdForAIWords) { // Adding to existing category
      const category = categories.find(cat => cat.id === targetCategoryIdForAIWords);
      if (!category) return;
      categoryNameForToast = category.name; // Use existing category's name for toast

      const uniqueNewWords = wordsToAdd.filter(word => 
        !category.words.some(existingWord => existingWord.toLowerCase() === word.toLowerCase())
      );

      if (uniqueNewWords.length === 0 && wordsToAdd.length > 0) {
        toast({ title: "Sin Palabras Nuevas", description: `Todas las palabras seleccionadas ya existen en "${categoryNameForToast}".`, variant: "default" });
        // proceedToNextMultiAiCategory will be called by dialog's onProcessingComplete
        return;
      }
      
      persistCategories(categories.map(cat => 
        cat.id === targetCategoryIdForAIWords 
        ? { ...cat, words: [...cat.words, ...uniqueNewWords].sort() } 
        : cat
      ));
      toast({ title: "Palabras Añadidas", description: `${uniqueNewWords.length} palabras añadidas a "${categoryNameForToast}" desde sugerencias IA.` });

    } else { // Adding to a new category (which was just named via categoryForAISuggestion from multi-AI loop)
      const newCategory: Category = { id: crypto.randomUUID(), name: categoryNameForToast, words: [...wordsToAdd].sort() };
      // Add to current categories in state before persisting
      setCategories(prev => [...prev, newCategory]);
      persistCategories([...categories, newCategory]); // Use categories from current state which is more up-to-date for persist
      toast({ title: "Categoría y Palabras Añadidas", description: `"${newCategory.name}" creada con ${wordsToAdd.length} palabras sugeridas por IA.` });
    }
    
    // Reset these for next potential individual AI suggestion, multi-AI loop will override if active
    setCategoryForAISuggestion('');
    setTargetCategoryIdForAIWords(null);
    // setIsSuggestWordsDialogOpen(false); // Dialog closing is handled by itself and onProcessingComplete
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <CardHeader>
          <CardTitle className="title-text text-2xl flex items-center gap-2">
            <PlusCircle className="h-6 w-6" />
            Añadir Nueva Categoría
          </CardTitle>
          <CardDescription>Crea temáticas para la ruleta. Ingresa nombres separados por comas para usar IA en lote.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleAddCategory(e, false)} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre(s) de categoría, ej: Frutas, Países"
              className="flex-grow"
              aria-label="Nombre de la nueva categoría"
              disabled={isBatchProcessing}
            />
            <div className="flex gap-2">
              <Button type="submit" className="transition-transform hover:scale-105 flex-1 sm:flex-none" disabled={isBatchProcessing || newCategoryName.trim() === ''}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={(e) => handleAddCategory(e, true)} 
                className="transition-transform hover:scale-105 flex-1 sm:flex-none"
                disabled={isBatchProcessing || newCategoryName.trim() === '' || (isAISuggesting && targetCategoryIdForAIWords === null)}
              >
                {(isAISuggesting && targetCategoryIdForAIWords === null && !isBatchProcessing) || isBatchProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                Sugerir con IA
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <CardHeader>
          <CardTitle className="title-text text-2xl flex items-center gap-2">
            <ListChecks className="h-6 w-6" />
            Categorías Existentes ({categories.length})
          </CardTitle>
          <CardDescription>Gestiona las temáticas y palabras actuales de la ruleta.</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay categorías. ¡Añade alguna!</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Nombre Categoría</TableHead>
                    <TableHead className="w-[55%]">Palabras ({categories.reduce((acc, cat) => acc + cat.words.length, 0)})</TableHead>
                    <TableHead className="text-right w-[15%]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium align-top py-4">{category.name}</TableCell>
                      <TableCell className="align-top py-4">
                        <div className="flex flex-wrap gap-1 mb-2 max-h-28 overflow-y-auto pr-2">
                          {category.words.length === 0 && <span className="text-xs text-muted-foreground italic">Sin palabras.</span>}
                          {category.words.map((word, wordIndex) => (
                            <Badge key={wordIndex} variant="secondary" className="flex items-center">
                              {word}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteWord(category.id, wordIndex)}
                                className="ml-1 h-4 w-4 text-destructive hover:text-red-700 p-0"
                                aria-label={`Eliminar palabra ${word}`}
                                disabled={isBatchProcessing}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <form onSubmit={(e) => handleAddWordFormSubmit(e, category.id)} className="flex items-center gap-1 flex-grow">
                            <Input
                              type="text"
                              value={newWordInputs[category.id] || ''}
                              onChange={(e) => handleWordInputChange(category.id, e.target.value)}
                              placeholder="Añadir palabra"
                              className="h-8 text-sm"
                              aria-label={`Añadir palabra a ${category.name}`}
                              disabled={isBatchProcessing}
                            />
                            <Button type="submit" size="icon" variant="ghost" className="h-8 w-8" disabled={isBatchProcessing}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </form>
                           <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleAISuggestWordsForExistingCategory(category)}
                            disabled={isBatchProcessing || (isAISuggesting && targetCategoryIdForAIWords === category.id)}
                            className="h-8 text-xs whitespace-nowrap"
                            >
                             {(isAISuggesting && targetCategoryIdForAIWords === category.id) ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Brain className="mr-1 h-3 w-3" />}
                             Sugerir con IA
                           </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right align-top py-4 space-x-0.5 sm:space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCategory(category)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          aria-label={`Editar nombre de ${category.name}`}
                          disabled={isBatchProcessing}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-destructive hover:text-red-700 transition-colors"
                          aria-label={`Eliminar categoría ${category.name}`}
                          disabled={isBatchProcessing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter>
            <Button variant="outline" onClick={resetToDefaultCategories} className="transition-transform hover:scale-105" disabled={isBatchProcessing}>
                Restaurar Categorías y Palabras por Defecto
            </Button>
        </CardFooter>
      </Card>

      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={handleEditCategorySubmit}
        />
      )}
      
      {isSuggestWordsDialogOpen && (
        <SuggestWordsDialog
          categoryName={categoryForAISuggestion}
          suggestedWords={aiSuggestedWords}
          isOpen={isSuggestWordsDialogOpen}
          onClose={() => setIsSuggestWordsDialogOpen(false)} // Basic close, actual advance logic is in onProcessingComplete
          onAddWords={handleAddAISuggestedWords}
          isLoading={isAISuggesting}
          onProcessingComplete={proceedToNextMultiAiCategory} // Key for sequential processing
        />
      )}
    </div>
  );
};

export default CategoryManagement;
