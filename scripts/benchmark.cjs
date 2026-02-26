#!/usr/bin/env node
/**
 * analyze-parallel API 벤치마크 스크립트
 * SSE 스트림 완료까지의 실제 응답 시간 측정
 */

const API_URL = 'http://localhost:3000/api/idea-validator/analyze-parallel';

// 테스트 요청 페이로드 (실제 스키마에 맞게 구성)
const testPayload = {
  idea: '반려동물 건강 모니터링 IoT 기기 - 실시간 활동량, 심박수, 수면 패턴을 추적하고 이상 징후 발생 시 알림',
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

// SSE 스트림 완료까지 대기하며 이벤트 파싱
async function measureStreamRequest() {
  const start = Date.now();
  const events = [];
  let firstByteTime = null;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (firstByteTime === null) {
      firstByteTime = Date.now() - start;
    }

    buffer += decoder.decode(value, { stream: true });

    // SSE 이벤트 파싱
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const event = JSON.parse(line.substring(6));
          events.push({ type: event.type, time: Date.now() - start });
        } catch {
          // 파싱 실패 무시
        }
      }
    }
  }

  const totalTime = Date.now() - start;

  return {
    totalTime,
    firstByteTime,
    eventCount: events.length,
    events,
  };
}

// 병렬 요청 테스트
async function measureParallelRequests(concurrency) {
  const start = Date.now();
  const results = await Promise.all(
    Array(concurrency).fill(null).map(() => measureStreamRequest())
  );
  const parallelTime = Date.now() - start;

  return {
    parallelTime,
    results,
    avgTime: results.reduce((a, b) => a + b.totalTime, 0) / results.length,
  };
}

async function runBenchmark() {
  console.log('=== analyze-parallel API 벤치마크 ===\n');
  console.log(`URL: ${API_URL}`);
  console.log(`페이로드 크기: ${JSON.stringify(testPayload).length} bytes\n`);

  // 1. 순차 요청 테스트 (3회)
  console.log('1. 순차 요청 테스트 (3회)...\n');

  const sequentialResults = [];
  for (let i = 0; i < 3; i++) {
    try {
      const result = await measureStreamRequest();
      sequentialResults.push(result);
      console.log(`  테스트 ${i + 1}:`);
      console.log(`    총 시간: ${result.totalTime}ms`);
      console.log(`    첫 바이트: ${result.firstByteTime}ms`);
      console.log(`    이벤트 수: ${result.eventCount}`);

      // 이벤트 타임라인 요약
      const eventTypes = {};
      result.events.forEach(e => {
        eventTypes[e.type] = eventTypes[e.type] || [];
        eventTypes[e.type].push(e.time);
      });
      console.log('    이벤트 타임라인:');
      Object.entries(eventTypes).forEach(([type, times]) => {
        console.log(`      ${type}: ${times[0]}ms ~ ${times[times.length - 1]}ms (${times.length}개)`);
      });
      console.log('');
    } catch (error) {
      console.error(`  테스트 ${i + 1} 실패:`, error.message);
    }
  }

  if (sequentialResults.length > 0) {
    const times = sequentialResults.map(r => r.totalTime);
    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p50 = times[Math.floor(times.length * 0.5)];
    const min = times[0];
    const max = times[times.length - 1];

    console.log('=== 순차 요청 결과 ===');
    console.log(`  평균: ${avg.toFixed(0)}ms`);
    console.log(`  p50: ${p50}ms`);
    console.log(`  최소: ${min}ms`);
    console.log(`  최대: ${max}ms\n`);
  }

  // 2. 병렬 요청 테스트 (2 concurrent)
  console.log('2. 병렬 요청 테스트 (2 concurrent)...\n');

  try {
    const parallelResult = await measureParallelRequests(2);
    console.log(`  총 병렬 시간: ${parallelResult.parallelTime}ms`);
    console.log(`  개별 평균: ${parallelResult.avgTime.toFixed(0)}ms`);
    parallelResult.results.forEach((r, i) => {
      console.log(`  요청 ${i + 1}: ${r.totalTime}ms (${r.eventCount} events)`);
    });
    console.log('');
  } catch (error) {
    console.error('  병렬 테스트 실패:', error.message);
  }

  // 3. 병렬 요청 테스트 (3 concurrent)
  console.log('3. 병렬 요청 테스트 (3 concurrent)...\n');

  try {
    const parallelResult = await measureParallelRequests(3);
    console.log(`  총 병렬 시간: ${parallelResult.parallelTime}ms`);
    console.log(`  개별 평균: ${parallelResult.avgTime.toFixed(0)}ms`);
    parallelResult.results.forEach((r, i) => {
      console.log(`  요청 ${i + 1}: ${r.totalTime}ms (${r.eventCount} events)`);
    });
  } catch (error) {
    console.error('  병렬 테스트 실패:', error.message);
  }

  console.log('\n=== 벤치마크 완료 ===');
}

runBenchmark().catch(console.error);
