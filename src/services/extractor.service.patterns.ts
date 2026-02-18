/**
 * Pattern-Based Extractor Service
 * 
 * Uses JSON dictionaries for medical and cooking pattern recognition
 * Ultra lightweight, no AI/ML required, works 100% offline
 */

import medicalPatterns from '../data/medical-patterns.json';
import cookingPatterns from '../data/cooking-patterns.json';
import { getSymSpellService } from './symspell.service';
import { getMedicationVocabularyService } from './medication-vocabulary.service';
import { findClosestMedicationName } from '../lib/pattern-matcher';
import type {
  IExtractorService,
  ExtractorContext,
} from './interfaces';
import type { DocumentParse } from '../types';

export class PatternBasedExtractorService implements IExtractorService {
  private useSymSpell: boolean = false; // Enable/disable SymSpell
  private symSpellInitialized: boolean = false;
  private knownMedications: string[] = [];
  private medicationsLoaded: boolean = false;

  constructor(options?: { useSymSpell?: boolean }) {
    this.useSymSpell = options?.useSymSpell ?? false;
    
    // Initialize SymSpell if enabled
    if (this.useSymSpell) {
      this.initializeSymSpell();
    }
    
    // Don't load here - will lazy load on first use
    // This prevents async constructor issues
  }

  /**
   * Lazy load known medications (base + learned)
   * Called automatically on first use
   */
  private async ensureMedicationsLoaded(): Promise<void> {
    if (this.medicationsLoaded) return;
    
    try {
      const vocabService = getMedicationVocabularyService();
      this.knownMedications = await vocabService.getAllKnownMedications();
      this.medicationsLoaded = true;
      console.log(`📚 Loaded ${this.knownMedications.length} known medications (${medicalPatterns.medications.common_names.length} base + ${this.knownMedications.length - medicalPatterns.medications.common_names.length} learned)`);
    } catch (error) {
      console.warn('⚠️ Failed to load learned medications, using base only:', error);
      this.knownMedications = medicalPatterns.medications.common_names;
      this.medicationsLoaded = true;
    }
  }

  /**
   * Refresh known medications (call after saving new medications)
   */
  async refreshVocabulary(): Promise<void> {
    this.medicationsLoaded = false;
    await this.ensureMedicationsLoaded();
    console.log('🔄 Vocabulary refreshed');
  }

  private async initializeSymSpell(): Promise<void> {
    try {
      const symSpell = getSymSpellService();
      await symSpell.initialize();
      this.symSpellInitialized = true;
      console.log('✅ SymSpell ready for Layer 3 corrections');
    } catch (error) {
      console.warn('⚠️ SymSpell initialization failed, continuing without it:', error);
      this.symSpellInitialized = false;
    }
  }

