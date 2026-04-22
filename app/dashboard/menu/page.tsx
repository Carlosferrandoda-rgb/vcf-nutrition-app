import { getSupabaseAdmin } from '@/lib/supabase-server';
import MenuSemanal from '@/components/MenuSemanal';

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const supabase = getSupabaseAdmin();
  const { data: menus } = await supabase
    .from('menu_semanal')
    .select('*')
    .order('semana', { ascending: false })
    .limit(10);
  return (
    <div className='container'>
      <div className='between topbar'>
        <div>
          <a href='/dashboard' className='muted small' style={{ textDecoration: 'none' }}>← Panel</a>
          <h1 className='heroTitle' style={{ marginTop: 4 }}>Menú Ciudad Deportiva</h1>
          <p className='muted'>Comedor del primer equipo · Comida y cena</p>
        </div>
        <form method='post' action='/api/logout'><button className='button secondary'>Salir</button></form>
      </div>
      <MenuSemanal menusIniciales={menus || []} />
    </div>
  );
}