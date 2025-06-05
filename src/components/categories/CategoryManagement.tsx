
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit3, PlusCircle, ListChecks, X, Plus } from 'lucide-react';
import EditCategoryDialog from './EditCategoryDialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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

  useEffect(() => {
    const storedCategoriesRaw = localStorage.getItem(STORAGE_KEY);
    if (storedCategoriesRaw) {
      try {
        const parsedCategories = JSON.parse(storedCategoriesRaw);
        if (Array.isArray(parsedCategories)) {
          if (parsedCategories.length > 0) {
            const firstItem = parsedCategories[0];
            if (typeof firstItem === 'string') {
              // Migrate from string[] to Category[] with empty words
              const migratedCategories = parsedCategories.map((name: string) => ({ id: crypto.randomUUID(), name, words: [] }));
              persistCategories(migratedCategories);
            } else if (typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem && !('words' in firstItem)) {
              // Migrate from {id, name}[] to Category[] with empty words
              const migratedCategories = parsedCategories.map((cat: { id: string; name: string }) => ({ ...cat, words: [] }));
              persistCategories(migratedCategories);
            } else if (typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem && 'words' in firstItem) {
              // Already in the correct format Category[]
              setCategories(parsedCategories);
            } else { // Potentially mixed or unknown array format
              console.warn("Unknown category format in localStorage, resetting to default.");
              resetToDefaultCategories();
            }
          } else { // Empty array stored
            resetToDefaultCategories();
          }
        } else { // Not an array
          console.warn("Malformed categories in localStorage (not an array), resetting to default.");
          resetToDefaultCategories();
        }
      } catch (error) {
        console.error("Failed to parse categories from localStorage", error);
        resetToDefaultCategories();
      }
    } else {
      // No categories stored, use defaults
      resetToDefaultCategories();
    }
  }, []);
  
  const resetToDefaultCategories = () => {
    persistCategories([...DEFAULT_CATEGORIES.map(cat => ({...cat, id: crypto.randomUUID()}))]); // Ensure new IDs for defaults
    toast({ title: "Categorías Restauradas", description: "Se han restaurado las categorías por defecto." });
  };
  
  const persistCategories = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCategories));
  };

  const handleAddCategory = (e: FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim() === '') {
      toast({ title: "Error", description: "El nombre de la categoría no puede estar vacío.", variant: "destructive" });
      return;
    }
    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast({ title: "Error", description: "Esta categoría ya existe.", variant: "destructive" });
      return;
    }
    const newCategory: Category = { id: crypto.randomUUID(), name: newCategoryName.trim(), words: [] };
    persistCategories([...categories, newCategory]);
    setNewCategoryName('');
    toast({ title: "Categoría Añadida", description: `"${newCategory.name}" ha sido añadida.` });
  };

  const handleDeleteCategory = (id: string) => {
    const categoryToDelete = categories.find(cat => cat.id === id);
    persistCategories(categories.filter((category) => category.id !== id));
    if (categoryToDelete) {
      toast({ title: "Categoría Eliminada", description: `"${categoryToDelete.name}" ha sido eliminada.`, variant: "destructive" });
    }
  };

  const handleEditCategorySubmit = (updatedCategory: Category) => { // Renamed to avoid conflict
    if (updatedCategory.name.trim() === '') {
      toast({ title: "Error", description: "El nombre de la categoría no puede estar vacío.", variant: "destructive" });
      return;
    }
    if (categories.some(cat => cat.id !== updatedCategory.id && cat.name.toLowerCase() === updatedCategory.name.trim().toLowerCase())) {
      toast({ title: "Error", description: "Ya existe otra categoría con este nombre.", variant: "destructive" });
      return;
    }
    persistCategories(
      categories.map((cat) => (cat.id === updatedCategory.id ? {...cat, name: updatedCategory.name.trim()} : cat)) // only update name here
    );
    setEditingCategory(null);
    toast({ title: "Categoría Actualizada", description: `Categoría renombrada a "${updatedCategory.name}".` });
  };

  const handleWordInputChange = (categoryId: string, value: string) => {
    setNewWordInputs(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleAddWord = (e: FormEvent, categoryId: string) => {
    e.preventDefault();
    const newWord = newWordInputs[categoryId]?.trim();
    if (!newWord) {
      toast({ title: "Error", description: "La palabra no puede estar vacía.", variant: "destructive" });
      return;
    }

    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        if (cat.words.some(w => w.toLowerCase() === newWord.toLowerCase())) {
          toast({ title: "Error", description: `La palabra "${newWord}" ya existe en esta categoría.`, variant: "destructive" });
          return cat; // Return original category if word exists
        }
        return { ...cat, words: [...cat.words, newWord] };
      }
      return cat;
    });
    
    // Only persist if a word was actually added (i.e., no duplicate warning)
    if (!categories.find(cat => cat.id === categoryId)?.words.some(w => w.toLowerCase() === newWord.toLowerCase())) {
        persistCategories(updatedCategories);
        toast({ title: "Palabra Añadida", description: `"${newWord}" añadida a la categoría.` });
    }
    setNewWordInputs(prev => ({ ...prev, [categoryId]: '' }));
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


  return (
    <div className="space-y-8">
      <Card className="shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <CardHeader>
          <CardTitle className="title-text text-2xl flex items-center gap-2">
            <PlusCircle className="h-6 w-6" />
            Añadir Nueva Categoría
          </CardTitle>
          <CardDescription>Crea una nueva temática para la ruleta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre de la categoría"
              className="flex-grow"
              aria-label="Nombre de la nueva categoría"
            />
            <Button type="submit" className="transition-transform hover:scale-105">
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Categoría
            </Button>
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
                    <TableHead className="w-[40%]">Nombre Categoría</TableHead>
                    <TableHead className="w-[50%]">Palabras</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium align-top py-4">{category.name}</TableCell>
                      <TableCell className="align-top py-4">
                        <div className="flex flex-wrap gap-1 mb-2 max-h-28 overflow-y-auto">
                          {category.words.length === 0 && <span className="text-xs text-muted-foreground">Sin palabras</span>}
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
                        <form onSubmit={(e) => handleAddWord(e, category.id)} className="flex items-center gap-1">
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
                      </TableCell>
                      <TableCell className="text-right align-top py-4 space-x-1">
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
          onSave={handleEditCategorySubmit} // Use renamed handler
        />
      )}
    </div>
  );
};

export default CategoryManagement;

    