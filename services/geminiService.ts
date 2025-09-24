// Fix: Added missing 'Type' import from '@google/genai' for the commented-out function.
// Fix: Imported GenerateContentResponse to explicitly type API call results.
import { GoogleGenAI, Chat, Type, GenerateContentResponse } from "@google/genai";
import { Message, Role, Recommendation, DiaryEntry, DiaryMoodAnalysis } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * A wrapper function to retry an async API call with exponential backoff.
 * This is crucial for handling 429 "Resource Exhausted" (rate limit) errors.
 * @param apiCall The async function to call.
 * @param maxRetries The maximum number of retries.
 * @param initialDelay The initial delay in milliseconds before the first retry.
 * @returns The result of the successful API call.
 */
async function withRetry<T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error: any) {
            const errorMessage = error?.toString() || '';
            // Check for status codes or messages indicating rate limiting
            if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                if (i === maxRetries - 1) {
                    console.error("Max retries reached for rate-limited request.", error);
                    // Re-throw original error after the last attempt
                    // so the UI can still show a final error message.
                    throw error; 
                }
                // Exponential backoff: 1s, 2s, 4s, etc.
                const delay = initialDelay * Math.pow(2, i); 
                console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Not a rate limit error, throw it immediately.
                throw error;
            }
        }
    }
    // This line should be unreachable if the logic is correct, but it satisfies TypeScript's return path requirements.
    throw new Error('Exceeded max retries for API call.');
}


let chatInstance: Chat | null = null;

const SYSTEM_PROMPT_TEMPLATE = `
You are 'Aastha', a calm, empathetic, and relatable campus wellness friend for {{userName}}. Your primary goal is to be a natural, conversational friend. Do not sound like an AI. Avoid meta-commentary like "No new memories added" or "I am processing your request."

**Your Core Persona:**
- **Mirror Language & Style (CRITICAL):** You MUST reply in the same language and style the user is using.
- **Language Switching Rule:** When a user asks you to switch to a new language, you MUST try your best to converse in that language. It is okay if you are not perfect. Do not refuse.
- **Keep it Casual:** Keep the conversation light unless the user brings up a serious topic.
- **Formatting:** Generally, keep replies to 2-4 sentences to stay conversational. Use emojis naturally 😊.
- **Comfort & Empathy (CRITICAL EXCEPTION):** When a user is feeling down, sad, or is asking for comfort, you MUST go beyond the 2-4 sentence limit. Your tone must become exceptionally warm and caring. **Only in these situations**, you are allowed to use soft, appropriate terms of endearment like "sweetheart" or "dear" to be more comforting. Provide a more thoughtful, reassuring, and detailed response.
- **Replying to Messages (CRITICAL):** When a user replies to a specific message (indicated by text like 'In reply to "...":'), your response MUST acknowledge the context of the original message they replied to AND address their new comment. Synthesize both into a cohesive answer.

**Interactive Modes:**
- **Decision Helper:** If the user is struggling to make a decision, enter a 'pros and cons' mode.
- **Game Master:** If the user is bored or wants to play, initiate a simple text-based game.

**Memory & Personalization:**
- Throughout the conversation, you MUST remember important details the user shares about themselves (likes, dislikes, goals, key life events). Refer back to these details to make the conversation feel personal and continuous.
- When you identify a key, lasting fact about the user that should be remembered for future conversations, summarize it concisely and save it using the command: \`<save_fact>The user's name is Alex.</save_fact>\`. The app will store this for future conversations. Do not add confirmation messages like "Fact saved". Only output the tag.

**UI Commands (CRITICAL RULE):**
- **Functionality:** If the user asks to open a feature or change a setting, you can add a short confirmation message, but you MUST end your response with the corresponding tag. The app will perform the action and hide the tag from the final message.
- **Example:** "Of course, opening your diary now. <open_diary/>"
- **"Open my diary"** or similar phrases -> <open_diary/>
- **"Show me my mood tracker"** or similar -> <open_mood_tracker/>
- **"Show my mood analytics/insights"** or similar -> <open_mood_analytics/>
- **"Open settings"** or similar -> <open_settings/>
- **"Start a pomodoro timer"** or similar -> <open_pomodoro/>
- **"Play some background sounds/soundscape"** or similar -> <open_soundscape/>
- **"Let's do a breathing exercise"** or similar -> <open_breathing/>
- **"Suggest a song"** or "Jam with me" or similar -> <open_jam-with-aastha/>
- **"Change the theme to [color]"** or similar -> <color>The Color Name</color> (e.g., <color>Sky Blue</color>)
- **Farewell Detection:** If the user says goodbye, reply kindly and end with <farewell>true</farewell>.


**Your Boundaries:**
- You are a peer, not a doctor. Never diagnose.

**Safety Protocol (CRITICAL):**
- If a user expresses intent of self-harm, suicide, or severe emotional distress, you MUST stop the conversational persona and immediately provide the following text VERBATIM. Do not add any conversational text before or after this block. This is a safety override.

"""
It sounds like you're going through a very difficult time, and I'm glad you reached out. Please know that your safety is the most important thing right now, and there are people who want to support you. It's really important to talk to someone who can help right away.

Please consider contacting one of these resources in India:

**Vandrevala Foundation:**
Phone: 9999666555 (24/7 Helpline)

**KIRAN Mental Health Rehabilitation Helpline (Govt. of India):**
Phone: 1800-599-0019 (24/7 Toll-Free)

**iCALL Psychosocial Helpline (TISS):**
Phone: 9152987821 (Available Monday to Saturday, 10 AM to 8 PM)

You are not alone, and help is available. Please reach out to them. I'll be here for you to talk more after you've connected with one of them.
"""
`;


