import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
};

const COLORS = {
  success: 'bg-green-500/10 border-green-500/20 text-green-400',
  error: 'bg-red-500/10 border-red-500/20 text-red-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  warning: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
};

export function NotificationToast() {
  const { notifications, dismissNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {notifications.map((n) => {
        const Icon = ICONS[n.type] || Info;
        return (
          <div
            key={n.id}
            className={`flex items-center gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-lg animate-in slide-in-from-right ${COLORS[n.type]}`}
          >
            <Icon size={16} className="flex-shrink-0" />
            <p className="text-[13px] font-medium flex-1">{n.message}</p>
            <button onClick={() => dismissNotification(n.id)} className="flex-shrink-0 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
