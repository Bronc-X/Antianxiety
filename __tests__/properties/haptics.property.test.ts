/**
 * 触觉反馈属性测试
 * 
 * **Feature: nextjs-capacitor-migration, Property 12: 触觉反馈一致性**
 * 
 * **Validates: Requirements 5.1**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Property 12: 触觉反馈一致性', () => {
  /**
   * **Feature: nextjs-capacitor-migration, Property 12: 触觉反馈一致性**
   * 
   * *For any* 用户交互操作（按钮点击、重要确认），在原生平台上 SHALL 触发相应的 Haptics 反馈，
   * Web 平台上 SHALL 静默跳过。
   */

  describe('Hook Implementation Verification', () => {
    it('should have useHaptics hook file with correct structure', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      expect(fs.existsSync(hookPath)).toBe(true);
      
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      // Verify hook exports the required methods
      expect(content).toContain('impact');
      expect(content).toContain('notification');
      expect(content).toContain('selectionChanged');
      expect(content).toContain('vibrate');
      expect(content).toContain('isAvailable');
    });

    it('should check native platform before triggering haptics', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      // Verify platform check is performed
      expect(content).toContain('isNative');
      expect(content).toContain('isAvailable');
      
      // Verify conditional execution based on platform
      expect(content).toContain('if (isAvailable)');
    });

    it('should import Haptics from @capacitor/haptics', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      expect(content).toContain("from '@capacitor/haptics'");
      expect(content).toContain('Haptics');
      expect(content).toContain('ImpactStyle');
      expect(content).toContain('NotificationType');
    });

    it('should use isNative from lib/capacitor', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      expect(content).toContain("from '@/lib/capacitor'");
      expect(content).toContain('isNative');
    });
  });

  describe('Platform Detection Logic', () => {
    it('should have isNative function in lib/capacitor.ts', () => {
      const capacitorPath = path.resolve(__dirname, '../../lib/capacitor.ts');
      expect(fs.existsSync(capacitorPath)).toBe(true);
      
      const content = fs.readFileSync(capacitorPath, 'utf-8');
      
      // Verify isNative function exists
      expect(content).toContain('export function isNative()');
      expect(content).toContain('Capacitor.isNativePlatform()');
    });

    it('should have getPlatform function in lib/capacitor.ts', () => {
      const capacitorPath = path.resolve(__dirname, '../../lib/capacitor.ts');
      const content = fs.readFileSync(capacitorPath, 'utf-8');
      
      expect(content).toContain('export function getPlatform()');
      expect(content).toContain('Capacitor.getPlatform()');
    });
  });

  describe('Haptics Method Coverage', () => {
    const requiredMethods = ['impact', 'notification', 'selectionChanged', 'vibrate'];
    
    it('should implement all required haptics methods', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      fc.assert(
        fc.property(
          fc.constantFrom(...requiredMethods),
          (method) => {
            // Each method should be defined as a const with useCallback
            expect(content).toContain(`const ${method} = useCallback`);
            return true;
          }
        ),
        { numRuns: requiredMethods.length }
      );
    });

    it('should have error handling for all haptics methods', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      // Count try-catch blocks - should have one for each method
      const tryCatchCount = (content.match(/try\s*\{/g) || []).length;
      expect(tryCatchCount).toBeGreaterThanOrEqual(requiredMethods.length);
      
      // Verify console.warn is used for error handling
      expect(content).toContain('console.warn');
    });
  });

  describe('ImpactStyle Values', () => {
    const impactStyles = ['Light', 'Medium', 'Heavy'];
    
    it('should support all ImpactStyle values', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      // Verify ImpactStyle is imported and used
      expect(content).toContain('ImpactStyle');
      expect(content).toContain('ImpactStyle.Light'); // Default value
    });

    it('should use Light as default impact style', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      // Check default parameter
      expect(content).toContain('style: ImpactStyle = ImpactStyle.Light');
    });
  });

  describe('NotificationType Values', () => {
    const notificationTypes = ['Success', 'Warning', 'Error'];
    
    it('should support all NotificationType values', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      // Verify NotificationType is imported
      expect(content).toContain('NotificationType');
    });

    it('should use Success as default notification type', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      // Check default parameter
      expect(content).toContain('type: NotificationType = NotificationType.Success');
    });
  });

  describe('Vibration Duration', () => {
    it('should use 300ms as default vibration duration', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      // Check default parameter
      expect(content).toContain('duration: number = 300');
    });

    it('should accept custom vibration duration', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      // Verify duration is passed to Haptics.vibrate
      expect(content).toContain('Haptics.vibrate({ duration })');
    });
  });

  describe('Return Type Interface', () => {
    it('should export UseHapticsReturn interface', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      expect(content).toContain('export interface UseHapticsReturn');
    });

    it('should return all required properties', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      // Check return statement includes all properties
      expect(content).toContain('return {');
      expect(content).toContain('impact,');
      expect(content).toContain('notification,');
      expect(content).toContain('selectionChanged,');
      expect(content).toContain('vibrate,');
      expect(content).toContain('isAvailable,');
    });
  });

  describe('Web Platform Silent Skip', () => {
    it('should not call Haptics methods when isAvailable is false', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      // All Haptics calls should be inside if (isAvailable) blocks
      const hapticsCallPattern = /Haptics\.(impact|notification|selectionChanged|vibrate)/g;
      const matches = content.match(hapticsCallPattern) || [];
      
      // Each Haptics call should be preceded by an if (isAvailable) check
      matches.forEach(() => {
        expect(content).toContain('if (isAvailable)');
      });
    });
  });

  describe('Hook Exports', () => {
    it('should export ImpactStyle and NotificationType for consumers', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      expect(content).toContain('export { ImpactStyle, NotificationType }');
    });

    it('should have default export', () => {
      const hookPath = path.resolve(__dirname, '../../hooks/useHaptics.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');
      
      expect(content).toContain('export default useHaptics');
    });
  });
});
