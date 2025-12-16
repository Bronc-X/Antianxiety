/**
 * Content Curation Cron Job API
 * 
 * Runs daily via Vercel Cron to curate personalized content for each active user.
 * Fetches content from Semantic Scholar based on user Phase Goals.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.5
 * Property 15: Content Curation Pipeline
 * Property 16: Inactive User Curation Reduction
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for Pro plan

// Semantic Scholar API
const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1';

// Goal to search query mapping
const GOAL_SEARCH_QUERIES: Record<string, string[]> = {
  sleep: ['sleep quality improvement', 'circadian rhythm optimization', 'insomnia treatment'],
  energy: ['energy metabolism', 'fatigue management', 'mitochondrial function'],
  stress: ['stress reduction techniques', 'cortisol management', 'anxiety treatment'],
  weight: ['weight management', 'metabolic health', 'obesity prevention'],
  fitness: ['exercise physiology', 'muscle recovery', 'cardiovascular health'],
};

// Inactive threshold in days
const INACTIVE_THRESHOLD_DAYS = 7;

interface PhaseGoal {
  id: string;
  user_id: string;
  goal_type: string;
  priority: number;
  title: string;
}

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract?: string;
  url?: string;
  year?: number;
  citationCount?: number;
}

interface CurationResult {
  totalUsers: number;
  processedUsers: number;
  skippedInactiveUsers: number;
  totalContentCurated: number;
  errors: string[];
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow both Vercel Cron (no auth) and manual calls with secret
  if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runCuration();
}

export async function POST(request: NextRequest) {
  // For manual triggering with API key
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runCuration();
}

async function runCuration(): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Create Supabase client with service role for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase configuration' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const result: CurationResult = {
      totalUsers: 0,
      processedUsers: 0,
      skippedInactiveUsers: 0,
      totalContentCurated: 0,
      errors: [],
    };

    // Get cutoff date for active users
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVE_THRESHOLD_DAYS);

    // Get all users with phase goals
    const { data: usersWithGoals, error: usersError } = await supabase
      .from('phase_goals')
      .select('user_id')
      .order('user_id');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ 
        error: 'Failed to fetch users',
        details: usersError.message 
      }, { status: 500 });
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(usersWithGoals?.map(u => u.user_id) || [])];
    result.totalUsers = uniqueUserIds.length;

    // Process each user
    for (const userId of uniqueUserIds) {
      try {
        // Check if user is active (has recent calibration or profile update)
        const { data: recentActivity } = await supabase
          .from('daily_calibrations')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', cutoffDate.toISOString())
          .limit(1);

        if (!recentActivity || recentActivity.length === 0) {
          // Check profile update as fallback
          const { data: profile } = await supabase
            .from('profiles')
            .select('updated_at')
            .eq('id', userId)
            .single();

          if (!profile || new Date(profile.updated_at) < cutoffDate) {
            result.skippedInactiveUsers++;
            continue; // Skip inactive users (Requirement 6.5)
          }
        }

        // Get user's phase goals
        const { data: goals } = await supabase
          .from('phase_goals')
          .select('*')
          .eq('user_id', userId);

        if (!goals || goals.length === 0) {
          continue;
        }

        // Curate content for each goal
        let userContentCount = 0;
        
        for (const goal of goals as PhaseGoal[]) {
          const queries = GOAL_SEARCH_QUERIES[goal.goal_type] || [];
          
          // Use first query for each goal to limit API calls
          const query = queries[0];
          if (!query) continue;

          try {
            // Fetch from Semantic Scholar
            const response = await fetch(
              `${SEMANTIC_SCHOLAR_API}/paper/search?query=${encodeURIComponent(query)}&limit=3&fields=paperId,title,abstract,url,year,citationCount`,
              {
                headers: {
                  'User-Agent': 'NoMoreAnxious/1.0',
                },
              }
            );

            if (!response.ok) {
              console.warn(`Semantic Scholar API error for query: ${query}`);
              continue;
            }

            const data = await response.json();
            const papers: SemanticScholarPaper[] = data.data || [];

            // Store curated content
            for (const paper of papers) {
              // Calculate relevance score
              const yearScore = paper.year ? Math.min((paper.year - 2015) / 10, 1) : 0.5;
              const citationScore = paper.citationCount 
                ? Math.min(paper.citationCount / 100, 1) 
                : 0.3;
              const relevanceScore = (yearScore * 0.4 + citationScore * 0.6);

              // Only store if above threshold
              if (relevanceScore >= 0.5) {
                const { error: insertError } = await supabase
                  .from('curated_feed_queue')
                  .upsert({
                    user_id: userId,
                    content_type: 'paper',
                    title: paper.title,
                    summary: paper.abstract?.substring(0, 500),
                    url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
                    source: 'Semantic Scholar',
                    relevance_score: relevanceScore,
                    matched_goals: [goal.goal_type],
                    relevance_explanation: `与「${goal.title}」目标相关的研究`,
                    is_pushed: false,
                    is_read: false,
                  }, {
                    onConflict: 'user_id,title',
                    ignoreDuplicates: true,
                  });

                if (!insertError) {
                  userContentCount++;
                }
              }
            }

            // Rate limiting: wait 100ms between API calls
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (fetchError) {
            console.warn(`Error fetching content for query ${query}:`, fetchError);
          }
        }

        result.totalContentCurated += userContentCount;
        result.processedUsers++;
        
      } catch (userError) {
        const errorMsg = `Error processing user ${userId}: ${userError}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    const executionTime = Date.now() - startTime;
    
    console.log('Content curation completed:', {
      ...result,
      executionTimeMs: executionTime,
    });

    return NextResponse.json({
      success: true,
      ...result,
      executionTimeMs: executionTime,
      executedAt: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Content curation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
