import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Debug environment variables
console.log('Supabase URL exists:', !!process.env.SUPABASE_URL);
console.log('Supabase Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Create Supabase client - FIXED with proper null checking
let supabase;
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created successfully');
  } else {
    console.error('Missing Supabase credentials');
    supabase = null;
  }
} catch (error) {
  console.error('Error creating Supabase client:', error);
  supabase = null;
}

// GET all mods
export async function GET() {
  try {
    console.log('GET /api/mods called');
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed. Check environment variables.',
        hint: 'Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('mods')
      .select('id, name, type, data, size, metadata, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    console.log(`Retrieved ${data?.length || 0} mods`);
    return NextResponse.json({ 
      success: true, 
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Unexpected error in GET:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// POST new mod
export async function POST(request) {
  try {
    console.log('POST /api/mods called');
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed'
      }, { status: 500 });
    }

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Validate required fields based on your database schema
    const mod = {
      name: body.name || `mod_${Date.now()}.js`,
      type: body.type || 'javascript',
      data: body.code || body.data || '',
      size: body.size || (body.code ? new Blob([body.code]).size : 0),
      metadata: body.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Note: Don't set ID - let database generate it
    // Note: Don't set id: crypto.randomUUID() - database has DEFAULT gen_random_uuid()
    
    console.log('Inserting mod:', JSON.stringify(mod, null, 2));
    
    const { data, error } = await supabase
      .from('mods')
      .insert([mod])
      .select('id, name, type, data, size, metadata, created_at, updated_at')
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }

    console.log('Mod inserted successfully:', data.id);
    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Mod saved successfully'
    });
  } catch (error) {
    console.error('Unexpected error in POST:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// DELETE mod
export async function DELETE(request) {
  try {
    console.log('DELETE /api/mods called');
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing id parameter'
      }, { status: 400 });
    }

    console.log('Deleting mod with id:', id);
    
    const { error } = await supabase
      .from('mods')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database delete error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Mod deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}
