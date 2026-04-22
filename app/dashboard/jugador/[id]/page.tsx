import { getSupabaseAdmin } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import PlayerTabs from '@/components/PlayerTabs';
import AnaliticasTab from '@/components/AnaliticasTab';
import EvolucionTab from '@/components/EvolucionTab';

export const dynamic = 'force-dynamic';

export default async function JugadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const [{ data: jugador }, { data: analiticas }, { data: evoluciones }] = await Promise.all([
    supabase.from('jugadores').select('*').eq('id', id).single(),
    supabase.from('analiticas').select('*').eq('jugador_id', id).order('fecha_extraccion', { ascending: false }),
    supabase.from('evoluciones').select('*').eq('jugador_id', id).order('fecha', { ascending: true }),
  ]);

  if (!jugador) notFound();

  return (
    <div className='container'>
      <div className='between topbar'>
        <div>
          <a href='/dashboard' className='muted small' style={{ textDecoration: 'none' }}>← Panel</a>
          <h1 className='heroTitle' style={{ marginTop: 4 }}>{jugador.nombre} {jugador.apellidos}</h1>
          <p className='muted'>{jugador.posicion || 'Sin posición'}{jugador.altura_cm ? ' · '+jugador.altura_cm+' cm' : ''}{jugador.peso_kg ? ' · '+jugador.peso_kg+' kg' : ''}{jugador.porcentaje_grasa ? ' · '+jugador.porcentaje_grasa+'% grasa' : ''}</p>
        </div>
        <form method='post' action='/api/logout'><button className='button secondary'>Salir</button></form>
      </div>

      <div className='stack'>
        <PlayerTabs jugador={jugador} />
      </div>

      <div className='stack' style={{ marginTop: 32 }}>
        <h2 style={{ margin: '0 0 12px' }}>Evolución</h2>
        <EvolucionTab jugadorId={jugador.id} evolucionesIniciales={evoluciones || []} />
      </div>

      <div className='stack' style={{ marginTop: 32 }}>
        <h2 style={{ margin: '0 0 12px' }}>Analíticas de sangre</h2>
        <AnaliticasTab jugadorId={jugador.id} analiticasIniciales={analiticas || []} />
      </div>
    </div>
  );
}