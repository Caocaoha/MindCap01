import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Shield, Target, Eye, Lock, Wind } from 'lucide-react';
import { db, type IdentityProfile } from '../utils/db';

const Identity: React.FC = () => {
  const [profile, setProfile] = useState<IdentityProfile | null>(null);
  const [entropy, setEntropy] = useState(0);

  useEffect(() => {
    db.identity_profile.toArray().then(profiles => {
      if (profiles.length > 0) {
        const latest = profiles[profiles.length - 1];
        setProfile(latest);
        const days = (Date.now() - latest.audit_date) / (1000 * 60 * 60 * 24);
        setEntropy(Math.min(1, days / 90));
      }
    });
  }, []);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center text-slate-400">
        <Lock size={48} className="mb-4 opacity-20" />
        <h3 className="text-xl font-bold text-slate-600 mb-2 uppercase tracking-tighter">Bản ngã bị khóa</h3>
        <p className="text-sm italic">"Con chưa biết mình là ai, mọi con số đều vô nghĩa."</p>
        <div className="mt-8 bg-slate-100 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            Hãy nhấn giữ tiêu đề "Điều gì đang diễn ra?" <br/> ở <span className="text-blue-600">Tab Hiện tại</span> để mở Mật đạo.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 min-h-screen bg-slate-50 transition-all" style={{ filter: `grayscale(${entropy})` }}>
      <header className="py-6 mb-4">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
          <Fingerprint className="text-blue-600" /> Căn tính
        </h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Identity OS V7.1</p>
      </header>

      <div className="flex flex-col gap-6">
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Target size={12}/> Trục căn tính</h3>
            <div className="flex flex-wrap gap-2">
                {profile.core_identities.map((id, i) => (
                    <span key={i} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">{id}</span>
                ))}
            </div>
        </section>

        <section className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl shadow-blue-100">
            <h3 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2 flex items-center gap-2"><Eye size={12}/> Tầm nhìn</h3>
            <p className="text-lg font-bold leading-snug">"{profile.vision_statement}"</p>
        </section>

        <section className="bg-red-50 p-6 rounded-[2rem] border-l-4 border-red-500">
            <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Shield size={12}/> Luật chơi</h3>
            <p className="text-base font-bold text-red-900 leading-relaxed">"{profile.non_negotiables}"</p>
        </section>
      </div>
    </div>
  );
};
export default Identity;