
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

  const persistCategories = useCallback((updatedCategories: Category[]) => {
    const uniqueCategoriesMap = new Map<string, Category>();
    updatedCategories.forEach(cat => {
        if (!uniqueCategoriesMap.has(cat.id)) {
            uniqueCategoriesMap.set(cat.id, cat);
        }
    });
    const uniqueCategoriesToPersist = Array.from(uniqueCategoriesMap.values());
    setCategories(uniqueCategoriesToPersist);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueCategoriesToPersist));
  }, []);
  
  const resetToDefaultCategories = useCallback(() => {
    persistCategories([...DEFAULT_CATEGORIES]);
    toast({ title: "Categorías Restauradas", description: "Se han restaurado las categorías y palabras por defecto." });
  }, [persistCategories, toast]);

  useEffect(() => {
    const storedCategoriesRaw = localStorage.getItem(STORAGE_KEY);
    if (storedCategoriesRaw) {
      try {
        const parsedCategories = JSON.parse(storedCategoriesRaw);
        if (Array.isArray(parsedCategories)) {
          if (parsedCategories.length > 0) {
            const validatedCategoriesFromStorage = (parsedCategories as any[]).map(cat => ({
                id: String(cat.id || crypto.randomUUID()),
                name: String(cat.name || "Categoría sin nombre"),
                words: Array.isArray(cat.words) ? cat.words.map(String) : [],
            }));
            const uniqueCategoriesMap = new Map<string, Category>();
            validatedCategoriesFromStorage.forEach(cat => {
                if (!uniqueCategoriesMap.has(cat.id)) {
                    uniqueCategoriesMap.set(cat.id, cat as Category);
                }
            });
            setCategories(Array.from(uniqueCategoriesMap.values()));
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
  }, [resetToDefaultCategories]);
  

  const handleAddCategory = (e: FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (name === '') {
      toast({ title: "Error", description: "El nombre de la categoría no puede estar vacío.", variant: "destructive" });
      return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
        toast({ title: "Categoría Duplicada", description: `La categoría "${name}" ya existe.`, variant: "default" });
        return;
    }

    const newCategory: Category = { id: crypto.randomUUID(), name, words: [] };
    persistCategories([...categories, newCategory]);
    toast({ title: "Categoría Añadida", description: `La categoría vacía "${name}" ha sido añadida.` });
    setNewCategoryName('');
  };

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
    const categoryToUpdate = categories.find(cat => cat.id === categoryId);
    if (categoryToUpdate && categoryToUpdate.words.some(w => w.toLowerCase() === newWordClean.toLowerCase())) {
      toast({ title: "Palabra Duplicada", description: `La palabra "${newWordClean}" ya existe en "${categoryToUpdate.name}".`, variant: "default" });
      return false;
    }

    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        wordAdded = true;
        return { ...cat, words: [...new Set([...cat.words, newWordClean])].sort() };
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
    const category = categories.find(cat => cat.id === categoryId);
    if (category && category.words[wordIndex] !== undefined) {
        deletedWordName = category.words[wordIndex];
    }

    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        const updatedWords = cat.words.filter((_, index) => index !== wordIndex);
        return { ...cat, words: updatedWords };
      }
      return cat;
    });
    persistCategories(updatedCategories);
    if (deletedWordName) {
     toast({ title: "Palabra Eliminada", description: `"${deletedWordName}" eliminada.`, variant: "destructive" });
    }
  };
  
  const handleAddNewCategoryWithAI = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast({ title: "Error", description: "El nombre de la categoría no puede estar vacío.", variant: "destructive" });
      return;
    }
    if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
      toast({ title: "Categoría Duplicada", description: `La categoría "${name}" ya existe.`, variant: "default" });
      return;
    }
    if (isAISuggesting) return;

    // Open dialog and set loading state
    setCategoryForAISuggestion(name);
    setTargetCategoryIdForAIWords(null); // IMPORTANT: Signals a new category
    setIsSuggestWordsDialogOpen(true);
    setIsAISuggesting(true);
    setAiSuggestedWords([]);

    try {
        const result = await suggestWordsForCategory({ categoryName: name });
        const suggestions = result.suggestedWords || [];
        setAiSuggestedWords(suggestions);
        if (suggestions.length === 0) {
            toast({ title: "Sin sugerencias", description: "La IA no generó palabras. Puedes añadirlas manualmente." });
        }
    } catch (error) {
        console.error("AI suggestion error:", error);
        toast({ title: "Error de IA", description: "No se pudieron sugerir palabras.", variant: "destructive" });
        setIsSuggestWordsDialogOpen(false); // Close dialog on error
    } finally {
        setIsAISuggesting(false);
    }
  };
  
  const handleOpenAISuggestions = async (category: Category) => {
    if (isAISuggesting) {
        toast({ title: "Procesando", description: "Hay un proceso de IA activo. Por favor, espera.", variant: "default"});
        return;
    }
  
    setCategoryForAISuggestion(category.name);
    setTargetCategoryIdForAIWords(category.id);
    setIsSuggestWordsDialogOpen(true);
    setIsAISuggesting(true);
    setAiSuggestedWords([]); // Clear previous suggestions

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
        setAiSuggestedWords([]); // Ensure it's empty on error
        setIsSuggestWordsDialogOpen(false); // Close dialog on error
    } finally {
        setIsAISuggesting(false);
    }
  };
  

  const handleAddAISuggestedWords = (wordsToAdd: string[]) => {
    const cleanWordsToAdd = [...new Set(wordsToAdd.map(w => w.trim()).filter(w => w))].sort();
    
    if (cleanWordsToAdd.length === 0 && !targetCategoryIdForAIWords) {
        toast({ title: "Sin Palabras", description: "No se añadieron palabras. La categoría no fue creada.", variant: "default" });
    } else if (cleanWordsToAdd.length === 0 && targetCategoryIdForAIWords) {
        toast({ title: "Sin Palabras Nuevas", description: "No se añadieron palabras nuevas a la categoría.", variant: "default" });
    }

    if (targetCategoryIdForAIWords) { // Editing existing category
      const category = categories.find(cat => cat.id === targetCategoryIdForAIWords);
      if (!category) {
        toast({ title: "Error", description: "No se encontró la categoría de destino.", variant: "destructive"});
        return;
      }
      const uniqueNewWords = cleanWordsToAdd.filter(word =>
        !category.words.some(existingWord => existingWord.toLowerCase() === word.toLowerCase())
      );
  
      if (uniqueNewWords.length > 0) {
        persistCategories(categories.map(cat =>
          cat.id === targetCategoryIdForAIWords
          ? { ...cat, words: [...new Set([...cat.words, ...uniqueNewWords])].sort() }
          : cat
        ));
        toast({ title: "Palabras Añadidas", description: `${uniqueNewWords.length} palabras añadidas a "${category.name}".` });
      } else if (cleanWordsToAdd.length > 0){
        toast({ title: "Sin Palabras Nuevas", description: `Todas las palabras seleccionadas ya existen en "${category.name}".`, variant: "default" });
      }
    } else { // Creating new category
        const newCategory: Category = {
            id: crypto.randomUUID(),
            name: categoryForAISuggestion,
            words: cleanWordsToAdd,
        };
        persistCategories([...categories, newCategory]);
        toast({ title: "Categoría Creada", description: `Se creó "${newCategory.name}" con ${newCategory.words.length} palabra(s).` });
        setNewCategoryName('');
    }
    
    setIsSuggestWordsDialogOpen(false);
    setCategoryForAISuggestion('');
    setTargetCategoryIdForAIWords(null);
    setAiSuggestedWords([]);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <CardHeader>
          <CardTitle className="title-text text-2xl flex items-center gap-2">
            <PlusCircle className="h-6 w-6" />
            Añadir Nueva Categoría
          </CardTitle>
          <CardDescription>Crea una nueva categoría, con o sin ayuda de la IA para generar palabras.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre de la nueva categoría..."
              className="flex-grow"
              aria-label="Nombre de la nueva categoría"
              disabled={isAISuggesting}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddNewCategoryWithAI()}}
            />
            <div className="flex gap-2">
              <Button 
                type="button" 
                onClick={handleAddNewCategoryWithAI}
                className="transition-transform hover:scale-105 flex-1 sm:flex-none"
                disabled={isAISuggesting || newCategoryName.trim() === ''}
              >
                {isAISuggesting && targetCategoryIdForAIWords === null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                Añadir con IA
              </Button>
              <Button onClick={(e) => handleAddCategory(e as any)} variant="outline" className="transition-transform hover:scale-105 flex-1 sm:flex-none" disabled={isAISuggesting || newCategoryName.trim() === ''}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Vacía
              </Button>
            </div>
          </div>
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
                            <Badge key={`${category.id}-word-${wordIndex}-${word}`} variant="secondary" className="flex items-center">
                              {word}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteWord(category.id, wordIndex)}
                                className="ml-1 h-4 w-4 text-destructive hover:text-red-700 p-0"
                                aria-label={`Eliminar palabra ${word}`}
                                disabled={isAISuggesting}
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
                              disabled={isAISuggesting}
                            />
                            <Button type="submit" size="icon" variant="ghost" className="h-8 w-8" disabled={isAISuggesting}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </form>
                           <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleOpenAISuggestions(category)}
                            disabled={isAISuggesting}
                            className="h-8 text-xs whitespace-nowrap"
                            >
                             {isAISuggesting && targetCategoryIdForAIWords === category.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Brain className="mr-1 h-3 w-3" />}
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
                          disabled={isAISuggesting}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-destructive hover:text-red-700 transition-colors"
                          aria-label={`Eliminar categoría ${category.name}`}
                          disabled={isAISuggesting}
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
            <Button variant="outline" onClick={resetToDefaultCategories} className="transition-transform hover:scale-105" disabled={isAISuggesting}>
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
      
      <SuggestWordsDialog
        isOpen={isSuggestWordsDialogOpen}
        onClose={() => {
          setIsSuggestWordsDialogOpen(false);
          setTargetCategoryIdForAIWords(null);
          setCategoryForAISuggestion('');
        }}
        onAddWords={handleAddAISuggestedWords}
        isLoading={isAISuggesting}
        categoryName={categoryForAISuggestion}
        suggestedWords={aiSuggestedWords}
      />
    </div>
  );
};

export default CategoryManagement;