  /**
   * Fix common OCR errors before processing
   * Handles Spanish and English typos
   */
  private fixCommonOCRErrors(text: string): string {
    let fixed = text;
    
    // Common OCR errors (case-insensitive)
    const corrections: [RegExp, string][] = [
      // "por" variations
      [/\b([xX])\s+(\d+)/g, 'por $2'],           // "x 3 días" → "por 3 días"
      [/\b[pP][rR]\b/g, 'por'],                  // "pr" → "por"
      [/\b[pP]0[rR]\b/g, 'por'],                 // "p0r" → "por"
      
      // "días" variations
      [/\bd[íi]as?\b/gi, 'días'],                // "dias", "día" → "días"
      [/\bd[lI][aá]s?\b/gi, 'días'],             // "dlas", "dlás" → "días"
      [/\bd[ií][aá]s\b/gi, 'días'],              // "diás" → "días"
      
      // "horas" variations
      [/\bh[oO0][rR][aá]s?\b/gi, 'horas'],       // "h0ras", "hOras" → "horas"
      [/\bhr[sS]?\b/gi, 'horas'],                // "hrs", "hr" → "horas"
      
      // "cada" variations
      [/\bc[aá]d[aá]\b/gi, 'cada'],              // "cáda" → "cada"
      [/\bc[aá][dD][aá]\b/gi, 'cada'],           // "caDA" → "cada"
      
      // "veces" variations
      [/\bv[eé]c[eé]s?\b/gi, 'veces'],           // "véces", "vece" → "veces"
      [/\bv[eE]z\b/gi, 'vez'],                   // "vEz" → "vez"
      
      // "tomar" variations
      [/\bt[oO0]m[aá]r\b/gi, 'tomar'],           // "t0mar", "tomár" → "tomar"
      [/\bt[oO0]m[aá]rl?\b/gi, 'tomar'],         // "tomarl" → "tomar"
      
      // "comprimido" variations
      [/\bc[oO0]mpr[íi]m[íi]d[oO0]\b/gi, 'comprimido'],
      [/\bc[oO0]mpr[íi]m[íi]d[oO0]s?\b/gi, 'comprimidos'],
      
      // "tableta" variations
      [/\bt[aá]bl[eé]t[aá]s?\b/gi, 'tableta'],
      
      // Numbers and periods
      [/([0-9])\s*[oO]\s*([0-9])/g, '$1.$2'],    // "500 o 5" → "500.5"
      [/([0-9])\s*[,，]\s*([0-9])/g, '$1.$2'],   // "500,5" → "500.5"
      
      // "mg" variations
      [/\bm[gG9]\b/gi, 'mg'],                    // "m9", "mG" → "mg"
      [/\bm[gG]s?\b/gi, 'mg'],                   // "mgs" → "mg"
      
      // "ml" variations  
      [/\bm[lL1]\b/gi, 'ml'],                    // "m1", "mL" → "ml"
      
      // Spanish specific
      [/\b[íi]buprofeno\b/gi, 'ibuprofeno'],     // "Íbuprofeno" → "ibuprofeno"
      [/\b[íi]lbuprofeno\b/gi, 'ibuprofeno'],    // "ilbuprofeno" → "ibuprofeno"
      [/\bparac[eé]tamol\b/gi, 'paracetamol'],   // "paracétamol" → "paracetamol"
      
      // English specific
      [/\btake\s+[oO0]ne\b/gi, 'take one'],      // "take 0ne" → "take one"
      [/\b[oO0]nce\b/gi, 'once'],                // "0nce" → "once"
      [/\btwice\b/gi, 'twice'],
      [/\bdaily\b/gi, 'daily'],
      
      // Time indicators
      [/\ba\.?m\.?\b/gi, 'am'],
      [/\bp\.?m\.?\b/gi, 'pm'],
      
      // Common word fixes
      [/\bv[íi][aá]\b/gi, 'vía'],                // "via" → "vía"
      [/\b[oO0]ral\b/gi, 'oral'],                // "0ral" → "oral"
      [/\bc[oO0]n\b/gi, 'con'],                  // "c0n" → "con"
      [/\bd[eé]spu[eé]s\b/gi, 'después'],        // "despues" → "después"
      [/\bal[íi]mentos?\b/gi, 'alimentos'],      // "alímentos" → "alimentos"
    ];
    
    // Apply all corrections
    for (const [pattern, replacement] of corrections) {
      fixed = fixed.replace(pattern, replacement);
    }
    
    return fixed;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove accents
  }

  /**
   * Checks if a line has potential medication-like words
   * (for handling OCR errors like "clariyromocina" instead of "claritromicina")
   */
  private lineHasPotentialMedication(normalizedLine: string): boolean {
    // Split into words
    const words = normalizedLine.split(/\s+/);
    
    for (const word of words) {
      // Skip short words, numbers, and common words
      if (word.length < 7) continue;
      if (/^\d+$/.test(word)) continue;
      if (/^(tableta|capsula|comprimido|tomar|cada|durante|horas?)$/i.test(word)) continue;
      
      // Check if the word looks like a medication name:
      // - 7+ characters (medication names are usually long)
      // - Contains typical medication endings (including OCR variations)
      const hasMedicationEnding = /(?:cilina|cillna|prazol|praz0l|eno|ena|ina|ino|ocina|omicina|icina|ato|mina|olol|pina|xina|tina|feno)$/.test(word);
      
      // If it matches these criteria, consider it a potential medication
      if (hasMedicationEnding) {
        console.log(`🔍 Potential medication detected by ending: "${word}"`);
        return true;
      }
      
      // Also check if it's similar to any known medication using fuzzy match
      const medicationsToSearch = this.knownMedications.length > 0 
        ? this.knownMedications 
        : medicalPatterns.medications.common_names;
      
      const closestMatch = findClosestMedicationName(
        word,
        medicationsToSearch,
        0.60  // Lower threshold for initial detection to catch more OCR errors
      );
      
      if (closestMatch) {
        console.log(`🔍 Potential medication detected by fuzzy match: "${word}" → "${closestMatch.name}" (${(closestMatch.similarity * 100).toFixed(1)}%)`);
        return true;
      }
    }
    
    return false;
  }

