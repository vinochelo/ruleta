"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit3, PlusCircle, ListChecks } from 'lucide-react';
import EditCategoryDialog from './EditCategoryDialog';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'ruletaRupestreCategories';
const DEFAULT_CATEGORIES = ["Objetos", "Animales", "Comida", "Acciones", "Lugares", "Personajes Famosos", "Películas y Series"];


interface Category {
  id: string;
  name: string;
}

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedCategories = localStorage.getItem(STORAGE_KEY);
    if (storedCategories) {
      try {
        const parsedCategories = JSON.parse(storedCategories);
        // Ensure parsed data is an array of objects with id and name
        if (Array.isArray(parsedCategories) && parsedCategories.every(cat => typeof cat === 'string')) {
           // Migrate old string array format
           const newFormatCategories = parsedCategories.map((name: string) => ({ id: crypto.randomUUID(), name }));
           setCategories(newFormatCategories);
           localStorage.setItem(STORAGE_KEY, JSON.stringify(newFormatCategories));
        } else if (Array.isArray(parsedCategories) && parsedCategories.every(cat => cat && typeof cat.id === 'string' && typeof cat.name === 'string')) {
          setCategories(parsedCategories);
        } else if (parsedCategories.length === 0) { // If empty array, use defaults
            const defaultFormattedCategories = DEFAULT_CATEGORIES.map(name => ({ id: crypto.randomUUID(), name }));
            setCategories(defaultFormattedCategories);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFormattedCategories));
        } else {
          // Data is malformed, reset to default
          console.warn("Malformed categories in localStorage, resetting to default.");
          resetToDefaultCategories();
        }
      } catch (error) {
        console.error("Failed to parse categories from localStorage", error);
        resetToDefaultCategories(); // Reset on error
      }
    } else {
      // No categories stored, use defaults
      const defaultFormattedCategories = DEFAULT_CATEGORIES.map(name => ({ id: crypto.randomUUID(), name }));
      setCategories(defaultFormattedCategories);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFormattedCategories));
    }
  }, []);

  const resetToDefaultCategories = () => {
    const defaultFormattedCategories = DEFAULT_CATEGORIES.map(name => ({ id: crypto.randomUUID(), name }));
    setCategories(defaultFormattedCategories);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFormattedCategories));
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
    const newCategory: Category = { id: crypto.randomUUID(), name: newCategoryName.trim() };
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

  const handleEditCategory = (updatedCategory: Category) => {
    if (updatedCategory.name.trim() === '') {
      toast({ title: "Error", description: "El nombre de la categoría no puede estar vacío.", variant: "destructive" });
      return;
    }
    // Check if another category (not the one being edited) already has the new name
    if (categories.some(cat => cat.id !== updatedCategory.id && cat.name.toLowerCase() === updatedCategory.name.trim().toLowerCase())) {
      toast({ title: "Error", description: "Ya existe otra categoría con este nombre.", variant: "destructive" });
      return;
    }
    persistCategories(
      categories.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat))
    );
    setEditingCategory(null);
    toast({ title: "Categoría Actualizada", description: `Categoría renombrada a "${updatedCategory.name}".` });
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
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir
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
          <CardDescription>Gestiona las temáticas actuales de la ruleta.</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay categorías. ¡Añade alguna!</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70%]">Nombre</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCategory(category)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          aria-label={`Editar ${category.name}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-destructive hover:text-red-700 transition-colors"
                          aria-label={`Eliminar ${category.name}`}
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
                Restaurar Categorías por Defecto
            </Button>
        </CardFooter>
      </Card>

      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={handleEditCategory}
        />
      )}
    </div>
  );
};

export default CategoryManagement;
