import React from 'react';
import { useIdentityStore } from '../store';
import { Shield, Eye, Scale, Fingerprint, TrendingUp } from 'lucide-react';

export const ManifestoTab: React.FC = () => {
  const { manifesto, hasCompletedOnboarding } = useIdentityStore();

  if (!hasCompletedOnboarding) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
        <div className="p-4 bg-slate-800 rounded-full opacity-50">
          <Fingerprint className="w-12 h-12 text-slate-400" />
        </div>
        <p className="text-slate-400 max-w-md">
          Hãy hoàn thành hành trình "Đi tìm ngôi sao" để mở khóa Bản Tuyên Ngôn của chính mình.
        </p>
      </div>
    );
  }

  const cards = [
    { title: 'Tầm Nhìn', icon: Eye, content: manifesto.vision, color: 'text-blue-400', border: 'border-blue-500/20' },
    { title: 'Căn Tính', icon: Fingerprint, content: manifesto.identity, color: 'text-indigo-400', border: 'border-indigo-500/20' },
    { title: 'Luật Chơi', icon: Scale, content: manifesto.nonNegotiables, color: 'text-red-400', border: 'border-red-500/20' },
    { title: 'Kỹ Năng Cốt Lõi', icon: TrendingUp, content: manifesto.gapSkills, color: 'text-emerald-400', border: 'border-emerald-500/20' },
    { title: 'Nỗi Sợ (Động lực đẩy)', icon: Shield, content: manifesto.fear, color: 'text-slate-500', border: 'border-slate-700' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pb-20 overflow-y-auto">
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className={`p-6 rounded-xl bg-slate-900/50 border ${card.border} backdrop-blur-sm hover:bg-slate-900 transition-colors`}
        >
          <div className="flex items-center gap-3 mb-4">
            <card.icon className={`w-5 h-5 ${card.color}`} />
            <h3 className={`text-sm font-bold uppercase tracking-wider ${card.color}`}>
              {card.title}
            </h3>
          </div>
          <p className="text-slate-200 text-lg font-medium leading-relaxed">
            "{card.content}"
          </p>
        </div>
      ))}
    </div>
  );
};