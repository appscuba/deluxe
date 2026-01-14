
import { GoogleGenAI } from "@google/genai";

// Fix: Correctly initialize GoogleGenAI using process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDentalAdvice = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Eres un asistente virtual experto para la clínica 'Deluxe Dental Care'. Responde dudas comunes sobre tratamientos dentales de forma profesional, amable y concisa. No sustituyas el diagnóstico de un dentista real.",
        temperature: 0.7,
      },
    });
    // Fix: Access .text property directly (not a function)
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lo siento, no puedo procesar tu solicitud en este momento.";
  }
};

export const summarizePatientNotes = async (notes: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Resume estas notas de un paciente dental para el doctor, destacando lo más importante: ${notes}`,
    });
    // Fix: Access .text property directly
    return response.text;
  } catch (error) {
    return notes;
  }
};
