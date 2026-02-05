import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Shield, Target, Eye, Lock, Zap } from 'lucide-react';
import { db, type IdentityProfile } from '../utils/db';

const Identity: React.FC = () => {
  const [profile, setProfile] = useState<IdentityProfile | null>(null);
  const [entropy, setEntropy] = useState(0);

  useEffect(() => {
    db.identity_profile.toArray().then(profiles => {
      if (profiles.length > 0) {
        const latest = profiles[profiles.length - 1];
        setProfile(latest);
        const daysSinceAudit = (Date.now() - latest.audit_date) / (1000 * 60 * 60 * 24);
        setEntropy(Math.min(1, daysSinceAudit / 90));
      }
    });
  }, []);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center text-slate-400">
        <Lock size={48} className="mb-4 opacity-20" />
        <h3 className="text-xl font-bold text-slate-600 mb-2 uppercase">Bản ngã bị khóa</h3>
        <p className="text-sm italic">"Con chưa biết mình là ai, mọi con số đều vô nghĩa." [cite: 12]</p>
        <div className="mt-8 bg-slate-100 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            Hãy nhấn giữ tiêu đề "Điều gì đang diễn ra?" <br/> ở <span className="text-blue-600 font-black italic">Tab Hiện tại</span> để mở Mật đạo. [cite: 1]
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 transition-all" style={{ filter: `grayscale(${entropy})` }}>
      {/* 1. RADAR CHART - ĐẬP VÀO MẮT  */}
      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-6 flex flex-col items-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Zap size={12}/> Biểu đồ Radar Căn tính</h3>
          <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Giả lập Radar Chart bằng SVG */}
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-18 rotate-0">
                  <polygon points="50,5 95,35 80,90 20,90 5,35" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                  <polygon points="50,20 80,40 70,75 30,75 20,40" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" />
                  <circle cx="50" cy="50" r="1" fill="#3b82f6" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"><Fingerprint size={80}/></div>
          </div>
          <p className="text-[9px] font-bold text-slate-300 mt-4 uppercase tracking-widest italic">Cái máy thấy vs. Cái trò thấy [cite: 21]</p>
      </section>

      {/* 2. TRỤC CĂN TÍNH & TẦM NHÌN [cite: 9, 10] */}
      <div className="flex flex-col gap-6">
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Target size={12}/> 5 Căn tính chủ đạo [cite: 10]</h3>
            <div className="flex flex-wrap gap-2">
                {profile.core_identities.map((id, i) => (
                    <span key={i} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">{id}</span>
                ))}
            </div>
        </section>

        <section className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl shadow-blue-100">
            <h3 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2 flex items-center gap-2"><Eye size={12}/> Tầm nhìn 3 năm [cite: 10]</h3>
            <p className="text-lg font-bold leading-snug">"{profile.vision_statement}"</p>
        </section>

        <section className="bg-red-50 p-6 rounded-[2rem] border-l-4 border-red-500">
            <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Shield size={12}/> Luật chơi (Tuyên ngôn giới hạn) [cite: 60]</h3>
            <p className="text-base font-bold text-red-900">"{profile.non_negotiables}"</p>
        </section>
      </div>
    </div>
  );
};
export default Identity;