export const initializeChat = (history: Message[], userName: string, userFacts: string[]) => {
    // Start with a context-setting message if there are user facts.
    // This primes the AI for the conversation.
    const historyForAi = [];
    if (userFacts.length > 0) {
        const factText = `[INTERNAL MEMORY LOADED]\nHere are some key facts to remember about ${userName}:\n- ${userFacts.join('\n- ')}`;
        historyForAi.push({
            role: 'user',
            parts: [{ text: factText }]
        });
        historyForAi.push({
            role: 'model',
            parts: [{ text: "Got it. I'll remember these details." }]
        });
    }

    // Add the rest of the chat history
    history
        .filter(msg => msg.role !== Role.SYSTEM && msg.text && !msg.isTyping && msg.id !== 'initial-1')
        .forEach(msg => {
            historyForAi.push({
                role: msg.role === Role.USER ? 'user' : 'model',
                parts: [{ text: msg.text as string }]
            });
        });

    chatInstance = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: SYSTEM_PROMPT_TEMPLATE.replace('{{userName}}', userName),
        },
        history: historyForAi
    });
};


const getChatInstance = (): Chat => {
    if (!chatInstance) {
        initializeChat([], 'friend', []);
    }
    return chatInstance as Chat;
};

// Fix: Added an explicit return type to ensure TypeScript correctly infers the type of the stream,
// which resolves the async iterator error in ChatView.tsx.
export const getChatResponseStream = async (message: string): Promise<AsyncGenerator<GenerateContentResponse>> => {
    const chat = getChatInstance();
    return withRetry(() => chat.sendMessageStream({ message }));
};


export const getMusicRecommendation = async (prompt: string, exclude: string[] = []): Promise<Recommendation | null> => {
    try {
        let fullPrompt = `${prompt}. Respond ONLY with the format: <recommendations>Song Name by Artist</recommendations>. Do not add any other text.`;
        if (exclude.length > 0) {
            fullPrompt += ` Also, do not suggest any of these: ${exclude.join(', ')}.`;
        }
        
        // Fix: Explicitly typed the 'response' constant to 'GenerateContentResponse'
        // to resolve the "'text' does not exist on type 'unknown'" error.
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 } // low latency
            }
        }));

        const text = response.text;
        const match = text.match(/<recommendations>(.*?)<\/recommendations>/);
        if (match && match[1]) {
            const songAndArtist = match[1];
            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(songAndArtist)}`;
            return { name: songAndArtist, url: searchUrl };
        }
        return null;

    } catch (error) {
        console.error("Error getting music recommendation:", error);
        return null;
    }
};


export const analyzeSentiment = async (text: string): Promise<string> => {
    try {
        // Fix: Explicitly typed the 'response' constant to 'GenerateContentResponse'
        // to resolve the "'text' does not exist on type 'unknown'" error.
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the sentiment of this text and classify it into one of the following categories: Happy, Calm, Sad, Anxious, Neutral, Excited. Text: "${text}"`,
            config: {
                thinkingConfig: { thinkingBudget: 0 } // low latency
            }
        }));
        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing sentiment:", error);
        return "Neutral";
    }
};


export const extractColorsFromImage = async (base64Image: string, mimeType: string): Promise<string[] | null> => {
    try {
        // Fix: Explicitly typed the 'response' constant to 'GenerateContentResponse'
        // to resolve the "'text' does not exist on type 'unknown'" error.
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType } },
                    { text: "Extract a beautiful and harmonious 5-color palette from this image. The palette should consist of: a vibrant primary color, a complementary secondary color, a light and pleasing text color, a bold accent color, and a very dark, rich background color. Return a JSON object with a single key 'colors' which is an array of 5 hex color strings in the specified order." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        colors: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        }));
        
        const jsonText = response.text.trim();
        if (!jsonText) return null;

        const result = JSON.parse(jsonText);
        if (result && Array.isArray(result.colors) && result.colors.length > 0) {
            return result.colors;
        }
        return null;
    } catch (error) {
        console.error("Error extracting colors:", error);
        return null;
    }
};

export const analyzeDiaryEntries = async (entries: DiaryEntry[]): Promise<DiaryMoodAnalysis[] | null> => {
    if (entries.length === 0) return [];

    const formattedEntries = entries.reduce((acc, entry) => {
        const date = new Date(entry.timestamp).toISOString().split('T')[0];
        if (entry.content && entry.content.trim()) {
            acc[date] = entry.content;
        }
        return acc;
    }, {} as Record<string, string>);

    if (Object.keys(formattedEntries).length === 0) return [];

    const prompt = `Analyze the sentiment of the provided diary entries. For each date, determine the dominant mood. Classify the mood into ONE of the following categories: 'Happy', 'Calm', 'Sad', 'Anxious', 'Energetic', 'Stressed', 'Anger'. Data: ${JSON.stringify(formattedEntries)}`;

    try {
        // Fix: Explicitly typed the 'response' constant to 'GenerateContentResponse'
        // to resolve the "'text' does not exist on type 'unknown'" error.
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        analysis: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    date: { type: Type.STRING },
                                    mood: { type: Type.STRING }
                                },
                                required: ['date', 'mood']
                            }
                        }
                    },
                    required: ['analysis']
                }
            }
        }));

        const jsonText = response.text.trim();
        if (!jsonText) return null;

        const result = JSON.parse(jsonText);
        if (result && Array.isArray(result.analysis)) {
            return result.analysis as DiaryMoodAnalysis[];
        }
        return null;
    } catch (error) {
        console.error("Error analyzing diary entries:", error);
        return null;
    }
};