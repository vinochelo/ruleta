
'use server';
/**
 * @fileOverview An AI flow to generate an image for a given Pictionary word.
 * This file has been re-architected for maximum reliability.
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


// A robust helper function to generate a single image and handle failures.
async function generateSingleImage(prompt: string, attempt: number, type: 'reference' | 'artistic'): Promise<string | null> {
    try {
        console.log(`Attempt #${attempt} for ${type} image: "${prompt}"`);
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: prompt,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });
        
        if (media?.url) {
            console.log(`Successfully generated ${type} image on attempt #${attempt}.`);
            return media.url;
        }
        
        console.warn(`Image generation succeeded for ${type} on attempt #${attempt} but returned no media URL.`);
        return null;

    } catch (error) {
        console.error(`Image generation failed for ${type} on attempt #${attempt}.`, error);
        return null;
    }
}


const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    const referenceImages: string[] = [];
    let artisticImage: string | null = null;

    const referencePrompt = `Estilo de dibujos animados sencillo y colorido para un juego de Pictionary: '${input.word}'. REGLA CRÍTICA Y OBLIGATORIA: La imagen debe ser 100% visual y no debe contener NINGÚN tipo de texto, letras o números.`;
    const artisticPrompt = `Crea una imagen que sea solamente el texto artístico de la palabra: '${input.word}'. Usa una tipografía muy creativa y llamativa, como de un videojuego o película. Sorpréndeme con un diseño diferente cada vez.`;

    // 1. Generate Reference Images Sequentially for stability
    console.log(`Starting reference image generation for "${input.word}"...`);
    for (let i = 0; i < 4; i++) {
        const imageUrl = await generateSingleImage(referencePrompt, i + 1, 'reference');
        if (imageUrl) {
            referenceImages.push(imageUrl);
        } else {
            console.log(`Skipping failed reference image #${i + 1}.`);
        }
    }

    // 2. Generate Artistic Text Image
    console.log(`Starting artistic text image generation for "${input.word}"...`);
    artisticImage = await generateSingleImage(artisticPrompt, 1, 'artistic');
    
    // 3. Assemble the final array
    // The UI expects reference images first, then the artistic one at the end.
    const finalImageDataUris = [...referenceImages];
    if (artisticImage) {
        finalImageDataUris.push(artisticImage);
    } else {
        console.warn(`Could not generate the artistic text image for "${input.word}".`);
    }
    
    console.log(`Image generation flow finished. Generated ${finalImageDataUris.length} images in total.`);

    return { imageDataUris: finalImageDataUris };
  }
);
