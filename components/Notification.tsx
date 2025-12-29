
import React, { useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[300] w-[90%] max-w-md pointer-events-none">
      <div className={`px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-in backdrop-blur-md ${
        type === 'error' 
          ? 'bg-rose-950/90 border-rose-500/50 text-white shadow-rose-900/20' 
          : 'bg-emerald-950/90 border-emerald-500/50 text-white shadow-emerald-900/20'
      }`}>
        <span className="text-2xl filter drop-shadow-md">{type === 'error' ? '⚠️' : '✅'}</span>
        <p className="font-bold text-sm drop-shadow-sm leading-tight">{message}</p>
      </div>
      <style>{`
        @keyframes slide-in {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};

export default Notification;
