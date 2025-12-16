# Design Document: Dual-Layer Typography System

## Overview

The Dual-Layer Typography system creates a distinctive visual hierarchy for the No More Anxious platform by applying different font stacks to headings versus body text. Headings use Inter + Smiley Sans (得意黑) for a trendy, geeky aesthetic, while body text uses Inter + system Chinese fonts for optimal readability.

## Architecture

```mermaid
graph TD
    A[Next.js Layout] --> B[Inter Font - Google Fonts]
    A --> C[globals.css]
    C --> D[@font-face Smiley Sans]
    C --> E[CSS Variables]
    E --> F[--font-sans: Body Stack]
    E --> G[--font-heading: Heading Stack]
    C --> H[Element Selectors]
    H --> I[body - Body Font Stack]
    H --> J[h1-h6 - Heading Font Stack]
```

## Components and Interfaces

### Font Loading Strategy

1. **Inter Font**: Loaded via `next/font/google` for optimal performance with automatic subsetting and preloading
2. **Smiley Sans**: Loaded via `@font-face` from jsDelivr CDN with `font-display: swap`

### CSS Variable System

```css
--font-sans: var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "PingFang SC", "HarmonyOS Sans", "Microsoft YaHei", sans-serif;
--font-heading: var(--font-inter), "Inter", "Smiley Sans", sans-serif;
```

### Element Targeting

- **Body text**: `body`, `p`, `span`, `div` elements use `--font-sans`
- **Headings**: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `.brand-text` use `--font-heading`

## Data Models

### Typography Configuration

```typescript
interface TypographyConfig {
  headingFontStack: string[];
  bodyFontStack: string[];
  headingStyles: {
    fontWeight: number;
    letterSpacing: string;
    lineHeight: number;
  };
  bodyStyles: {
    lineHeight: number;
    color: string;
    fontSmoothing: boolean;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Font Stack Order Preservation
*For any* heading element rendered by the Typography_System, the computed font-family SHALL list "Inter" before "Smiley Sans" in the font stack.
**Validates: Requirements 1.1**

### Property 2: Body Font Stack Completeness
*For any* body text element, the font stack SHALL include all system Chinese fonts (PingFang SC, HarmonyOS Sans, Microsoft YaHei) as fallbacks after Inter.
**Validates: Requirements 2.1, 5.1, 5.2, 5.3**

### Property 3: Configuration Round-Trip
*For any* valid TypographyConfig object, serializing to JSON and deserializing SHALL produce an equivalent configuration object.
**Validates: Requirements 6.1, 6.2**

## Error Handling

1. **Font Load Failure**: `font-display: swap` ensures text remains visible with fallback fonts during loading
2. **Missing Fonts**: Font stack provides graceful degradation through ordered fallbacks
3. **CDN Unavailability**: System fonts serve as final fallback, ensuring text is always readable

## Testing Strategy

### Unit Tests
- Verify CSS variable definitions contain correct font stacks
- Verify @font-face declaration includes correct CDN URL
- Verify heading selectors target all h1-h6 elements

### Property-Based Tests
- **Property 1**: Generate random heading elements and verify font-family order
- **Property 2**: Generate random body elements and verify all Chinese fonts present
- **Property 3**: Generate random TypographyConfig objects and verify JSON round-trip

### Integration Tests
- Visual regression tests for heading/body font rendering
- Cross-browser font loading verification
