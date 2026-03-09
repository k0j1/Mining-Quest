import React from 'react';

interface TransactionResultProps {
  hash: string;
  type: 'deposit' | 'withdraw' | 'buy' | 'depart';
  onClose: () => void;
}

const TransactionResult: React.FC<TransactionResultProps> = ({ hash, type, onClose }) => {
  const shareText = `My ${type === 'deposit' ? 'deposit' : type === 'withdraw' ? 'withdrawal' : type === 'buy' ? 'item purchase' : 'quest departure'} transaction is complete!\nTx: https://basescan.org/tx/${hash}\n\n#MiningQuest #CHH`;

  const shareOnFarcaster = () => {
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent('https://farcaster.xyz/miniapps/MR1ItBAqMlzR/mining-quest')}`;
    import('@farcaster/frame-sdk').then(({ sdk }) => {
      sdk.actions.openUrl(url);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-white mb-4">トランザクション完了</h3>
        <p className="text-sm text-slate-400 mb-4">成功しました！</p>
        <a 
          href={`https://basescan.org/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 bg-slate-800 text-center rounded-lg text-sm text-indigo-400 mb-4 hover:bg-slate-700"
        >
          BaseScanで確認
        </a>
        <button 
          onClick={shareOnFarcaster}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold mb-4 hover:bg-indigo-500"
        >
          Farcasterで共有
        </button>
        <button onClick={onClose} className="w-full py-2 text-slate-500 text-sm">閉じる</button>
      </div>
    </div>
  );
};

export default TransactionResult;
