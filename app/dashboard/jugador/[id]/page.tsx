import { getSupabaseAdmin } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import PlayerTabs from '@/components/PlayerTabs';

export default async function JugadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: jugador } = await supabase.from('jugadores').select('*').eq('id', id).single();
  if (!jugador) notFound();
  return (
    <div className="container">
      <div className="between topbar">
        <div>
          <a href="/dashboard" className="muted small" style={{ textDecoration: 'none' }}>← Panel</a>
          <h1 className="heroTitle" style={{ marginTop: 4 }}>{jugador.nombre} {jugador.apellidos}</h1>
          <p className="muted">{jugador.posicion || 'Sin posición'}{jugador.altura_cm ? ' · ' + jugador.altura_cm + ' cm' : ''}{jugador.peso_kg ? ' · ' + jugador.peso_kg + ' kg' : ''}{jugador.porcentaje_grasa ? ' · ' + jugador.porcentaje_grasa + '% grasa' : ''}</p>
        </div>
        <form method="post" action="/api/logout"><button className="button secondary">Salir</button></form>
      </div>
      <PlayerTabs jugador={jugador} />
    </div>
  );
}