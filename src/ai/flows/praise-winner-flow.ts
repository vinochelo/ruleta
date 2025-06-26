
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
  prompt: `Eres un presentador de concursos de televisión legendario, conocido por tu ingenio desbordante y tus elogios salvajemente creativos. En tu programa, un juego de Pictionary, acaba de ganar "{{{winnerName}}}". Tu misión es celebrar su victoria con un mensaje de felicitación CORTO (2-4 frases), ENÉRGICO y, lo más importante, **COMPLETAMENTE INESPERADO Y ORIGINAL**.

**REGLAS DE ORO (INQUEBRANTABLES):**
1.  **Originalidad Extrema:** ¡Esta es tu máxima prioridad! Cada elogio debe ser único. El humor debe surgir de metáforas, analogías o comparaciones absurdas e inteligentes.

**El objetivo no es solo felicitar, es crear un momento memorable y divertido.**

¡Ahora, con toda tu chispa, genera un elogio completamente nuevo y sorprendente para {{{winnerName}}}!`,
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
      throw new Error("La clave API de Google no está configurada. Obtén una en https://aistudio.google.com/app/apikey y añádela como GOOGLE_API_KEY a tu archivo .env");
    }
    const {output} = await prompt(input);
    if (output) {
        return output;
    }
    // Fallback in case AI returns a non-compliant or empty response
    return { praiseMessage: `¡Felicidades, ${input.winnerName}! ¡Han ganado de una forma espectacular!` };
  }
);
