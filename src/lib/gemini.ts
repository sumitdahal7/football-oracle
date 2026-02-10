import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// We'll initialize the model inside the action to allow for fallback logic if needed,
// but for now let's just export the genAI instance.
export { genAI };
