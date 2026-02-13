import React from 'react';
import { UserIdentityProfile } from './user-identity-profile';
import { PerformanceChart } from './performance-chart';
import { HabitRhythm } from './habit-rhythm';

export const ReflectiveMirror: React.FC = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pr-1">
      <UserIdentityProfile />
      <PerformanceChart />
      <HabitRhythm />
    </div>
  );
};