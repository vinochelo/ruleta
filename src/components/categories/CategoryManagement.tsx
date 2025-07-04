
"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit3, PlusCircle, ListChecks, X, Plus, Brain, Loader2, AlertTriangle } from 'lucide-react';
import EditCategoryDialog from './EditCategoryDialog';
import SuggestWordsDialog from './SuggestWordsDialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { suggestWordsForCategory, type SuggestWordsInput, type SuggestWordsOutput } from '@/ai/flows/suggest-words-flow';
import { Switch } from '../ui/switch';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STORAGE_KEY = 'ruletaPictionaryCategories';

interface Category {
  id: string;
  name: string;
  words: string[];
  isActive?: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: "default-objetos-uuid", name: "Objetos", words: ["Silla", "Mesa", "Lámpara", "Libro", "Teléfono", "Taza", "Reloj", "Gafas", "Llave", "Peine", "Tijeras", "Cuchara", "Botella", "Ventana", "Puerta", "Cuchillo", "Paraguas", "Martillo", "Escalera", "Micrófono", "Mochila", "Anillo", "Vaso", "Plato", "Cartera"], isActive: true },
    { id: "default-animales-uuid", name: "Animales", words: ["Perro", "Gato", "Elefante", "León", "Jirafa", "Tigre", "Oso", "Pájaro", "Serpiente", "Mariposa", "Pez", "Caballo", "Vaca", "Mono", "Cebra", "Pingüino", "Delfín", "Tiburón", "Canguro", "Koala", "Camello", "Zorro", "Lobo", "Águila", "Cocodrilo"], isActive: true },
    { id: "default-comida-uuid", name: "Comida", words: ["Manzana", "Pizza", "Hamburguesa", "Pasta", "Helado", "Sushi", "Ensalada", "Pan", "Chocolate", "Queso", "Huevo", "Sopa", "Galleta", "Naranja", "Uvas", "Plátano", "Patatas fritas", "Tarta", "Yogur", "Café", "Arroz", "Pollo", "Pescado", "Maíz", "Tomate"], isActive: true },
    { id: "default-acciones-uuid", name: "Acciones", words: ["Correr", "Saltar", "Nadar", "Escribir", "Leer", "Cantar", "Bailar", "Cocinar", "Volar", "Pintar", "Dormir", "Comer", "Beber", "Conducir", "Llorar", "Reír", "Escalar", "Escuchar", "Pensar", "Aplaudir", "Abrazar", "Empujar", "Gritar", "Susurrar", "Construir"], isActive: true },
    { id: "default-lugares-uuid", name: "Lugares", words: ["Playa", "Montaña", "Ciudad", "Bosque", "Desierto", "Parque", "Escuela", "Museo", "Hospital", "Restaurante", "Cine", "Supermercado", "Gimnasio", "Aeropuerto", "Estación de tren", "Biblioteca", "Banco", "Iglesia", "Castillo", "Isla", "Cueva", "Oficina", "Granja", "Teatro", "Puente"], isActive: true },
    { id: "default-personajes-uuid", name: "Personajes Famosos", words: ["Einstein", "Chaplin", "Picasso", "Mozart", "Cleopatra", "Da Vinci", "Marie Curie", "Shakespeare", "Gandhi", "Frida Kahlo", "Napoleón", "Beethoven", "Newton", "Michael Jackson", "Marilyn Monroe", "Elvis Presley", "Pelé", "Muhammad Ali", "Stephen Hawking", "Nelson Mandela", "Walt Disney", "Steve Jobs", "Bill Gates"], isActive: true },
    { id: "default-peliculas-uuid", name: "Películas y Series", words: ["Titanic", "Star Wars", "Friends", "Stranger Things", "Harry Potter", "El Padrino", "Juego de Tronos", "Breaking Bad", "Matrix", "Casablanca", "Forrest Gump", "Pulp Fiction", "Los Simpson", "El Rey León", "La Casa de Papel", "Jurassic Park", "E.T.", "The Office", "Volver al Futuro", "El Señor de los Anillos", "Vengadores", "Frozen", "Shrek", "Toy Story"], isActive: true },
    { id: "default-profesiones-uuid", name: "Profesiones", words: ["Médico", "Profesor", "Bombero", "Policía", "Cocinero", "Astronauta", "Pintor", "Músico", "Actor", "Científico", "Ingeniero", "Abogado", "Periodista", "Carpintero", "Piloto", "Dentista", "Veterinario", "Juez", "Fotógrafo", "Electricista", "Jardinero", "Mecánico", "Peluquero", "Arquitecto", "Traductor"], isActive: true },
    { id: "default-deportes-uuid", name: "Deportes", words: ["Fútbol", "Baloncesto", "Tenis", "Natación", "Béisbol", "Golf", "Boxeo", "Ciclismo", "Atletismo", "Esquí", "Voleibol", "Rugby", "Fórmula 1", "Surf", "Ajedrez", "Hockey", "Críquet", "Judo", "Kárate", "Gimnasia", "Bádminton", "Ping-pong", "Balonmano", "Remo", "Escalada"], isActive: true },
    { id: "default-transporte-uuid", name: "Transporte", words: ["Coche", "Avión", "Barco", "Bicicleta", "Tren", "Autobús", "Motocicleta", "Helicóptero", "Submarino", "Cohete", "Globo aerostático", "Patinete", "Camión", "Tranvía", "Canoa", "Monopatín", "Yate", "Furgoneta", "Taxi", "Metro", "Velero", "Jet ski", "Caravana", "Triciclo", "Ambulancia"], isActive: true },
    { id: "default-naturaleza-uuid", name: "Naturaleza", words: ["Árbol", "Flor", "Río", "Sol", "Luna", "Estrella", "Nube", "Volcán", "Arcoíris", "Catarata", "Planta", "Roca", "Mar", "Relámpago", "Hoja", "Ola", "Arena", "Hielo", "Fuego", "Viento", "Montaña", "Isla", "Selva", "Glaciar", "Aurora boreal"], isActive: true },
    { id: "default-hogar-uuid", name: "Cosas de Casa", words: ["Sofá", "Cama", "Ducha", "Nevera", "Horno", "Ventana", "Puerta", "Espejo", "Alfombra", "Televisión", "Microondas", "Aspiradora", "Plancha", "Tostadora", "Lavadora", "Armario", "Escritorio", "Bañera", "Inodoro", "Fregadero", "Estantería", "Cojín", "Cortina", "Escoba", "Olla"], isActive: true },
    { id: "default-ropa-uuid", name: "Ropa", words: ["Camisa", "Pantalón", "Zapato", "Sombrero", "Vestido", "Falda", "Chaqueta", "Calcetines", "Bufanda", "Guantes", "Bikini", "Gorra", "Botas", "Pijama", "Corbata", "Sudadera", "Vaqueros", "Zapatillas", "Sandalias", "Abrigo", "Traje", "Camiseta", "Jersey", "Cinturón", "Gafas de sol"], isActive: true },
    { id: "default-cuerpo-uuid", name: "Partes del Cuerpo", words: ["Ojo", "Nariz", "Boca", "Mano", "Pie", "Cabeza", "Brazo", "Pierna", "Oreja", "Pelo", "Dedo", "Rodilla", "Codo", "Hombro", "Espalda", "Ceja", "Pestaña", "Uña", "Diente", "Lengua", "Cuello", "Pecho", "Estómago", "Tobillo", "Muñeca"], isActive: true },
    { id: "default-instrumentos-uuid", name: "Instrumentos Musicales", words: ["Guitarra", "Piano", "Violín", "Batería", "Flauta", "Trompeta", "Saxofón", "Arpa", "Tambor", "Bajo", "Ukelele", "Acordeón", "Clarinete", "Trombón", "Xilófono", "Violonchelo", "Gaita", "Pandereta", "Triángulo", "Maracas", "Armónica", "Banjo", "Platillos", "Teclado", "Contrabajo"], isActive: true },
    { id: "default-marcas-uuid", name: "Marcas Famosas", words: ["Coca-Cola", "Nike", "Apple", "Google", "Amazon", "McDonald's", "Disney", "Toyota", "Samsung", "Adidas", "Pepsi", "IKEA", "Microsoft", "Ferrari", "Lego", "Starbucks", "Facebook", "Netflix", "Sony", "Ford"], isActive: true },
    { id: "default-paises-uuid", name: "Países y Ciudades", words: ["España", "Francia", "Italia", "Japón", "China", "Estados Unidos", "Brasil", "Egipto", "Australia", "Rusia", "París", "Roma", "Londres", "Nueva York", "Tokio", "Sídney", "Pekín", "Moscú", "El Cairo", "Río de Janeiro"], isActive: true },
    { id: "default-cartoons-uuid", name: "Dibujos Animados", words: ["Mickey Mouse", "Bugs Bunny", "Homer Simpson", "Bob Esponja", "Pikachu", "Doraemon", "Goku", "Tom y Jerry", "Scooby-Doo", "Peppa Pig", "Pato Donald", "Snoopy", "Garfield", "Hello Kitty", "Popeye", "He-Man", "Superman", "Batman", "Spider-Man", "Winnie the Pooh"], isActive: true },
    { id: "default-emociones-uuid", name: "Emociones", words: ["Alegría", "Tristeza", "Miedo", "Sorpresa", "Amor", "Ira", "Asco", "Vergüenza", "Confianza", "Interés", "Calma", "Ansiedad", "Culpa", "Orgullo", "Celos", "Esperanza", "Nostalgia", "Euforia", "Aburrimiento", "Soledad"], isActive: true },
    { id: "default-meteorologia-uuid", name: "Fenómenos Meteorológicos", words: ["Lluvia", "Nieve", "Sol", "Tornado", "Relámpago", "Trueno", "Viento", "Niebla", "Granizo", "Arcoíris", "Huracán", "Sequía", "Inundación", "Ola de calor", "Aurora boreal", "Eclipse", "Monzón", "Ventisca", "Rocío", "Nube"], isActive: true }
];


