
'use server';
/**
 * @fileOverview An AI flow to suggest Pictionary words for a given category.
 *
 * - suggestWordsForCategory - A function that handles word suggestions.
 * - SuggestWordsInput - The input type for the suggestWordsForCategory function.
 * - SuggestWordsOutput - The return type for the suggestWordsForCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWordsInputSchema = z.object({
  categoryName: z.string().describe('The name of the category for which to suggest words.'),
});
export type SuggestWordsInput = z.infer<typeof SuggestWordsInputSchema>;

const SuggestWordsOutputSchema = z.object({
  suggestedWords: z.array(z.string()).describe('A high-quality list of between 15 and 25 suggested Pictionary words or short phrases. Every word must be clearly and directly related to the category. The words should be simple, drawable, and suitable for all ages.'),
});
export type SuggestWordsOutput = z.infer<typeof SuggestWordsOutputSchema>;

export async function suggestWordsForCategory(input: SuggestWordsInput): Promise<SuggestWordsOutput> {
  return suggestWordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPictionaryWordsPrompt',
  input: {schema: SuggestWordsInputSchema},
  output: {schema: SuggestWordsOutputSchema},
  prompt: `Eres un asistente experto en juegos de Pictionary, especializado en crear listas de palabras temáticas. Para la categoría proporcionada, genera una lista de palabras o frases cortas que sean excelentes para dibujar.

**Reglas Críticas:**
1.  **Relevancia Absoluta:** Todas y cada una de las palabras deben estar **directamente y claramente relacionadas** con la categoría '{{{categoryName}}}'. No incluyas conceptos vagos o tangenciales.
2.  **Calidad sobre Cantidad:** Genera una lista de alta calidad con **entre 15 y 25 palabras**. Es mejor una lista más corta pero excelente que una larga con palabras de relleno.
3.  **Facilidad de Dibujo:** Las palabras deben ser conceptos visuales, comunes y reconocibles que una persona promedio pueda dibujar y adivinar. Prioriza sustantivos concretos y verbos de acción.
4.  **Audiencia General:** Las palabras deben ser aptas para todas las edades.

Categoría: **{{{categoryName}}}**

Genera ahora la lista de palabras.`,
  config: {
    temperature: 0.7,
  }
});

const suggestWordsFlow = ai.defineFlow(
  {
    name: 'suggestWordsFlow',
    inputSchema: SuggestWordsInputSchema,
    outputSchema: SuggestWordsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    // Ensure output is not null and conforms to the schema, otherwise return empty array.
    if (output && Array.isArray(output.suggestedWords)) {
        return output;
    }
    return { suggestedWords: [] };
  }
);
