
'use server';

import { ai, geminiFlash } from '@/ai/genkit';
import { z } from 'zod';

const BulkCategorySchema = z.object({
    name: z.string().describe("El nombre de la categoría temática, p. ej., 'Frutas' o 'En el Espacio'."),
    words: z.array(z.string()).describe("Una lista de entre 15 y 20 palabras o frases cortas relacionadas con la categoría, excelentes para dibujar en Pictionary y aptas para todas las edades.")
});

const SuggestBulkCategoriesOutputSchema = z.object({
  categories: z.array(BulkCategorySchema).describe("Una lista de exactamente 5 categorías temáticas diferentes y de alta calidad para un juego de Pictionary."),
});
export type SuggestBulkCategoriesOutput = z.infer<typeof SuggestBulkCategoriesOutputSchema>;

export async function suggestBulkCategories(): Promise<SuggestBulkCategoriesOutput> {
  return suggestBulkCategoriesFlow();
}

const prompt = ai.definePrompt({
  name: 'suggestBulkPictionaryCategoriesPrompt',
  model: geminiFlash,
  output: { schema: SuggestBulkCategoriesOutputSchema },
  prompt: `Eres un asistente experto en juegos de Pictionary, especializado en crear paquetes de categorías temáticas listas para jugar.

Tu misión es generar un paquete de **exactamente 5 categorías temáticas DIVERSAS y DIVERTIDAS**. No deben ser las típicas categorías obvias como "Animales" u "Objetos". Busca temas más creativos y específicos.

**Reglas Críticas:**
1.  **Idioma Español Exclusivamente:** Todas las categorías y palabras DEBEN estar en español.
2.  **Exactamente 5 Categorías:** La respuesta debe contener un array con precisamente 5 objetos de categoría.
3.  **Temas Creativos y Diversos:** Las 5 categorías deben ser diferentes entre sí y estimulantes. Ejemplos de buenas ideas: "Cosas que encuentras en la playa", "Superhéroes y Villanos", "Marcas Famosas", "Instrumentos Musicales", "Deportes Olímpicos". Evita temas demasiado genéricos o aburridos.
4.  **Palabras de Calidad (15-20 por categoría):** Para cada categoría, genera una lista de entre 15 y 20 palabras o frases cortas.
5.  **FACILIDAD DE DIBUJO (¡MUY IMPORTANTE!):** Las palabras deben ser conceptos visuales, comunes y reconocibles que una persona promedio pueda dibujar y adivinar. Prioriza sustantivos concretos y acciones claras. Evita conceptos abstractos o difíciles de representar gráficamente.
6.  **Audiencia General:** Todas las palabras deben ser aptas para todas las edades.

Genera ahora el paquete de 5 categorías, asegurándote de seguir TODAS las reglas.`,
  config: {
    temperature: 0.8, // Aumenta la temperatura para obtener categorías más creativas.
  }
});

const suggestBulkCategoriesFlow = ai.defineFlow(
  {
    name: 'suggestBulkCategoriesFlow',
    outputSchema: SuggestBulkCategoriesOutputSchema,
  },
  async () => {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("La clave API de Google no está configurada. Obtén una en https://aistudio.google.com/app/apikey y añádela como GOOGLE_API_KEY a tu archivo .env");
    }
    const { output } = await prompt();
    
    if (output && Array.isArray(output.categories)) {
        return output;
    }
    
    return { categories: [] };
  }
);
