import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import * as XLSX from 'xlsx';

const HOJAS_IGNORAR = ['INFORME19-2-26', 'INFORME 16-3-26', 'Individual'];

function esHojaJugador(nombre: string) {
  return !HOJAS_IGNORAR.some(h => nombre.includes('INFORME') || nombre === 'Individual');
}

function extraerUltimaMedicion(filas: Record<string, any>[]) {
  const validas = filas.filter(f => f['NOMBRE'] && f['FECHA MEDICION'] && f['Peso (Kg)']);
  if (validas.length === 0) return null;
  validas.sort((a, b) => new Date(b['FECHA MEDICION']).getTime() - new Date(a['FECHA MEDICION']).getTime());
  return validas[0];
}

function parsearJugador(hoja: string, filas: Record<string, any>[]) {
  const medicion = extraerUltimaMedicion(filas);
  if (!medicion) return null;

  const nombre = String(medicion['NOMBRE'] || hoja).trim();
  const partes = nombre.split(' ');
  const peso = Number(medicion['Peso (Kg)'] || 0);
  const grasa_faulkner = Number(medicion['% grasa FAULKNER'] || 0);
  const peso_magro = Number(medicion['Peso Magro'] || 0);
  const masa_magra = peso_magro || peso * (1 - grasa_faulkner / 100);

  return {
    _nombre_completo: nombre,
    nombre: partes[0] || nombre,
    apellidos: partes.slice(1).join(' ') || '',
    fecha_nacimiento: medicion['FECHA NACIMIENTO'] ? new Date(medicion['FECHA NACIMIENTO']).toISOString().split('T')[0] : null,
    fecha_ultima_medicion: medicion['FECHA MEDICION'] ? new Date(medicion['FECHA MEDICION']).toISOString().split('T')[0] : null,
    altura_cm: Number(medicion['Estatura (cm)']) || null,
    peso_kg: peso || null,
    porcentaje_grasa: grasa_faulkner || null,
    masa_magra_kg: masa_magra ? Math.round(masa_magra * 10) / 10 : null,
    pliegue_biceps: Number(medicion['Pliegue Biceps']) || null,
    pliegue_triceps: Number(medicion['Pliegue Triceps']) || null,
    pliegue_subescapular: Number(medicion['Pliegue Subescapular']) || null,
    pliegue_cresta_iliaca: Number(medicion['Pliegue Cresta iliaca']) || null,
    pliegue_supraeliaco: Number(medicion['Pliegue Supraeliaco']) || null,
    pliegue_abdominal: Number(medicion['Pliegue Abdominal']) || null,
    pliegue_pantorrilla: Number(medicion['Pliegue Pantorrilla Derecha']) || null,
    pliegue_muslo: Number(medicion['Pliegue Muslo Derecho']) || null,
    suma_6_pliegues: Number(medicion['Suma 6 Pliegues']) || null,
    suma_8_pliegues: Number(medicion['Suma 8 Pliegues']) || null,
    porcentaje_grasa_faulkner: grasa_faulkner || null,
    porcentaje_grasa_yuhasz: Number(medicion['% grasa YUHASZ']) || null,
    peso_oseo: Number(medicion['Peso Oseo']) || null,
    peso_residual: Number(medicion['Peso Residual']) || null,
    peso_graso: Number(medicion['Peso Graso']) || null,
    peso_muscular: Number(medicion['Peso Muscular Lee&cols']) || null,
    peso_magro: peso_magro || null,
    peso_deseable: Number(medicion['Peso deseable']) || null,
    endomorfia: Number(medicion['ENDO']) || null,
    mesomorfia: Number(medicion['MESO']) || null,
    ectomorfia: Number(medicion['ECTO']) || null,
    perimetro_brazo_contraido: Number(medicion['Perimetro Brazo Contraido Derecho']) || null,
    perimetro_pantorrilla: Number(medicion['Perimetro Pantorrilla Derecha']) || null,
    perimetro_muslo: Number(medicion['Perimetro Muslo Derecho']) || null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const archivo = formData.get('file') as File | null;
    const modo = formData.get('modo') as string | null;

    if (!archivo) return NextResponse.json({ error: 'No se recibio ningun archivo' }, { status: 400 });

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    const jugadores: ReturnType<typeof parsearJugador>[] = [];

    for (const nombreHoja of workbook.SheetNames) {
      if (!esHojaJugador(nombreHoja)) continue;
      const hoja = workbook.Sheets[nombreHoja];
      const filas = XLSX.utils.sheet_to_json<Record<string, any>>(hoja, { defval: null, raw: false });
      const jugador = parsearJugador(nombreHoja, filas);
      if (jugador) jugadores.push(jugador);
    }

    if (modo === 'preview') return NextResponse.json({ jugadores });

    const supabase = getSupabaseAdmin();
    const resultados = [];
    const seleccionados: string[] = formData.get('seleccionados') ? JSON.parse(formData.get('seleccionados') as string) : jugadores.map(j => j?._nombre_completo);

    for (const j of jugadores) {
      if (!j || !seleccionados.includes(j._nombre_completo)) continue;
      const { _nombre_completo, ...datos } = j;

      const { data: existente } = await supabase
        .from('jugadores')
        .select('id')
        .ilike('nombre', `%${datos.nombre}%`)
        .limit(1)
        .single();

      if (existente) {
        const { error } = await supabase.from('jugadores').update(datos).eq('id', existente.id);
        resultados.push({ nombre: _nombre_completo, accion: 'actualizado', error: error?.message });
      } else {
        const { error } = await supabase.from('jugadores').insert({ ...datos, factor_actividad: 1.6 });
        resultados.push({ nombre: _nombre_completo, accion: 'creado', error: error?.message });
      }
    }

    return NextResponse.json({ ok: true, resultados });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
