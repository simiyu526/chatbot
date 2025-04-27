import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // React uses VITE_ prefix for env vars

export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// A helper function to send prompts
export async function generateContent(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash", // Faster and cheaper model
    contents: prompt,
  });

  return response.text; // Return the text directly
}
