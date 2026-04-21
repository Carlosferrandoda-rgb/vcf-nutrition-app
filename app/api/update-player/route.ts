import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const CAMPOS_PERMITIDOS = [
  'notas_hidratacion',
  'notas_suplementacion', 
  'notas_protocolos',
  'gustos_preferencias',
  'contexto_clinico',
  'objetivo',
  'posicion',
];

export async function POST(req: NextRequest) {
  try {
    const { id, field, value } = await req.json();
    if (!id || !field || !CAMPOS_PERMITIDOS.includes(field)) {
      return NextResponse.json({ error: 'Campo no permitido' }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('jugadores').update({ [field]: value }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}