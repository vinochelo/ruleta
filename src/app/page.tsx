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
import { Volume2, PlusCircle, Trash2, RotateCcw, Users, Plus, Sparkles, User, UserPlus, Lightbulb } from 'lucide-react';
import { praiseWinner } from '@/ai/flows/praise-winner-flow';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { GameInstructions } from '@/components/GameInstructions';

interface Category {
  id: string;
  name: string;
  words: string[];
}

const TEAM_COLORS = [
  "#EF4444", "#3B82F6", "#22C55E", "#F97316",
  "#8B5CF6", "#EC4899", "#14B8A6", "#EAB308",
];

interface Team {
  id: string;
  name: string;
  score: number;
  color: string;
}

const DEFAULT_CATEGORIES_WITH_WORDS: Category[] = [
    { id: "default-objetos-uuid", name: "Objetos", words: ["Silla", "Mesa", "Lámpara", "Libro", "Teléfono", "Taza", "Reloj", "Gafas", "Llave", "Peine", "Tijeras", "Cuchara", "Botella", "Ventana", "Puerta"] },
    { id: "default-animales-uuid", name: "Animales", words: ["Perro", "Gato", "Elefante", "León", "Jirafa", "Tigre", "Oso", "Pájaro", "Serpiente", "Mariposa", "Pez", "Caballo", "Vaca", "Mono", "Cebra"] },
    { id: "default-comida-uuid", name: "Comida", words: ["Manzana", "Pizza", "Hamburguesa", "Pasta", "Helado", "Sushi", "Ensalada", "Pan", "Chocolate", "Queso", "Huevo", "Sopa", "Galleta", "Naranja", "Uvas"] },
    { id: "default-acciones-uuid", name: "Acciones", words: ["Correr", "Saltar", "Nadar", "Escribir", "Leer", "Cantar", "Bailar", "Cocinar", "Volar", "Pintar", "Dormir", "Comer", "Beber", "Conducir", "Llorar"] },
    { id: "default-lugares-uuid", name: "Lugares", words: ["Playa", "Montaña", "Ciudad", "Bosque", "Desierto", "Parque", "Escuela", "Museo", "Hospital", "Restaurante", "Cine", "Supermercado", "Gimnasio", "Aeropuerto", "Estación de tren"] },
    { id: "default-personajes-uuid", name: "Personajes Famosos", words: ["Einstein", "Chaplin", "Picasso", "Mozart", "Cleopatra", "Da Vinci", "Marie Curie", "Shakespeare", "Gandhi", "Frida Kahlo", "Napoleón", "Beethoven", "Newton", "Michael Jackson", "Marilyn Monroe"] },
    { id: "default-peliculas-uuid", name: "Películas y Series", words: ["Titanic", "Star Wars", "Friends", "Stranger Things", "Harry Potter", "El Padrino", "Juego de Tronos", "Breaking Bad", "Matrix", "Casablanca", "Forrest Gump", "Pulp Fiction", "Los Simpson", "El Rey León", "La Casa de Papel"] },
    { id: "default-profesiones-uuid", name: "Profesiones", words: ["Médico", "Profesor", "Bombero", "Policía", "Cocinero", "Astronauta", "Pintor", "Músico", "Actor", "Científico", "Ingeniero", "Abogado", "Periodista", "Carpintero", "Piloto"] },
    { id: "default-deportes-uuid", name: "Deportes", words: ["Fútbol", "Baloncesto", "Tenis", "Natación", "Béisbol", "Golf", "Boxeo", "Ciclismo", "Atletismo", "Esquí", "Voleibol", "Rugby", "Fórmula 1", "Surf", "Ajedrez"] },
    { id: "default-transporte-uuid", name: "Transporte", words: ["Coche", "Avión", "Barco", "Bicicleta", "Tren", "Autobús", "Motocicleta", "Helicóptero", "Submarino", "Cohete", "Globo aerostático", "Patinete", "Camión", "Tranvía", "Canoa"] },
    { id: "default-naturaleza-uuid", name: "Naturaleza", words: ["Árbol", "Flor", "Río", "Sol", "Luna", "Estrella", "Nube", "Volcán", "Arcoíris", "Catarata", "Planta", "Roca", "Mar", "Relámpago", "Hoja"] },
    { id: "default-hogar-uuid", name: "Cosas de Casa", words: ["Sofá", "Cama", "Ducha", "Nevera", "Horno", "Ventana", "Puerta", "Espejo", "Alfombra", "Televisión", "Microondas", "Aspiradora", "Plancha", "Tostadora", "Lavadora"] },
    { id: "default-ropa-uuid", name: "Ropa", words: ["Camisa", "Pantalón", "Zapato", "Sombrero", "Vestido", "Falda", "Chaqueta", "Calcetines", "Bufanda", "Guantes", "Bikini", "Gorra", "Botas", "Pijama", "Corbata"] },
    { id: "default-cuerpo-uuid", name: "Partes del Cuerpo", words: ["Ojo", "Nariz", "Boca", "Mano", "Pie", "Cabeza", "Brazo", "Pierna", "Oreja", "Pelo", "Dedo", "Rodilla", "Codo", "Hombro", "Espalda"] },
    { id: "default-instrumentos-uuid", name: "Instrumentos Musicales", words: ["Guitarra", "Piano", "Violín", "Batería", "Flauta", "Trompeta", "Saxofón", "Arpa", "Tambor", "Bajo", "Ukelele", "Acordeón", "Clarinete", "Trombón", "Xilófono"] }
];

