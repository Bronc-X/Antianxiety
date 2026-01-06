'use server';

import { ActionResult } from "@/types/architecture";
import OpenAI from 'openai';

// Reuse the normalized API base from config or default
const RAW_API_BASE = process.env.OPENAI_API_BASE || 'https://aicanapi.com/v1';
const NORMALIZED_API_BASE = RAW_API_BASE.replace(/\/chat\/completions$/, '').replace(/\/$/, '');

export async function transcribeAudio(formData: FormData): Promise<ActionResult<string>> {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No audio file provided' };
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return { success: false, error: 'API key not configured' };
        }

        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: NORMALIZED_API_BASE,
        });

        const response = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            // temperature: 0.2, // Optional: add parameters if needed
        });

        return { success: true, data: response.text };

    } catch (error) {
        console.error('STT Server Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown server error'
        };
    }
}
