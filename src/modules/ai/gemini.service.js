const { GoogleGenAI } = require('@google/genai');
const env = require('../../config/env');

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;

  if (!apiKey || !String(apiKey).trim()) {
    const error = new Error('Gemini API key is not configured.');
    error.statusCode = 500;
    throw error;
  }

  return new GoogleGenAI({ apiKey });
}

async function callGemini(prompt) {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const text = response?.text || response?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';

    if (!text || !String(text).trim()) {
      const error = new Error('Gemini returned an empty response.');
      error.statusCode = 502;
      throw error;
    }

    return text;
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 502;
      error.message = 'Gemini request failed.';
    }

    throw error;
  }
}

module.exports = { callGemini };
