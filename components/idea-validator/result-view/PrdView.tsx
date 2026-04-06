'use client';

import React, { memo } from 'react';
import { FileText, Target, Users, BarChart, Check, Zap, Server } from 'lucide-react';
import { PrdStructure } from '../types';

interface PrdViewProps {
  prd: PrdStructure;
}

export const PrdView = memo(({ prd }: PrdViewProps) => (
  <div className="bg-surface-card shadow-lg rounded border border-border overflow-hidden mx-auto max-w-5xl">
    {/* Header */}
    <div className="bg-surface-sunken border-b border-border px-8 py-8 md:px-12 md:py-10">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-txt-primary font-bold text-xs uppercase tracking-widest">
            <FileText size={14} /> Product Requirements Document
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-txt-primary tracking-tight mb-2">{prd.projectName}</h1>
          <p className="text-lg text-txt-tertiary font-medium">{prd.tagline}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="px-3 py-1 bg-surface-sunken text-txt-primary text-xs font-bold rounded-full">Ver {prd.version}</span>
          <span className="text-xs text-txt-tertiary font-mono">Last Updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>

    <div className="p-8 md:p-12 space-y-12">
      {/* Overview */}
      <section>
        <h2 className="text-xl font-bold text-txt-primary mb-4 flex items-center gap-2">
          <Target size={20} className="text-txt-tertiary" /> Executive Overview
        </h2>
        <p className="text-txt-secondary leading-relaxed text-lg border-l-4 border-border pl-4 bg-surface-sunken py-4 pr-4 rounded-r-sm">
          {prd.overview}
        </p>
      </section>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Target Audience */}
        <section>
          <h2 className="text-xl font-bold text-txt-primary mb-4 flex items-center gap-2">
            <Users size={20} className="text-txt-tertiary" /> Target Audience
          </h2>
          <div className="space-y-3">
            {prd.targetAudience.map((target, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface-sunken rounded border border-border-subtle">
                <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-txt-secondary font-bold text-xs shrink-0">
                  {i + 1}
                </div>
                <span className="text-txt-secondary font-medium text-sm">{target}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Success Metrics */}
        <section>
          <h2 className="text-xl font-bold text-txt-primary mb-4 flex items-center gap-2">
            <BarChart size={20} className="text-txt-tertiary" /> Success Metrics
          </h2>
          <div className="space-y-3">
            {prd.successMetrics.map((metric, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface-sunken rounded border border-border-subtle">
                <Check size={16} className="text-status-success-text shrink-0" />
                <span className="text-txt-secondary font-medium text-sm">{metric}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Features Grid */}
      <section>
        <h2 className="text-xl font-bold text-txt-primary mb-6 flex items-center gap-2">
          <Zap size={20} className="text-txt-tertiary" /> Core Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prd.coreFeatures.map((feature, i) => (
            <div key={i} className="bg-surface-card border border-border p-5 rounded hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-txt-primary">{feature.name}</h3>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    feature.priority === 'High' ? 'bg-status-danger-bg text-status-danger-text' :
                    feature.priority === 'Medium' ? 'bg-status-warning-bg text-status-warning-text' :
                    'bg-status-success-bg text-status-success-text'
                  }`}>
                    {feature.priority}
                  </span>
                </div>
              </div>
              <p className="text-sm text-txt-secondary leading-relaxed mb-4">{feature.description}</p>
              <div className="flex items-center gap-2 pt-4 border-t border-border-subtle">
                <span className="text-xs text-txt-tertiary font-mono">Dev Effort:</span>
                <div className="flex gap-1">
                  {[1,2,3].map(bar => (
                    <div key={bar} className={`w-2 h-2 rounded-full ${
                      (feature.effort === 'High' && bar <= 3) ||
                      (feature.effort === 'Medium' && bar <= 2) ||
                      (feature.effort === 'Low' && bar <= 1)
                      ? 'bg-surface-inverse' : 'bg-border'
                    }`} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section>
        <h2 className="text-xl font-bold text-txt-primary mb-4 flex items-center gap-2">
          <Server size={20} className="text-txt-tertiary" /> Recommended Stack
        </h2>
        <div className="flex flex-wrap gap-2">
          {prd.techStack.map((tech, i) => (
            <span key={i} className="px-3 py-1.5 bg-surface-sunken border border-border-subtle text-txt-secondary text-sm font-semibold rounded">
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Footer Note */}
      <div className="text-center text-xs text-txt-tertiary pt-8 border-t border-border-subtle">
        Generated by Draft. AI Validator
      </div>
    </div>
  </div>
));
PrdView.displayName = 'PrdView';
