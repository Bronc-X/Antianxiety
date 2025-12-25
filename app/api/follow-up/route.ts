/**
 * Follow-up Session API
 * 问询会话API端点
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  scheduleSession,
  startSession,
  recordResponse,
  completeSession,
  getPendingSessions,
  getSession,
} from '@/lib/services/follow-up-service';
import type { FollowUpResponse, SessionType } from '@/types/adaptive-plan';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { isAdminToken } from '@/lib/admin-auth';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * GET /api/follow-up
 * Fetch pending sessions for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    const isAdmin = isAdminToken(request.headers);
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (!isAdmin && (authError || !user)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (sessionId) {
      if (!isAdmin) {
        const supabase = getSupabaseClient();
        const ownerId = await getFollowUpSessionOwnerId(supabase as any, sessionId);
        if (!ownerId) {
          return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }
        if (ownerId !== user?.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
      // Get specific session
      const session = await getSession(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({ session });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!isAdmin && userId !== user?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const targetUserId = isAdmin ? (userId || user?.id) : user?.id;
    if (!targetUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const sessions = await getPendingSessions(targetUserId);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Failed to get follow-up sessions:', error);
    return NextResponse.json(
      { error: '让我们稍后再试，你的节奏不会被打乱' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/follow-up
 * Start a new session or schedule one
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, planId, sessionType, sessionId } = body;

    const isAdmin = isAdminToken(request.headers);
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (!isAdmin && (authError || !user)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (action === 'schedule') {
      if (!userId || !planId || !sessionType) {
        return NextResponse.json(
          { error: 'userId, planId, and sessionType are required' },
          { status: 400 }
        );
      }

      if (!isAdmin && userId !== user?.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const targetUserId = isAdmin ? (userId || user?.id) : user?.id;
      if (!targetUserId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
      }

      const supabase = getSupabaseClient();
      const planOwnerId = await getPlanOwnerId(supabase as any, planId);
      if (!planOwnerId) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }
      if (planOwnerId !== targetUserId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const session = await scheduleSession({
        userId: targetUserId,
        planId,
        type: sessionType as SessionType,
      });

      return NextResponse.json({ session }, { status: 201 });
    }

    if (action === 'start') {
      if (!sessionId) {
        return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
      }

      if (!isAdmin) {
        const supabase = getSupabaseClient();
        const ownerId = await getFollowUpSessionOwnerId(supabase as any, sessionId);
        if (!ownerId) {
          return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }
        if (ownerId !== user?.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      const session = await startSession(sessionId);
      return NextResponse.json({ session });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to process follow-up request:', error);
    return NextResponse.json(
      { error: '让我们稍后再试，你的节奏不会被打乱' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/follow-up
 * Record responses or complete session
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, response, sentimentScore, summary } = body;

    const isAdmin = isAdminToken(request.headers);
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (!isAdmin && (authError || !user)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    if (!isAdmin) {
      const supabase = getSupabaseClient();
      const ownerId = await getFollowUpSessionOwnerId(supabase as any, sessionId);
      if (!ownerId) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      if (ownerId !== user?.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (action === 'record') {
      if (!response) {
        return NextResponse.json({ error: 'response is required' }, { status: 400 });
      }

      await recordResponse(sessionId, response as FollowUpResponse);
      return NextResponse.json({ success: true });
    }

    if (action === 'complete') {
      if (sentimentScore === undefined) {
        return NextResponse.json({ error: 'sentimentScore is required' }, { status: 400 });
      }

      const session = await completeSession(sessionId, sentimentScore, summary);
      return NextResponse.json({ session });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update follow-up session:', error);
    return NextResponse.json(
      { error: '让我们稍后再试，你的节奏不会被打乱' },
      { status: 500 }
    );
  }
}

 
async function getPlanOwnerId(
  supabase: any,
  planId: string
): Promise<string | null> {
  const { data: plan } = await supabase
    .from('user_plans')
    .select('user_id')
    .eq('id', planId)
    .maybeSingle();

  return plan?.user_id ?? null;
}

 
async function getFollowUpSessionOwnerId(
  supabase: any,
  sessionId: string
): Promise<string | null> {
  const { data: session } = await supabase
    .from('follow_up_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .maybeSingle();

  return session?.user_id ?? null;
}
