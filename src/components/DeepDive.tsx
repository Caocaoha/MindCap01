import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Fingerprint, Anchor, Wind, CheckCircle2 } from 'lucide-react';
import { db } from '../utils/db';

// --- CẤU TRÚC CÂU HỎI (Dựa trên file Self Audit) ---
const QUESTIONS = [
  // CHẶNG 1: SOI CHIẾU BÓNG TỐI (AXIT) [cite: 23]
  { id: 1, text: "Nỗi bất mãn âm ỉ và dai dẳng mà trò đang phải sống chung hàng ngày là gì?", phase: 'dive' },
  { id: 2, text: "Viết ra 3 điều về bản thân trò thường xuyên phàn nàn nhưng vẫn chưa thay đổi được?", phase: 'dive' },
  { id: 3, text: "Với mỗi lời phàn nàn, điều trò thực sự khao khát ẩn dưới sự khó chịu đó là gì?", phase: 'dive' },
  { id: 4, text: "Đâu là sự thật về cuộc sống của trò mà trò không bao giờ dám thổ lộ với người mình kính trọng?", phase: 'dive' },
  
  // CHẶNG 2: MỎ NEO CỐT LÕI (KIỀM) [cite: 27]
  { id: 5, text: "Giữa những bất mãn đó, phẩm chất nào của trò vẫn đang 'sống sót' và lấp lánh?", phase: 'dive' },
  { id: 6, text: "Điều gì ở bản thân mà trò nhất quyết không để nó bị tha hóa?", phase: 'dive' },

  // CHẶNG 3: VIỄN CẢNH KHỐC LIỆT [cite: 29]
  { id: 7, text: "Nếu hành vi không đổi trong 5 năm tới, hãy mô tả một ngày thứ Ba bình thường: Trò thức dậy ở đâu?", phase: 'dive' },
  { id: 8, text: "Cơ thể cảm thấy thế nào? Ai đang rời bỏ trò?", phase: 'dive' },
  { id: 9, text: "Nhìn ở mốc 10 năm: Trò đã bỏ lỡ những cơ hội nào?", phase: 'dive' },
  
  // ĐIỂM DỪNG 1 [cite: 63]
  { id: 10, text: "HÃY DỪNG LẠI VÀ THỞ. (Cảm nhận nỗi đau của sự hối tiếc)", phase: 'pause' },

  { id: 11, text: "Mọi người nói gì về trò khi trò không có mặt ở đó?", phase: 'dive' },
  { id: 12, text: "Trò đang ở cuối đời, sống một cuộc đời 'an toàn'. Cái giá trò phải trả là gì?", phase: 'dive' },
  { id: 13, text: "Trò thấy ai đang sống cuộc sống tệ hại giống viễn cảnh đó? Trò cảm thấy thế nào khi nghĩ về việc trở thành họ?", phase: 'dive' },

  // CHẶNG 4: KHOẢNG LẶNG & SỰ TRUNG THÀNH [cite: 37]
  { id: 14, text: "Để không trở thành con người cũ, trò phải từ bỏ căn tính nào? Sự 'khai tử' này gây tổn thất gì?", phase: 'dive' },
  { id: 15, text: "Sự thật tàn nhẫn: Trò đang 'trung thành' với lời hứa lỗi thời nào (vd: làm vui lòng cha mẹ)?", phase: 'dive' },

  // ĐIỂM DỪNG 2 [cite: 63]
  { id: 16, text: "KHOẢNG LẶNG TIÊU HÓA. (Chuẩn bị trồi lên mặt nước)", phase: 'pause' },

  // CHẶNG 5: KIẾN TẠO TẦM NHÌN (ÁNH SÁNG) - Chuyển sang giao diện Sáng [cite: 45]
  { id: 17, text: "Búng tay và sống cuộc đời mơ ước sau 3 năm. Một ngày thứ Ba bình thường trông như thế nào?", phase: 'surface' },
  { id: 18, text: "Trò cần tin điều gì về mình để cuộc sống này trở nên tự nhiên?", phase: 'surface' },
  { id: 19, text: "BẢN TUYÊN NGÔN CĂN TÍNH: 'Tôi là kiểu người...'", phase: 'surface', key: 'core_identities' }, // Quan trọng [cite: 49]
  { id: 20, text: "Nếu đã là người đó rồi, điều trò mong muốn làm nhất trong tuần này là gì?", phase: 'surface' },
  { id: 21, text: "Đâu là 'kẻ thù thực sự' của trò? (Một niềm tin cũ, một thói quen độc hại)", phase: 'surface' },

  // CHẶNG 6: CHIẾN LƯỢC [cite: 52]
  { id: 22, text: "Viết một câu tóm gọn về cuộc sống trò ghê sợ (Anti-Vision).", phase: 'surface', key: 'anti_vision' },
  { id: 23, text: "Viết một câu tóm gọn về cuộc sống trò hướng tới (Vision).", phase: 'surface', key: 'vision' },
  { id: 24, text: "Đâu là 3 kỹ năng/thói quen trò buộc phải làm chủ trong 12 tháng tới?", phase: 'surface' },
  { id: 25, text: "Lệnh thực thi hàng ngày: Lên kế hoạch 2-3 việc cho ngày mai.", phase: 'surface' },
  { id: 26, text: "TUYÊN NGÔN GIỚI HẠN: Trò KHÔNG BAO GIỜ hy sinh giá trị cốt lõi nào?", phase: 'surface', key: 'rules' }, // [cite: 60]
];

