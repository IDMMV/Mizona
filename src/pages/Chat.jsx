import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Ban, BarChart3, CalendarDays, Camera, Check, ChevronLeft,
  CircleUserRound, ClipboardCheck, Contact, Download, File, FileText, FileUp, Image,
  Info, Link, ListTodo, Loader2, MapPin, Maximize2, MessageCircle,
  MessageSquarePlus, Mic, Minimize2, MoreVertical, Palette, Paperclip, Phone,
  Plus, RefreshCw, Search, Send, Settings, ShieldCheck, ShoppingBag,
  SlidersHorizontal, Star, Store, UserPlus, Users, X, Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { APP_VERSION } from '../version.js';
import { listCommunities, listMyMemberships, loadCommunityBundle } from '../lib/community';
import {
  blockChatUser, unblockChatUser, createChatGroup, findChatProfileExact, leaveConversation,
  loadChatContacts, loadChatRequests, loadConversations, loadMessages, markConversationRead,
  openChatAttachment, reportChatItem, resolveChatAttachmentUrl, reviewContactRequest, sendChatFile,
  sendContactRequest, sendTextMessage, startDirectConversation, subscribeToChat
} from '../lib/chat';

const formatTime = value => {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

const formatMessageHour = value => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
};

const formatChatDateLabel = value => {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
};

const mapsUrl = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
const osmEmbedUrl = (lat, lng, zoom = 16) => {
  const delta = zoom >= 16 ? 0.006 : zoom >= 14 ? 0.02 : 0.06;
  const bbox = [Number(lng)-delta, Number(lat)-delta, Number(lng)+delta, Number(lat)+delta].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
};
const reverseGeocode = async (lat, lng) => {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`, { headers: { 'Accept-Language':'es' } });
  if (!response.ok) throw new Error('No se pudo obtener la dirección.');
  const data = await response.json();
  return { name: data.name || data.address?.road || data.address?.suburb || 'Ubicación actual', address: data.display_name || `${lat}, ${lng}` };
};
const searchMapPlaces = async (query, lat, lng) => {
  const viewbox = `${Number(lng)-0.25},${Number(lat)+0.25},${Number(lng)+0.25},${Number(lat)-0.25}`;
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=12&addressdetails=1&bounded=0&viewbox=${encodeURIComponent(viewbox)}&q=${encodeURIComponent(query)}`, { headers: { 'Accept-Language':'es' } });
  if (!response.ok) throw new Error('No se pudo buscar lugares.');
  return (await response.json()).map(item => ({ id:`osm-${item.osm_type}-${item.osm_id}`, name:item.name || item.display_name.split(',')[0], address:item.display_name, lat:Number(item.lat), lng:Number(item.lon), type:item.type || item.category }));
};
const loadNearbyPlaces = async (lat, lng) => {
  const query = `[out:json][timeout:12];(node(around:1800,${lat},${lng})[name][amenity];node(around:1800,${lat},${lng})[name][shop];node(around:1800,${lat},${lng})[name][tourism];);out center 18;`;
  const response = await fetch('https://overpass-api.de/api/interpreter', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body:`data=${encodeURIComponent(query)}` });
  if (!response.ok) throw new Error('No se pudieron cargar lugares cercanos.');
  const data = await response.json();
  return (data.elements || []).map(item => ({ id:`overpass-${item.type}-${item.id}`, name:item.tags?.name || 'Lugar cercano', address:[item.tags?.['addr:street'],item.tags?.['addr:housenumber'],item.tags?.['addr:district'],item.tags?.['addr:city']].filter(Boolean).join(' ') || item.tags?.amenity || item.tags?.shop || item.tags?.tourism || 'Cerca de ti', lat:Number(item.lat || item.center?.lat), lng:Number(item.lon || item.center?.lon), type:item.tags?.amenity || item.tags?.shop || item.tags?.tourism })).filter(item=>Number.isFinite(item.lat)&&Number.isFinite(item.lng));
};

const MZ_STRUCT_PREFIX = '[[MZCHAT:1]]';
const newId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const encodeStructured = (type, data = {}) => `${MZ_STRUCT_PREFIX}${JSON.stringify({ type, ...data })}`;
const parseStructured = body => {
  const text = String(body || '');
  if (!text.startsWith(MZ_STRUCT_PREFIX)) return null;
  try { return JSON.parse(text.slice(MZ_STRUCT_PREFIX.length)); } catch { return null; }
};
const structuredPreview = body => {
  const data = parseStructured(body);
  if (!data) return body || '';
  const labels = { location: data.live ? 'Ubicación en tiempo real' : 'Ubicación', contact: `Contacto: ${data.name || ''}`, poll: `Encuesta: ${data.question || ''}`, poll_vote: 'Voto actualizado', event: `Evento: ${data.title || ''}`, event_rsvp: 'Respuesta a evento', order: `Pedido: ${data.item || ''}`, order_status: `Pedido ${data.status || ''}`, catalog: `Catálogo: ${data.item || ''}`, poll_close: 'Encuesta cerrada', event_cancel: 'Evento cancelado', location_stop: 'Ubicación en vivo finalizada' };
  return labels[data.type] || 'Elemento del chat';
};
const openWhatsAppShare = text => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
const shareText = async ({ title, text, url }) => {
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return true; } catch (error) { if (error?.name !== 'AbortError') throw error; return false; }
  }
  if (navigator.clipboard) await navigator.clipboard.writeText([text, url].filter(Boolean).join('\n'));
  return false;
};
const downloadCalendarEvent = data => {
  const compact = value => String(value || '').replaceAll('-', '').replaceAll(':', '').slice(0, 15);
  const start = data.date ? `${compact(data.date)}T${compact(data.time || '09:00')}00` : compact(new Date().toISOString()).slice(0, 8) + 'T090000';
  const endDate = new Date(`${data.date || new Date().toISOString().slice(0,10)}T${data.time || '09:00'}:00`);
  endDate.setHours(endDate.getHours() + 1);
  const end = `${endDate.getFullYear()}${String(endDate.getMonth()+1).padStart(2,'0')}${String(endDate.getDate()).padStart(2,'0')}T${String(endDate.getHours()).padStart(2,'0')}${String(endDate.getMinutes()).padStart(2,'0')}00`;
  const escapeIcs = value => String(value || '').replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MiZona//Chat Event//ES','BEGIN:VEVENT',`UID:${data.eventId || newId('event')}@mizona`,`DTSTART:${start}`,`DTEND:${end}`,`SUMMARY:${escapeIcs(data.title)}`,`LOCATION:${escapeIcs(data.place)}`,`DESCRIPTION:${escapeIcs(data.description)}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${String(data.title || 'evento').replace(/[^a-z0-9_-]+/gi,'_')}.ics`; link.click(); URL.revokeObjectURL(url);
};

