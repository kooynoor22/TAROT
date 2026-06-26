import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for Gemini Report
  app.post("/api/gemini/report", async (req, res) => {
    try {
      const { 
        drawnCards, 
        spreadType, 
        question, 
        consultantName, 
        tarotistName,
        traditionName,
        deckName
      } = req.body;

      if (!drawnCards || !Array.isArray(drawnCards)) {
        return res.status(400).json({ error: "Faltan los datos de las cartas (drawnCards)" });
      }

      // Create a rich description for the model
      const cardsText = drawnCards.map((c: any, idx: number) => {
        const orientation = c.inverted ? "Invertida (al revés)" : "Al derecho (normal)";
        return `Carta ${idx + 1}: ${c.card.name} (${orientation})`;
      }).join("\n");

      const systemPrompt = `Eres un tarotista profesional místico de altísimo prestigio, experto en la psicología profunda de los arquetipos del tarot, la cábala, la astrología y el crecimiento personal.
Tu tono es sabio, poético, místico, sumamente empático y respetuoso. Brindas una devolución profunda que integra todas las cartas de la tirada para iluminar el camino del consultante.

Generarás el informe estructurado en formato JSON válido con el siguiente esquema:
{
  "introduccion": "Un párrafo poético y místico de bienvenida al consultante, sintonizando con su energía, el/la tarotista y su consulta.",
  "analisisCartas": [
    {
      "carta": "Nombre de la carta (incluyendo si salió invertida o al derecho)",
      "significado": "Interpretación detallada de esta carta en su posición, explaining su simbología mística y cómo influye en el consultante."
    }
  ],
  "sintesis": "Una síntesis integrativa de toda la tirada que conecta todas las cartas y revela la evolución espiritual u obstáculos principales.",
  "consejoMagico": "Un consejo práctico, ritual o meditación mística sugerido con base en los arcanos de la tirada para guiar su camino."
}

No agregues explicaciones fuera de este formato JSON. Devuelve únicamente el objeto JSON. No coloques bloques de código markdown como \`\`\`json ... \`\`\`, solo la cadena JSON directa.`;

      const prompt = `Por favor, realiza una lectura de Tarot profesional.
Datos de la sesión:
- Consultante: ${consultantName || 'Consulta General'}
- Tarotista de la sesión: ${tarotistName || 'Tarotista Profesional'}
- Tipo de Tirada: ${spreadType === 'single' ? 'Carta Única (Consejo)' : spreadType === 'three' ? 'Tirada de Tres Cartas (Pasado, Presente, Futuro)' : 'Cruz Celta (Lectura Completa)'}
- Pregunta del consultante: "${question || 'Sin pregunta específica, lectura evolutiva general'}"

Cartas seleccionadas en orden:
${cardsText}

Genera una interpretación mística y profesional profunda para cada carta en el contexto de la tirada y la pregunta del consultante.`;

      let responseText = "";

      // 1. Intentar con OpenRouter si la clave de API está configurada
      if (process.env.OPENROUTER_API_KEY) {
        try {
          console.log("Invocando oráculo mediante OpenRouter...");
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "model": "openrouter/free",
              "messages": [
                {
                  "role": "user",
                  "content": `${systemPrompt}\n\n${prompt}`
                }
              ],
              "reasoning": { "enabled": true }
            })
          });

          if (response.ok) {
            const result = await response.json();
            const message = result.choices[0].message;
            responseText = message.content;
            console.log("Respuesta obtenida de OpenRouter con razonamiento.");
          } else {
            console.warn(`OpenRouter devolvió un estado no exitoso: ${response.status}. Usando respaldo...`);
          }
        } catch (orError) {
          console.error("Error al conectar con OpenRouter, usando Gemini de respaldo...", orError);
        }
      }

      // 2. Respaldo o método principal (Gemini)
      if (!responseText) {
        if (!process.env.GEMINI_API_KEY) {
          return res.status(500).json({ 
            error: "La clave de API de Gemini (GEMINI_API_KEY) o OpenRouter (OPENROUTER_API_KEY) no están configuradas." 
          });
        }

        console.log("Invocando oráculo mediante Gemini...");
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.85,
          },
        });

        responseText = response.text || "";
      }

      if (!responseText) {
        throw new Error("No se pudo obtener una respuesta válida del oráculo.");
      }

      // Limpiar posibles bloques de código markdown de la respuesta de texto si el modelo los incluyó
      let cleanText = responseText.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
      }

      const reportData = JSON.parse(cleanText);
      res.json(reportData);

    } catch (err: any) {
      console.error("Error in API route:", err);
      res.status(500).json({ error: err.message || "Error al procesar la lectura con el oráculo" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
