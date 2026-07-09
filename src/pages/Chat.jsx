import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Ban, Check, ChevronLeft, CircleUserRound, Download, File,
  FileUp, Image, Info, Loader2, MessageCircle, MessageSquarePlus, MoreVertical,
  Paperclip, Plus, RefreshCw, Search, Send, ShieldCheck, SlidersHorizontal, UserPlus, Users, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { listCommunities, listMyMemberships, loadCommunityBundle } from '../lib/community';
import {
  blockChatUser, createChatGroup, demoRequests, findChatProfileExact, leaveConversation,
  loadChatContacts, loadChatRequests, loadConversations, loadMessages, markConversationRead,
  openChatAttachment, reportChatItem, reviewContactRequest, sendChatFile, sendContactRequest,
  sendTextMessage, startDirectConversation, subscribeToChat
} from '../lib/chat';

const formatTime = value => {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

const formatBytes = value => {
  const bytes = Number(value || 0);
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const initials = value => String(value || 'U').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

function Avatar({ name, image, small = false }) {
  return <div className={`chatAvatar ${small ? 'small' : ''}`}>
    {image ? <img src={image} alt=""/> : initials(name)}
  </div>;
}

function ChatNotice({ kind = 'info', children }) {
  return <div className={`chatNotice ${kind}`}>
    {kind === 'danger' ? <AlertTriangle size={17}/> : kind === 'success' ? <Check size={17}/> : <Info size={17}/>}<span>{children}</span>
  </div>;
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
  const [searchText, setSearchText] = useState('');
  const fileInput = useRef(null);
  const messageEnd = useRef(null);

  const selected = useMemo(() => conversations.find(item => item.id === selectedId) || null, [conversations, selectedId]);

  useEffect(() => {
    const active = mobileConversation && Boolean(selectedId);
    document.body.classList.toggle('mizona-chat-fullscreen', active);
    return () => document.body.classList.remove('mizona-chat-fullscreen');
  }, [mobileConversation, selectedId]);
  const receivedPending = requests.filter(item => item.direction === 'received' && item.status === 'pending');
  const isStudent = String(profile?.account_type || profile?.type || profile?.role || '').toLowerCase().includes('student') || String(profile?.role || '').toLowerCase().includes('alumno');
  const conversationName = item => item?.type === 'direct' ? item.peer_display_name || item.peer_username || 'Conversación' : item?.title || 'Grupo';
  const directConversations = useMemo(() => conversations.filter(item => item.type === 'direct'), [conversations]);
  const groupConversations = useMemo(() => conversations.filter(item => item.type !== 'direct'), [conversations]);
  const filteredConversations = useMemo(() => {
    const source = tab === 'groups' ? groupConversations : conversations;
    const q = searchText.trim().toLowerCase();
    if (!q) return source;
    return source.filter(item => [conversationName(item), item.last_message, item.peer_username, item.title].filter(Boolean).some(value => String(value).toLowerCase().includes(q)));
  }, [tab, conversations, groupConversations, searchText]);
  const filteredContacts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(item => [item.display_name, item.username, item.zone].filter(Boolean).some(value => String(value).toLowerCase().includes(q)));
  }, [contacts, searchText]);

  const refreshLists = async (keepSelection = true) => {
    setNotice('');
    const [nextContacts, nextRequests, nextConversations] = await Promise.all([
      loadChatContacts(), loadChatRequests(), loadConversations()
    ]);
    setContacts(nextContacts);
    setRequests(nextRequests);
    setConversations(nextConversations);
    const pendingOpen = sessionStorage.getItem('mizona-chat-open-conversation');
    if (pendingOpen && nextConversations.some(item => item.id === pendingOpen)) {
      sessionStorage.removeItem('mizona-chat-open-conversation');
      setSelectedId(pendingOpen);
      setMobileConversation(true);
      setTab('chats');
      return;
    }
    if (!keepSelection || !selectedId) setSelectedId(nextConversations[0]?.id || null);
    else if (!nextConversations.some(item => item.id === selectedId)) setSelectedId(nextConversations[0]?.id || null);
  };

  useEffect(() => {
    if (backendConnected && !isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refreshLists(false).catch(error => setNotice(error.message)).finally(() => setLoading(false));
  }, [backendConnected, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!selectedId) return setMessages([]);
    loadMessages(selectedId)
      .then(data => { setMessages(data); markConversationRead(selectedId).catch(() => {}); })
      .catch(error => setNotice(error.message));
  }, [selectedId]);

  useEffect(() => {
    const cleanup = subscribeToChat({
      userId: user?.id,
      conversationId: selectedId,
      onConversationChange: () => refreshLists(true).catch(() => {}),
      onRequestChange: () => refreshLists(true).catch(() => {}),
      onMessageChange: () => {
        loadMessages(selectedId).then(setMessages).catch(() => {});
        refreshLists(true).catch(() => {});
      }
    });
    return cleanup;
  }, [user?.id, selectedId]);

  useEffect(() => messageEnd.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const openConversation = id => {
    if (!id) return;
    setSelectedId(id);
    setMobileConversation(true);
  };

  const showChatList = () => {
    setMobileConversation(false);
    setTab('chats');
    setSearchText('');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };

  const startDirect = async contact => {
    setLoading(true);
    setNotice('');
    try {
      const id = await startDirectConversation(contact.id);
      await refreshLists(true);
      setSelectedId(id);
      setMobileConversation(true);
      setTab('chats');
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
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selectedId) return;
    setSending(true);
    try {
      await sendChatFile({ conversationId: selectedId, file, userId: user.id });
      setMessages(await loadMessages(selectedId));
      await refreshLists(true);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSending(false);
    }
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


  if (backendConnected && !isAuthenticated) return <div className="chatLoginGate">
    <div><ShieldCheck size={48}/><h1>MiZona Chat protegido</h1><p>Inicia sesión para buscar contactos, recibir invitaciones y conversar de forma segura.</p><button onClick={() => setPage('settings')}>Ingresar o crear cuenta</button></div>
  </div>;

  return <div className={`chatRealPage ${mobileConversation && selectedId ? 'mobileChatFullscreen' : 'mobileChatListMode'}`}>
    <div className="chatPageHeader">
      <div><span>{isStudent ? 'CHAT SEGURO PARA ESTUDIANTES' : 'ETAPA 14 · LABORATORIO MULTIUSUARIO'}</span><h1>MiZona Chat</h1><p>{isStudent ? 'Elige chats, grupos, contactos o solicitudes permitidas. No quedas encerrado en una conversación.' : 'Prueba conversaciones reales entre perfiles locales usando varias pestañas.'}</p></div>
      <div className="chatHeaderActions"><button className="secondary" onClick={() => refreshLists(true)}><RefreshCw size={17}/> Actualizar</button>{!isStudent && <button onClick={() => setShowGroup(true)}><MessageSquarePlus size={17}/> Nuevo grupo</button>}<button onClick={() => setShowSearch(true)}><UserPlus size={17}/> {isStudent ? 'Buscar permitido' : 'Agregar contacto'}</button></div>
    </div>

    {!backendConnected && <div className="chatLocalModeNotice"><ChatNotice kind="success">Modo local multiusuario activo. Los cambios se comparten en este navegador.</ChatNotice></div>}
    {notice && <ChatNotice kind={notice.includes('bloqueado') || notice.includes('Reporte enviado') ? 'success' : 'danger'}>{notice}</ChatNotice>}

    <div className={`chatWorkspace ${mobileConversation ? 'showConversation' : ''}`}>
      <aside className="chatDirectory">
        <div className="chatDirectoryTop">
          <div className="chatSearchBar"><Search size={17}/><input value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="Buscar conversación o usuario"/><button type="button" title="Filtros"><SlidersHorizontal size={16}/></button></div>
          {isStudent && <ChatNotice kind="success">Solo verás contactos y grupos aprobados para tu cuenta estudiantil.</ChatNotice>}
          <div className="chatTabs">
            <button className={tab === 'chats' ? 'active' : ''} onClick={() => setTab('chats')}><MessageCircle size={16}/> Chats</button>
            <button className={tab === 'groups' ? 'active' : ''} onClick={() => setTab('groups')}><Users size={16}/> Grupos</button>
            <button className={tab === 'contacts' ? 'active' : ''} onClick={() => setTab('contacts')}><CircleUserRound size={16}/> Contactos</button>
            <button className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}><UserPlus size={16}/> Solicitudes{receivedPending.length > 0 && <i>{receivedPending.length}</i>}</button>
          </div>
        </div>

        {loading ? <div className="chatListLoading"><Loader2 className="spin"/> Cargando...</div> : (tab === 'chats' || tab === 'groups') ? <div className="conversationList">
          {filteredConversations.length ? filteredConversations.map(item => <button key={item.id} className={selectedId === item.id ? 'active' : ''} onClick={() => openConversation(item.id)}>
            <Avatar name={conversationName(item)} image={item.peer_avatar_url}/>
            <span><b>{conversationName(item)}</b><small>{item.type === 'direct' ? (item.last_message || 'Conversación nueva') : `${item.type?.includes('school') ? 'Grupo escolar' : 'Grupo privado'} · ${item.last_message || 'Sin mensajes recientes'}`}</small></span>
            <em>{formatTime(item.last_message_at || item.updated_at)}{Number(item.unread_count) > 0 && <i>{item.unread_count}</i>}</em>
          </button>) : <div className="chatDirectoryEmpty"><MessageCircle size={34}/><b>{tab === 'groups' ? 'Aún no tienes grupos' : 'Aún no hay conversaciones'}</b><span>{isStudent ? 'Cuando un grupo o contacto sea autorizado aparecerá aquí.' : 'Agrega un contacto o crea un grupo.'}</span></div>}
        </div> : tab === 'contacts' ? <div className="contactListReal">
          {filteredContacts.length ? filteredContacts.map(contact => <article key={contact.id}><Avatar name={contact.display_name} image={contact.avatar_url}/><div><b>{contact.display_name}</b><span>@{String(contact.username || '').toUpperCase()}</span><small>{contact.account_type === 'student' ? 'Estudiante protegido' : contact.zone || 'Contacto MiZona'}</small></div><div className="contactActions"><button title="Conversar" onClick={() => startDirect(contact)}><MessageCircle size={17}/></button>{!isStudent && <button className="danger" title="Bloquear" onClick={() => block(contact)}><Ban size={17}/></button>}</div></article>) : <div className="chatDirectoryEmpty"><CircleUserRound size={34}/><b>Sin contactos aceptados</b><span>{isStudent ? 'Tus contactos permitidos aparecerán aquí.' : 'Busca por usuario exacto para enviar solicitud.'}</span>{!isStudent && <button onClick={() => setShowSearch(true)}>Buscar usuario</button>}</div>}
        </div> : <div className="requestListReal">
          {requests.length ? requests.map(request => <article key={request.id}><Avatar name={request.display_name} image={request.avatar_url}/><div><b>{request.display_name}</b><span>@{String(request.username || '').toUpperCase()}</span><small>{request.direction === 'received' ? 'Quiere agregarte' : request.status === 'pending' ? 'Esperando respuesta' : request.status}</small></div>{request.direction === 'received' && request.status === 'pending' ? <div><button onClick={() => review(request, 'accepted')}><Check size={16}/></button><button className="danger" onClick={() => review(request, 'rejected')}><X size={16}/></button></div> : <em>{request.status}</em>}</article>) : <div className="chatDirectoryEmpty"><UserPlus size={34}/><b>No hay solicitudes</b><span>Las invitaciones aparecerán aquí.</span></div>}
        </div>}
      </aside>

      <section className="chatConversation">
        {selected ? <>
          <header className="conversationHeader">
            <button className="iconBtn chatBack" onClick={showChatList}><ChevronLeft/></button>
            <Avatar name={conversationName(selected)} image={selected.peer_avatar_url}/>
            <div><b>{conversationName(selected)}</b><span>{selected.type === 'direct' ? `@${String(selected.peer_username || '').toUpperCase()}` : selected.type?.includes('school') ? 'Grupo escolar protegido' : 'Grupo privado'} · elimina mensajes en {selected.retention_days || 7} días</span></div>
            <button className="chatViewListBtn" type="button" onClick={showChatList}>Ver chats</button>
            <button className="iconBtn" onClick={async () => { if (window.confirm('¿Salir de esta conversación?')) { await leaveConversation(selected.id); await refreshLists(false); showChatList(); } }}><MoreVertical/></button>
          </header>
          <div className="retentionBanner"><ShieldCheck size={16}/> Tus mensajes y archivos se eliminan automáticamente después de {selected.retention_days || 7} días.</div>
          <div className="messageStream">
            {messages.length ? messages.map(message => {
              const own = message.sender_id === user?.id || message.sender_username === profile.username;
              return <div key={message.id} className={`messageRow ${own ? 'own' : ''}`}>
                {!own && <Avatar small name={message.sender_display_name} image={message.sender_avatar_url}/>}<div className="messageBubble">
                  {!own && <b>{message.sender_display_name}</b>}
                  {message.body && <p>{message.body}</p>}
                  {Array.isArray(message.attachments) && message.attachments.map(attachment => <button key={attachment.id} className="attachmentCard" onClick={() => attachment.storage_path ? openChatAttachment(attachment.storage_path).catch(error => setNotice(error.message)) : setNotice('Archivo de demostración.')}>
                    {String(attachment.mime_type || '').startsWith('image/') ? <Image size={22}/> : <File size={22}/>}<span><b>{attachment.file_name}</b><small>{formatBytes(attachment.size_bytes)} · enlace privado</small></span><Download size={17}/>
                  </button>)}
                  <small>{formatTime(message.created_at)}{message.expires_at && ` · vence ${new Date(message.expires_at).toLocaleDateString('es-PE')}`}{message.sync_status === 'local_only' && ' · guardado local'}</small>
                </div>{!own && <button className="messageReport" title="Reportar" onClick={() => report(message)}><AlertTriangle size={14}/></button>}
              </div>;
            }) : <div className="emptyConversation"><MessageCircle size={43}/><h3>Inicia la conversación</h3><p>Recuerda no compartir contraseñas, códigos bancarios ni información privada.</p></div>}
            <div ref={messageEnd}/>
          </div>
          <form className="messageComposer" onSubmit={submitMessage}>
            <input ref={fileInput} type="file" hidden onChange={uploadFile} accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"/>
            <button type="button" className="iconBtn" title="Adjuntar archivo" onClick={() => fileInput.current?.click()} disabled={sending}><Paperclip size={20}/></button>
            <input value={composer} onChange={event => setComposer(event.target.value)} placeholder="Escribe un mensaje seguro..." maxLength={5000}/>
            <button disabled={sending || !composer.trim()}>{sending ? <Loader2 className="spin" size={20}/> : <Send size={20}/>}</button>
          </form>
        </> : <div className="noConversationSelected"><div><MessageCircle size={58}/><h2>Selecciona una conversación</h2><p>También puedes crear un grupo o buscar a una persona por su usuario exacto.</p><button onClick={() => setShowSearch(true)}><UserPlus size={18}/> Agregar contacto</button></div></div>}
      </section>
    </div>

    <div className="chatSafetyGrid">
      <article><ShieldCheck/><div><b>Protección escolar</b><span>Las cuentas estudiantiles solo se encuentran dentro de relaciones escolares válidas.</span></div></article>
      <article><FileUp/><div><b>Archivos privados</b><span>Hasta 25 MB, con enlaces temporales y acceso exclusivo para integrantes.</span></div></article>
      <article><Ban/><div><b>Bloquear y reportar</b><span>El bloqueo elimina el contacto y detiene nuevas solicitudes.</span></div></article>
    </div>

    {showSearch && <ContactSearch onChanged={() => refreshLists(true)} onClose={() => setShowSearch(false)}/>}
    {showGroup && !isStudent && <GroupModal contacts={contacts} userId={user?.id} onCreated={async id => { setShowGroup(false); await refreshLists(true); setSelectedId(id); setMobileConversation(true); }} onClose={() => setShowGroup(false)}/>}
  </div>;
}