interface DeepDiveProps {
  onClose: () => void;
}

const DeepDive: React.FC<DeepDiveProps> = ({ onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentInput, setCurrentInput] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  
  const question = QUESTIONS[currentIndex];
  const isDarkPhase = question.phase === 'dive' || question.phase === 'pause';

  // Haptic Feedback Helper
  const triggerHaptic = (type: 'thump' | 'impact') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'thump') navigator.vibrate(10); // Rung nhẹ như tiếng thở [cite: 62]
      if (type === 'impact') navigator.vibrate([30, 50, 30]); // Rung mạnh xác lập [cite: 65]
    }
  };

  // Logic Pause (Điểm dừng chiến lược)
  useEffect(() => {
    if (question.phase === 'pause') {
      setIsPaused(true);
      const timer = setTimeout(() => {
        setIsPaused(false);
      }, 8000); // Bắt buộc dừng 8 giây để thở
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  const handleNext = async () => {
    // Lưu câu trả lời
    if (question.phase !== 'pause') {
      if (currentInput.length < 5) return; // Bắt buộc nhập liệu [cite: 67]
      setAnswers(prev => ({ ...prev, [question.id]: currentInput }));
      
      // Haptic phản hồi
      if (question.key) triggerHaptic('impact'); // Rung mạnh khi chốt Căn tính/Tầm nhìn
      else triggerHaptic('thump'); // Rung nhẹ khi lưu suy nghĩ
    }

    // Chuyển câu hỏi
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentInput('');
    } else {
      await finishAudit();
    }
  };

  const finishAudit = async () => {
    // Lưu vào Database Identity Profile 
    const profile = {
      audit_date: Date.now(),
      raw_answers: { ...answers, [question.id]: currentInput },
      core_identities: [answers[19] || currentInput], // Lấy từ câu 19
      anti_vision: answers[22] || '',
      vision_statement: answers[23] || '',
      non_negotiables: answers[26] || '',
    };
    
    await db.identity_profile.add(profile);
    triggerHaptic('impact');
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 transition-colors duration-1000 ${
        isDarkPhase ? 'bg-black text-slate-200 font-serif' : 'bg-slate-50 text-slate-800 font-sans' // 
      }`}
    >
      <div className="w-full max-w-lg relative min-h-[60vh] flex flex-col justify-center">
        
        {/* Progress Bar tinh tế */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-800/20 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${isDarkPhase ? 'bg-slate-500' : 'bg-blue-600'}`}
            animate={{ width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>

        <AnimatePresence mode='wait'>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-6"
          >
            {/* Nội dung câu hỏi */}
            <h2 className={`text-2xl md:text-3xl leading-relaxed ${isDarkPhase ? 'italic font-light opacity-90' : 'font-bold tracking-tight'}`}>
              {question.phase === 'pause' && <Wind className="mb-4 animate-pulse mx-auto opacity-50"/>}
              {question.text}
            </h2>

            {/* Vùng nhập liệu (Ẩn khi Pause) */}
            {question.phase !== 'pause' && (
              <textarea
                autoFocus
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Chạm vào để trả lời..."
                className={`w-full bg-transparent border-b-2 outline-none resize-none text-lg min-h-[100px] transition-all ${
                  isDarkPhase 
                    ? 'border-slate-700 placeholder-slate-600 focus:border-slate-400' 
                    : 'border-slate-200 placeholder-slate-300 focus:border-blue-500'
                }`}
              />
            )}
            
            {/* Nút Tiếp tục */}
            <div className="flex justify-end mt-4">
              {question.phase === 'pause' ? (
                isPaused ? (
                   <span className="text-xs tracking-[0.2em] opacity-30 animate-pulse">ĐANG THỞ...</span>
                ) : (
                   <button onClick={handleNext} className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity">
                     TIẾP TỤC HÀNH TRÌNH <ArrowRight size={14}/>
                   </button>
                )
              ) : (
                <button 
                  onClick={handleNext}
                  disabled={currentInput.length < 5}
                  className={`p-4 rounded-full transition-all ${
                    currentInput.length < 5 
                      ? 'opacity-0 scale-90' // Ẩn nếu chưa nhập đủ [cite: 67]
                      : isDarkPhase ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                  }`}
                >
                  {currentIndex === QUESTIONS.length - 1 ? <CheckCircle2 size={24}/> : <ArrowRight size={24}/>}
                </button>
              )}
            </div>

          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Footer chỉ dẫn */}
      <div className="absolute bottom-10 opacity-30 text-[10px] tracking-[0.3em] uppercase">
        {isDarkPhase ? "Chế độ Lặn Sâu" : "Kiến tạo Căn Tính"}
      </div>

    </motion.div>
  );
};

export default DeepDive;