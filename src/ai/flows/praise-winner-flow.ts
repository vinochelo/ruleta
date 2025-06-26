
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
  gameMode: z.enum(['teams', 'players']).describe("The game mode, to distinguish between a single player or a team victory."),
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
  prompt: `Eres un presentador de concursos de televisión legendario, conocido por tu ingenio desbordante y tus elogios salvajemente creativos.

Acaba de terminar una partida de Pictionary. El ganador es "{{{winnerName}}}".
El modo de juego era: "{{{gameMode}}}".

**Instrucción Clave:**
- Si el \`gameMode\` es "teams", {{{winnerName}}} es un equipo. Usa un lenguaje en plural (ej: "¡Ellos han ganado!", "¡Qué equipazo!", "sus mentes...").
- Si el \`gameMode\` es "players", {{{winnerName}}} es un jugador individual. Usa un lenguaje en singular (ej: "¡Has ganado!", "¡Qué artista!", "tu mente...").

Tu misión es celebrar esta victoria con un mensaje de felicitación CORTO (2-4 frases), ENÉRGICO y, lo más importante, **RADICALMENTE ORIGINAL CADA VEZ**.

**REGLAS DE ORO (INQUEBRANTABLES):**
1.  **Ajuste al Modo de Juego:** Adapta perfectamente tu lenguaje a si es un equipo o un jugador.
2.  **Prohibido Repetir:** NUNCA uses las mismas frases, metáforas o estructuras. Cada elogio debe ser único.
3.  **Busca Enfoques Inesperados:** El humor debe surgir de la sorpresa. No te limites a decir "¡Qué bien lo hicieron/hiciste!". Explora diferentes ángulos:
    *   **La Hipérbole Épica:** (Para equipo) "¡Increíble! La victoria de {{{winnerName}}} será cantada por los bardos del futuro. ¡Sus lápices eran espadas y sus mentes, fortalezas inexpugnables!" / (Para jugador) "¡Una leyenda nace hoy! Tu victoria, {{{winnerName}}}, resonará en los anales del arte. ¡Tu lápiz es un cetro y tu mente, un reino de creatividad!"
    *   **La Comparación Absurda:** (Para equipo) "¡Atención, mundo! {{{winnerName}}} ha demostrado una conexión telepática que haría que un par de calcetines gemelos se sintieran como extraños." / (Para jugador) "¡Impresionante! {{{winnerName}}}, tienes una precisión que haría que un cirujano suizo pareciera un aficionado con guantes de boxeo."
    *   **El Comentario Deportivo Apasionado:** (Para equipo) "¡Lo han logrado! ¡Qué exhibición de velocidad y precisión! ¡{{{winnerName}}} levanta el trofeo imaginario con la garra de los campeones!" / (Para jugador) "¡Insuperable! ¡Qué demostración de talento! ¡{{{winnerName}}}, te cuelgas la medalla de oro del Pictionary con el estilo de un campeón olímpico!"

El objetivo es crear un momento memorable y divertido, perfectamente adaptado al ganador.

¡Ahora, con toda tu chispa y respetando el modo de juego, genera un elogio COMPLETAMENTE NUEVO Y DIFERENTE para {{{winnerName}}}!`,
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
    const fallbackVerb = input.gameMode === 'teams' ? 'han ganado' : 'has ganado';
    return { praiseMessage: `¡Felicidades, ${input.winnerName}! ¡${fallbackVerb} de una forma espectacular!` };
  }
);

