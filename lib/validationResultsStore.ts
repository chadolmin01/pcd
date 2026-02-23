// Validation results store - Pure localStorage implementation for standalone PRD Generator

export interface ValidationResult {
  id: string;
  timestamp: number;
  projectIdea: string;
  conversationHistory: string;
  reflectedAdvice: string[];
  artifacts?: {
    prd?: string;
    jd?: string;
  };
}

const STORAGE_KEY = 'prd_validation_results';
const MAX_RESULTS = 10;

// Get all results from localStorage
function getStoredResults(): ValidationResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save results to localStorage
function saveToStorage(results: ValidationResult[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export const validationResultsStore = {
  // Get all validation results
  getAll: async (): Promise<ValidationResult[]> => {
    return getStoredResults();
  },

  // Synchronous version for components that need sync access
  getAllSync: (): ValidationResult[] => {
    return getStoredResults();
  },

  // Save a new validation result
  save: async (result: Omit<ValidationResult, 'id' | 'timestamp'>): Promise<ValidationResult> => {
    const newResult: ValidationResult = {
      ...result,
      id: `val_${Date.now()}`,
      timestamp: Date.now(),
    };

    const existing = getStoredResults();
    const updated = [newResult, ...existing].slice(0, MAX_RESULTS);
    saveToStorage(updated);

    return newResult;
  },

  // Get a specific result by ID
  getById: async (id: string): Promise<ValidationResult | undefined> => {
    const results = getStoredResults();
    return results.find(r => r.id === id);
  },

  // Get the most recent result
  getLatest: async (): Promise<ValidationResult | undefined> => {
    const results = getStoredResults();
    return results[0];
  },

  // Update artifacts for a specific result
  updateArtifacts: async (id: string, artifacts: { prd?: string; jd?: string }): Promise<void> => {
    const results = getStoredResults();
    const updated = results.map(r => r.id === id ? { ...r, artifacts } : r);
    saveToStorage(updated);
  },

  // Delete a specific result
  delete: async (id: string): Promise<void> => {
    const results = getStoredResults();
    const filtered = results.filter(r => r.id !== id);
    saveToStorage(filtered);
  },

  // Clear all results
  clear: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};
