'use client';

import BusinessPlanEditor from '@/components/idea-validator/workflow/BusinessPlanEditor';

export default function TestBusinessPlanPage() {
  return (
    <div className="h-screen">
      <BusinessPlanEditor
        templateType="yebi-chogi"
        ideaTitle="AI 기반 독거노인 돌봄 서비스"
        onSave={(data) => {
          console.log('저장:', data);
          alert('저장 완료! 콘솔에서 확인하세요.');
        }}
        onBack={() => {
          window.location.href = '/';
        }}
      />
    </div>
  );
}
