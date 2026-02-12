import React, { useState, useRef } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { triggerHaptic } from '../../../utils/haptic'; // Đảm bảo bạn đã có file này từ bước trước
import { LucideIcon } from 'lucide-react';

// Định nghĩa Zone nâng cao hỗ trợ Progressive
export interface Zone {
  id: string;
  x: number; // Hướng X (-1, 0, 1)
  y: number; // Hướng Y (-1, 0, 1)
  label: string;
  color: string;
  // Hỗ trợ icon động hoặc tĩnh
  iconLevel1?: React.ReactNode | string; 
  iconLevel2?: React.ReactNode | string; 
  baseIcon?: React.ReactNode | string; // Icon hiển thị trên Rail
}

interface GestureButtonProps {
  baseIcon: React.ReactNode;
  zones: Zone[];
  onTrigger: (zoneId: string, level: number) => void; // Trả về cả level (1 hoặc 2)
  onDragStateChange: (isDragging: boolean) => void; // Để báo cho cha biết mà làm mờ nút kia
  baseColor: string;
  disabled?: boolean;
  isDimmed?: boolean; // Trạng thái bị làm mờ (khi nút kia đang được kéo)
}

export const GestureButton: React.FC<GestureButtonProps> = ({ 
  baseIcon, zones, onTrigger, onDragStateChange, baseColor, disabled, isDimmed
}) => {
  const controls = useAnimation();
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(0); // 0: Base, 1: >50px, 2: >100px
  
  // Ref để tránh spam rung (chỉ rung khi chuyển level)
  const lastHapticRef = useRef<number>(0);

  const handleDrag = (_: any, info: PanInfo) => {
    const { x, y } = info.offset;
    const distance = Math.sqrt(x*x + y*y);

    // 1. Xác định Level dựa trên khoảng cách
    let newLevel = 0;
    if (distance > 100) newLevel = 2;
    else if (distance > 50) newLevel = 1;
    else newLevel = 0;

    // 2. Tìm Zone phù hợp hướng kéo
    let foundZone: string | null = null;
    if (newLevel > 0) {
       zones.forEach(zone => {
        // Logic khớp hướng (Threshold 30px để tránh nhiễu)
        const matchX = (zone.x > 0 && x > 20) || (zone.x < 0 && x < -20) || (zone.x === 0 && Math.abs(x) < 20);
        const matchY = (zone.y > 0 && y > 20) || (zone.y < 0 && y < -20) || (zone.y === 0 && Math.abs(y) < 20);

        if (matchX && matchY) foundZone = zone.id;
      });
    }

    // 3. Xử lý Feedback (Rung & State)
    if (foundZone !== activeZone || newLevel !== currentLevel) {
      setActiveZone(foundZone);
      setCurrentLevel(newLevel);

      // Chỉ rung khi Level tăng lên hoặc đổi Zone
      if (foundZone && newLevel > lastHapticRef.current) {
         triggerHaptic(newLevel === 2 ? 'heavy' : 'medium');
      }
      lastHapticRef.current = newLevel;
    }
  };

  const handleDragStart = () => {
    onDragStateChange(true);
  };

  const handleDragEnd = () => {
    onDragStateChange(false);
    if (activeZone && currentLevel > 0) {
      triggerHaptic('success');
      onTrigger(activeZone, currentLevel);
    }
    // Reset
    setActiveZone(null);
    setCurrentLevel(0);
    lastHapticRef.current = 0;
    controls.start({ x: 0, y: 0 });
  };

  // Helper để lấy Icon hiển thị trên nút (Morphing)
  const getDisplayIcon = () => {
    if (!activeZone) return baseIcon;
    const zone = zones.find(z => z.id === activeZone);
    if (!zone) return baseIcon;

    if (currentLevel === 2 && zone.iconLevel2) return zone.iconLevel2;
    if (currentLevel >= 1 && zone.iconLevel1) return zone.iconLevel1;
    return baseIcon;
  };

  const getButtonColor = () => {
      if (activeZone) {
          const zone = zones.find(z => z.id === activeZone);
          return zone ? zone.color : baseColor;
      }
      return baseColor;
  };

  return (
    <div className={`relative flex items-center justify-center ${isDimmed ? 'opacity-30' : 'opacity-100'} transition-opacity duration-200`}>
      
      {/* 1. THE RAIL (Cố định tại tâm, chỉ hiện khi Drag) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {zones.map(zone => (
           <motion.div
             key={zone.id}
             initial={{ opacity: 0, scale: 0 }}
             animate={{ 
               opacity: lastHapticRef.current > 0 ? 1 : 0, // Hiện khi bắt đầu kéo
               scale: activeZone === zone.id ? 1.2 : 1 
             }}
             className="absolute flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 shadow-sm border border-gray-200"
             style={{
               // Vị trí cố định theo vector hướng (nhân với khoảng cách Rail ảo)
               transform: `translate(${zone.x * 60}px, ${zone.y * 60}px)`,
               color: activeZone === zone.id ? zone.color : '#9ca3af',
               borderColor: activeZone === zone.id ? zone.color : 'transparent'
             }}
           >
             {/* Icon nhỏ trên Rail để gợi ý hướng */}
             <span className="text-[12px] font-bold">
               {zone.baseIcon}
             </span>
           </motion.div>
        ))}
      </div>

      {/* 2. THE BUTTON (Di chuyển theo tay) */}
      <motion.div
        drag={!disabled}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.15} // Độ đàn hồi dây thun
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileTap={{ scale: 0.95 }}
        className="relative z-10 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white cursor-pointer select-none"
        style={{ 
          backgroundColor: getButtonColor(),
          boxShadow: activeZone ? `0 10px 25px -5px ${getButtonColor()}80` : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="text-xl font-bold transition-all duration-200">
          {getDisplayIcon()}
        </div>
      </motion.div>
    </div>
  );
};