'use client';

import React, { memo } from 'react';

interface ActionCardProps {
  title: string;
  description: string;
  items: string[];
  color: string;
  icon: React.ReactNode;
}

export const ActionCard = memo(({ title, description, items, color, icon }: ActionCardProps) => (
  <div className="bg-surface-card border border-border rounded p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded ${color}`}>
        {icon}
      </div>
      <h3 className="font-bold text-txt-primary">{title}</h3>
    </div>
    <p className="text-xs text-txt-tertiary mb-4 ml-11">{description}</p>
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-txt-secondary">
          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-txt-disabled shrink-0" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
      {items.length === 0 && <li className="text-sm text-txt-tertiary italic">할 일이 없습니다.</li>}
    </ul>
  </div>
));
ActionCard.displayName = 'ActionCard';
