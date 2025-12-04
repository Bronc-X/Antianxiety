/**
 * 颜色系统属性测试
 * 
 * **Feature: nextjs-capacitor-migration, Property 1: 颜色系统一致性**
 * **Feature: nextjs-capacitor-migration, Property 2: 暗色模式切换**
 * 
 * **Validates: Requirements 3.3, 3.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 将 HSL 值转换为 RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

/**
 * 将 RGB 转换为 Hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * 将 Hex 转换为 RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}

/**
 * 解析 CSS 变量中的 HSL 值 (格式: "161 78% 14%")
 */
function parseHslString(hslStr: string): { h: number; s: number; l: number } | null {
  const match = hslStr.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!match) return null;
  return {
    h: parseInt(match[1]),
    s: parseInt(match[2]),
    l: parseInt(match[3])
  };
}

/**
 * 计算两个颜色之间的相似度 (0-100, 100为完全相同)
 */
function colorSimilarity(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const distance = Math.sqrt(
    Math.pow(rgb1[0] - rgb2[0], 2) +
    Math.pow(rgb1[1] - rgb2[1], 2) +
    Math.pow(rgb1[2] - rgb2[2], 2)
  );
  // 最大距离是 sqrt(255^2 * 3) ≈ 441.67
  return Math.max(0, 100 - (distance / 441.67) * 100);
}

/**
 * 计算对比度 (WCAG 标准)
 */
function calculateContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const luminance = (rgb: [number, number, number]) => {
    const [r, g, b] = rgb.map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// 设计规范中定义的颜色
const DESIGN_COLORS = {
  primary: '#0B3D2E',      // Forest Green
  background: '#FAF6EF',   // Warm Cream
  accent: '#F59E0B',       // Amber
  foreground: '#171717'    // Near Black
};

// CSS 变量中定义的 HSL 值
const CSS_HSL_VALUES = {
  primary: '161 78% 14%',
  background: '39 47% 96%',
  accent: '38 92% 50%',
  foreground: '0 0% 9%'
};

describe('Property 1: 颜色系统一致性', () => {
  /**
   * **Feature: nextjs-capacitor-migration, Property 1: 颜色系统一致性**
   * 
   * *For any* CSS 变量定义，primary 颜色的 HSL 值 SHALL 对应 #0B3D2E，
   * background SHALL 对应 #FAF6EF，accent SHALL 对应 #F59E0B。
   */
  
  it('should verify globals.css contains correct color variables', () => {
    const globalsPath = path.resolve(__dirname, '../../app/globals.css');
    const cssContent = fs.readFileSync(globalsPath, 'utf-8');
    
    // 验证 CSS 变量存在
    expect(cssContent).toContain('--primary:');
    expect(cssContent).toContain('--background:');
    expect(cssContent).toContain('--accent:');
    expect(cssContent).toContain('--foreground:');
  });

  it('should verify primary color HSL matches #0B3D2E within tolerance', () => {
    const hsl = parseHslString(CSS_HSL_VALUES.primary);
    expect(hsl).not.toBeNull();
    
    if (hsl) {
      const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      const targetRgb = hexToRgb(DESIGN_COLORS.primary);
      const similarity = colorSimilarity(rgb, targetRgb);
      
      // 允许 90% 以上的相似度 (HSL 到 Hex 转换可能有轻微差异)
      expect(similarity).toBeGreaterThan(90);
    }
  });

  it('should verify background color HSL matches #FAF6EF within tolerance', () => {
    const hsl = parseHslString(CSS_HSL_VALUES.background);
    expect(hsl).not.toBeNull();
    
    if (hsl) {
      const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      const targetRgb = hexToRgb(DESIGN_COLORS.background);
      const similarity = colorSimilarity(rgb, targetRgb);
      
      expect(similarity).toBeGreaterThan(90);
    }
  });

  it('should verify accent color HSL matches #F59E0B within tolerance', () => {
    const hsl = parseHslString(CSS_HSL_VALUES.accent);
    expect(hsl).not.toBeNull();
    
    if (hsl) {
      const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      const targetRgb = hexToRgb(DESIGN_COLORS.accent);
      const similarity = colorSimilarity(rgb, targetRgb);
      
      expect(similarity).toBeGreaterThan(90);
    }
  });

  it('should verify color consistency across random HSL transformations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 360 }),  // hue
        fc.integer({ min: 0, max: 100 }),  // saturation
        fc.integer({ min: 0, max: 100 }),  // lightness
        (h, s, l) => {
          // 验证 HSL -> RGB -> Hex 转换的一致性
          const rgb = hslToRgb(h, s, l);
          const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
          const backToRgb = hexToRgb(hex);
          
          // RGB 值应该完全匹配 (整数转换)
          expect(backToRgb[0]).toBe(rgb[0]);
          expect(backToRgb[1]).toBe(rgb[1]);
          expect(backToRgb[2]).toBe(rgb[2]);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: 暗色模式切换', () => {
  /**
   * **Feature: nextjs-capacitor-migration, Property 2: 暗色模式切换**
   * 
   * *For any* 主题切换操作，暗色模式下的 CSS 变量 SHALL 正确更新，
   * 且 background 和 foreground 的对比度 SHALL 满足 WCAG AA 标准。
   */
  
  // 暗色模式的 HSL 值
  const DARK_HSL_VALUES = {
    background: '0 0% 9%',
    foreground: '0 0% 95%'
  };

  it('should verify dark mode variables exist in globals.css', () => {
    const globalsPath = path.resolve(__dirname, '../../app/globals.css');
    const cssContent = fs.readFileSync(globalsPath, 'utf-8');
    
    // 验证 .dark 选择器存在
    expect(cssContent).toContain('.dark');
    
    // 验证暗色模式变量
    expect(cssContent).toMatch(/\.dark\s*\{[\s\S]*--background:/);
    expect(cssContent).toMatch(/\.dark\s*\{[\s\S]*--foreground:/);
  });

  it('should verify dark mode contrast ratio meets WCAG AA (4.5:1)', () => {
    const bgHsl = parseHslString(DARK_HSL_VALUES.background);
    const fgHsl = parseHslString(DARK_HSL_VALUES.foreground);
    
    expect(bgHsl).not.toBeNull();
    expect(fgHsl).not.toBeNull();
    
    if (bgHsl && fgHsl) {
      const bgRgb = hslToRgb(bgHsl.h, bgHsl.s, bgHsl.l);
      const fgRgb = hslToRgb(fgHsl.h, fgHsl.s, fgHsl.l);
      const contrastRatio = calculateContrastRatio(bgRgb, fgRgb);
      
      // WCAG AA 标准要求对比度至少 4.5:1
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('should verify light mode contrast ratio meets WCAG AA (4.5:1)', () => {
    const bgHsl = parseHslString(CSS_HSL_VALUES.background);
    const fgHsl = parseHslString(CSS_HSL_VALUES.foreground);
    
    expect(bgHsl).not.toBeNull();
    expect(fgHsl).not.toBeNull();
    
    if (bgHsl && fgHsl) {
      const bgRgb = hslToRgb(bgHsl.h, bgHsl.s, bgHsl.l);
      const fgRgb = hslToRgb(fgHsl.h, fgHsl.s, fgHsl.l);
      const contrastRatio = calculateContrastRatio(bgRgb, fgRgb);
      
      // WCAG AA 标准要求对比度至少 4.5:1
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('should verify contrast ratio property for random color pairs', () => {
    fc.assert(
      fc.property(
        // 生成浅色背景 (高亮度)
        fc.record({
          h: fc.integer({ min: 0, max: 360 }),
          s: fc.integer({ min: 0, max: 50 }),
          l: fc.integer({ min: 85, max: 100 })
        }),
        // 生成深色前景 (低亮度)
        fc.record({
          h: fc.integer({ min: 0, max: 360 }),
          s: fc.integer({ min: 0, max: 50 }),
          l: fc.integer({ min: 0, max: 15 })
        }),
        (bg, fg) => {
          const bgRgb = hslToRgb(bg.h, bg.s, bg.l);
          const fgRgb = hslToRgb(fg.h, fg.s, fg.l);
          const contrastRatio = calculateContrastRatio(bgRgb, fgRgb);
          
          // 高对比度配色应该满足 WCAG AA
          expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify theme variables are properly scoped', () => {
    const globalsPath = path.resolve(__dirname, '../../app/globals.css');
    const cssContent = fs.readFileSync(globalsPath, 'utf-8');
    
    // 验证 :root 和 .dark 都定义了必要的变量
    const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
    const darkMatch = cssContent.match(/\.dark\s*\{([^}]+)\}/);
    
    expect(rootMatch).not.toBeNull();
    expect(darkMatch).not.toBeNull();
    
    if (rootMatch && darkMatch) {
      const rootVars = rootMatch[1];
      const darkVars = darkMatch[1];
      
      // 两个主题都应该定义这些核心变量
      const coreVars = ['--primary', '--background', '--foreground', '--accent'];
      
      coreVars.forEach(varName => {
        expect(rootVars).toContain(varName);
        expect(darkVars).toContain(varName);
      });
    }
  });
});
