import { hasSupabase } from './supabase';
export function runReleaseChecks(){const checks=[
 {id:'https',label:'HTTPS o entorno local seguro',ok:window.isSecureContext||location.hostname==='localhost'},
 {id:'supabase',label:'Variables de Supabase configuradas',ok:hasSupabase},
 {id:'storage',label:'Storage disponible en navegador',ok:typeof localStorage!=='undefined'},
 {id:'share',label:'Compartir nativo o portapapeles',ok:Boolean(navigator.share||navigator.clipboard)},
 {id:'geo',label:'Geolocalización disponible',ok:'geolocation' in navigator},
 {id:'media',label:'Cámara y micrófono disponibles',ok:Boolean(navigator.mediaDevices?.getUserMedia)},
 {id:'online',label:'Conexión activa',ok:navigator.onLine}
]; return {checks,passed:checks.filter(x=>x.ok).length,total:checks.length,generatedAt:new Date().toISOString()};}