const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newWordInputs, setNewWordInputs] = useState<{ [categoryId: string]: string }>({});
  const { toast } = useToast();

  const [isSuggestWordsDialogOpen, setIsSuggestWordsDialogOpen] = useState(false);
  const [aiSuggestedWords, setAiSuggestedWords] = useState<string[]>([]);
  const [aiDuplicateWords, setAiDuplicateWords] = useState<string[]>([]);
  const [categoryForAISuggestion, setCategoryForAISuggestion] = useState<string>('');
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [targetCategoryIdForAIWords, setTargetCategoryIdForAIWords] = useState<string | null>(null);
  const [categoryQueue, setCategoryQueue] = useState<string[]>([]);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);


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

  const handleResetClick = () => {
      resetToDefaultCategories();
      setIsResetConfirmOpen(false);
  }

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
                isActive: typeof cat.isActive === 'boolean' ? cat.isActive : true,
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
          resetToDefaultCategories();
        }
      } catch (error) {
        resetToDefaultCategories();
      }
    } else {
      resetToDefaultCategories();
    }
  }, [resetToDefaultCategories]);
  
  const advanceQueue = useCallback(() => {
    setIsSuggestWordsDialogOpen(false);
    setCategoryQueue(q => q.slice(1));
  }, []);

  useEffect(() => {
      if (categoryQueue.length > 0 && !isSuggestWordsDialogOpen && !isAISuggesting) {
          const nextCategoryName = categoryQueue[0];
          
          const openSuggestionDialogFor = async (categoryName: string) => {
              setCategoryForAISuggestion(categoryName);
              setTargetCategoryIdForAIWords(null); // Always for a new category
              setIsSuggestWordsDialogOpen(true);
              setIsAISuggesting(true);
              setAiSuggestedWords([]);
              setAiDuplicateWords([]);

              try {
                  const result = await suggestWordsForCategory({ categoryName });
                  const suggestions = result.suggestedWords || [];
                  setAiSuggestedWords(suggestions);
                  if (suggestions.length === 0) {
                      toast({ title: "Sin sugerencias", description: "La IA no generó palabras. Puedes añadirlas manually." });
                  }
              } catch (error) {
                  toast({ title: "Error de IA", description: "No se pudieron sugerir palabras.", variant: "destructive" });
                  advanceQueue(); // Skip to next on error
              } finally {
                  setIsAISuggesting(false);
              }
          };

          openSuggestionDialogFor(nextCategoryName);
      }
  }, [categoryQueue, isSuggestWordsDialogOpen, isAISuggesting, advanceQueue, toast]);


  const handleAddCategory = (e: FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (name === '' || name.includes(',')) {
      toast({ title: "Error", description: "Para añadir una categoría vacía, introduce un solo nombre sin comas.", variant: "destructive" });
      return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
        toast({ title: "Categoría Duplicada", description: `La categoría "${name}" ya existe.`, variant: "default" });
        return;
    }

    const newCategory: Category = { id: crypto.randomUUID(), name, words: [], isActive: true };
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

  const handleToggleCategoryActive = (id: string) => {
    persistCategories(
      categories.map((cat) =>
        cat.id === id ? { ...cat, isActive: !(cat.isActive ?? true) } : cat
      )
    );
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
  
  const handleAddNewCategoryWithAI = () => {
    const names = newCategoryName.trim().split(',').map(name => name.trim()).filter(Boolean);

    if (names.length === 0) {
      toast({ title: "Error", description: "Introduce al menos un nombre de categoría.", variant: "destructive" });
      return;
    }

    const uniqueNames = [...new Set(names)];

    const newCategoryNames = uniqueNames.filter(name => 
      !categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())
    );

    const existingCategoryNames = uniqueNames.filter(name => 
      categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())
    );

    if (existingCategoryNames.length > 0) {
      toast({
        title: "Categorías Omitidas",
        description: `Ya existen las siguientes categorías: ${existingCategoryNames.join(', ')}.`,
        variant: "default",
      });
    }

    if (newCategoryNames.length > 0) {
      toast({
        title: "Procesando Categorías...",
        description: `Se abrirá un diálogo de sugerencias para cada una de las ${newCategoryNames.length} nuevas categorías.`,
      });
      setCategoryQueue(current => [...current, ...newCategoryNames]);
      setNewCategoryName('');
    }
  };
  
  const handleOpenAISuggestionsForExisting = async (category: Category) => {
    if (isAISuggesting || categoryQueue.length > 0) {
        toast({ title: "Procesando", description: "Hay un proceso de IA activo. Por favor, espera.", variant: "default"});
        return;
    }
  
    setCategoryForAISuggestion(category.name);
    setTargetCategoryIdForAIWords(category.id);
    setIsSuggestWordsDialogOpen(true);
    setIsAISuggesting(true);
    setAiSuggestedWords([]);
    setAiDuplicateWords([]);

    try {
        const result: SuggestWordsOutput = await suggestWordsForCategory({ categoryName: category.name });
        const allSuggestions = result.suggestedWords || [];
        
        if (allSuggestions.length === 0) {
          toast({ title: "Sugerencias IA", description: "La IA no generó ninguna palabra para esta categoría."});
          setAiSuggestedWords([]);
          setAiDuplicateWords([]);
        } else {
          const existingWordsSet = new Set(category.words.map(w => w.toLowerCase()));
          const duplicateSuggestions: string[] = [];
          
          const uniqueAISuggestionsList: string[] = [];
          const seenAISuggestions = new Set<string>();

          allSuggestions.forEach(suggestedWord => {
            const lowerCaseWord = suggestedWord.toLowerCase().trim();
            if (!lowerCaseWord || seenAISuggestions.has(lowerCaseWord)) {
                return;
            }
            seenAISuggestions.add(lowerCaseWord);
            uniqueAISuggestionsList.push(suggestedWord);

            if (existingWordsSet.has(lowerCaseWord)) {
              duplicateSuggestions.push(suggestedWord);
            }
          });

          if (duplicateSuggestions.length > 0) {
            toast({
              title: "Palabras Duplicadas Encontradas",
              description: `Algunas sugerencias ya existen en la categoría y han sido marcadas.`,
              variant: 'default',
            });
          }

          setAiSuggestedWords(uniqueAISuggestionsList);
          setAiDuplicateWords(duplicateSuggestions);
        }
    } catch (error) {
        toast({ title: "Error de IA", description: "No se pudieron sugerir palabras.", variant: "destructive" });
        setAiSuggestedWords([]);
        setAiDuplicateWords([]);
        setIsSuggestWordsDialogOpen(false);
    } finally {
        setIsAISuggesting(false);
    }
  };
  
  const handleAddAISuggestedWords = (wordsToAdd: string[]) => {
    const cleanWordsToAdd = [...new Set(wordsToAdd.map(w => w.trim()).filter(w => w))].sort();

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
      setIsSuggestWordsDialogOpen(false);
    } else { // Creating new category from the queue
        if (cleanWordsToAdd.length === 0) {
            toast({ title: "Sin Palabras", description: `La categoría "${categoryForAISuggestion}" no fue creada porque no se añadieron palabras.`, variant: "default" });
        } else {
            const newCategory: Category = {
                id: crypto.randomUUID(),
                name: categoryForAISuggestion,
                words: cleanWordsToAdd,
                isActive: true,
            };
            persistCategories([...categories, newCategory]);
            toast({ title: "Categoría Creada", description: `Se creó "${newCategory.name}" con ${newCategory.words.length} palabra(s).` });
        }
        advanceQueue();
    }
  };

  const handleSuggestDialogClose = () => {
    if (targetCategoryIdForAIWords) { // Just closes dialog for existing categories
      setIsSuggestWordsDialogOpen(false);
      setTargetCategoryIdForAIWords(null);
    } else { // It's a new category from the queue, so we advance
      toast({
        title: "Creación Cancelada",
        description: `No se creó la categoría "${categoryQueue[0]}".`,
        variant: "default",
      })
      advanceQueue();
    }
  };

  const sortedCategories = [...categories].sort((a, b) => 
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  );

  return (
    <div className="space-y-8">
      <Card className="shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <CardHeader>
          <CardTitle className="title-text text-2xl flex items-center gap-2">
            <PlusCircle className="h-6 w-6" />
            Añadir Nueva Categoría
          </CardTitle>
          <CardDescription>Añade categorías fácilmente. Escribe un nombre (o varios, separados por comas) y pulsa **"Añadir con IA"**. La IA creará una lista de palabras por ti.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ej: Películas de los 90, Animales de la granja..."
              className="flex-grow"
              aria-label="Nombre de la nueva categoría"
              disabled={isAISuggesting || categoryQueue.length > 0}
            />
            <div className="flex gap-2">
              <Button 
                type="button" 
                onClick={handleAddNewCategoryWithAI}
                className="transition-transform hover:scale-105 flex-1 sm:flex-none"
                disabled={isAISuggesting || newCategoryName.trim() === '' || categoryQueue.length > 0}
              >
                {isAISuggesting || categoryQueue.length > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                Añadir con IA
              </Button>
              <Button onClick={(e) => handleAddCategory(e as any)} variant="outline" className="transition-transform hover:scale-105 flex-1 sm:flex-none" disabled={isAISuggesting || newCategoryName.trim() === '' || categoryQueue.length > 0 || newCategoryName.includes(',')}>
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
          <CardDescription>Gestiona las temáticas y palabras actuales de la ruleta. Puedes activar o desactivar categorías para incluirlas o no en el juego.</CardDescription>
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
                    <TableHead className="w-[45%]">Palabras ({categories.reduce((acc, cat) => acc + cat.words.length, 0)})</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right w-[15%]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCategories.map((category) => (
                    <TableRow key={category.id} className={cn(!(category.isActive ?? true) && "bg-muted/50 text-muted-foreground")}>
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
                                disabled={isAISuggesting || categoryQueue.length > 0}
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
                              disabled={isAISuggesting || categoryQueue.length > 0}
                            />
                            <Button type="submit" size="icon" variant="ghost" className="h-8 w-8" disabled={isAISuggesting || categoryQueue.length > 0}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </form>
                           <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleOpenAISuggestionsForExisting(category)}
                            disabled={isAISuggesting || categoryQueue.length > 0}
                            className="h-8 text-xs whitespace-nowrap"
                            >
                             {isAISuggesting && targetCategoryIdForAIWords === category.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Brain className="mr-1 h-3 w-3" />}
                             Sugerir con IA
                           </Button>
                        </div>
                      </TableCell>
                       <TableCell className="text-center align-top py-4">
                        <Switch
                            checked={category.isActive ?? true}
                            onCheckedChange={() => handleToggleCategoryActive(category.id)}
                            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-destructive"
                            aria-label={category.isActive ?? true ? 'Desactivar categoría' : 'Activar categoría'}
                            disabled={isAISuggesting || categoryQueue.length > 0}
                        />
                      </TableCell>
                      <TableCell className="text-right align-top py-4 space-x-0.5 sm:space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCategory(category)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          aria-label={`Editar nombre de ${category.name}`}
                          disabled={isAISuggesting || categoryQueue.length > 0}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-destructive hover:text-red-700 transition-colors"
                          aria-label={`Eliminar categoría ${category.name}`}
                          disabled={isAISuggesting || categoryQueue.length > 0}
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
          <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="transition-transform hover:scale-105" disabled={isAISuggesting || categoryQueue.length > 0}>
                    Restaurar Categorías y Palabras por Defecto
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                      ¿Estás seguro?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción es irreversible. Se eliminarán todas tus categorías y palabras personalizadas, reemplazándolas por la lista original del juego.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetClick} className={cn(buttonVariants({ variant: "destructive" }))}>
                      Sí, Restaurar
                    </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
        onClose={handleSuggestDialogClose}
        onAddWords={handleAddAISuggestedWords}
        isLoading={isAISuggesting}
        categoryName={categoryForAISuggestion}
        suggestedWords={aiSuggestedWords}
        duplicateWords={aiDuplicateWords}
      />
    </div>
  );
};

export default CategoryManagement;
