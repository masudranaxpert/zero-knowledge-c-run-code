// Note: Use dynamic import to support ESM package in CommonJS extension runtime

/**
 * Uses Gemini API to refactor and improve a given text snippet.
 * @param {string} apiKey Your Google AI Studio API key.
 * @param {string} selectedText The text selected by the user.
 * @param {string} surroundingCode The code surrounding the selection for context.
 * @returns {Promise<string>} The improved text.
 */
async function refactorTextWithGemini(apiKey, selectedText, surroundingCode, modelName = 'gemini-2.5-flash-lite', extraRules = '') {
    try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-2.5-flash-lite' });

        const prompt = `You are a helpful writing assistant. Improve the English of the selected text from a code file.

RULES (follow strictly):
1. Make the English clear, simple, and easy to understand
2. Fix any grammar or spelling mistakes
3. Keep sentences short and natural
4. Use common, everyday words (avoid complex vocabulary)
5. DO NOT change any code syntax, variables, functions, format specifiers, or technical terms
6. DO NOT add explanations or summarize anything – return ONLY the improved text
7. Keep the same meaning and tone as the original

${extraRules ? `ADDITIONAL RULES (from user):\n${extraRules}\n` : ''}

Context (do not rewrite; for understanding only):
---
${surroundingCode}
---

Text to improve:
"${selectedText}"

Return only the improved text, nothing else.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const improvedText = response.text().trim();

        return improvedText;

    } catch (error) {
        console.error("Gemini API Error:", error);
        if (error && error.message && error.message.includes('API key not valid')) {
            throw new Error("Gemini API key is not valid. Please check your settings.");
        }
        if (error && (error.code === 'ERR_MODULE_NOT_FOUND' || /Cannot find module/.test(String(error)))) {
            throw new Error("Gemini dependency not found. Please reinstall '@google/generative-ai'.");
        }
        throw new Error("Failed to get response from Gemini. Please check your network or API key.");
    }
}

module.exports = {
    refactorTextWithGemini
};


