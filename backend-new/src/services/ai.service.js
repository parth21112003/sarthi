/**
 * ==============================================================================
 * AI SERVICE (src/services/ai.service.js)
 * ==============================================================================
 * Powered by Groq LLM API (Qwen 3.8 27B / OpenAI compatible)
 * Provides:
 * 1. 24/7 AI Career Companion Chatbot with live counselor triage
 * 2. Deep Personalized Career Roadmap & Milestone Generator from Aptitude Scores
 * ==============================================================================
 */

import prisma from '../config/prisma.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const FALLBACK_MODELS = [PRIMARY_MODEL, 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

/**
 * Helper to call Groq OpenAI-compatible Chat Completions with resilient model fallback
 */
async function callGroq({ messages, temperature = 0.7, max_tokens = 1000, response_format }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in backend environment');
  }

  let lastError = null;

  // Try each model in sequence if rate-limited or unavailable
  for (const modelName of FALLBACK_MODELS) {
    try {
      const payload = {
        model: modelName,
        messages,
        temperature,
        max_tokens,
      };

      if (response_format) {
        payload.response_format = response_format;
      }

      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        console.warn(`Groq model ${modelName} rate limited (429). Switching to fallback model...`);
        lastError = new Error(`Rate limit on ${modelName}`);
        continue; // Try next fallback model
      }

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Groq API error on ${modelName}:`, res.status, errText);
        lastError = new Error(`AI service error on ${modelName}: ${res.statusText}`);
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (content) return content;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All AI models failed to respond');
}

/**
 * 1. Chat with AI Career Companion
 */
export const chatWithAiCompanion = async ({ user, message, chatHistory = [] }) => {
  // Fetch real counselors from DB so AI can intelligently refer the student
  const counselors = await prisma.user.findMany({
    where: { role: 'counselor' },
    select: {
      id: true,
      name: true,
      stream: true,
      specialization: true,
      experience: true,
      rating: true,
    },
    take: 12,
  });

  const counselorsContext = counselors
    .map(
      (c) =>
        `- ID ${c.id}: ${c.name} (${c.specialization || c.stream}, ${c.experience} yrs exp, ${c.rating.toFixed(1)}★)`
    )
    .join('\n');

  const studentContext = `Student Name: ${user.name}\nStudent Academic Stream: ${user.stream || 'Not specified'}`;

  const systemPrompt = `You are "Sarthi AI", an empathetic, highly knowledgeable, and encouraging AI Career Counselor and Academic Mentor built into the Sarthi Career Counseling Platform.

Your goal is to guide students on:
1. Academic streams (Science, Commerce, Arts, Engineering, Medical, Design, Management, Law).
2. Degree programs, competitive entrance examinations, and career choices.
3. Realistic skill roadmaps, internships, and interview preparations.

Current Student Profile:
${studentContext}

Available Real Platform Counselors:
${counselorsContext}

Rules:
- Be warm, concise, professional, and practical.
- Use clean standard Markdown formatting (bullet points, bold text, clear section headers).
- Do NOT output raw HTML tags like <br> or <div>; use standard Markdown line breaks and lists instead.
- If you use Markdown tables, keep them concise, clean, and easy to read.
- Whenever a student asks about a specific field or seems undecided, recommend 1 or 2 matching real counselors from the list above by name and specialization so they can book a 1-on-1 human counseling session.
- Keep responses engaging, structured, and directly actionable without excessive wordiness.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6), // keep last 6 turns for context
    { role: 'user', content: message },
  ];

  const reply = await callGroq({ messages, temperature: 0.7, max_tokens: 1000 });
  return reply;
};

/**
 * 2. Generate Personalized Career Roadmap from Aptitude Assessment Scores
 */
export const generateCareerRoadmap = async ({ user, aptitudeResult }) => {
  let scores = {};
  try {
    scores = typeof aptitudeResult.scores === 'string'
      ? JSON.parse(aptitudeResult.scores)
      : aptitudeResult.scores;
  } catch {
    scores = { logical: 10, verbal: 10, quantitative: 10, creative: 10, social: 10 };
  }

  const prompt = `You are a Senior Career Strategist and Psychometric Assessment Analyst.
Analyze the following student assessment data:

Student Name: ${user.name}
Academic Stream: ${user.stream || 'General'}
Aptitude Test Total Score: ${aptitudeResult.totalScore} / 100
Dimensional Scores:
- Logical Reasoning: ${scores.logical || 0} / 20
- Verbal Ability: ${scores.verbal || 0} / 20
- Quantitative Aptitude: ${scores.quantitative || 0} / 20
- Creative & Design: ${scores.creative || 0} / 20
- Social & Leadership: ${scores.social || 0} / 20
Recommended Stream from Test: ${aptitudeResult.streamRecommendation}

Please generate a comprehensive, highly personalized Career Blueprint in JSON format.
The JSON must strictly conform to this structure:
{
  "dominantArchetype": "string (e.g. Strategic Technologist, Creative Innovator, Analytical Quant)",
  "executiveSummary": "string (3-4 sentences synthesizing their unique strengths)",
  "topCareerPaths": [
    {
      "title": "string",
      "matchScore": number (80-99),
      "whyFit": "string",
      "benchmarkSalary": "string",
      "targetRoles": ["string", "string", "string"]
    }
  ],
  "milestoneRoadmap": [
    {
      "phase": "Year 1: Foundations & Core Competencies",
      "focus": "string",
      "actionItems": ["string", "string", "string"]
    },
    {
      "phase": "Year 2: Applied Projects & Specialization",
      "focus": "string",
      "actionItems": ["string", "string", "string"]
    },
    {
      "phase": "Year 3: Industry Readiness & Launch",
      "focus": "string",
      "actionItems": ["string", "string", "string"]
    }
  ],
  "blindspotsAndRecommendations": [
    {
      "dimension": "string",
      "observation": "string",
      "remedy": "string"
    }
  ]
}

Ensure the output is valid JSON only, without markdown code block backticks.`;

  const messages = [
    {
      role: 'system',
      content: 'You are an expert career advisory AI that outputs only raw, valid JSON conforming to the requested schema.',
    },
    { role: 'user', content: prompt },
  ];

  const rawResponse = await callGroq({
    messages,
    temperature: 0.5,
    max_tokens: 1600,
    response_format: { type: 'json_object' },
  });

  try {
    const cleaned = rawResponse.trim().replace(/^```json\s*/, '').replace(/```$/, '');
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse AI roadmap JSON:', rawResponse);
    throw new Error('AI generated invalid roadmap format');
  }
};
