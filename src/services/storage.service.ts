/**
 * Storage Service - Persistencia Local
 * 
 * Proporciona persistencia local con type safety y serialización automática JSON.
 * 
 * NOTA: Actualmente usa AsyncStorage. Para producción, migrar a MMKV cuando
 * se configure el entorno nativo (requiere rebuild).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IStorageService } from './interfaces';

/**
 * Implementación de almacenamiento usando AsyncStorage
 * 
 * TODO: Migrar a MMKV para mejor performance cuando se configure native
 * 
 * @example
 * ```typescript
 * const storage = new StorageService();
 * 
 * // Guardar datos
 * await storage.set('user', { id: 1, name: 'John' });
 * 
 * // Leer datos
 * const user = await storage.get<User>('user');
 * 
 * // Eliminar
 * await storage.delete('user');
 * 
 * // Limpiar todo
 * await storage.clear();
 * ```
 */
export class StorageService implements IStorageService {
  private prefix: string;

  constructor(prefix: string = 'photolarm') {
    this.prefix = prefix;
  }

  /**
   * Genera la clave con prefijo
   */
  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Guarda un valor en el storage
   * Serializa automáticamente objetos a JSON
   * 
   * @param key - Clave única para identificar el dato
   * @param value - Valor a guardar (cualquier tipo serializable)
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(this.getKey(key), jsonValue);
    } catch (error) {
      console.error(`[Storage] Error saving key "${key}":`, error);
      throw new Error(`Failed to save data for key "${key}"`);
    }
  }

  /**
   * Lee un valor del storage
   * Deserializa automáticamente JSON a objeto
   * 
   * @param key - Clave del dato a leer
   * @returns El valor deserializado o null si no existe
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(this.getKey(key));
      
      if (jsonValue === null) {
        return null;
      }

      return JSON.parse(jsonValue) as T;
    } catch (error) {
      console.error(`[Storage] Error reading key "${key}":`, error);
      return null;
    }
  }

  /**
   * Elimina un valor del storage
   * 
   * @param key - Clave del dato a eliminar
   */
  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`[Storage] Error deleting key "${key}":`, error);
      throw new Error(`Failed to delete data for key "${key}"`);
    }
  }

  /**
   * Limpia todo el storage con el prefijo actual
   * ⚠️ CUIDADO: Esta operación es irreversible
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      await AsyncStorage.multiRemove(keys.map(k => this.getKey(k)));
      console.log('[Storage] All data cleared');
    } catch (error) {
      console.error('[Storage] Error clearing storage:', error);
      throw new Error('Failed to clear storage');
    }
  }

  /**
   * Verifica si una clave existe en el storage
   * 
   * @param key - Clave a verificar
   * @returns true si la clave existe
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.getKey(key));
      return value !== null;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene todas las claves almacenadas con el prefijo actual
   * 
   * @returns Array de todas las claves (sin prefijo)
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const prefixLength = this.prefix.length + 1; // +1 por el ":"
      
      return allKeys
        .filter((key: string) => key.startsWith(`${this.prefix}:`))
        .map((key: string) => key.substring(prefixLength));
    } catch (error) {
      console.error('[Storage] Error getting keys:', error);
      return [];
    }
  }

  /**
   * Obtiene múltiples valores de una vez
   * Útil para batch operations
   * 
   * @param keys - Array de claves a leer
   * @returns Object con los valores encontrados
   */
  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};

    try {
      const prefixedKeys = keys.map(k => this.getKey(k));
      const values = await AsyncStorage.multiGet(prefixedKeys);

      values.forEach(([fullKey, value]: readonly [string, string | null], index: number) => {
        const originalKey = keys[index];
        if (value !== null) {
          try {
            result[originalKey] = JSON.parse(value) as T;
          } catch {
            result[originalKey] = null;
          }
        } else {
          result[originalKey] = null;
        }
      });
    } catch (error) {
      console.error('[Storage] Error getting multiple values:', error);
      // Devuelve todas las claves como null en caso de error
      keys.forEach(key => {
        result[key] = null;
      });
    }

    return result;
  }

  /**
   * Guarda múltiples valores de una vez
   * 
   * @param items - Object con key-value pairs a guardar
   */
  async setMultiple(items: Record<string, any>): Promise<void> {
    try {
      const pairs: [string, string][] = Object.entries(items).map(
        ([key, value]) => [this.getKey(key), JSON.stringify(value)]
      );
      
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('[Storage] Error setting multiple values:', error);
      throw new Error('Failed to set multiple values');
    }
  }
}

/**
 * Instancia singleton del storage service
 * Usa esta instancia compartida en toda la app
 */
export const storageService = new StorageService();

/**
 * Mock Storage Service para testing
 * No persiste datos - solo en memoria
 */
export class MockStorageService implements IStorageService {
  private store: Map<string, string> = new Map();

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, JSON.stringify(value));
  }

  async get<T>(key: string): Promise<T | null> {
    const value = this.store.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};
    for (const key of keys) {
      result[key] = await this.get<T>(key);
    }
    return result;
  }

  async setMultiple(items: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      await this.set(key, value);
    }
  }

  getSize(): number {
    return Array.from(this.store.values()).reduce(
      (acc, val) => acc + val.length,
      0
    );
  }

  /**
   * Útil para tests - obtener todo el contenido
   */
  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    this.store.forEach((value, key) => {
      try {
        result[key] = JSON.parse(value);
      } catch {
        result[key] = value;
      }
    });
    return result;
  }
}
