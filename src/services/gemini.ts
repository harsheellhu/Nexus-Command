import { TrafficEvent } from '../utils/mockData';

// Use environment variables for flexible configuration, fallback to localhost
const OLLAMA_ENDPOINT = (import.meta as any).env.VITE_OLLAMA_ENDPOINT || 'http://localhost:11434';
const OLLAMA_MODEL = (import.meta as any).env.VITE_OLLAMA_MODEL || 'llama3';

export async function generateIncidentRecommendations(context: string, weather: string) {
  if (!context) return null;

  const prompt = `
    You are an AI Traffic Command Co-Pilot. Analyze the following critical events:
    ${context}
    
    Current Weather Conditions: ${weather}
    
    Respond STRICTLY with a valid JSON object matching exactly this structure, no wrapping markdown, no explanations:
    {
      "summary": "Brief summary",
      "dispatchRecommendations": ["Action 1", "Action 2"],
      "diversionRoutes": [
        { "routeName": "Service Road Detour", "coordinates": [[23.1885, 72.6285], [23.1950, 72.6300]] }
      ],
      "publicAlerts": {
        "vms": "SHORT HIGHWAY SIGN MESSAGE",
        "socialMedia": "Twitter post regarding incident."
      }
    }
  `;

  try {
    const response = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        format: 'json' // Instructs Ollama to strictly return matching JSON structure
      })
    });

    if (!response.ok) throw new Error("Ollama generation failed");

    const data = await response.json();
    let textObj = data.response;
    
    if (textObj.startsWith('\`\`\`json')) {
      textObj = textObj.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }
    return JSON.parse(textObj);
  } catch (error) {
    console.error("Co-Pilot Recommendation Error:", error);
    return null;
  }
}

export async function chatWithCopilot(context: string, query: string, chatHistory: any[], weather: string) {
  const historyText = chatHistory.map(m => `${m.role === 'user' ? 'Operator' : 'Co-Pilot'}: ${m.text}`).join('\n');

  const prompt = `
    You are the Nexus Traffic Command Co-Pilot. You assist officers running a city traffic grid.
    Current System Context:
    ${context}

    Current Weather Conditions: ${weather}
    
    Conversation History:
    ${historyText}
    
    Operator Query: "${query}"
    
    Provide a concise, professional, and actionable response. Do not use markdown headers unless necessary, just plain text or short bullet points.
  `;

  try {
    const response = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) throw new Error("Ollama chat failed");

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Co-Pilot Chat Error:", error);
    return "I am currently unable to reach the local Ollama instance at " + OLLAMA_ENDPOINT + ". \n\nIf Ollama is running on another machine, ensure you start it with CORS allowed: `OLLAMA_ORIGINS=\"*\" OLLAMA_HOST=\"0.0.0.0\" ollama serve`.";
  }
}
