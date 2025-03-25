// app/api/admin/templates/[id]/route.ts
import { NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServer();
  
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', params.id)
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServer();
  const template = await request.json();
  
  const { data, error } = await supabase
    .from('templates')
    .update(template)
    .eq('id', params.id)
    .select()
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServer();
  
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', params.id);
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}