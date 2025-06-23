'use server';
/**
 * @fileOverview An AI flow to generate a funny congratulatory message for the game winner.
 *
 * - praiseWinner - A function that handles generating the praise message.
 * - PraiseWinnerInput - The input type for the praiseWinner function.
 * - PraiseWinnerOutput - The return type for the praiseWinner function.
 */

import {ai, geminiFlash} from '@/ai/genkit';
import {z} from 'zod';

const PraiseWinnerInputSchema = z.object({
  winnerName: z.string().describe('The name of the winning team or player.'),
  score: z.number().describe('The final score of the winning team.'),
  isTeam: z.boolean().describe('True if the winner is a team, false if it is an individual player.'),
});
export type PraiseWinnerInput = z.infer<typeof PraiseWinnerInputSchema>;

const PraiseWinnerOutputSchema = z.object({
  praiseMessage: z.string().describe('A short, funny, and over-the-top congratulatory message for the winning team. It should sound like an excited game show host. Mention the team name.'),
});
export type PraiseWinnerOutput = z.infer<typeof PraiseWinnerOutputSchema>;

export async function praiseWinner(input: PraiseWinnerInput): Promise<PraiseWinnerOutput> {
  return praiseWinnerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'praiseWinnerPrompt',
  model: geminiFlash,
  input: {schema: PraiseWinnerInputSchema},
  output: {schema: PraiseWinnerOutputSchema},
  prompt: `Eres un presentador de concursos de televisión legendario y tremendamente entusiasta, famoso por tus elogios creativos e hilarantes. Tu programa es un juego al estilo Pictionary. {{#if isTeam}}Un equipo{{else}}Un jugador{{/if}} acaba de ganar. Tu trabajo es generar un mensaje de felicitación corto, impactante y exagerado para {{#if isTeam}}ellos{{else}}él/ella{{/if}}.

REGLAS CRÍTICAMENTE IMPORTANTES:
- El mensaje DEBE ser en español.
- ¡Sé increíblemente enérgico y positivo! Usa signos de exclamación generosamente.
- Brevedad y Potencia: 2 a 3 frases como máximo.
- Nombra al Ganador: Menciona siempre a {{{winnerName}}} y dirígete directamente a {{#if isTeam}}ellos{{else}}él/ella{{/if}}. (Ej: "¡Felicidades, Campeones!" y NO "El equipo Campeones ha ganado").
- Sin Puntuaciones: NO menciones su puntuación final.
- **MÁXIMA CREATIVIDAD Y VARIEDAD**: ¡Esta es la regla más importante! Cada mensaje debe ser **completamente único y original**. El humor debe provenir de comparaciones o metáforas inesperadas relacionadas con el dibujo, la velocidad, la inteligencia o la telepatía.
- **EVITA CLICHÉS A TODA COSTA**: No uses frases repetitivas ni comparaciones comunes. Por ejemplo, **EVITA ABSOLUTAMENTE** cualquier mención a "relojeros suizos", "GPS", "chismes en pueblos pequeños" o cualquier cosa que se parezca a los ejemplos. ¡Sorpréndeme cada vez!

EJEMPLOS (ÚSALOS SOLO COMO INSPIRACIÓN DE TONO, NO COPIES LA ESTRUCTURA):
- "¡Victoria para Los Visionarios! ¡Dibujan tan rápido que sus lápices echan humo y piden un descanso!"
- "¡Impresionante, Mente Colectiva! ¡Su conexión mental es más fuerte que la señal del Wi-Fi del vecino!"
- "¡Absolutamente increíble, Los Trazos Letales! ¡Convierten ideas en arte más rápido de lo que un mago saca un conejo del sombrero!"

EJEMPLOS MALOS (NO HAGAS ESTO):
- "Ganaron. Felicidades." (Aburrido)
- "Son muy rápidos." (Genérico)
- "Felicidades por su puntuación." (Menciona la puntuación)
- "Tienen la precisión de un relojero suizo." (¡Cliché prohibido!)

¡Ahora, con toda tu energía, genera un mensaje totalmente nuevo y sorprendente para {{{winnerName}}}!`,
  config: {
    temperature: 1.0, // Increased for more creativity and variety
  }
});

const praiseWinnerFlow = ai.defineFlow(
  {
    name: 'praiseWinnerFlow',
    inputSchema: PraiseWinnerInputSchema,
    outputSchema: PraiseWinnerOutputSchema,
  },
  async (input) => {
    if (!process.env.GOOGLE_API_KEY) {
      console.error("FATAL: La variable de entorno GOOGLE_API_KEY no está configurada.");
      return { praiseMessage: `¡Felicidades, ${input.winnerName}! ¡Han ganado!` };
    }
    const {output} = await prompt(input);
    if (output) {
        return output;
    }
    return { praiseMessage: `¡Felicidades, ${input.winnerName}! ¡Han ganado!` };
  }
);
