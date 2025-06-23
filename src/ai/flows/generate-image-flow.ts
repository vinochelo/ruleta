
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
    const result = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
      },
    });

    const { media, finishReason, usage } = result;

    console.log(`Image Generation Usage for prompt "${prompt.substring(0, 30)}...":`, usage);

    if (media?.url) {
      console.log(`Successfully generated image. Finish reason: ${finishReason}`);
      return media.url;
    }

    // This case is important: generation finished but no image was returned.
    // It's often due to safety filters.
    console.warn(`Image generation finished with reason '${finishReason}' but returned no media URL. Full result:`, JSON.stringify(result, null, 2));
    if (finishReason === 'safety') {
        console.error("Image generation was blocked due to safety settings despite being relaxed. The prompt may have triggered a non-configurable filter.");
    }
    return null;

  } catch (error) {
    console.error(`Image generation request failed for prompt: "${prompt.substring(0, 50)}..."`, error);
    // Checking for specific error types might give clues.
    if (error instanceof Error && error.message.includes('quota')) {
        console.error("Potential quota limit hit for image generation.");
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
    // Simplified prompt for higher reliability
    const prompt = `Simple black and white line drawing of: '${input.word}'. White background. No text or letters.`;
    
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
    // Tweaked prompts for clarity and better results
    const prompts = [
      `A colorful cartoon illustration of '${input.word}'. Bold, simple style for a game. It must be a visual depiction of the concept, not write out the word.`,
      `A photorealistic image of '${input.word}'. The subject is centered and clear. This is for a game, so the image must be a visual depiction of the concept, not the written word.`,
      `A simple pencil sketch of '${input.word}' on a plain white background. The drawing must be clear and focused for a Pictionary game, visually representing the subject.`,
      `A stunning, artistic text design of the word: '${input.word}'. Use a creative, eye-catching font, like from a video game or movie poster, on a clean background.`,
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
