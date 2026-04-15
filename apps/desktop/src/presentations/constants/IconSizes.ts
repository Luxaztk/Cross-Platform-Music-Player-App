/**
 * Centralized icon sizes for consistency across the application.
 */
export const ICON_SIZES = {
  /** Tiny icons, used for secondary actions like 'More' buttons in the sidebar */
  TINY: 14,
  /** Standard icons, used for main navigation items and common UI buttons */
  SMALL: 18,
  /** Medium icons, used for collapsed sidebar items, placeholders, and player controls */
  MEDIUM: 20,
  /** Large icons, used for primary playback markers or main feature icons */
  LARGE: 28,
} as const;

export type IconSize = (typeof ICON_SIZES)[keyof typeof ICON_SIZES];
