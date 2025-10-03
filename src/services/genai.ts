import { GoogleGenAI } from "@google/genai/web";

const GEMINI_API_KEY = "AIzaSyAMNwOyQXOLo43K88pLTrrqQAOOfTO8Iro";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface HangmanWordObject {
  category: string;
  word: string;
  hint: string;
}

/**
 * Generates a unique, tricky, and clever hinting text for a hangman word.
 * The hint will be designed to be misleading while still subtly pointing to the original word.
 * * @param originalWord The secret word for the hangman game.
 * @returns A promise that resolves to the generated hint text.
 */
export async function generateTrickyHint(
  originalWord: string
): Promise<string> {
  const model = "gemini-2.5-flash";

  // The system instruction sets the AI's role and tone for the entire interaction.
  const systemInstruction = `You are a mischievous AI game master. Your task is to generate a single, tricky, and clever hint for a word. The hint must be:
1. Unique and creative.
2. Misleading: It should strongly suggest another word (the 'decoy word').
3. Cleverly Subtlety: Despite being misleading, it must contain a subtle, indirect, and clever clue to the original word.
4. Concise: The hint must be a single sentence or a very short phrase.
Do not mention the decoy word, and do not reveal the original word. Only output the hint text.`;

  // The prompt provides the necessary data (the word) for the AI to work with.
  const prompt = `The original word is: ${originalWord}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8, // Higher temperature for more creative/less predictable results
      },
    });

    // Extract the text from the response and clean up any potential leading/trailing whitespace
    return response.text?.trim()!;
  } catch (error) {
    console.error("Error generating hangman hint:", error);
    // Return a generic, safe hint in case of API failure
    return `It has ${originalWord.length} letters. Think about the topic of ${originalWord}.`;
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
  const model = "gemini-2.5-flash";

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
          description: "The secret word for the hangman game.",
        },
        hint: {
          type: "string",
          description:
            "You are mischievous, play and misdirect the user. Generate A single, unique, creative, tricky, and clever hint. It must be misleading, suggesting a different word, while still cleverly, subtlety and indirectly hinting at the actual word.",
        },
      },
      required: ["category", "word", "hint"],
    },
  };

  // The comprehensive prompt and system instruction
  const systemInstruction = `You are an mischievous expert word game generator. Your task is to generate an array of **10 unique word objects** in the specified JSON format. with each next word getting slightly more difficult. The word previously given are ${avoidWordsList.join(
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
    return JSON.parse(jsonString) as HangmanWordObject[];
  } catch (error) {
    console.error("Error generating hangman word batch:", error);
    // Return an empty array or throw an error based on your game's needs
    return [];
  }
}