const CATEGORIES_STORAGE_KEY = 'ruletaRupestreCategories';
const TEAMS_STORAGE_KEY = 'ruletaRupestreTeams';
const GAME_MODE_STORAGE_KEY = 'ruletaRupestreGameMode';
const AI_IMAGES_STORAGE_KEY = 'ruletaRupestreAIImages';

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
  const [winnerPraise, setWinnerPraise] = useState<string | null>(null);
  const [totalPointsScored, setTotalPointsScored] = useState(0);
  const [usedWords, setUsedWords] = useState<Record<string, string[]>>({});
  const [useAIImages, setUseAIImages] = useState(false);
  const [gameMode, setGameMode] = useState<'teams' | 'players'>('teams');
  const [animatingScoreTeamId, setAnimatingScoreTeamId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const { speak, isSupported: speechSupported } = useSpeechSynthesis();
  const { toast } = useToast();
  
  // Load Instructions visibility
  useEffect(() => {
    const previouslyHidden = localStorage.getItem("hideGameInstructions") === "true";
    if (previouslyHidden) {
      setShowInstructions(false);
    }
  }, []);

  const handleCloseInstructions = () => {
    setShowInstructions(false);
    localStorage.setItem("hideGameInstructions", "true");
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
    localStorage.removeItem("hideGameInstructions");
  };

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
          const validatedTeams = (parsedStoredTeams as any[]).map((team, index) => ({
            id: String(team.id || crypto.randomUUID()),
            name: String(team.name || "Equipo sin nombre"),
            score: Number(team.score) || 0,
            color: String(team.color || TEAM_COLORS[index % TEAM_COLORS.length]),
          }));
          const uniqueTeamsMap = new Map<string, Team>();
          validatedTeams.forEach(team => {
            if (!uniqueTeamsMap.has(team.id)) {
              uniqueTeamsMap.set(team.id, team as Team);
            }
          });
          const finalTeams = Array.from(uniqueTeamsMap.values());
          setTeams(finalTeams);
          const initialTotalScore = finalTeams.reduce((acc, team) => acc + team.score, 0);
          setTotalPointsScored(initialTotalScore);
        }
      } catch (error) {
        setTeams([]);
      }
    }
  }, []);

  // Load and Persist Game Mode
  useEffect(() => {
    const storedGameMode = localStorage.getItem(GAME_MODE_STORAGE_KEY);
    if (storedGameMode === 'teams' || storedGameMode === 'players') {
      setGameMode(storedGameMode as 'teams' | 'players');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(GAME_MODE_STORAGE_KEY, gameMode);
  }, [gameMode]);

  // Load and Persist AI Image Preference
  useEffect(() => {
    const storedPreference = localStorage.getItem(AI_IMAGES_STORAGE_KEY);
    setUseAIImages(storedPreference === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem(AI_IMAGES_STORAGE_KEY, JSON.stringify(useAIImages));
  }, [useAIImages]);
  
  const playPointSound = () => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new window.AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);

      oscillator.onended = () => {
        audioContext.close().catch(() => {});
      };
    }
  };

  const persistTeams = useCallback((updatedTeams: Team[]) => {
    setTeams(updatedTeams);
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updatedTeams));
  }, []);

  const handleAddTeam = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = newTeamName.trim();
    if (!trimmedName) {
      toast({ title: "Error", description: `El nombre del ${gameMode === 'teams' ? 'equipo' : 'jugador'} no puede estar vacío.`, variant: "destructive" });
      return;
    }
    if (teams.some(team => team.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast({ title: "Error", description: `Ya existe un ${gameMode === 'teams' ? 'equipo' : 'jugador'} con este nombre.`, variant: "destructive" });
      return;
    }
    const newTeamColor = TEAM_COLORS[teams.length % TEAM_COLORS.length];
    const newTeam: Team = { id: crypto.randomUUID(), name: trimmedName, score: 0, color: newTeamColor };
    persistTeams([...teams, newTeam]);
    setNewTeamName('');
    toast({ title: `${gameMode === 'teams' ? 'Equipo' : 'Jugador'} Añadido`, description: `¡El ${gameMode === 'teams' ? 'equipo' : 'jugador'} "${trimmedName}" se ha unido!` });
  };

  const speakFn = useCallback((text: string) => {
      speak(text);
  }, [speak]);

  const handleIncrementScore = useCallback((teamId: string) => {
    playPointSound();
    setAnimatingScoreTeamId(teamId);

    const updatedTeams = teams.map(team =>
      team.id === teamId ? { ...team, score: team.score + 1 } : team
    );

    persistTeams(updatedTeams);
    const newTotalPoints = totalPointsScored + 1;
    setTotalPointsScored(newTotalPoints);

    const winningTeam = updatedTeams.find(team => team.id === teamId);
    if (!winningTeam) return;

    // Check for winner first
    if (winningScore > 0 && winningTeam.score >= winningScore) {
      setWinner(winningTeam);
      praiseWinner({ winnerName: winningTeam.name, gameMode: gameMode })
        .then(result => {
          const message = result.praiseMessage;
          setWinnerPraise(message);
          speakFn(message);
        })
        .catch(() => {
          const fallbackVerb = gameMode === 'teams' ? 'Han ganado' : 'Has ganado';
          const fallbackMessage = `¡Felicidades, ${winningTeam.name}! ¡${fallbackVerb}!`;
          setWinnerPraise(fallbackMessage);
          speakFn(fallbackMessage);
        });
      return; // Stop further announcements if there's a winner
    }

    // Announce leader/tie every 5 total points
    if (newTotalPoints > 0 && newTotalPoints % 5 === 0) {
      const highestScore = Math.max(...updatedTeams.map(t => t.score));
      if (highestScore > 0) {
        const leaders = updatedTeams.filter(t => t.score === highestScore);
        let announcement = "";
        if (leaders.length === 1) {
          announcement = `${leaders[0].name} va a la cabeza con ${leaders[0].score} puntos.`;
        } else {
          const tiedTeamNames = leaders.map(t => t.name);
          if (tiedTeamNames.length === 2) {
            announcement = `${tiedTeamNames[0]} y ${tiedTeamNames[1]} están empatados con ${highestScore} puntos.`;
          } else {
            const lastTeam = tiedTeamNames.pop();
            announcement = `${tiedTeamNames.join(', ')} y ${lastTeam} están empatados con ${highestScore} puntos.`;
          }
        }
        speakFn(announcement);
      }
    }
  }, [teams, winningScore, persistTeams, speakFn, praiseWinner, totalPointsScored, gameMode]);

  const handleRemoveTeam = useCallback((teamId: string) => {
    const teamToRemove = teams.find(t => t.id === teamId);
    persistTeams(teams.filter(team => team.id !== teamId));
    if (teamToRemove) {
      toast({ title: `${gameMode === 'teams' ? 'Equipo' : 'Jugador'} Eliminado`, description: `El ${gameMode === 'teams' ? 'equipo' : 'jugador'} "${teamToRemove.name}" ha sido eliminado.`, variant: "destructive" });
    }
  }, [teams, persistTeams, toast, gameMode]);

  const handleResetAllScores = useCallback(() => {
    persistTeams(teams.map(team => ({ ...team, score: 0 })));
    setTotalPointsScored(0);
    setUsedWords({});
    toast({ title: "Puntuaciones Reiniciadas", description: "Todas las puntuaciones se han reiniciado a 0." });
    speakFn("Puntuaciones reiniciadas.");
  }, [teams, persistTeams, toast, speakFn]);
  
  const handlePlayAgain = useCallback(() => {
    handleResetAllScores();
    setWinner(null);
    setWinnerPraise(null);
  }, [handleResetAllScores]);


  const handleSpinEnd = useCallback((category: Category, color: string) => {
    setSelectedCategoryFull(category);
    setSelectedCategoryColor(color);

    const wordsInCat = category.words || [];
    const usedInCat = usedWords[category.id] || [];
    let availableWords = wordsInCat.filter(word => !usedInCat.includes(word));

    let wordToDraw = category.name;
    let newUsedListForCategory: string[] | undefined;

    if (availableWords.length === 0 && wordsInCat.length > 0) {
      toast({
        title: '¡Vuelta a empezar!',
        description: `Se han usado todas las palabras de "${category.name}". Se reinicia la lista.`,
      });
      availableWords = wordsInCat;
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      wordToDraw = availableWords[randomIndex];
      newUsedListForCategory = [wordToDraw];

    } else if (availableWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      wordToDraw = availableWords[randomIndex];
      newUsedListForCategory = [...usedInCat, wordToDraw];
    }
    
    if (newUsedListForCategory) {
      setUsedWords(prev => ({
        ...prev,
        [category.id]: newUsedListForCategory
      }));
    }
    
    setSelectedWord(wordToDraw);
    setIsModalOpen(true);

    const announcement = `Categoría: ${category.name}.`;
    speakFn(announcement);
  }, [speakFn, usedWords, toast]);

  const speakTimeSelectionCallback = useCallback((duration: number) => {
    speakFn(`${duration} segundos.`);
  }, [speakFn]);


  return (
    <div className="space-y-8">
      <GameInstructions isOpen={showInstructions} onClose={handleCloseInstructions} />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-lg">
            <CardHeader className="p-4">
              <CardTitle className="title-text text-xl flex items-center gap-2">
                <Users className="h-6 w-6" />
                Configuración de la Partida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
               <Tabs value={gameMode} onValueChange={(value) => setGameMode(value as 'teams' | 'players')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-primary/10 p-1 h-11 rounded-lg">
                      <TabsTrigger value="players" className="text-base rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 flex items-center justify-center gap-2">
                         <User className="h-5 w-5"/> Jugadores
                      </TabsTrigger>
                       <TabsTrigger value="teams" className="text-base rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 flex items-center justify-center gap-2">
                         <Users className="h-5 w-5"/> Equipos
                      </TabsTrigger>
                  </TabsList>
              </Tabs>

              <form onSubmit={handleAddTeam} className="flex gap-2 items-center">
                <Input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder={gameMode === 'teams' ? "Nuevo equipo..." : "Nuevo jugador..."}
                  className="flex-grow h-9"
                  aria-label={`Nombre del nuevo ${gameMode === 'teams' ? 'equipo' : 'jugador'}`}
                />
                <Button type="submit" size="sm" className="transition-transform hover:scale-105">
                  {gameMode === 'teams' ? <PlusCircle className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                   Añadir
                </Button>
              </form>

              {teams.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">No hay {gameMode === 'teams' ? 'equipos' : 'jugadores'} todavía.</p>
              ) : (
                <div className="space-y-2">
                  <TooltipProvider>
                    {teams.map(team => (
                      <Card key={team.id} className="bg-card/50 shadow-inner overflow-hidden">
                        <CardContent className="p-2 flex items-center justify-between gap-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button onClick={() => handleRemoveTeam(team.id)} variant="ghost" size="icon" className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8 flex-shrink-0">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar {team.name}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar {team.name}</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <div className="flex-grow overflow-hidden">
                            <p className="text-3xl font-bold truncate" style={{ color: team.color }}>{team.name}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 flex-shrink-0">
                              <p 
                                className={cn(
                                  "text-5xl font-bold tabular-nums drop-shadow-sm",
                                  animatingScoreTeamId === team.id && "score-pop-animation"
                                )}
                                style={{ color: team.color }}
                                onAnimationEnd={() => setAnimatingScoreTeamId(null)}
                              >
                                  {team.score}
                              </p>
                              <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handleIncrementScore(team.id)}
                                  className="w-14 h-14 rounded-full text-white shadow-lg transition-transform hover:scale-105 flex items-center justify-center"
                                  style={{ backgroundColor: team.color }}
                                  aria-label={`Sumar 1 punto a ${team.name}`}
                                >
                                  <Plus className="h-8 w-8" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>Sumar 1 punto a {team.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TooltipProvider>
                </div>
              )}
              
              {teams.length > 0 && (
                <>
                <Separator />
                <div className="flex items-center justify-between gap-4 pt-2">
                  <Label htmlFor="winning-score" className="font-semibold text-muted-foreground">Puntos para Ganar:</Label>
                  <Select
                    value={String(winningScore)}
                    onValueChange={(value) => setWinningScore(Number(value))}
                  >
                    <SelectTrigger id="winning-score" className="w-[180px] h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5" className="text-green-600 focus:text-green-700">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-green-500"/> 5 (Fácil)
                        </div>
                      </SelectItem>
                      <SelectItem value="10" className="text-blue-600 focus:text-blue-700">
                         <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500"/> 10 (Normal)
                        </div>
                      </SelectItem>
                      <SelectItem value="15" className="text-orange-500 focus:text-orange-600">
                         <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-orange-500"/> 15 (Difícil)
                        </div>
                      </SelectItem>
                      <SelectItem value="20" className="text-red-600 focus:text-red-700">
                         <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-red-600"/> 20 (Experto)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                </>
              )}
            </CardContent>
            {teams.length > 0 && (
              <CardFooter className="p-4 pt-0">
                <Button onClick={handleResetAllScores} variant="outline" size="sm" className="w-full transition-transform hover:scale-105">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar Puntuaciones
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4">
          <Roulette categories={categories} onSpinEnd={handleSpinEnd} />
          {!showInstructions && (
            <div className="flex justify-center -mt-2">
              <Button
                onClick={handleShowInstructions}
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-transform hover:scale-105"
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                Mostrar Instrucciones
              </Button>
            </div>
          )}
           <Card className="shadow-lg">
                <CardContent className="p-3 flex items-center justify-between">
                    <Label htmlFor="ai-images-switch" className="flex items-center gap-2 font-medium text-base cursor-pointer">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Ayuda con Imágenes (IA)
                    </Label>
                    <Switch
                        id="ai-images-switch"
                        checked={useAIImages}
                        onCheckedChange={setUseAIImages}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-destructive"
                    />
                </CardContent>
            </Card>
            
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
        useAIImages={useAIImages}
      />
      
      <WinnerModal winner={winner} onPlayAgain={handlePlayAgain} praiseMessage={winnerPraise} gameMode={gameMode} />

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
