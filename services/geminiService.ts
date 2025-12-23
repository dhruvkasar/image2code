import { GoogleGenAI } from "@google/genai";
import { GenerationResult } from "../types";

/**
 * Initializes the Gemini Client lazily.
 * This prevents the app from crashing on load if the API key is not immediately available.
 */
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Converts a File object to a Base64 string suitable for the Gemini API.
 */
const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Generates React code from a wireframe image.
 */
export const generateCodeFromImage = async (file: File): Promise<GenerationResult> => {
  try {
    const imagePart = await fileToPart(file);
    const ai = getAiClient();

    // Using Gemini 3 Pro for high-reasoning coding capabilities
    const model = "gemini-3-pro-preview";

    const systemPrompt = `
      You are an expert Frontend Engineer and UI/UX Designer known for your "Pixel-Perfect" implementation skills.
      
      Your task: Analyze the provided wireframe/screenshot and write the EXACT React code to reproduce it.
      
      ACCURACY GOAL: 95% match or higher.
      
      1. **Visual Analysis (Mental OCR):**
         - Estimate the exact font sizes (e.g., "This header looks like text-4xl").
         - Estimate exact padding/margin (e.g., "There is about 24px (p-6) padding here").
         - Identify the specific shades of gray or colors used. Use Tailwind arbitrary values (e.g., bg-[#1a2b3c]) if standard palette doesn't match.
         - Observe border radius, shadow depth, and element alignment strictly.

      2. **Strict Technical Requirements:**
         - **Framework:** React (Functional Components) + Tailwind CSS.
         - **Layout:** The component MUST be responsive. If it looks like a full-page app, use 'min-h-screen w-full'.
         - **Component Name:** You MUST name the component "App".
         - **Icons:** **CRITICAL:** Do NOT import icons. You MUST write the SVG code inline (e.g., <svg ...><path ... /></svg>). Use simple, standard SVG paths for common icons (menu, user, arrow, etc.).
         - **Images:** Use placeholder images: 'https://picsum.photos/id/{1-100}/800/600'.
         - **Export:** The file must export a single functional component as the **default export**.
         
      3. **Content & Text:**
         - Copy the visible text from the image exactly. Do not use Lorem Ipsum unless the wireframe itself uses Lorem Ipsum.

      4. **Environment:**
         - Code will run in a browser with Tailwind CDN.
         - No external CSS files.
         - No external npm packages (other than React/ReactDOM).

      Output ONLY the raw code string. No Markdown formatting (\`\`\`). No introductory text.
    `;

    const userPrompt = "Recreate this website design exactly as seen in the image.";

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [imagePart, { text: userPrompt }],
      },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0, // Zero temperature for maximum determinism and accuracy
        thinkingConfig: { thinkingBudget: 8192 } // Increased thinking budget for deeper layout analysis
      }
    });

    const text = response.text || "";
    
    // Cleanup code if model adds markdown despite instructions
    const cleanCode = text.replace(/```tsx/g, '').replace(/```javascript/g, '').replace(/```/g, '').trim();

    return {
      code: cleanCode
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate code from the wireframe. Please try again.");
  }
};

/**
 * Refines existing React code based on user instructions.
 */
export const refineCode = async (currentCode: string, instruction: string): Promise<GenerationResult> => {
  try {
    const ai = getAiClient();
    const model = "gemini-3-pro-preview";

    const systemPrompt = `
      You are an expert React Developer.
      
      Your task: Modify the provided React component code based on the User's instruction.
      
      Guidelines:
      1. **Functionality First:** Implement the requested logic (e.g., state management, event handlers, API mocks).
      2. **Preserve Design:** Do NOT change the visual design (Tailwind classes) unless explicitly asked.
      3. **Component Name:** Keep the component named "App".
      4. **Full Code:** Return the FULLY FUNCTIONAL, complete component code. Do not return diffs or snippets.
      5. **Environment:** Same as before - React + Tailwind CDN. No external npm packages. Inline SVGs.
      6. **Syntax:** Ensure the code remains a valid functional component with a default export.
      
      Output ONLY the raw code string. No Markdown.
    `;

    const prompt = `
      CURRENT CODE:
      ${currentCode}

      USER INSTRUCTION:
      ${instruction}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // Slightly higher for creative logic implementation
      }
    });

    const text = response.text || "";
    const cleanCode = text.replace(/```tsx/g, '').replace(/```javascript/g, '').replace(/```/g, '').trim();

    return {
      code: cleanCode
    };

  } catch (error) {
    console.error("Gemini Refinement Error:", error);
    throw new Error("Failed to refine the code. Please try again.");
  }
};