const formatBytes = value => {
  const bytes = Number(value || 0);
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const initials = value => String(value || 'U').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

const CHAT_THEME_DEFAULT = {
  accent: '#f2b318',
  background: '#08111b',
  wallpaper: 'radial-gradient(circle at 20% 18%, rgba(242,179,24,.08), transparent 0 26%), radial-gradient(circle at 82% 0%, rgba(59,130,246,.10), transparent 0 24%), linear-gradient(180deg, rgba(8,17,27,.98), rgba(8,17,27,.98))',
  surface: '#111925',
  header: '#111925',
  composer: '#111925',
  text: '#f8fafc',
  subtext: '#94a3b8'
};

const CHAT_ACCENTS = ['#f2b318', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];
const CHAT_WALLPAPERS = [
  { id: 'carbon', label: 'Carbón', value: CHAT_THEME_DEFAULT.wallpaper },
  { id: 'navy', label: 'Navy', value: 'radial-gradient(circle at 15% 15%, rgba(59,130,246,.10), transparent 0 28%), radial-gradient(circle at 82% 0%, rgba(148,163,184,.08), transparent 0 22%), linear-gradient(180deg, rgba(8,17,27,.98), rgba(8,17,27,.98))' },
  { id: 'amber', label: 'Ámbar', value: 'radial-gradient(circle at 20% 18%, rgba(242,179,24,.10), transparent 0 28%), radial-gradient(circle at 80% 0%, rgba(249,115,22,.08), transparent 0 24%), linear-gradient(180deg, rgba(10,18,28,.98), rgba(10,18,28,.98))' },
  { id: 'graphite', label: 'Grafito', value: 'radial-gradient(circle at 18% 22%, rgba(71,85,105,.12), transparent 0 26%), radial-gradient(circle at 78% 0%, rgba(30,41,59,.18), transparent 0 28%), linear-gradient(180deg, rgba(9,14,23,.99), rgba(9,14,23,.99))' }
];

function Avatar({ name, image, small = false }) {
  return <div className={`chatAvatar ${small ? 'small' : ''}`}>{image ? <img src={image} alt=""/> : initials(name)}</div>;
}

function ChatNotice({ kind = 'info', children }) {
  return <div className={`chatNotice ${kind}`}>{kind === 'danger' ? <AlertTriangle size={17}/> : kind === 'success' ? <Check size={17}/> : <Info size={17}/>}<span>{children}</span></div>;
}

function AttachmentPreview({ attachment, onNotice }) {
  const isImage = String(attachment?.mime_type || '').startsWith('image/');
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    let active = true;
    let objectUrl = null;
    if (!isImage || !attachment?.storage_path) return undefined;
    resolveChatAttachmentUrl(attachment.storage_path)
      .then(url => {
        if (!active) {
          if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setPreviewUrl(url);
      })
      .catch(() => setPreviewUrl(null));
    return () => {
      active = false;
      if (objectUrl?.startsWith('blob:')) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment?.id, attachment?.storage_path, isImage]);

  if (isImage) {
    return <button className="imageAttachmentCard" type="button" onClick={() => previewUrl ? window.open(previewUrl, '_blank', 'noopener,noreferrer') : onNotice?.('La imagen aún se está preparando.') }>
      {previewUrl ? <img src={previewUrl} alt={attachment.file_name || 'Imagen del chat'}/> : <div className="imageAttachmentPlaceholder"><Image size={24}/><span>Cargando imagen…</span></div>}
      <small>{attachment.file_name || 'Imagen'} · {formatBytes(attachment.size_bytes)}</small>
    </button>;
  }

  return <button className="attachmentCard" onClick={() => attachment.storage_path ? openChatAttachment(attachment.storage_path).catch(error => onNotice?.(error.message)) : onNotice?.('Archivo de demostración.') }>
    <File size={22}/><span><b>{attachment.file_name}</b><small>{formatBytes(attachment.size_bytes)} · enlace privado</small></span><Download size={17}/>
  </button>;
}


function StructuredMessage({ data, message, allMessages, currentUser, onSend, onNotice, onStopLive }) {
  const pollClosed = data.type === 'poll' && allMessages.some(item => { const parsed=parseStructured(item.body); return parsed?.type==='poll_close' && parsed.pollId===data.pollId; });
  const eventCancelled = data.type === 'event' && allMessages.some(item => { const parsed=parseStructured(item.body); return parsed?.type==='event_cancel' && parsed.eventId===data.eventId; });
  const votes = allMessages.map(item => ({ item, data: parseStructured(item.body) })).filter(entry => entry.data?.type === 'poll_vote' && entry.data.pollId === data.pollId);
  const latestVoteByUser = new Map();
  votes.forEach(entry => latestVoteByUser.set(entry.data.voterId || entry.item.sender_id || entry.item.sender_username, entry.data));
  const pollTotals = (data.options || []).map((_, index) => [...latestVoteByUser.values()].filter(vote => (vote.optionIndices || []).includes(index)).length);
  const myVote = latestVoteByUser.get(currentUser?.id || currentUser?.username);
  const rsvps = allMessages.map(item => parseStructured(item.body)).filter(item => item?.type === 'event_rsvp' && item.eventId === data.eventId);
  const latestRsvp = new Map(); rsvps.forEach(item => latestRsvp.set(item.userId, item));
  const orderStatuses = allMessages.map(item => parseStructured(item.body)).filter(item => item?.type === 'order_status' && item.orderId === data.orderId);
  const lastOrderStatus = orderStatuses.at(-1)?.status || data.status || 'pendiente';

  if (data.type === 'location') {
    const url=mapsUrl(data.lat,data.lng);
    const routeUrl=`https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}`;
    const text=`${data.live?'Ubicación en tiempo real':'Mi ubicación actual'}: ${url}`;
    const stopped=allMessages.some(item=>{const parsed=parseStructured(item.body);return parsed?.type==='location_stop'&&parsed.liveId===data.liveId;});
    const expired=data.live && Date.now()>Number(data.expiresAt||0);
    const active=data.live&&!stopped&&!expired;
    const own=message.sender_id===currentUser?.id||message.sender_username===currentUser?.username;
    return <div className="structuredCard locationCard"><div className="locationMapFrame"><iframe title="Mapa de ubicación" src={osmEmbedUrl(data.lat,data.lng,16)} loading="lazy"/><span className={active?'liveMapBadge':'mapBadge'}>{active?'EN VIVO':'UBICACIÓN'}</span></div><div className="structuredHead"><MapPin/><div><b>{data.name || (data.live?'Ubicación en tiempo real':'Ubicación compartida')}</b><span>{data.address || `${Number(data.lat).toFixed(5)}, ${Number(data.lng).toFixed(5)}`}</span></div></div><small>{active?`Compartiendo hasta ${new Date(data.expiresAt).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}`:stopped?'Compartición finalizada':data.live?'Ubicación caducada':`Precisión aproximada: ${Math.round(data.accuracy||0)} m`}</small><div className="structuredActions"><button onClick={()=>window.open(url,'_blank','noopener,noreferrer')}>Abrir mapa</button><button className="secondary" onClick={()=>window.open(routeUrl,'_blank','noopener,noreferrer')}>Cómo llegar</button><button className="secondary" onClick={()=>openWhatsAppShare(text)}>WhatsApp</button>{active&&own&&<button className="danger" onClick={()=>onStopLive?.(data.liveId)}>Dejar de compartir</button>}</div></div>;
  }
  if (data.type === 'location_stop') return <div className="structuredMini"><MapPin size={14}/> Ubicación en tiempo real finalizada</div>;
  if (data.type === 'contact') {
    const digits = String(data.phone || '').replace(/\D/g,'');
    return <div className="structuredCard contactShareCard"><div className="structuredHead"><Contact/><div><b>{data.name}</b><span>{data.phone}</span></div></div>{data.note && <p>{data.note}</p>}<div className="structuredActions"><a href={`tel:${data.phone}`}>Llamar</a><button onClick={() => window.open(`https://wa.me/${digits}`,'_blank','noopener,noreferrer')}>WhatsApp</button><button className="secondary" onClick={() => navigator.clipboard?.writeText(`${data.name}\n${data.phone}`).then(() => onNotice('Contacto copiado.'))}>Copiar</button></div></div>;
  }
  if (data.type === 'poll') {
    const totalVotes = latestVoteByUser.size;
    const choose = index => {
      if (pollClosed) return onNotice?.('Esta encuesta ya está cerrada.');
      let indices = data.multiple ? [...(myVote?.optionIndices || [])] : [];
      indices = data.multiple ? (indices.includes(index) ? indices.filter(i => i !== index) : [...indices,index]) : [index];
      onSend('poll_vote',{ pollId:data.pollId, optionIndices:indices, voterId:currentUser?.id || currentUser?.username, voterName:currentUser?.display_name || currentUser?.username });
    };
    const ownPoll = data.createdById && data.createdById === (currentUser?.id || currentUser?.username);
    return <div className="structuredCard pollCard"><div className="structuredHead"><BarChart3/><div><b>{data.question}</b><span>{pollClosed ? 'Encuesta cerrada' : data.multiple ? 'Varias respuestas permitidas' : 'Una respuesta'} · {totalVotes} participante(s)</span></div></div><div className="pollChoices">{data.options.map((option,index) => { const active=(myVote?.optionIndices||[]).includes(index); const pct=totalVotes ? Math.round((pollTotals[index]/totalVotes)*100) : 0; return <button disabled={pollClosed} key={index} className={active?'active':''} onClick={() => choose(index)}><span>{active ? <Check size={15}/> : null}{option}</span>{data.results && <em>{pollTotals[index]} · {pct}%</em>}<i style={{width:`${pct}%`}}/></button>; })}</div>{ownPoll && !pollClosed && <div className="structuredActions"><button className="secondary" onClick={()=>onSend('poll_close',{pollId:data.pollId,closedAt:new Date().toISOString()})}>Cerrar encuesta</button></div>}</div>;
  }
  if (data.type === 'poll_close') return <div className="structuredMini"><Check size={14}/> Encuesta cerrada</div>;
  if (data.type === 'poll_vote') return <div className="structuredMini"><Check size={14}/> Voto actualizado</div>;
  if (data.type === 'event') {
    const attending=[...latestRsvp.values()].filter(item=>item.response==='yes').length;
    const maybe=[...latestRsvp.values()].filter(item=>item.response==='maybe').length;
    const rsvp=response=>eventCancelled ? onNotice?.('Este evento fue cancelado.') : onSend('event_rsvp',{eventId:data.eventId,response,userId:currentUser?.id || currentUser?.username,userName:currentUser?.display_name || currentUser?.username});
    const ownEvent=data.createdById && data.createdById === (currentUser?.id || currentUser?.username);
    return <div className="structuredCard eventCard"><div className="structuredHead"><CalendarDays/><div><b>{data.title}</b><span>{eventCancelled ? 'EVENTO CANCELADO' : `${data.date || 'Fecha por definir'} ${data.time || ''}`}</span></div></div><p><MapPin size={14}/> {data.place || 'Lugar por definir'}</p>{data.description && <p>{data.description}</p>}<small>{attending} asistirán · {maybe} tal vez</small><div className="structuredActions">{!eventCancelled && <><button onClick={()=>rsvp('yes')}>Asistiré</button><button className="secondary" onClick={()=>rsvp('maybe')}>Tal vez</button><button className="secondary" onClick={()=>rsvp('no')}>No iré</button><button className="secondary" onClick={()=>downloadCalendarEvent(data)}>Calendario</button></>}{ownEvent && !eventCancelled && <button className="danger" onClick={()=>onSend('event_cancel',{eventId:data.eventId,cancelledAt:new Date().toISOString()})}>Cancelar evento</button>}</div></div>;
  }
  if (data.type === 'event_cancel') return <div className="structuredMini"><CalendarDays size={14}/> Evento cancelado</div>;
  if (data.type === 'event_rsvp') return <div className="structuredMini"><CalendarDays size={14}/> Respuesta al evento: {data.response === 'yes' ? 'Asistiré' : data.response === 'maybe' ? 'Tal vez' : 'No asistiré'}</div>;
  if (data.type === 'order') {
    const total=Number(data.quantity||1)*Number(data.price||0);
    return <div className="structuredCard orderShareCard"><div className="structuredHead"><ShoppingBag/><div><b>Pedido #{String(data.orderId).slice(-6).toUpperCase()}</b><span className={`orderStatus ${lastOrderStatus}`}>{lastOrderStatus}</span></div></div><div className="orderLines"><span>{data.item}</span><span>{data.quantity} × S/ {Number(data.price||0).toFixed(2)}</span><b>S/ {total.toFixed(2)}</b></div>{data.note && <p>{data.note}</p>}<div className="structuredActions"><button onClick={()=>onSend('order_status',{orderId:data.orderId,status:'confirmado'})}>Confirmar</button><button className="secondary" onClick={()=>onSend('order_status',{orderId:data.orderId,status:'preparando'})}>Preparando</button><button className="secondary" onClick={()=>onSend('order_status',{orderId:data.orderId,status:'entregado'})}>Entregado</button></div></div>;
  }
  if (data.type === 'order_status') return <div className="structuredMini"><ShoppingBag size={14}/> Pedido actualizado: {data.status}</div>;
  if (data.type === 'catalog') {
    return <div className="structuredCard catalogShareCard"><div className="structuredHead"><Store/><div><b>{data.provider}</b><span>{data.availability || 'Disponible'}</span></div></div><div className="catalogItem"><b>{data.item}</b><span>S/ {Number(data.price||0).toFixed(2)}</span></div>{data.description && <p>{data.description}</p>}<div className="structuredActions"><button onClick={()=>onSend('order',{orderId:newId('order'),item:data.item,quantity:1,price:Number(data.price||0),note:`Solicitado desde el catálogo de ${data.provider}`,status:'pendiente'})}>Pedir</button><button className="secondary" onClick={()=>openWhatsAppShare(`${data.provider}: ${data.item} - S/ ${Number(data.price||0).toFixed(2)}`)}>Compartir</button></div></div>;
  }
  return <p>{message.body}</p>;
}

function ContactSearch({ onChanged, onClose }) {
  const [username, setUsername] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const search = async event => {
    event?.preventDefault();
    setMessage('');
    setResult(null);
    if (username.trim().length < 4) return setMessage('Escribe el usuario exacto, con al menos 4 caracteres.');
    setLoading(true);
    try {
      const found = await findChatProfileExact(username);
      if (!found) setMessage('No se encontró un usuario disponible con ese nombre exacto.');
      setResult(found);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const invite = async () => {
    setLoading(true);
    setMessage('');
    try {
      await sendContactRequest(result.username);
      setMessage('Solicitud enviada. La otra persona debe aceptarla.');
      onChanged?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return <div className="chatModalBackdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <div className="chatModal">
      <div className="chatModalHeader">
        <div><span>CONTACTO SEGURO</span><h2>Buscar por usuario exacto</h2><p>MiZona no muestra listas públicas de personas.</p></div>
        <button className="iconBtn" onClick={onClose}><X size={19}/></button>
      </div>
      <form className="exactUserSearch" onSubmit={search}>
        <Search size={19}/><input value={username} onChange={event => setUsername(event.target.value)} placeholder="Ejemplo: JOSE1985" autoFocus/>
        <button disabled={loading}>{loading ? <Loader2 className="spin" size={18}/> : 'Buscar'}</button>
      </form>
      <ChatNotice>Los estudiantes solo pueden encontrarse dentro de relaciones escolares autorizadas.</ChatNotice>
      {message && <ChatNotice kind={message.includes('enviada') ? 'success' : 'danger'}>{message}</ChatNotice>}
      {result && <div className="foundContactCard">
        <Avatar name={result.display_name} image={result.avatar_url}/>
        <div><b>{result.display_name}</b><span>@{String(result.username || '').toUpperCase()}</span><small>{result.account_type === 'student' ? 'Cuenta estudiantil protegida' : result.zone || 'Zona no publicada'}</small></div>
        <button onClick={invite} disabled={loading}><UserPlus size={17}/> Enviar solicitud</button>
      </div>}
    </div>
  </div>;
}

function GroupModal({ contacts, userId, onCreated, onClose }) {
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState([]);
  const [type, setType] = useState('normal');
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (type !== 'school' || !userId) return;
    Promise.all([listCommunities(), listMyMemberships(userId)])
      .then(([all, memberships]) => {
        const activeIds = new Set(memberships.filter(item => item.status === 'active').map(item => item.community_id));
        setSchools(all.filter(item => item.type === 'school' && activeIds.has(item.id)));
      })
      .catch(error => setMessage(error.message));
  }, [type, userId]);

  useEffect(() => {
    if (!schoolId) return setRooms([]);
    loadCommunityBundle(schoolId, true).then(bundle => setRooms(bundle.rooms || [])).catch(error => setMessage(error.message));
  }, [schoolId]);

  const toggle = id => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);

  const submit = async event => {
    event.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const id = await createChatGroup({
        title,
        memberIds: selected,
        communityId: type === 'school' ? schoolId || null : null,
        roomId: type === 'school' ? roomId || null : null
      });
      onCreated(id);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return <div className="chatModalBackdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <form className="chatModal groupCreator" onSubmit={submit}>
      <div className="chatModalHeader"><div><span>NUEVA CONVERSACIÓN</span><h2>Crear grupo</h2><p>Los mensajes y archivos se conservarán por 7 días.</p></div><button type="button" className="iconBtn" onClick={onClose}><X size={19}/></button></div>
      <div className="groupTypeButtons">
        <button type="button" className={type === 'normal' ? 'active' : ''} onClick={() => setType('normal')}><Users size={18}/> Grupo de contactos</button>
        <button type="button" className={type === 'school' ? 'active' : ''} onClick={() => setType('school')}><ShieldCheck size={18}/> Grupo escolar</button>
      </div>
      <label>Nombre del grupo<input value={title} onChange={event => setTitle(event.target.value)} placeholder="Ejemplo: Trabajo de ciencias" required minLength={3}/></label>
      {type === 'school' && <div className="formGrid2">
        <label>Colegio<select value={schoolId} onChange={event => { setSchoolId(event.target.value); setRoomId(''); }} required><option value="">Seleccionar colegio</option>{schools.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Aula opcional<select value={roomId} onChange={event => setRoomId(event.target.value)}><option value="">Todo el colegio</option>{rooms.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      </div>}
      <div className="groupContactPicker">
        <b>{type === 'school' ? 'Contactos a incluir (también deben pertenecer al colegio)' : 'Selecciona contactos'}</b>
        {contacts.length ? contacts.map(contact => <label key={contact.id} className={selected.includes(contact.id) ? 'selected' : ''}>
          <input type="checkbox" checked={selected.includes(contact.id)} onChange={() => toggle(contact.id)}/><Avatar small name={contact.display_name} image={contact.avatar_url}/><span>{contact.display_name}<small>@{String(contact.username || '').toUpperCase()}</small></span>
        </label>) : <p>Aún no tienes contactos aceptados.</p>}
      </div>
      {selected.length < 1 && <ChatNotice>Selecciona al menos un contacto para crear el grupo.</ChatNotice>}
      {message && <ChatNotice kind="danger">{message}</ChatNotice>}
      <div className="formActions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button disabled={loading || title.trim().length < 3 || selected.length < 1 || (type === 'school' && !schoolId)}>{loading ? <Loader2 className="spin" size={18}/> : <Plus size={18}/>} Crear grupo</button></div>
    </form>
  </div>;
}

export default function Chat({ setPage }) {
  const { user, profile, isAuthenticated, backendConnected } = useApp();
  const [tab, setTab] = useState('chats');
  const [contacts, setContacts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [composer, setComposer] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [mobileConversation, setMobileConversation] = useState(false);
  const [openingConversation, setOpeningConversation] = useState(false);
  const [showOpeningSkeleton, setShowOpeningSkeleton] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [chatFilter, setChatFilter] = useState('all');
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showAttachPanel, setShowAttachPanel] = useState(false);
  const [showActionsPanel, setShowActionsPanel] = useState(false);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const [locationChecking, setLocationChecking] = useState(false);
  const [locationPosition, setLocationPosition] = useState(null);
  const [locationAddress, setLocationAddress] = useState(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [liveLocationActive, setLiveLocationActive] = useState(null);
  const [showPollPanel, setShowPollPanel] = useState(false);
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [showCatalogPanel, setShowCatalogPanel] = useState(false);
  const [showQuickPanel, setShowQuickPanel] = useState(false);
  const [actionTab, setActionTab] = useState('summary');
  const [contactDraft, setContactDraft] = useState({ name:'', phone:'', note:'' });
  const [orderDraft, setOrderDraft] = useState({ item:'', quantity:1, price:'', note:'' });
  const [catalogDraft, setCatalogDraft] = useState({ provider: profile?.display_name || profile?.username || 'Proveedor', item:'', price:'', availability:'Disponible', description:'' });
  const liveWatchRef = useRef(null);
  const recorderRef = useRef(null);
  const [profileDraft, setProfileDraft] = useState(() => {
    try {
      return { displayName: profile?.display_name || profile?.username || 'Mi perfil', status: 'Disponible', avatar: '', ...(JSON.parse(localStorage.getItem(`mizona-chat-profile-${profile?.username || profile?.id || 'local'}`) || '{}') || {}) };
    } catch {
      return { displayName: profile?.display_name || profile?.username || 'Mi perfil', status: 'Disponible', avatar: '' };
    }
  });
  const [pollDraft, setPollDraft] = useState({ question: '', options: ['Sí', 'No'], multiple: false, results: true });
  const [eventDraft, setEventDraft] = useState({ title: '', date: '', time: '', place: '', description: '' });
  const [chatTheme, setChatTheme] = useState(() => {
    try {
      return { ...CHAT_THEME_DEFAULT, ...(JSON.parse(localStorage.getItem(`mizona-chat-theme-${profile?.username || profile?.id || 'local'}`) || '{}') || {}) };
    } catch {
      return CHAT_THEME_DEFAULT;
    }
  });
  const fileInput = useRef(null);
  const profilePhotoInput = useRef(null);
  const wallpaperInput = useRef(null);
  const messageEnd = useRef(null);
  const pushedMobileChatState = useRef(false);
  const chatThemeKey = `mizona-chat-theme-${profile?.username || profile?.id || 'local'}`;
  const chatProfileKey = `mizona-chat-profile-${profile?.username || profile?.id || 'local'}`;

  const selected = useMemo(() => conversations.find(item => item.id === selectedId) || null, [conversations, selectedId]);
  const isMobileViewport = () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 760px)')?.matches;
  const isStudent = String(profile?.account_type || profile?.type || profile?.role || '').toLowerCase().includes('student') || String(profile?.role || '').toLowerCase().includes('alumno');
  const receivedPending = requests.filter(item => item.direction === 'received' && item.status === 'pending');
  const conversationName = item => item?.type === 'direct' ? item.peer_display_name || item.peer_username || 'Conversación' : item?.title || 'Grupo';

  const directConversations = useMemo(() => conversations.filter(item => item.type === 'direct'), [conversations]);
  const groupConversations = useMemo(() => conversations.filter(item => item.type !== 'direct'), [conversations]);

  const groupedMessages = useMemo(() => {
    const items = [];
    const latestLive = new Map();
    messages.forEach(message => { const parsed=parseStructured(message.body); if(parsed?.type==='location'&&parsed.live&&parsed.liveId) latestLive.set(parsed.liveId,message.id); });
    let lastKey = '';
    messages.forEach(message => {
      const structured=parseStructured(message.body);
      if(structured?.type==='location'&&structured.live&&structured.liveId&&latestLive.get(structured.liveId)!==message.id) return;
      const date = new Date(message.created_at || Date.now());
      const key = date.toDateString();
      if (key !== lastKey) {
        items.push({ type: 'date', id: `date-${key}`, label: formatChatDateLabel(date) });
        lastKey = key;
      }
      items.push({ type: 'message', id: message.id, message });
    });
    return items;
  }, [messages]);

  const filteredConversations = useMemo(() => {
    let source = tab === 'groups' ? groupConversations : conversations;
    if (chatFilter === 'unread') source = source.filter(item => Number(item.unread_count) > 0);
    if (chatFilter === 'direct') source = source.filter(item => item.type === 'direct');
    if (chatFilter === 'groups') source = source.filter(item => item.type !== 'direct');
    const q = searchText.trim().toLowerCase();
    if (!q) return source;
    return source.filter(item => [conversationName(item), item.last_message, item.peer_username, item.title].filter(Boolean).some(value => String(value).toLowerCase().includes(q)));
  }, [tab, groupConversations, conversations, searchText, chatFilter]);

  const filteredContacts = useMemo(() => {
    let source = contacts;
    if (chatFilter === 'blocked') source = source.filter(item => item.is_blocked);
    const q = searchText.trim().toLowerCase();
    if (!q) return source;
    return source.filter(item => [item.display_name, item.username, item.zone].filter(Boolean).some(value => String(value).toLowerCase().includes(q)));
  }, [contacts, searchText, chatFilter]);

  const noticeKind = /correctamente|enviad|publicad|activo|detenid|desbloqueado|bloqueado|generado|compartid|actualizado|creado|Reporte enviado/i.test(notice) ? 'success' : 'danger';

  const visibleResultCount = tab === 'contacts' ? filteredContacts.length : (tab === 'chats' || tab === 'groups') ? filteredConversations.length : requests.length;

  const updateChatTheme = patch => setChatTheme(current => ({ ...current, ...patch }));

  const prepareLocation = async position => {
    const point = { lat:position.coords.latitude, lng:position.coords.longitude, accuracy:position.coords.accuracy };
    setLocationPosition(point);
    setSelectedPlace(null);
    setLocationLoading(true);
    try {
      const [address, nearby] = await Promise.all([
        reverseGeocode(point.lat, point.lng).catch(() => ({ name:'Ubicación actual', address:`${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}` })),
        loadNearbyPlaces(point.lat, point.lng).catch(() => [])
      ]);
      setLocationAddress(address);
      setNearbyPlaces(nearby);
    } finally { setLocationLoading(false); }
    return point;
  };

  const requestLocationAccess = async () => {
    if (!selectedId) { setNotice('Selecciona una conversación antes de compartir ubicación.'); return; }
    if (!window.isSecureContext && location.hostname !== 'localhost') { setNotice('La ubicación requiere que MiZona esté publicada con HTTPS.'); return; }
    if (!navigator.geolocation) { setNotice('Este dispositivo no permite obtener la ubicación.'); return; }
    setLocationChecking(true);
    navigator.geolocation.getCurrentPosition(
      async position => { await prepareLocation(position); setLocationReady(true); setLocationChecking(false); setNotice('Ubicación habilitada correctamente.'); },
      () => { setLocationReady(false); setLocationChecking(false); setNotice('Debes permitir la ubicación desde el navegador o los ajustes del celular.'); },
      { enableHighAccuracy:true, timeout:15000, maximumAge:5000 }
    );
  };

  const refreshLocation = () => requestLocationAccess();

  const runLocationSearch = async event => {
    event?.preventDefault();
    const q = locationSearch.trim();
    if (!q || !locationPosition) return;
    setLocationLoading(true);
    try { setLocationResults(await searchMapPlaces(q, locationPosition.lat, locationPosition.lng)); }
    catch (error) { setNotice(error.message); }
    finally { setLocationLoading(false); }
  };

  const chatThemeStyle = {
    '--chat-accent': chatTheme.accent || CHAT_THEME_DEFAULT.accent,
    '--chat-bg': chatTheme.background || CHAT_THEME_DEFAULT.background,
    '--chat-surface': chatTheme.surface || CHAT_THEME_DEFAULT.surface,
    '--chat-header': chatTheme.header || CHAT_THEME_DEFAULT.header,
    '--chat-composer': chatTheme.composer || CHAT_THEME_DEFAULT.composer,
    '--chat-text': chatTheme.text || CHAT_THEME_DEFAULT.text,
    '--chat-subtext': chatTheme.subtext || CHAT_THEME_DEFAULT.subtext,
    '--chat-wallpaper': chatTheme.wallpaper || CHAT_THEME_DEFAULT.wallpaper
  };

  useEffect(() => {
    if (!isMobileViewport()) return;
    sessionStorage.removeItem('mizona-chat-open-conversation');
    const state = window.history.state || {};
    if (state.chatView !== 'conversation') {
      setMobileConversation(false);
      setSelectedId(null);
      setTab('chats');
    }
    const onPopState = event => {
      const next = event.state || {};
      if ((next.mizonaPage || next.mzPage) !== 'chat') return;
      if (next.chatView === 'conversation' && next.chatConversationId) {
        pushedMobileChatState.current = true;
        setSelectedId(next.chatConversationId);
        setMobileConversation(true);
      } else {
        pushedMobileChatState.current = false;
        setMobileConversation(false);
        setSelectedId(null);
        setTab('chats');
        setSearchText('');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const active = mobileConversation && Boolean(selectedId);
    document.body.classList.toggle('mizona-chat-fullscreen', active);
    return () => document.body.classList.remove('mizona-chat-fullscreen', 'mizona-chat-opening');
  }, [mobileConversation, selectedId]);

  useEffect(() => {
    document.body.classList.toggle('mizona-chat-immersive', immersiveMode);
    return () => document.body.classList.remove('mizona-chat-immersive');
  }, [immersiveMode]);

  useEffect(() => () => { if (liveWatchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(liveWatchRef.current); if (recorderRef.current?.stream) recorderRef.current.stream.getTracks().forEach(track => track.stop()); }, []);

  useEffect(() => {
    // ETAPA 30.32: el chat completo se comporta como una app fullscreen real.
    document.body.classList.add('mizona-chat-app');
    return () => document.body.classList.remove('mizona-chat-app', 'mizona-chat-opening', 'mizona-chat-fullscreen');
  }, []);

  useEffect(() => {
    localStorage.setItem(chatThemeKey, JSON.stringify(chatTheme));
  }, [chatTheme, chatThemeKey]);

  useEffect(() => {
    localStorage.setItem(chatProfileKey, JSON.stringify(profileDraft));
  }, [profileDraft, chatProfileKey]);

  useEffect(() => {
    if (!openingConversation) {
      setShowOpeningSkeleton(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setShowOpeningSkeleton(true), 120);
    return () => window.clearTimeout(timer);
  }, [openingConversation]);

  const refreshLists = async (keepSelection = true) => {
    setNotice('');
    setLoading(true);
    try {
      const [contactList, requestList, conversationList] = await Promise.all([loadChatContacts(), loadChatRequests(), loadConversations()]);
      setContacts(contactList || []);
      setRequests(requestList || []);
      setConversations(conversationList || []);
      const nextSelectedId = keepSelection ? selectedId : (keepSelection && conversationList?.[0]?.id);
      if (keepSelection && selectedId) {
        const found = (conversationList || []).find(item => item.id === selectedId);
        if (found) {
          setMessages(await loadMessages(selectedId));
          await markConversationRead(selectedId);
        } else {
          setSelectedId(null);
          // Mantener el contenido anterior hasta que cargue el nuevo evita flash blanco.
          setMobileConversation(false);
        }
      } else if (!keepSelection) {
        setSelectedId(null);
        // Mantener el contenido anterior hasta que cargue el nuevo evita flash blanco.
        setMobileConversation(false);
      } else if (!selectedId && conversationList?.length) {
        setSelectedId(nextSelectedId || null);
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshLists(true); }, []);

  useEffect(() => {
    const syncChat = async () => {
      try {
        const [contactList, requestList, conversationList] = await Promise.all([loadChatContacts(), loadChatRequests(), loadConversations()]);
        setContacts(contactList || []);
        setRequests(requestList || []);
        setConversations(conversationList || []);
        if (selectedId) {
          setMessages(await loadMessages(selectedId));
          await markConversationRead(selectedId);
        }
      } catch (error) { setNotice(error.message || 'No se pudo sincronizar el chat.'); }
    };
    const unsubscribe = subscribeToChat({
      userId:user?.id || profile?.id,
      conversationId:selectedId,
      onConversationChange:syncChat,
      onMessageChange:syncChat,
      onRequestChange:syncChat
    });
    return () => unsubscribe?.();
  }, [selectedId, user?.id, profile?.id]);

  useEffect(() => {
    messageEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const openConversation = async id => {
    setNotice('');
    setSelectedId(id);
    setTab('chats');
    setOpeningConversation(true);

    if (isMobileViewport()) {
      // ETAPA 30.31: activar pantalla completa antes de cargar mensajes.
      // Así el navegador no muestra una tarjeta blanca intermedia.
      document.body.classList.add('mizona-chat-fullscreen', 'mizona-chat-opening');
      setMobileConversation(true);
      // Mantener el contenido anterior hasta que cargue el nuevo evita flash blanco.
      if (!pushedMobileChatState.current || window.history.state?.chatConversationId !== id) {
        window.history.pushState({ mizonaPage: 'chat', mzPage: 'chat', chatView: 'conversation', chatConversationId: id }, '', `#chat-${id}`);
        pushedMobileChatState.current = true;
      }
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    }

    try {
      const loaded = await loadMessages(id);
      setMessages(loaded);
      await markConversationRead(id);
    } finally {
      setOpeningConversation(false);
      document.body.classList.remove('mizona-chat-opening');
    }
  };

  const showChatList = () => {
    setOpeningConversation(false);
    setShowOpeningSkeleton(false);
    document.body.classList.remove('mizona-chat-opening');
    setMobileConversation(false);
    setSelectedId(null);
    setTab('chats');
    setSearchText('');
    if (isMobileViewport()) {
      window.history.replaceState({ mizonaPage: 'chat', mzPage: 'chat', chatView: 'list' }, '', '#chat');
      pushedMobileChatState.current = false;
    }
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0);
  };

  const exitChat = () => {
    pushedMobileChatState.current = false;
    setOpeningConversation(false);
    setShowOpeningSkeleton(false);
    document.body.classList.remove('mizona-chat-opening', 'mizona-chat-fullscreen', 'mizona-chat-immersive');
    setMobileConversation(false);
    setSelectedId(null);
    setShowSettingsPanel(false);
    setShowThemePanel(false);
    setShowAttachPanel(false);
    setShowActionsPanel(false);
    setShowLocationPanel(false);
    setShowPollPanel(false);
    setShowEventPanel(false);
    setSearchText('');
    setTab('chats');
    try { window.history.pushState({ mizonaPage: 'panel', mzPage: 'panel' }, '', '#panel'); } catch {}
    setPage?.('panel');
  };

  const startDirect = async contact => {
    setLoading(true);
    setNotice('');
    try {
      const id = await startDirectConversation(contact.id);
      await refreshLists(true);
      setTab('chats');
      openConversation(id);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitMessage = async event => {
    event.preventDefault();
    if (!selectedId || !composer.trim()) return;
    setSending(true);
    setNotice('');
    try {
      await sendTextMessage(selectedId, composer);
      setMessages(await loadMessages(selectedId));
      setComposer('');
      await refreshLists(true);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSending(false);
    }
  };

  const uploadFile = async event => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || !selectedId) return;
    if (files.length > 20) { setNotice('Puedes seleccionar como máximo 20 archivos por envío.'); return; }
    const imageCount = files.filter(file => file.type.startsWith('image/')).length;
    if (imageCount > 20) {
      setNotice('Solo puedes enviar hasta 20 fotos por mensaje.');
      return;
    }
    const videoCount = files.filter(file => file.type.startsWith('video/')).length;
    if (videoCount > 1) {
      setNotice('Por ahora solo se permite 1 video por mensaje.');
      return;
    }
    setSending(true);
    try {
      for (const file of files) {
        await sendChatFile({ conversationId: selectedId, file, userId: user.id });
      }
      setMessages(await loadMessages(selectedId));
      await refreshLists(true);
      setShowAttachPanel(false);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSending(false);
    }
  };

  const uploadWallpaper = event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateChatTheme({ wallpaper: `url("${reader.result}")` });
    reader.readAsDataURL(file);
  };

  const uploadProfilePhoto = event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfileDraft(current => ({ ...current, avatar: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const sendSpecialText = async text => {
    if (!selectedId) {
      setNotice('Selecciona una conversación primero.');
      return;
    }
    setSending(true);
    try {
      await sendTextMessage(selectedId, text);
      setMessages(await loadMessages(selectedId));
      await refreshLists(true);
      setShowAttachPanel(false);
      setShowPollPanel(false);
      setShowEventPanel(false);
      setShowLocationPanel(false);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSending(false);
    }
  };


  const sendStructured = async (type, data = {}) => {
    await sendSpecialText(encodeStructured(type, data));
  };

  const recordAudio = async () => {
    if (!selectedId) return setNotice('Selecciona una conversación primero.');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return setNotice('Este navegador no permite grabar audio.');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = { recorder, stream };
      recorder.ondataavailable = event => event.data.size && chunks.push(event.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const file = new File([blob], `nota-voz-${Date.now()}.webm`, { type: blob.type });
        stream.getTracks().forEach(track => track.stop());
        setSending(true);
        try { await sendChatFile({ conversationId:selectedId, file, userId:user.id }); setMessages(await loadMessages(selectedId)); await refreshLists(true); setNotice('Nota de voz enviada.'); } catch (error) { setNotice(error.message); } finally { setSending(false); recorderRef.current=null; }
      };
      recorder.start();
      setNotice('Grabando nota de voz… pulsa nuevamente para detener.');
    } catch { setNotice('No se pudo acceder al micrófono. Revisa el permiso del navegador.'); }
  };

  const toggleAudioRecording = () => {
    if (recorderRef.current?.recorder?.state === 'recording') recorderRef.current.recorder.stop();
    else recordAudio();
  };

  const sendLocationPoint = async point => {
    if (!point) return setNotice('No hay una ubicación disponible.');
    await sendStructured('location',{
      lat:point.lat, lng:point.lng, accuracy:point.accuracy || locationPosition?.accuracy || 0,
      live:false, capturedAt:new Date().toISOString(),
      name:point.name || locationAddress?.name || 'Ubicación compartida',
      address:point.address || locationAddress?.address || ''
    });
    setShowLocationPanel(false);
    setNotice('Ubicación enviada. El receptor podrá abrir el mapa, ver la ruta o compartirla.');
  };

  const sendCurrentLocation = async () => {
    if (locationPosition) return sendLocationPoint({ ...locationPosition, ...locationAddress });
    if (!navigator.geolocation) return setNotice('Tu navegador no permite compartir ubicación.');
    setNotice('Obteniendo ubicación…');
    navigator.geolocation.getCurrentPosition(async position => { const point=await prepareLocation(position); await sendLocationPoint({ ...point, ...locationAddress }); }, error => setNotice(error.code===1?'Permiso de ubicación denegado. Actívalo en el navegador o ajustes del celular.':'No se pudo obtener tu ubicación. Verifica GPS y conexión.'), { enableHighAccuracy:true, timeout:15000, maximumAge:5000 });
  };

  const stopLiveLocation = async (liveId = liveLocationActive?.liveId) => {
    if (liveWatchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(liveWatchRef.current);
    liveWatchRef.current = null;
    if (liveId) await sendStructured('location_stop',{ liveId, stoppedAt:new Date().toISOString() });
    setLiveLocationActive(null);
    setNotice('Ubicación en tiempo real detenida.');
  };

  const startLiveLocation = minutes => {
    if (!navigator.geolocation) return setNotice('Tu navegador no permite ubicación en tiempo real.');
    if (liveWatchRef.current != null) navigator.geolocation.clearWatch(liveWatchRef.current);
    const liveId = newId('live');
    const expiresAt = Date.now() + minutes * 60000;
    setLiveLocationActive({ liveId, expiresAt, minutes });
    let lastSent = 0;
    liveWatchRef.current = navigator.geolocation.watchPosition(async position => {
      const now=Date.now(); if (now-lastSent<20000) return; lastSent=now;
      const point={lat:position.coords.latitude,lng:position.coords.longitude,accuracy:position.coords.accuracy};
      setLocationPosition(point);
      const address=await reverseGeocode(point.lat,point.lng).catch(()=>locationAddress || {name:'Ubicación en tiempo real',address:''});
      await sendStructured('location',{ liveId, ...point, ...address, live:true, expiresAt, capturedAt:new Date().toISOString() });
      if (Date.now()>=expiresAt) await stopLiveLocation(liveId);
    }, error=>setNotice(error.code===1?'Permiso de ubicación denegado.':'No fue posible actualizar la ubicación en tiempo real.'), {enableHighAccuracy:true,timeout:15000,maximumAge:5000});
    window.setTimeout(()=>{ if(liveWatchRef.current!=null) stopLiveLocation(liveId); }, minutes*60000);
    setShowLocationPanel(false);
    setNotice(`Ubicación en tiempo real activa durante ${minutes} minutos.`);
  };

  const createPoll = async () => {
    const options = pollDraft.options.map(item => item.trim()).filter(Boolean);
    if (!pollDraft.question.trim() || options.length < 2) return setNotice('La encuesta necesita una pregunta y mínimo 2 opciones.');
    await sendStructured('poll',{ pollId:newId('poll'), question:pollDraft.question.trim(), options, multiple:pollDraft.multiple, results:pollDraft.results, createdBy:profile?.display_name || profile?.username, createdById:user?.id || profile?.id || profile?.username });
    setPollDraft({ question:'', options:['Sí','No'], multiple:false, results:true });
    setShowPollPanel(false); setNotice('Encuesta publicada y lista para votar.');
  };

  const createEvent = async () => {
    if (!eventDraft.title.trim() || !eventDraft.date) return setNotice('El evento necesita título y fecha.');
    await sendStructured('event',{ eventId:newId('event'), ...eventDraft, title:eventDraft.title.trim(), createdBy:profile?.display_name || profile?.username, createdById:user?.id || profile?.id || profile?.username });
    setEventDraft({ title:'', date:'', time:'', place:'', description:'' });
    setShowEventPanel(false); setNotice('Evento publicado. Los participantes pueden confirmar y agregarlo al calendario.');
  };

  const createContactShare = async () => {
    if (!contactDraft.name.trim() || !contactDraft.phone.trim()) return setNotice('Completa el nombre y teléfono del contacto.');
    if (contactDraft.phone.replace(/\D/g,'').length < 7) return setNotice('Ingresa un número de teléfono válido.');
    await sendStructured('contact',{ ...contactDraft, name:contactDraft.name.trim(), phone:contactDraft.phone.trim() });
    setContactDraft({name:'',phone:'',note:''}); setShowContactPanel(false); setNotice('Contacto compartido con acciones de llamada y WhatsApp.');
  };

  const createOrderShare = async () => {
    if (!orderDraft.item.trim() || Number(orderDraft.quantity)<=0) return setNotice('Completa el producto o servicio y una cantidad válida.');
    await sendStructured('order',{ orderId:newId('order'), item:orderDraft.item.trim(), quantity:Number(orderDraft.quantity), price:Number(orderDraft.price||0), note:orderDraft.note.trim(), status:'pendiente' });
    setOrderDraft({item:'',quantity:1,price:'',note:''}); setShowOrderPanel(false); setNotice('Pedido publicado con seguimiento de estado.');
  };

  const createCatalogShare = async () => {
    if (!catalogDraft.provider.trim() || !catalogDraft.item.trim()) return setNotice('Completa proveedor y producto o servicio.');
    await sendStructured('catalog',{ ...catalogDraft, price:Number(catalogDraft.price||0) });
    setCatalogDraft(current=>({...current,item:'',price:'',description:''})); setShowCatalogPanel(false); setNotice('Artículo del catálogo compartido.');
  };

  const inviteFriend = () => {
    const code = `MZ-${String(profile?.username || profile?.id || 'USER').slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    navigator.clipboard?.writeText(code).catch(() => {});
    setNotice(`Código de invitación generado: ${code}`);
  };

  const review = async (request, action) => {
    setLoading(true);
    try {
      await reviewContactRequest(request.id, action);
      await refreshLists(true);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  };

  const block = async contact => {
    if (!window.confirm(`¿Bloquear a ${contact.display_name}? El contacto y el historial seguirán visibles.`)) return;
    try {
      await blockChatUser(contact.id, 'Bloqueado por el usuario');
      setNotice(`${contact.display_name} fue bloqueado. Puedes desbloquearlo cuando quieras.`);
      await refreshLists(false);
    } catch (error) { setNotice(error.message); }
  };

  const unblock = async contact => {
    try {
      await unblockChatUser(contact.id);
      setNotice(`${contact.display_name} fue desbloqueado.`);
      await refreshLists(false);
    } catch (error) { setNotice(error.message); }
  };

  const report = async message => {
    const reason = window.prompt('Motivo del reporte: acoso, contenido inapropiado, suplantación u otro');
    if (!reason) return;
    try {
      await reportChatItem({ conversationId: selectedId, messageId: message.id, reportedUserId: message.sender_id, reason, reporterId: user?.id });
      setNotice('Reporte enviado al Centro de Control.');
    } catch (error) {
      setNotice(error.message);
    }
  };

  if (backendConnected && !isAuthenticated) return <div className="chatLoginGate"><div><ShieldCheck size={48}/><h1>MiZona Chat protegido</h1><p>Inicia sesión para buscar contactos, recibir invitaciones y conversar de forma segura.</p><button onClick={() => setPage('settings')}>Ingresar o crear cuenta</button></div></div>;

  return <div className={`chatRealPage ${mobileConversation && selectedId ? 'mobileChatFullscreen' : 'mobileChatListMode'} ${openingConversation ? 'openingChat' : ''} ${immersiveMode ? 'chatImmersiveMode' : 'chatWindowMode'}`} style={chatThemeStyle}>
    <div className="chatPageHeader">
      <div><span>{isStudent ? 'CHAT SEGURO PARA ESTUDIANTES' : 'ETAPA 14 · LABORATORIO MULTIUSUARIO'}</span><h1>MiZona Chat</h1><p>{isStudent ? 'Elige chats, grupos, contactos o solicitudes permitidas. Puedes volver al panel cuando quieras con el botón Salir.' : 'Prueba conversaciones reales entre perfiles locales usando varias pestañas.'}</p></div>
      <div className="chatHeaderActions"><button className="secondary" onClick={() => refreshLists(true)}><RefreshCw size={17}/> Actualizar</button>{!isStudent && <button onClick={() => setShowGroup(true)}><MessageSquarePlus size={17}/> Nuevo grupo</button>}<button onClick={() => setShowSearch(true)}><UserPlus size={17}/> {isStudent ? 'Buscar permitido' : 'Agregar contacto'}</button><button className="secondary" onClick={() => setShowThemePanel(true)}><Palette size={17}/> Tema</button>{immersiveMode ? <button className="secondary" onClick={() => setImmersiveMode(false)}><Minimize2 size={17}/> Salir pantalla completa</button> : <button className="secondary" onClick={() => setImmersiveMode(true)}><Maximize2 size={17}/> Pantalla completa</button>}</div>
    </div>

    {!backendConnected && <div className="chatLocalModeNotice"><ChatNotice kind="success">Modo local multiusuario activo. Los cambios se comparten en este navegador.</ChatNotice></div>}
    {notice && <ChatNotice kind={noticeKind}>{notice}</ChatNotice>}

    <div className={`chatWorkspace ${mobileConversation ? 'showConversation' : ''}`}>
      <aside className="chatDirectory">
        <div className="chatDirectoryTop">
          <div className="chatDirectoryHeaderBar chatTopCompact">
            <div><b>MiZona Chat</b><span>{tab === 'groups' ? 'Grupos y conversaciones' : tab === 'contacts' ? 'Tus contactos' : tab === 'requests' ? 'Solicitudes pendientes' : 'Tus chats recientes'}</span></div>
            <div className="chatDirectoryHeaderActions">
              <button type="button" className="chatSettingsBtn" onClick={() => setShowSettingsPanel(true)} title="Ajustes"><Settings size={16}/> Ajustes</button>
              {!isStudent && <button type="button" className="chatCreateBtn" onClick={() => setShowGroup(true)} title="Nuevo grupo"><Plus size={16}/> Nuevo</button>}
              <button type="button" className="chatExitBtn" onClick={exitChat} title="Salir del chat"><X size={16}/> Salir</button>
            </div>
          </div>
          <div className="chatSearchBar"><Search size={17}/><input value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="Buscar conversación o usuario"/><button type="button" className={showFilters ? 'active' : ''} title="Filtros" onClick={() => setShowFilters(value => !value)}><SlidersHorizontal size={16}/></button></div>
          {showFilters && <div className="chatFilterPanel">
            <button className={chatFilter === 'all' ? 'active' : ''} onClick={() => setChatFilter('all')}>Todos</button>
            {(tab === 'chats' || tab === 'groups') && <><button className={chatFilter === 'unread' ? 'active' : ''} onClick={() => setChatFilter('unread')}>No leídos</button><button className={chatFilter === 'direct' ? 'active' : ''} onClick={() => setChatFilter('direct')}>Personas</button><button className={chatFilter === 'groups' ? 'active' : ''} onClick={() => setChatFilter('groups')}>Grupos</button></>}
            {tab === 'contacts' && <button className={chatFilter === 'blocked' ? 'active' : ''} onClick={() => setChatFilter('blocked')}>Bloqueados</button>}
          </div>}
          {(searchText.trim() || chatFilter !== 'all') && <div className="chatFilterSummary"><span><Search size={14}/> {visibleResultCount} resultado{visibleResultCount === 1 ? '' : 's'} encontrados</span><button type="button" onClick={() => { setSearchText(''); setChatFilter('all'); }}>Limpiar filtro</button></div>}
          {isStudent && <ChatNotice kind="success">Solo verás contactos y grupos aprobados para tu cuenta estudiantil.</ChatNotice>}
          <div className="chatTabs">
            <button className={tab === 'chats' ? 'active' : ''} onClick={() => setTab('chats')}><MessageCircle size={16}/> Chats</button>
            <button className={tab === 'groups' ? 'active' : ''} onClick={() => setTab('groups')}><Users size={16}/> Grupos</button>
            <button className={tab === 'contacts' ? 'active' : ''} onClick={() => setTab('contacts')}><CircleUserRound size={16}/> Contactos</button>
            <button className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}><UserPlus size={16}/> Solicitudes{receivedPending.length > 0 && <i>{receivedPending.length}</i>}</button>
          </div>
        </div>

        {loading ? <div className="chatListLoading"><Loader2 className="spin"/> Cargando...</div> : (tab === 'chats' || tab === 'groups') ? <div className="conversationList">{filteredConversations.length ? filteredConversations.map(item => <button key={item.id} className={selectedId === item.id ? 'active' : ''} onClick={() => openConversation(item.id)}><Avatar name={conversationName(item)} image={item.peer_avatar_url}/><span><b>{conversationName(item)}</b><small>{item.type === 'direct' ? (structuredPreview(item.last_message) || 'Conversación nueva') : `${item.type?.includes('school') ? 'Grupo escolar' : 'Grupo privado'} · ${structuredPreview(item.last_message) || 'Sin mensajes recientes'}`}</small></span><em>{formatTime(item.last_message_at || item.updated_at)}{Number(item.unread_count) > 0 && <i>{item.unread_count}</i>}</em></button>) : <div className="chatDirectoryEmpty"><MessageCircle size={34}/><b>{tab === 'groups' ? 'Aún no tienes grupos' : 'Aún no hay conversaciones'}</b><span>{isStudent ? 'Cuando un grupo o contacto sea autorizado aparecerá aquí.' : 'Agrega un contacto o crea un grupo.'}</span></div>}</div> : tab === 'contacts' ? <div className="contactListReal">{filteredContacts.length ? filteredContacts.map(contact => <article key={contact.id} className={contact.is_blocked ? 'blockedContact' : ''}><Avatar name={contact.display_name} image={contact.avatar_url}/><div><b>{contact.display_name} {contact.is_blocked && <Ban size={14}/>}</b><span>@{String(contact.username || '').toUpperCase()}</span><small>{contact.is_blocked ? 'Contacto bloqueado · historial conservado' : contact.account_type === 'student' ? 'Estudiante protegido' : contact.zone || 'Contacto MiZona'}</small></div><div className="contactActions"><button title="Conversar" disabled={contact.is_blocked} onClick={() => startDirect(contact)}><MessageCircle size={17}/></button>{!isStudent && (contact.is_blocked ? <button className="unlockBtn" title="Desbloquear" onClick={() => unblock(contact)}><RefreshCw size={17}/></button> : <button className="danger" title="Bloquear" onClick={() => block(contact)}><Ban size={17}/></button>)}</div></article>) : <div className="chatDirectoryEmpty"><CircleUserRound size={34}/><b>Sin contactos aceptados</b><span>{isStudent ? 'Tus contactos permitidos aparecerán aquí.' : 'Busca por usuario exacto para enviar solicitud.'}</span>{!isStudent && <button onClick={() => setShowSearch(true)}>Buscar usuario</button>}</div>}</div> : <div className="requestListReal">{requests.length ? requests.map(request => <article key={request.id}><Avatar name={request.display_name} image={request.avatar_url}/><div><b>{request.display_name}</b><span>@{String(request.username || '').toUpperCase()}</span><small>{request.direction === 'received' ? 'Quiere agregarte' : request.status === 'pending' ? 'Esperando respuesta' : request.status}</small></div>{request.direction === 'received' && request.status === 'pending' ? <div><button onClick={() => review(request, 'accepted')}><Check size={16}/></button><button className="danger" onClick={() => review(request, 'rejected')}><X size={16}/></button></div> : <em>{request.status}</em>}</article>) : <div className="chatDirectoryEmpty"><UserPlus size={34}/><b>No hay solicitudes</b><span>Las invitaciones aparecerán aquí.</span></div>}</div>}
      </aside>

      <section className="chatConversation">
        {selected ? <>
          <header className="conversationHeader">
            <button className="iconBtn chatBack" onClick={showChatList}><ChevronLeft/></button>
            <Avatar name={conversationName(selected)} image={selected.peer_avatar_url}/>
            <div><b>{conversationName(selected)}</b><span>{selected.type === 'direct' ? `@${String(selected.peer_username || '').toUpperCase()}` : selected.type?.includes('school') ? 'Grupo escolar protegido' : 'Grupo privado'}</span></div>
            
            <button className="iconBtn" onClick={async () => { if (window.confirm('¿Salir de esta conversación?')) { await leaveConversation(selected.id); await refreshLists(false); showChatList(); } }}><MoreVertical/></button>
          </header>
          <div className="retentionBanner"><ShieldCheck size={16}/> Retención segura: mensajes y archivos hasta {selected.retention_days || 7} días.</div>
          <div className="messageStream">
            {showOpeningSkeleton && <div className="chatOpenSkeleton"><Loader2 className="spin" size={22}/><span>Abriendo conversación…</span></div>}
            {!openingConversation && groupedMessages.length ? groupedMessages.map(item => {
              if (item.type === 'date') return <div key={item.id} className="chatDateSeparator"><span>{item.label}</span></div>;
              const message = item.message;
              const own = message.sender_id === user?.id || message.sender_username === profile.username;
              return <div key={message.id} className={`messageRow ${own ? 'own' : ''}`}>
                {!own && <Avatar small name={message.sender_display_name} image={message.sender_avatar_url}/>}<div className="messageBubble">
                  {!own && <b>{message.sender_display_name}</b>}
                  {message.body && (parseStructured(message.body) ? <StructuredMessage data={parseStructured(message.body)} message={message} allMessages={messages} currentUser={{...profile,id:user?.id}} onSend={sendStructured} onNotice={setNotice} onStopLive={stopLiveLocation}/> : <p>{message.body}</p>)}
                  {Array.isArray(message.attachments) && message.attachments.map(attachment => <AttachmentPreview key={attachment.id} attachment={attachment} onNotice={setNotice}/>)}
                  <small>{formatMessageHour(message.created_at)}</small>
                </div>{!own && <button className="messageReport" title="Reportar" onClick={() => report(message)}><AlertTriangle size={14}/></button>}
              </div>;
            }) : openingConversation ? null : <div className="emptyConversation"><MessageCircle size={43}/><h3>Inicia la conversación</h3><p>Recuerda no compartir contraseñas, códigos bancarios ni información privada.</p></div>}
            <div ref={messageEnd}/>
          </div>
          <form className="messageComposer" onSubmit={submitMessage}>
            <input ref={fileInput} type="file" hidden multiple onChange={uploadFile} accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,audio/mpeg,audio/mp4,audio/wav,audio/ogg,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"/>
            <button type="button" className="iconBtn" title="Adjuntar" onClick={() => setShowAttachPanel(true)} disabled={sending}><Paperclip size={20}/></button>
            <input value={composer} onChange={event => setComposer(event.target.value)} placeholder="Escribe un mensaje seguro..." maxLength={5000}/>
            <button type="button" className="iconBtn" title="Audio" onClick={toggleAudioRecording} disabled={sending}><Mic size={20}/></button>
            <button className="sendBtnChat40" disabled={sending || !composer.trim()}>{sending ? <Loader2 className="spin" size={20}/> : <Send size={20}/>}</button>
          </form>
        </> : <div className="noConversationSelected"><div><MessageCircle size={58}/><h2>Selecciona una conversación</h2><p>También puedes crear un grupo o buscar a una persona por su usuario exacto.</p><button onClick={() => setShowSearch(true)}><UserPlus size={18}/> Agregar contacto</button></div></div>}
      </section>
    </div>

    <div className="chatSafetyGrid"><article><ShieldCheck/><div><b>Protección escolar</b><span>Las cuentas estudiantiles solo se encuentran dentro de relaciones escolares válidas.</span></div></article><article><FileUp/><div><b>Archivos privados</b><span>Hasta 25 MB, con enlaces temporales y acceso exclusivo para integrantes.</span></div></article><article><Ban/><div><b>Bloquear y reportar</b><span>El bloqueo conserva el contacto y el historial, pero detiene nuevos mensajes hasta que lo desbloquees.</span></div></article></div>

    {showSearch && <ContactSearch onChanged={() => refreshLists(true)} onClose={() => setShowSearch(false)}/>}
    {showGroup && !isStudent && <GroupModal contacts={contacts} userId={user?.id} onCreated={async id => { setShowGroup(false); await refreshLists(true); openConversation(id); }} onClose={() => setShowGroup(false)}/>}
    {showThemePanel && <div className="chatModalBackdrop themeBackdrop" onMouseDown={event => event.target === event.currentTarget && setShowThemePanel(false)}>
      <div className="chatModal themePanel">
        <div className="chatModalHeader"><div><span>PERSONALIZACIÓN</span><h2>Tema del chat</h2><p>Elige color y fondo tipo WhatsApp.</p></div><button className="iconBtn" onClick={() => setShowThemePanel(false)}><X size={19}/></button></div>
        <div className="themeSection"><b>Color principal</b><div className="themeColorRow">{CHAT_ACCENTS.map(color => <button key={color} type="button" className={`themeColorDot ${chatTheme.accent === color ? 'active' : ''}`} style={{ background: color }} onClick={() => updateChatTheme({ accent: color })}/>)}</div></div>
        <div className="themeSection"><b>Fondos</b><div className="themeWallpaperGrid">{CHAT_WALLPAPERS.map(item => <button key={item.id} type="button" className={`themeWallpaper ${chatTheme.wallpaper === item.value ? 'active' : ''}`} style={{ backgroundImage: item.value }} onClick={() => updateChatTheme({ wallpaper: item.value })}><span>{item.label}</span></button>)}<button type="button" className="themeWallpaper upload" onClick={() => wallpaperInput.current?.click()}><Image size={20}/><span>Foto</span></button></div><input ref={wallpaperInput} type="file" hidden accept="image/*" onChange={uploadWallpaper}/></div>
        <div className="formActions"><button type="button" className="secondary" onClick={() => updateChatTheme(CHAT_THEME_DEFAULT)}>Restablecer</button><button type="button" onClick={() => setShowThemePanel(false)}>Listo</button></div>
      </div>
    </div>}

    {showSettingsPanel && <div className="chatModalBackdrop themeBackdrop" onMouseDown={event => event.target === event.currentTarget && setShowSettingsPanel(false)}>
      <div className="chatModal chatSettingsPanel">
        <div className="chatModalHeader"><div><span>MI ZONA CHAT · v{APP_VERSION}</span><h2>Ajustes del chat</h2><p>Perfil, apariencia, contactos, privacidad y accesos rápidos.</p></div><button className="iconBtn" onClick={() => setShowSettingsPanel(false)}><X size={19}/></button></div>
        <input ref={profilePhotoInput} type="file" hidden accept="image/*" onChange={uploadProfilePhoto}/>
        <section className="settingsProfileCard">
          <button type="button" className="settingsAvatar" onClick={() => profilePhotoInput.current?.click()}>{profileDraft.avatar ? <img src={profileDraft.avatar} alt="perfil"/> : <Camera size={26}/>}<span><Camera size={13}/></span></button>
          <div>
            <label>Nombre visible</label>
            <input value={profileDraft.displayName} onChange={event => setProfileDraft(current => ({ ...current, displayName: event.target.value }))}/>
            <label>Frase / estado</label>
            <input value={profileDraft.status} onChange={event => setProfileDraft(current => ({ ...current, status: event.target.value }))}/>
          </div>
        </section>
        <section className="settingsBlock"><h3>Apariencia</h3>
          <button type="button" onClick={() => { setShowSettingsPanel(false); setShowThemePanel(true); }}><Palette size={18}/><span>Tema, color y fondo del chat</span><ChevronLeft className="chevRight" size={18}/></button>
          <button type="button" onClick={() => { updateChatTheme({ background: '#071316', surface: '#0b1f24', header: '#071316', composer: '#071316', text: '#e9edef', subtext: '#aebac1', bubbleOwn: '#00a884', bubbleOther: '#15272e' }); setNotice('Modo oscuro aplicado al chat.'); }}><ShieldCheck size={18}/><span>Activar modo oscuro</span></button>
          <button type="button" onClick={() => { updateChatTheme(CHAT_THEME_DEFAULT); setNotice('Apariencia restablecida.'); }}><RefreshCw size={18}/><span>Restablecer apariencia</span></button>
        </section>
        <section className="settingsBlock"><h3>Contactos</h3>
          <button type="button" onClick={() => { setShowSettingsPanel(false); setShowSearch(true); }}><UserPlus size={18}/><span>Agregar usuario</span></button>
          <button type="button" onClick={() => { inviteFriend(); setShowSettingsPanel(false); }}><Link size={18}/><span>Invitar amigo con código</span></button>
          <button type="button" onClick={() => { setShowSettingsPanel(false); setTab('contacts'); showChatList(); }}><Users size={18}/><span>Administrar contactos</span></button>
        </section>
        <section className="settingsBlock"><h3>Privacidad y seguridad</h3>
          <button type="button" onClick={() => setNotice('Privacidad: se podrá elegir quién ve tu foto, frase y estado.')}><ShieldCheck size={18}/><span>Quién puede escribirme</span></button>
          <button type="button" onClick={() => setNotice('Regla activa: máximo 20 fotos por envío.')}><Image size={18}/><span>Límite de fotos: 20 por envío</span></button>
        </section>
      </div>
    </div>}

    {showAttachPanel && <div className="chatAttachmentSheetBackdrop" onMouseDown={event => event.target === event.currentTarget && setShowAttachPanel(false)}>
      <div className="chatAttachmentSheet">
        <div className="sheetHandle"/><button className="iconBtn sheetClose" type="button" onClick={() => setShowAttachPanel(false)}><X size={18}/></button>
        <div className="attachGrid">
          <button type="button" onClick={() => fileInput.current?.click()}><span className="attachIcon purple"><Camera/></span>Fotos y videos</button>
          <button type="button" onClick={() => fileInput.current?.click()}><span className="attachIcon green"><FileText/></span>Documento</button>
          <button type="button" onClick={() => fileInput.current?.click()}><span className="attachIcon pink"><Mic/></span>Audio</button>
          <button type="button" onClick={() => setShowLocationPanel(true)}><span className="attachIcon mint"><MapPin/></span>Ubicación</button>
          <button type="button" onClick={() => { setShowAttachPanel(false); setShowContactPanel(true); }}><span className="attachIcon blue"><Contact/></span>Contacto</button>
          <button type="button" onClick={() => setShowPollPanel(true)}><span className="attachIcon orange"><BarChart3/></span>Encuesta</button>
          <button type="button" onClick={() => setShowEventPanel(true)}><span className="attachIcon red"><CalendarDays/></span>Evento</button>
          <button type="button" onClick={() => { setShowAttachPanel(false); setShowOrderPanel(true); }}><span className="attachIcon indigo"><ShoppingBag/></span>Pedido</button>
          <button type="button" onClick={() => { setShowAttachPanel(false); setShowCatalogPanel(true); }}><span className="attachIcon teal"><Store/></span>Catálogo</button>
          <button className="quickReplyBtn" type="button" onClick={() => { setShowAttachPanel(false); setShowQuickPanel(true); }}><Zap size={16}/> Respuesta rápida</button>
        </div>
      </div>
    </div>}

    {showActionsPanel && <div className="chatModalBackdrop themeBackdrop" onMouseDown={event => event.target === event.currentTarget && setShowActionsPanel(false)}>
      <div className="chatModal chatActionsPanel">
        <div className="chatModalHeader"><div><span>CENTRO DE ACCIONES</span><h2>Acciones del chat</h2><p>Todo lo importante de esta conversación en un solo lugar.</p></div><button className="iconBtn" onClick={() => setShowActionsPanel(false)}><X size={19}/></button></div>
        <div className="actionsTabs">
          <button className={actionTab === 'summary' ? 'active' : ''} onClick={()=>setActionTab('summary')}><ListTodo size={17}/> Resumen</button>
          <button className={actionTab === 'orders' ? 'active' : ''} onClick={()=>setActionTab('orders')}><ShoppingBag size={17}/> Pedidos</button>
          <button className={actionTab === 'polls' ? 'active' : ''} onClick={()=>setActionTab('polls')}><BarChart3 size={17}/> Encuestas</button>
          <button className={actionTab === 'events' ? 'active' : ''} onClick={()=>setActionTab('events')}><CalendarDays size={17}/> Eventos</button>
          <button className={actionTab === 'files' ? 'active' : ''} onClick={()=>setActionTab('files')}><File size={17}/> Archivos</button>
        </div>
        <section className="actionBlock"><h3>{actionTab === 'summary' ? 'Resumen real' : actionTab === 'orders' ? 'Pedidos' : actionTab === 'polls' ? 'Encuestas' : actionTab === 'events' ? 'Eventos' : 'Archivos'}</h3>
          {actionTab === 'files' ? (messages.flatMap(item => item.attachments || []).length ? messages.flatMap(item => item.attachments || []).map(file => <AttachmentPreview key={file.id} attachment={file} onNotice={setNotice}/>) : <p>No hay archivos en esta conversación.</p>) : (() => { const types = actionTab === 'summary' ? ['location','contact','poll','event','order','catalog'] : actionTab === 'orders' ? ['order'] : actionTab === 'polls' ? ['poll'] : ['event']; const items = messages.filter(item => types.includes(parseStructured(item.body)?.type)); return items.length ? items.map(item => <StructuredMessage key={item.id} data={parseStructured(item.body)} message={item} allMessages={messages} currentUser={{...profile,id:user?.id}} onSend={sendStructured} onNotice={setNotice} onStopLive={stopLiveLocation}/>) : <p>No hay elementos en esta categoría.</p>; })()}
        </section>
      </div>
    </div>}


    {showContactPanel && <div className="chatModalBackdrop themeBackdrop" onMouseDown={event=>event.target===event.currentTarget&&setShowContactPanel(false)}><div className="chatModal compactActionForm"><div className="chatModalHeader"><div><span>CONTACTO</span><h2>Compartir contacto</h2><p>La tarjeta permitirá llamar, abrir WhatsApp o copiar los datos.</p></div><button className="iconBtn" onClick={()=>setShowContactPanel(false)}><X size={19}/></button></div><label>Nombre</label><input value={contactDraft.name} onChange={e=>setContactDraft(c=>({...c,name:e.target.value}))} placeholder="Nombre completo"/><label>Teléfono</label><input type="tel" value={contactDraft.phone} onChange={e=>setContactDraft(c=>({...c,phone:e.target.value}))} placeholder="+51 999 999 999"/><label>Nota opcional</label><textarea value={contactDraft.note} onChange={e=>setContactDraft(c=>({...c,note:e.target.value}))}/><div className="formActions"><button onClick={createContactShare}>Compartir contacto</button></div></div></div>}

    {showOrderPanel && <div className="chatModalBackdrop themeBackdrop" onMouseDown={event=>event.target===event.currentTarget&&setShowOrderPanel(false)}><div className="chatModal compactActionForm"><div className="chatModalHeader"><div><span>PEDIDO</span><h2>Crear pedido</h2><p>Se podrá confirmar y actualizar su estado dentro del chat.</p></div><button className="iconBtn" onClick={()=>setShowOrderPanel(false)}><X size={19}/></button></div><label>Producto o servicio</label><input value={orderDraft.item} onChange={e=>setOrderDraft(c=>({...c,item:e.target.value}))}/><div className="twoCols"><div><label>Cantidad</label><input type="number" min="1" value={orderDraft.quantity} onChange={e=>setOrderDraft(c=>({...c,quantity:e.target.value}))}/></div><div><label>Precio unitario</label><input type="number" min="0" step="0.01" value={orderDraft.price} onChange={e=>setOrderDraft(c=>({...c,price:e.target.value}))}/></div></div><label>Observación</label><textarea value={orderDraft.note} onChange={e=>setOrderDraft(c=>({...c,note:e.target.value}))}/><div className="formActions"><button onClick={createOrderShare}>Enviar pedido</button></div></div></div>}

    {showCatalogPanel && <div className="chatModalBackdrop themeBackdrop" onMouseDown={event=>event.target===event.currentTarget&&setShowCatalogPanel(false)}><div className="chatModal compactActionForm"><div className="chatModalHeader"><div><span>CATÁLOGO</span><h2>Compartir producto o servicio</h2><p>El receptor podrá crear un pedido desde la tarjeta.</p></div><button className="iconBtn" onClick={()=>setShowCatalogPanel(false)}><X size={19}/></button></div><label>Proveedor</label><input value={catalogDraft.provider} onChange={e=>setCatalogDraft(c=>({...c,provider:e.target.value}))}/><label>Producto o servicio</label><input value={catalogDraft.item} onChange={e=>setCatalogDraft(c=>({...c,item:e.target.value}))}/><div className="twoCols"><div><label>Precio</label><input type="number" min="0" step="0.01" value={catalogDraft.price} onChange={e=>setCatalogDraft(c=>({...c,price:e.target.value}))}/></div><div><label>Disponibilidad</label><select value={catalogDraft.availability} onChange={e=>setCatalogDraft(c=>({...c,availability:e.target.value}))}><option>Disponible</option><option>Agotado</option><option>Bajo pedido</option></select></div></div><label>Descripción</label><textarea value={catalogDraft.description} onChange={e=>setCatalogDraft(c=>({...c,description:e.target.value}))}/><div className="formActions"><button onClick={createCatalogShare}>Compartir catálogo</button></div></div></div>}

    {showQuickPanel && <div className="chatModalBackdrop themeBackdrop" onMouseDown={event=>event.target===event.currentTarget&&setShowQuickPanel(false)}><div className="chatModal quickReplyPanel"><div className="chatModalHeader"><div><span>RESPUESTAS RÁPIDAS</span><h2>Elige una respuesta</h2><p>Se envía como mensaje normal y puede editarse después desde el chat.</p></div><button className="iconBtn" onClick={()=>setShowQuickPanel(false)}><X size={19}/></button></div>{['Gracias por escribir. Te confirmo en unos minutos.','Ya estoy llegando.','¿Puedes enviarme tu ubicación?','Pedido recibido. Estamos preparándolo.','De acuerdo, quedamos coordinados.'].map(text=><button className="quickReplyChoice" key={text} onClick={()=>{sendSpecialText(text);setShowQuickPanel(false)}}>{text}<Send size={16}/></button>)}</div></div>}

    {showLocationPanel && <div className="chatModalBackdrop themeBackdrop" onMouseDown={event=>event.target===event.currentTarget&&setShowLocationPanel(false)}>
      <div className="chatModal locationPanel locationPicker3066">
        <div className="chatModalHeader"><div><span>UBICACIÓN</span><h2>Enviar ubicación</h2><p>Elige tu punto actual, un lugar cercano o comparte tu recorrido en vivo.</p></div><button className="iconBtn" onClick={()=>setShowLocationPanel(false)}><X size={19}/></button></div>
        {!locationReady ? <div className="locationPermissionCard"><ShieldCheck/><div><b>Permitir acceso a la ubicación</b><span>MiZona solo la usará cuando tú decidas compartirla.</span></div><button type="button" onClick={requestLocationAccess} disabled={locationChecking}>{locationChecking?'Comprobando…':'Habilitar ubicación'}</button></div> : <>
          <form className="locationSearch3066" onSubmit={runLocationSearch}><Search size={19}/><input value={locationSearch} onChange={e=>setLocationSearch(e.target.value)} placeholder="Buscar lugar o dirección"/><button type="submit" disabled={locationLoading||!locationSearch.trim()}><Search size={18}/></button><button type="button" title="Actualizar mi ubicación" onClick={refreshLocation}><RefreshCw size={18}/></button></form>
          {locationPosition && <div className="locationMap3066"><iframe title="Mapa actual" src={osmEmbedUrl(selectedPlace?.lat||locationPosition.lat,selectedPlace?.lng||locationPosition.lng,15)} loading="lazy"/><button className="recenterMap3066" type="button" onClick={()=>setSelectedPlace(null)}><MapPin size={18}/> Centrar</button></div>}
          <button className="liveLocationOption3066" type="button"><Zap/><div><b>Ubicación en tiempo real</b><span>{liveLocationActive?`Activa hasta ${new Date(liveLocationActive.expiresAt).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}`:'Comparte tus cambios de posición durante un tiempo limitado.'}</span></div></button>
          {liveLocationActive ? <button className="stopLive3066" type="button" onClick={()=>stopLiveLocation()}>Dejar de compartir</button> : <div className="durationGrid"><button type="button" onClick={()=>startLiveLocation(15)}>15 minutos</button><button type="button" onClick={()=>startLiveLocation(60)}>1 hora</button><button type="button" onClick={()=>startLiveLocation(480)}>8 horas</button></div>}
          <div className="locationSectionTitle3066">Lugares cercanos</div>
          <button className="currentLocationRow3066" type="button" onClick={sendCurrentLocation}><span className="locationRoundIcon3066"><MapPin/></span><div><b>Enviar tu ubicación actual</b><span>{locationAddress?.address || 'Obteniendo dirección…'}</span><small>Margen de precisión: {Math.round(locationPosition?.accuracy||0)} metros</small></div></button>
          {locationLoading && <div className="locationLoading3066"><Loader2 className="spin"/> Buscando lugares…</div>}
          <div className="locationPlaces3066">{(locationSearch.trim()?locationResults:nearbyPlaces).map(place=><button type="button" key={place.id} className={selectedPlace?.id===place.id?'active':''} onClick={()=>setSelectedPlace(place)} onDoubleClick={()=>sendLocationPoint(place)}><span className="locationRoundIcon3066"><MapPin/></span><div><b>{place.name}</b><span>{place.address}</span></div><em onClick={e=>{e.stopPropagation();sendLocationPoint(place)}}>Enviar</em></button>)}</div>
          {selectedPlace && <div className="selectedPlaceBar3066"><div><b>{selectedPlace.name}</b><span>{selectedPlace.address}</span></div><button type="button" onClick={()=>sendLocationPoint(selectedPlace)}>Enviar este lugar</button></div>}
        </>}
      </div>
    </div>}

    {showPollPanel && <div className="chatModalBackdrop themeBackdrop" onMouseDown={event => event.target === event.currentTarget && setShowPollPanel(false)}>
      <div className="chatModal pollPanel">
        <div className="chatModalHeader"><div><span>ENCUESTA</span><h2>Nueva encuesta</h2><p>Se crea y se vota dentro del mismo chat.</p></div><button className="iconBtn" onClick={() => setShowPollPanel(false)}><X size={19}/></button></div>
        <label>Pregunta</label><input value={pollDraft.question} onChange={event => setPollDraft(current => ({ ...current, question: event.target.value }))} placeholder="¿Qué día hacemos la reunión?"/>
        <label>Opciones</label>{pollDraft.options.map((option, index) => <div className="pollOptionRow" key={index}><input value={option} onChange={event => setPollDraft(current => ({ ...current, options: current.options.map((item, i) => i === index ? event.target.value : item) }))}/><button type="button" onClick={() => setPollDraft(current => ({ ...current, options: current.options.filter((_, i) => i !== index) }))}><X size={15}/></button></div>)}
        <button type="button" className="secondary" onClick={() => setPollDraft(current => ({ ...current, options: [...current.options, ''] }))}>Agregar opción</button>
        <label className="switchRow"><span>Permitir varias respuestas</span><input type="checkbox" checked={pollDraft.multiple} onChange={event => setPollDraft(current => ({ ...current, multiple: event.target.checked }))}/></label>
        <label className="switchRow"><span>Mostrar resultados a todos</span><input type="checkbox" checked={pollDraft.results} onChange={event => setPollDraft(current => ({ ...current, results: event.target.checked }))}/></label>
        <div className="formActions"><button type="button" onClick={createPoll}>Crear encuesta</button></div>
      </div>
    </div>}

    {showEventPanel && <div className="chatModalBackdrop themeBackdrop" onMouseDown={event => event.target === event.currentTarget && setShowEventPanel(false)}>
      <div className="chatModal eventPanel">
        <div className="chatModalHeader"><div><span>EVENTO</span><h2>Crear evento</h2><p>Ideal para reuniones, entregas, clases o actividades.</p></div><button className="iconBtn" onClick={() => setShowEventPanel(false)}><X size={19}/></button></div>
        <label>Título</label><input value={eventDraft.title} onChange={event => setEventDraft(current => ({ ...current, title: event.target.value }))} placeholder="Reunión de padres"/>
        <div className="twoCols"><div><label>Fecha</label><input type="date" value={eventDraft.date} onChange={event => setEventDraft(current => ({ ...current, date: event.target.value }))}/></div><div><label>Hora</label><input type="time" value={eventDraft.time} onChange={event => setEventDraft(current => ({ ...current, time: event.target.value }))}/></div></div>
        <label>Lugar</label><input value={eventDraft.place} onChange={event => setEventDraft(current => ({ ...current, place: event.target.value }))} placeholder="Casa comunal"/>
        <label>Descripción</label><textarea value={eventDraft.description} onChange={event => setEventDraft(current => ({ ...current, description: event.target.value }))} placeholder="Detalle del evento"/>
        <div className="formActions"><button type="button" onClick={createEvent}>Enviar evento</button></div>
      </div>
    </div>}

  </div>;
}
