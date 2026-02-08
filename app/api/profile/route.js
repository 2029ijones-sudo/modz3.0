import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET profile for current user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const username = searchParams.get('username');

    let query = supabase.from('profiles').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (username) {
      query = query.eq('username', username);
    } else {
      return NextResponse.json(
        { error: 'user_id or username parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ profile: null }, { status: 200 });
      }
      throw error;
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// POST - Create or update profile
export async function POST(request) {
  try {
    const { user_id, username, bio, profile_picture_url } = await request.json();

    if (!user_id || !username) {
      return NextResponse.json(
        { error: 'user_id and username are required' },
        { status: 400 }
      );
    }

    // Check if username is taken by another user
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .neq('user_id', user_id)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }

    // Upsert profile
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        user_id,
        username,
        bio,
        profile_picture_url
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error('Error creating/updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create/update profile' },
      { status: 500 }
    );
  }
}
