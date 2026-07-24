import { useEffect, useState } from 'react';
import { BookOpen, HandHelping, Users, Building2 } from 'lucide-react';
import Card from '../../components/Card';
import AnimatedCard from '../../components/AnimatedCard';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export default function StudentHome({ setPage }) {
  const { profile } = useApp();
  const [counts, setCounts] = useState({ help: 0, communities: 0, institutions: 0 });
  useEffect(() => { let active = true; Promise.all([
    supabase.from('mz_help_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('mz_communities').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('mz_institutions').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified')
  ]).then(([help, communities, institutions]) => { if (active) setCounts({ help: help.count || 0, communities: communities.count || 0, institutions: institutions.count || 0 }); }); return () => { active = false; }; }, []);
  return <div className="page"><div className="pageTitle"><div><h1>Hola, {profile.displayName}</h1><p className="muted">Aprende, ayuda, conecta y crece con otros estudiantes.</p></div></div>
    <div className="grid3">
      <AnimatedCard onClick={() => setPage('help')}><div className="card" style={{border:0,boxShadow:'none'}}><HandHelping/><h3>Red de ayuda</h3><b>{counts.help}</b><p>Solicitudes abiertas para colaborar.</p></div></AnimatedCard>
      <AnimatedCard delay={0.06} onClick={() => setPage('communities')}><div className="card" style={{border:0,boxShadow:'none'}}><Users/><h3>Comunidades</h3><b>{counts.communities}</b><p>Grupos de estudio e intereses.</p></div></AnimatedCard>
      <AnimatedCard delay={0.12} onClick={() => setPage('institutions')}><div className="card" style={{border:0,boxShadow:'none'}}><Building2/><h3>Instituciones</h3><b>{counts.institutions}</b><p>Colegios, institutos y universidades verificadas.</p></div></AnimatedCard>
    </div>
    <Card title="Tu siguiente paso" icon="🎯"><div className="buttonWrap"><button className="primary" onClick={() => setPage('explore')}><BookOpen size={17}/>Explorar estudiantes</button><button className="ghost" onClick={() => setPage('help')}><HandHelping size={17}/>Pedir ayuda</button></div></Card>
  </div>;
}
