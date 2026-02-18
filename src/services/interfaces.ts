/**
 * Service Interfaces
 * 
 * Defines contracts for all services in the application.
 * This allows for easy mocking and testing.
 */

import type {
  DocumentParse,
  UserPreferences,
  Plan,
  Anchor,
  Schedule,
  Alarm,
  QRPayload,
} from '../types';

// ============================================================================
// OCR SERVICE
// ============================================================================

export interface IOcrService {
  /**
   * Extract text from an image
   * @param imageUri - URI of the image file
   * @returns Extracted text
   */
  extractText(imageUri: string): Promise<string>;
  
  /**
   * Check if OCR service is available
   */
  isAvailable(): Promise<boolean>;
}

// ============================================================================
// PDF SERVICE
// ============================================================================

export interface IPdfService {
  /**
   * Extract text from a PDF
   * @param pdfUri - URI of the PDF file
   * @returns Extracted text
   */
  extractText(pdfUri: string): Promise<string>;
  
  /**
   * Check if PDF is text-based or scanned
   * @param pdfUri - URI of the PDF file
   * @returns true if scanned (needs OCR), false if text-based
   */
  isScanned(pdfUri: string): Promise<boolean>;
}

// ============================================================================
// EXTRACTOR SERVICE (LLM)
// ============================================================================

export interface ExtractorContext {
  /**
   * User preferences for context
   */
  preferences?: UserPreferences;
  
  /**
   * Current date/time (ISO 8601) - for inferring relative dates
   */
  currentDatetime?: string;
  
  /**
   * Additional context (e.g., "patient mentioned starting medication tomorrow")
   */
  additionalContext?: string;
}

export interface IExtractorService {
  /**
   * Extract alarm plans from document text
   * @param text - Normalized document text
   * @param context - Additional context for extraction
   * @returns Parsed document with plans
   */
  extractPlans(
    text: string,
    context?: ExtractorContext
  ): Promise<DocumentParse>;
  
  /**
   * Validate extracted plans
   * @param parse - Document parse result
   * @returns Validation errors (empty if valid)
   */
  validate(parse: DocumentParse): string[];
}

// ============================================================================
// SCHEDULER SERVICE
// ============================================================================

export interface ISchedulerService {
  /**
   * Create alarms from a schedule
   * @param schedule - Schedule with alarms to create
   * @returns Created alarm IDs
   */
  createAlarms(schedule: Schedule): Promise<string[]>;
  
  /**
   * Cancel alarms by IDs
   * @param alarmIds - Array of alarm IDs to cancel
   */
  cancelAlarms(alarmIds: string[]): Promise<void>;
  
  /**
   * Cancel all alarms for a plan
   * @param planId - Plan ID
   */
  cancelPlanAlarms(planId: string): Promise<void>;
  
  /**
   * Get all scheduled alarms
   * @returns Array of all alarms
   */
  getAllAlarms(): Promise<Alarm[]>;
  
  /**
   * Mark alarm as completed
   * @param alarmId - Alarm ID
   */
  completeAlarm(alarmId: string): Promise<void>;
  
  /**
   * Snooze an alarm
   * @param alarmId - Alarm ID
   * @param minutes - Minutes to snooze
   */
  snoozeAlarm(alarmId: string, minutes: number): Promise<void>;
  
  /**
   * Request notification permissions
   * @returns true if granted
   */
  requestPermissions(): Promise<boolean>;
  
  /**
   * Check if permissions are granted
   */
  hasPermissions(): Promise<boolean>;
}

// ============================================================================
// SCHEDULE GENERATOR (Pure Functions)
// ============================================================================

export interface ScheduleGeneratorOptions {
  /**
   * User preferences
   */
  preferences?: UserPreferences;
  
  /**
   * Current date/time (ISO 8601)
   */
  now?: string;
}

export interface IScheduleGenerator {
  /**
   * Generate schedule from fixed plan
   * @param plan - Plan with fixed_events
   * @param options - Generation options
   * @returns Generated schedule
   */
  generateFixedSchedule(
    plan: Plan,
    options?: ScheduleGeneratorOptions
  ): Schedule;
  
  /**
   * Generate schedule from flexible plan
   * @param plan - Plan with flexible_pattern
   * @param anchor - Start anchor
   * @param options - Generation options
   * @returns Generated schedule
   */
  generateFlexibleSchedule(
    plan: Plan,
    anchor: Anchor,
    options?: ScheduleGeneratorOptions
  ): Schedule;
  
  /**
   * Recommend optimal anchor for flexible plan
   * @param plan - Plan with flexible_pattern
   * @param options - Generation options
   * @returns Recommended anchor with explanation
   */
  recommendAnchor(
    plan: Plan,
    options?: ScheduleGeneratorOptions
  ): Anchor;
}

// ============================================================================
// QR SERVICE
// ============================================================================

export interface IQrService {
  /**
   * Generate QR code from payload
   * @param payload - QR payload data
   * @returns Base64 encoded QR image
   */
  generate(payload: QRPayload): Promise<string>;
  
  /**
   * Parse QR code payload
   * @param qrData - Raw QR data string
   * @returns Parsed payload
   */
  parse(qrData: string): QRPayload;
  
  /**
   * Validate QR signature (for enterprise mode)
   * @param payload - QR payload with signature
   * @param publicKey - Issuer's public key (base64)
   * @returns true if valid
   */
  validateSignature(payload: QRPayload, publicKey: string): boolean;
  
  /**
   * Sign QR payload (for QR Studio)
   * @param payload - QR payload to sign
   * @param privateKey - Issuer's private key (base64)
   * @returns Signed payload
   */
  sign(payload: QRPayload, privateKey: string): QRPayload;
  
  /**
   * Fetch plan from backend (for reference QRs)
   * @param planId - Plan ID
   * @param planUrl - Backend URL
   * @returns Fetched plan
   */
  fetchPlan(planId: string, planUrl: string): Promise<Plan>;
}

// ============================================================================
// STORAGE SERVICE
// ============================================================================

export interface IStorageService {
  /**
   * Save data to persistent storage
   * @param key - Storage key
   * @param value - Data to store (will be JSON serialized)
   */
  set<T>(key: string, value: T): Promise<void>;
  
  /**
   * Get data from persistent storage
   * @param key - Storage key
   * @returns Stored data or null if not found
   */
  get<T>(key: string): Promise<T | null>;
  
  /**
   * Delete data from storage
   * @param key - Storage key
   */
  delete(key: string): Promise<void>;
  
  /**
   * Clear all storage
   */
  clear(): Promise<void>;
  
  /**
   * Get all keys
   */
  getAllKeys(): Promise<string[]>;
}
