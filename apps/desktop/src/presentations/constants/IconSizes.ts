/**
 * Centralized icon sizes for consistency across the application.
 */
export const ICON_SIZES = {
  /** Mini icons, used for very small indicators */
  MINI: 12,
  /** Tiny icons, used for secondary actions like 'More' buttons in the sidebar */
  TINY: 14,
  /** Extra small icons, used for standard buttons and list items */
  XSMALL: 16,
  /** Small icons, used for main navigation items and common UI buttons */
  SMALL: 18,
  /** Medium icons, used for collapsed sidebar items, placeholders, and player controls */
  MEDIUM: 20,
  /** Large icons, used for modal headers and section titles */
  LARGE: 24,
  /** Extra large icons, used for primary playback markers or main feature icons */
  XLARGE: 28,
  /** Extra extra large icons, used for section headers or empty state illustrations */
  XXLARGE: 32,
} as const;

export type IconSize = (typeof ICON_SIZES)[keyof typeof ICON_SIZES];
