
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
    const imageDataUris: string[] = [];

    try {
      // 1. Generate Reference Images in parallel
      const referenceImagePromises = Array.from({length: 4}).map(() => {
        return ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: `Imagen para un juego de Pictionary de la palabra: '${input.word}'. Estilo: caricatura sencilla, colorida y muy fácil de adivinar. REGLA CRÍTICA Y OBLIGATORIA: La imagen debe ser 100% visual y no debe contener NINGÚN tipo de texto, letras o números.`,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });
      });

      const referenceResults = await Promise.allSettled(referenceImagePromises);

      referenceResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.media?.url) {
          imageDataUris.push(result.value.media.url);
        } else if (result.status === 'rejected') {
          console.error("Reference image generation promise failed:", result.reason);
        }
      });

      // 2. Generate Artistic Text Image separately for robustness
      try {
        const artisticTextResult = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: `Crea una imagen que sea solamente el texto artístico de la palabra: '${input.word}'. Usa una tipografía muy creativa y llamativa, como de un videojuego o película. Sorpréndeme con un diseño diferente cada vez.`,
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
        });
        if (artisticTextResult.media?.url) {
          // It's important to push this one last, as the UI expects it at the end.
          imageDataUris.push(artisticTextResult.media.url);
        }
      } catch(error) {
         console.error("Artistic text image generation failed:", error);
      }

      // The calling component expects reference images first, then the artistic one.
      // The current order of pushing to the array ensures this.
      return {imageDataUris};

    } catch (error) {
      console.error('Image generation flow failed:', error);
      return {imageDataUris: []};
    }
  }
);
