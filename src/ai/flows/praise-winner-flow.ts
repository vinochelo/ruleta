'use server';
/**
 * @fileOverview An AI flow to generate a funny congratulatory message for the game winner.
 *
 * - praiseWinner - A function that handles generating the praise message.
 * - PraiseWinnerInput - The input type for the praiseWinner function.
 * - PraiseWinnerOutput - The return type for the praiseWinner function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PraiseWinnerInputSchema = z.object({
  teamName: z.string().describe('The name of the winning team.'),
  score: z.number().describe('The final score of the winning team.'),
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
  input: {schema: PraiseWinnerInputSchema},
  output: {schema: PraiseWinnerOutputSchema},
  prompt: `You are an outrageously enthusiastic and slightly ridiculous game show host. A team has just won your Pictionary-style game. Your task is to generate a short, funny, and over-the-top congratulatory message for them.

      Rules:
      - The message must be in Spanish.
      - Keep it brief (2-3 sentences).
      - Mention the team's name: {{{teamName}}}.
      - DO NOT mention their final score.
      - Be incredibly energetic and use lots of exclamation points.
      - Use funny comparisons, like "¡Son más rápidos que un cohete engrasado!" or "¡Dibujan mejor que Picasso en una montaña rusa!".

      Generate the message now!`,
  config: {
    temperature: 0.9,
  }
});

const praiseWinnerFlow = ai.defineFlow(
  {
    name: 'praiseWinnerFlow',
    inputSchema: PraiseWinnerInputSchema,
    outputSchema: PraiseWinnerOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (output) {
        return output;
    }
    return { praiseMessage: `¡Felicidades, ${input.teamName}! ¡Han ganado!` };
  }
);
