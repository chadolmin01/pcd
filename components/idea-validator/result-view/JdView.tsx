'use client';

import React, { memo } from 'react';
import { MapPin, DollarSign, Check, Share2, Award, Star } from 'lucide-react';
import { JdStructure } from '../types';

interface JdViewProps {
  jd: JdStructure;
  onCopy: (text: string) => void;
  copied: boolean;
}

export const JdView = memo(({ jd, onCopy, copied }: JdViewProps) => (
  <div className="bg-surface-card shadow-lg rounded border border-border overflow-hidden mx-auto max-w-5xl relative">
    {/* Decorative Header */}
    <div className="h-40 bg-surface-inverse relative pattern-grid-lg">
      <div className="absolute inset-0 bg-gradient-to-t from-surface-inverse via-transparent to-transparent opacity-90" />
      <div className="absolute -bottom-10 left-8 md:left-12 p-1.5 bg-surface-card rounded shadow-lg">
        <div className="w-20 h-20 bg-surface-inverse rounded flex items-center justify-center text-txt-inverse font-black text-3xl tracking-tighter">
          D.
        </div>
      </div>
    </div>

    <div className="pt-16 px-8 md:px-12 pb-8 border-b border-border-subtle">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-surface-sunken text-txt-secondary text-xs font-bold uppercase rounded">{jd.department}</span>
            <span className="text-xs text-txt-tertiary">Full-time</span>
          </div>
          <h1 className="text-3xl font-bold text-txt-primary mb-4">{jd.roleTitle}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-txt-tertiary">
            <span className="flex items-center gap-1.5"><MapPin size={16} className="text-txt-tertiary"/> Remote / Seoul, KR</span>
            <span className="flex items-center gap-1.5 text-txt-secondary bg-surface-sunken px-3 py-1 rounded-full"><DollarSign size={16}/> Significant Equity Offered</span>
          </div>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button className="px-8 py-3 bg-surface-inverse text-txt-inverse font-bold rounded-full hover:bg-gray-800 transition-colors shadow-xl shadow-sm transform hover:-translate-y-0.5">
            Apply Now
          </button>
          <button
            onClick={() => onCopy(JSON.stringify(jd))}
            className="p-3 border border-border rounded-full hover:bg-surface-sunken text-txt-secondary transition-colors"
            aria-label={copied ? "복사됨" : "공유하기"}
          >
            {copied ? <Check size={20} className="text-status-success-text" /> : <Share2 size={20} />}
          </button>
        </div>
      </div>
    </div>

    <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
      {/* Main Content */}
      <div className="md:col-span-2 space-y-10">
        <section>
          <h3 className="text-sm font-bold text-txt-tertiary uppercase tracking-widest mb-4">About the Team</h3>
          <p className="text-txt-secondary leading-relaxed text-lg">
            {jd.companyIntro}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-txt-primary mb-4">Responsibilities</h3>
          <ul className="space-y-3">
            {jd.responsibilities.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-txt-secondary leading-relaxed">
                <Check size={18} className="text-txt-secondary mt-1 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold text-txt-primary mb-4">Requirements</h3>
          <ul className="space-y-3">
            {jd.qualifications.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-txt-secondary leading-relaxed">
                <div className="w-1.5 h-1.5 bg-border rounded-full mt-2.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Sidebar */}
      <div className="space-y-8">
        <div className="bg-surface-sunken rounded p-6 border border-border">
          <h3 className="flex items-center gap-2 font-bold text-txt-primary mb-4">
            <Award size={18} className="text-txt-secondary" /> Preferred Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {jd.preferred.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-surface-card border border-border rounded text-xs font-medium text-txt-secondary shadow-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-surface-sunken rounded p-6 border border-border-subtle">
          <h3 className="flex items-center gap-2 font-bold text-txt-primary mb-4">
            <Star size={18} className="text-txt-secondary" /> Benefits
          </h3>
          <ul className="space-y-3">
            {jd.benefits.map((benefit, i) => (
              <li key={i} className="text-sm text-txt-secondary font-medium flex items-center gap-2">
                <span className="w-1 h-1 bg-border rounded-full" /> {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
));
JdView.displayName = 'JdView';
