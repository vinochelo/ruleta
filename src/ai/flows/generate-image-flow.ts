
'use server';

import { ai, geminiImage } from '@/ai/genkit';
import { z } from 'zod';

function ensureApiKey() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("La clave API de Google no está configurada. Obtén una en https://aistudio.google.com/app/apikey y añádela como GOOGLE_API_KEY a tu archivo .env");
  }
}

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
    try {
      ensureApiKey();
      const prompt = `Un icono muy simple, minimalista, en blanco y negro para un juego de Pictionary. El icono debe representar: '${input.word}'. CRÍTICAMENTE IMPORTANTE: La imagen no debe contener texto, letras ni números. Solo el dibujo.`;
      
      const { imageUrl, error } = await generateSingleImage(prompt);
      
      if (imageUrl) {
          return { imageDataUri: imageUrl, error: null };
      } else {
          const finalError = error || "Ocurrió un error inesperado en la generación de la imagen.";
          return { imageDataUri: null, error: finalError };
      }
    } catch (e: any) {
      return { imageDataUri: null, error: e.message };
    }
  }
);


// --- Flow 2: Detailed Image Generation ---

const DetailedImageInputSchema = z.object({
  word: z.string().describe('The word to generate a detailed image for.'),
});
export type DetailedImageInput = z.infer<typeof DetailedImageInputSchema>;

const DetailedImageOutputSchema = z.object({
  imageDataUri: z.string().nullable().describe("A data URI for the generated image. Null if generation fails. Format: 'data:<mimetype>;base64,<encoded_data>'."),
  error: z.string().nullable().describe("An error message if image generation failed."),
});
export type DetailedImageOutput = z.infer<typeof DetailedImageOutputSchema>;


export async function generateDetailedImage(
  input: DetailedImageInput
): Promise<DetailedImageOutput> {
  return generateDetailedImageFlow(input);
}

const generateDetailedImageFlow = ai.defineFlow(
  {
    name: 'generateDetailedImageFlow',
    inputSchema: DetailedImageInputSchema,
    outputSchema: DetailedImageOutputSchema,
  },
  async (input) => {
    try {
      ensureApiKey();
      // This prompt is different: it asks for a detailed, colorful, photorealistic image.
      const prompt = `Una imagen detallada, colorida y fotorrealista para un juego de adivinanzas. La imagen debe representar claramente: '${input.word}'. La imagen debe ser visualmente rica y descriptiva, sin incluir texto, letras o números.`;
      
      const { imageUrl, error } = await generateSingleImage(prompt);
      
      if (imageUrl) {
          return { imageDataUri: imageUrl, error: null };
      } else {
          const finalError = error || "Ocurrió un error inesperado en la generación de la imagen detallada.";
          return { imageDataUri: null, error: finalError };
      }
    } catch (e: any) {
      return { imageDataUri: null, error: e.message };
    }
  }
);
