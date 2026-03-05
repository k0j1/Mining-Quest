import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { playClick } from '../utils/sound';

interface TestWarningModalProps {
  onClose: () => void;
}

const TestWarningModal: React.FC<TestWarningModalProps> = ({ onClose }) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border-2 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-rose-500/30 bg-rose-950/30 flex justify-center items-center">
          <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2 tracking-wide">
            <span className="text-2xl animate-pulse">⚠️</span> {t('common.test_warning_title')}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-center">
          <p className="text-slate-300 text-sm leading-relaxed font-medium">
            {t('common.test_warning_desc')}
          </p>

          <button 
            onClick={() => { playClick(); onClose(); }}
            className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-xl font-bold text-lg shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {t('common.understand')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestWarningModal;
