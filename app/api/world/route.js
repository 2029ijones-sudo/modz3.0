import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Save world state
export async function POST(request) {
  try {
    const worldData = await request.json();
    
    const { data, error } = await supabase
      .from('world_states')
      .upsert([{
        id: 'current',
        data: worldData,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Load world state
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('world_states')
      .select('*')
      .eq('id', 'current')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({ 
      success: true, 
      data: data?.data || { objects: [], name: 'Untitled' }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
