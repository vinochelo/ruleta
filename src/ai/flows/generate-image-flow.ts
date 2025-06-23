
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

// A robust helper to generate a single image. Returns an object with the URL or an error.
async function generateSingleImage(prompt: string, context: string): Promise<{ imageUrl: string | null; error: string | null }> {
  console.log(`[${context}] Generating image with prompt: "${prompt.substring(0, 50)}..."`);
  try {
    const result = await ai.generate({
      model: geminiImage,
      prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        // Added safety settings to be less restrictive, as Pictionary words should be generally safe.
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
        ],
      },
    });

    console.log(`[${context}] Raw generation result:`, JSON.stringify(result, null, 2));

    const { media, finishReason, usage } = result;
    console.log(`[${context}] Image Generation Usage:`, usage);

    if (media?.url) {
      console.log(`[${context}] Successfully generated image. Finish reason: ${finishReason}`);
      return { imageUrl: media.url, error: null };
    }
    
    // If we are here, media.url is null.
    let reasonText = `La IA no devolvió una imagen. Razón del final: ${finishReason || 'desconocida'}.`;
    if (finishReason === 'safety') {
      reasonText = "La imagen no se generó porque la solicitud fue bloqueada por los filtros de seguridad de la IA.";
    } else if (finishReason === 'recitation') {
      reasonText = "La solicitud fue bloqueada por motivos de recitación (posible plagio).";
    } else if (finishReason === 'quota') {
      reasonText = "Has superado la cuota de uso gratuito de la API. Por favor, espera a que se reinicie o habilita la facturación en tu proyecto de Google Cloud.";
    }

    console.warn(`[${context}] Image generation finished but returned no media URL. ${reasonText}`);
    return { imageUrl: null, error: reasonText };

  } catch (error: any) {
    console.error(`[${context}] Image generation request FAILED.`, JSON.stringify(error, null, 2));
    
    let detailedErrorMessage = "Error desconocido al contactar el servicio de IA.";
    if (error?.message) {
        const lowerCaseMessage = error.message.toLowerCase();
        if (lowerCaseMessage.includes('api key not valid')) {
            detailedErrorMessage = "La clave de API de Google no es válida. Por favor, verifica que la has copiado correctamente en el archivo .env.";
        } else if (lowerCaseMessage.includes('permission denied')) {
            detailedErrorMessage = "Permiso denegado. Asegúrate de que la API de Vertex AI (o la API de Gemini) esté habilitada en tu proyecto de Google Cloud.";
        } else if (lowerCaseMessage.includes('quota') || lowerCaseMessage.includes('429')) {
            detailedErrorMessage = "Has superado la cuota de uso gratuito de la API. Por favor, espera a que se reinicie o habilita la facturación en tu proyecto de Google Cloud.";
        }
        else {
             // Include the raw error message for better debugging.
            detailedErrorMessage = `La IA devolvió un error: ${error.message}`;
        }
    } else {
        // If there's no message, stringify the whole error object.
        detailedErrorMessage = `Ocurrió un error inesperado. Detalles: ${JSON.stringify(error)}`;
    }
    
    const finalError = `La solicitud a la IA falló. ${detailedErrorMessage}`;
    return { imageUrl: null, error: finalError };
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
    
    const prompt = `A very simple, minimalist, black and white icon for a pictionary game. The icon should represent: '${input.word}'. CRITICAL: The image must contain NO text, letters, or numbers. Only the drawing.`;
    
    const { imageUrl, error } = await generateSingleImage(prompt, "QuickImage");
    
    if (imageUrl) {
        console.log(`Quick image flow finished for: "${input.word}". Success: true`);
        return { imageDataUri: imageUrl, error: null };
    } else {
        const finalError = error || "Ocurrió un error inesperado en la generación de la imagen.";
        console.log(`Quick image flow finished for: "${input.word}". Success: false. Error: ${finalError}`);
        return { imageDataUri: null, error: finalError };
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

    const successfulUris = results
      .filter(res => res.imageUrl)
      .map(res => res.imageUrl as string);

    console.log(`Artistic image flow finished for "${input.word}". Generated ${successfulUris.length} of ${prompts.length} requested images.`);

    // For artistic images, we don't return an error to the client,
    // as it's a non-critical background task. We just log it.
    results.forEach(res => {
        if (res.error) {
            console.warn(`[ArtisticImage] Sub-task failed: ${res.error}`);
        }
    });

    return { imageDataUris: successfulUris, error: null };
  }
);
