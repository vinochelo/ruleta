
'use server';
/**
 * @fileOverview AI flows for generating images for the Pictionary game.
 * This file provides two distinct flows: one for a quick, basic image,
 * and another for a single, more elaborate image.
 *
 * - generateQuickImage - Generates a single, simple line drawing for speed.
 * - generateArtisticImages - Generates a single, highly-detailed artistic image.
 */

import { ai, geminiImage } from '@/ai/genkit';
import { z } from 'zod';

// --- Common Helper Function ---

// A robust helper to generate a single image. Returns an object with the URL or an error.
async function generateSingleImage(prompt: string): Promise<{ imageUrl: string | null; error: string | null }> {
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

    const { media, finishReason } = result;

    if (media?.url) {
      return { imageUrl: media.url, error: null };
    }
    
    let reasonText = `La IA no devolvió una imagen. Razón del final: ${finishReason || 'desconocida'}.`;
    if (finishReason === 'safety') {
      reasonText = "La imagen no se generó porque la solicitud fue bloqueada por los filtros de seguridad de la IA.";
    } else if (finishReason === 'recitation') {
      reasonText = "La solicitud fue bloqueada por motivos de recitación (posible plagio).";
    } else if (finishReason === 'quota') {
      reasonText = "Has superado la cuota de uso gratuito de la API. Por favor, espera a que se reinicie o habilita la facturación en tu proyecto de Google Cloud.";
    }
    
    return { imageUrl: null, error: reasonText };

  } catch (error: any) {
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
      return { imageDataUri: null, error: errorMsg };
    }
    
    const prompt = `A very simple, minimalist, black and white icon for a pictionary game. The icon should represent: '${input.word}'. CRITICAL: The image must contain NO text, letters, or numbers. Only the drawing.`;
    
    const { imageUrl, error } = await generateSingleImage(prompt);
    
    if (imageUrl) {
        return { imageDataUri: imageUrl, error: null };
    } else {
        const finalError = error || "Ocurrió un error inesperado en la generación de la imagen.";
        return { imageDataUri: null, error: finalError };
    }
  }
);


// --- Flow 2: Elaborate Image Generation ---

const ArtisticImagesInputSchema = z.object({
  word: z.string().describe('The word to generate an image for.'),
});
export type ArtisticImagesInput = z.infer<typeof ArtisticImagesInputSchema>;

const ArtisticImagesOutputSchema = z.object({
  imageDataUri: z
    .string()
    .nullable()
    .describe(
      "A data URI for the generated elaborate image. Null if generation fails. Format: 'data:<mimetype>;base64,<encoded_data>'."
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
    const prompt = `A highly detailed, photorealistic, and artistic image representing '${input.word}'. The image should be visually stunning and suitable for a game. CRITICAL: The image must not contain any text, letters, or numbers whatsoever. Focus solely on the visual representation of the concept.`;

    const { imageUrl, error } = await generateSingleImage(prompt);
    
    if (imageUrl) {
        return { imageDataUri: imageUrl, error: null };
    } else {
        const finalError = error || "Ocurrió un error inesperado en la generación de la imagen elaborada.";
        return { imageDataUri: null, error: finalError };
    }
  }
);
