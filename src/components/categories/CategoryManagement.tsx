
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit3, PlusCircle, ListChecks, X, Plus, Brain, Loader2 } from 'lucide-react';
import EditCategoryDialog from './EditCategoryDialog';
import SuggestWordsDialog from './SuggestWordsDialog'; // Import new dialog
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { suggestWordsForCategory, type SuggestWordsInput, type SuggestWordsOutput } from '@/ai/flows/suggest-words-flow'; // Import Genkit flow

const STORAGE_KEY = 'ruletaRupestreCategories';

interface Category {
  id: string;
  name: string;
  words: string[];
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: crypto.randomUUID(), name: "Objetos", words: ["Silla", "Mesa", "Lámpara", "Libro", "Teléfono", "Taza", "Reloj", "Gafas"] },
  { id: crypto.randomUUID(), name: "Animales", words: ["Perro", "Gato", "Elefante", "León", "Jirafa", "Tigre", "Oso", "Pájaro"] },
  { id: crypto.randomUUID(), name: "Comida", words: ["Manzana", "Pizza", "Hamburguesa", "Pasta", "Helado", "Sushi", "Ensalada", "Pan"] },
  { id: crypto.randomUUID(), name: "Acciones", words: ["Correr", "Saltar", "Nadar", "Escribir", "Leer", "Cantar", "Bailar", "Cocinar"] },
  { id: crypto.randomUUID(), name: "Lugares", words: ["Playa", "Montaña", "Ciudad", "Bosque", "Desierto", "Parque", "Escuela", "Museo"] },
  { id: crypto.randomUUID(), name: "Personajes Famosos", words: ["Einstein", "Chaplin", "Picasso", "Mozart", "Cleopatra", "Da Vinci", "Marie Curie", "Shakespeare"] },
  { id: crypto.randomUUID(), name: "Películas y Series", words: ["Titanic", "Star Wars", "Friends", "Stranger Things", "Harry Potter", "El Padrino", "Juego de Tronos", "Breaking Bad"] }
];


