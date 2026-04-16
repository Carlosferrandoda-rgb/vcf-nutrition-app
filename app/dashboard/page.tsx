import { getSupabaseAdmin } from '@/lib/supabase-server';
import PlayerForm from '@/components/PlayerForm';
import FoodCalculator from '@/components/FoodCalculator';
import ExcelImporter from '@/components/ExcelImporter';

function statusBadge(ratio: number) {
  if (ratio >= 0.9) return { text: 'Bien', cls: 'ok' };
  if (ratio >= 0.75) return { text: 'Atención', cls: 'warn' };
  return { text: 'Riesgo', cls: 'bad' };
}

export default async function Dashboard({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {

  const params = (await searchParams) || {};
  const selectedId = params.player;
  const supabase = getSupabaseAdmin();
  const { data: players } = await supabase
    .from('jugadores')
    .select('id,nombre,apellidos,posicion,kcal_objetivo,cho_objetivo_g,proteina_objetivo_g,grasa_objetivo_g,agua_objetivo_ml,peso_kg,porcentaje_grasa,masa_magra_kg,altura_cm,gustos_preferencias,contexto_clinico,objetivo,factor_actividad')
    .order('nombre');

  const selected = selectedId ? players?.find((p) => String(p.id) === String(selectedId)) : players?.[0] ?? null;
  const totalPlayers = players?.length ?? 0;

  return (
    <div className="container">
      <div className="between topbar">
        <div>
          <h1 className="heroTitle">Panel VCF Nutrición</h1>
          <p className="muted">Versión base profesional para Vercel + Supabase. Sin acceso público de jugadores.</p>
        </div>
        <form method="post" action="/api/logout"><button className="button secondary">Salir</button></form>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="kpi"><span className="muted small">Jugadores activos</span><strong>{totalPlayers}</strong></div>
        <div className="kpi"><span className="muted small">Objetivo kcal medio</span><strong>{players?.length ? Math.round(players.reduce((a, p) => a + Number(p.kcal_objetivo || 0), 0) / players.length) : 0}</strong></div>
        <div className="kpi"><span className="muted small">Acceso</span><strong>Solo staff</strong></div>
      </div>

      <div className="grid grid-2">
        <div className="stack">
          <div className="card stack">
            <div className="between">
              <h3 style={{ margin: 0 }}>Jugadores</h3>
              <a className="button secondary" href="/dashboard">Nuevo</a>
            </div>
            <div className="stack">
              {players?.map((player) => {
                const ratio = Number(player.kcal_objetivo || 0) / Math.max(Number(player.kcal_objetivo || 1), 1);
                const badge = statusBadge(ratio);
                const active = selected && String(selected.id) === String(player.id);
                return (
                  <a key={player.id} href={`/dashboard?player=${player.id}`} className={`playerItem ${active ? 'active' : ''}`}>
                    <div className="between">
                      <strong>{player.nombre} {player.apellidos}</strong>
                      <span className={`badge ${badge.cls}`}>{badge.text}</span>
                    </div>
                    <div className="small muted">{player.posicion || 'Sin posición'} · {player.kcal_objetivo || 0} kcal</div>
                  </a>
                );
              })}
            </div>
          </div>
          <FoodCalculator />
        </div>

        <div className="stack">
          <PlayerForm initial={selected} />
          <div className="card stack">
            <h3 style={{ margin: 0 }}>Resumen del jugador</h3>
            {selected ? (
              <div className="grid grid-3">
                <div className="kpi"><span className="muted small">Peso / % grasa</span><strong>{selected.peso_kg ?? '—'} / {selected.porcentaje_grasa ?? '—'}</strong></div>
                <div className="kpi"><span className="muted small">Masa magra</span><strong>{selected.masa_magra_kg ?? '—'} kg</strong></div>
                <div className="kpi"><span className="muted small">Agua objetivo</span><strong>{selected.agua_objetivo_ml ?? '—'} ml</strong></div>
              </div>
            ) : <p className="muted">Añade tu primer jugador.</p>}
          </div>
          <ExcelImporter />
        </div>
      </div>
    </div>
  );
}
