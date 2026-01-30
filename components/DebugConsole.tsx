import React, { useState, useEffect, useRef } from 'react';

interface LogMessage {
  id: number;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
}

interface DebugConsoleProps {
  isEnabled: boolean;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ isEnabled }) => {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Capture logs ALWAYS, regardless of isEnabled
  useEffect(() => {
    const formatArgs = (args: any[]) => {
      return args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return '[Circular/Object]';
          }
        }
        return String(arg);
      }).join(' ');
    };

    const addLog = (type: 'log' | 'warn' | 'error' | 'info', args: any[]) => {
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      const newMessage: LogMessage = {
        id: Date.now() + Math.random(),
        type,
        message: formatArgs(args),
        timestamp: timeString
      };

      setLogs(prev => {
        const newLogs = [...prev, newMessage];
        if (newLogs.length > 100) newLogs.shift(); // Keep last 100 logs
        return newLogs;
      });
    };

    // Override Console Methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', args);
    };

    // Global Error Handler
    const errorHandler = (event: ErrorEvent) => {
      addLog('error', [event.message]);
    };
    window.addEventListener('error', errorHandler);

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      addLog('error', [`Unhandled Promise: ${event.reason}`]);
    };
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  const handleCopyLogs = async () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      alert('Logs copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy logs:', err);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400 bg-red-900/20';
      case 'warn': return 'text-yellow-400 bg-yellow-900/20';
      case 'info': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-slate-300';
    }
  };

  // Logic: Always capture logs (useEffect above), but only render UI if isEnabled is true
  if (!isEnabled) {
    return null; 
  }

  return (
    <div className="fixed bottom-24 right-4 z-[9999] flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        {!isExpanded ? (
          <button 
            onClick={() => setIsExpanded(true)}
            className="w-12 h-12 bg-slate-800/90 backdrop-blur border border-slate-600 rounded-full flex items-center justify-center shadow-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors active:scale-95 animate-fade-in"
          >
            🐛
          </button>
        ) : (
          <div className="w-80 h-64 bg-slate-950/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-[10px] font-mono animate-fade-in">
            <div className="flex justify-between items-center px-3 py-2 bg-slate-900 border-b border-slate-800">
              <span className="font-bold text-slate-400">Debug Console</span>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopyLogs} 
                  className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded flex items-center gap-1"
                  title="Copy logs"
                >
                  📋
                </button>
                <button 
                  onClick={() => setLogs([])} 
                  className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded"
                  title="Clear logs"
                >
                  Clear
                </button>
                <button 
                  onClick={() => setIsExpanded(false)} 
                  className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded"
                >
                  ✕
                </button>
              </div>
            </div>
            <div 
              ref={scrollRef} 
              className="flex-1 overflow-y-auto p-2 space-y-1"
            >
              {logs.length === 0 && <p className="text-slate-600 italic text-center mt-4">No logs yet...</p>}
              {logs.map(log => (
                <div key={log.id} className={`break-words p-1 rounded ${getTypeColor(log.type)}`}>
                  <span className="opacity-50 mr-2">[{log.timestamp}]</span>
                  <span className="whitespace-pre-wrap">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.1s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default DebugConsole;