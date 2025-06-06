
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
  suggestedWords: z.array(z.string()).describe('A list of exactly 20 suggested Pictionary words or short phrases for the category. The words should be simple, drawable, and suitable for all ages. Prioritize common nouns and verbs.'),
});
export type SuggestWordsOutput = z.infer<typeof SuggestWordsOutputSchema>;

export async function suggestWordsForCategory(input: SuggestWordsInput): Promise<SuggestWordsOutput> {
  return suggestWordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPictionaryWordsPrompt',
  input: {schema: SuggestWordsInputSchema},
  output: {schema: SuggestWordsOutputSchema},
  prompt: `Eres un asistente experto en juegos de Pictionary. Dada una categoría, sugiere exactamente 20 palabras o frases cortas que sean excelentes para dibujar en Pictionary. Las palabras deben ser:
- Comunes y reconocibles.
- Relativamente fáciles de dibujar.
- Adecuadas para un público general (evita temas controvertidos o demasiado específicos).
- Variadas dentro de la categoría.
- Principalmente sustantivos o verbos de acción.

Categoría: {{{categoryName}}}

Devuelve solo la lista de palabras en el formato especificado.`,
  config: {
    temperature: 0.8, // Slightly higher for more variety if aiming for 20
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

