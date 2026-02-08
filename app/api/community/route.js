import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET community data (forks, comments, issues)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'forks';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const worldId = searchParams.get('world_id');
    const userId = searchParams.get('user_id');

    let query;
    let countQuery;

    switch (type) {
      case 'forks':
        query = supabase
          .from('world_forks')
          .select(`
            *,
            profiles:forked_by_user_id (
              username,
              profile_picture_url
            )
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        countQuery = supabase
          .from('world_forks')
          .select('*', { count: 'exact', head: true })
          .eq('is_public', true);

        if (worldId) {
          query = query.eq('original_world_state_id', worldId);
          countQuery = countQuery.eq('original_world_state_id', worldId);
        }
        if (userId) {
          query = query.eq('forked_by_user_id', userId);
          countQuery = countQuery.eq('forked_by_user_id', userId);
        }
        break;

      case 'comments':
        query = supabase
          .from('world_comments')
          .select(`
            *,
            profiles:user_id (
              username,
              profile_picture_url
            ),
            replies:world_comments!parent_comment_id (
              id,
              content,
              created_at,
              profiles:user_id (
                username,
                profile_picture_url
              )
            )
          `)
          .is('parent_comment_id', null)
          .order('created_at', { ascending: false });

        countQuery = supabase
          .from('world_comments')
          .select('*', { count: 'exact', head: true })
          .is('parent_comment_id', null);

        if (worldId) {
          query = query.or(`world_fork_id.eq.${worldId},world_state_id.eq.${worldId}`);
          countQuery = countQuery.or(`world_fork_id.eq.${worldId},world_state_id.eq.${worldId}`);
        }
        break;

      case 'issues':
        query = supabase
          .from('world_issues')
          .select(`
            *,
            profiles:reported_by_user_id (
              username,
              profile_picture_url
            )
          `)
          .order('created_at', { ascending: false });

        countQuery = supabase
          .from('world_issues')
          .select('*', { count: 'exact', head: true });

        if (worldId) {
          query = query.or(`world_fork_id.eq.${worldId},world_state_id.eq.${worldId}`);
          countQuery = countQuery.or(`world_fork_id.eq.${worldId},world_state_id.eq.${worldId}`);
        }
        if (userId) {
          query = query.eq('reported_by_user_id', userId);
          countQuery = countQuery.eq('reported_by_user_id', userId);
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

    const [dataResult, countResult] = await Promise.all([
      query.range(offset, offset + limit - 1),
      countQuery
    ]);

    if (dataResult.error) throw dataResult.error;

    return NextResponse.json({
      data: dataResult.data,
      pagination: {
        page,
        limit,
        total: countResult.count || 0,
        totalPages: Math.ceil((countResult.count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching community data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community data' },
      { status: 500 }
    );
  }
}

// POST - Create community content
export async function POST(request) {
  try {
    const body = await request.json();
    const { type } = body;

    let tableName;
    let insertData;

    switch (type) {
      case 'fork':
        tableName = 'world_forks';
        insertData = {
          original_world_state_id: body.world_id,
          forked_by_user_id: body.user_id,
          name: body.name,
          description: body.description,
          data: body.data,
          tags: body.tags || [],
          is_public: body.is_public !== false
        };
        break;

      case 'comment':
        tableName = 'world_comments';
        insertData = {
          world_fork_id: body.world_fork_id,
          world_state_id: body.world_state_id,
          user_id: body.user_id,
          content: body.content,
          parent_comment_id: body.parent_comment_id
        };
        break;

      case 'issue':
        tableName = 'world_issues';
        insertData = {
          world_fork_id: body.world_fork_id,
          world_state_id: body.world_state_id,
          reported_by_user_id: body.user_id,
          title: body.title,
          description: body.description,
          priority: body.priority || 'medium',
          category: body.category || 'other'
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error creating community content:', error);
    return NextResponse.json(
      { error: 'Failed to create community content' },
      { status: 500 }
    );
  }
}
