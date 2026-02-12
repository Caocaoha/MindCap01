import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GestureButton } from './components/gesture-button';
import { useIdentityStore } from '../identity/identity-store';
import { db } from '../../database/db';
import { useUIStore } from '../../store/ui-store'; // Đã sửa thành UI viết hoa

export const InputBar: React.FC = () => {
  const [content, setContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const { isInputMode, setInputMode } = useUIStore(); // Đã sửa thành UI viết hoa
  const { setMood } = useIdentityStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = async (type: 'task' | 'mood', label: string) => {
    if (type === 'task' && !content.trim()) return;

    // db.entries giờ đây đã được TypeScript nhận diện nhờ file db.ts ở trên
    const lastEntry = await db.entries.orderBy('createdAt').last();
    const linkedIds: number[] = [];

    if (lastEntry && lastEntry.createdAt) {
      const timeDiff = Date.now() - lastEntry.createdAt;
      if (timeDiff < 5 * 60 * 1000) {
        linkedIds.push(lastEntry.id!);
      }
    }

    const entryData = {
      content: content.trim(),
      type,
      label,
      linkedIds,
      createdAt: Date.now(),
    };

    await db.entries.add(entryData);
    
    if (type === 'mood') setMood(label);
    
    setContent('');
    setInputMode(false);
    if (textareaRef.current) textareaRef.current.blur();
  };

  return (
    <motion.div
      layout
      animate={{
        bottom: isInputMode ? 'auto' : '1.5rem',
        top: isInputMode ? '1rem' : 'auto',
        width: isInputMode ? '95%' : '90%',
      }}
      className="fixed left-1/2 -translate-x-1/2 z-50 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-3"
    >
      <div className="relative flex flex-col gap-3">
        <motion.textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setInputMode(true)}
          placeholder="What's on your mind?"
          animate={{
            opacity: isDragging ? 0.2 : 1,
            filter: isDragging ? 'blur(2px)' : 'blur(0px)',
          }}
          className="w-full bg-transparent text-white resize-none outline-none min-h-[80px] p-2 text-lg"
        />

        <AnimatePresence>
          {isInputMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-around items-center px-2 py-2"
            >
              <GestureButton
                type="task"
                onAction={(label) => handleSave('task', label)}
                onDragStateChange={setIsDragging}
              />

              <GestureButton
                type="mood"
                onAction={(label) => handleSave('mood', label)}
                onDragStateChange={setIsDragging}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};