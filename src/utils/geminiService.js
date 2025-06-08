import { GoogleGenerativeAI } from "@google/generative-ai";

// Make sure your .env has: VITE_GEMINI_API_KEY=your_key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ Gemini API key not found in .env");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash", // Changed to gemini-2.0-flash as per instructions
});

export const getGeminiResponse = async (prompt) => {
  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return response;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "⚠️ Failed to get response from Gemini.";
  }
};
