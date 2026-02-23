'use client';

import React, { useState, useEffect, memo } from 'react';
import { ArrowRight, User, Building2, Mail, ShieldCheck, Shield, Lightbulb, Target, Loader2, AlertCircle } from 'lucide-react';

interface OnboardingData {
  name: string;
  organization: string;
  email: string;
  privacyConsent: boolean;
}

interface OnboardingScreenProps {
  onComplete: (data: OnboardingData) => void;
}

const SESSION_KEY = 'prd_demo_session';

// Showcase items for marquee
const showcaseItems = [
  { type: 'idea', title: 'AI 헬스케어', desc: '개인 맞춤형 건강 관리', tag: 'Validated', color: 'bg-black text-white' },
  { type: 'prd', title: 'EduTech MVP', desc: '성인 직무 교육 플랫폼', tag: 'PRD Ready', color: 'bg-white border-gray-200 text-gray-900' },
  { type: 'idea', title: 'Green Delivery', desc: '친환경 배송 솔루션', tag: 'In Review', color: 'bg-emerald-600 text-white' },
  { type: 'prd', title: 'FinTech App', desc: '간편 송금 서비스', tag: 'PRD Ready', color: 'bg-white border-gray-200 text-gray-900' },
  { type: 'idea', title: 'Pet Care AI', desc: '반려동물 AI 케어', tag: 'Validated', color: 'bg-gray-900 text-white' },
  { type: 'prd', title: 'Remote Work', desc: '원격 협업 도구', tag: 'Building', color: 'bg-white border-gray-200 text-gray-900' },
  { type: 'idea', title: 'Smart Farm', desc: '스마트 농업 솔루션', tag: 'Analyzing', color: 'bg-blue-600 text-white' },
];

const showcaseColumn1 = [...showcaseItems, ...showcaseItems, ...showcaseItems];
const showcaseColumn2 = [...[...showcaseItems].reverse(), ...showcaseItems, ...showcaseItems];

