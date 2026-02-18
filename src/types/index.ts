/**
 * Core Types for Photolarm
 * 
 * Defines all TypeScript types and Zod schemas for the application.
 * These types represent the data model from document input to alarm creation.
 */

import { z } from 'zod';

// ============================================================================
// DOMAIN TYPES
// ============================================================================

/**
 * Supported domains for alarm extraction
 */
export const DomainSchema = z.enum([
  'medication',      // Medication schedules
  'appointment',     // Medical appointments
  'treatment',       // Treatment plans
  'measurement',     // Vital sign measurements (BP, glucose, etc.)
  'lifestyle',       // Exercise, diet reminders
  'cooking',         // Recipe steps, cooking timers
  'fitness',         // Exercise routines, workout intervals
  'habit',          // Daily habits (hydration, meditation, etc.)
  'work',           // Work meetings, deadlines
  'event',          // Birthdays, special occasions
  'other',          // Fallback
]);

export type Domain = z.infer<typeof DomainSchema>;

/**
 * Visual category for UI display (with icons)
 */
export const CategorySchema = z.enum([
  'health',         // 💊 Medical/health-related
  'cooking',        // 🍳 Recipe and cooking timers
  'fitness',        // 🏋️ Exercise and workout routines
  'habit',          // 🌱 Daily habits and reminders
  'appointment',    // 🏥 Medical appointments
  'class',          // 📚 Classes, courses
  'work',           // 💼 Work-related tasks
  'event',          // 🎉 Special events
  'other',          // 📌 Miscellaneous
]);

export type Category = z.infer<typeof CategorySchema>;

/**
 * Mode of alarm plan: Fixed (specific dates/times) vs Flexible (intervals from an anchor)
 */
export const PlanModeSchema = z.enum(['fixed', 'flexible']);
export type PlanMode = z.infer<typeof PlanModeSchema>;

/**
 * Anchor type for flexible plans
 */
export const AnchorTypeSchema = z.enum([
  'now',              // Start immediately
  'user_selected',    // User picks start time
  'recommended',      // AI recommends optimal start time
]);

export type AnchorType = z.infer<typeof AnchorTypeSchema>;

/**
 * Reminder time for fixed events (minutes before the event)
 */
export const ReminderTimeSchema = z.enum([
  '1day',      // 1 day before (1440 minutes)
  '1hour',     // 1 hour before (60 minutes)
  '30min',     // 30 minutes before
  '15min',     // 15 minutes before
  '5min',      // 5 minutes before
  'at_time',   // At the exact time
]);

export type ReminderTime = z.infer<typeof ReminderTimeSchema>;

/**
 * Helper to get minutes from ReminderTime
 */
export function getReminderMinutes(reminder: ReminderTime): number {
  switch (reminder) {
    case '1day': return 1440;
    case '1hour': return 60;
    case '30min': return 30;
    case '15min': return 15;
    case '5min': return 5;
    case 'at_time': return 0;
  }
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Document input type
 */
export const DocumentInputTypeSchema = z.enum([
  'photo',
  'pdf',
  'text',
  'qr',
]);

export type DocumentInputType = z.infer<typeof DocumentInputTypeSchema>;

/**
 * Document input metadata
 */
export const DocumentInputSchema = z.object({
  id: z.string(),
  type: DocumentInputTypeSchema,
  uri: z.string().optional(),              // File URI for photo/pdf
  text: z.string().optional(),             // Direct text input
  qrPayload: z.string().optional(),        // QR payload
  timestamp: z.string().datetime(),        // ISO 8601
  metadata: z.record(z.string(), z.unknown()).optional(), // Extra metadata
});

export type DocumentInput = z.infer<typeof DocumentInputSchema>;

// ============================================================================
// EXTRACTION TYPES (LLM Output)
// ============================================================================

/**
 * Constraint type for flexible plans
 */
export const ConstraintTypeSchema = z.enum([
  'with_meal',        // Take with food
  'before_meal',      // 30min before eating
  'after_meal',       // 30min-1hr after eating
  'empty_stomach',    // 2+ hours from food
  'before_sleep',     // Within 30min of sleeping
  'upon_waking',      // Within 30min of waking
  'avoid_sleep',      // Don't wake user if sleeping
  'specific_time',    // Must be at specific time of day
]);

export type ConstraintType = z.infer<typeof ConstraintTypeSchema>;

/**
 * Constraint detail
 */
export const ConstraintSchema = z.object({
  type: ConstraintTypeSchema,
  value: z.string().optional(),  // Extra info (e.g., "breakfast", "22:00")
  priority: z.enum(['required', 'preferred', 'optional']),
});

export type Constraint = z.infer<typeof ConstraintSchema>;

/**
 * Fixed event (specific date/time)
 */
export const FixedEventSchema = z.object({
  start_datetime_iso: z.string().datetime(),
  timezone: z.string().optional().default('local'),
  title: z.string(),
  description: z.string().optional(),
  alert_before_minutes: z.number().int().optional(), // Alert X minutes before
  repeat: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    until: z.string().datetime().optional(),
  }).optional(),
});

