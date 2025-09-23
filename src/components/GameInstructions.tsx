
"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, Play, Users, Paintbrush, Clock, Brain, CheckCircle, RotateCcw, Rocket, Trophy } from "lucide-react";
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
          ¡Bienvenido a Ruleta Pictionary! ¿Cómo Jugar?
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
                  **Añade Jugadores o Equipos:** Usa la sección "Configuración de la Partida" para añadir los nombres de los participantes.
                </li>
                <li>
                  <Paintbrush className="inline h-4 w-4 mr-1 text-secondary" />
                  **Prepara tus Materiales:** Necesitarás una pizarra, papel, o cualquier aplicación de dibujo para dar vida a tus creaciones.
                </li>
                 <li>
                  <Rocket className="inline h-4 w-4 mr-1 text-secondary" />
                  **Elige tu Modo de Juego:** En la página "Gestionar Categorías", puedes elegir entre varios modos:
                    <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                      <li>**Modo Normal:** Contiene una gran variedad de categorías generales.</li>
                      <li>**Modo Infantil:** Categorías y palabras sencillas para los más pequeños.</li>
                      <li>**Modo Bíblico:** Contenido centrado exclusivamente en la Biblia.</li>
                      <li>**¡Crea el Tuyo!** Añade tus propias categorías y palabras para un juego 100% personalizado.</li>
                    </ul>
                </li>
                <li>
                  <Brain className="inline h-4 w-4 mr-1 text-secondary" />
                  **Modo Novato (¡Carga Rápida!):** Si no quieres crear categorías, ve a "Gestionar Categorías" y usa el botón "Generar Categorías con IA". La inteligencia artificial creará 5 categorías temáticas listas para jugar en segundos. ¡Funciona para cualquier modo de juego!
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
                  **Girar la Ruleta:** ¡Pulsa el botón central para que la ruleta elija una categoría y una palabra secreta!
                </li>
                <li>
                  <Users className="inline h-4 w-4 mr-1 text-secondary" />
                  **El Artista Secreto:** Solo la persona designada para dibujar (el "Artista" de ese turno) debe ver la palabra.
                </li>
                 <li>
                  <Brain className="inline h-4 w-4 mr-1 text-secondary" />
                  **Asistencia con IA (Opcional):** Si el Artista se queda en blanco, puede usar los botones de ayuda de la IA:
                    <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                        <li>**Obtener Inspiración:** Genera un icono simple y minimalista que sirva como punto de partida.</li>
                        <li>**Pista Avanzada:** Crea una imagen más detallada y fotorrealista si la inspiración inicial no es suficiente.</li>
                    </ul>
                </li>
                <li>
                  <Clock className="inline h-4 w-4 mr-1 text-secondary" />
                  **¡Tiempo de Crear!:** Selecciona un tiempo (30, 60, 90 o 120 segundos) y que el artista empiece a dibujar.
                </li>
                <li>
                  <Lightbulb className="inline h-4 w-4 mr-1 text-secondary" />
                  **Adivinar sin Piedad:** Mientras el Artista dibuja, su equipo (o los demás jugadores) deben intentar adivinar la palabra.
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
                  **¡Punto Ganado!:** Si un equipo adivina la palabra antes de que termine el tiempo, pulsa el botón "+" para sumarles un punto.
                </li>
                <li>
                  <RotateCcw className="inline h-4 w-4 mr-1 text-secondary" />
                  **Turno Siguiente:** Si nadie adivina, ¡no pasa nada! Simplemente cierra la ventana y el turno pasa al siguiente equipo.
                </li>
                 <li>
                  <Trophy className="inline h-4 w-4 mr-1 text-secondary" />
                  **Fin de la Partida:** El primer equipo en alcanzar la puntuación para ganar (definida en la configuración) será el campeón.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="font-semibold text-lg text-primary">
              <Lightbulb className="h-5 w-5 mr-2" /> 4. Consejos para el Éxito
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pl-8">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <Users className="inline h-4 w-4 mr-1 text-secondary" />
                  **Comunicación No Verbal:** ¡Recuerda que está estrictamente prohibido hablar, hacer sonidos o gestos! Solo se permite dibujar.
                </li>
                <li>
                  <Paintbrush className="inline h-4 w-4 mr-1 text-secondary" />
                  **Claridad en el Caos:** Aunque estés contra el reloj, la simplicidad suele ser más efectiva que un dibujo demasiado complejo.
                </li>
                <li>
                  <Play className="inline h-4 w-4 mr-1 text-secondary" />
                  **¡Lo más importante, Diviértete!:** La esencia de Ruleta Pictionary es reír, interactuar y pasar un momento inolvidable.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
