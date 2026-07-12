import { ShieldAlert, ShieldCheck } from 'lucide-react';
import Card from '../components/Card';

export default function AccessDenied({ setPage }) {
  return <div className="page accessDeniedPage">
    <Card title="Acceso restringido" icon={<ShieldCheck size={18}/>}>
      <div className="accessDeniedContent">
        <ShieldAlert size={54}/>
        <h2>Este módulo no está disponible para este perfil</h2>
        <p>MiZona oculta módulos de adultos, administración, negocios y comités cuando el perfil activo es estudiantil. Cambia a un perfil adulto o administrador desde el Laboratorio local.</p>
        <button className="primary" onClick={() => setPage('localLab')}>Ir al Laboratorio local</button>
      </div>
    </Card>
  </div>;
}
