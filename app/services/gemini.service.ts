export type GeminiTaskInsights = {
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const fallbackInsights: GeminiTaskInsights = {
  category: 'Operations',
  priority: 'MEDIUM',
  summary: 'Task recorded. Administrative review pending.',
};

export const analyzeTaskWithGemini = async (
  title: string,
  description: string,
): Promise<GeminiTaskInsights> => {
  if (!GEMINI_API_KEY) {
    return fallbackInsights;
  }

  const prompt = `
You are an AI assistant for CampusIQ, a college operations intelligence platform used by administrators, deans, registrars, and executives.
Analyze the following operational task and respond with a compact JSON object:
{"category": "<category: Admissions|Academics|Facilities|Compliance|Finance|HR|IT|Operations|General>", "priority": "<LOW|MEDIUM|HIGH>", "summary": "<<=60 words executive summary for senior administrators>"}

Task Title: ${title}
Task Details: ${description}
  `;

  try {
    const response = await fetch(`${GEMINI_MODEL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{text: prompt}],
          },
        ],
      }),
    });

    if (!response.ok) {
      return fallbackInsights;
    }

    const data = await response.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return fallbackInsights;
    }

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    return {
      category: parsed.category || fallbackInsights.category,
      priority:
        parsed.priority === 'HIGH' || parsed.priority === 'LOW'
          ? parsed.priority
          : 'MEDIUM',
      summary: parsed.summary || fallbackInsights.summary,
    };
  } catch (error) {
    return fallbackInsights;
  }
};

export const generateHealthSummary = async (prompt: string): Promise<string> => {
  if (!GEMINI_API_KEY) {
    return 'Campus operations status requires manual review.';
  }

  try {
    const response = await fetch(`${GEMINI_MODEL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{text: prompt}],
          },
        ],
      }),
    });

    if (!response.ok) {
      return 'Unable to generate health summary at this time.';
    }

    const data = await response.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text.trim() || 'Campus operations status requires manual review.';
  } catch (error) {
    return 'Unable to generate health summary at this time.';
  }
};
