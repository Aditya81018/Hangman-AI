import { GoogleGenAI } from "@google/genai/web";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface HangmanWordObject {
  category: string;
  word: string;
  hint: string;
}

/**
 * Generates 6 new, highly personalized custom instruction suggestions by closely
 * aligning them with the user's historical interests, while maintaining broad scope
 * and the fun Theme + Hint Modification structure.
 * * * @param history A string array of past instructions used by the user.
 * @returns A promise that resolves to a string array of 6 new instruction suggestions.
 */
export async function suggestCustomInstructions(
  history: string[]
): Promise<string[]> {
  const model = "gemini-2.5-flash-lite";

  // Create a structured list of the user's past prompts for the AI to analyze.
  const historyText = history.map((h, i) => `${i + 1}. "${h}"`).join("\n");

  // --- REVISED SYSTEM INSTRUCTION: Maximum Personalization ---
  const systemInstruction = `You are a dedicated content curator focused on user retention. Your task is to first **analyze the user's history** to infer their top 2-3 general interest categories (e.g., 'Fantasy', 'Science', '80s Pop Culture').

  Then, generate **6 new, highly personalized, and unique instruction suggestions**.

  **Core Directive:** All 6 suggestions MUST be related to the user's inferred interests. Generate ideas that approach their favorite themes from new, varied angles to keep the game fresh, but do not introduce unrelated themes.

  **Structure and Tone Constraints:**
  1. **Theme Scope:** Each theme must be broad enough to generate a large variety of words (e.g., 'Mythology' is better than 'One Specific Book Title').
  2. **Modification:** Each suggestion must combine the theme with a simple, fun hint modification (e.g., tone, style, or perspective).
  3. **Language:** Use simple, common language and focus on popular concepts within their interest area.

  **Example Output Structure (Heavily Aligned with User Interest):**
  - **Fantasy creatures from Dungeons & Dragons** (if user likes fantasy) but the hints are just funny definitions.
  - **Scientific terms used in space travel** (if user likes science) but the hints must use alliteration.
  - **Character names from popular 80s movies** (if user likes 80s pop) but the hints must be written as dramatic movie quotes.
  
  **Constraints:**
  1.  Each suggestion must be a single, short, clear sentence or phrase.
  2.  Do not repeat any instructions from the provided history.
  3.  Output ONLY a JSON array of 6 strings, where each string is a new instruction.`;

  // The main prompt provides the necessary context.
  const prompt = `Here is the user's history of past Hangman custom instructions:\n\n${historyText}\n\nAnalyze the user's interests and generate 6 new, highly personalized suggestions based on the instructions above.`;

  // Define the output format using JSON Schema for an array of strings
  const responseSchema = {
    type: "array",
    items: {
      type: "string",
      description:
        "A short, highly personalized instruction for a Hangman word theme with a hint constraint.",
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.85, // Maintained for creative suggestions within constraints
      },
    });

    // Parse the JSON string output
    const jsonString = response.text?.trim()!;
    const suggestions = JSON.parse(jsonString) as string[];

    // Ensure we return exactly 6
    return suggestions.slice(0, 6);
  } catch (error) {
    console.error("Error generating instruction suggestions:", error);
    // Returning a mixed list as a fallback, as we can't infer taste without the API.
    return [
      "Words related to space exploration, hints must be told by an alien.",
      "Common kitchen herbs and spices, hints must be simple rhymes.",
      "Names of popular 90s TV shows, hints must use emojis only.",
      "Types of footwear and shoes, hints must be sarcastic.",
      "Abstract feeling words (e.g., anxiety, joy), hints must be definitions from a child.",
      "Words with lots of vowels, hints must describe a movie plot poorly.",
    ];
  }
}

/**
 * Generates an array of 10 hangman word objects (category, word, hint).
 * * @param instructions A string detailing the type of words to pick (e.g., "words related to space and astronomy").
 * @returns A promise that resolves to an array of 10 HangmanWordObject.
 */
export async function generateHangmanWords(
  instructions: string,
  avoidWordsList: string[]
): Promise<HangmanWordObject[]> {
  const model = "gemini-2.5-flash-lite";

  // Define the output format using JSON Schema
  const responseSchema = {
    type: "array",
    items: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "A short category title for the word.",
        },
        word: {
          type: "string",
          description:
            "The secret word for the hangman game. Can be phrases or few words too. Must only contain alphabets, numbers and spaces, *strictly do not use words that are already used*.",
        },
        hint: {
          type: "string",
          description:
            "You are mischievous, play and misdirect the user. Generate A single, unique, creative, tricky, and clever hint. It must be misleading, suggesting a different word, while still cleverly, subtlety and indirectly hinting at the actual word. The hint shouldn't make the word obvious",
        },
      },
      required: ["category", "word", "hint"],
    },
  };

  // The comprehensive prompt and system instruction
  const systemInstruction = `You are an mischievous expert word game generator. Your task is to generate an array of **10 unique word objects** in the specified JSON format. with each next word getting slightly more difficult. The word already used are ${avoidWordsList.join(
    ", "
  )}.
  
  **Constraints for Each Object:**
  1.  **Word/Category:** Follow the user's specific **instructions** and the given **difficulty level**.
  2.  **Hint:** The hint must be **misleading** (suggesting a decoy word) but **cleverly subtle**, pointing to the actual word. It must be a single, short sentence or phrase. Do not output the decoy word or the actual word in the hint.`;

  const prompt = `Generate 10 words.
  - **Word Theme/Type:** ${instructions}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.9, // High temperature for maximum creativity in word/hint selection
      },
    });

    // The response text is a JSON string, which we must parse
    const jsonString = response.text?.trim()!;
    const json = JSON.parse(jsonString) as HangmanWordObject[];
    json.forEach((obj) => {
      obj.word = obj.word.replace(/[^a-zA-Z0-9\s]/g, "");
    });

    return json;
  } catch (error) {
    console.error("Error generating hangman word batch:", error);
    // Return an empty array or throw an error based on your game's needs
    return [];
  }
}
