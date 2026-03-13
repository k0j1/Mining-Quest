import React from 'react';

interface TransactionErrorProps {
  message: string;
  onClose: () => void;
}

const TransactionError: React.FC<TransactionErrorProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-6">
      <div className="bg-slate-900 border border-red-900 rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-red-500 mb-4">トランザクションエラー</h3>
        <p className="text-sm text-slate-300 mb-6">{message}</p>
        <button 
          onClick={() => navigator.clipboard.writeText(message)}
          className="w-full py-2 mb-2 bg-slate-700 text-white rounded-lg text-xs font-bold hover:bg-slate-600"
        >
          エラー内容をコピー
        </button>
        <button 
          onClick={onClose} 
          className="w-full py-3 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-500"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};

export default TransactionError;
