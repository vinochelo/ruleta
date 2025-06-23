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

REGLAS CRÍTICAS:
- El mensaje DEBE ser en español.
- ¡Sé increíblemente enérgico! Usa signos de exclamación generosamente.
- Sé breve: 2 a 3 frases como máximo.
- Menciona siempre al ganador por su nombre, que es {{{winnerName}}}.
- IMPORTANTE: Dirígete a ellos directamente. Por ejemplo, "¡Felicidades, Campeones!" y NO "El equipo Campeones ha ganado".
- NO menciones su puntuación final.
- El humor debe provenir de comparaciones tremendamente creativas relacionadas con el dibujo, la velocidad o la inteligencia. Cada mensaje debe ser único.

EJEMPLOS BUENOS:
- "¡Felicidades, Artistas del Apocalipsis! ¡Sus lápices son más precisos que un cirujano con GPS!"
- "¡Increíble, Los Genios! ¡Adivinan las palabras más rápido que un chisme en un pueblo pequeño!"
- "¡Victoria para Mentes Maestras! ¡Tienen más sinergia que el pan con la mantequilla!"

EJEMPLOS MALOS (EVITA ESTOS):
- "Ganaron. Felicidades." (Demasiado aburrido)
- "Son tan buenos como un coche rápido." (Demasiado genérico)
- "Felicitaciones, Equipo Alfa, por su puntuación de 10." (Menciona la puntuación)

¡Ahora, genera un mensaje completamente nuevo y original para {{{winnerName}}}!`,
  config: {
    temperature: 0.9, // Slightly reduced for more coherent creativity
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
