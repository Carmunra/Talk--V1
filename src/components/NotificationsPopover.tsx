import React from 'react';
import { Bell, Calendar, CreditCard, Star, Sparkles, X } from 'lucide-react';
import { AppNotification } from '../domain/types';

interface NotificationsPopoverProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  notifications,
  onMarkAsRead,
  onClose,
}) => {
  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'BOOKING':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'REVIEW':
        return <Star className="w-4 h-4 text-amber-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 text-slate-800 font-sans">
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Notificações Talkê
          </h4>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 font-sans">
            Nenhuma notificação recente.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onMarkAsRead(n.id)}
              className={`p-3 text-xs transition-colors cursor-pointer flex gap-3 ${
                n.read ? 'bg-transparent opacity-60' : 'bg-blue-50/50'
              } hover:bg-slate-50`}
            >
              <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-slate-100 border border-slate-200/60">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 space-y-0.5 font-sans">
                <p className="text-slate-800 leading-snug">{n.message}</p>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {new Date(n.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
