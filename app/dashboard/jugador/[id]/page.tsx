import { getSupabaseAdmin } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import PlayerTabs from '@/components/PlayerTabs';
import AnaliticasTab from '@/components/AnaliticasTab';

export const dynamic = 'force-dynamic';

export default async function JugadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const [{ data: jugador }, { data: analiticas }] = await Promise.all([
    supabase.from('jugadores').select('*').eq('id', id).single(),
    supabase.from('analiticas').select('*').eq('jugador_id', id).order('fecha_extraccion', { ascending: false }),
  ]);

  if (!jugador) notFound();

  return (
    <div className='container'>
      <div className='between topbar'>
        <div>
          <a href='/dashboard' className='muted small' style={{ textDecoration: 'none' }}>← Panel</a>
          <h1 className='heroTitle' style={{ marginTop: 4 }}>{jugador.nombre} {jugador.apellidos}</h1>
          <p className='muted'>{jugador.posicion || 'Sin posición'}{jugador.altura_cm ? ' · ' + jugador.altura_cm + ' cm' : ''}{jugador.peso_kg ? ' · ' + jugador.peso_kg + ' kg' : ''}{jugador.porcentaje_grasa ? ' · ' + jugador.porcentaje_grasa + '% grasa' : ''}</p>
        </div>
        <form method='post' action='/api/logout'><button className='button secondary'>Salir</button></form>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
        <a href={'#perfil'} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 600, color: 'var(--fg)', textDecoration: 'none', borderBottom: '2px solid var(--fg)', marginBottom: -2 }}>Perfil nutricional</a>
        <a href={'#analiticas'} style={{ padding: '8px 16px', fontSize: 14, color: 'var(--muted)', textDecoration: 'none' }}>Analíticas</a>
      </div>

      <div id='perfil' className='stack'>
        <PlayerTabs jugador={jugador} />
      </div>

      <div id='analiticas' className='stack' style={{ marginTop: 32 }}>
        <AnaliticasTab jugadorId={jugador.id} analiticasIniciales={analiticas || []} />
      </div>
    </div>
  );
}