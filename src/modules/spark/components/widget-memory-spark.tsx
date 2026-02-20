import React, { useRef } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

interface WidgetSlotProps {
  label: string;
  content: string;
  type: 'task' | 'thought';
  id: number;
}

/**
 * [SUB-COMPONENT]: Thẻ hiển thị từng mảnh ký ức phiên bản v4.7.
 * Thiết kế co giãn linh hoạt: Hiển thị trọn vẹn nội dung không giới hạn dòng.
 */
const WidgetSlotCard: React.FC<WidgetSlotProps> = ({ label, content, type, id }) => {
  // Timer để nhận diện Long Press (Nhấn giữ)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * [DOUBLE CLICK]: Mở bản ghi hiện tại qua Deep Link.
   */
  const handleDoubleClick = () => {
    triggerHaptic('medium');
    window.location.href = `/?open=${type}:${id}`;
  };

  /**
   * [LONG PRESS]: Bắt đầu đếm ngược khi người dùng chạm vào.
   */
  const handlePointerDown = () => {
    // Nếu có timer cũ thì xóa đi
    if (timerRef.current) clearTimeout(timerRef.current);

    // Bắt đầu đếm ngược 800ms cho hành động Long Press
    timerRef.current = setTimeout(() => {
      triggerHaptic('heavy');
      /**
       * ĐIỀU HƯỚNG KIẾN TẠO: Mở Modal ở chế độ tạo liên kết mới.
       */
      window.location.href = `/?create-link-to=${type}:${id}`;
      timerRef.current = null;
    }, 800);
  };

  /**
   * [CANCEL]: Hủy đếm ngược nếu người dùng nhấc tay sớm.
   */
  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div 
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp} // Hủy nếu tay trượt ra ngoài vùng card
      /* LAYOUT: Sử dụng h-auto để thẻ tự giãn nở theo độ dài văn bản.
         Thêm p-4 để tạo không gian thoáng đãng cho context dài. 
      */
      className="flex flex-col gap-2 p-4 bg-white border border-slate-200 rounded-[8px] 
                 active:scale-[0.98] active:bg-slate-50 transition-all cursor-pointer group select-none h-auto"
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 group-hover:text-blue-500 transition-colors">
          {label}
        </span>
        <div className="h-1 w-1 rounded-full bg-slate-200 group-hover:bg-blue-400" />
      </div>

      {/* CONTENT: Loại bỏ line-clamp-3 để hiển thị toàn bộ thông tin.
          Sử dụng whitespace-pre-wrap và break-words để giữ định dạng xuống dòng của người dùng.
      */}
      <p className="text-[13px] leading-relaxed text-slate-700 font-medium whitespace-pre-wrap break-words italic">
        "{content}"
      </p>
    </div>
  );
};

/**
 * [COMPONENT]: Widget Memory Spark (Vertical Stack Layout).
 * Cửa sổ hiển thị dòng chảy ký ức phiên bản v4.8.
 */
export const WidgetMemorySpark: React.FC<{ data: any }> = ({ data }) => {
  if (!data || !data.slots) return null;

  const { slot1, slot2, slot3, slot4 } = data.slots;

  /**
   * [ACTION]: Kích hoạt làm mới tri thức thủ công.
   * Logic: Phát sự kiện để WidgetProvider nhận biết và tăng Current_Pointer lên +1.
   */
  const handleManualRefresh = () => {
    triggerHaptic('medium');
    /**
     * PHÁT TÍN HIỆU DÒNG CHẢY: Gửi sự kiện hệ thống để WidgetProvider ép Current_Pointer tăng lên,
     * từ đó xoay vòng sang nhóm 4 bản ghi tiếp theo trong các Pool.
     */
    window.dispatchEvent(new CustomEvent('spark:manual-refresh'));
  };

  return (
    /* CONTAINER: Chuyển đổi sang flex-col để xếp chồng 4 slots theo hàng dọc.
       Bổ sung pb-32 (Footer Guard) để đảm bảo không bị thanh điều hướng che mất nội dung khi cuộn.
    */
    <section className="w-full max-w-md mx-auto p-4 flex flex-col gap-4 select-none pb-32">
      <div className="flex items-center gap-2 px-1">
        <div className="h-3 w-3 bg-blue-600 rounded-sm" />
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900">
          Memory Spark
        </h2>
      </div>

      {/* VERTICAL STACK: Xếp chồng các thẻ ký ức với khoảng cách gap-4 đồng nhất.
      */}
      <div className="flex flex-col gap-4">
        {slot1 && <WidgetSlotCard label="Heritage" content={slot1.content} type={slot1.type || 'task'} id={slot1.id} />}
        {slot3 && <WidgetSlotCard label="Trending" content={slot3.content} type={slot3.type || 'task'} id={slot3.id} />}
        {slot4 && <WidgetSlotCard label="Isolated" content={slot4.content} type={slot4.type || 'task'} id={slot4.id} />}
        {slot2 && <WidgetSlotCard label="Universe" content={slot2.content} type={slot2.type || 'task'} id={slot2.id} />}
      </div>

      {/* [NEW]: NÚT MANUAL REFRESH (LÀM MỚI THỦ CÔNG)
          Được đặt ở cuối danh sách để đảm bảo người dùng đã tiêu thụ hết 4 ý tưởng trước khi khám phá nội dung mới.
      */}
      <button 
        onClick={handleManualRefresh}
        className="w-full py-4 mt-2 border-2 border-dashed border-slate-100 rounded-[16px] 
                   flex items-center justify-center gap-3 group
                   active:scale-[0.98] active:bg-slate-50 transition-all cursor-pointer"
      >
        <div className="p-1.5 bg-slate-50 rounded-full group-active:rotate-180 transition-transform duration-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <path d="M23 4v6h-6"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
          Khám phá thêm tri thức
        </span>
      </button>

      {/* Gợi ý tương tác mới cho người dùng */}
      <p className="text-[8px] text-center text-slate-400 mt-2 font-bold uppercase tracking-widest">
        Chạm kép để mở • Nhấn giữ để liên kết
      </p>
    </section>
  );
};