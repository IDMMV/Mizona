import { useMemo, useRef, useState } from 'react';
import {
  Bot, BriefcaseBusiness, Building2, GraduationCap, Lightbulb, Loader2,
  MapPin, MessageSquareText, Send, ShieldCheck, Sparkles, Store, WandSparkles
} from 'lucide-react';
import Card from '../components/Card';

const starters = [
  '¿Qué actividades hay hoy en mi comunidad?',
  'Ayúdame a crear una oferta para mi negocio',
  'Recomiéndame un curso de Excel',
  '¿Cómo publico un producto de forma segura?',
  'Necesito organizar los gastos de mi comité',
  '¿Cómo solicito un viaje o delivery?'
];

const assistants = [
  { id: 'community', icon: Building2, title: 'Comunidad', text: 'Comunicados, eventos, actas, reuniones y organización vecinal.', prompt: 'Ayúdame a organizar una actividad de mi comunidad' },
  { id: 'business', icon: BriefcaseBusiness, title: 'Negocio', text: 'Ofertas, ventas, inventario, clientes y reportes de MiZona Business.', prompt: 'Analiza cómo puedo mejorar las ventas de mi negocio' },
  { id: 'education', icon: GraduationCap, title: 'Aprendizaje', text: 'Rutas de estudio, cursos y ejercicios dentro de CampusHugo.', prompt: 'Crea una ruta de aprendizaje de Excel desde cero' },
  { id: 'local', icon: MapPin, title: 'Zona', text: 'Negocios, beneficios, Marketplace, transporte y servicios cercanos.', prompt: '¿Qué puedo encontrar cerca de mi zona?' }
];

const localReply = prompt => {
  const text = prompt.toLowerCase();
  if (text.includes('comunidad') || text.includes('comité') || text.includes('reunión') || text.includes('gasto')) {
    return 'Para organizarlo dentro de Mi Comunidad: crea una publicación, define fecha y responsables, adjunta el sustento en documentos y registra los gastos por categoría. Después podrás compartir la publicación y exportar el resumen para los vecinos.';
  }
  if (text.includes('negocio') || text.includes('venta') || text.includes('oferta') || text.includes('inventario')) {
    return 'En MiZona Business puedes revisar primero los productos más vendidos y las alertas de stock. Luego crea una oferta con vigencia, público objetivo y cantidad disponible. El panel separa el IGV incluido y permite medir vistas, cupones y ventas.';
  }
  if (text.includes('excel') || text.includes('curso') || text.includes('aprender') || text.includes('estudio')) {
    return 'Te recomiendo iniciar en CampusHugo con Excel desde cero: interfaz y celdas, fórmulas básicas, tablas, gráficos, filtros y luego tablas dinámicas. Completa una práctica por tema antes de avanzar al nivel intermedio.';
  }
  if (text.includes('producto') || text.includes('marketplace') || text.includes('publicar')) {
    return 'Para publicar de forma segura: usa fotos propias, describe el estado real, fija un precio claro, no muestres tu teléfono públicamente y conversa por MiZona Chat. Reúnete en un lugar público y reporta cualquier solicitud sospechosa.';
  }
  if (text.includes('viaje') || text.includes('delivery') || text.includes('envío')) {
    return 'Abre MiZona Ride, confirma origen y destino, compara el tipo de vehículo y verifica conductor, placa y código de seguridad. Para delivery, registra el punto de recojo, entrega y contenido del paquete.';
  }
  if (text.includes('beneficio') || text.includes('descuento') || text.includes('empleo')) {
    return 'En Beneficios puedes filtrar ofertas, empleos, campañas, eventos y cupones por zona. Revisa siempre la vigencia y el responsable antes de guardar, compartir o postular.';
  }
  return 'Puedo ayudarte a encontrar la mejor ruta dentro de MiZona. Indícame si tu necesidad está relacionada con comunidad, chat, beneficios, negocios, Marketplace, CampusHugo, Business o Ride, y te daré pasos concretos.';
};

