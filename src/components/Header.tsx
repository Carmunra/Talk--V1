import React, { useState } from 'react';
import {
  UserRole,
  Student,
  Teacher,
  AppNotification,
} from '../domain/types';
import { TalkeLogo } from './TalkeLogo';
import { NotificationsPopover } from './NotificationsPopover';
import {
  Bell,
  Wallet,
  Users,
  UserPlus,
  Plus,
  Check,
  ChevronDown,
  Layers,
  Sparkles,
  Menu,
  Globe,
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  students: Student[];
  currentStudent: Student | null;
  onSelectStudent: (student: Student) => void;
  teachers: Teacher[];
  currentTeacher: Teacher | null;
  onSelectTeacher: (teacher: Teacher) => void;
  onOpenCreateStudent: () => void;
  onOpenCreateTeacher: () => void;
  currentTab: string;
  onSelectTab: (tab: any) => void;
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onToggleMobileSidebar?: () => void;
  isCloudSynced?: boolean;
  onOpenLandingPage?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onChangeRole,
  students,
  currentStudent,
  onSelectStudent,
  teachers,
  currentTeacher,
  onSelectTeacher,
  onOpenCreateStudent,
  onOpenCreateTeacher,
  currentTab,
  onSelectTab,
  notifications,
  onMarkNotificationAsRead,
  onToggleMobileSidebar,
  isCloudSynced,
  onOpenLandingPage,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tier: Logo, Role Toggle, User Switcher, Wallet, Notifications */}
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Mobile Sidebar Button */}
          <div className="flex items-center gap-3 sm:gap-6">
            {onToggleMobileSidebar && (
              <button
                type="button"
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
                title="Abrir Menu Lateral"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => onSelectTab(currentRole === UserRole.Teacher ? 'teacher-dash' : 'teachers')}
              className="text-left focus:outline-none"
            >
              <TalkeLogo size="md" />
            </button>

            {onOpenLandingPage && (
              <button
                type="button"
                onClick={onOpenLandingPage}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:text-blue-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                title="Visualizar Página Inicial / Site Oficial"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Ver Site</span>
              </button>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Database Cloud Sync Badge */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isCloudSynced
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="Firebase Firestore Cloud Database Ativo"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCloudSynced ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>Firestore Nuvem</span>
            </div>

            {/* Student Wallet Pill */}
            {currentRole === UserRole.Student && currentStudent && (
              <button
                onClick={() => onSelectTab('wallet')}
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/80 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-900 shadow-2xs hover:border-blue-400 transition-colors"
              >
                <Wallet className="w-4 h-4 text-blue-600" />
                <span>R$ {currentStudent.walletBalanceBrl.toFixed(2).replace('.', ',')}</span>
                <span className="text-[10px] text-cyan-700 font-semibold bg-white/80 px-1.5 py-0.5 rounded">
                  Carteira
                </span>
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 relative transition-colors"
                title="Notificações Talkê"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationsPopover
                  notifications={notifications}
                  onMarkAsRead={onMarkNotificationAsRead}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </div>

            {/* User Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white text-xs font-semibold text-neutral-800 transition-colors"
              >
                {currentRole === UserRole.Student && currentStudent ? (
                  <>
                    <img
                      src={currentStudent.avatarUrl}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="hidden sm:inline font-bold truncate max-w-[120px]">
                      {currentStudent.name.split(' ')[0]}
                    </span>
                    <span className="hidden sm:inline text-[10px] text-neutral-400 font-normal">
                      (Aluno)
                    </span>
                  </>
                ) : currentRole === UserRole.Teacher && currentTeacher ? (
                  <>
                    <img
                      src={currentTeacher.avatarUrl}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="hidden sm:inline font-bold truncate max-w-[120px]">
                      {currentTeacher.name.split(' ')[0]}
                    </span>
                    <span className="hidden sm:inline text-[10px] text-cyan-600 font-bold">
                      (Docente)
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-xs">
                      T
                    </div>
                    <span className="hidden sm:inline font-bold">Talkê Admin</span>
                  </>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-neutral-200 py-2 z-50 text-xs animate-in fade-in duration-150">
                  {/* Students section */}
                  <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Alunos Cadastrados
                  </div>
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onChangeRole(UserRole.Student);
                        onSelectStudent(s);
                        setShowUserDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-neutral-50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <img src={s.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                        <span className="font-semibold text-neutral-800 truncate">{s.name}</span>
                      </div>
                      {currentRole === UserRole.Student && currentStudent?.id === s.id && (
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenCreateStudent();
                    }}
                    className="w-full px-3 py-2 text-left text-blue-600 font-bold hover:bg-blue-50 flex items-center gap-1.5 border-t border-neutral-100"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Cadastrar Novo Aluno</span>
                  </button>

                  {/* Teachers section */}
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-t border-neutral-100">
                    Professores Cadastrados
                  </div>
                  {teachers.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onChangeRole(UserRole.Teacher);
                        onSelectTeacher(t);
                        onSelectTab('teacher-dash');
                        setShowUserDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-neutral-50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <img src={t.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                        <span className="font-semibold text-neutral-800 truncate">{t.name}</span>
                      </div>
                      {currentRole === UserRole.Teacher && currentTeacher?.id === t.id && (
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenCreateTeacher();
                    }}
                    className="w-full px-3 py-2 text-left text-cyan-700 font-bold hover:bg-cyan-50 flex items-center gap-1.5 border-t border-neutral-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Cadastrar Novo Professor</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Tier: Contextual Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-neutral-100 py-2 overflow-x-auto text-xs font-semibold">
          {currentRole === UserRole.Student && (
            <>
              <button
                onClick={() => onSelectTab('teachers')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  currentTab === 'teachers'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Pesquisar Professores
              </button>

              <button
                onClick={() => onSelectTab('diagnostic')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  currentTab === 'diagnostic'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Diagnóstico & Objetivo
              </button>

              <button
                onClick={() => onSelectTab('lessons')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  currentTab === 'lessons'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Minhas Aulas
              </button>

              <button
                onClick={() => onSelectTab('wallet')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  currentTab === 'wallet'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Carteira de Pagamentos
              </button>
            </>
          )}

          {currentRole === UserRole.Teacher && (
            <>
              <button
                onClick={() => onSelectTab('teacher-dash')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  currentTab === 'teacher-dash'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Painel do Docente (Reservas, Agenda & Ganhos)
              </button>
            </>
          )}

          {currentRole === UserRole.Admin && (
            <>
              <button
                onClick={() => onSelectTab('admin-dash')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  currentTab === 'admin-dash'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Métricas da Plataforma (GMV & Comissões)
              </button>
            </>
          )}

          <button
            onClick={() => onSelectTab('api')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ml-auto ${
              currentTab === 'api'
                ? 'bg-neutral-800 text-white font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Console API & Arquitetura DDD
          </button>
        </div>
      </div>
    </header>
  );
};
