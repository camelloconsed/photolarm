/**
 * SymSpell Spell Checker Service
 * Layer 3 of OCR error correction system
 * Used as fallback when confidence is low
 * 
 * React Native compatible - uses in-memory dictionary
 */

import SymSpell from 'symspell';

// Spanish medical dictionary embedded
const SPANISH_DICTIONARY = `
paracetamol 1000000
ibuprofeno 900000
amoxicilina 800000
omeprazol 700000
diclofenaco 600000
naproxeno 550000
aspirina 500000
metformina 450000
losartan 400000
atorvastatina 380000
días 1000000
día 950000
horas 1000000
hora 950000
cada 1000000
por 1000000
durante 900000
tomar 950000
tableta 900000
tabletas 900000
comprimido 900000
comprimidos 900000
cápsula 850000
cápsulas 850000
miligramos 900000
gramos 900000
oral 850000
vía 900000
con 1000000
sin 950000
antes 900000
después 900000
alimentos 850000
comidas 850000
mañana 800000
tarde 800000
noche 800000
`.trim();

export class SymSpellService {
  private symSpell: any;
  private initialized = false;

  constructor() {
    this.symSpell = new SymSpell();
  }

  /**
   * Initialize SymSpell with Spanish dictionary
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Parse dictionary from string (React Native compatible)
      const lines = SPANISH_DICTIONARY.split('\n');
      
      for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
          const [word, frequency] = line.split(' ');
          if (word && frequency) {
            this.symSpell.createDictionaryEntry(word, parseInt(frequency, 10));
          }
        }
      }
      
      this.initialized = true;
      console.log('✅ SymSpell initialized with Spanish dictionary (React Native)');
    } catch (error) {
      console.warn('⚠️ SymSpell initialization failed, continuing without spell check:', error);
      this.initialized = false;
    }
  }

  /**
   * Correct spelling errors in text
   * @param text Input text with potential errors
   * @param maxEditDistance Maximum edit distance for suggestions (default: 2)
   * @returns Corrected text
   */
  correctText(text: string, maxEditDistance: number = 2): string {
    if (!this.initialized) {
      console.warn('⚠️ SymSpell not initialized, returning original text');
      return text;
    }

    try {
      const words = text.split(/\s+/);
      const correctedWords: string[] = [];

      for (const word of words) {
        // Skip numbers and very short words
        if (/^\d+$/.test(word) || word.length < 3) {
          correctedWords.push(word);
          continue;
        }

        // Get suggestions from SymSpell
        const suggestions = this.symSpell.lookup(word, 2, maxEditDistance);
        
        if (suggestions && suggestions.length > 0) {
          // Use the first (best) suggestion
          const bestSuggestion = suggestions[0];
          correctedWords.push(bestSuggestion.term);
          
          if (bestSuggestion.term !== word) {
            console.log(`🔤 SymSpell: "${word}" → "${bestSuggestion.term}"`);
          }
        } else {
          // No suggestions, keep original
          correctedWords.push(word);
        }
      }

      return correctedWords.join(' ');
    } catch (error) {
      console.error('❌ SymSpell correction error:', error);
      return text;
    }
  }

  /**
   * Check if a word is spelled correctly
   */
  isCorrect(word: string): boolean {
    if (!this.initialized) return true;
    
    const suggestions = this.symSpell.lookup(word, 2, 0);
    return suggestions && suggestions.length > 0 && suggestions[0].term === word.toLowerCase();
  }
}

// Singleton instance
let symSpellInstance: SymSpellService | null = null;

export function getSymSpellService(): SymSpellService {
  if (!symSpellInstance) {
    symSpellInstance = new SymSpellService();
  }
  return symSpellInstance;
}
