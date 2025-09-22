/**
 * Utility functions for styling and class names
 */

import { clsx } from 'clsx'

/**
 * Combine class names with proper handling of conditionals
 */
export function cn(...inputs: any[]) {
  return clsx(inputs)
}
