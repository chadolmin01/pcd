'use client';

import React, { memo } from 'react';
import { FileText, Target, Users, BarChart, Check, Zap, Server } from 'lucide-react';
import { PrdStructure } from '../types';

interface PrdViewProps {
  prd: PrdStructure;
}

export const PrdView = memo(({ prd }: PrdViewProps) => (
  <div className="bg-white shadow-lg rounded border border-gray-200 overflow-hidden mx-auto max-w-5xl">
    {/* Header */}
    <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 px-8 py-8 md:px-12 md:py-10">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
            <FileText size={14} /> Product Requirements Document
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">{prd.projectName}</h1>
          <p className="text-lg text-gray-500 font-medium">{prd.tagline}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">Ver {prd.version}</span>
          <span className="text-xs text-gray-400 font-mono">Last Updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>

    <div className="p-8 md:p-12 space-y-12">
      {/* Overview */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target size={20} className="text-gray-400" /> Executive Overview
        </h2>
        <p className="text-gray-600 leading-relaxed text-lg border-l-4 border-gray-200 pl-4 bg-gray-50 py-4 pr-4 rounded-r-sm">
          {prd.overview}
        </p>
      </section>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Target Audience */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={20} className="text-pink-500" /> Target Audience
          </h2>
          <div className="space-y-3">
            {prd.targetAudience.map((target, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-pink-50/50 rounded border border-pink-100">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs shrink-0">
                  {i + 1}
                </div>
                <span className="text-gray-700 font-medium text-sm">{target}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Success Metrics */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart size={20} className="text-emerald-500" /> Success Metrics
          </h2>
          <div className="space-y-3">
            {prd.successMetrics.map((metric, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded border border-emerald-100">
                <Check size={16} className="text-emerald-600 shrink-0" />
                <span className="text-gray-700 font-medium text-sm">{metric}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Features Grid */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Zap size={20} className="text-yellow-500" /> Core Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prd.coreFeatures.map((feature, i) => (
            <div key={i} className="bg-white border border-gray-200 p-5 rounded hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900">{feature.name}</h3>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    feature.priority === 'High' ? 'bg-red-100 text-red-700' :
                    feature.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {feature.priority}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{feature.description}</p>
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400 font-mono">Dev Effort:</span>
                <div className="flex gap-1">
                  {[1,2,3].map(bar => (
                    <div key={bar} className={`w-2 h-2 rounded-full ${
                      (feature.effort === 'High' && bar <= 3) ||
                      (feature.effort === 'Medium' && bar <= 2) ||
                      (feature.effort === 'Low' && bar <= 1)
                      ? 'bg-blue-500' : 'bg-gray-200'
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
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Server size={20} className="text-indigo-500" /> Recommended Stack
        </h2>
        <div className="flex flex-wrap gap-2">
          {prd.techStack.map((tech, i) => (
            <span key={i} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold rounded">
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Footer Note */}
      <div className="text-center text-xs text-gray-400 pt-8 border-t border-gray-100">
        Generated by Draft. AI Validator
      </div>
    </div>
  </div>
));
PrdView.displayName = 'PrdView';
