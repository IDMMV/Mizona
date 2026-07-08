import { Cloud, LockKeyhole, UserPlus } from 'lucide-react';
import Account from './Account';

export default function CloudAuthGate() {
  return <div className="authGate"><div className="authGateIntro"><div className="logo large">MZ</div><h1>MiZona en la nube</h1><p>Inicia sesión o crea una cuenta para acceder a los datos reales de Supabase.</p><div className="authBenefits"><span><Cloud size={18}/> Sincronización entre dispositivos</span><span><LockKeyhole size={18}/> Sesión y permisos reales</span><span><UserPlus size={18}/> Usuario único por persona</span></div></div><div className="authGatePanel"><Account initialTab="access" cloudOnly/></div></div>;
}
