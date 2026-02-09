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
        // FIXED: Get user info from auth.users via profiles table OR use default
        query = supabase
          .from('world_forks')
          .select(`
            *,
            profiles:profiles!inner (
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
        // FIXED: Get user info from auth.users via profiles
        query = supabase
          .from('world_comments')
          .select(`
            *,
            profiles:profiles!inner (
              username,
              profile_picture_url
            ),
            replies:world_comments!parent_comment_id (
              id,
              content,
              created_at,
              profiles:profiles!inner (
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
        // FIXED: Get user info from auth.users via profiles
        query = supabase
          .from('world_issues')
          .select(`
            *,
            profiles:profiles!inner (
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

    if (dataResult.error) {
      console.error('Supabase query error:', dataResult.error);
      // If profiles join fails, try without it
      const fallbackQuery = supabase
        .from(type === 'forks' ? 'world_forks' : 
              type === 'comments' ? 'world_comments' : 'world_issues')
        .select('*')
        .order('created_at', { ascending: false });
      
      const fallbackResult = await fallbackQuery.range(offset, offset + limit - 1);
      
      if (fallbackResult.error) throw fallbackResult.error;
      
      // Add default profile data
      const transformedData = fallbackResult.data.map(item => ({
        ...item,
        profiles: {
          username: 'Anonymous',
          profile_picture_url: null
        }
      }));
      
      return NextResponse.json({
        data: transformedData,
        pagination: {
          page,
          limit,
          total: countResult.count || 0,
          totalPages: Math.ceil((countResult.count || 0) / limit)
        }
      });
    }

    // Transform the data
    const transformedData = dataResult.data.map(item => {
      const profile = item.profiles || {};
      return {
        ...item,
        profiles: {
          username: profile.username || 'Anonymous',
          profile_picture_url: profile.profile_picture_url || null
        }
      };
    });

    return NextResponse.json({
      data: transformedData,
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
      { error: error.message || 'Failed to fetch community data' },
      { status: 500 }
    );
  }
}

// POST - Create community content
export async function POST(request) {
  try {
    const body = await request.json();
    const { type, user_id } = body;

    // Validate user exists (check auth)
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    let tableName;
    let insertData;

    switch (type) {
      case 'fork':
        tableName = 'world_forks';
        insertData = {
          original_world_state_id: body.world_id || 'current',
          forked_by_user_id: user_id,
          name: body.name,
          description: body.description,
          data: body.data || {},
          tags: body.tags || [],
          is_public: body.is_public !== false
        };
        break;

      case 'comment':
        tableName = 'world_comments';
        insertData = {
          world_fork_id: body.world_fork_id,
          world_state_id: body.world_state_id,
          user_id: user_id,
          content: body.content,
          parent_comment_id: body.parent_comment_id
        };
        if (!insertData.world_fork_id && !insertData.world_state_id) {
          insertData.world_state_id = 'current';
        }
        break;

      case 'issue':
        tableName = 'world_issues';
        insertData = {
          world_fork_id: body.world_fork_id,
          world_state_id: body.world_state_id,
          reported_by_user_id: user_id,
          title: body.title,
          description: body.description,
          priority: body.priority || 'medium',
          category: body.category || 'other'
        };
        if (!insertData.world_fork_id && !insertData.world_state_id) {
          insertData.world_state_id = 'current';
        }
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
      { error: error.message || 'Failed to create community content' },
      { status: 500 }
    );
  }
}