// Showcase Card Component
const ShowcaseCard = memo(({ item }: { item: typeof showcaseItems[0] }) => (
  <div className={`
    w-[260px] p-5 rounded shadow-sm border border-gray-200/50 flex flex-col justify-between transition-transform hover:scale-[1.02]
    ${item.color}
  `}>
    <div className="flex justify-between items-start mb-4">
       <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${item.color.includes('bg-black') || item.color.includes('bg-gray-900') || item.color.includes('bg-emerald') || item.color.includes('bg-blue') ? 'border-white/20 bg-white/10' : 'border-gray-100 bg-gray-50 text-black'}`}>
          {item.type === 'idea' ? <Lightbulb size={14}/> : <Target size={14}/>}
       </div>
       <span className={`text-[9px] font-mono font-bold uppercase border px-1.5 py-0.5 rounded ${item.color.includes('bg-black') || item.color.includes('bg-gray-900') || item.color.includes('bg-emerald') || item.color.includes('bg-blue') ? 'border-white/30' : 'border-gray-200'}`}>
         {item.tag}
       </span>
    </div>
    <div>
       <h4 className="font-bold text-base mb-1">{item.title}</h4>
       <p className={`text-xs ${item.color.includes('bg-black') || item.color.includes('bg-gray-900') || item.color.includes('bg-emerald') || item.color.includes('bg-blue') ? 'text-white/70' : 'text-gray-500'}`}>{item.desc}</p>
    </div>
  </div>
));
ShowcaseCard.displayName = 'ShowcaseCard';

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'auto-login'>('loading');
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    organization: '',
    email: '',
    privacyConsent: false
  });

  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession) as OnboardingData;
        if (sessionData.email && sessionData.name) {
          setPhase('auto-login');
          // Auto-login after brief delay
          setTimeout(() => {
            onComplete(sessionData);
          }, 800);
          return;
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, [onComplete]);

  // Boot animation
  useEffect(() => {
    if (phase !== 'loading') return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setPhase('ready'), 300);
          return 100;
        }
        return Math.min(prev + Math.floor(Math.random() * 20) + 10, 100);
      });
    }, 60);

    return () => clearInterval(timer);
  }, [phase]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newErrors: Partial<Record<keyof OnboardingData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    if (!formData.organization.trim()) {
      newErrors.organization = '소속을 입력해주세요.';
    }
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }
    if (!formData.privacyConsent) {
      newErrors.privacyConsent = '개인정보 수집에 동의해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    // Save to database
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          organization: formData.organization,
          email: formData.email,
          privacyConsent: formData.privacyConsent
        })
      });

      const result = await response.json();

      if (!result.success) {
        setErrors({ email: result.error || '등록에 실패했습니다.' });
        setIsSubmitting(false);
        return;
      }

      // Save session to localStorage
      localStorage.setItem(SESSION_KEY, JSON.stringify(formData));
      onComplete(formData);
    } catch (error) {
      console.error('Onboarding error:', error);
      setErrors({ email: '서버 연결에 실패했습니다.' });
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.organization.trim() && validateEmail(formData.email) && formData.privacyConsent;

  // Auto-login Phase
  if (phase === 'auto-login') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#FAFAFA] flex flex-col items-center justify-center font-mono">
        <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-2xl rounded mb-6 animate-pulse">D</div>
        <div className="text-sm font-medium text-gray-900 mb-2">다시 오신 것을 환영합니다!</div>
        <div className="text-[10px] text-gray-400 font-medium tracking-widest uppercase flex items-center gap-2">
           <Loader2 size={12} className="animate-spin" />
           자동 로그인 중...
        </div>
      </div>
    );
  }

  // Loading Phase (Circular System Boot)
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#FAFAFA] flex flex-col items-center justify-center font-mono">
        <div className="relative w-24 h-24 flex items-center justify-center mb-8">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
             <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="2" />
             <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="#000"
                strokeWidth="2"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress) / 100}
                className="transition-all duration-200 ease-out"
                strokeLinecap="round"
             />
          </svg>
          <div className="text-xl font-bold tracking-tighter">{progress}%</div>
        </div>
        <div className="text-[10px] text-gray-400 font-medium tracking-widest animate-pulse uppercase">
           Booting Draft Validator...
        </div>
      </div>
    );
  }

  // Main Split Screen Layout
  return (
    <div className="fixed inset-0 z-[100] flex h-screen w-screen overflow-hidden bg-white">

      {/* LEFT: Form Panel */}
      <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-between bg-white z-20 shadow-2xl shrink-0 h-full relative border-r border-gray-100">

         {/* Top Branding */}
         <div className="p-8 md:p-10 animate-slide-up-fade">
            <div className="flex items-center gap-2 mb-6">
               <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-black text-lg rounded">D</div>
               <span className="font-bold text-xl tracking-tight">Draft.</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Validator Ready</span>
            </div>
         </div>

         {/* Center Form */}
         <div className="px-8 md:px-10 flex flex-col justify-center animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
               시작하기 전에
            </h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
               더 나은 검증 경험을 위해 간단한 정보를 입력해주세요.
            </p>

            {Object.values(errors).some(Boolean) && (
               <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  입력 정보를 확인해주세요.
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
               {/* Name */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                     <User size={12} /> 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                     type="text"
                     value={formData.name}
                     onChange={(e) => {
                       setFormData(prev => ({ ...prev, name: e.target.value }));
                       if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                     }}
                     className={`w-full px-4 py-3 bg-gray-50 border rounded text-sm font-medium focus:outline-none focus:border-black focus:bg-white transition-all placeholder:text-gray-300 ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
                     placeholder="홍길동"
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
               </div>

               {/* Organization */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                     <Building2 size={12} /> 소속 <span className="text-red-500">*</span>
                  </label>
                  <input
                     type="text"
                     value={formData.organization}
                     onChange={(e) => {
                       setFormData(prev => ({ ...prev, organization: e.target.value }));
                       if (errors.organization) setErrors(prev => ({ ...prev, organization: undefined }));
                     }}
                     className={`w-full px-4 py-3 bg-gray-50 border rounded text-sm font-medium focus:outline-none focus:border-black focus:bg-white transition-all placeholder:text-gray-300 ${errors.organization ? 'border-red-300' : 'border-gray-200'}`}
                     placeholder="회사명 또는 학교명"
                  />
                  {errors.organization && <p className="text-xs text-red-500">{errors.organization}</p>}
               </div>

               {/* Email */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                     <Mail size={12} /> 이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                     type="email"
                     value={formData.email}
                     onChange={(e) => {
                       setFormData(prev => ({ ...prev, email: e.target.value }));
                       if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                     }}
                     className={`w-full px-4 py-3 bg-gray-50 border rounded text-sm font-medium focus:outline-none focus:border-black focus:bg-white transition-all placeholder:text-gray-300 font-mono ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
                     placeholder="name@company.com"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
               </div>

               {/* Privacy Consent */}
               <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                     <div className="relative mt-0.5">
                        <input
                           type="checkbox"
                           checked={formData.privacyConsent}
                           onChange={(e) => {
                             setFormData(prev => ({ ...prev, privacyConsent: e.target.checked }));
                             if (errors.privacyConsent) setErrors(prev => ({ ...prev, privacyConsent: undefined }));
                           }}
                           className="sr-only peer"
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center
                           ${formData.privacyConsent
                             ? 'bg-black border-black'
                             : `bg-white group-hover:border-gray-400 ${errors.privacyConsent ? 'border-red-300' : 'border-gray-300'}`
                           }`}
                        >
                           {formData.privacyConsent && (
                             <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                             </svg>
                           )}
                        </div>
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                           <ShieldCheck size={14} className="text-gray-400" />
                           <span className="font-medium">개인정보 수집 및 이용 동의</span>
                           <span className="text-red-500">*</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                           서비스 제공을 위해 이름, 소속, 이메일을 수집합니다.
                        </p>
                     </div>
                  </label>
                  {errors.privacyConsent && <p className="mt-2 text-xs text-red-500">{errors.privacyConsent}</p>}
               </div>

               {/* Submit Button */}
               <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="w-full bg-black text-white py-3.5 rounded text-sm font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
               >
                  {isSubmitting ? (
                     <Loader2 size={16} className="animate-spin" />
                  ) : (
                     <>
                        <span className="font-mono uppercase tracking-wide">시작하기</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                     </>
                  )}
               </button>
            </form>
         </div>

         {/* Bottom Footer */}
         <div className="p-8 md:p-10 text-[10px] text-gray-400 font-mono flex justify-between animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
            <span>© 2026 DRAFT INC.</span>
            <span className="flex items-center gap-1"><Shield size={10}/> SECURE CONNECTION</span>
         </div>
      </div>

      {/* RIGHT: Infinite Vertical Marquee */}
      <div className="hidden lg:flex flex-1 bg-[#FAFAFA] relative overflow-hidden flex-col justify-center items-center">

         {/* Fade Overlay (Top/Bottom) */}
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#FAFAFA] to-transparent z-10 pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#FAFAFA] to-transparent z-10 pointer-events-none"></div>

         {/* Marquee Columns Container */}
         <div className="flex gap-5 h-[120vh] -rotate-6 scale-110 opacity-90">

            {/* Column 1: Moving Up */}
            <div className="flex flex-col gap-5 animate-marquee-vertical-up">
               {showcaseColumn1.map((item, idx) => (
                  <ShowcaseCard key={`col1-${idx}`} item={item} />
               ))}
            </div>

            {/* Column 2: Moving Down */}
            <div className="flex flex-col gap-5 animate-marquee-vertical-down mt-20">
               {showcaseColumn2.map((item, idx) => (
                  <ShowcaseCard key={`col2-${idx}`} item={item} />
               ))}
            </div>
         </div>

         {/* Slogan Overlay */}
         <div className="absolute bottom-12 right-12 text-right z-10 max-w-md">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-3">
               Validate your idea,<br/>
               <span className="text-gray-400">Build with confidence.</span>
            </h2>
            <div className="flex justify-end gap-2">
               <div className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold font-mono shadow-sm">AI VALIDATION</div>
               <div className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold font-mono shadow-sm">PRD GENERATOR</div>
            </div>
         </div>
      </div>

    </div>
  );
};

export default OnboardingScreen;
