
'use server';
/**
 * @fileOverview A robust AI flow to generate images for a Pictionary game.
 * This flow is designed for maximum reliability by generating images sequentially.
 *
 * - generateImageForWord - The primary function to generate images.
 * - GenerateImageInput - Input schema.
 * - GenerateImageOutput - Output schema.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateImageInputSchema = z.object({
  word: z.string().describe('The word to generate an image for.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUris: z
    .array(z.string())
    .describe(
      "A list of data URIs for the generated images. The last image is the artistic text. Format: 'data:<mimetype>;base64,<encoded_data>'. Can be an empty array if generation fails."
    ),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImageForWord(
  input: GenerateImageInput
): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

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

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    console.log(`Starting new SEQUENTIAL image generation for: "${input.word}"`);
    
    const allPrompts = [
        // Reference Images (NO TEXT)
        `A simple, minimalist, black and white line drawing of ONLY '${input.word}'. The background must be pure white. The drawing must be clear and easily guessable for a Pictionary game. CRITICAL RULE: Absolutely no text, letters, or numbers are allowed in the image.`,
        `A simple, colorful cartoon illustration of ONLY '${input.word}'. The style should be bold and easy to recognize. The background must be a single solid color. CRITICAL RULE: Absolutely no text, letters, or numbers are allowed in the image.`,
        `A photorealistic image of ONLY '${input.word}'. The object should be centered and clearly visible. CRITICAL RULE: Absolutely no text, letters, or numbers are allowed in the image.`,
        `A simple pencil sketch of ONLY '${input.word}' on a white paper background. The sketch should be clear and focused on the object for a Pictionary game. CRITICAL RULE: Absolutely no text, letters, or numbers are allowed in the image.`,
        // Artistic Text Image (LAST)
        `Create a visually stunning, artistic text design of the word: '${input.word}'. Use a creative, eye-catching font like one from a video game or movie poster. Surprise me with a unique design. The background should be clean.`,
    ];

    const imageDataUris: string[] = [];

    // Generate all images sequentially for maximum stability
    for (const prompt of allPrompts) {
        const imageUrl = await generateSingleImage(prompt);
        if (imageUrl) {
            imageDataUris.push(imageUrl);
        } else {
            // Log that a specific image failed, but continue with the rest
            console.warn(`Skipping a failed image generation for prompt: "${prompt.substring(0, 50)}..."`);
        }
    }
    
    console.log(`Image generation flow finished. Generated ${imageDataUris.length} of ${allPrompts.length} requested images.`);

    return { imageDataUris };
  }
);
