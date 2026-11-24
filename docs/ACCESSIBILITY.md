# NOVA OS Accessibility Architecture & Guidelines

## Vision
NOVA OS treats accessibility (a11y) as an essential system requirement rather than an optional feature. Every interface component must be operable via diverse input modalities and perceptual configurations.

## Compliance Target
- **Standard**: WCAG 2.2 Level AA conformance across all desktop shell components and native apps.
- **Screen Reader Protocol**: Linux AT-SPI2 (Assistive Technology Service Provider Interface) bridge.

## Core Accessibility Features

### 1. Keyboard Navigation
- **Universal Tab Indexing**: Every interactive surface possesses a defined tab index.
- **Visible Focus Rings**: High-contrast, 2px violet focus indicators with 2px offset.
- **Shortcuts Model**:
  - `Super`: Toggle Application Launcher
  - `Super + Space`: Toggle NOVA Intelligence Assistant
  - `Super + Tab`: Window / Task Switcher
  - `Super + Arrow Keys`: Grid navigation within launcher and file views
  - `Escape`: Dismiss modals, flyouts, and overlay menus

### 2. Visual Accommodations
- **High-Contrast Theme**: Meets 7:1 contrast ratio minimum for text against glass/solid surfaces.
- **Font Scaling**: Dynamic font scaling from 0.8x to 2.0x without clipping or layout breaking.
- **Reduced Motion Mode**: Respects `prefers-reduced-motion`. Replaces fluid spring animations with immediate state transitions.
- **Color Filters**: System-level shaders for Protanopia, Deuteranopia, and Tritanopia.

### 3. Screen Reader Integration
- State updates in the top bar (e.g., battery levels, network status changes) announce via ARIA live regions and AT-SPI2 events.
- Audio cues for window docking, permission prompts, and background task completions.
