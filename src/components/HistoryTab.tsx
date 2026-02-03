import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import dayjs from 'dayjs';

export const HistoryTab = () => {
  const entries = useLiveQuery(() => db.entries.reverse().sortBy('created_at'));
  return (
    <div className="min-h-screen bg-white p-4 pb-32">
        <h1 className="text-xl font-semibold text-slate-800 mb-4">Lịch sử</h1>
        <div className="space-y-3">
            {entries?.map(e => (
                <div key={e.id} className="p-3 border border-slate-200 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">{dayjs(e.created_at).format('DD/MM/YYYY HH:mm')}</div>
                    <div className="text-sm text-slate-800">{e.content}</div>
                </div>
            ))}
        </div>
    </div>
  )
}