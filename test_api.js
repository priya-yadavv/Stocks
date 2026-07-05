import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function testKey() {
  console.log("Testing API key: " + process.env.GEMINI_API_KEY.substring(0, 10) + "...");
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Respond with exactly one word: OK.',
    });
    console.log("API Key is VALID! Response:", response.text);
  } catch (error) {
    console.error("API Key check FAILED! Error:", error.message);
  }
}
testKey();
