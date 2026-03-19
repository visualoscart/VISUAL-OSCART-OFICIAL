
import { GoogleGenAI } from "@google/genai";

export async function getMarketingAdvice(context: string, field: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    INSTRUCCIÓN DE SISTEMA: Actúa como el Director de Estrategia de la agencia más exitosa del mundo.
    CONTEXTO DE OPERACIÓN: "${context}"
    SOLICITUD: Proporciona una recomendación de impacto para el área de "${field}".
    REGLAS:
    1. Máximo 25 palabras.
    2. Usa lenguaje persuasivo y profesional.
    3. Enfócate en el ROI y el crecimiento de marca.
    4. Idioma: Español.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Uso del modelo más capaz para estrategia
      contents: prompt,
    });
    return response.text?.trim() || "La innovación es la clave del éxito digital.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Analizando datos para optimizar tu estrategia...";
  }
}
