
'use server';

import { ai, geminiFlash } from '@/ai/genkit';
import { z } from 'zod';

const SuggestBulkCategoriesInputSchema = z.object({
    themeContext: z.enum(['default', 'kids', 'biblical']).optional().describe("El contexto temático para las categorías a generar. 'default' para temas generales, 'kids' para niños, 'biblical' para temas bíblicos.")
});
export type SuggestBulkCategoriesInput = z.infer<typeof SuggestBulkCategoriesInputSchema>;

const BulkCategorySchema = z.object({
    name: z.string().describe("El nombre de la categoría temática, p. ej., 'Frutas' o 'En el Espacio'."),
    words: z.array(z.string()).describe("Una lista de entre 15 y 20 palabras o frases cortas relacionadas con la categoría, excelentes para dibujar en Pictionary y aptas para todas las edades.")
});

const SuggestBulkCategoriesOutputSchema = z.object({
  categories: z.array(BulkCategorySchema).describe("Una lista de exactamente 5 categorías temáticas diferentes y de alta calidad para un juego de Pictionary."),
});
export type SuggestBulkCategoriesOutput = z.infer<typeof SuggestBulkCategoriesOutputSchema>;

export async function suggestBulkCategories(input?: SuggestBulkCategoriesInput): Promise<SuggestBulkCategoriesOutput> {
  return suggestBulkCategoriesFlow(input || {});
}

const prompt = ai.definePrompt({
  name: 'suggestBulkPictionaryCategoriesPrompt',
  model: geminiFlash,
  input: { schema: SuggestBulkCategoriesInputSchema },
  output: { schema: SuggestBulkCategoriesOutputSchema },
  prompt: `Eres un asistente experto en juegos de Pictionary. Tu misión es generar un paquete de **exactamente 5 categorías temáticas DIVERSAS, DIVERTIDAS y de alta calidad**.

**CONTEXTO TEMÁTICO IMPORTANTE:** Si se proporciona un contexto a continuación, TODAS las categorías y palabras deben adherirse estrictamente a él. Si dice 'default', genera temas generales y creativos. Si dice 'kids', todo debe ser simple y para niños. Si dice 'biblical', todo debe ser estrictamente sobre la Biblia.
**Contexto:** {{{themeContext}}}

**Reglas Críticas Universales:**
1.  **Idioma Español Exclusivamente:** Todas las categorías y palabras DEBEN estar en español.
2.  **Exactamente 5 Categorías:** La respuesta debe contener un array con precisamente 5 objetos de categoría.
3.  **Temas Diversos y Creativos:** Dentro del contexto dado, las 5 categorías deben ser diferentes entre sí. Para el modo 'default', evita temas obvios como 'Animales' u 'Objetos'; busca ideas como 'Cosas de la playa', 'Superhéroes y Villanos', etc.
4.  **Palabras de Calidad (15-20 por categoría):** Para cada categoría, genera una lista de entre 15 y 20 palabras o frases cortas.
5.  **FACILIDAD DE DIBUJO (¡MUY IMPORTANTE!):** Las palabras deben ser conceptos visuales y reconocibles que una persona promedio pueda dibujar. Prioriza sustantivos concretos.
6.  **Audiencia Adecuada:** Todas las palabras deben ser apropiadas para el público definido por el contexto.

Genera ahora el paquete de 5 categorías, asegurándote de seguir TODAS las reglas.`,
  config: {
    temperature: 0.8,
  }
});

const suggestBulkCategoriesFlow = ai.defineFlow(
  {
    name: 'suggestBulkCategoriesFlow',
    inputSchema: SuggestBulkCategoriesInputSchema,
    outputSchema: SuggestBulkCategoriesOutputSchema,
  },
  async (input) => {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("La clave API de Google no está configurada. Obtén una en https://aistudio.google.com/app/apikey y añádela como GOOGLE_API_KEY a tu archivo .env");
    }
    const { output } = await prompt(input);
    
    if (output && Array.isArray(output.categories)) {
        return output;
    }
    
    return { categories: [] };
  }
);
