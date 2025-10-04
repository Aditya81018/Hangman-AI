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
 * Generates an array of 10 unique hangman word objects (category, word, hint).
 * @param instructions A string detailing the type of words to pick (e.g., "words related to space and astronomy").
 * @param avoidWordsList An array of words that the model must not use in the generated list.
 * @returns A promise that resolves to an array of 10 unique HangmanWordObject.
 */
export async function generateHangmanWords(
  instructions: string,
  avoidWordsList: string[]
): Promise<HangmanWordObject[]> {
  // Use a capable model for complex, creative, and constrained tasks
  const model = "gemini-2.5-flash-lite";

  // Define the output format using JSON Schema
  const responseSchema = {
    type: "array",
    description: "An array of 10 word objects, increasing in difficulty.",
    items: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "A short category title for the word, matching the theme.",
        },
        word: {
          type: "string",
          description:
            "The secret word for the hangman game. Must only contain alphabets, numbers, and spaces. Strictly avoid all words in the avoidWordsList.",
          // Added pattern to strongly enforce character constraint at the schema level
          pattern: "^[a-zA-Z0-9 ]+$",
        },
        hint: {
          type: "string",
          description:
            "A single, unique, creative, tricky, and clever hint. It must be misleading, suggesting a completely different concept, while still cleverly and subtlety hinting at the actual word. The hint should NOT make the word obvious.",
        },
      },
      required: ["category", "word", "hint"],
      // Use 'additionalProperties: false' to ensure strict adherence to the schema
      additionalProperties: false,
    },
    minItems: 10,
    maxItems: 10,
  };

  // The comprehensive prompt and system instruction
  const systemInstruction = `You are a mischievous expert word game generator. Your task is to generate an array of **exactly 10 unique word objects** in the specified JSON format. Ensure the words are challenging, with each subsequent word being slightly more difficult than the last. The words must relate to the user's instructions.
  
  **STRICT CONSTRAINTS:**
  1. **Uniqueness:** All 10 generated 'word' values must be unique and not present in the 'avoidWordsList'.
  2. **Content:** The 'word' field must *only* contain alphabets, numbers, and spaces. No punctuation or special characters.
  3. **Hint:** The hint must be a **single, short, and misleading sentence/phrase** that suggests a decoy word but subtly links to the actual word. Do not state the decoy or actual word in the hint.`;

  const prompt = `Generate 10 words for a Hangman game.
  - **Word Theme/Type:** ${instructions}
  - **Words to Exclude (avoidWordsList):** ${avoidWordsList.join(", ")}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.85, // Slightly lower temp for better constraint adherence while keeping creativity
      },
    });

    // The response text is guaranteed to be a JSON string by responseMimeType
    const jsonString = response.text?.trim();
    if (!jsonString) {
      throw new Error("Model returned an empty response text.");
    }

    // Parse the JSON. The model's adherence to the schema makes this safe.
    const json = JSON.parse(jsonString) as HangmanWordObject[];

    // Removed the explicit `replace` loop as the 'pattern' in schema and
    // strong system instructions are the primary way to enforce this.
    // If the model fails, we let the structured output validation fail instead of
    // silently modifying the word, which might break the hint's context.

    return json;
  } catch (error) {
    console.error(
      "Error generating hangman word batch. Returning empty array:",
      error
    );
    // Returning an empty array for a graceful failure state
    return [];
  }
}
