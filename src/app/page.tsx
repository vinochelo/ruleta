
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
import { Volume2, PlusCircle, Trash2, RotateCcw, Users, Plus, Sparkles, User, UserPlus } from 'lucide-react';
import { praiseWinner } from '@/ai/flows/praise-winner-flow';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [winnerPraise, setWinnerPraise] = useState<string | null>(null);
  const [totalPointsScored, setTotalPointsScored] = useState(0);
  const [usedWords, setUsedWords] = useState<Record<string, string[]>>({});
  const [useAIImages, setUseAIImages] = useState(true);
  const [gameMode, setGameMode] = useState<'teams' | 'players'>('teams');

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
        console.error("Failed to parse teams from localStorage", error);
        setTeams([]);
      }
    }
  }, []);
  
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
        audioContext.close().catch(console.error);
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
      if (speechSupported && !isSpeaking) {
          speak(text);
      }
  }, [speechSupported, isSpeaking, speak]);

  const handleIncrementScore = useCallback((teamId: string) => {
    playPointSound();

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
      praiseWinner({ winnerName: winningTeam.name, score: winningTeam.score, isTeam: gameMode === 'teams' })
        .then(result => {
          const message = result.praiseMessage;
          setWinnerPraise(message);
          speakFn(message);
        })
        .catch(error => {
          console.error("AI praise error:", error);
          const fallbackMessage = `¡Felicidades, ${winningTeam.name}! ¡Han ganado!`;
          setWinnerPraise(fallbackMessage);
          speakFn(fallbackMessage);
        });
      return; // Stop further announcements if there's a winner
    }

    // Announce leader/tie every 5 total points
    if (newTotalPoints > 0 && newTotalPoints % 5 === 0 && !isSpeaking) {
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
  }, [teams, winningScore, isSpeaking, persistTeams, speakFn, praiseWinner, totalPointsScored, gameMode]);

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
    if (!isSpeaking) speakFn("Puntuaciones reiniciadas.");
  }, [teams, persistTeams, toast, isSpeaking, speakFn]);
  
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

    if (availableWords.length === 0 && wordsInCat.length > 0) {
      toast({
        title: '¡Vuelta a empezar!',
        description: `Se han usado todas las palabras de "${category.name}". Se reinicia la lista.`,
      });
      availableWords = wordsInCat;
      setUsedWords(prev => ({ ...prev, [category.id]: [] }));
    }

    let wordToDraw = category.name; 
    if (availableWords.length > 0) {
      wordToDraw = availableWords[Math.floor(Math.random() * availableWords.length)];
      setUsedWords(prev => ({
        ...prev,
        [category.id]: [...(prev[category.id] || []), wordToDraw]
      }));
    }
    
    setSelectedWord(wordToDraw);
    setIsModalOpen(true);

    const announcement = `Categoría: ${category.name}.`;
     if (!isSpeaking) speakFn(announcement);
  }, [speakFn, isSpeaking, usedWords, toast]);

  const speakTimeSelectionCallback = useCallback((duration: number) => {
    if (!isSpeaking) speakFn(`${duration} segundos.`);
  }, [speakFn, isSpeaking]);


  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader className="p-3">
              <CardTitle className="title-text text-lg flex items-center gap-2">
                {gameMode === 'teams' ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
                {gameMode === 'teams' ? 'Equipos' : 'Jugadores'} y Puntuaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3 pt-0">
               <Tabs defaultValue="teams" onValueChange={(value) => setGameMode(value as 'teams' | 'players')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="teams">Equipos</TabsTrigger>
                      <TabsTrigger value="players">Jugadores</TabsTrigger>
                  </TabsList>
              </Tabs>

              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="winning-score" className="whitespace-nowrap font-medium text-sm">Puntos para Ganar:</Label>
                <Select
                  value={String(winningScore)}
                  onValueChange={(value) => setWinningScore(Number(value))}
                >
                  <SelectTrigger id="winning-score" className="w-[120px] h-9">
                    <SelectValue />
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
                              <p className="text-5xl font-bold tabular-nums drop-shadow-sm" style={{ color: team.color }}>
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
            </CardContent>
            {teams.length > 0 && (
              <CardFooter className="p-3 pt-0">
                <Button onClick={handleResetAllScores} variant="outline" size="sm" className="w-full transition-transform hover:scale-105">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar Puntuaciones
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4">
          <Roulette categories={categories} onSpinEnd={handleSpinEnd} />
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
