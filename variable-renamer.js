// Variable Renamer Module - Suggests meaningful variable names using Gemini AI

/**
 * Analyzes code and suggests better variable/function names
 * @param {string} apiKey Gemini API key
 * @param {string} code The code to analyze
 * @param {string} modelName Gemini model to use
 * @param {string} language Programming language (c, cpp, python)
 * @returns {Promise<Array>} Array of suggestions: [{oldName, newName, reason, lineNumbers}]
 */
async function analyzeAndSuggestNames(apiKey, code, modelName = 'gemini-2.5-flash-lite', language = 'c') {
    try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-2.5-flash-lite' });

        const prompt = `You are a code refactoring expert. Analyze the following ${language} code and identify variables/functions with poor naming (like x, y, a, b, temp, etc.).

RULES:
1. Find variables and functions with non-descriptive names (single letters, generic names)
2. Suggest meaningful, descriptive names based on their usage in the code
3. Follow naming conventions: snake_case for C, camelCase for C++/Python
4. DO NOT suggest renaming: loop counters (i, j, k), standard variables (argc, argv), or well-named variables
5. Return ONLY a valid JSON array, no explanations

CODE TO ANALYZE:
\`\`\`${language}
${code}
\`\`\`

Return format (JSON array only):
[
  {
    "oldName": "x",
    "newName": "student_count",
    "reason": "Represents the number of students",
    "type": "variable"
  },
  {
    "oldName": "calc",
    "newName": "calculate_average",
    "reason": "Function calculates average of numbers",
    "type": "function"
  }
]

If no improvements needed, return: []`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let responseText = response.text().trim();

        // Remove markdown code blocks if present
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse JSON response
        const suggestions = JSON.parse(responseText);
        
        // Add line numbers for each suggestion
        const suggestionsWithLines = suggestions.map(suggestion => {
            const lineNumbers = findOccurrences(code, suggestion.oldName);
            return { ...suggestion, lineNumbers };
        });

        return suggestionsWithLines;

    } catch (error) {
        console.error("Variable Renamer Error:", error);
        if (error && error.message && error.message.includes('API key not valid')) {
            throw new Error("Gemini API key is not valid. Please check your settings.");
        }
        if (error instanceof SyntaxError) {
            throw new Error("Failed to parse AI response. Please try again.");
        }
        throw new Error("Failed to analyze code. Please check your network or API key.");
    }
}

/**
 * Find all line numbers where a variable/function name appears
 * @param {string} code The source code
 * @param {string} name The variable/function name to find
 * @returns {Array<number>} Array of line numbers (1-indexed)
 */
function findOccurrences(code, name) {
    const lines = code.split('\n');
    const occurrences = [];
    
    // Create a regex that matches the name as a whole word
    const regex = new RegExp(`\\b${name}\\b`, 'g');
    
    lines.forEach((line, index) => {
        if (regex.test(line)) {
            occurrences.push(index + 1); // 1-indexed
        }
    });
    
    return occurrences;
}

/**
 * Apply renaming to code
 * @param {string} code Original code
 * @param {string} oldName Name to replace
 * @param {string} newName New name
 * @returns {string} Updated code
 */
function applyRename(code, oldName, newName) {
    // Use word boundary regex to avoid partial matches
    const regex = new RegExp(`\\b${oldName}\\b`, 'g');
    return code.replace(regex, newName);
}

module.exports = {
    analyzeAndSuggestNames,
    applyRename,
    findOccurrences
};

