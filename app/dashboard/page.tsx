import { getSupabaseAdmin } from '@/lib/supabase-server';
import PlayerForm from '@/components/PlayerForm';
import FoodCalculator from '@/components/FoodCalculator';
import ExcelImporter from '@/components/ExcelImporter';
import AnthroImporter from '@/components/AnthroImporter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Dashboard() {
  const supabase = getSupabaseAdmin();
  const { data: players, error } = await supabase
    .from('jugadores')
    .select('id,nombre,apellidos,posicion,kcal_objetivo,peso_kg,porcentaje_grasa,masa_magra_kg,altura_cm,gustos_preferencias,contexto_clinico,objetivo,factor_actividad,cho_objetivo_g,proteina_objetivo_g,grasa_objetivo_g,agua_objetivo_ml')
    .order('nombre');

  const totalPlayers = players?.length ?? 0;
  const avgKcal = players?.length ? Math.round(players.reduce((a, p) => a + Number(p.kcal_objetivo || 0), 0) / players.length) : 0;

  return (
    <div className="container">
      <div className="between topbar">
        <div>
          <h1 className="heroTitle">Panel VCF Nutrición</h1>
          <p className="muted">Temporada 2025/26 · Solo staff</p>
        </div>
        <form method="post" action="/api/logout"><button className="button secondary">Salir</button></form>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="kpi"><span className="muted small">Jugadores activos</span><strong>{totalPlayers}</strong></div>
        <div className="kpi"><span className="muted small">Kcal medio equipo</span><strong>{avgKcal || '—'}</strong></div>
        <div className="kpi"><span className="muted small">Acceso</span><strong>Solo staff</strong></div>
      </div>

      <div className="grid grid-2">
        <div className="stack">
          <div className="card stack">
            <div className="between">
              <h3 style={{ margin: 0 }}>Jugadores</h3>
              <a className="button secondary" href="/dashboard">+ Nuevo</a>
            </div>
            {players && players.length > 0 ? (
              <div className="stack" style={{ gap: 4 }}>
                {players.map((player) => (
                  <a key={player.id} href={'/dashboard/jugador/' + player.id}
                    style={{ display: 'block', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                    <div className="between">
                      <strong style={{ fontSize: 14 }}>{player.nombre} {player.apellidos}</strong>
                      <span className="muted small">{player.kcal_objetivo ? player.kcal_objetivo + ' kcal' : '—'}</span>
                    </div>
                    <div className="muted small" style={{ marginTop: 2 }}>
                      {player.posicion || 'Sin posición'}{player.peso_kg ? ' · ' + player.peso_kg + ' kg' : ''}{player.porcentaje_grasa ? ' · ' + player.porcentaje_grasa + '% grasa' : ''}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="muted small" style={{ color: 'red' }}>Sin jugadores. Error: {error?.message || 'ninguno'}</p>
            )}
          </div>
          <FoodCalculator />
        </div>
        <div className="stack">
          <PlayerForm initial={null} />
          <AnthroImporter />
          <ExcelImporter />
        </div>
      </div>
    </div>
  );
}