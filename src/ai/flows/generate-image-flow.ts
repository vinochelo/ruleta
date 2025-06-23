
'use server';
/**
 * @fileOverview An AI flow to generate an image for a given Pictionary word.
 *
 * - generateImageForWord - A function that handles image generation.
 * - GenerateImageInput - The input type for the generateImageForWord function.
 * - GenerateImageOutput - The return type for the generateImageForWord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  word: z.string().describe('The word to generate an image for.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUris: z
    .array(z.string())
    .describe(
      "A list of data URIs for the generated images. Format: 'data:<mimetype>;base64,<encoded_data>'. Can be an empty array if generation fails."
    ),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImageForWord(
  input: GenerateImageInput
): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    const referenceImagePromises = Array.from({length: 4}).map(() => {
      return ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Crea una imagen de referencia para la palabra: '${input.word}'. El estilo debe ser muy simple, como un boceto o un dibujo animado con líneas claras, ideal para un juego de Pictionary. La velocidad de generación es la máxima prioridad. La imagen debe ser colorida y fácil de adivinar. REGLA CRÍTICA INVIOLABLE: La imagen generada NO DEBE CONTENER NINGÚN TEXTO, LETRA O NÚMERO. Debe ser únicamente una representación visual de la palabra. Ignorar esta regla hace que la imagen sea inútil.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });
    });

    const artisticTextPromise = ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Crea una imagen de texto artística y llamativa para la palabra: '${input.word}'. Usa un estilo de tipografía completamente diferente, creativo y divertido cada vez, como si fuera el título de un juego. ¡No repitas estilos! La palabra debe ser el foco central, claramente legible y el diseño debe ser rápido de generar.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
    });

    try {
      const results = await Promise.allSettled([...referenceImagePromises, artisticTextPromise]);
      const imageDataUris = results
        .filter(
          (result): result is PromiseFulfilledResult<{media?: {url: string}}> =>
            result.status === 'fulfilled' && !!result.value.media?.url
        )
        .map((result) => result.value.media!.url);
        
      // Returns [ref1, ref2, ref3, ref4, artistic]
      return {imageDataUris};
    } catch (error) {
      console.error('Image generation failed:', error);
      return {imageDataUris: []};
    }
  }
);
