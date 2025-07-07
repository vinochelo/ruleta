import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const geminiFlash = googleAI.model('gemini-1.5-flash-latest');
export const geminiImage = googleAI.model(
  'gemini-2.0-flash-preview-image-generation'
);

export const ai = genkit({
  plugins: [googleAI()],
  model: geminiFlash,
});
