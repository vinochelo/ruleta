
'use server';
/**
 * @fileOverview AI flows for generating images for the Pictionary game.
 * This file provides two distinct flows: one for a quick, basic image,
 * and another for a set of more elaborate, artistic images.
 *
 * - generateQuickImage - Generates a single, simple line drawing for speed.
 * - generateArtisticImages - Generates a variety of artistic images in parallel.
 */

import { ai, geminiImage } from '@/ai/genkit';
import { z } from 'zod';

// --- Common Helper Function ---

// A robust helper to generate a single image. It returns null on failure.
async function generateSingleImage(prompt: string, context: string): Promise<string | null> {
  console.log(`[${context}] Generating image with prompt: "${prompt.substring(0, 50)}..."`);
  try {
    const result = await ai.generate({
      model: geminiImage,
      prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    console.log(`[${context}] Raw generation result:`, JSON.stringify(result, null, 2));

    const { media, finishReason, usage } = result;
    console.log(`[${context}] Image Generation Usage:`, usage);

    if (media?.url) {
      console.log(`[${context}] Successfully generated image. Finish reason: ${finishReason}`);
      return media.url;
    }

    console.warn(`[${context}] Image generation finished with reason '${finishReason}' but returned no media URL.`);
    if (finishReason === 'safety') {
        console.error(`[${context}] Image generation was blocked due to safety settings.`);
    }
    return null;

  } catch (error) {
    console.error(`[${context}] Image generation request FAILED.`, error);
    if (error instanceof Error && error.message.includes('quota')) {
        console.error(`[${context}] Potential quota limit hit.`);
    }
    return null;
  }
}


// --- Flow 1: Quick Image Generation ---

const QuickImageInputSchema = z.object({
  word: z.string().describe('The word to generate an image for.'),
});
export type QuickImageInput = z.infer<typeof QuickImageInputSchema>;

const QuickImageOutputSchema = z.object({
  imageDataUri: z.string().nullable().describe("A data URI for the generated image. Null if generation fails. Format: 'data:<mimetype>;base64,<encoded_data>'."),
  error: z.string().nullable().describe("An error message if image generation failed."),
});
export type QuickImageOutput = z.infer<typeof QuickImageOutputSchema>;

export async function generateQuickImage(
  input: QuickImageInput
): Promise<QuickImageOutput> {
  return generateQuickImageFlow(input);
}

const generateQuickImageFlow = ai.defineFlow(
  {
    name: 'generateQuickImageFlow',
    inputSchema: QuickImageInputSchema,
    outputSchema: QuickImageOutputSchema,
  },
  async (input) => {
    if (!process.env.GOOGLE_API_KEY) {
      const errorMsg = "La variable de entorno GOOGLE_API_KEY no está configurada. Por favor, añádela a un archivo .env en la raíz de tu proyecto.";
      console.error(`FATAL: ${errorMsg}`);
      return { imageDataUri: null, error: errorMsg };
    }
    
    const prompt = `A simple icon of: '${input.word}'. Visual depiction only, no words.`;
    
    const imageUrl = await generateSingleImage(prompt, "QuickImage");
    
    if (imageUrl) {
        console.log(`Quick image flow finished for: "${input.word}". Success: true`);
        return { imageDataUri: imageUrl, error: null };
    } else {
        const errorMsg = "La generación de la imagen falló. Revisa los registros del servidor para más detalles (posibles problemas de cuota o filtros de seguridad).";
        console.log(`Quick image flow finished for: "${input.word}". Success: false`);
        return { imageDataUri: null, error: errorMsg };
    }
  }
);


// --- Flow 2: Artistic Images Generation ---

const ArtisticImagesInputSchema = z.object({
  word: z.string().describe('The word to generate images for.'),
});
export type ArtisticImagesInput = z.infer<typeof ArtisticImagesInputSchema>;

const ArtisticImagesOutputSchema = z.object({
  imageDataUris: z
    .array(z.string())
    .describe(
      "A list of data URIs for the generated images. Can be an empty array if generation fails. Format: 'data:<mimetype>;base64,<encoded_data>'. The last image is the artistic text."
    ),
  error: z.string().nullable().describe("An error message if image generation failed."),
});
export type ArtisticImagesOutput = z.infer<typeof ArtisticImagesOutputSchema>;


export async function generateArtisticImages(
  input: ArtisticImagesInput
): Promise<ArtisticImagesOutput> {
  return generateArtisticImagesFlow(input);
}

const generateArtisticImagesFlow = ai.defineFlow(
  {
    name: 'generateArtisticImagesFlow',
    inputSchema: ArtisticImagesInputSchema,
    outputSchema: ArtisticImagesOutputSchema,
  },
  async (input) => {
    console.log(`Starting ARTISTIC image generation for: "${input.word}"`);
    
    const prompts = [
      `A colorful cartoon illustration of '${input.word}'. No words or letters.`,
      `A photorealistic image of '${input.word}'. No words or letters.`,
      `A simple pencil sketch of '${input.word}'. No words or letters.`,
      `A stunning, artistic text design of the single word: '${input.word}'.`,
    ];

    const imagePromises = prompts.map((prompt, i) => generateSingleImage(prompt, `ArtisticImage-${i}`));
    const results = await Promise.all(imagePromises);

    const successfulUris = results.filter((uri): uri is string => !!uri);

    console.log(`Artistic image flow finished for "${input.word}". Generated ${successfulUris.length} of ${prompts.length} requested images.`);

    return { imageDataUris: successfulUris, error: null };
  }
);
