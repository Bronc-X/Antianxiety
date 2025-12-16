/**
 * Max Response API
 * POST: Generate Max response based on context
 * 
 * @module app/api/max/response/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/supabase-server';
import { generateResponse, generateSliderResponse, generateBeliefResponse, generateRitualCompleteResponse } from '@/lib/max/response-generator';
import { getDefaultSettings } from '@/lib/max/settings-validator';
import { ResponseContext, EventType, AISettings } from '@/types/max';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { event_type, data } = body as { event_type: EventType; data?: Record<string, unknown> };
    
    // Validate event_type
    const validEventTypes: EventType[] = ['slider_change', 'belief_set', 'ritual_complete', 'general'];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }
    
    // Fetch user's AI settings
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_settings')
      .eq('id', user.id)
      .single();
    
    const settings: AISettings = profile?.ai_settings || getDefaultSettings();
    
    // Generate response based on event type
    let response;
    
    switch (event_type) {
      case 'slider_change':
        if (data?.setting && data?.value !== undefined) {
          response = generateSliderResponse(
            settings,
            String(data.setting),
            Number(data.value)
          );
        } else {
          response = generateResponse({ settings, event_type, data });
        }
        break;
        
      case 'belief_set':
        if (data?.value !== undefined) {
          response = generateBeliefResponse(settings, Number(data.value));
        } else {
          response = generateResponse({ settings, event_type, data });
        }
        break;
        
      case 'ritual_complete':
        if (data?.value !== undefined) {
          response = generateRitualCompleteResponse(settings, Number(data.value));
        } else {
          response = generateResponse({ settings, event_type, data });
        }
        break;
        
      default:
        response = generateResponse({ settings, event_type, data });
    }
    
    return NextResponse.json({
      response,
      settings_used: settings
    });
  } catch (error) {
    console.error('Error generating response:', error);
    return NextResponse.json(
      { error: 'Processing anomaly detected.' },
      { status: 500 }
    );
  }
}
