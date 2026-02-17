export type PersonaRole = 'Developer' | 'Designer' | 'VC' | 'Marketer' | 'Legal' | 'PM' | 'CTO' | 'CFO' | 'EndUser' | 'Operations' | 'System';

// 페르소나 프리셋 정의
export interface PersonaPreset {
  id: PersonaRole;
  name: string;
  nameKo: string;
  description: string;
  icon: string; // lucide icon name
  color: string; // tailwind color classes
}

export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    id: 'Developer',
    name: 'Developer',
    nameKo: '개발자',
    description: '기술적 실현 가능성, 아키텍처, 개발 비용을 검토합니다.',
    icon: 'Cpu',
    color: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  {
    id: 'Designer',
    name: 'Designer',
    nameKo: '디자이너',
    description: 'UX/UI, 사용자 경험, 브랜드 일관성을 검토합니다.',
    icon: 'Paintbrush',
    color: 'bg-pink-50 text-pink-600 border-pink-200',
  },
  {
    id: 'VC',
    name: 'VC',
    nameKo: '투자자',
    description: '시장성, 수익 모델, 성장 잠재력을 검토합니다.',
    icon: 'DollarSign',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  {
    id: 'Marketer',
    name: 'Marketer',
    nameKo: '마케터',
    description: 'GTM 전략, 고객 획득, 브랜딩을 검토합니다.',
    icon: 'Megaphone',
    color: 'bg-orange-50 text-orange-600 border-orange-200',
  },
  {
    id: 'Legal',
    name: 'Legal',
    nameKo: '법률 전문가',
    description: '규제, 컴플라이언스, 법적 리스크를 검토합니다.',
    icon: 'Scale',
    color: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  {
    id: 'PM',
    name: 'PM',
    nameKo: '프로덕트 매니저',
    description: '제품 로드맵, 우선순위, 사용자 니즈를 검토합니다.',
    icon: 'ClipboardList',
    color: 'bg-violet-50 text-violet-600 border-violet-200',
  },
  {
    id: 'CTO',
    name: 'CTO',
    nameKo: 'CTO',
    description: '기술 전략, 확장성, 보안을 검토합니다.',
    icon: 'Server',
    color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  },
  {
    id: 'CFO',
    name: 'CFO',
    nameKo: 'CFO',
    description: '재무 모델, 번레이트, 수익성을 검토합니다.',
    icon: 'Calculator',
    color: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  {
    id: 'EndUser',
    name: 'End User',
    nameKo: '최종 사용자',
    description: '실제 사용자 관점에서 편의성과 가치를 검토합니다.',
    icon: 'User',
    color: 'bg-teal-50 text-teal-600 border-teal-200',
  },
  {
    id: 'Operations',
    name: 'Operations',
    nameKo: '운영 전문가',
    description: '운영 효율성, 프로세스, 확장 가능성을 검토합니다.',
    icon: 'Settings',
    color: 'bg-gray-50 text-gray-600 border-gray-200',
  },
];

// 기본 선택 페르소나
export const DEFAULT_PERSONAS: PersonaRole[] = ['Developer', 'Designer', 'VC'];

export interface PersonaResponse {
  role: PersonaRole;
  name: string;
  avatar: string;
  content: string;
  tone: 'Critical' | 'Skeptical' | 'Analytical' | 'Neutral' | 'Supportive'; // Added Supportive for Level 1
  suggestedActions?: string[]; // AI provided actionable options
  isReflected?: boolean; // Tracks if user accepted this advice
  reflectedText?: string; // The actual text the user decided to reflect (editable)
}

export interface AnalysisMetrics {
  score: number; // 0-100 overall
  developerScore: number;
  designerScore: number;
  vcScore: number;
  keyRisks: string[]; // List of accumulated risks
  keyStrengths: string[]; // List of validated strengths
  summary: string; // Brief status summary
}

export interface AnalysisResult {
  responses: PersonaResponse[];
  metrics: AnalysisMetrics;
}

export interface ChatMessage {
  id: string;
  isUser: boolean;
  text?: string;
  responses?: PersonaResponse[]; // AI responses come as a set of persona comments
  timestamp: number;
}

export interface PersonaScores {
  developer: number;
  designer: number;
  vc: number;
}

export interface ActionItems {
  developer: string[];
  designer: string[];
  vc: string[];
}

// New Structured Data Types for Rich UI
export interface PrdFeature {
  name: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  effort: 'Low' | 'Medium' | 'High';
}

export interface PrdStructure {
  projectName: string;
  version: string;
  tagline: string;
  overview: string;
  targetAudience: string[];
  coreFeatures: PrdFeature[];
  techStack: string[];
  successMetrics: string[];
  userFlow: string; // Keep as simple text or steps
}

export interface JdStructure {
  roleTitle: string;
  department: string; // e.g., Engineering, Design
  companyIntro: string;
  responsibilities: string[];
  qualifications: string[];
  preferred: string[];
  benefits: string[];
}

export interface Artifacts {
  prd: PrdStructure; // Changed from string to object
  jd: JdStructure;   // Changed from string to object
  score: number;
  ideaSummary: string; // Summary of the idea
  personaScores: PersonaScores; // Breakdown of scores
  actionPlan: ActionItems; // Concrete to-do list
}

export enum AppState {
  SELECTION = 'SELECTION',
  CHAT = 'CHAT',
  RESULT = 'RESULT',
}

export enum ValidationLevel {
  SKETCH = 'SKETCH',   // Level 1: Idea Sketch (Fast/Beginner)
  MVP = 'MVP',         // Level 2: MVP Building (Standard)
  DEFENSE = 'DEFENSE', // Level 3: Investor Defense (Pro/Hardcore)
}
