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
import { listCommunities, listMyMemberships, loadCommunityBundle } from '../lib/community';
import {
  blockChatUser, createChatGroup, findChatProfileExact, leaveConversation,
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

const formatBytes = value => {
  const bytes = Number(value || 0);
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const initials = value => String(value || 'U').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

const CHAT_THEME_DEFAULT = {
  accent: '#25d366',
  background: '#efeae2',
  wallpaper: 'radial-gradient(circle at 25% 20%, rgba(37,211,102,.10), transparent 0 32%), radial-gradient(circle at 80% 0%, rgba(14,165,233,.10), transparent 0 26%), linear-gradient(180deg, rgba(255,255,255,.88), rgba(255,255,255,.88))',
  surface: '#ffffff',
  header: '#ffffff',
  composer: '#ffffff',
  text: '#111b21',
  subtext: '#667781'
};

const CHAT_ACCENTS = ['#25d366', '#0ea5e9', '#8b5cf6', '#ef4444', '#f59e0b'];
const CHAT_WALLPAPERS = [
  { id: 'soft', label: 'Suave', value: CHAT_THEME_DEFAULT.wallpaper },
  { id: 'mint', label: 'Menta', value: 'radial-gradient(circle at 20% 20%, rgba(45,212,191,.14), transparent 0 30%), radial-gradient(circle at 80% 0%, rgba(16,185,129,.12), transparent 0 26%), linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.92))' },
  { id: 'sky', label: 'Cielo', value: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,.15), transparent 0 30%), radial-gradient(circle at 80% 0%, rgba(125,211,252,.18), transparent 0 26%), linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.92))' },
  { id: 'sand', label: 'Arena', value: 'radial-gradient(circle at 20% 20%, rgba(245,158,11,.12), transparent 0 28%), radial-gradient(circle at 80% 0%, rgba(234,179,8,.10), transparent 0 24%), linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.92))' }
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
      {message && <ChatNotice kind="danger">{message}</ChatNotice>}
      <div className="formActions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button disabled={loading || !title.trim()}>{loading ? <Loader2 className="spin" size={18}/> : <Plus size={18}/>} Crear grupo</button></div>
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
  const [immersiveMode, setImmersiveMode] = useState(true);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showAttachPanel, setShowAttachPanel] = useState(false);
  const [showActionsPanel, setShowActionsPanel] = useState(false);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [showPollPanel, setShowPollPanel] = useState(false);
  const [showEventPanel, setShowEventPanel] = useState(false);
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
    let lastKey = '';
    messages.forEach(message => {
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
    const source = tab === 'groups' ? groupConversations : conversations;
    const q = searchText.trim().toLowerCase();
    if (!q) return source;
    return source.filter(item => [conversationName(item), item.last_message, item.peer_username, item.title].filter(Boolean).some(value => String(value).toLowerCase().includes(q)));
  }, [tab, groupConversations, conversations, searchText]);

  const filteredContacts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(item => [item.display_name, item.username, item.zone].filter(Boolean).some(value => String(value).toLowerCase().includes(q)));
  }, [contacts, searchText]);

  const updateChatTheme = patch => setChatTheme(current => ({ ...current, ...patch }));
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
    const unsubscribe = subscribeToChat(async () => {
      const contactList = await loadChatContacts();
      const requestList = await loadChatRequests();
      const conversationList = await loadConversations();
      setContacts(contactList || []);
      setRequests(requestList || []);
      setConversations(conversationList || []);
      if (selectedId) {
        setMessages(await loadMessages(selectedId));
        await markConversationRead(selectedId);
      }
    });
    return () => unsubscribe?.();
  }, [selectedId]);

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

  const sendCurrentLocation = () => {
    if (!navigator.geolocation) {
      setNotice('Tu navegador no permite compartir ubicación.');
      return;
    }
    setNotice('Obteniendo ubicación...');
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const url = mapsUrl(latitude, longitude);
        sendSpecialText(`📍 Ubicación actual\n${url}\nHora: ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`);
      },
      () => setNotice('No se pudo obtener tu ubicación. Revisa los permisos del navegador.'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 }
    );
  };

  const sendLiveLocationDemo = minutes => {
    sendSpecialText(`🛰️ Ubicación en tiempo real solicitada\nDuración: ${minutes} minutos\nEstado: pendiente de activar permisos de ubicación en el dispositivo.`);
  };

  const createPoll = () => {
    const options = pollDraft.options.map(item => item.trim()).filter(Boolean);
    if (!pollDraft.question.trim() || options.length < 2) {
      setNotice('La encuesta necesita una pregunta y mínimo 2 opciones.');
      return;
    }
    sendSpecialText(`📊 Encuesta\n${pollDraft.question.trim()}\n${options.map((option, index) => `${index + 1}. ${option}`).join('\n')}\n${pollDraft.multiple ? 'Permite varias respuestas' : 'Una sola respuesta'} · ${pollDraft.results ? 'Resultados visibles' : 'Resultados ocultos'}`);
    setPollDraft({ question: '', options: ['Sí', 'No'], multiple: false, results: true });
  };

  const createEvent = () => {
    if (!eventDraft.title.trim()) {
      setNotice('El evento necesita un título.');
      return;
    }
    sendSpecialText(`📅 Evento\n${eventDraft.title.trim()}\nFecha: ${eventDraft.date || 'por definir'} ${eventDraft.time || ''}\nLugar: ${eventDraft.place || 'por definir'}\n${eventDraft.description || ''}`.trim());
    setEventDraft({ title: '', date: '', time: '', place: '', description: '' });
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
    if (!window.confirm(`¿Bloquear a ${contact.display_name}? Ya no podrán encontrarse ni conversar.`)) return;
    try {
      await blockChatUser(contact.id, 'Bloqueado por el usuario');
      setNotice(`${contact.display_name} fue bloqueado.`);
      await refreshLists(false);
    } catch (error) {
      setNotice(error.message);
    }
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
      <div><span>{isStudent ? 'CHAT SEGURO PARA ESTUDIANTES' : 'ETAPA 14 · LABORATORIO MULTIUSUARIO'}</span><h1>MiZona Chat</h1><p>{isStudent ? 'Elige chats, grupos, contactos o solicitudes permitidas. No quedas encerrado en una conversación.' : 'Prueba conversaciones reales entre perfiles locales usando varias pestañas.'}</p></div>
      <div className="chatHeaderActions"><button className="secondary" onClick={() => refreshLists(true)}><RefreshCw size={17}/> Actualizar</button>{!isStudent && <button onClick={() => setShowGroup(true)}><MessageSquarePlus size={17}/> Nuevo grupo</button>}<button onClick={() => setShowSearch(true)}><UserPlus size={17}/> {isStudent ? 'Buscar permitido' : 'Agregar contacto'}</button><button className="secondary" onClick={() => setShowThemePanel(true)}><Palette size={17}/> Tema</button>{immersiveMode ? <button className="secondary" onClick={() => setImmersiveMode(false)}><Minimize2 size={17}/> Salir pantalla completa</button> : <button className="secondary" onClick={() => setImmersiveMode(true)}><Maximize2 size={17}/> Pantalla completa</button>}</div>
    </div>

    {!backendConnected && <div className="chatLocalModeNotice"><ChatNotice kind="success">Modo local multiusuario activo. Los cambios se comparten en este navegador.</ChatNotice></div>}
    {notice && <ChatNotice kind={notice.includes('bloqueado') || notice.includes('Reporte enviado') ? 'success' : 'danger'}>{notice}</ChatNotice>}

    <div className={`chatWorkspace ${mobileConversation ? 'showConversation' : ''}`}>
      <aside className="chatDirectory">
        <div className="chatDirectoryTop">
          <div className="chatDirectoryHeaderBar chatTopCompact">
            <div><b><span>MiZona</span> Chat</b><span>{tab === 'groups' ? 'Grupos y conversaciones' : tab === 'contacts' ? 'Tus contactos' : tab === 'requests' ? 'Solicitudes pendientes' : 'Tus chats recientes'}</span></div>
            <div className="chatDirectoryHeaderActions">
              <button type="button" className="chatSettingsBtn" onClick={() => setShowSettingsPanel(true)} title="Ajustes"><Settings size={16}/> Ajustes</button>
              {immersiveMode ? <button type="button" className="chatFullscreenToggle" onClick={() => setImmersiveMode(false)}><Minimize2 size={16}/> Salir</button> : <button type="button" className="chatFullscreenToggle" onClick={() => setImmersiveMode(true)}><Maximize2 size={16}/> Full</button>}
            </div>
          </div>
          <div className="chatSearchBar"><Search size={17}/><input value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="Buscar conversación o usuario"/><button type="button" title="Filtros"><SlidersHorizontal size={16}/></button></div>
          {isStudent && <ChatNotice kind="success">Solo verás contactos y grupos aprobados para tu cuenta estudiantil.</ChatNotice>}
          <div className="chatTabs">
            <button className={tab === 'chats' ? 'active' : ''} onClick={() => setTab('chats')}><MessageCircle size={16}/> Chats</button>
            <button className={tab === 'groups' ? 'active' : ''} onClick={() => setTab('groups')}><Users size={16}/> Grupos</button>
            <button className={tab === 'contacts' ? 'active' : ''} onClick={() => setTab('contacts')}><CircleUserRound size={16}/> Contactos</button>
            <button className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}><UserPlus size={16}/> Solicitudes{receivedPending.length > 0 && <i>{receivedPending.length}</i>}</button>
          </div>
        </div>

        {loading ? <div className="chatListLoading"><Loader2 className="spin"/> Cargando...</div> : (tab === 'chats' || tab === 'groups') ? <div className="conversationList">{filteredConversations.length ? filteredConversations.map(item => <button key={item.id} className={selectedId === item.id ? 'active' : ''} onClick={() => openConversation(item.id)}><Avatar name={conversationName(item)} image={item.peer_avatar_url}/><span><b>{conversationName(item)}</b><small>{item.type === 'direct' ? (item.last_message || 'Conversación nueva') : `${item.type?.includes('school') ? 'Grupo escolar' : 'Grupo privado'} · ${item.last_message || 'Sin mensajes recientes'}`}</small></span><em>{formatTime(item.last_message_at || item.updated_at)}{Number(item.unread_count) > 0 && <i>{item.unread_count}</i>}</em></button>) : <div className="chatDirectoryEmpty"><MessageCircle size={34}/><b>{tab === 'groups' ? 'Aún no tienes grupos' : 'Aún no hay conversaciones'}</b><span>{isStudent ? 'Cuando un grupo o contacto sea autorizado aparecerá aquí.' : 'Agrega un contacto o crea un grupo.'}</span></div>}</div> : tab === 'contacts' ? <div className="contactListReal">{filteredContacts.length ? filteredContacts.map(contact => <article key={contact.id}><Avatar name={contact.display_name} image={contact.avatar_url}/><div><b>{contact.display_name}</b><span>@{String(contact.username || '').toUpperCase()}</span><small>{contact.account_type === 'student' ? 'Estudiante protegido' : contact.zone || 'Contacto MiZona'}</small></div><div className="contactActions"><button title="Conversar" onClick={() => startDirect(contact)}><MessageCircle size={17}/></button>{!isStudent && <button className="danger" title="Bloquear" onClick={() => block(contact)}><Ban size={17}/></button>}</div></article>) : <div className="chatDirectoryEmpty"><CircleUserRound size={34}/><b>Sin contactos aceptados</b><span>{isStudent ? 'Tus contactos permitidos aparecerán aquí.' : 'Busca por usuario exacto para enviar solicitud.'}</span>{!isStudent && <button onClick={() => setShowSearch(true)}>Buscar usuario</button>}</div>}</div> : <div className="requestListReal">{requests.length ? requests.map(request => <article key={request.id}><Avatar name={request.display_name} image={request.avatar_url}/><div><b>{request.display_name}</b><span>@{String(request.username || '').toUpperCase()}</span><small>{request.direction === 'received' ? 'Quiere agregarte' : request.status === 'pending' ? 'Esperando respuesta' : request.status}</small></div>{request.direction === 'received' && request.status === 'pending' ? <div><button onClick={() => review(request, 'accepted')}><Check size={16}/></button><button className="danger" onClick={() => review(request, 'rejected')}><X size={16}/></button></div> : <em>{request.status}</em>}</article>) : <div className="chatDirectoryEmpty"><UserPlus size={34}/><b>No hay solicitudes</b><span>Las invitaciones aparecerán aquí.</span></div>}</div>}
      </aside>

      <section className="chatConversation">
        {selected ? <>
          <header className="conversationHeader">
            <button className="iconBtn chatBack" onClick={showChatList}><ChevronLeft/></button>
            <Avatar name={conversationName(selected)} image={selected.peer_avatar_url}/>
            <div><b>{conversationName(selected)}</b><span>{selected.type === 'direct' ? `@${String(selected.peer_username || '').toUpperCase()}` : selected.type?.includes('school') ? 'Grupo escolar protegido' : 'Grupo privado'} · elimina mensajes en {selected.retention_days || 7} días</span></div>
            <button className="chatViewListBtn" type="button" onClick={showChatList}>Chats</button>
            {immersiveMode ? <button className="chatViewListBtn secondary" type="button" onClick={() => setImmersiveMode(false)}>Salir</button> : <button className="chatViewListBtn secondary" type="button" onClick={() => setImmersiveMode(true)}>Full</button>}
            <button className="iconBtn" onClick={async () => { if (window.confirm('¿Salir de esta conversación?')) { await leaveConversation(selected.id); await refreshLists(false); showChatList(); } }}><MoreVertical/></button>
          </header>
          <div className="retentionBanner"><ShieldCheck size={16}/> Tus mensajes y archivos se eliminan automáticamente después de {selected.retention_days || 7} días.</div>
          <div className="messageStream">
            {showOpeningSkeleton && <div className="chatOpenSkeleton"><Loader2 className="spin" size={22}/><span>Abriendo conversación…</span></div>}
            {!openingConversation && groupedMessages.length ? groupedMessages.map(item => {
              if (item.type === 'date') return <div key={item.id} className="chatDateSeparator"><span>{item.label}</span></div>;
              const message = item.message;
              const own = message.sender_id === user?.id || message.sender_username === profile.username;
              return <div key={message.id} className={`messageRow ${own ? 'own' : ''}`}>
                {!own && <Avatar small name={message.sender_display_name} image={message.sender_avatar_url}/>}<div className="messageBubble">
                  {!own && <b>{message.sender_display_name}</b>}
                  {message.body && <p>{message.body}</p>}
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
            <button type="button" className="iconBtn" title="Audio" onClick={() => sendSpecialText('🎙️ Nota de voz\nPendiente de grabación desde el dispositivo.')} disabled={sending}><Mic size={20}/></button>
            <button disabled={sending || !composer.trim()}>{sending ? <Loader2 className="spin" size={20}/> : <Send size={20}/>}</button>
          </form>
        </> : <div className="noConversationSelected"><div><MessageCircle size={58}/><h2>Selecciona una conversación</h2><p>También puedes crear un grupo o buscar a una persona por su usuario exacto.</p><button onClick={() => setShowSearch(true)}><UserPlus size={18}/> Agregar contacto</button></div></div>}
      </section>
    </div>

    <div className="chatSafetyGrid"><article><ShieldCheck/><div><b>Protección escolar</b><span>Las cuentas estudiantiles solo se encuentran dentro de relaciones escolares válidas.</span></div></article><article><FileUp/><div><b>Archivos privados</b><span>Hasta 25 MB, con enlaces temporales y acceso exclusivo para integrantes.</span></div></article><article><Ban/><div><b>Bloquear y reportar</b><span>El bloqueo elimina el contacto y detiene nuevas solicitudes.</span></div></article></div>

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
        <div className="chatModalHeader"><div><span>MI ZONA CHAT 30.33</span><h2>Ajustes del chat</h2><p>Perfil, apariencia, contactos, privacidad y accesos rápidos.</p></div><button className="iconBtn" onClick={() => setShowSettingsPanel(false)}><X size={19}/></button></div>
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
          <button type="button" onClick={() => setShowThemePanel(true)}><Palette size={18}/><span>Tema, color y fondo del chat</span><ChevronLeft className="chevRight" size={18}/></button>
          <button type="button" onClick={() => updateChatTheme({ background: '#0b141a', surface: '#111b21', header: '#111b21', composer: '#111b21', text: '#e9edef', subtext: '#aebac1' })}><ShieldCheck size={18}/><span>Activar modo oscuro</span></button>
          <button type="button" onClick={() => updateChatTheme(CHAT_THEME_DEFAULT)}><RefreshCw size={18}/><span>Restablecer apariencia</span></button>
        </section>
        <section className="settingsBlock"><h3>Contactos</h3>
          <button type="button" onClick={() => { setShowSettingsPanel(false); setShowSearch(true); }}><UserPlus size={18}/><span>Agregar usuario</span></button>
          <button type="button" onClick={inviteFriend}><Link size={18}/><span>Invitar amigo con código</span></button>
          <button type="button" onClick={() => setNotice('Próximo: administrar quién puede agregarte o escribirte.')}><Users size={18}/><span>Administrar contactos</span></button>
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
          <button type="button" onClick={() => sendSpecialText('👤 Contacto compartido\nNombre: por seleccionar\nTeléfono: por agregar')}><span className="attachIcon blue"><Contact/></span>Contacto</button>
          <button type="button" onClick={() => setShowPollPanel(true)}><span className="attachIcon orange"><BarChart3/></span>Encuesta</button>
          <button type="button" onClick={() => setShowEventPanel(true)}><span className="attachIcon red"><CalendarDays/></span>Evento</button>
          <button type="button" onClick={() => sendSpecialText('🧾 Pedido registrado\nProducto/servicio: por definir\nEstado: pendiente de confirmar')}><span className="attachIcon indigo"><ShoppingBag/></span>Pedido</button>
          <button type="button" onClick={() => sendSpecialText('🏪 Catálogo\nEl proveedor compartirá productos o servicios disponibles.')}><span className="attachIcon teal"><Store/></span>Catálogo</button>
          <button className="quickReplyBtn" type="button" onClick={() => sendSpecialText('⚡ Respuesta rápida\nGracias por escribir. Te confirmo en unos minutos.') }><Zap size={16}/> Respuesta rápida</button>
        </div>
      </div>
    </div>}

    {showActionsPanel && <div className="chatModalBackdrop themeBackdrop" onMouseDown={event => event.target === event.currentTarget && setShowActionsPanel(false)}>
      <div className="chatModal chatActionsPanel">
        <div className="chatModalHeader"><div><span>CENTRO DE ACCIONES</span><h2>Acciones del chat</h2><p>Todo lo importante de esta conversación en un solo lugar.</p></div><button className="iconBtn" onClick={() => setShowActionsPanel(false)}><X size={19}/></button></div>
        <div className="actionsTabs">
          <button className="active"><ListTodo size={17}/> Resumen</button>
          <button><ShoppingBag size={17}/> Pedidos</button>
          <button><BarChart3 size={17}/> Encuestas</button>
          <button><CalendarDays size={17}/> Eventos</button>
          <button><File size={17}/> Archivos</button>
        </div>
        <section className="actionBlock"><h3>Pendientes</h3>
          <article><ClipboardCheck/><div><b>Confirmar recibido</b><span>Pedido registrado o entrega pendiente.</span></div><button>Confirmar</button></article>
          <article><BarChart3/><div><b>Votar encuesta</b><span>Encuestas activas del grupo o conversación.</span></div><button>Votar</button></article>
          <article><Star/><div><b>Calificar proveedor</b><span>Después de recibir un producto o servicio.</span></div><button>Calificar</button></article>
        </section>
        <section className="actionBlock"><h3>Resumen automático</h3>
          <p>Hoy se enviaron {messages.length} mensajes. Esta sección reunirá pedidos, ubicaciones, archivos, encuestas, eventos y acuerdos sin buscarlos manualmente.</p>
        </section>
      </div>
    </div>}

    {showLocationPanel && <div className="chatModalBackdrop themeBackdrop" onMouseDown={event => event.target === event.currentTarget && setShowLocationPanel(false)}>
      <div className="chatModal locationPanel">
        <div className="chatModalHeader"><div><span>UBICACIÓN</span><h2>Compartir ubicación</h2><p>Comparte tu ubicación actual o tiempo real con personas de confianza.</p></div><button className="iconBtn" onClick={() => setShowLocationPanel(false)}><X size={19}/></button></div>
        <button className="locationOption" type="button" onClick={sendCurrentLocation}><MapPin/><div><b>Enviar mi ubicación actual</b><span>Envía tu punto exacto de este momento y abre Google Maps.</span></div></button>
        <div className="locationOption passive"><MapPin/><div><b>Compartir ubicación en tiempo real</b><span>Disponible como base. El seguimiento continuo se activará con permisos y temporizador.</span></div></div>
        <div className="durationGrid"><button onClick={() => sendLiveLocationDemo(15)}>15 minutos</button><button onClick={() => sendLiveLocationDemo(60)}>1 hora</button><button onClick={() => sendLiveLocationDemo(480)}>8 horas</button></div>
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
