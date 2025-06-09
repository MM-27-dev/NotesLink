// import { GoogleGenerativeAI } from "@google/generative-ai";

// // Make sure your .env has: VITE_GEMINI_API_KEY=your_key
// const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// if (!API_KEY) {
//   console.error("❌ Gemini API key not found in .env");
// }

// const genAI = new GoogleGenerativeAI(API_KEY);

// const model = genAI.getGenerativeModel({
//   model: "gemini-2.0-flash", // Changed to gemini-2.0-flash as per instructions
// });

// export const getGeminiResponse = async (prompt) => {
//   try {
//     const result = await model.generateContent(prompt);
//     const response = result.response.text();
//     return response;
//   } catch (error) {
//     console.error("Gemini API error:", error);
//     return "⚠️ Failed to get response from Gemini.";
//   }
// };



// geminiService.js

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ Gemini API key not found in .env");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash", // Or 'gemini-1.5-flash-latest' if you want a more capable model
});

let chat = null; // Persist the chat session

export const getGeminiResponse = async (
  promptContent,
  conversationHistory = []
) => {
  try {
    if (!chat) {
      const filteredHistory = conversationHistory.filter((msg, index) => {
        if (index === 0 && msg.sender !== "user") {
          return false;
        }
        return true;
      });

      chat = model.startChat({
        history: filteredHistory.map((msg) => {
          // Map history, handling potential file content if you stored it in messages state
          // For simplicity, we'll assume past messages in history are primarily text.
          // If you need to send *previous* image attachments to Gemini, you'd need
          // to store their base64 data in the `messages` state and map them here.
          return {
            role: msg.sender === "user" ? "user" : "model",
            // If msg.text is plain text or the primary part
            parts: [{ text: msg.text }],
          };
        }),
        generationConfig: {
          maxOutputTokens: 500,
        },
      });
    }

    // Determine if promptContent is a simple string or an array of parts
    const partsToSend = Array.isArray(promptContent)
      ? promptContent
      : [{ text: promptContent }];

    const result = await chat.sendMessage(partsToSend); // Send the prepared parts
    const response = result.response.text();
    return response;
  } catch (error) {
    console.error("Gemini API error:", error);
    chat = null; // Reset chat on error
    return "⚠️ Failed to get response from Gemini.";
  }
};

export const resetGeminiChat = () => {
  chat = null;
};