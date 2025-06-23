
'use server';
/**
 * @fileOverview AI flows for generating images for the Pictionary game.
 * This file provides two distinct flows: one for a quick, basic image,
 * and another for a set of more elaborate, artistic images.
 *
 * - generateQuickImage - Generates a single, simple line drawing for speed.
 * - generateArtisticImages - Generates a variety of artistic images in parallel.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// --- Common Helper Function ---

// A robust helper to generate a single image. It returns null on failure.
async function generateSingleImage(prompt: string): Promise<string | null> {
    try {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: prompt,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });

        if (media?.url) {
            console.log(`Successfully generated image for prompt: "${prompt.substring(0, 50)}..."`);
            return media.url;
        }

        console.warn(`Image generation succeeded but returned no media URL for prompt: "${prompt.substring(0, 50)}..."`);
        return null;

    } catch (error) {
        console.error(`Image generation failed for prompt: "${prompt.substring(0, 50)}..."`, error);
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
    console.log(`Starting QUICK image generation for: "${input.word}"`);
    const prompt = `A very simple, minimalist, black and white line drawing of ONLY '${input.word}'. The background must be pure white. The drawing must be clear and easily guessable for a Pictionary game. CRITICAL RULE: Absolutely no text, letters, or numbers are allowed in the image.`;
    
    const imageUrl = await generateSingleImage(prompt);
    
    console.log(`Quick image generation finished for: "${input.word}". Success: ${!!imageUrl}`);
    return { imageDataUri: imageUrl };
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
    console.log(`Starting ARTISTIC (parallel) image generation for: "${input.word}"`);

    const prompts = [
      // Reference Images
      `A simple, colorful cartoon illustration of ONLY '${input.word}'. The style should be bold and easy to recognize. The background must be a single solid color. CRITICAL RULE: Absolutely no text, letters, or numbers are allowed in the image.`,
      `A photorealistic image of ONLY '${input.word}'. The object should be centered and clearly visible. CRITICAL RULE: Absolutely no text, letters, or numbers are allowed in the image.`,
      `A simple pencil sketch of ONLY '${input.word}' on a white paper background. The sketch should be clear and focused on the object for a Pictionary game. CRITICAL RULE: Absolutely no text, letters, or numbers are allowed in the image.`,
      // Artistic Text Image (LAST)
      `Create a visually stunning, artistic text design of the word: '${input.word}'. Use a creative, eye-catching font like one from a video game or movie poster. Surprise me with a unique design. The background should be clean.`,
    ];

    const imagePromises = prompts.map(prompt => generateSingleImage(prompt));
    const results = await Promise.allSettled(imagePromises);

    const successfulUris = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => (result as PromiseFulfilledResult<string>).value);

    console.log(`Artistic image generation flow finished for "${input.word}". Generated ${successfulUris.length} of ${prompts.length} requested images.`);

    return { imageDataUris: successfulUris };
  }
);
