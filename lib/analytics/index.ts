// Session Analytics exports
export {
  initializeAnalyticsSession,
  trackTurn,
  trackReflection,
  trackDropoff,
  trackCompletionWithCategories,
  recoverAbandonedSession,
  cleanupAnalyticsSession,
  getAnalyticsSessionId,
  isAnalyticsSessionActive,
} from './sessionTracker';

export {
  extractCategories,
  getAllowedCategories,
  type IdeaCategory,
} from './categoryExtractor';
