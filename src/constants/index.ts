/**
 * Application Constants
 */

// ============================================================================
// API KEYS (from environment)
// ============================================================================

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const GOOGLE_CLOUD_VISION_API_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY || '';
export const BACKEND_URL = process.env.BACKEND_URL || '';
export const QR_ISSUER_PUBLIC_KEY = process.env.QR_ISSUER_PUBLIC_KEY || '';

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

export const DEFAULT_LLM_MODEL = 'gpt-4o-mini';
export const DEFAULT_LLM_TEMPERATURE = 0.1;
export const DEFAULT_LLM_MAX_RETRIES = 2;

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  PLANS: 'plans',
  SCHEDULES: 'schedules',
  ALARMS: 'alarms',
  DOCUMENTS: 'documents',
} as const;

// ============================================================================
// NOTIFICATION DEFAULTS
// ============================================================================

export const DEFAULT_ALERT_BEFORE_MINUTES = 15;
export const DEFAULT_SNOOZE_MINUTES = 10;

// ============================================================================
// SLEEP WINDOW DEFAULTS
// ============================================================================

export const DEFAULT_SLEEP_WINDOW = {
  start: '23:00',
  end: '07:00',
};

// ============================================================================
// QR CONFIGURATION
// ============================================================================

export const QR_VERSION = '1' as const;
export const QR_MAX_EMBEDDED_SIZE = 2000; // bytes (approximate)

// ============================================================================
// DATE/TIME FORMATS
// ============================================================================

export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM d, yyyy',
  DISPLAY_TIME: 'h:mm a',
  DISPLAY_DATETIME: 'MMM d, yyyy h:mm a',
  ISO_DATE: 'yyyy-MM-dd',
  TIME_24H: 'HH:mm',
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

export const MAX_PLAN_DURATION_DAYS = 365;
export const MAX_ALARMS_PER_PLAN = 1000;

// ============================================================================
// UI
// ============================================================================

export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// ============================================================================
// Alarm Sounds
// ============================================================================
export * from './alarmSounds';
