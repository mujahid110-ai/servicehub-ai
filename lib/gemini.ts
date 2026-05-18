import { GoogleGenerativeAI } from '@google/generative-ai';
import { ServiceRequest } from '@/types';

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
);

const SYSTEM_PROMPT = `You are ServiceHub AI assistant for Pakistan. You help customers describe their service needs.
You understand English, Urdu, and Roman Urdu.

When a user sends a service request, extract:
1. serviceType
2. urgency
3. preferredTime
4. description
5. language

Respond ONLY in JSON:
{
  "serviceType": "AC Repair",
  "urgency": "high",
  "preferredTime": "morning",
  "description": "AC not cooling properly",
  "language": "roman_urdu",
  "confirmationMessage": "Aapka request receive ho gaya."
}`;

// ---------------- MAIN FUNCTION ----------------
export async function parseServiceRequest(
  message: string,
  conversationHistory: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>
): Promise<{ request: ServiceRequest; confirmationMessage: string }> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
    });

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: 'model',
          parts: [
            {
              text: 'Understood. I will respond only in JSON format.',
            },
          ],
        },
        ...conversationHistory,
      ],
    });

    const result = await chat.sendMessage(message);

    // ✅ SAFE RESPONSE HANDLING (FIXED)
    const text = result?.response?.text?.() || '';

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    console.log('Gemini raw response:', text);

    // ✅ SAFE JSON EXTRACTION (NON-GREEDY FIX)
    const jsonMatch = text.match(/\{[\s\S]*?\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }

    let parsed;

    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('JSON Parse Error:', err);
      throw new Error('Invalid JSON format from Gemini');
    }

    return {
      request: {
        rawMessage: message,
        serviceType: parsed.serviceType || 'General Service',
        urgency: parsed.urgency || 'medium',
        preferredTime: parsed.preferredTime || 'Flexible',
        description: parsed.description || message,
        language: parsed.language || 'english',
      },
      confirmationMessage:
        parsed.confirmationMessage ||
        `Got it! Looking for ${parsed.serviceType || 'service'} providers.`,
    };
  } catch (error) {
    console.warn('Gemini parse error:', error);

    return fallbackParse(message);
  }
}

// ---------------- CHAT RESPONSE ----------------
export async function getAIChatResponse(
  message: string,
  context?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
    });

    const prompt = `
You are a helpful ServiceHub AI assistant in Pakistan.
${context ? `Context: ${context}` : ''}

User message: ${message}

Respond briefly in same language (English/Urdu/Roman Urdu).
Max 100 words.
`;

    const result = await model.generateContent(prompt);

    return result?.response?.text?.() || 'Sorry, no response generated.';
  } catch (error) {
    console.error(error);
    return 'Sorry, main abhi available nahi hun. Please dobara try karein.';
  }
}

// ---------------- FALLBACK PARSER ----------------
function fallbackParse(message: string): {
  request: ServiceRequest;
  confirmationMessage: string;
} {
  const lower = message.toLowerCase();

  let serviceType = 'General Service';
  if (lower.includes('ac') || lower.includes('air')) serviceType = 'AC Repair';
  else if (lower.includes('plumb') || lower.includes('pipe')) serviceType = 'Plumbing';
  else if (lower.includes('electric') || lower.includes('bijli')) serviceType = 'Electrical';
  else if (lower.includes('paint')) serviceType = 'Painting';
  else if (lower.includes('clean')) serviceType = 'Cleaning';
  else if (lower.includes('carpenter') || lower.includes('wood')) serviceType = 'Carpentry';
  else if (lower.includes('generator')) serviceType = 'Generator Repair';

  let urgency: ServiceRequest['urgency'] = 'medium';
  if (lower.includes('abhi') || lower.includes('urgent')) urgency = 'emergency';
  else if (lower.includes('aaj') || lower.includes('today')) urgency = 'high';
  else if (lower.includes('kal') || lower.includes('tomorrow')) urgency = 'medium';
  else if (lower.includes('week')) urgency = 'low';

  let preferredTime = 'Flexible';
  if (lower.includes('morning')) preferredTime = 'Morning';
  else if (lower.includes('afternoon')) preferredTime = 'Afternoon';
  else if (lower.includes('evening')) preferredTime = 'Evening';
  else if (lower.includes('night')) preferredTime = 'Night';

  if (serviceType === 'General Service') {
    return {
      request: {
        rawMessage: message,
        serviceType,
        urgency,
        preferredTime,
        description: message,
        language: 'roman_urdu',
      },
      confirmationMessage: 'Main samajh nahi paya konsi service chahiye. Kya aap bata sakte hain? (e.g. Plumber, AC Repair)',
    };
  }

  return {
    request: {
      rawMessage: message,
      serviceType,
      urgency,
      preferredTime,
      description: message,
      language: 'roman_urdu',
    },
    confirmationMessage: `${serviceType} ke liye provider dhundh raha hun.`,
  };
}

// ---------------- SUGGESTIONS ----------------
export async function generateServiceSuggestions(
  partial: string
): Promise<string[]> {
  const suggestions = [
    'AC repair kal morning chahiye',
    'Plumber abhi chahiye',
    'Electrician today urgent',
    'House cleaning this weekend',
    'Carpenter for door repair',
    'Generator repair urgent',
  ];

  const lower = partial.toLowerCase();

  return suggestions
    .filter((s) => s.toLowerCase().includes(lower) || lower.length < 3)
    .slice(0, 3);
}