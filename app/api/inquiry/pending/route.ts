/**
 * Pending Inquiry API
 * 
 * Returns pending inquiry question for a user.
 * Includes feed recommendations when relevant.
 * 
 * Requirements: 4.3, 5.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  identifyDataGaps, 
  generateInquiryQuestion,
  getInquiryOptionsForGap
} from '@/lib/inquiry-engine';
import { getTopRecommendation } from '@/lib/feed-curation';
import type { InquiryPendingResponse, CuratedContent } from '@/types/adaptive-interaction';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if there's ANY unanswered inquiry (don't limit by time)
    // This prevents creating duplicate inquiries for the same data gap
    const { data: recentInquiry } = await supabase
      .from('inquiry_history')
      .select('*')
      .eq('user_id', user.id)
      .is('user_response', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentInquiry) {
      const gapField = Array.isArray(recentInquiry.data_gaps_addressed)
        ? recentInquiry.data_gaps_addressed[0]
        : undefined;
      const userLanguage = (request.nextUrl.searchParams.get('language') || 'zh') as 'zh' | 'en';
      
      // Get the question template for the current language
      let questionText = recentInquiry.question_text;
      if (gapField) {
        const template = generateInquiryQuestion([{ field: gapField, importance: 'high', description: '' }], [], userLanguage);
        if (template) {
          questionText = template.question_text;
        }
      }
      
      const derivedOptions = gapField ? getInquiryOptionsForGap(gapField, userLanguage) : null;
      // Return existing pending inquiry with language-specific text
      const response: InquiryPendingResponse = {
        hasInquiry: true,
        inquiry: {
          id: recentInquiry.id,
          question_text: questionText,
          question_type: recentInquiry.question_type,
          priority: recentInquiry.priority,
          data_gaps_addressed: recentInquiry.data_gaps_addressed || [],
          options: derivedOptions || [
            { label: '是', value: 'yes' },
            { label: '否', value: 'no' },
          ],
        },
      };
      return NextResponse.json(response);
    }

    // Generate new inquiry based on data gaps
    // Check if user answered recently (20 minute cooldown)
    const twentyMinutesAgo = new Date();
    twentyMinutesAgo.setMinutes(twentyMinutesAgo.getMinutes() - 20);
    
    const { data: recentResponse } = await supabase
      .from('inquiry_history')
      .select('responded_at')
      .eq('user_id', user.id)
      .not('user_response', 'is', null)
      .gte('responded_at', twentyMinutesAgo.toISOString())
      .order('responded_at', { ascending: false })
      .limit(1)
      .single();
    
    if (recentResponse) {
      const minutesAgo = Math.floor((Date.now() - new Date(recentResponse.responded_at).getTime()) / 60000);
      console.log(`📋 [Inquiry] Cooldown active (${minutesAgo}/20 minutes)`);
      return NextResponse.json({ hasInquiry: false });
    }
    
    // Check which data gaps were already answered today
    const today = new Date().toISOString().split('T')[0];
    const { data: todayResponses } = await supabase
      .from('inquiry_history')
      .select('data_gaps_addressed')
      .eq('user_id', user.id)
      .not('user_response', 'is', null)
      .gte('responded_at', `${today}T00:00:00Z`);
    
    const answeredGapsToday = new Set<string>();
    if (todayResponses) {
      todayResponses.forEach(r => {
        if (r.data_gaps_addressed) {
          r.data_gaps_addressed.forEach((gap: string) => answeredGapsToday.add(gap));
        }
      });
    }
    console.log('📋 [Inquiry] Data gaps answered today:', Array.from(answeredGapsToday));
    
    // Get user's recent data
    const { data: recentCalibrations } = await supabase
      .from('daily_calibrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(7);

    // Get user's phase goals
    const { data: phaseGoals } = await supabase
      .from('phase_goals')
      .select('*')
      .eq('user_id', user.id);

    // Build recent data map
    const recentData: Record<string, { value: string; timestamp: string }> = {};
    if (recentCalibrations && recentCalibrations.length > 0) {
      const latest = recentCalibrations[0];
      if (latest.sleep_hours) {
        recentData.sleep_hours = { 
          value: String(latest.sleep_hours), 
          timestamp: latest.created_at 
        };
      }
      if (latest.stress_level) {
        recentData.stress_level = { 
          value: latest.stress_level, 
          timestamp: latest.created_at 
        };
      }
    }

    // Identify data gaps
    const allGaps = identifyDataGaps(recentData);
    
    // Filter out gaps that were already answered today
    const gaps = allGaps.filter(gap => !answeredGapsToday.has(gap.field));
    
    if (gaps.length === 0) {
      console.log('📋 [Inquiry] No new data gaps to ask about (all answered today)');
      return NextResponse.json({ hasInquiry: false });
    }

    // Generate inquiry question with user's language
    const userLanguage = (request.nextUrl.searchParams.get('language') || 'zh') as 'zh' | 'en';
    const inquiry = generateInquiryQuestion(gaps, phaseGoals || [], userLanguage);
    
    if (!inquiry) {
      return NextResponse.json({ hasInquiry: false });
    }

    // Store the inquiry
    const { data: storedInquiry, error: storeError } = await supabase
      .from('inquiry_history')
      .insert({
        user_id: user.id,
        question_text: inquiry.question_text,
        question_type: inquiry.question_type,
        priority: inquiry.priority,
        data_gaps_addressed: inquiry.data_gaps_addressed,
        delivery_method: 'in_app',
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error storing inquiry:', storeError);
      // Return the inquiry anyway
      return NextResponse.json({
        hasInquiry: true,
        inquiry,
      });
    }

    // Check for feed recommendations to include (Requirement 5.1)
    let feedContent: CuratedContent | undefined;
    const { data: curatedFeed } = await supabase
      .from('curated_feed_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_pushed', false)
      .gte('relevance_score', 0.6)
      .order('relevance_score', { ascending: false })
      .limit(5);

    if (curatedFeed && curatedFeed.length > 0) {
      feedContent = getTopRecommendation(curatedFeed as CuratedContent[]) || undefined;
    }

    const response: InquiryPendingResponse = {
      hasInquiry: true,
      inquiry: {
        ...inquiry,
        id: storedInquiry.id,
        feedContent,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Pending inquiry API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
