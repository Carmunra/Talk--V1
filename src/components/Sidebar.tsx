import React from 'react';
import {
  Compass,
  Zap,
  Calendar,
  Sparkles,
  CreditCard,
  Video,
  Clock,
  DollarSign,
  User,
  BarChart3,
  Users,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Layers,
  X,
  Star,
  TrendingUp,
  BookOpen,
  Globe,
} from 'lucide-react';
import { UserRole, Student, Teacher } from '../domain/types';
import { TalkeLogo } from './TalkeLogo';

interface SidebarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeNav: string;
  onNavChange: (nav: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  currentStudent: Student;
  currentTeacher: Teacher;
  onOpenDiagnostic: () => void;
  onOpenWallet: () => void;
  onOpenLandingPage?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  onRoleChange,
  activeNav,
  onNavChange,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  currentStudent,
  currentTeacher,
  onOpenDiagnostic,
  onOpenWallet,
  onOpenLandingPage,
}) => {
  // Navigation links definition by role
  const getNavItems = () => {
    switch (currentRole) {
      case UserRole.Student:
        return [
          {
            id: 'student_content',
            label: 'Conteúdo & Onde Parei',
            icon: BookOpen,
            badge: 'Trilha',
            highlight: true,
          },
          {
            id: 'teachers',
            label: 'Buscar Professores',
            icon: Compass,
            badge: 'Matching',
          },
          {
            id: 'interactive_hub',
            label: 'Laboratório Prático',
            icon: Zap,
            badge: 'Novo',
          },
          {
            id: 'my_lessons',
            label: 'Minhas Aulas',
            icon: Calendar,
          },
          {
            id: 'diagnostic_action',
            label: 'Meu Diagnóstico',
            icon: Sparkles,
            action: onOpenDiagnostic,
          },
          {
            id: 'wallet_action',
            label: 'Carteira & Créditos',
            icon: CreditCard,
            action: onOpenWallet,
          },
        ];

      case UserRole.Teacher:
        return [
          {
            id: 'teacher_lessons',
            label: 'Minhas Reservas & Sala',
            icon: Video,
          },
          {
            id: 'teacher_students_progress',
            label: 'Evolução dos Alunos',
            icon: TrendingUp,
            badge: 'Onde Pararam',
            highlight: true,
          },
          {
            id: 'teacher_materials',
            label: 'Materiais & Módulos Talkê',
            icon: BookOpen,
            badge: '3 Níveis',
          },
          {
            id: 'teacher_availability',
            label: 'Grade de Horários (18h/7d)',
            icon: Clock,
            badge: '126 slots',
          },
          {
            id: 'teacher_earnings',
            label: 'Recebimento & PIX',
            icon: DollarSign,
          },
          {
            id: 'teacher_profile',
            label: 'Editar Perfil & Preço',
            icon: User,
          },
        ];

      case UserRole.Admin:
        return [
          {
            id: 'admin_dashboard',
            label: 'Dashboard Analítico',
            icon: BarChart3,
            badge: 'BI',
          },
          {
            id: 'admin_teachers',
            label: 'Professores & Retenção',
            icon: Users,
          },
          {
            id: 'admin_rules',
            label: 'Arquitetura DDD & Regras',
            icon: ShieldCheck,
          },
        ];
    }
  };

  const navItems = getNavItems();

  const handleItemClick = (item: any) => {
    if (item.action) {
      item.action();
    } else {
      onNavChange(item.id);
    }
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out flex flex-col justify-between ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo & Brand Header */}
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {isCollapsed ? (
                <TalkeLogo size="sm" variant="card" />
              ) : (
                <TalkeLogo size="sm" showSubtitle={true} />
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-neutral-400 hover:text-neutral-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Persona Switcher Selector */}
          <div className="p-3 border-b border-neutral-100 bg-neutral-50/70">
            {!isCollapsed ? (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5 px-1">
                  Modo de Acesso (Persona)
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-200/60 rounded-xl">
                  <button
                    type="button"
                    onClick={() => onRoleChange(UserRole.Student)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      currentRole === UserRole.Student
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 mb-0.5" />
                    <span>Aluno</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRoleChange(UserRole.Teacher)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      currentRole === UserRole.Teacher
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5 mb-0.5" />
                    <span>Prof</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRoleChange(UserRole.Admin)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      currentRole === UserRole.Admin
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 mb-0.5" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  title="Modo Aluno"
                  onClick={() => onRoleChange(UserRole.Student)}
                  className={`p-2 rounded-xl transition-all ${
                    currentRole === UserRole.Student
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-neutral-500 hover:bg-neutral-200'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Modo Professor"
                  onClick={() => onRoleChange(UserRole.Teacher)}
                  className={`p-2 rounded-xl transition-all ${
                    currentRole === UserRole.Teacher
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-neutral-500 hover:bg-neutral-200'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Modo Admin"
                  onClick={() => onRoleChange(UserRole.Admin)}
                  className={`p-2 rounded-xl transition-all ${
                    currentRole === UserRole.Admin
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-neutral-500 hover:bg-neutral-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {!isCollapsed && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block px-2 mb-1">
                Navegação Principal
              </span>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all group text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/15'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-neutral-500 group-hover:text-blue-600'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.highlight
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                              : 'bg-neutral-200 text-neutral-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Active User Quick Card at bottom */}
          <div className="p-3 border-t border-neutral-100 bg-neutral-50/50">
            {!isCollapsed ? (
              <div className="flex items-center gap-3 p-2 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
                <img
                  src={
                    currentRole === UserRole.Teacher
                      ? currentTeacher.avatarUrl
                      : currentStudent.avatarUrl
                  }
                  alt="Avatar"
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-neutral-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-neutral-900 block truncate">
                    {currentRole === UserRole.Teacher
                      ? currentTeacher.name
                      : currentStudent.name}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                    {currentRole === UserRole.Student && (
                      <span className="text-blue-600 font-bold">
                        R$ {currentStudent.walletBalanceBrl.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    {currentRole === UserRole.Teacher && (
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{currentTeacher.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {currentRole === UserRole.Admin && (
                      <span className="text-cyan-700 font-bold text-[10px]">Super Admin</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <img
                  src={
                    currentRole === UserRole.Teacher
                      ? currentTeacher.avatarUrl
                      : currentStudent.avatarUrl
                  }
                  alt="Avatar"
                  title={currentRole === UserRole.Teacher ? currentTeacher.name : currentStudent.name}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-neutral-200"
                />
              </div>
            )}
          </div>

          {onOpenLandingPage && (
            <div className="p-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  onOpenLandingPage();
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-neutral-600 hover:text-blue-600 hover:bg-blue-50/70 transition-colors ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title="Página Inicial / Institucional"
              >
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                {!isCollapsed && <span>Conhecer Plataforma</span>}
              </button>
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle Button */}
          <div className="hidden lg:flex p-2 border-t border-neutral-100 justify-end">
            <button
              type="button"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expandir Barra Lateral' : 'Recolher Barra Lateral'}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors w-full flex items-center justify-center gap-1 text-xs"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-[11px] font-semibold text-neutral-500">Recolher</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
