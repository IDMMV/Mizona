import { ShieldAlert } from 'lucide-react';
import Card from '../components/Card';

export default function AccessDenied({ setPage }) {
  return <div className="page accessDeniedPage">
    <Card title="Acceso restringido" icon="🛡️">
      <div className="accessDeniedContent">
        <ShieldAlert size={54}/>
        <h2>Este módulo requiere rol administrador</h2>
        <p>La sesión actual no tiene permiso para abrir el Centro de Control. Los permisos se verifican con el perfil guardado en Supabase.</p>
        <button className="primary" onClick={() => setPage('settings')}>Ir a Mi Cuenta</button>
      </div>
    </Card>
  </div>;
}
