// app/api/admin/templates/route.ts
import { NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createServer();
  
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('name');
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createServer();
  const template = await request.json();
  
  // Generate ID if not provided
  if (!template.id) {
    template.id = crypto.randomUUID();
  }
  
  const { data, error } = await supabase
    .from('templates')
    .insert(template)
    .select()
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}