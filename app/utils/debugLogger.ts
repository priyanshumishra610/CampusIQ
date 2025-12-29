/**
 * Debug Logger Utility
 * Provides reliable logging with multiple fallbacks for React Native
 * This module is designed to never throw errors - it always falls back to console
 */

const SERVER_ENDPOINT = 'http://127.0.0.1:7243/ingest/f3f772a9-b4fc-46ea-b36f-fcf30affbe13';

interface LogEntry {
  location: string;
  message: string;
  data?: any;
  timestamp: number;
  sessionId: string;
  runId: string;
  hypothesisId?: string;
}

/**
 * Safe console log wrapper
 */
const safeConsoleLog = (...args: any[]) => {
  try {
    console.log(...args);
  } catch (e) {
    // If console.log fails, we can't do much
  }
};

/**
 * Safe console error wrapper
 */
const safeConsoleError = (...args: any[]) => {
  try {
    console.error(...args);
  } catch (e) {
    // If console.error fails, we can't do much
  }
};

/**
 * Write log entry with multiple fallbacks
 */
export const debugLog = (entry: LogEntry) => {
  try {
    // Always log to console first for immediate visibility
    safeConsoleLog(`[QA-DEBUG] ${entry.location}: ${entry.message}`, entry.data || '');
    
    // Try fetch (for server ingestion) - don't block on this
    if (typeof fetch !== 'undefined') {
      fetch(SERVER_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(entry),
      }).catch((fetchError) => {
        // Silently fail - console already logged
      });
    }
  } catch (error) {
    // Even logging failed - try basic console as last resort
    try {
      safeConsoleLog('[QA-DEBUG] Logger error:', error);
      safeConsoleLog('[QA-DEBUG] Original entry:', entry);
    } catch (e) {
      // Complete failure - can't log anything
    }
  }
};

/**
 * Convenience function for logging with standard format
 * Never throws - always falls back to console
 */
export const log = (
  location: string,
  message: string,
  data?: any,
  hypothesisId?: string,
) => {
  try {
    debugLog({
      location,
      message,
      data: data || {},
      timestamp: Date.now(),
      sessionId: 'qa-debug-session',
      runId: 'run1',
      hypothesisId,
    });
  } catch (e) {
    // Ultimate fallback - just use console
    try {
      console.log(`[QA-DEBUG] ${location}: ${message}`, data || '');
    } catch (e2) {
      // Even console.log failed - can't do anything
    }
  }
};

/**
 * Log error with stack trace
 */
export const logError = (
  location: string,
  error: Error | any,
  context?: any,
  hypothesisId?: string,
) => {
  try {
    debugLog({
      location,
      message: 'Error occurred',
      data: {
        error: error?.message || 'Unknown error',
        errorStack: error?.stack?.substring(0, 500),
        errorName: error?.name,
        context,
      },
      timestamp: Date.now(),
      sessionId: 'qa-debug-session',
      runId: 'run1',
      hypothesisId,
    });
    
    // Also log to console.error for immediate visibility
    safeConsoleError(`[QA-ERROR] ${location}:`, error, context);
  } catch (e) {
    // If error logging fails, try basic console
    try {
      safeConsoleError('[QA-ERROR] Logger error:', e);
      safeConsoleError('[QA-ERROR] Original error:', error);
    } catch (e2) {
      // Complete failure
    }
  }
};

