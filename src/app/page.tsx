"use client";

import { useState, useEffect, useCallback, FormEvent } from 'react';
import Roulette from '@/components/roulette/Roulette';
import ResultsModal from '@/components/roulette/ResultsModal';
import WinnerModal from '@/components/roulette/WinnerModal';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Volume2, PlusCircle, Trash2, RotateCcw, Users, Award } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  words: string[];
}

interface Team {
  id: string;
  name: string;
  score: number;
}

const DEFAULT_CATEGORIES_WITH_WORDS: Category[] = [
  { id: "default-objetos-uuid", name: "Objetos", words: ["Silla", "Mesa", "Lámpara", "Libro", "Teléfono", "Taza", "Reloj", "Gafas", "Llave", "Peine"] },
  { id: "default-animales-uuid", name: "Animales", words: ["Perro", "Gato", "Elefante", "León", "Jirafa", "Tigre", "Oso", "Pájaro", "Serpiente", "Mariposa"] },
  { id: "default-comida-uuid", name: "Comida", words: ["Manzana", "Pizza", "Hamburguesa", "Pasta", "Helado", "Sushi", "Ensalada", "Pan", "Chocolate", "Queso"] },
  { id: "default-acciones-uuid", name: "Acciones", words: ["Correr", "Saltar", "Nadar", "Escribir", "Leer", "Cantar", "Bailar", "Cocinar", "Volar", "Pintar"] },
  { id: "default-lugares-uuid", name: "Lugares", words: ["Playa", "Montaña", "Ciudad", "Bosque", "Desierto", "Parque", "Escuela", "Museo", "Hospital", "Restaurante"] },
  { id: "default-personajes-uuid", name: "Personajes Famosos", words: ["Einstein", "Chaplin", "Picasso", "Mozart", "Cleopatra", "Da Vinci", "Marie Curie", "Shakespeare", "Gandhi", "Frida Kahlo"] },
  { id: "default-peliculas-uuid", name: "Películas y Series", words: ["Titanic", "Star Wars", "Friends", "Stranger Things", "Harry Potter", "El Padrino", "Juego de Tronos", "Breaking Bad", "Matrix", "Casablanca"] }
];

