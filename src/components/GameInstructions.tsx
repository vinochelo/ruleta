"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, Play, Users, Paintbrush, Clock, Brain, CheckCircle, RotateCcw } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface GameInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameInstructions({ isOpen, onClose }: GameInstructionsProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Card className="mb-8 border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="title-text flex items-center gap-2">
          <Lightbulb className="h-6 w-6" />
          ¡Bienvenido a Ruleta Rupestre! ¿Cómo Jugar?
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Cerrar instrucciones"
          className="h-9 w-9 rounded-full text-foreground/60 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-6 w-6" />
        </Button>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4 text-foreground/70">
          Prepárate para un emocionante juego de adivinanzas con dibujos. Sigue estos pasos para divertirte al máximo:
        </CardDescription>

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="font-semibold text-lg text-primary">
              <Play className="h-5 w-5 mr-2" /> 1. Preparación del Juego
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pl-8">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <Users className="inline h-4 w-4 mr-1 text-secondary" />
                  **Jugadores:** Decide si jugar de forma individual o en equipos. Si es en equipos, ¡escojan nombres creativos y divertidos!
                </li>
                <li>
                  <Paintbrush className="inline h-4 w-4 mr-1 text-secondary" />
                  **Materiales:** Necesitarán una pizarra grande o un papelógrafo, y marcadores o tiza que sean claramente visibles para todos los participantes. Este será su lienzo para el arte rupestre moderno.
                </li>
                <li>
                  <Lightbulb className="inline h-4 w-4 mr-1 text-secondary" />
                  **Configuración Inicial:** Antes de empezar, asegúrense de haber gestionado y creado categorías de palabras en la sección correspondiente. Cuantas más categorías y palabras tengas, ¡más larga y variada será la diversión!
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="font-semibold text-lg text-primary">
              <RotateCcw className="h-5 w-5 mr-2" /> 2. Dinámica del Juego
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pl-8">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <Play className="inline h-4 w-4 mr-1 text-secondary" />
                  **Girar la Ruleta:** ¡Es hora de la acción! Pulsa el botón para que la ruleta gire y te revele una palabra secreta.
                </li>
                <li>
                  <Users className="inline h-4 w-4 mr-1 text-secondary" />
                  **El Artista Secreto:** Solo la persona designada para dibujar (el "Artista Rupestre" de ese turno) debe ver la palabra que salió. ¡El silencio es oro para los demás!
                </li>
                <li>
                  <Clock className="inline h-4 w-4 mr-1 text-secondary" />
                  **Tiempo de Creación:** El juego sugiere un tiempo de 1 minuto para que el Artista complete su obra maestra. ¡La presión del reloj añade un toque emocionante! (Puedes acordar ajustar este tiempo si lo deseas).
                </li>
                <li>
                  <Brain className="inline h-4 w-4 mr-1 text-secondary" />
                  **Asistencia IA (Opcional):** Si el Artista necesita un poco de inspiración para empezar, Ruleta Rupestre puede generar una imagen de referencia usando Inteligencia Artificial. ¡Recuerda, es solo una guía, no para copiar directamente!
                </li>
                <li>
                  <Lightbulb className="inline h-4 w-4 mr-1 text-secondary" />
                  **Adivinar sin Piedad:** Mientras el Artista dibuja frenéticamente, los demás jugadores o equipos deben intentar adivinar la palabra. ¡Griten sus respuestas con entusiasmo!
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="font-semibold text-lg text-primary">
              <CheckCircle className="h-5 w-5 mr-2" /> 3. Puntuación y Turnos
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pl-8">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <CheckCircle className="inline h-4 w-4 mr-1 text-secondary" />
                  **¡Victoria!:** Si un jugador o equipo adivina la palabra correctamente antes de que termine el tiempo, ¡se añaden puntos a su marcador! ¡Es momento de celebrar su perspicacia!
                </li>
                <li>
                  <RotateCcw className="inline h-4 w-4 mr-1 text-secondary" />
                  **Turno Siguiente:** Si el tiempo se agota y nadie logra adivinar la palabra, ¡no hay problema! El turno simplemente pasa al siguiente jugador o equipo. ¡Siempre habrá otra oportunidad para brillar!
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="font-semibold text-lg text-primary">
              <Lightbulb className="h-5 w-5 mr-2" /> 4. Consejos para el Éxito Rupestre
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pl-8">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <Users className="inline h-4 w-4 mr-1 text-secondary" />
                  **Comunicación No Verbal:** ¡Recuerda que está estrictamente prohibido hablar, hacer sonidos o gestos que den pistas directas sobre la palabra! Solo se permite dibujar.
                </li>
                <li>
                  <Paintbrush className="inline h-4 w-4 mr-1 text-secondary" />
                  **Claridad en el Caos:** Aunque estés contra el reloj, intenta que tus dibujos sean lo más claros posible. La simplicidad y el impacto visual son clave.
                </li>
                <li>
                  <Play className="inline h-4 w-4 mr-1 text-secondary" />
                  **¡Lo más importante, Diviértete!:** La esencia de Ruleta Rupestre es reír, interactuar y pasar un momento inolvidable con amigos o familia. ¡Que la creatividad fluya!
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
