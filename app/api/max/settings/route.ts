/**
 * Max AI Settings API
 * GET: Fetch user's AI settings
 * PATCH: Update user's AI settings
 * 
 * @module app/api/max/settings/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/supabase-server';
import { validateAISettings, getDefaultSettings } from '@/lib/max/settings-validator';
import { AISettings } from '@/types/max';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ai_settings')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      // Return defaults if profile not found
      return NextResponse.json({
        settings: getDefaultSettings()
      });
    }
    
    const settings = profile.ai_settings || getDefaultSettings();
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { error: 'System recalibrating. Please retry.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const updates: Partial<AISettings> = body;
    
    // Validate input
    const validation = validateAISettings(updates);
    
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid settings configuration',
          details: validation.errors,
          sanitized: validation.sanitized
        },
        { status: 400 }
      );
    }
    
    // Get current settings
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_settings')
      .eq('id', user.id)
      .single();
    
    const currentSettings = profile?.ai_settings || getDefaultSettings();
    
    // Merge with sanitized updates
    const newSettings: AISettings = {
      ...currentSettings,
      ...validation.sanitized
    };
    
    // Update database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ai_settings: newSettings })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating AI settings:', updateError);
      return NextResponse.json(
        { error: 'Configuration update failed. Retrying...' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      settings: newSettings,
      message: 'System recalibrated.'
    });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    return NextResponse.json(
      { error: 'Processing anomaly detected.' },
      { status: 500 }
    );
  }
}
