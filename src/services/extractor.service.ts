/**
 * Mock Extractor Service
 * 
 * Implements IExtractorService with mock data for development.
 * TODO: Replace with OpenAI implementation when API key is configured.
 */

import OpenAI from 'openai';
import type {
  IExtractorService,
  ExtractorContext,
} from './interfaces';
import type { DocumentParse } from '../types';
import { DocumentParseSchema } from '../types';
import {
  getSystemPrompt,
  getUserPrompt,
  getDefaultContext,
} from '../prompts/extractor';

/**
 * OpenAI Extractor Configuration
 */
export interface OpenAIExtractorConfig {
  apiKey: string;
  model?: string;  // Default: 'gpt-4o-mini'
  maxRetries?: number;  // Default: 2
  temperature?: number;  // Default: 0.1 (low for consistent JSON)
}

/**
 * OpenAI-based plan extractor
 */
export class OpenAIExtractorService implements IExtractorService {
  private client: OpenAI;
  private model: string;
  private maxRetries: number;
  private temperature: number;

  constructor(config: OpenAIExtractorConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.model = config.model ?? 'gpt-4o-mini';
    this.maxRetries = config.maxRetries ?? 2;
    this.temperature = config.temperature ?? 0.1;
  }

  async extractPlans(
    text: string,
    context?: ExtractorContext
  ): Promise<DocumentParse> {
    const fullContext = {
      ...getDefaultContext(),
      ...context,
    };

    const systemPrompt = getSystemPrompt();
    const userPrompt = getUserPrompt(text, fullContext);

    let lastError: Error | null = null;
    
    // Retry logic
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: this.temperature,
          response_format: { type: 'json_object' }, // Force JSON mode
        });

        const content = response.choices[0]?.message?.content;
        
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        // Parse JSON
        const parsed = JSON.parse(content);
        
        // Add metadata
        parsed.raw_text = text;
        parsed.metadata = {
          ...parsed.metadata,
          extraction_model: this.model,
          extraction_timestamp: new Date().toISOString(),
          token_count: response.usage?.total_tokens,
        };

        // Validate with Zod
        const validated = DocumentParseSchema.parse(parsed);
        
        return validated;
      } catch (error) {
        lastError = error as Error;
        console.error(`Extraction attempt ${attempt + 1} failed:`, error);
        
        // If it's a validation error, don't retry
        if (error instanceof Error && error.name === 'ZodError') {
          break;
        }
        
        // Wait before retry
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // All retries failed
    return {
      success: false,
      plans: [],
      raw_text: text,
      errors: [
        `Failed to extract plans after ${this.maxRetries + 1} attempts`,
        lastError?.message ?? 'Unknown error',
      ],
      metadata: {
        extraction_timestamp: new Date().toISOString(),
        extraction_model: this.model,
      },
    };
  }

  validate(parse: DocumentParse): string[] {
    const errors: string[] = [];

    if (!parse.success) {
      errors.push('Extraction was not successful');
    }

    if (parse.plans.length === 0 && parse.success) {
      errors.push('No plans extracted but marked as successful');
    }

    for (const plan of parse.plans) {
      // Validate mode-specific data
      if (plan.mode === 'fixed') {
        if (!plan.fixed_events || plan.fixed_events.length === 0) {
          errors.push(`Plan ${plan.id}: Fixed mode but no fixed_events`);
        }
        if (plan.flexible_pattern) {
          errors.push(`Plan ${plan.id}: Fixed mode but has flexible_pattern`);
        }
      } else if (plan.mode === 'flexible') {
        if (!plan.flexible_pattern) {
          errors.push(`Plan ${plan.id}: Flexible mode but no flexible_pattern`);
        }
        if (plan.fixed_events) {
          errors.push(`Plan ${plan.id}: Flexible mode but has fixed_events`);
        }
      }

      // Validate confidence
      if (plan.confidence < 0 || plan.confidence > 1) {
        errors.push(`Plan ${plan.id}: Invalid confidence ${plan.confidence}`);
      }

      // Validate evidence exists
      if (!plan.evidence || plan.evidence.trim().length === 0) {
        errors.push(`Plan ${plan.id}: Missing evidence`);
      }
    }

    return errors;
  }
}

/**
 * Smart Local Extractor (no API calls, intelligent parsing)
 * Analyzes Spanish/English medical text and extracts structured plans
 */
