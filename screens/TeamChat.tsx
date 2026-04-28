
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

const TeamChat: React.FC = () => {
  const navigate = useNavigate();
  const { messages, sendMessage, currentUser, usersDB, tasks, markAllChatNotificationsAsRead } = useProjects();
  const [input, setInput] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [showTaskLinks, setShowTaskLinks] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  // Scroll inicial y cuando llegan mensajes nuevos
  useEffect(() => {
    scrollToBottom();
    markAllChatNotificationsAsRead();
  }, [messages.length, markAllChatNotificationsAsRead]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Detección de disparadores
    const lastChar = value[value.length - 1];
    const lastWord = value.split(' ').pop() || '';
    
    if (lastWord.startsWith('@')) setShowMentions(true);
    else setShowMentions(false);
    
    if (lastWord.startsWith('#')) setShowTaskLinks(true);
    else setShowTaskLinks(false);
  };

  const insertMention = (name: string) => {
    const words = input.split(' ');
    words[words.length - 1] = `@${name}`;
    setInput(words.join(' ') + ' ');
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const insertTask = (title: string) => {
    const cleanTitle = title.replace(/\s+/g, '');
    const words = input.split(' ');
    words[words.length - 1] = `#${cleanTitle}`;
    setInput(words.join(' ') + ' ');
    setShowTaskLinks(false);
    inputRef.current?.focus();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    
    setInput(''); // Limpiar input inmediatamente (Optimista)
    setShowMentions(false);
    setShowTaskLinks(false);
    
    await sendMessage(content);
  };

  const renderContent = (content: string) => {
    // Regex para detectar menciones (@nombre) y tareas (#titulo)
    const parts = content.split(/(@\w+|#\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-primary font-black bg-primary/10 px-1 rounded">{part}</span>;
      }
      if (part.startsWith('#')) {
        const taskTitle = part.substring(1);
        const task = tasks.find(t => t.title.replace(/\s+/g, '') === taskTitle);
        return (
          <span 
            key={i} 
            onClick={() => task && navigate('/calendar', { state: { openTaskId: task.id } })} 
            className="text-amber-500 font-black cursor-pointer hover:underline bg-amber-500/10 px-1 rounded transition-all"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Agrupar mensajes por remitente para un look más limpio (tipo WhatsApp/Telegram)
  const groupedMessages = useMemo(() => {
    const groups: { senderId: string, messages: any[] }[] = [];
    messages.forEach((msg) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.senderId === msg.senderId) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ senderId: msg.senderId, messages: [msg] });
      }
    });
    return groups;
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background-dark overflow-hidden font-display relative">
      <header className="px-8 py-6 border-b border-white/5 bg-background-dark/80 backdrop-blur shrink-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-2xl shadow-primary/10">
              <span className="material-symbols-outlined text-3xl">forum</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Canal del Equipo</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Workspace Activo</p>
              </div>
            </div>
          </div>
          <div className="flex -space-x-3">
            {usersDB.map(u => (
              <div key={u.id} className="relative group">
                <img 
                  src={u.avatar} 
                  className="w-10 h-10 rounded-2xl border-2 border-background-dark object-cover group-hover:scale-110 transition-transform cursor-help" 
                  title={u.firstName} 
                />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background-dark"></div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ÁREA DE MENSAJES */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth scrollbar-hide bg-[#141118]"
      >
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
          {groupedMessages.map((group, groupIdx) => {
            const isMe = group.senderId === currentUser?.id;
            const sender = usersDB.find(u => u.id === group.senderId);
            
            return (
              <div key={groupIdx} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className="shrink-0 pt-2">
                  <img src={sender?.avatar || group.messages[0].senderAvatar} className="w-10 h-10 rounded-2xl object-cover border border-white/10 shadow-lg" />
                </div>
                
                <div className={`flex flex-col gap-2 max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{sender?.firstName || group.messages[0].senderName}</span>}
                  
                  {group.messages.map((msg: any, msgIdx: number) => {
                    const date = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={msgIdx} className="group relative flex flex-col">
                        <div className={`p-4 rounded-3xl shadow-xl leading-relaxed text-sm ${
                          isMe 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-card-dark text-slate-200 border border-white/5 rounded-tl-none'
                        }`}>
                          {renderContent(msg.content)}
                        </div>
                        <span className={`text-[8px] font-bold text-slate-600 uppercase mt-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {date}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SUGERENCIAS DE MENCIÓN / TAREA */}
      {(showMentions || showTaskLinks) && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-full max-w-md bg-card-dark border border-white/10 rounded-[2.5rem] shadow-2xl p-6 z-50 animate-in slide-in-from-bottom-4">
           <div className="flex items-center justify-between mb-4 px-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-xs">{showMentions ? 'alternate_email' : 'tag'}</span> 
                {showMentions ? 'Mencionar Socio' : 'Vincular Tarea'}
              </p>
              <button onClick={() => {setShowMentions(false); setShowTaskLinks(false);}} className="text-slate-600 hover:text-white"><span className="material-symbols-outlined text-sm">close</span></button>
           </div>
           
           <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto scrollbar-hide">
              {showMentions ? usersDB.map(u => (
                <div 
                  key={u.id} 
                  onClick={() => insertMention(u.firstName)} 
                  className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-white/5 group"
                >
                  <img src={u.avatar} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{u.firstName} {u.lastName}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">{u.role}</p>
                  </div>
                </div>
              )) : tasks.filter(t => t.status === 'Pendiente').map(t => (
                <div 
                  key={t.id} 
                  onClick={() => insertTask(t.title)} 
                  className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-white/5 group"
                >
                  <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">assignment</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate group-hover:text-amber-500 transition-colors">{t.title}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Tarea Pendiente</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* INPUT FLOTANTE */}
      <div className="p-8 border-t border-white/5 bg-background-dark/50 backdrop-blur-xl shrink-0">
        <form onSubmit={handleSend} className="max-w-5xl mx-auto relative group">
          <input 
            ref={inputRef}
            type="text" 
            value={input} 
            onChange={handleInput} 
            placeholder="Escribe un mensaje... usa @ para socios o # para tareas." 
            className="w-full bg-card-dark border border-white/10 rounded-[2.5rem] pl-8 pr-20 py-7 text-white text-base focus:border-primary outline-none shadow-2xl transition-all placeholder:text-slate-600" 
          />
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-20"
          >
            <span className="material-symbols-outlined font-black text-2xl">send</span>
          </button>
        </form>
        <p className="text-center mt-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">
          Encriptación punto a punto • Servidores de Visual Oscart
        </p>
      </div>
    </div>
  );
};

export default TeamChat;
