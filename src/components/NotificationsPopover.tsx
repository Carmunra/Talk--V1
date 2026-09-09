import React from 'react';
import { Bell, Check, Calendar, CreditCard, Star, Sparkles, X } from 'lucide-react';
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
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'REVIEW':
        return <Star className="w-4 h-4 text-amber-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-neutral-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-3.5 border-b border-neutral-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            Notificações Talkê
          </h4>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500">
            Nenhuma notificação recente.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onMarkAsRead(n.id)}
              className={`p-3 text-xs transition-colors cursor-pointer flex gap-3 ${
                n.read ? 'bg-white opacity-70' : 'bg-blue-50/30 font-medium'
              } hover:bg-neutral-50`}
            >
              <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-neutral-100">
                {getIcon(n.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-neutral-900">{n.title}</span>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
                <p className="text-neutral-600 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  {new Date(n.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