export default function AiAssistant({ setPage }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: 'Hola José. Soy el asistente de MiZona. Puedo orientarte entre todos los módulos y ayudarte a convertir una necesidad en pasos concretos.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(import.meta.env.VITE_AI_ENDPOINT ? 'Conectado a endpoint seguro' : 'Modo local de demostración');
  const sequence = useRef(2);

  const suggestions = useMemo(() => starters.filter(item => !messages.some(message => message.text === item)).slice(0, 4), [messages]);

  const ask = async promptValue => {
    const prompt = String(promptValue ?? input).trim();
    if (!prompt || loading) return;
    const userMessage = { id: sequence.current++, role: 'user', text: prompt };
    setMessages(current => [...current, userMessage]);
    setInput(''); setLoading(true);
    try {
      const endpoint = import.meta.env.VITE_AI_ENDPOINT;
      let answer;
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prompt, context: 'MiZona Enterprise V8' })
        });
        if (!response.ok) throw new Error('El endpoint de IA no respondió correctamente.');
        const payload = await response.json();
        answer = payload.answer || payload.message || localReply(prompt);
        setMode('Conectado a endpoint seguro');
      } else {
        await new Promise(resolve => setTimeout(resolve, 450));
        answer = localReply(prompt);
      }
      setMessages(current => [...current, { id: sequence.current++, role: 'assistant', text: answer }]);
    } catch (error) {
      setMode('Endpoint no disponible · respuesta local');
      setMessages(current => [...current, { id: sequence.current++, role: 'assistant', text: `${localReply(prompt)}\n\nNota: ${error.message}` }]);
    } finally { setLoading(false); }
  };

  const goTo = module => {
    const pageMap = { community: 'community', business: 'business', education: 'campus', local: 'businesses' };
    setPage?.(pageMap[module] || 'panel');
  };

  return <div className="page aiPage">
    <section className="aiHero">
      <div><p className="eyebrow">Asistente transversal de la plataforma</p><h1>IA MiZona</h1><p>Describe lo que necesitas y recibe una guía práctica usando Comunidad, Beneficios, Negocios, Marketplace, CampusHugo, Business y Ride.</p><div className="aiMode"><Sparkles size={17}/>{mode}</div></div>
      <div className="aiHeroVisual"><div className="aiOrb"><Bot size={52}/></div><span>Resolver</span><span>Organizar</span><span>Aprender</span><span>Crecer</span></div>
    </section>

    <div className="aiLayout">
      <section className="aiChatCard">
        <header><div><WandSparkles size={21}/><div><b>Asistente MiZona</b><span>Orientación general · No reemplaza asesoría profesional</span></div></div><button onClick={() => setMessages(messages.slice(0, 1))}>Nueva conversación</button></header>
        <div className="aiMessages">{messages.map(message => <div key={message.id} className={`aiMessage ${message.role}`}><span>{message.role === 'assistant' ? <Bot size={18}/> : 'JH'}</span><p>{message.text}</p></div>)}{loading && <div className="aiMessage assistant"><span><Bot size={18}/></span><p className="typing"><Loader2 size={17}/>Preparando una respuesta...</p></div>}</div>
        <div className="aiSuggestions">{suggestions.map(item => <button key={item} onClick={() => ask(item)}>{item}</button>)}</div>
        <form className="aiComposer" onSubmit={event => { event.preventDefault(); ask(); }}><textarea value={input} onChange={event => setInput(event.target.value)} placeholder="Ejemplo: necesito organizar una reunión de padres y compartir los acuerdos..." rows="2"/><button disabled={loading || !input.trim()}><Send size={19}/></button></form>
        <footer><ShieldCheck size={15}/>No escribas contraseñas, datos bancarios ni información privada de menores.</footer>
      </section>

      <aside className="aiSide">
        <Card title="Asistentes especializados" icon="✨"><div className="assistantCards">{assistants.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => ask(item.prompt)}><span><Icon size={19}/></span><div><b>{item.title}</b><p>{item.text}</p></div></button>; })}</div></Card>
        <Card title="Abrir módulo" icon="🧭"><div className="aiModuleLinks"><button onClick={() => goTo('community')}><Building2/>Mi Comunidad</button><button onClick={() => goTo('business')}><BriefcaseBusiness/>MiZona Business</button><button onClick={() => goTo('education')}><GraduationCap/>CampusHugo</button><button onClick={() => goTo('local')}><Store/>Negocios cercanos</button></div></Card>
        <Card title="Ideas de uso" icon="💡"><ul className="list"><li>Redactar un comunicado claro.</li><li>Preparar una oferta para un negocio.</li><li>Crear una ruta de aprendizaje.</li><li>Organizar tareas y responsables.</li><li>Encontrar el módulo correcto.</li></ul></Card>
      </aside>
    </div>

    <div className="aiCapabilityGrid"><article><MessageSquareText/><b>Conversación contextual</b><p>Mantiene el hilo de la consulta actual.</p></article><article><Lightbulb/><b>Acciones concretas</b><p>Convierte preguntas en pasos y módulos.</p></article><article><ShieldCheck/><b>Diseño seguro</b><p>El proveedor externo debe conectarse mediante un endpoint del servidor, nunca con una clave visible en el navegador.</p></article></div>
  </div>;
}