export type FixedEvent = z.infer<typeof FixedEventSchema>;

/**
 * Flexible pattern item (interval-based)
 */
export const FlexiblePatternItemSchema = z.object({
  // Interval specification
  interval_hours: z.number().positive().optional(),    // e.g., 8 for "every 8 hours"
  times_per_day: z.number().int().positive().optional(), // e.g., 3 for "3 times a day"
  
  // Specific times of day
  times_of_day: z.array(z.string()).optional(),  // e.g., ["08:00", "14:00", "20:00"]
  
  // Duration
  duration_days: z.number().int().positive().optional(),
  duration_doses: z.number().int().positive().optional(), // "for 10 doses"
  
  // What to do
  title: z.string(),
  description: z.string().optional(),
  
  // Constraints
  constraints: z.array(ConstraintSchema).optional(),
  
  // Dosage/amount (optional)
  dosage: z.string().optional(), // "1 tablet", "5ml", etc.
});

export type FlexiblePatternItem = z.infer<typeof FlexiblePatternItemSchema>;

/**
 * Flexible pattern (collection of interval items + metadata)
 */
export const FlexiblePatternSchema = z.object({
  items: z.array(FlexiblePatternItemSchema),
  
  // Hints for anchor recommendation
  hints: z.object({
    prefer_morning: z.boolean().optional(),
    prefer_evening: z.boolean().optional(),
    avoid_sleep_interruption: z.boolean().default(true),
    first_dose_urgent: z.boolean().optional(), // Should first dose be ASAP?
  }).optional(),
});

export type FlexiblePattern = z.infer<typeof FlexiblePatternSchema>;

/**
 * Plan extracted from document
 */
export const PlanSchema = z.object({
  id: z.string(),
  mode: PlanModeSchema,
  domain: DomainSchema,
  category: CategorySchema,  // Visual category for UI
  
  // Confidence score (0-1)
  confidence: z.number().min(0).max(1),
  
  // Evidence from document
  evidence: z.string(),  // Quote from document that led to this plan
  
  // Questions for user (if ambiguous)
  questions_for_user: z.array(z.string()).optional(),
  
  // Mode-specific data
  fixed_events: z.array(FixedEventSchema).optional(),
  flexible_pattern: FlexiblePatternSchema.optional(),
  
  // Metadata
  notes: z.string().optional(),
  warnings: z.array(z.string()).optional(), // e.g., "Conflicting times detected"
});

export type Plan = z.infer<typeof PlanSchema>;

/**
 * Document parse result (LLM output)
 */
export const DocumentParseSchema = z.object({
  success: z.boolean(),
  plans: z.array(PlanSchema),
  raw_text: z.string(),  // Normalized text from OCR/PDF
  errors: z.array(z.string()).optional(),
  metadata: z.object({
    extraction_model: z.string().optional(),
    extraction_timestamp: z.string().datetime(),
    token_count: z.number().int().optional(),
  }),
});

