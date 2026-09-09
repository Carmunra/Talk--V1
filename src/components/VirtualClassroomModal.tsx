import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Sparkles,
  Send,
  Users,
  CheckCircle,
} from 'lucide-react';
import { Lesson, UserRole } from '../domain/types';

interface VirtualClassroomModalProps {
  lesson: Lesson;
  userRole: UserRole;
  currentUserName: string;
  onClose: () => void;
  onFinishLesson: (lessonId: string, notes: string) => Promise<void>;
}

export const VirtualClassroomModal: React.FC<VirtualClassroomModalProps> = ({
  lesson,
  userRole,
  currentUserName,
  onClose,
  onFinishLesson,
}) => {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [notes, setNotes] = useState(lesson.whiteboardNotes || '');
  const [chatMessages, setChatMessages] = useState<
    { sender: string; text: string; time: string }[]
  >([
    {
      sender: lesson.teacherName,
      text: "Hello! Welcome to our Talkê English lesson! How are you feeling today?",
      time: "14:01",
    },
    {
      sender: lesson.studentName,
      text: "Hi! I'm great and ready to practice!",
      time: "14:02",
    },
  ]);
  const [newChatText, setNewChatText] = useState('');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(50 * 60); // 50 min
  const [isFinishing, setIsFinishing] = useState(false);
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'chat'>('whiteboard');

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      {
        sender: currentUserName,
        text: newChatText.trim(),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setNewChatText('');
  };

  const handleFinish = async () => {
    const confirmFinish = window.confirm(
      'Deseja concluir a aula agora? Os créditos serão liberados para o professor e o aluno poderá avaliar a sessão.'
    );
    if (!confirmFinish) return;

    setIsFinishing(true);
    try {
      await onFinishLesson(lesson.id, notes);
      onClose();
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex flex-col">
      {/* Top Classroom Bar */}
      <div className="px-6 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center font-black text-sm">
            T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-neutral-100">Sala Virtual Talkê</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Ao Vivo
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {lesson.topic || 'Prática de conversação'} • Aluno: {lesson.studentName} | Professor: {lesson.teacherName}
            </p>
          </div>
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-neutral-800/80 px-3 py-1.5 rounded-xl border border-neutral-700 text-xs font-mono text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={handleFinish}
            disabled={isFinishing}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{isFinishing ? 'Finalizando...' : 'Concluir Aula'}</span>
          </button>
        </div>
      </div>

      {/* Main Classroom Workspace */}
      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* Left Side: Video Streams */}
        <div className="lg:col-span-7 flex flex-col gap-3 h-full">
          {/* Main Remote Video Stream (Other participant) */}
          <div className="flex-1 bg-neutral-900 rounded-2xl border border-neutral-800 relative overflow-hidden flex items-center justify-center shadow-inner">
            <div className="text-center space-y-2 z-10">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center text-3xl font-black mx-auto ring-4 ring-cyan-500/30 shadow-lg">
                {userRole === UserRole.Student ? lesson.teacherName[0] : lesson.studentName[0]}
              </div>
              <h4 className="text-white font-bold text-sm">
                {userRole === UserRole.Student ? lesson.teacherName : lesson.studentName}
              </h4>
              <span className="text-[11px] text-cyan-400 font-medium flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {userRole === UserRole.Student ? 'Professor Conectado' : 'Aluno Conectado'}
              </span>
            </div>

            {/* Speaking indicator overlay */}
            <div className="absolute top-4 left-4 bg-neutral-950/60 backdrop-blur-xs px-2.5 py-1 rounded-lg text-white text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Qualidade de Áudio HD (WebRTC)</span>
            </div>
          </div>

          {/* Local Participant Preview & Controls Bar */}
          <div className="h-40 bg-neutral-900 rounded-2xl border border-neutral-800 p-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-28 h-32 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center relative overflow-hidden">
                {videoOn ? (
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                      {currentUserName[0]}
                    </div>
                    <span className="text-[10px] text-neutral-400 mt-1 block">Você</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-neutral-500">Câmera Desligada</div>
                )}
                <span className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[9px] text-neutral-300">
                  {micOn ? '🎙️' : '🔇'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">{currentUserName} (Você)</span>
                <span className="text-[11px] text-neutral-400 block">
                  {userRole === UserRole.Teacher ? 'Docente Talkê' : 'Estudante'}
                </span>
              </div>
            </div>

            {/* Media Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMicOn(!micOn)}
                className={`p-3 rounded-xl transition-all ${
                  micOn
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                    : 'bg-rose-600 text-white'
                }`}
                title={micOn ? 'Mutar Microfone' : 'Ativar Microfone'}
              >
                {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setVideoOn(!videoOn)}
                className={`p-3 rounded-xl transition-all ${
                  videoOn
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                    : 'bg-rose-600 text-white'
                }`}
                title={videoOn ? 'Desligar Câmera' : 'Ligar Câmera'}
              >
                {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
                title="Minimizar sala"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Shared Whiteboard & Chat */}
        <div className="lg:col-span-5 bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col h-full overflow-hidden">
          {/* Tab Selector */}
          <div className="p-2 border-b border-neutral-800 flex items-center gap-1 bg-neutral-950/40">
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'whiteboard'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quadro & Anotações Compartilhadas</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Chat ao Vivo ({chatMessages.length})</span>
            </button>
          </div>

          {/* Whiteboard / Notepad Tab */}
          {activeTab === 'whiteboard' && (
            <div className="flex-1 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-1">
                <span>Vocabulário, correções e pronúncia anotados durante a aula:</span>
                <span className="text-emerald-400 font-medium">Sincronizado em tempo real</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Exemplo de anotações:&#10;• Vocabulário novo: layover, custom duties, schedule.&#10;• Pronúncia: 'thought' vs 'taught'.&#10;• Frase corrigida: 'I am agree' -> 'I agree'."
                className="flex-1 w-full bg-neutral-950 text-neutral-200 text-xs font-mono p-4 rounded-xl border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((msg, idx) => {
                  const isMe = msg.sender === currentUserName;
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-neutral-400 mb-0.5">
                        {msg.sender} • {msg.time}
                      </span>
                      <div
                        className={`p-2.5 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-neutral-800 text-neutral-200 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSendChat}
                className="p-3 border-t border-neutral-800 flex items-center gap-2 bg-neutral-950"
              >
                <input
                  type="text"
                  placeholder="Enviar mensagem ou link..."
                  value={newChatText}
                  onChange={(e) => setNewChatText(e.target.value)}
                  className="flex-1 bg-neutral-900 text-white text-xs px-3 py-2 rounded-xl border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