const CATEGORIES_STORAGE_KEY = 'ruletaRupestreCategories';
const TEAMS_STORAGE_KEY = 'ruletaRupestreTeams';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryFull, setSelectedCategoryFull] = useState<Category | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedCategoryColor, setSelectedCategoryColor] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [winningScore, setWinningScore] = useState<number>(10);
  const [winner, setWinner] = useState<Team | null>(null);

  const { speak, isSpeaking, isSupported: speechSupported } = useSpeechSynthesis();
  const { toast } = useToast();

  // Load Categories
  useEffect(() => {
    const storedCategoriesRaw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (storedCategoriesRaw) {
      try {
        const parsedStoredCategories: unknown = JSON.parse(storedCategoriesRaw);
        if (Array.isArray(parsedStoredCategories) && parsedStoredCategories.length > 0) {
          const validatedCategories = (parsedStoredCategories as any[]).map(cat => ({
            id: String(cat.id || crypto.randomUUID()),
            name: String(cat.name || "Categoría sin nombre"),
            words: Array.isArray(cat.words) ? cat.words.map(String) : [],
          }));
          const uniqueCategoriesMap = new Map<string, Category>();
          validatedCategories.forEach(cat => {
            if (!uniqueCategoriesMap.has(cat.id)) {
              uniqueCategoriesMap.set(cat.id, cat as Category);
            }
          });
          const uniqueCategories = Array.from(uniqueCategoriesMap.values());
          setCategories(uniqueCategories);
        } else if (Array.isArray(parsedStoredCategories) && parsedStoredCategories.length === 0) {
            setCategories(DEFAULT_CATEGORIES_WITH_WORDS);
        } else {
            setCategories(DEFAULT_CATEGORIES_WITH_WORDS);
        }
      } catch (error) {
        setCategories(DEFAULT_CATEGORIES_WITH_WORDS);
      }
    } else {
      setCategories(DEFAULT_CATEGORIES_WITH_WORDS);
    }
  }, []);

  // Load Teams
  useEffect(() => {
    const storedTeamsRaw = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (storedTeamsRaw) {
      try {
        const parsedStoredTeams: unknown = JSON.parse(storedTeamsRaw);
        if (Array.isArray(parsedStoredTeams)) {
          const validatedTeams = (parsedStoredTeams as any[]).map(team => ({
            id: String(team.id || crypto.randomUUID()),
            name: String(team.name || "Equipo sin nombre"),
            score: Number(team.score) || 0,
          }));
          const uniqueTeamsMap = new Map<string, Team>();
          validatedTeams.forEach(team => {
            if (!uniqueTeamsMap.has(team.id)) {
              uniqueTeamsMap.set(team.id, team as Team);
            }
          });
          setTeams(Array.from(uniqueTeamsMap.values()));
        }
      } catch (error) {
        console.error("Failed to parse teams from localStorage", error);
        setTeams([]);
      }
    }
  }, []);

  const persistTeams = useCallback((updatedTeams: Team[]) => {
    setTeams(updatedTeams);
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updatedTeams));
  }, []);

  const handleAddTeam = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = newTeamName.trim();
    if (!trimmedName) {
      toast({ title: "Error", description: "El nombre del equipo no puede estar vacío.", variant: "destructive" });
      return;
    }
    if (teams.some(team => team.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast({ title: "Error", description: "Ya existe un equipo con este nombre.", variant: "destructive" });
      return;
    }
    const newTeam: Team = { id: crypto.randomUUID(), name: trimmedName, score: 0 };
    persistTeams([...teams, newTeam]);
    setNewTeamName('');
    toast({ title: "Equipo Añadido", description: `¡El equipo "${trimmedName}" se ha unido!` });
  };

  const speakFn = useCallback((text: string) => {
      if (speechSupported && !isSpeaking) {
          speak(text);
      }
  }, [speechSupported, isSpeaking, speak]);

  const handleIncrementScore = useCallback((teamId: string) => {
    const teamToUpdate = teams.find(t => t.id === teamId);
    if (teamToUpdate && !isSpeaking) {
        speakFn(`${teamToUpdate.name} suma un punto.`);
    }
    
    const updatedTeams = teams.map(team => team.id === teamId ? { ...team, score: team.score + 1 } : team);
    persistTeams(updatedTeams);

    const winningTeam = updatedTeams.find(team => team.id === teamId);
    if (winningTeam && winningTeam.score >= winningScore) {
      setWinner(winningTeam);
    }
  }, [teams, isSpeaking, speakFn, persistTeams, winningScore]);

  const handleRemoveTeam = useCallback((teamId: string) => {
    const teamToRemove = teams.find(t => t.id === teamId);
    persistTeams(teams.filter(team => team.id !== teamId));
    if (teamToRemove) {
      toast({ title: "Equipo Eliminado", description: `El equipo "${teamToRemove.name}" ha sido eliminado.`, variant: "destructive" });
    }
  }, [teams, persistTeams, toast]);

  const handleResetAllScores = useCallback(() => {
    persistTeams(teams.map(team => ({ ...team, score: 0 })));
    toast({ title: "Puntuaciones Reiniciadas", description: "Todas las puntuaciones de los equipos se han reiniciado a 0." });
    if (!isSpeaking) speakFn("Puntuaciones reiniciadas.");
  }, [teams, persistTeams, toast, isSpeaking, speakFn]);
  
  const handlePlayAgain = useCallback(() => {
    handleResetAllScores();
    setWinner(null);
  }, [handleResetAllScores]);


  const handleSpinEnd = useCallback((category: Category, color: string) => {
    setSelectedCategoryFull(category);
    setSelectedCategoryColor(color);
    let wordToDraw = category.name; 
    if (category.words && category.words.length > 0) {
      wordToDraw = category.words[Math.floor(Math.random() * category.words.length)];
    }
    setSelectedWord(wordToDraw);
    setIsModalOpen(true);

    const announcement = `Categoría: ${category.name}.`;
     if (!isSpeaking) speakFn(announcement);
  }, [speakFn, isSpeaking]);

  const speakTimeSelectionCallback = useCallback((duration: number) => {
    if (!isSpeaking) speakFn(`${duration} segundos.`);
  }, [speakFn, isSpeaking]);


  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2">
          <Card className="shadow-lg transform transition-all duration-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="title-text text-2xl flex items-center gap-2">
                <Users className="h-6 w-6" />
                Equipos y Puntuaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="winning-score">Puntos para Ganar</Label>
                <Select
                  value={String(winningScore)}
                  onValueChange={(value) => setWinningScore(Number(value))}
                >
                  <SelectTrigger id="winning-score" className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Elige puntuación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Puntos</SelectItem>
                    <SelectItem value="10">10 Puntos</SelectItem>
                    <SelectItem value="15">15 Puntos</SelectItem>
                    <SelectItem value="20">20 Puntos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <form onSubmit={handleAddTeam} className="flex flex-col sm:flex-row gap-2 items-center">
                <Input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Nombre del nuevo equipo"
                  className="flex-grow"
                  aria-label="Nombre del nuevo equipo"
                />
                <Button type="submit" className="w-full sm:w-auto transition-transform hover:scale-105">
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Equipo
                </Button>
              </form>

              {teams.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No hay equipos todavía. ¡Añade algunos para empezar!</p>
              ) : (
                <div className="space-y-4">
                  <TooltipProvider>
                    {teams.map(team => (
                      <Card key={team.id} className="p-4 bg-card/50">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                          <div className="flex-grow">
                            <p className="text-xl font-semibold text-primary">{team.name}</p>
                            <p className="text-3xl font-bold text-foreground">{team.score} <span className="text-sm font-normal text-muted-foreground">puntos</span></p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button onClick={() => handleIncrementScore(team.id)} size="sm" className="bg-green-500 hover:bg-green-600 text-white transition-transform hover:scale-105">
                              <Award className="mr-2 h-4 w-4" /> Sumar Punto
                            </Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button onClick={() => handleRemoveTeam(team.id)} variant="destructive" size="icon" className="transition-transform hover:scale-105">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Eliminar {team.name}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Eliminar {team.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </TooltipProvider>
                </div>
              )}
            </CardContent>
            {teams.length > 0 && (
              <CardFooter>
                <Button onClick={handleResetAllScores} variant="outline" className="w-full transition-transform hover:scale-105">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar Todas las Puntuaciones
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Roulette categories={categories} onSpinEnd={handleSpinEnd} />
        </div>
      </div>

      <ResultsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCategoryName={selectedCategoryFull?.name || null}
        selectedWord={selectedWord}
        selectedCategoryColor={selectedCategoryColor}
        speakTimeSelection={speakTimeSelectionCallback}
        speakFn={speakFn}
      />
      
      <WinnerModal winner={winner} onPlayAgain={handlePlayAgain} />

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
    </div>
  );
}
