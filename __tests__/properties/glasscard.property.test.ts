/**
 * GlassCard 样式属性测试
 * 
 * **Feature: nextjs-capacitor-migration, Property 7: GlassCard 样式**
 * 
 * **Validates: Requirements 6.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Required GlassCard styles per design spec:
 * - backdrop-blur-md
 * - bg-white/80 (light mode)
 * - dark:bg-gray-900/80 (dark mode)
 * - shadow-lg
 * - rounded-2xl
 * - border border-white/20
 */
const REQUIRED_CLASSES = {
  backdropBlur: 'backdrop-blur-md',
  lightBackground: 'bg-white/80',
  darkBackground: 'dark:bg-gray-900/80',
  shadow: 'shadow-lg',
  rounded: 'rounded-2xl',
  border: 'border',
  borderColor: 'border-white/20'
};

describe('Property 7: GlassCard 样式', () => {
  /**
   * **Feature: nextjs-capacitor-migration, Property 7: GlassCard 样式**
   * 
   * *For any* GlassCard 组件，className SHALL 包含 backdrop-blur-md、
   * bg-white/80（或 dark 模式下的等效值）和 shadow-lg。
   */

  const glassCardPath = path.resolve(__dirname, '../../components/layout/GlassCard.tsx');
  
  it('should verify GlassCard component file exists', () => {
    expect(fs.existsSync(glassCardPath)).toBe(true);
  });

  it('should verify GlassCard contains backdrop-blur-md class', () => {
    const content = fs.readFileSync(glassCardPath, 'utf-8');
    expect(content).toContain(REQUIRED_CLASSES.backdropBlur);
  });

  it('should verify GlassCard contains bg-white/80 for light mode', () => {
    const content = fs.readFileSync(glassCardPath, 'utf-8');
    expect(content).toContain(REQUIRED_CLASSES.lightBackground);
  });

  it('should verify GlassCard contains dark:bg-gray-900/80 for dark mode', () => {
    const content = fs.readFileSync(glassCardPath, 'utf-8');
    expect(content).toContain(REQUIRED_CLASSES.darkBackground);
  });

  it('should verify GlassCard contains shadow-lg class', () => {
    const content = fs.readFileSync(glassCardPath, 'utf-8');
    expect(content).toContain(REQUIRED_CLASSES.shadow);
  });

  it('should verify GlassCard contains rounded-2xl class', () => {
    const content = fs.readFileSync(glassCardPath, 'utf-8');
    expect(content).toContain(REQUIRED_CLASSES.rounded);
  });

  it('should verify GlassCard contains border styling', () => {
    const content = fs.readFileSync(glassCardPath, 'utf-8');
    expect(content).toContain(REQUIRED_CLASSES.border);
    expect(content).toContain(REQUIRED_CLASSES.borderColor);
  });

  it('should verify all required glassmorphism classes are present', () => {
    const content = fs.readFileSync(glassCardPath, 'utf-8');
    
    // All core glassmorphism classes must be present
    const coreClasses = [
      REQUIRED_CLASSES.backdropBlur,
      REQUIRED_CLASSES.lightBackground,
      REQUIRED_CLASSES.shadow
    ];
    
    coreClasses.forEach(cls => {
      expect(content).toContain(cls);
    });
  });

  it('should verify GlassCard style consistency across random class combinations', () => {
    const content = fs.readFileSync(glassCardPath, 'utf-8');
    
    fc.assert(
      fc.property(
        fc.constantFrom(
          REQUIRED_CLASSES.backdropBlur,
          REQUIRED_CLASSES.lightBackground,
          REQUIRED_CLASSES.darkBackground,
          REQUIRED_CLASSES.shadow,
          REQUIRED_CLASSES.rounded
        ),
        (requiredClass) => {
          // Each required class should be present in the component
          expect(content).toContain(requiredClass);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify GlassCard supports hover prop', () => {
    const content = fs.readFileSync(glassCardPath, 'utf-8');
    
    // Component should have hover prop in interface
    expect(content).toMatch(/hover\??\s*:\s*boolean/);
    
    // Component should have hover animation logic
    expect(content).toContain('whileHover');
  });

  it('should verify GlassCard hover animation uses correct scale', () => {
    const content = fs.readFileSync(glassCardPath, 'utf-8');
    
    // Per design spec, hover should scale to 1.02
    expect(content).toMatch(/scale:\s*1\.02/);
  });

  it('should verify GlassCard is a client component', () => {
    const content = fs.readFileSync(glassCardPath, 'utf-8');
    
    // Should have 'use client' directive for Framer Motion
    expect(content).toContain("'use client'");
  });

  it('should verify GlassCard exports are correct', () => {
    const indexPath = path.resolve(__dirname, '../../components/layout/index.ts');
    
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      expect(indexContent).toContain('GlassCard');
    }
  });
});
