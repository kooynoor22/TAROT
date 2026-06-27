import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function robustParseJson(text: string): any {
  let cleanText = text.trim();
  
  // 1. If wrapped in markdown block, extract it
  if (cleanText.includes("```")) {
    const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      cleanText = match[1].trim();
    }
  }
  
  // 2. Find the first '{' and last '}'
  const startIdx = cleanText.indexOf("{");
  const endIdx = cleanText.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleanText = cleanText.substring(startIdx, endIdx + 1);
  }
  
  try {
    return JSON.parse(cleanText);
  } catch (err: any) {
    console.warn("Standard JSON.parse failed. Attempting to repair common formatting errors...", err.message);
    
    // Attempt basic repairs for unescaped newlines and common issues
    try {
      let repaired = cleanText;
      
      // Replace raw newlines within quotes with "\n"
      let inString = false;
      let escapeNext = false;
      const resultChars = [];
      for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        if (escapeNext) {
          resultChars.push(char);
          escapeNext = false;
          continue;
        }
        if (char === '\\') {
          resultChars.push(char);
          escapeNext = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          resultChars.push(char);
          continue;
        }
        if (inString && (char === '\n' || char === '\r')) {
          resultChars.push('\\n');
        } else {
          resultChars.push(char);
        }
      }
      repaired = resultChars.join("");
      
      // Clean up trailing commas in objects/arrays (e.g., [1, 2, ] -> [1, 2])
      repaired = repaired.replace(/,(\s*[\]}])/g, "$1");
      
      return JSON.parse(repaired);
    } catch (repairErr: any) {
      console.error("Repair parsing also failed:", repairErr.message);
      throw new Error(`JSON malformado recibido del modelo: ${err.message}. Texto original: ${text.substring(0, 100)}...`);
    }
  }
}

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
        const modelsToTry = [];
        if (process.env.OPENROUTER_MODEL) {
          modelsToTry.push(process.env.OPENROUTER_MODEL);
        }
        // Enrutadores automáticos de OpenRouter
        modelsToTry.push("openrouter/auto");
        modelsToTry.push("openrouter/free");
        
        // Modelos gratuitos específicos de respaldo
        modelsToTry.push("google/gemini-2.5-flash:free");
        modelsToTry.push("meta-llama/llama-3.3-70b-instruct:free");
        modelsToTry.push("deepseek/deepseek-r1:free");

        for (const model of modelsToTry) {
          try {
            console.log(`Invocando oráculo mediante OpenRouter con el modelo: ${model}...`);
            const isReasoningModel = model.includes("r1") || model.includes("reasoning");

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ai.studio/build",
                "X-Title": "Oráculo de Tarot"
              },
              body: JSON.stringify({
                "model": model,
                "messages": [
                  {
                    "role": "user",
                    "content": `${systemPrompt}\n\n${prompt}`
                  }
                ],
                "temperature": 0.85,
                ...(isReasoningModel ? { "reasoning": { "enabled": true } } : {})
              })
            });

            if (response.ok) {
              const result = await response.json();
              if (result.choices && result.choices[0] && result.choices[0].message) {
                responseText = result.choices[0].message.content;
                console.log(`Respuesta obtenida con éxito de OpenRouter usando el modelo: ${model}`);
                break;
              }
            } else {
              const errText = await response.text();
              console.warn(`OpenRouter con modelo ${model} devolvió un estado no exitoso: ${response.status}. Detalle: ${errText}`);
            }
          } catch (orError: any) {
            console.error(`Error al conectar con OpenRouter usando el modelo ${model}:`, orError.message || orError);
          }
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
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                introduccion: {
                  type: Type.STRING,
                  description: "Un párrafo poético y místico de bienvenida al consultante, sintonizando con su energía, el/la tarotista y su consulta."
                },
                analisisCartas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      carta: {
                        type: Type.STRING,
                        description: "Nombre de la carta (incluyendo si salió invertida o al derecho)"
                      },
                      significado: {
                        type: Type.STRING,
                        description: "Interpretación detallada de esta carta en su posición, explicando su simbología mística y cómo influye en el consultante."
                      }
                    },
                    required: ["carta", "significado"]
                  },
                  description: "Lista de cartas analizadas en la tirada"
                },
                sintesis: {
                  type: Type.STRING,
                  description: "Una síntesis integrativa de toda la tirada que conecta todas las cartas."
                },
                consejoMagico: {
                  type: Type.STRING,
                  description: "Un consejo práctico, ritual o meditación mística sugerido con base en los arcanos."
                }
              },
              required: ["introduccion", "analisisCartas", "sintesis", "consejoMagico"]
            },
            temperature: 0.85,
          },
        });

        responseText = response.text || "";
      }

      if (!responseText) {
        throw new Error("No se pudo obtener una respuesta válida del oráculo.");
      }

      const reportData = robustParseJson(responseText);
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
