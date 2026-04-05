'use client';

import IdeaRefineWithSync from '@/components/idea-validator/workflow/IdeaRefineWithSync';
import { ValidationLevel } from '@/components/idea-validator/types';

export default function TestIdeaRefinePage() {
  return (
    <div className="h-screen">
      <IdeaRefineWithSync
        programId="pre-startup"
        level={ValidationLevel.MVP}
        personas={['Developer', 'Designer', 'VC']}
        interactionMode="discussion"
        onComplete={(history, idea, advice) => {
          console.log('Complete:', { history, idea, advice });
          alert('완료! 콘솔에서 결과를 확인하세요.');
        }}
        onBack={() => {
          window.location.href = '/';
        }}
      />
    </div>
  );
}
