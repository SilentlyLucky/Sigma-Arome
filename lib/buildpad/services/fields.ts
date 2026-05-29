/**
 * @buildpad-origin @buildpad/services/services/fields
 * @buildpad-version 0.2.0
 *
 * This file was copied from Buildpad UI Packages.
 * To update, run: npx @buildpad/cli add services/fields --overwrite
 *
 * Docs: https://buildpad.dev/components/services/fields
 */

/**
 * FieldsService - Service for managing database fields/columns
 * 
 * Uses Next.js API routes to proxy requests to DaaS backend (avoids CORS)
 */

import type { Field } from '@/lib/buildpad/types';
import { apiRequest } from './api-request';

/**
 * Simple in-memory cache for field metadata.
 * Fields rarely change during a session — caching for 5 minutes
 * dramatically reduces fetch time (complaint #2).
 */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const fieldCache = new Map<string, { data: Field[]; timestamp: number }>();

/**
 * Fields Service
 */
export class FieldsService {
  /**
   * Read all fields across all collections or in a specific collection.
   * Results are cached in-memory for 5 minutes to reduce network calls.
   */
  async readAll(collection?: string): Promise<Field[]> {
    const cacheKey = collection || '__all__';
    const cached = fieldCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const path = collection
        ? `/api/fields/${collection}`
        : '/api/fields';

      // Handle both { data: Field[] } (DaaS) and Field[] (DaaS flat) formats
      const response = await apiRequest<{ data: Field[] } | Field[]>(path);
      const fields = Array.isArray(response) ? response : (response.data || []);
      
      // Cache the result
      fieldCache.set(cacheKey, { data: fields, timestamp: Date.now() });
      return fields;
    } catch (error) {
      console.error('Error fetching fields:', error);
      return [];
    }
  }

  /**
   * Invalidate the cache for a specific collection or all collections.
   */
  static invalidateCache(collection?: string) {
    if (collection) {
      fieldCache.delete(collection);
    } else {
      fieldCache.clear();
    }
  }

  /**
   * Read a single field
   */
  async readOne(collection: string, field: string): Promise<Field> {
    const response = await apiRequest<{ data: Field } | Field>(`/api/fields/${collection}/${field}`);
    // Handle both { data: Field } (DaaS) and flat Field (DaaS) formats
    const fieldData = (response as { data: Field }).data ?? response;
    if (!fieldData || !(fieldData as Field).field) {
      throw new Error(`Field not found: ${collection}.${field}`);
    }
    return fieldData as Field;
  }
}

/**
 * Factory function to create a new FieldsService instance
 */
export function createFieldsService(): FieldsService {
  return new FieldsService();
}
