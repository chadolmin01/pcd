'use client';

import React, { memo, useState, useEffect } from 'react';
import { ChevronRight, Gift } from 'lucide-react';

interface RecommendedEvent {
  id: string;
  title: string;
  organizer: string;
  eventType: string;
  deadline: string;
  daysLeft: number;
  tags: string[];
  benefits: string[];
  matchScore: number;
}

interface EventTeaserCardProps {
  event: RecommendedEvent;
}

export const EventTeaserCard = memo(({ event }: EventTeaserCardProps) => (
  <div className="bg-surface-card border border-border rounded p-4 hover:shadow-md hover:border-border-strong transition-all group cursor-pointer">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-txt-primary bg-surface-sunken px-2 py-0.5 rounded-full">
            {event.eventType}
          </span>
          {event.daysLeft <= 7 && (
            <span className="text-[10px] font-bold text-status-danger-text bg-status-danger-bg px-2 py-0.5 rounded-full animate-pulse">
              D-{event.daysLeft}
            </span>
          )}
        </div>
        <h4 className="font-bold text-txt-primary text-sm line-clamp-1 group-hover:text-txt-primary transition-colors">
          {event.title}
        </h4>
        <p className="text-xs text-txt-tertiary mt-0.5">{event.organizer}</p>
      </div>
      <ChevronRight size={16} className="text-txt-disabled group-hover:text-txt-primary group-hover:translate-x-1 transition-all shrink-0" />
    </div>
    <div className="flex flex-wrap gap-1 mb-3">
      {event.tags.slice(0, 3).map((tag, i) => (
        <span key={i} className="text-[10px] text-txt-tertiary bg-surface-sunken px-2 py-0.5 rounded">
          {tag}
        </span>
      ))}
    </div>
    <div className="flex items-center gap-2 text-[10px] text-txt-tertiary">
      <Gift size={12} />
      <span className="line-clamp-1">{event.benefits.join(' · ')}</span>
    </div>
  </div>
));
EventTeaserCard.displayName = 'EventTeaserCard';

interface EventsTeaserSectionProps {
  tags?: string[];
}

export const EventsTeaserSection = memo(({ tags }: EventsTeaserSectionProps) => {
  const [events, setEvents] = useState<RecommendedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const tagParam = tags?.join(',') || '';
        const response = await fetch(`/api/events/recommend?tags=${encodeURIComponent(tagParam)}&limit=3`);
        const data = await response.json();
        if (data.success) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [tags]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surface-sunken rounded h-24" />
        ))}
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="space-y-3">
      {events.map(event => (
        <EventTeaserCard key={event.id} event={event} />
      ))}
    </div>
  );
});
EventsTeaserSection.displayName = 'EventsTeaserSection';

export type { RecommendedEvent };
