'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, User, Building2, Mail, ShieldCheck, Shield, Loader2, AlertCircle } from 'lucide-react';

interface OnboardingData {
  id: string; // UUID - 포트폴리오 저장용
  name: string;
  organization: string;
  email: string;
  privacyConsent: boolean;
}

interface OnboardingScreenProps {
  onComplete: (data: OnboardingData) => void;
}

const SESSION_KEY = 'prd_demo_session';

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'auto-login'>('loading');
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState<Omit<OnboardingData, 'id'>>({
    name: '',
    organization: '',
    email: '',
    privacyConsent: false
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Omit<OnboardingData, 'id'>, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (!savedSession) return;

      try {
        const sessionData = JSON.parse(savedSession);
        if (!sessionData.email || !sessionData.name) {
          localStorage.removeItem(SESSION_KEY);
          return;
        }

        setPhase('auto-login');

        // id가 없으면 이메일로 사용자 조회
        if (!sessionData.id) {
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: sessionData.name,
              organization: sessionData.organization || '',
              email: sessionData.email,
              privacyConsent: true
            })
          });
          const result = await response.json();

          if (result.success && result.user?.id) {
            sessionData.id = result.user.id;
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
          }
        }

        // Auto-login
        setTimeout(() => {
          onComplete(sessionData as OnboardingData);
        }, 800);
      } catch {
        localStorage.removeItem(SESSION_KEY);
        setPhase('ready');
      }
    };

    restoreSession();
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

      // API 응답에서 user.id 가져오기
      const userId = result.user?.id;
      if (!userId) {
        setErrors({ email: '사용자 ID를 받지 못했습니다.' });
        setIsSubmitting(false);
        return;
      }

      // id를 포함한 완전한 데이터
      const completeData: OnboardingData = {
        id: userId,
        ...formData
      };

      // Save session to localStorage (id 포함)
      localStorage.setItem(SESSION_KEY, JSON.stringify(completeData));
      onComplete(completeData);
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
      <div className="fixed inset-0 z-50 bg-surface-sunken flex flex-col items-center justify-center font-mono">
        <div className="w-12 h-12 bg-surface-inverse text-txt-inverse flex items-center justify-center font-black text-2xl rounded mb-6 animate-pulse">D</div>
        <div className="text-sm font-medium text-txt-primary mb-2">다시 오신 것을 환영합니다!</div>
        <div className="text-[10px] text-txt-tertiary font-medium tracking-widest uppercase flex items-center gap-2">
           <Loader2 size={12} className="animate-spin" />
           자동 로그인 중...
        </div>
      </div>
    );
  }

  // Loading Phase (Circular System Boot)
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-surface-sunken flex flex-col items-center justify-center font-mono">
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
        <div className="text-[10px] text-txt-tertiary font-medium tracking-widest animate-pulse uppercase">
           Booting Draft Validator...
        </div>
      </div>
    );
  }

  // Clean Centered Layout
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center h-screen w-screen overflow-hidden bg-surface-sunken">

      {/* Centered Form Card */}
      <div className="w-full max-w-md mx-4 bg-surface-card rounded-xl shadow-xl border border-border-subtle overflow-hidden">

         {/* Top Branding */}
         <div className="p-4 pb-0">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-surface-inverse text-txt-inverse flex items-center justify-center font-black text-lg rounded">D</div>
                  <span className="font-bold text-xl tracking-tight">Draft.</span>
               </div>
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-sunken border border-border-subtle rounded-full">
                  <span className="w-2 h-2 rounded-full bg-status-success-text animate-pulse"></span>
                  <span className="text-[10px] font-mono font-bold text-txt-tertiary uppercase">Ready</span>
               </div>
            </div>
         </div>

         {/* Form Content */}
         <div className="px-6 pb-6">
            <h1 className="text-2xl font-bold text-txt-primary mb-1 tracking-tight">
               시작하기
            </h1>
            <p className="text-txt-tertiary text-sm mb-6">
               간단한 정보를 입력하고 아이디어 검증을 시작하세요.
            </p>

            {Object.values(errors).some(Boolean) && (
               <div className="mb-4 p-3 bg-status-danger-bg border border-border rounded-lg flex items-center gap-2 text-status-danger-text text-sm">
                  <AlertCircle size={16} />
                  입력 정보를 확인해주세요.
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
               {/* Name */}
               <div className="space-y-1.5">
                  <label className="text-xs font-medium text-txt-secondary flex items-center gap-1.5">
                     <User size={12} /> 이름 <span className="text-status-danger-text">*</span>
                  </label>
                  <input
                     type="text"
                     value={formData.name}
                     onChange={(e) => {
                       setFormData(prev => ({ ...prev, name: e.target.value }));
                       if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                     }}
                     className={`w-full px-4 py-2.5 bg-surface-sunken border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black focus:bg-surface-card transition-all placeholder:text-txt-tertiary ${errors.name ? 'border-status-danger-text' : 'border-border'}`}
                     placeholder="홍길동"
                  />
                  {errors.name && <p className="text-xs text-status-danger-text">{errors.name}</p>}
               </div>

               {/* Organization */}
               <div className="space-y-1.5">
                  <label className="text-xs font-medium text-txt-secondary flex items-center gap-1.5">
                     <Building2 size={12} /> 소속 <span className="text-status-danger-text">*</span>
                  </label>
                  <input
                     type="text"
                     value={formData.organization}
                     onChange={(e) => {
                       setFormData(prev => ({ ...prev, organization: e.target.value }));
                       if (errors.organization) setErrors(prev => ({ ...prev, organization: undefined }));
                     }}
                     className={`w-full px-4 py-2.5 bg-surface-sunken border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black focus:bg-surface-card transition-all placeholder:text-txt-tertiary ${errors.organization ? 'border-status-danger-text' : 'border-border'}`}
                     placeholder="회사명 또는 학교명"
                  />
                  {errors.organization && <p className="text-xs text-status-danger-text">{errors.organization}</p>}
               </div>

               {/* Email */}
               <div className="space-y-1.5">
                  <label className="text-xs font-medium text-txt-secondary flex items-center gap-1.5">
                     <Mail size={12} /> 이메일 <span className="text-status-danger-text">*</span>
                  </label>
                  <input
                     type="email"
                     value={formData.email}
                     onChange={(e) => {
                       setFormData(prev => ({ ...prev, email: e.target.value }));
                       if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                     }}
                     className={`w-full px-4 py-2.5 bg-surface-sunken border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black focus:bg-surface-card transition-all placeholder:text-txt-tertiary ${errors.email ? 'border-status-danger-text' : 'border-border'}`}
                     placeholder="name@company.com"
                  />
                  {errors.email && <p className="text-xs text-status-danger-text">{errors.email}</p>}
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
                             ? 'bg-surface-inverse border-surface-inverse'
                             : `bg-surface-card group-hover:border-txt-tertiary ${errors.privacyConsent ? 'border-status-danger-text' : 'border-border-strong'}`
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
                        <div className="flex items-center gap-1.5 text-sm text-txt-secondary">
                           <ShieldCheck size={14} className="text-txt-tertiary" />
                           <span className="font-medium">개인정보 수집 동의</span>
                           <span className="text-status-danger-text">*</span>
                        </div>
                        <p className="text-[11px] text-txt-tertiary mt-0.5">
                           서비스 제공을 위해 이름, 소속, 이메일을 수집합니다.
                        </p>
                     </div>
                  </label>
                  {errors.privacyConsent && <p className="mt-2 text-xs text-status-danger-text">{errors.privacyConsent}</p>}
               </div>

               {/* Submit Button */}
               <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="w-full bg-surface-inverse text-txt-inverse py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-4"
               >
                  {isSubmitting ? (
                     <Loader2 size={16} className="animate-spin" />
                  ) : (
                     <>
                        시작하기
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                     </>
                  )}
               </button>
            </form>
         </div>

         {/* Bottom Footer */}
         <div className="px-6 py-4 bg-surface-sunken border-t border-border-subtle text-[10px] text-txt-tertiary font-mono flex justify-between">
            <span>© 2026 DRAFT INC.</span>
            <span className="flex items-center gap-1"><Shield size={10}/> SECURE</span>
         </div>
      </div>

    </div>
  );
};

export default OnboardingScreen;
