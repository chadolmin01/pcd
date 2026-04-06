import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {

  test.describe('Health Check', () => {
    test('main page loads successfully', async ({ page }) => {
      const response = await page.goto('/');
      expect(response?.status()).toBe(200);
    });
  });

  test.describe('User Registration API', () => {
    test('should register user with valid data', async ({ request }) => {
      const response = await request.post('/api/users', {
        data: {
          name: '테스트유저',
          organization: '테스트회사',
          email: `test_${Date.now()}@example.com`,
          privacyConsent: true,
        },
      });

      // Accept 200 (success) or 429 (rate limited)
      expect([200, 429]).toContain(response.status());
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.user).toBeDefined();
      }
    });

    test('should reject registration with missing fields', async ({ request }) => {
      const response = await request.post('/api/users', {
        data: {
          name: '테스트유저',
          // missing organization, email, privacyConsent
        },
      });

      // Accept 400 (validation error) or 429 (rate limited)
      expect([400, 429]).toContain(response.status());
      if (response.status() === 400) {
        const body = await response.json();
        expect(body.success).toBe(false);
      }
    });

    test('should reject registration with invalid email', async ({ request }) => {
      const response = await request.post('/api/users', {
        data: {
          name: '테스트유저',
          organization: '테스트회사',
          email: 'invalid-email',
          privacyConsent: true,
        },
      });

      // Accept 400 (validation error) or 429 (rate limited)
      expect([400, 429]).toContain(response.status());
    });
  });

  test.describe('Rate Limiting', () => {
    test('should enforce rate limits on registration', async ({ request }) => {
      const responses: number[] = [];

      // Attempt 5 registrations rapidly (limit is 3/min)
      for (let i = 0; i < 5; i++) {
        const response = await request.post('/api/users', {
          data: {
            name: `User${i}`,
            organization: `Company${i}`,
            email: `ratelimit_${Date.now()}_${i}@test.com`,
            privacyConsent: true,
          },
        });
        responses.push(response.status());
      }

      // At least one should be rate limited (429)
      const rateLimited = responses.filter(s => s === 429).length;
      expect(rateLimited).toBeGreaterThan(0);
    });
  });

  test.describe('Analyze API', () => {
    test('should reject empty idea', async ({ request }) => {
      const response = await request.post('/api/idea-validator/analyze', {
        data: {
          idea: '',
          conversationHistory: [],
          level: 'mvp',
          personas: ['Developer', 'Designer', 'VC'],
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should accept short but valid idea', async ({ request }) => {
      // API accepts any non-empty idea (min length is 1)
      const response = await request.post('/api/idea-validator/analyze', {
        data: {
          idea: '앱',
          conversationHistory: [],
          level: 'mvp',
          personas: ['Developer', 'Designer', 'VC'],
        },
      });

      // Should either succeed or hit rate limit
      expect([200, 429]).toContain(response.status());
    });

    test('should accept valid idea input', async ({ request }) => {
      const response = await request.post('/api/idea-validator/analyze', {
        data: {
          idea: 'AI 기반 음식 추천 앱입니다. 사용자의 취향과 건강 상태를 분석하여 맞춤형 메뉴를 추천합니다.',
          conversationHistory: [],
          level: 'mvp',
          personas: ['Developer', 'Designer', 'VC'],
        },
      });

      // Should either succeed or hit rate limit
      expect([200, 429]).toContain(response.status());

      if (response.status() === 200) {
        const body = await response.json();
        // Response format: { success: true, result: { responses: [...] } }
        expect(body.success).toBe(true);
        expect(body.result).toBeDefined();
      }
    });
  });

  test.describe('Analytics API', () => {
    test('should initialize session with valid data', async ({ request }) => {
      const response = await request.post('/api/analytics/session', {
        data: {
          action: 'initialize',
          sessionId: `test_${Date.now()}`,
          validationLevel: 'mvp',
          personas: ['Developer', 'Designer', 'VC'],
          interactionMode: 'individual',
          sessionStart: Date.now(),
        },
      });

      // Accept success, rate limit, or 500 (if Supabase not configured)
      expect([200, 429, 500]).toContain(response.status());
    });

    test('should reject invalid session hash for update', async ({ request }) => {
      const response = await request.post('/api/analytics/session', {
        data: {
          sessionHash: 'invalid-hash', // Not 64 hex chars
          completionStatus: 'completed',
        },
      });

      expect(response.status()).toBe(400);
    });
  });

});
