
'use server';
/**
 * @fileOverview A robust AI flow to generate images for a Pictionary game.
 * This flow is designed for maximum reliability by generating images in parallel.
 *
 * - generateImageForWord - The primary function to generate images.
 * - GenerateImageInput - Input schema.
 * - GenerateImageOutput - Output schema.
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
    console.log(`Starting new robust image generation for: "${input.word}"`);
    
    // Prompts for 4 different artistic reference images (NO TEXT)
    const referencePrompts = [
        `A very simple, clear, black and white line drawing of '${input.word}' for a Pictionary game. ABSOLUTE RULE: The image must not contain any text, letters, or numbers.`,
        `A simple, colorful cartoon drawing of '${input.word}' for a Pictionary game. ABSOLUTE RULE: The image must not contain any text, letters, or numbers.`,
        `A minimalist, easy-to-guess icon representing '${input.word}'. For a drawing game. ABSOLUTE RULE: The image must not contain any text, letters, or numbers.`,
        `A simple pencil sketch of '${input.word}'. For a Pictionary game. ABSOLUTE RULE: The image must not contain any text, letters, or numbers.`,
    ];

    // Prompt for the final artistic text image
    const artisticTextPrompt = `Create a visually stunning, artistic text design of the word: '${input.word}'. Use a creative, eye-catching font like one from a video game or movie poster. Surprise me with a unique design. The background should be clean.`;

    // Generate reference images in parallel for speed
    const referencePromises = referencePrompts.map(prompt => generateSingleImage(prompt));
    
    // Generate artistic text image at the same time
    const artisticTextPromise = generateSingleImage(artisticTextPrompt);
    
    // Wait for all promises to settle (i.e., either succeed or fail)
    const referenceResults = await Promise.allSettled(referencePromises);

    // Filter out failed promises and get the successful image URIs
    const referenceImageDataUris = referenceResults
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => (result as Promise.FulfilledResult<string>).value);
    
    console.log(`Successfully generated ${referenceImageDataUris.length} reference images.`);

    // Wait for the artistic text image
    const artisticImageResult = await artisticTextPromise;

    // Assemble the final array, with the artistic image at the end
    const finalImageDataUris = [...referenceImageDataUris];
    if (artisticImageResult) {
        finalImageDataUris.push(artisticImageResult);
        console.log(`Successfully generated artistic text image.`);
    } else {
        console.warn(`Could not generate the artistic text image for "${input.word}".`);
    }
    
    console.log(`Image generation flow finished. Generated ${finalImageDataUris.length} images in total.`);

    return { imageDataUris: finalImageDataUris };
  }
);
