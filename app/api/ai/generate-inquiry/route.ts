import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { OpenAI } from 'openai';
import { getModelPriority } from '@/lib/ai/model-config';
import { generateInquiryQuestion } from '@/lib/inquiry-engine';

export async function POST(req: NextRequest) {
    try {
        const { context, language, history } = await req.json();

        // Security check
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Initialize AI client with API base from env
        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_API_BASE || 'https://aicanapi.com/v1',
        });

        // Prioritize DeepSeek for reasoning
        const model = 'deepseek-v3.2-exp'; // Use deepseek as preferred model

        const prompt = `
You are Max, an empathetic health AI assistant.
Your goal is to ask a single, relevant question to the user to fill a data gap or check on their wellbeing.

Context:
- User's recent data: ${JSON.stringify(context.recentData || {})}
- Identified Data Gaps: ${JSON.stringify(context.dataGaps || [])}
- Time of Day: ${context.timeOfDay}
- Language: ${language === 'en' ? 'English' : 'Chinese (ensure simplified Chinese)'}

History (last 5 inquiries):
${JSON.stringify(history || [])}

Task:
Generate a proactive inquiry question object.
The question should be:
1. Conversational and empathetic
2. Short and easy to answer
3. Directly addressing a high priority data gap if any, otherwise general wellbeing
4. JSON formatted

Return ONLY valid JSON with this structure:
{
  "id": "generated_uuid",
  "question_text": "The question string",
  "question_type": "diagnostic" | "check_in",
  "priority": "high" | "medium" | "low",
  "data_gaps_addressed": ["gap_field_name"],
  "options": [
    { "label": "Option 1", "value": "value1" },
    { "label": "Option 2", "value": "value2" }
  ]
}
`;

        const completion = await client.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: 'You are a helpful API that returns JSON.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error('No content generated');

        const question = JSON.parse(content);

        return NextResponse.json({ question });
    } catch (error) {
        console.error('AI Inquiry Generation error:', error);

        // Fallback or error response
        return NextResponse.json(
            { error: 'Failed to generate inquiry' },
            { status: 500 }
        );
    }
}
