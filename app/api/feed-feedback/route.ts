import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { contentId, contentUrl, contentTitle, source, feedbackType } = body;

        if (!contentId || !feedbackType) {
            return NextResponse.json(
                { success: false, error: 'contentId and feedbackType are required' },
                { status: 400 }
            );
        }

        if (!['bookmark', 'dislike', 'like'].includes(feedbackType)) {
            return NextResponse.json(
                { success: false, error: 'Invalid feedback type' },
                { status: 400 }
            );
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookies) {
                        cookies.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Upsert feedback (toggle if exists)
        const { data: existing } = await supabase
            .from('user_feed_feedback')
            .select('id')
            .eq('user_id', user.id)
            .eq('content_id', contentId)
            .eq('feedback_type', feedbackType)
            .single();

        if (existing) {
            // Remove feedback (toggle off)
            await supabase
                .from('user_feed_feedback')
                .delete()
                .eq('id', existing.id);

            return NextResponse.json({
                success: true,
                action: 'removed',
                feedbackType,
            });
        } else {
            // Add feedback
            const { error: insertError } = await supabase
                .from('user_feed_feedback')
                .insert({
                    user_id: user.id,
                    content_id: contentId,
                    content_url: contentUrl,
                    content_title: contentTitle,
                    source: source,
                    feedback_type: feedbackType,
                });

            if (insertError) {
                console.error('Feedback insert error:', insertError);
                return NextResponse.json(
                    { success: false, error: 'Failed to save feedback' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                action: 'added',
                feedbackType,
            });
        }
    } catch (error) {
        console.error('Feed feedback error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process feedback' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const contentIds = searchParams.get('contentIds')?.split(',') || [];

        if (contentIds.length === 0) {
            return NextResponse.json({ feedback: {} });
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookies) {
                        cookies.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ feedback: {} });
        }

        const { data: feedbackData } = await supabase
            .from('user_feed_feedback')
            .select('content_id, feedback_type')
            .eq('user_id', user.id)
            .in('content_id', contentIds);

        // Transform to {contentId: {bookmark: true, dislike: false}}
        const feedback: Record<string, Record<string, boolean>> = {};
        feedbackData?.forEach((item) => {
            if (!feedback[item.content_id]) {
                feedback[item.content_id] = {};
            }
            feedback[item.content_id][item.feedback_type] = true;
        });

        return NextResponse.json({ feedback });
    } catch (error) {
        console.error('Get feedback error:', error);
        return NextResponse.json({ feedback: {} });
    }
}
