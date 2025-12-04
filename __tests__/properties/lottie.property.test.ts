import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * **Feature: nextjs-capacitor-migration, Property 11: Lottie 动画加载**
 * *For any* Lottie 动画组件，SHALL 从 /lottie/ 目录加载 JSON 文件，且动画数据 SHALL 为有效的 Lottie JSON 格式。
 * **Validates: Requirements 4.1**
 */

// Lottie JSON format required fields according to Lottie specification
interface LottieJSON {
  v: string;      // Lottie version
  fr: number;     // Frame rate
  ip: number;     // In point (start frame)
  op: number;     // Out point (end frame)
  w: number;      // Width
  h: number;      // Height
  nm: string;     // Name
  ddd?: number;   // 3D flag (optional)
  assets?: unknown[];  // Assets array (optional)
  layers: unknown[];   // Layers array (required)
}

// Helper function to check if an object is a valid Lottie JSON
function isValidLottieJSON(data: unknown): data is LottieJSON {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  
  // Check required fields
  return (
    typeof obj.v === 'string' &&           // Version must be string
    typeof obj.fr === 'number' &&          // Frame rate must be number
    typeof obj.ip === 'number' &&          // In point must be number
    typeof obj.op === 'number' &&          // Out point must be number
    typeof obj.w === 'number' &&           // Width must be number
    typeof obj.h === 'number' &&           // Height must be number
    typeof obj.nm === 'string' &&          // Name must be string
    Array.isArray(obj.layers) &&           // Layers must be array
    obj.ip >= 0 &&                         // In point must be non-negative
    obj.op > obj.ip &&                     // Out point must be greater than in point
    obj.w > 0 &&                           // Width must be positive
    obj.h > 0 &&                           // Height must be positive
    obj.fr > 0                             // Frame rate must be positive
  );
}

// Get all Lottie JSON files from the public/lottie directory
function getLottieFiles(): string[] {
  const lottieDir = path.join(process.cwd(), 'public', 'lottie');
  
  if (!fs.existsSync(lottieDir)) {
    return [];
  }
  
  return fs.readdirSync(lottieDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(lottieDir, file));
}

// Load and parse a Lottie JSON file
function loadLottieFile(filePath: string): unknown {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

describe('Property 11: Lottie 动画加载', () => {
  const lottieFiles = getLottieFiles();
  
  it('SHALL have Lottie JSON files in /lottie/ directory', () => {
    expect(lottieFiles.length).toBeGreaterThan(0);
  });

  it('*For any* Lottie JSON file, SHALL be valid JSON format', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...lottieFiles),
        (filePath) => {
          // Should not throw when parsing
          const data = loadLottieFile(filePath);
          return data !== null && typeof data === 'object';
        }
      ),
      { numRuns: Math.min(100, lottieFiles.length * 10) }
    );
  });

  it('*For any* Lottie JSON file, SHALL have required Lottie format fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...lottieFiles),
        (filePath) => {
          const data = loadLottieFile(filePath);
          return isValidLottieJSON(data);
        }
      ),
      { numRuns: Math.min(100, lottieFiles.length * 10) }
    );
  });

  it('*For any* Lottie JSON file, SHALL have valid version string', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...lottieFiles),
        (filePath) => {
          const data = loadLottieFile(filePath) as LottieJSON;
          // Version should match pattern like "5.7.4" or similar
          return /^\d+\.\d+(\.\d+)?$/.test(data.v);
        }
      ),
      { numRuns: Math.min(100, lottieFiles.length * 10) }
    );
  });

  it('*For any* Lottie JSON file, SHALL have positive dimensions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...lottieFiles),
        (filePath) => {
          const data = loadLottieFile(filePath) as LottieJSON;
          return data.w > 0 && data.h > 0;
        }
      ),
      { numRuns: Math.min(100, lottieFiles.length * 10) }
    );
  });

  it('*For any* Lottie JSON file, SHALL have valid frame range (op > ip >= 0)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...lottieFiles),
        (filePath) => {
          const data = loadLottieFile(filePath) as LottieJSON;
          return data.ip >= 0 && data.op > data.ip;
        }
      ),
      { numRuns: Math.min(100, lottieFiles.length * 10) }
    );
  });

  it('*For any* Lottie JSON file, SHALL have positive frame rate', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...lottieFiles),
        (filePath) => {
          const data = loadLottieFile(filePath) as LottieJSON;
          return data.fr > 0;
        }
      ),
      { numRuns: Math.min(100, lottieFiles.length * 10) }
    );
  });

  it('*For any* Lottie JSON file, SHALL have non-empty layers array', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...lottieFiles),
        (filePath) => {
          const data = loadLottieFile(filePath) as LottieJSON;
          return Array.isArray(data.layers) && data.layers.length > 0;
        }
      ),
      { numRuns: Math.min(100, lottieFiles.length * 10) }
    );
  });

  it('*For any* Lottie JSON file, SHALL have a descriptive name', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...lottieFiles),
        (filePath) => {
          const data = loadLottieFile(filePath) as LottieJSON;
          return typeof data.nm === 'string' && data.nm.trim().length > 0;
        }
      ),
      { numRuns: Math.min(100, lottieFiles.length * 10) }
    );
  });
});
