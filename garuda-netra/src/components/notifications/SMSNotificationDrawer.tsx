import React from 'react';
import { X, Bell, MessageSquare, Mail, CheckCheck, Clock } from 'lucide-react';
import { NotificationMessage } from '../../types';
import { formatTimestamp } from '../../utils/helpers';

export interface SMSNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationMessage[];
}

export default function SMSNotificationDrawer({ isOpen, onClose, notifications }: SMSNotificationDrawerProps) {
  if (!isOpen) return null;

  const getTypeIcon = (type: NotificationMessage['type']) => {
    switch (type) {
      case 'SMS': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'PUSH': return <Bell className="w-4 h-4 text-amber-400" />;
      case 'EMAIL': return <Mail className="w-4 h-4 text-purple-400" />;
      default: return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  const getStatusBadge = (status: NotificationMessage['status']) => {
    switch (status) {
      case 'SENT': return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1"><Clock className="w-3 h-3" />Sent</span>;
      case 'DELIVERED': return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-1"><CheckCheck className="w-3 h-3" />Delivered</span>;
      case 'READ': return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1"><CheckCheck className="w-3 h-3" />Read</span>;
      default: return null;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-40 transition-opacity" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Bell className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Notification Log</h3>
              <p className="text-xs text-slate-400">{notifications.length} notification(s)</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
            aria-label="Close notification log"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
              <Bell className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-slate-600 mt-1">Dispatched tracking alerts and SMS logs will appear here</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(notif.type)}
                    <span className="text-xs font-mono font-semibold text-slate-300">{notif.type}</span>
                  </div>
                  {getStatusBadge(notif.status)}
                </div>
                <p className="text-xs text-slate-400 font-mono">To: {notif.recipient}</p>
                <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200 leading-relaxed font-sans border border-slate-600/40">
                  {notif.message}
                </div>
                <p className="text-xs text-slate-500 font-mono">{formatTimestamp(notif.timestamp)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
