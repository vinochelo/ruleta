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
  imageDataUri: z
    .string()
    .describe(
      "A data URI of the generated image. Format: 'data:<mimetype>;base64,<encoded_data>'. Can be an empty string if generation fails."
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
    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Crea una imagen visualmente atractiva para la palabra: '${input.word}'. El estilo debe ser divertido y caricaturesco, ideal para un juego de Pictionary. La imagen debe ser colorida, clara y fácil de adivinar, pero no fotorrealista. CRÍTICO: La imagen generada NO debe contener ningún texto, letra o número; solo la representación visual de la palabra.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (media?.url) {
        return {imageDataUri: media.url};
      }
    } catch (error) {
      console.error('Image generation failed:', error);
    }

    // Fallback to empty string on failure
    return {imageDataUri: ''};
  }
);