  private async extractMedications(text: string): Promise<Array<{
    name: string;
    dosage: string;
    intervalHours: number;
    durationDays: number;
    administration: string;
    evidence: string;
    confidence: number;
  }>> {
    // Ensure medications are loaded before processing
    await this.ensureMedicationsLoaded();
    
    const medications: Map<string, any> = new Map();
    
    // Text already cleaned by extractPlans
    const lines = text.split('\n');
    const normalized = this.normalizeText(text);

    // Process text in blocks - Split by medication names within lines
    const blocks: string[] = [];
    
    // First, find all medication mentions and their positions
    for (const line of lines) {
      const lineNormalized = this.normalizeText(line);
      
      // Check if line contains any medication names (exact match)
      // Use learned medications + base medications
      const medicationsToSearch = this.knownMedications.length > 0 
        ? this.knownMedications 
        : medicalPatterns.medications.common_names;
      
      const medicationsInLine = medicationsToSearch.filter(
        med => lineNormalized.includes(med)
      );
      
      // If no exact match, check if line has potential medication-like words
      // (words that are 5+ chars, could be typos of medication names)
      const hasPotentialMedication = medicationsInLine.length === 0 
        ? this.lineHasPotentialMedication(lineNormalized)
        : true;
      
      if (!hasPotentialMedication && medicationsInLine.length === 0) {
        // No medication or potential medication in this line, skip
        continue;
      }
      
      // Handle potential medications (no exact match but looks like a medication)
      if (medicationsInLine.length === 0 && hasPotentialMedication) {
        // Potential medication (like OCR typo): take this line + next 2 lines
        let block = line;
        const currentIndex = lines.indexOf(line);
        for (let i = 1; i <= 2; i++) {
          if (currentIndex + i < lines.length) {
            const nextLine = lines[currentIndex + i];
            const nextLineNormalized = this.normalizeText(nextLine);
            // Stop if we find another medication
            const medicationsToCheck = this.knownMedications.length > 0 
              ? this.knownMedications 
              : medicalPatterns.medications.common_names;
            const hasAnotherMed = medicationsToCheck.some(
              med => nextLineNormalized.includes(med)
            );
            if (hasAnotherMed) break;
            block += '\n' + nextLine;
          }
        }
        blocks.push(block.trim());
      } else if (medicationsInLine.length === 1) {
        // Single medication: take this line + next 2 lines
        let block = line;
        const currentIndex = lines.indexOf(line);
        for (let i = 1; i <= 2; i++) {
          if (currentIndex + i < lines.length) {
            const nextLine = lines[currentIndex + i];
            const nextLineNormalized = this.normalizeText(nextLine);
            // Stop if we find another medication
            const medicationsToCheck = this.knownMedications.length > 0 
              ? this.knownMedications 
              : medicalPatterns.medications.common_names;
            const hasAnotherMed = medicationsToCheck.some(
              med => nextLineNormalized.includes(med)
            );
            if (hasAnotherMed) break;
            block += '\n' + nextLine;
          }
        }
        blocks.push(block.trim());
      } else {
        // Multiple medications in same line: split by medication names
        for (const medName of medicationsInLine) {
          // Find where this medication starts in the line
          const medRegex = new RegExp(`(${medName}[^.]*?(?:\\.|$))`, 'gi');
          const matches = line.match(medRegex);
          if (matches) {
            matches.forEach(match => blocks.push(match.trim()));
          }
        }
      }
    }

    // Extract from each block
    for (const block of blocks) {
      const blockNormalized = this.normalizeText(block);
      
      console.log('📝 Processing block:', {
        original: block,
        normalized: blockNormalized
      });
      
      // Find medication name using fuzzy matching
      // Use learned medications + base medications
      const medicationsToSearch = this.knownMedications.length > 0 
        ? this.knownMedications 
        : medicalPatterns.medications.common_names;
      
      // Extract the medication word from the block (usually the first long word)
      const words = blockNormalized.split(/\s+/);
      let medicationWord = '';
      
      for (const word of words) {
        // Skip short words, numbers, and common words
        if (word.length < 7) continue;
        if (/^\d+$/.test(word)) continue;
        if (/^(tableta|capsula|comprimido|tomar|cada|durante|horas?)$/i.test(word)) continue;
        
        // This is likely the medication name
        medicationWord = word;
        break;
      }
      
      // If no medication word found, try with the whole block (fallback)
      const searchTerm = medicationWord || blockNormalized;
      
      console.log('🔍 Searching for medication:', {
        searchTerm,
        blockPreview: blockNormalized.substring(0, 50)
      });
        
      const medicationMatch = findClosestMedicationName(
        searchTerm,
        medicationsToSearch,
        0.55  // Threshold más bajo para aceptar más variaciones
      );
      
      if (!medicationMatch) {
        console.log('⚠️ No medication match found for:', searchTerm);
        continue;
      }
      
      const medName = medicationMatch.name;
      const isSuggestedName = !medicationMatch.isExactMatch;
      
      console.log('💊 Medication matched:', {
        detected: blockNormalized.substring(0, 30),
        matched: medName,
        similarity: medicationMatch.similarity,
        isSuggestion: isSuggestedName
      });

      // Extract dosage
      const dosagePattern = new RegExp(
        `(\\d+(?:\\.\\d+)?)\\s*(${medicalPatterns.medications.dosage_units.join('|')})`,
        'i'
      );
      const dosageMatch = block.match(dosagePattern);
      const dosage = dosageMatch ? `${dosageMatch[1]} ${dosageMatch[2]}` : '1 dosis';

      // Extract frequency
      let intervalHours = 24;
      // Base confidence on medication match similarity
      let confidence = isSuggestedName 
        ? medicationMatch.similarity * 0.7  // Penalizar sugerencias
        : 0.8;  // Match exacto tiene alta confianza inicial

      for (const freqPattern of medicalPatterns.medications.frequency_patterns) {
        const regex = new RegExp(freqPattern.pattern, 'i');
        const match = block.match(regex);
        
        if (match) {
          console.log('⏰ Frequency match:', {
            pattern: freqPattern.pattern,
            type: freqPattern.type,
            fullMatch: match[0],
            capturedNumber: match[1],
            block: block.substring(0, 100)
          });
          
          if (freqPattern.type === 'hours') {
            intervalHours = parseInt(match[1]);
            confidence = 0.9;
          } else if (freqPattern.type === 'times_per_day') {
            const timesPerDay = parseInt(match[1]);
            intervalHours = Math.floor(24 / timesPerDay);
            confidence = 0.85;
          } else if (freqPattern.type === 'days') {
            intervalHours = parseInt(match[1]) * 24;
            confidence = 0.85;
          } else if (freqPattern.type === 'fixed' && freqPattern.hours) {
            intervalHours = freqPattern.hours;
            confidence = 0.85;
          }
          break;
        }
      }

      // Extract duration
      let durationDays = 7;
      for (const durPattern of medicalPatterns.medications.duration_patterns) {
        const regex = new RegExp(durPattern.pattern, 'i');
        const match = block.match(regex);
        
        if (match) {
          console.log('🔍 Duration match:', {
            pattern: durPattern.pattern,
            type: durPattern.type,
            fullMatch: match[0],
            capturedNumber: match[1],
            block: block.substring(0, 100)
          });
          
          if (durPattern.type === 'days') {
            durationDays = parseInt(match[1]);
            confidence = Math.min(confidence + 0.05, 0.95);
          } else if (durPattern.type === 'weeks') {
            durationDays = parseInt(match[1]) * 7;
            confidence = Math.min(confidence + 0.05, 0.95);
          } else if (durPattern.type === 'months') {
            durationDays = parseInt(match[1]) * 30;
            confidence = Math.min(confidence + 0.05, 0.95);
          } else if (durPattern.default_days) {
            durationDays = durPattern.default_days;
          }
          break;
        }
      }

      // Extract administration route
      let administration = 'oral';
      for (const route of medicalPatterns.medications.administration_routes) {
        for (const pattern of route.patterns) {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(block)) {
            administration = route.name;
            break;
          }
        }
        if (administration !== 'oral') break;
      }

      // Create unique key for deduplication
      const capitalizedName = medName.charAt(0).toUpperCase() + medName.slice(1);
      const uniqueKey = `${capitalizedName}_${dosage}_${intervalHours}h_${durationDays}d`;

      if (!medications.has(uniqueKey)) {
        medications.set(uniqueKey, {
          name: capitalizedName,
          dosage,
          intervalHours,
          durationDays,
          administration,
          evidence: block.trim(),
          confidence,
        });
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
    
    // Check if appointment mentioned
    const hasAppointment = medicalPatterns.appointments.keywords.some(keyword => {
      const regex = new RegExp(keyword, 'i');
      return regex.test(text);
    });
    
    if (!hasAppointment) return [];

    // Extract dates
    const monthMap: Record<string, number> = {
      enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
      julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
    };

    for (const datePattern of medicalPatterns.appointments.date_patterns) {
      const regex = new RegExp(datePattern.pattern, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        let datetime: Date | null = null;
        let evidence = match[0];

        if (datePattern.format === 'dd month yyyy') {
          const month = match[2].toLowerCase();
          if (monthMap[month] !== undefined) {
            datetime = new Date(parseInt(match[3]), monthMap[month], parseInt(match[1]));
          }
        } else if (datePattern.format === 'dd/mm/yyyy' || datePattern.format === 'dd-mm-yyyy') {
          datetime = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        }

        if (datetime) {
          // Extract time
          for (const timePattern of medicalPatterns.appointments.time_patterns) {
            const timeRegex = new RegExp(timePattern.pattern, 'i');
            const timeMatch = text.match(timeRegex);
            
            if (timeMatch) {
              let hours = parseInt(timeMatch[1]);
              const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
              
              if (timeMatch[3]?.toLowerCase() === 'pm' && hours < 12) hours += 12;
              if (timeMatch[3]?.toLowerCase() === 'am' && hours === 12) hours = 0;
              
              datetime.setHours(hours, minutes);
              evidence += ` ${timeMatch[0]}`;
              break;
            }
          }

          // Extract location
          const locationPattern = new RegExp(
            `(${medicalPatterns.appointments.location_keywords.join('|')})\\s+[^\\n]+`,
            'i'
          );
          const locationMatch = text.match(locationPattern);
          const location = locationMatch ? locationMatch[0].trim() : null;

          appointments.push({
            title: 'Cita Médica',
            datetime,
            location,
            evidence,
            confidence: 0.85,
          });
        }
      }
    }

    return appointments;
  }

  private extractRecipes(text: string): Array<{
    title: string;
    prepTime: number | null;
    cookTime: number | null;
    ingredients: string[];
    steps: string[];
    evidence: string;
    confidence: number;
  }> {
    const recipes = [];
    const normalized = this.normalizeText(text);

    // Check if it's a recipe (has cooking verbs and ingredients)
    const hasCookingVerbs = cookingPatterns.recipes.action_verbs.some(verb => {
      const regex = new RegExp(verb, 'i');
      return regex.test(normalized);
    });

    const hasIngredients = Object.values(cookingPatterns.recipes.ingredients_categories)
      .flat()
      .some(ingredient => {
        const regex = new RegExp(ingredient, 'i');
        return regex.test(normalized);
      });

    if (!hasCookingVerbs && !hasIngredients) return [];

    // Extract cooking time
    let cookTime: number | null = null;
    for (const timePattern of cookingPatterns.recipes.time_patterns) {
      const regex = new RegExp(timePattern.pattern, 'i');
      const match = text.match(regex);
      
      if (match && match[1]) {
        if (timePattern.type === 'minutes') {
          cookTime = parseInt(match[1]);
        } else if (timePattern.type === 'hours') {
          cookTime = parseInt(match[1]) * 60;
        }
        break;
      }
    }

    // Extract ingredients
    const ingredients: string[] = [];
    Object.values(cookingPatterns.recipes.ingredients_categories)
      .flat()
      .forEach(ingredient => {
        const regex = new RegExp(ingredient, 'gi');
        if (regex.test(text)) {
          ingredients.push(ingredient);
        }
      });

    recipes.push({
      title: 'Receta de Cocina',
      prepTime: null,
      cookTime,
      ingredients: [...new Set(ingredients)], // Remove duplicates
      steps: [],
      evidence: text.substring(0, 200),
      confidence: 0.7,
    });

    return recipes;
  }

  async extractPlans(
    text: string,
    _context?: ExtractorContext
  ): Promise<DocumentParse> {
    // Step 1: Fix common OCR errors before any processing (Layer 1)
    let cleanedText = this.fixCommonOCRErrors(text);
    console.log('🧹 Layer 1: Text cleaned with regex corrections');
    
    const plans = [];

    // Extract medications (Step 2: Pattern matching with dictionaries - Layer 2)
    const medications = await this.extractMedications(cleanedText);
    
    // Step 3: If confidence is low and SymSpell is enabled, try spell correction (Layer 3)
    const lowConfidenceMeds = medications.filter(med => med.confidence < 0.65);
    if (lowConfidenceMeds.length > 0 && this.useSymSpell && this.symSpellInitialized) {
      console.log(`🔤 Layer 3: ${lowConfidenceMeds.length} low-confidence extractions, trying SymSpell...`);
      try {
        const symSpell = getSymSpellService();
        cleanedText = symSpell.correctText(cleanedText);
        console.log('✨ SymSpell applied additional corrections');
        
        // Re-extract with corrected text
        const reExtracted = await this.extractMedications(cleanedText);
        
        // Replace low-confidence items with re-extracted ones if better
        reExtracted.forEach(reMed => {
          const originalIndex = medications.findIndex(
            m => m.name === reMed.name && m.confidence < reMed.confidence
          );
          if (originalIndex >= 0) {
            medications[originalIndex] = reMed;
            console.log(`✅ Improved "${reMed.name}" confidence: ${medications[originalIndex].confidence} → ${reMed.confidence}`);
          }
        });
      } catch (error) {
        console.warn('⚠️ SymSpell failed, using Layer 1+2 results:', error);
      }
    }

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
    const appointments = this.extractAppointments(cleanedText);
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

    // Extract recipes (cooking schedules)
    const recipes = this.extractRecipes(cleanedText);
    for (const recipe of recipes) {
      if (recipe.cookTime) {
        // Create a cooking reminder
        plans.push({
          id: `cook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          mode: 'flexible' as const,
          domain: 'cooking' as const,
          category: 'cooking' as const,
          confidence: recipe.confidence,
          evidence: recipe.evidence,
          flexible_pattern: {
            items: [{
              interval_hours: 24, // Daily cooking
              duration_days: 7,
              title: recipe.title,
              description: `Preparar receta (${recipe.cookTime} min). Ingredientes: ${recipe.ingredients.slice(0, 3).join(', ')}`,
            }],
          },
        });
      }
    }

    return {
      success: plans.length > 0,
      plans,
      raw_text: cleanedText, // Return cleaned text
      errors: plans.length === 0 ? ['No se detectaron medicamentos, citas o recetas en el texto'] : undefined,
      metadata: {
        extraction_model: `pattern-based-v${medicalPatterns.metadata.version}`,
        extraction_timestamp: new Date().toISOString(),
      },
    };
  }

  validate(parse: DocumentParse): string[] {
    return parse.success ? [] : ['Pattern extraction failed'];
  }
}
