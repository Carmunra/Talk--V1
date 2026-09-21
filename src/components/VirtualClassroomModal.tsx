import React, { useState, useEffect, useRef } from 'react';
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
  ScreenShare,
  ScreenShareOff,
  Monitor,
  Presentation,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  Layers,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Settings,
  Radio,
} from 'lucide-react';
import { Lesson, UserRole, TalkeMaterialItem } from '../domain/types';
import { TALKE_CURRICULUM_MATERIALS } from '../data/talkeMaterials';

interface VirtualClassroomModalProps {
  lesson: Lesson;
  userRole: UserRole;
  currentUserName: string;
  initialMaterial?: TalkeMaterialItem;
  onClose: () => void;
  onFinishLesson: (lessonId: string, notes: string) => Promise<void>;
}

export const VirtualClassroomModal: React.FC<VirtualClassroomModalProps> = ({
  lesson,
  userRole,
  currentUserName,
  initialMaterial,
  onClose,
  onFinishLesson,
}) => {
  // Video Stage Mode: 'daily' (Real Video Call via Daily Prebuilt), 'slides' (Curriculum presentation), 'camera' (WebRTC simulated)
  const [videoMode, setVideoMode] = useState<'daily' | 'slides' | 'camera'>('daily');
  const [dailyRoomUrl, setDailyRoomUrl] = useState(
    lesson.meetingLink || `https://talke.daily.co/talke-${lesson.id}`
  );
  const [isEditingRoomUrl, setIsEditingRoomUrl] = useState(false);
  const [tempRoomUrl, setTempRoomUrl] = useState(dailyRoomUrl);

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
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'chat' | 'materials'>('whiteboard');

  // Fetch or initialize Daily Room URL from backend
  useEffect(() => {
    const fetchDailyRoom = async () => {
      try {
        const res = await fetch(`/api/lessons/${lesson.id}/daily-room`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.roomUrl) {
            setDailyRoomUrl(data.roomUrl);
            setTempRoomUrl(data.roomUrl);
          }
        }
      } catch (err) {
        console.warn('[Daily Prebuilt] Fallback to room URL:', err);
      }
    };
    fetchDailyRoom();
  }, [lesson.id]);

  // Screen Sharing states
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const [presentedMaterial, setPresentedMaterial] = useState<TalkeMaterialItem | null>(
    initialMaterial || TALKE_CURRICULUM_MATERIALS[2] // default unit: travel/airport
  );
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync video element with media stream
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, isScreenSharing]);

  // Clean up screen stream on unmount
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [screenStream]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Screen sharing toggle function
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop sharing
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      setScreenStream(null);
      setIsScreenSharing(false);
      setScreenShareError(null);
      return;
    }

    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            setScreenStream(null);
            setIsScreenSharing(false);
          };
        }

        setScreenStream(stream);
        setIsScreenSharing(true);
        setScreenShareError(null);
      } else {
        // Fallback for sandboxed preview iframe
        setIsScreenSharing(true);
        setScreenShareError('Modo apresentação de slides ativado na sala.');
      }
    } catch (err: any) {
      console.warn('[ScreenShare] getDisplayMedia fallback:', err);
      // If user cancelled, don't show error, just cancel
      if (err?.name === 'NotAllowedError' && err?.message?.toLowerCase().includes('denied')) {
        return;
      }
      // If blocked by iframe permissions policy, provide high-quality slides presentation mode
      setIsScreenSharing(true);
      setScreenShareError('Compartilhamento interativo de slides ativado na sala.');
    }
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

  const handleSendQuestionToChat = (question: string) => {
    setChatMessages((prev) => [
      ...prev,
      {
        sender: `${currentUserName} (Material Talkê)`,
        text: `💬 Pergunta de Conversação: "${question}"`,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setActiveTab('chat');
  };

  const handleFinish = async () => {
    const confirmFinish = window.confirm(
      'Deseja concluir a aula agora? Os créditos serão liberados para o professor e o aluno poderá avaliar a sessão.'
    );
    if (!confirmFinish) return;

    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }

    setIsFinishing(true);
    try {
      await onFinishLesson(lesson.id, notes);
      onClose();
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex flex-col font-sans">
      {/* Top Classroom Bar */}
      <div className="px-6 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center font-black text-sm shadow-sm">
            T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-neutral-100">Sala Virtual Talkê</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Ao Vivo
              </span>
              {isScreenSharing && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 animate-pulse">
                  <ScreenShare className="w-3 h-3" />
                  Tela Ativa
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">
              {lesson.topic || 'Conversação e Destrave'} • Aluno: <strong>{lesson.studentName}</strong> | Professor: <strong>{lesson.teacherName}</strong>
            </p>
          </div>
        </div>

        {/* Timer & Finish Controls */}
        <div className="flex items-center gap-3">
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
      <div className="flex-1 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 overflow-hidden">
        {/* Left / Center: Video Stage or Screen Share View */}
        <div className="lg:col-span-7 flex flex-col gap-3 h-full overflow-hidden">
          {/* Main Stage View */}
          <div className="flex-1 bg-neutral-900 rounded-2xl border border-neutral-800 relative overflow-hidden flex flex-col shadow-inner">
            {/* Top Mode Bar */}
            <div className="bg-neutral-950/90 border-b border-neutral-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-20">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setVideoMode('daily')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    videoMode === 'daily'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xs'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Daily Prebuilt (Chamada Real)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVideoMode('slides')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    videoMode === 'slides'
                      ? 'bg-cyan-700 text-white shadow-xs'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Presentation className="w-3.5 h-3.5" />
                  <span>Slides Didáticos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVideoMode('camera')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    videoMode === 'camera'
                      ? 'bg-neutral-800 text-white'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Simulador</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.open(dailyRoomUrl, '_blank', 'noopener,noreferrer')}
                  className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 text-[11px] font-bold rounded-lg border border-cyan-800/60 flex items-center gap-1 transition-colors"
                  title="Abrir Daily em uma nova aba com acesso direto aos dispositivos de câmera e microfone"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Nova Aba</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditingRoomUrl(!isEditingRoomUrl)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                  title="Configurar URL da Sala Daily"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Config Room Popover */}
            {isEditingRoomUrl && (
              <div className="bg-neutral-950 p-3 border-b border-neutral-800 flex items-center gap-2 z-20">
                <span className="text-xs text-neutral-400 shrink-0">URL da Sala Daily:</span>
                <input
                  type="text"
                  value={tempRoomUrl}
                  onChange={(e) => setTempRoomUrl(e.target.value)}
                  placeholder="https://talke.daily.co/nome-da-sala"
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    setDailyRoomUrl(tempRoomUrl);
                    setIsEditingRoomUrl(false);
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                >
                  Aplicar
                </button>
              </div>
            )}

            {/* 1. DAILY PREBUILT EMBEDDED CALL */}
            {videoMode === 'daily' ? (
              <div className="flex-1 w-full h-full relative bg-neutral-950 flex flex-col">
                <iframe
                  src={dailyRoomUrl}
                  title="Daily Prebuilt Video Class"
                  allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                  className="w-full h-full border-0"
                />
              </div>
            ) : videoMode === 'slides' || isScreenSharing ? (
              /* 2. SLIDES & CURRICULUM PRESENTATION VIEW */
              <div className="flex-1 w-full h-full flex flex-col relative bg-slate-950">
                <div className="bg-slate-900/90 backdrop-blur-xs px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-white z-20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="font-bold text-cyan-300">
                      Material Didático Talkê em Apresentação
                    </span>
                    {presentedMaterial && (
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        • {presentedMaterial.title}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleScreenShare}
                      className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <ScreenShare className="w-3 h-3" />
                      <span>{isScreenSharing ? 'Parar Tela' : 'Compartilhar Tela'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full h-full relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
                  {screenStream ? (
                    <video
                      ref={screenVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain rounded-xl border border-slate-800 shadow-2xl"
                    />
                  ) : presentedMaterial ? (
                    <div className="w-full h-full max-w-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-cyan-500/30 shadow-2xl overflow-y-auto">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                            {presentedMaterial.tierLabel} • Unidade {presentedMaterial.unitNumber}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Slide {activeSlideIndex + 1} de {presentedMaterial.slides.length}
                          </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-white">
                          {presentedMaterial.slides[activeSlideIndex]?.title || presentedMaterial.title}
                        </h3>

                        <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                          {presentedMaterial.slides[activeSlideIndex]?.bullets.map((bullet, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <span className="text-cyan-400 font-bold">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>

                        {presentedMaterial.slides[activeSlideIndex]?.example && (
                          <div className="bg-white/10 border border-cyan-400/30 p-3.5 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-cyan-300 block mb-1">
                              Exemplo Prático:
                            </span>
                            <p className="text-xs sm:text-sm italic text-white font-medium">
                              {presentedMaterial.slides[activeSlideIndex].example}
                            </p>
                          </div>
                        )}

                        {presentedMaterial.slides[activeSlideIndex]?.exercisePrompt && (
                          <div className="bg-emerald-500/20 border border-emerald-400/30 p-3 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-0.5">
                              Desafio para Conversar:
                            </span>
                            <p className="text-xs text-emerald-100 font-semibold">
                              {presentedMaterial.slides[activeSlideIndex].exercisePrompt}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
                        <button
                          type="button"
                          disabled={activeSlideIndex === 0}
                          onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold disabled:opacity-30 flex items-center gap-1 transition-all"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Anterior</span>
                        </button>

                        <span className="text-[11px] text-slate-400">
                          Use para conduzir a conversa com o aluno
                        </span>

                        <button
                          type="button"
                          disabled={activeSlideIndex === presentedMaterial.slides.length - 1}
                          onClick={() => setActiveSlideIndex((prev) => Math.min(presentedMaterial.slides.length - 1, prev + 1))}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-30 flex items-center gap-1 transition-all"
                        >
                          <span>Próximo</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              /* 3. SIMULATOR VIEW */
              <div className="flex-1 flex items-center justify-center relative p-6">
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

                <div className="absolute top-4 left-4 bg-neutral-950/60 backdrop-blur-xs px-2.5 py-1 rounded-lg text-white text-[11px] flex items-center gap-1.5 border border-neutral-800">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Áudio & Vídeo WebRTC</span>
                </div>
              </div>
            )}
          </div>

          {/* Local Participant Preview & Controls Bar */}
          <div className="h-28 sm:h-32 bg-neutral-900 rounded-2xl border border-neutral-800 p-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-24 sm:w-28 h-20 sm:h-24 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center relative overflow-hidden shrink-0">
                {videoOn ? (
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-xs">
                      {currentUserName[0]}
                    </div>
                    <span className="text-[9px] text-neutral-400 mt-0.5 block">Você</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-neutral-500">Câmera Off</div>
                )}
                <span className="absolute bottom-1 right-1 bg-black/70 px-1 rounded text-[9px] text-neutral-300">
                  {micOn ? '🎙️' : '🔇'}
                </span>
              </div>

              <div className="space-y-0.5 hidden sm:block">
                <span className="text-xs font-bold text-white block">{currentUserName} (Você)</span>
                <span className="text-[10px] text-neutral-400 block">
                  {userRole === UserRole.Teacher ? 'Docente Talkê' : 'Estudante'}
                </span>
              </div>
            </div>

            {/* Media Toggles & Screen Share Button */}
            <div className="flex items-center gap-2">
              {/* SCREEN SHARE BUTTON */}
              <button
                onClick={handleToggleScreenShare}
                className={`px-3 py-2.5 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 ${
                  isScreenSharing
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400 shadow-md animate-pulse'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700'
                }`}
                title={isScreenSharing ? 'Parar de Compartilhar Tela' : 'Compartilhar Tela com o Aluno'}
              >
                {isScreenSharing ? (
                  <>
                    <ScreenShareOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Parar Tela</span>
                  </>
                ) : (
                  <>
                    <ScreenShare className="w-4 h-4" />
                    <span className="hidden sm:inline">Compartilhar Tela</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setMicOn(!micOn)}
                className={`p-2.5 sm:p-3 rounded-xl transition-all ${
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
                className={`p-2.5 sm:p-3 rounded-xl transition-all ${
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
                className="p-2.5 sm:p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
                title="Minimizar sala"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Shared Whiteboard, Live Chat, and Teaching Materials */}
        <div className="lg:col-span-5 bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col h-full overflow-hidden">
          {/* Tab Selector */}
          <div className="p-2 border-b border-neutral-800 flex items-center gap-1 bg-neutral-950/40">
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'whiteboard'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quadro</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'chat'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Chat ({chatMessages.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'materials'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Materiais</span>
            </button>
          </div>

          {/* TAB 1: Whiteboard / Notepad */}
          {activeTab === 'whiteboard' && (
            <div className="flex-1 p-4 flex flex-col gap-2 overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-1">
                <span>Vocabulário, correções e anotações da aula:</span>
                <span className="text-emerald-400 font-medium">Sincronizado</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Exemplo de anotações:&#10;• Vocabulário novo: layover, custom duties, boarding pass.&#10;• Pronúncia: 'thought' vs 'taught'.&#10;• Frase corrigida: 'I am agree' -> 'I agree'."
                className="flex-1 w-full bg-neutral-950 text-neutral-200 text-xs font-mono p-4 rounded-xl border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none leading-relaxed"
              />
            </div>
          )}

          {/* TAB 2: Live Chat */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((msg, idx) => {
                  const isMe = msg.sender.startsWith(currentUserName);
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
                  placeholder="Enviar mensagem, correção ou link..."
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

          {/* TAB 3: Talkê Curriculum Materials in Class */}
          {activeTab === 'materials' && (
            <div className="flex-1 p-4 flex flex-col overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-white">Módulos Talkê Prontos</h4>
                  <p className="text-[10px] text-neutral-400">
                    Básico / Intermediário / Avançado com roteiro e perguntas
                  </p>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  {TALKE_CURRICULUM_MATERIALS.length} Lições
                </span>
              </div>

              {/* Materials list */}
              <div className="space-y-3">
                {TALKE_CURRICULUM_MATERIALS.map((mat) => {
                  const isCurrentlyPresented = presentedMaterial?.id === mat.id && isScreenSharing;

                  return (
                    <div
                      key={mat.id}
                      className={`p-3 rounded-xl border transition-all ${
                        presentedMaterial?.id === mat.id
                          ? 'bg-neutral-800/90 border-cyan-500/50 shadow-xs'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-neutral-800 text-cyan-300">
                          {mat.tierLabel} • {mat.cefr}
                        </span>
                        <span className="text-[10px] text-neutral-400">{mat.durationMinutes} min</span>
                      </div>

                      <h5 className="text-xs font-bold text-white mt-1.5 leading-tight">
                        {mat.title}
                      </h5>

                      <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                        {mat.objective}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPresentedMaterial(mat);
                            setActiveSlideIndex(0);
                            if (!isScreenSharing) {
                              setIsScreenSharing(true);
                            }
                          }}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 ${
                            isCurrentlyPresented
                              ? 'bg-emerald-600 text-white'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          }`}
                        >
                          <Presentation className="w-3 h-3" />
                          <span>{isCurrentlyPresented ? 'Apresentando' : 'Apresentar na Tela'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendQuestionToChat(mat.discussionQuestions[0])}
                          className="px-2.5 py-1 text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors flex items-center gap-1"
                          title="Enviar primeira pergunta de conversação ao chat"
                        >
                          <Send className="w-3 h-3" />
                          <span>Enviar ao Chat</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
