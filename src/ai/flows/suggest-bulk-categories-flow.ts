
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
  prompt: `Eres un asistente experto en juegos de Pictionary, especializado en crear paquetes de categorías temáticas listas para jugar.

Tu misión es generar un paquete de **exactamente 5 categorías temáticas DIVERSAS y DIVERTIDAS**.

{{#if themeContext}}
**CONTEXTO TEMÁTICO IMPORTANTE: {{themeContext}}**
{{#if (eq themeContext 'kids')}}
- **Instrucción Principal:** Todo el contenido debe ser **APTO PARA NIÑOS** de entre 6 y 12 años. Usa conceptos muy simples, reconocibles y fáciles de dibujar para ellos. Piensa en temas como animales de la granja, juguetes, formas y colores, etc.
{{else if (eq themeContext 'biblical')}}
- **Instrucción Principal:** Todo el contenido debe estar **ESTRICTAMENTE RELACIONADO CON LA BIBLIA**. Piensa en personajes, lugares, objetos, historias y parábolas tanto del Antiguo como del Nuevo Testamento.
{{else if (eq themeContext 'default')}}
- **Instrucción Principal:** No deben ser las típicas categorías obvias como "Animales" u "Objetos". Busca temas más creativos y específicos. Ejemplos de buenas ideas: "Cosas que encuentras en la playa", "Superhéroes y Villanos", "Marcas Famosas", "Instrumentos Musicales", "Deportes Olímpicos".
{{/if}}
{{else}}
- **Instrucción Principal:** No deben ser las típicas categorías obvias como "Animales" u "Objetos". Busca temas más creativos y específicos. Ejemplos de buenas ideas: "Cosas que encuentras en la playa", "Superhéroes y Villanos", "Marcas Famosas", "Instrumentos Musicales", "Deportes Olímpicos".
{{/if}}

**Reglas Críticas Universales:**
1.  **Idioma Español Exclusivamente:** Todas las categorías y palabras DEBEN estar en español.
2.  **Exactamente 5 Categorías:** La respuesta debe contener un array con precisamente 5 objetos de categoría.
3.  **Temas Diversos dentro del Contexto:** Las 5 categorías deben ser diferentes entre sí y estimulantes, respetando siempre el contexto temático si fue proporcionado.
4.  **Palabras de Calidad (15-20 por categoría):** Para cada categoría, genera una lista de entre 15 y 20 palabras o frases cortas.
5.  **FACILIDAD DE DIBUJO (¡MUY IMPORTANTE!):** Las palabras deben ser conceptos visuales, comunes y reconocibles que una persona promedio pueda dibujar y adivinar. Prioriza sustantivos concretos y acciones claras. Evita conceptos abstractos o difíciles de representar gráficamente.
6.  **Audiencia Adecuada:** Todas las palabras deben ser aptas para el público definido por el contexto (general, infantil o familiar/religioso).

Genera ahora el paquete de 5 categorías, asegurándote de seguir TODAS las reglas.`,
  config: {
    temperature: 0.8, // Aumenta la temperatura para obtener categorías más creativas.
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
