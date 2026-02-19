'use client';

import { useState, useEffect, useCallback } from 'react';

export interface LevelUsage {
  used: number;
  limit: number;
  remaining: number;
  available: boolean;
  label: string;
  unlocked?: boolean;
}

export interface UsageData {
  sketch: LevelUsage;
  mvp: LevelUsage;
  defense: LevelUsage;
}

export function useUsage(email: string | null) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/usage?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.success) {
        setUsage(data.levels);
      } else {
        setError(data.error || '사용량 조회 실패');
      }
    } catch (err) {
      console.error('Usage fetch error:', err);
      setError('사용량 조회에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const recordUsage = useCallback(async (level: 'sketch' | 'mvp' | 'defense', score?: number, validationId?: string) => {
    if (!email) return { success: false, error: '이메일이 필요합니다' };

    try {
      const response = await fetch('/api/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, level, score, validationId }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh usage data
        await fetchUsage();
      }

      return data;
    } catch (err) {
      console.error('Record usage error:', err);
      return { success: false, error: '사용량 기록에 실패했습니다' };
    }
  }, [email, fetchUsage]);

  return {
    usage,
    loading,
    error,
    refetch: fetchUsage,
    recordUsage,
  };
}
