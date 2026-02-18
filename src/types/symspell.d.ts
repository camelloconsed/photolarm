declare module 'symspell' {
  export interface SymSpellSuggestion {
    term: string;
    distance: number;
    count: number;
  }

  export default class SymSpell {
    constructor();
    loadDictionary(path: string, termIndex: number, countIndex: number): Promise<void>;
    lookup(input: string, verbosity: number, maxEditDistance: number): SymSpellSuggestion[];
  }
}