export class SmartLocalExtractorService implements IExtractorService {
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove accents
  }

  private extractMedications(text: string): Array<{
    name: string;
    dosage: string;
    intervalHours: number;
    durationDays: number;
    administration: string;
    evidence: string;
    confidence: number;
  }> {
    const medications: Map<string, any> = new Map(); // Use Map to deduplicate
    const lines = text.split('\n');
    const normalized = this.normalizeText(text);

    // Common medication patterns (Spanish & English)
    const medicationKeywords = [
      'paracetamol', 'acetaminofeno', 'ibuprofeno', 'amoxicilina', 
      'glucosa', 'aspirina', 'omeprazol', 'metformina', 'losartan',
      'atorvastatina', 'enalapril', 'captopril', 'diclofenaco',
      'naproxeno', 'cefalexina', 'azitromicina', 'ciprofloxacino'
    ];

    // Process text in blocks (medication name + following lines with dosage info)
    const blocks: string[] = [];
    let currentBlock = '';
    
    for (const line of lines) {
      const lineNormalized = this.normalizeText(line);
      const hasMedication = medicationKeywords.some(med => lineNormalized.includes(med));
      
      if (hasMedication && currentBlock) {
        // New medication found, save previous block
        blocks.push(currentBlock.trim());
        currentBlock = line;
      } else if (hasMedication) {
        // First medication
        currentBlock = line;
      } else if (currentBlock && line.trim()) {
        // Continuation of current medication
        currentBlock += '\n' + line;
      }
    }
    if (currentBlock) blocks.push(currentBlock.trim());

    // Search for each medication in blocks
    for (const block of blocks) {
      const blockNormalized = this.normalizeText(block);
      
      for (const med of medicationKeywords) {
        if (!blockNormalized.includes(med)) continue;

        // Extract dosage (e.g., "500mg", "500 miligramos", "1 tableta")
        const dosageMatch = block.match(/(\d+\.?\d*)\s*(mg|miligramos?|gramos?|g|ml|tabletas?|cápsulas?|comprimidos?)/i);
        const dosage = dosageMatch ? `${dosageMatch[1]} ${dosageMatch[2]}` : '1 dosis';

        // Extract interval with better logic for "X veces al día"
        let intervalHours = 24; // Default: once daily
        let confidence = 0.6;

        // Pattern: "2 veces al día" = 24 / 2 = cada 12 horas
        const vecesAlDiaMatch = block.match(/(\d+)\s+veces?\s+(?:al|por)\s+d[ií]a/i);
        if (vecesAlDiaMatch) {
          const timesPerDay = parseInt(vecesAlDiaMatch[1]);
          intervalHours = Math.floor(24 / timesPerDay);
          confidence = 0.85;
        }
        
        // Pattern: "cada X horas"
        const cadaHorasMatch = block.match(/cada\s+(\d+)\s+horas?/i);
        if (cadaHorasMatch) {
          intervalHours = parseInt(cadaHorasMatch[1]);
          confidence = 0.9;
        }

        // Pattern: "every X hours" (English)
        const everyHoursMatch = block.match(/every\s+(\d+)\s+hours?/i);
        if (everyHoursMatch) {
          intervalHours = parseInt(everyHoursMatch[1]);
          confidence = 0.9;
        }

        // Extract duration (e.g., "por 30 dias", "durante 7 dias")
        let durationDays = 7; // Default: 1 week
        const durationPatterns = [
          /(?:por|durante|for)\s+(\d+)\s+d[ií]as?/i,
          /(\d+)\s+d[ií]as?/i,
        ];

        for (const pattern of durationPatterns) {
          const durationMatch = block.match(pattern);
          if (durationMatch) {
            durationDays = parseInt(durationMatch[1]);
            confidence = Math.min(confidence + 0.05, 0.95);
            break;
          }
        }

        // Extract administration route (e.g., "via oral", "inyectable")
        const adminMatch = block.match(/v[ií]a\s+(oral|intravenosa|intramuscular|tópica?|sublingual)/i);
        const administration = adminMatch ? adminMatch[1] : 'oral';

        // Create unique key for deduplication
        const medName = med.charAt(0).toUpperCase() + med.slice(1);
        const uniqueKey = `${medName}_${dosage}_${intervalHours}h_${durationDays}d`;

        // Only add if not duplicate
        if (!medications.has(uniqueKey)) {
          medications.set(uniqueKey, {
            name: medName,
            dosage,
            intervalHours,
            durationDays,
            administration,
            evidence: block.trim(),
            confidence,
          });
        }
      }
    }

    return Array.from(medications.values());
  }

  private extractAppointments(text: string): Array<{
    title: string;
    datetime: Date | null;
    location: string | null;
    evidence: string;
    confidence: number;
  }> {
    const appointments = [];
    const normalized = this.normalizeText(text);

    // Appointment keywords
    const hasAppointment = /cita|consulta|appointment|visit|control|seguimiento/i.test(text);
    if (!hasAppointment) return [];

    // Extract dates (Spanish format: "15 enero 2026", "15/01/2026")
    const datePatterns = [
      /(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{4})/gi,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
    ];

    const monthMap: Record<string, number> = {
      enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
      julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
    };

    for (const pattern of datePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let datetime: Date | null = null;
        let evidence = match[0];

        if (match[2] && monthMap[match[2].toLowerCase()] !== undefined) {
          // "15 enero 2026" format
          datetime = new Date(parseInt(match[3]), monthMap[match[2].toLowerCase()], parseInt(match[1]));
        } else if (match.length === 4) {
          // "15/01/2026" format
          datetime = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        }

        // Extract time if present (e.g., "10:00am", "14:30")
        const timePattern = /(\d{1,2}):(\d{2})\s*(am|pm)?/i;
        const timeMatch = text.match(timePattern);
        if (timeMatch && datetime) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          if (timeMatch[3]?.toLowerCase() === 'pm' && hours < 12) hours += 12;
          if (timeMatch[3]?.toLowerCase() === 'am' && hours === 12) hours = 0;
          datetime.setHours(hours, minutes);
          evidence += ` ${timeMatch[0]}`;
        } else if (datetime) {
          // Default to 9:00 AM if no time specified
          datetime.setHours(9, 0);
        }

        // Extract location (e.g., "Clinica Centro Pitagoras 23")
        const locationMatch = text.match(/(?:cl[ií]nica|hospital|centro)\s+[^\n]+/i);
        const location = locationMatch ? locationMatch[0].trim() : null;

        appointments.push({
          title: 'Cita Médica',
          datetime,
          location,
          evidence,
          confidence: datetime ? 0.85 : 0.5,
        });
      }
    }

    // If no specific date found but appointment mentioned, create generic appointment
    if (appointments.length === 0 && hasAppointment) {
      appointments.push({
        title: 'Cita Médica',
        datetime: null,
        location: null,
        evidence: 'Referencia a cita médica sin fecha específica',
        confidence: 0.4,
      });
    }

    return appointments;
  }

  async extractPlans(
    text: string,
    _context?: ExtractorContext
  ): Promise<DocumentParse> {
    const plans = [];

    // Extract medications
    const medications = this.extractMedications(text);
    for (const med of medications) {
      plans.push({
        id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mode: 'flexible' as const,
        domain: 'medication' as const,
        category: 'health' as const,
        confidence: med.confidence,
        evidence: med.evidence,
        flexible_pattern: {
          items: [{
            interval_hours: med.intervalHours,
            duration_days: med.durationDays,
            title: `${med.name} ${med.dosage}`,
            description: `Tomar ${med.dosage} cada ${med.intervalHours} horas, vía ${med.administration}, durante ${med.durationDays} días`,
          }],
        },
      });
    }

    // Extract appointments
    const appointments = this.extractAppointments(text);
    for (const appt of appointments) {
      if (appt.datetime) {
        plans.push({
          id: `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          mode: 'fixed' as const,
          domain: 'appointment' as const,
          category: 'appointment' as const,
          confidence: appt.confidence,
          evidence: appt.evidence,
          fixed_events: [{
            start_datetime_iso: appt.datetime.toISOString(),
            timezone: 'local',
            title: appt.title,
            description: appt.location || 'Consulta médica',
            alert_before_minutes: 60,
          }],
        });
      }
    }

    return {
      success: plans.length > 0,
      plans,
      raw_text: text,
      errors: plans.length === 0 ? ['No se detectaron medicamentos o citas en el texto'] : undefined,
      metadata: {
        extraction_model: 'smart-local-parser-v1',
        extraction_timestamp: new Date().toISOString(),
      },
    };
  }

  validate(parse: DocumentParse): string[] {
    return parse.success ? [] : ['Smart extraction failed'];
  }
}

// Export Pattern-Based as default for production
export { PatternBasedExtractorService } from './extractor.service.patterns';

// Alias for backward compatibility
export const MockExtractorService = SmartLocalExtractorService;
