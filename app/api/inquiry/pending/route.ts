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
  generateInquiryQuestion 
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

    // Check if there's a recent unanswered inquiry
    const { data: recentInquiry } = await supabase
      .from('inquiry_history')
      .select('*')
      .eq('user_id', user.id)
      .is('user_response', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentInquiry) {
      // Return existing pending inquiry
      const response: InquiryPendingResponse = {
        hasInquiry: true,
        inquiry: {
          id: recentInquiry.id,
          question_text: recentInquiry.question_text,
          question_type: recentInquiry.question_type,
          priority: recentInquiry.priority,
          data_gaps_addressed: recentInquiry.data_gaps_addressed || [],
          options: [
            { label: '是', value: 'yes' },
            { label: '否', value: 'no' },
          ],
        },
      };
      return NextResponse.json(response);
    }

    // Generate new inquiry based on data gaps
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
    const gaps = identifyDataGaps(recentData);
    
    if (gaps.length === 0) {
      return NextResponse.json({ hasInquiry: false });
    }

    // Generate inquiry question
    const inquiry = generateInquiryQuestion(gaps, phaseGoals || []);
    
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
