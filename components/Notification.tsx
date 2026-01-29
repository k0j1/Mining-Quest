import React, { useEffect, useState, useRef } from 'react';

interface NotificationProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || startX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    startX.current = null;
    
    // Threshold to dismiss (100px)
    if (Math.abs(translateX) > 100) {
      onClose();
    } else {
      setTranslateX(0); // Snap back
    }
  };

  const opacity = Math.max(0, 1 - Math.abs(translateX) / 200);

  return (
    <div className="fixed top-24 left-0 right-0 z-[300] flex justify-center pointer-events-none">
      <div 
        className={`w-[90%] max-w-md px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-in backdrop-blur-md cursor-grab active:cursor-grabbing pointer-events-auto ${
          type === 'error' 
            ? 'bg-rose-950/90 border-rose-500/50 text-white shadow-rose-900/20' 
            : 'bg-emerald-950/90 border-emerald-500/50 text-white shadow-emerald-900/20'
        }`}
        style={{
          transform: `translateX(${translateX}px)`,
          opacity: opacity,
          transition: isDragging.current ? 'none' : 'transform 0.3s ease, opacity 0.3s ease'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <span className="text-2xl filter drop-shadow-md select-none">{type === 'error' ? '⚠️' : '✅'}</span>
        <p className="font-bold text-sm drop-shadow-sm leading-tight select-none pointer-events-none">{message}</p>
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