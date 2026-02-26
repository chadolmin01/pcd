#!/usr/bin/env node
const testPayload = {
  idea: 'AI 기반 맞춤형 운동 코칭 앱',
  conversationHistory: [],
  level: 'mvp',
  personas: ['Developer', 'Designer', 'VC'],
  currentScorecard: {
    problemDefinition: { current: 5, max: 15, filled: false },
    solution: { current: 3, max: 15, filled: false },
    marketAnalysis: { current: 2, max: 15, filled: false },
    revenueModel: { current: 3, max: 15, filled: false },
    differentiation: { current: 2, max: 15, filled: false },
    logicalConsistency: { current: 2, max: 10, filled: false },
    feasibility: { current: 2, max: 10, filled: false },
    feedbackReflection: { current: 1, max: 5, filled: false },
    totalScore: 20,
  },
  turnNumber: 1,
  interactionMode: 'discussion',
};

async function test() {
  console.log('API 테스트 중...\n');

  const response = await fetch('http://localhost:3000/api/idea-validator/analyze-parallel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalData = null;
  let discussionTurns = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const event = JSON.parse(line.substring(6));
          if (event.type === 'final') {
            finalData = event.data;
          } else if (event.type === 'discussion') {
            discussionTurns.push(event.data);
          }
        } catch {}
      }
    }
  }

  // Discussion 출력
  console.log('Discussion 턴 수:', discussionTurns.length);
  discussionTurns.forEach((d, i) => {
    console.log(`  ${i+1}. persona: "${d.persona}", replyTo: "${d.replyTo}", tone: "${d.tone}"`);
    console.log(`     message: ${d.message?.substring(0, 50)}...`);
  });
  console.log('');

  if (finalData) {
    console.log('=== FINAL RESPONSE 구조 ===\n');
    console.log('responses 개수:', finalData.responses?.length || 0);
    console.log('responses:');
    finalData.responses?.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.name || r.role}: perspectives ${r.perspectives?.length || 0}개`);
      if (r.perspectives) {
        r.perspectives.forEach((p, j) => {
          console.log(`     - [${p.perspectiveId || p.perspectiveLabel || 'no-id'}]: ${p.content?.substring(0, 40)}...`);
        });
      }
      console.log(`     전체 content: ${r.content?.substring(0, 60)}...`);
    });
    console.log('\nmetrics:', finalData.metrics?.summary?.substring(0, 100));
    console.log('categoryUpdates:', finalData.categoryUpdates?.length || 0, '개');
  }
}

test().catch(console.error);
