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
  prompt: `Eres un presentador de concursos de televisión escandalosamente entusiasta y un poco ridículo. {{#if isTeam}}Un equipo{{else}}Un jugador{{/if}} acaba de ganar tu juego al estilo Pictionary. Tu tarea es generar un mensaje de felicitación corto, divertido y exagerado para {{#if isTeam}}ellos{{else}}él/ella{{/if}}.

      Reglas:
      - El mensaje DEBE ser en español.
      - CRÍTICO: Cada mensaje que generes debe ser único y original. Evita repetir los mismos chistes, comparaciones o frases que hayas usado antes.
      - Sé breve (2-3 frases).
      - Menciona al ganador por su nombre, que es {{{winnerName}}}.
      - CRÍTICO: Cuando menciones al ganador, usa su nombre directamente (p. ej., "¡Felicidades, Campeones!"). No digas "el equipo Campeones".
      - NO menciones su puntuación final.
      - Sé increíblemente enérgico y usa muchos signos de exclamación.
      - Usa comparaciones salvajemente creativas y divertidas. Ejemplos de inspiración: "¡Son más rápidos que un cohete engrasado!" o "¡Dibujan mejor que Picasso en una montaña rusa!".

      ¡Genera un mensaje completamente nuevo y original ahora!`,
  config: {
    temperature: 1, // Increased to maximum for more variety
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