export type DocumentParse = z.infer<typeof DocumentParseSchema>;

// ============================================================================
// SCHEDULE TYPES
// ============================================================================

/**
 * Anchor for flexible schedules
 */
export const AnchorSchema = z.object({
  type: AnchorTypeSchema,
  datetime: z.string().datetime(),  // When the schedule starts
  timezone: z.string().default('local'),
  reason: z.string().optional(),  // Why this anchor was chosen (for recommended)
});

export type Anchor = z.infer<typeof AnchorSchema>;

/**
 * Single alarm instance
 */
export const AlarmSchema = z.object({
  id: z.string(),
  plan_id: z.string(),  // Reference to parent plan
  
  // Trigger time
  datetime: z.string().datetime(),
  timezone: z.string().default('local'),
  
  // Notification content
  title: z.string(),
  body: z.string(),
  
  // Config
  enabled: z.boolean().default(true),
  snoozeable: z.boolean().default(true),
  alert_before_minutes: z.number().int().optional(),
  
  // Status
  triggered: z.boolean().default(false),
  completed: z.boolean().default(false),
  completed_at: z.string().datetime().optional(),
  
  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Alarm = z.infer<typeof AlarmSchema>;

/**
 * Schedule (collection of alarms for a plan)
 */
export const ScheduleSchema = z.object({
  id: z.string(),
  plan_id: z.string(),
  
  // Source
  anchor: AnchorSchema.optional(),  // For flexible plans
  
  // Alarms
  alarms: z.array(AlarmSchema),
  
  // Metadata
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Schedule = z.infer<typeof ScheduleSchema>;

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * Sleep window (for avoiding interruptions)
 */
export const SleepWindowSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export type SleepWindow = z.infer<typeof SleepWindowSchema>;

/**
 * Meal times (optional, for meal-related constraints)
 */
export const MealTimesSchema = z.object({
  breakfast: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  lunch: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  dinner: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

export type MealTimes = z.infer<typeof MealTimesSchema>;

/**
 * User preferences
 */
export const UserPreferencesSchema = z.object({
  sleepWindow: SleepWindowSchema.optional(),
  nightShiftMode: z.boolean().default(false),
  mealTimes: MealTimesSchema.optional(),
  
  // Notification settings
  doNotDisturb: z.boolean().default(false),
  allowSleepInterruptions: z.boolean().default(false),
  
  // Timezone
  timezone: z.string().default('local'),
  
  // Alarm sound
  alarmSound: z.string().default('alarm1.mp3'),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// ============================================================================
// QR TYPES (B2B)
// ============================================================================

/**
 * QR payload type
 */
export const QRPayloadTypeSchema = z.enum(['embedded', 'reference']);
export type QRPayloadType = z.infer<typeof QRPayloadTypeSchema>;

/**
 * QR payload (v1)
 */
export const QRPayloadSchema = z.object({
  version: z.literal('1'),
  type: QRPayloadTypeSchema,
  
  // Embedded mode (MVP)
  plan: PlanSchema.optional(),
  
  // Reference mode (Enterprise)
  planId: z.string().optional(),
  planUrl: z.string().url().optional(),
  issuerId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  signature: z.string().optional(),  // base64 Ed25519 signature
  
  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type QRPayload = z.infer<typeof QRPayloadSchema>;

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * API Error
 */
export const APIErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type APIError = z.infer<typeof APIErrorSchema>;

/**
 * Generic API Response
 */
export const APIResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: APIErrorSchema.optional(),
  });

export type APIResponse<T> = {
  success: boolean;
  data?: T;
  error?: APIError;
};

// ============================================================================
// LEARNED PATTERNS (Incremental Learning System)
// ============================================================================

export type {
  ExtractedMedicationValues,
  LearningMetadata,
  LearnedMedicationPattern,
  PatternMatch,
  DetectedMedication,
  ValidatedMedication,
  LearningStats,
} from './learned-patterns';
