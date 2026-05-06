import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt } from "./prompts";

export const getGeminiResponse = async (
  messages: { role: string; parts: { text: string }[] }[],
  userMessage: string,
  country: string | null = "Global"
) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: buildSystemPrompt(country),
  });

  const chat = model.startChat({
    history: messages,
  });

  const result = await chat.sendMessage(userMessage);
  const responseText = result.response.text();

  try {
    const rawJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(rawJson);
    return parsed;
  } catch (error) {
    console.error("Failed to parse Gemini response as JSON:", responseText);
    return {
      response: responseText,
      confidence: 50,
      disclaimer: "I am an AI, not a licensed attorney. Please consult with legal counsel.",
    };
  }
};