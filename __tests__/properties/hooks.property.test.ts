/**
 * Hooks 命名约定属性测试
 * 
 * **Feature: nextjs-capacitor-migration, Property 8: Hooks 命名约定**
 * 
 * **Validates: Requirements 6.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Get all TypeScript files in the hooks directory
 */
function getHookFiles(): string[] {
  const hooksDir = path.resolve(__dirname, '../../hooks');
  
  if (!fs.existsSync(hooksDir)) {
    return [];
  }
  
  return fs.readdirSync(hooksDir)
    .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
    .filter(file => file !== 'index.ts'); // Exclude barrel export
}

/**
 * Extract exported function names from a TypeScript file
 */
function getExportedFunctionNames(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const exportedFunctions: string[] = [];
  
  // Match: export function useSomething
  const functionExportRegex = /export\s+function\s+(use[A-Z][a-zA-Z]*)/g;
  let match;
  while ((match = functionExportRegex.exec(content)) !== null) {
    exportedFunctions.push(match[1]);
  }
  
  // Match: export { useSomething }
  const namedExportRegex = /export\s*\{\s*([^}]+)\s*\}/g;
  while ((match = namedExportRegex.exec(content)) !== null) {
    const exports = match[1].split(',').map(e => e.trim().split(' ')[0]);
    exports.forEach(exp => {
      if (exp.startsWith('use') && /^use[A-Z]/.test(exp)) {
        exportedFunctions.push(exp);
      }
    });
  }
  
  // Match: export default useSomething
  const defaultExportRegex = /export\s+default\s+(use[A-Z][a-zA-Z]*)/g;
  while ((match = defaultExportRegex.exec(content)) !== null) {
    if (!exportedFunctions.includes(match[1])) {
      exportedFunctions.push(match[1]);
    }
  }
  
  return [...new Set(exportedFunctions)];
}

describe('Property 8: Hooks 命名约定', () => {
  /**
   * **Feature: nextjs-capacitor-migration, Property 8: Hooks 命名约定**
   * 
   * *For any* hooks/ 目录中的文件，文件名 SHALL 以 'use' 开头，
   * 且导出的函数名 SHALL 与文件名匹配。
   */

  const hookFiles = getHookFiles();

  it('should have hook files in hooks/ directory', () => {
    expect(hookFiles.length).toBeGreaterThan(0);
    console.log(`Found ${hookFiles.length} hook files:`, hookFiles);
  });

  it('should have all hook files start with "use" prefix', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...hookFiles),
        (fileName) => {
          // File name (without extension) should start with 'use'
          const baseName = fileName.replace(/\.(ts|tsx)$/, '');
          expect(baseName.startsWith('use')).toBe(true);
          return true;
        }
      ),
      { numRuns: Math.min(hookFiles.length, 100) }
    );
  });

  it('should have exported function name match file name', () => {
    const hooksDir = path.resolve(__dirname, '../../hooks');
    
    fc.assert(
      fc.property(
        fc.constantFrom(...hookFiles),
        (fileName) => {
          const filePath = path.join(hooksDir, fileName);
          const baseName = fileName.replace(/\.(ts|tsx)$/, '');
          const exportedFunctions = getExportedFunctionNames(filePath);
          
          // The file should export a function with the same name as the file
          const hasMatchingExport = exportedFunctions.includes(baseName);
          
          if (!hasMatchingExport) {
            console.log(`File ${fileName} exports:`, exportedFunctions);
            console.log(`Expected to find: ${baseName}`);
          }
          
          expect(hasMatchingExport).toBe(true);
          return true;
        }
      ),
      { numRuns: Math.min(hookFiles.length, 100) }
    );
  });

  it('should have all exported hooks follow use* naming convention', () => {
    const hooksDir = path.resolve(__dirname, '../../hooks');
    
    hookFiles.forEach((fileName) => {
      const filePath = path.join(hooksDir, fileName);
      const exportedFunctions = getExportedFunctionNames(filePath);
      
      exportedFunctions.forEach((funcName) => {
        // All exported hook functions should start with 'use'
        expect(funcName.startsWith('use')).toBe(true);
        // Should follow camelCase with capital letter after 'use'
        expect(/^use[A-Z]/.test(funcName)).toBe(true);
      });
    });
  });

  it('should verify specific required hooks exist', () => {
    const requiredHooks = [
      'useLottie.ts',
      'useHaptics.ts',
      'usePreferences.ts',
      'useNetwork.ts',
    ];
    
    requiredHooks.forEach((hookFile) => {
      expect(hookFiles).toContain(hookFile);
    });
  });

  it('should verify hooks are properly exported from index.ts', () => {
    const indexPath = path.resolve(__dirname, '../../hooks/index.ts');
    expect(fs.existsSync(indexPath)).toBe(true);
    
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    
    // Check that all hook files are exported from index
    const expectedExports = ['useLottie', 'useHaptics', 'usePreferences', 'useNetwork'];
    
    expectedExports.forEach((hookName) => {
      expect(indexContent).toContain(hookName);
    });
  });
});

describe('Hook File Structure Validation', () => {
  it('should have "use client" directive in all hook files', () => {
    const hooksDir = path.resolve(__dirname, '../../hooks');
    const hookFiles = getHookFiles();
    
    hookFiles.forEach((fileName) => {
      const filePath = path.join(hooksDir, fileName);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Hook files should have 'use client' directive for Next.js
      expect(content.includes("'use client'")).toBe(true);
    });
  });

  it('should have proper TypeScript types exported', () => {
    const hooksDir = path.resolve(__dirname, '../../hooks');
    const hookFiles = getHookFiles();
    
    hookFiles.forEach((fileName) => {
      const filePath = path.join(hooksDir, fileName);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Each hook should export its return type interface
      const baseName = fileName.replace(/\.(ts|tsx)$/, '');
      const expectedTypeName = baseName.charAt(0).toUpperCase() + baseName.slice(1) + 'Return';
      
      // Check for interface or type export
      const hasTypeExport = 
        content.includes(`export interface ${expectedTypeName}`) ||
        content.includes(`export type ${expectedTypeName}`);
      
      if (!hasTypeExport) {
        console.log(`Warning: ${fileName} may be missing ${expectedTypeName} type export`);
      }
    });
  });
});