const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newWordInputs, setNewWordInputs] = useState<{ [categoryId: string]: string }>({});
  const { toast } = useToast();

  // AI Suggestion State
  const [isSuggestWordsDialogOpen, setIsSuggestWordsDialogOpen] = useState(false);
  const [aiSuggestedWords, setAiSuggestedWords] = useState<string[]>([]);
  const [categoryForAISuggestion, setCategoryForAISuggestion] = useState<string>('');
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [targetCategoryIdForAIWords, setTargetCategoryIdForAIWords] = useState<string | null>(null);


  useEffect(() => {
    const storedCategoriesRaw = localStorage.getItem(STORAGE_KEY);
    if (storedCategoriesRaw) {
      try {
        const parsedCategories = JSON.parse(storedCategoriesRaw);
        if (Array.isArray(parsedCategories)) {
          if (parsedCategories.length > 0) {
            const firstItem = parsedCategories[0];
            if (typeof firstItem === 'string') {
              const migratedCategories = parsedCategories.map((name: string) => ({ id: crypto.randomUUID(), name, words: [] }));
              persistCategories(migratedCategories);
            } else if (typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem && !('words' in firstItem)) {
              const migratedCategories = parsedCategories.map((cat: { id: string; name: string }) => ({ ...cat, words: [] }));
              persistCategories(migratedCategories);
            } else if (typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem && 'words' in firstItem) {
              setCategories(parsedCategories);
            } else { 
              console.warn("Unknown category format in localStorage, resetting to default.");
              resetToDefaultCategories();
            }
          } else { 
            resetToDefaultCategories();
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
  
  const resetToDefaultCategories = () => {
    persistCategories([...DEFAULT_CATEGORIES.map(cat => ({...cat, id: crypto.randomUUID()}))]);
    toast({ title: "Categorías Restauradas", description: "Se han restaurado las categorías y palabras por defecto." });
  };
  
  const persistCategories = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCategories));
  };

  const handleAddCategory = async (e: FormEvent, suggestWithAI: boolean = false) => {
    e.preventDefault();
    if (newCategoryName.trim() === '') {
      toast({ title: "Error", description: "El nombre de la categoría no puede estar vacío.", variant: "destructive" });
      return;
    }
    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast({ title: "Error", description: "Esta categoría ya existe.", variant: "destructive" });
      return;
    }

    if (suggestWithAI) {
      setCategoryForAISuggestion(newCategoryName.trim());
      setTargetCategoryIdForAIWords(null); // For a new category
      setIsAISuggesting(true);
      setIsSuggestWordsDialogOpen(true);
      setAiSuggestedWords([]); // Clear previous suggestions
      try {
        const result: SuggestWordsOutput = await suggestWordsForCategory({ categoryName: newCategoryName.trim() });
        setAiSuggestedWords(result.suggestedWords || []);
      } catch (error) {
        console.error("AI suggestion error:", error);
        toast({ title: "Error de IA", description: "No se pudieron sugerir palabras.", variant: "destructive" });
        setAiSuggestedWords([]);
      } finally {
        setIsAISuggesting(false);
      }
    } else {
      const newCategory: Category = { id: crypto.randomUUID(), name: newCategoryName.trim(), words: [] };
      persistCategories([...categories, newCategory]);
      setNewCategoryName('');
      toast({ title: "Categoría Añadida", description: `"${newCategory.name}" ha sido añadida.` });
    }
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
    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        if (cat.words.some(w => w.toLowerCase() === newWordClean.toLowerCase())) {
          toast({ title: "Palabra Duplicada", description: `La palabra "${newWordClean}" ya existe en "${cat.name}".`, variant: "destructive" });
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
    setCategoryForAISuggestion(category.name);
    setTargetCategoryIdForAIWords(category.id);
    setIsAISuggesting(true);
    setIsSuggestWordsDialogOpen(true);
    setAiSuggestedWords([]);
    try {
      const result: SuggestWordsOutput = await suggestWordsForCategory({ categoryName: category.name });
      setAiSuggestedWords(result.suggestedWords.filter(word => 
        !category.words.some(existingWord => existingWord.toLowerCase() === word.toLowerCase())
      ) || []);
      if (result.suggestedWords.length > 0 && aiSuggestedWords.length === 0) {
        toast({ title: "Sugerencias IA", description: "Todas las palabras sugeridas por IA ya existen en la categoría."});
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
    if (targetCategoryIdForAIWords) { // Adding to existing category
      const category = categories.find(cat => cat.id === targetCategoryIdForAIWords);
      if (!category) return;

      const uniqueNewWords = wordsToAdd.filter(word => 
        !category.words.some(existingWord => existingWord.toLowerCase() === word.toLowerCase())
      );

      if (uniqueNewWords.length === 0 && wordsToAdd.length > 0) {
        toast({ title: "Sin Palabras Nuevas", description: "Todas las palabras seleccionadas ya existen en la categoría.", variant: "default" });
        return;
      }
      
      persistCategories(categories.map(cat => 
        cat.id === targetCategoryIdForAIWords 
        ? { ...cat, words: [...cat.words, ...uniqueNewWords] } 
        : cat
      ));
      toast({ title: "Palabras Añadidas", description: `${uniqueNewWords.length} palabras añadidas a "${category.name}" desde sugerencias IA.` });

    } else { // Adding to a new category (which was just named)
      const newCategory: Category = { id: crypto.randomUUID(), name: categoryForAISuggestion, words: wordsToAdd };
      persistCategories([...categories, newCategory]);
      toast({ title: "Categoría y Palabras Añadidas", description: `"${newCategory.name}" creada con ${wordsToAdd.length} palabras sugeridas por IA.` });
      setNewCategoryName(''); // Clear input after successful AI-assisted creation
    }
    setCategoryForAISuggestion('');
    setTargetCategoryIdForAIWords(null);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <CardHeader>
          <CardTitle className="title-text text-2xl flex items-center gap-2">
            <PlusCircle className="h-6 w-6" />
            Añadir Nueva Categoría
          </CardTitle>
          <CardDescription>Crea una nueva temática para la ruleta. Puedes añadir palabras manualmente o usar IA.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleAddCategory(e, false)} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre de la categoría"
              className="flex-grow"
              aria-label="Nombre de la nueva categoría"
            />
            <div className="flex gap-2">
              <Button type="submit" className="transition-transform hover:scale-105 flex-1 sm:flex-none" disabled={isAISuggesting}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={(e) => handleAddCategory(e, true)} 
                className="transition-transform hover:scale-105 flex-1 sm:flex-none"
                disabled={newCategoryName.trim() === '' || isAISuggesting}
              >
                {isAISuggesting && targetCategoryIdForAIWords === null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                Sugerir Palabras con IA
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
                          {category.words.length === 0 && <span className="text-xs text-muted-foreground italic">Sin palabras. Añade algunas o usa IA.</span>}
                          {category.words.map((word, wordIndex) => (
                            <Badge key={wordIndex} variant="secondary" className="flex items-center">
                              {word}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteWord(category.id, wordIndex)}
                                className="ml-1 h-4 w-4 text-destructive hover:text-red-700 p-0"
                                aria-label={`Eliminar palabra ${word}`}
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
                            />
                            <Button type="submit" size="icon" variant="ghost" className="h-8 w-8">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </form>
                           <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleAISuggestWordsForExistingCategory(category)}
                            disabled={isAISuggesting && targetCategoryIdForAIWords === category.id}
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
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-destructive hover:text-red-700 transition-colors"
                          aria-label={`Eliminar categoría ${category.name}`}
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
            <Button variant="outline" onClick={resetToDefaultCategories} className="transition-transform hover:scale-105">
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
          onClose={() => {
            setIsSuggestWordsDialogOpen(false);
            setCategoryForAISuggestion(''); // Reset after closing
            setTargetCategoryIdForAIWords(null);
            setAiSuggestedWords([]);
            if (targetCategoryIdForAIWords === null && newCategoryName === categoryForAISuggestion) {
              // If it was for a new category and dialog closed without adding, don't clear newCategoryName
              // This allows user to still click "Add" manually if they cancel AI
            } else {
              setNewCategoryName(''); // Clear if it was for existing or successfully added
            }
          }}
          onAddWords={handleAddAISuggestedWords}
          isLoading={isAISuggesting}
        />
      )}
    </div>
  );
};

export default CategoryManagement;
