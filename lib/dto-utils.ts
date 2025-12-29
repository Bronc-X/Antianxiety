/**
 * DTO (Data Transfer Object) Utilities
 * 
 * Ensures data returned from Server Actions is JSON-serializable.
 * Server Actions have serialization limits - they cannot return:
 * - Date objects (use ISO strings)
 * - Class instances (use plain objects)
 * - Set/Map (use arrays/objects)
 * - Functions
 * - Symbols
 * 
 * Requirements: 7.6, 7.7
 */

/**
 * Convert a Date to ISO string.
 * Handles both Date objects and existing strings.
 * 
 * @param date - Date object or string
 * @returns ISO string representation
 */
export function dateToISO(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString();
}

/**
 * Convert a Date to ISO string, with default value.
 * 
 * @param date - Date object or string
 * @param defaultValue - Default value if date is null/undefined
 * @returns ISO string representation
 */
export function dateToISOWithDefault(
  date: Date | string | null | undefined, 
  defaultValue: string
): string {
  return dateToISO(date) ?? defaultValue;
}

/**
 * Check if a value is a plain object (not a class instance).
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Check if a value is JSON-serializable.
 * 
 * @param value - Any value to check
 * @returns true if the value can be safely serialized
 */
export function isSerializable(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  
  const type = typeof value;
  
  // Primitives are always serializable
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return true;
  }
  
  // Functions and symbols are never serializable
  if (type === 'function' || type === 'symbol') {
    return false;
  }
  
  // Date objects are not directly serializable
  if (value instanceof Date) {
    return false;
  }
  
  // Set and Map are not serializable
  if (value instanceof Set || value instanceof Map) {
    return false;
  }
  
  // Arrays: check all elements
  if (Array.isArray(value)) {
    return value.every(isSerializable);
  }
  
  // Objects: must be plain objects with serializable values
  if (isPlainObject(value)) {
    return Object.values(value).every(isSerializable);
  }
  
  // Class instances are not serializable
  return false;
}

/**
 * Deep convert an object to be JSON-serializable.
 * - Converts Date objects to ISO strings
 * - Converts Set to Array
 * - Converts Map to Object
 * - Strips functions and symbols
 * 
 * @param obj - Object to convert
 * @returns Serializable version of the object
 */
export function toSerializable<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle Date
  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }
  
  // Handle Set -> Array
  if (obj instanceof Set) {
    return Array.from(obj).map(toSerializable) as unknown as T;
  }
  
  // Handle Map -> Object
  if (obj instanceof Map) {
    const result: Record<string, unknown> = {};
    obj.forEach((value, key) => {
      if (typeof key === 'string') {
        result[key] = toSerializable(value);
      }
    });
    return result as unknown as T;
  }
  
  // Handle Array
  if (Array.isArray(obj)) {
    return obj.map(toSerializable) as unknown as T;
  }
  
  // Handle plain objects
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip functions and symbols
      if (typeof value === 'function' || typeof value === 'symbol') {
        continue;
      }
      result[key] = toSerializable(value);
    }
    return result as unknown as T;
  }
  
  // Primitives pass through
  return obj;
}

/**
 * Assert that a value is serializable, throwing if not.
 * Use this in development to catch serialization issues early.
 * 
 * @param value - Value to check
 * @param context - Context string for error message
 * @throws Error if value is not serializable
 */
export function assertSerializable(value: unknown, context: string): void {
  if (process.env.NODE_ENV === 'development') {
    if (!isSerializable(value)) {
      console.error(`Non-serializable value in ${context}:`, value);
      throw new Error(
        `Server Action returned non-serializable data in ${context}. ` +
        `Use toSerializable() to convert Date, Set, Map, or class instances.`
      );
    }
  }
}

/**
 * Wrap a Server Action result to ensure it's serializable.
 * Use this as the last step before returning from a Server Action.
 * 
 * @param result - ActionResult to wrap
 * @returns Serializable ActionResult
 * 
 * @example
 * export async function getDashboardData(): Promise<ActionResult<DashboardData>> {
 *   const data = await fetchData();
 *   return ensureSerializableResult({ success: true, data });
 * }
 */
export function ensureSerializableResult<T>(result: {
  success: boolean;
  data?: T;
  error?: string;
}): { success: boolean; data?: T; error?: string } {
  return toSerializable(result);
}
