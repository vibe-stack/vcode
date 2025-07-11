import { KeyEventInfo } from './types';

/**
 * Get platform-specific modifier key names
 */
export const getPlatformModifiers = () => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  return {
    cmd: isMac ? 'cmd' : 'ctrl',
    alt: isMac ? 'option' : 'alt',
    meta: isMac ? 'cmd' : 'meta',
    ctrl: 'ctrl',
    shift: 'shift'
  };
};

/**
 * Check if we're on macOS
 */
export const isMacOS = (): boolean => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

/**
 * Convert a key event to a standardized key combination string
 */
export const keyEventToString = (event: KeyboardEvent): string => {
  const parts: string[] = [];
  
  if (event.ctrlKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  if (event.metaKey) parts.push('cmd');
  
  // Handle special keys
  let key = event.key.toLowerCase();
  
  // Map some keys to more readable names
  const keyMap: Record<string, string> = {
    ' ': 'space',
    'arrowup': 'up',
    'arrowdown': 'down',
    'arrowleft': 'left',
    'arrowright': 'right',
    'escape': 'esc',
    'delete': 'del',
    'backspace': 'backspace',
    'enter': 'enter',
    'tab': 'tab',
    'home': 'home',
    'end': 'end',
    'pageup': 'pageup',
    'pagedown': 'pagedown',
    'insert': 'ins',
    'contextmenu': 'menu'
  };
  
  key = keyMap[key] || key;
  
  // Add the main key
  parts.push(key);
  
  return parts.join('+');
};

/**
 * Parse a key combination string into components
 */
export const parseKeyCombination = (combination: string): KeyEventInfo['modifiers'] & { key: string } => {
  const parts = combination.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  
  return {
    ctrl: parts.includes('ctrl'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('cmd') || parts.includes('meta'),
    key
  };
};

/**
 * Check if a key combination matches a pattern
 */
export const matchesKeyCombination = (pattern: string, combination: string): boolean => {
  const normalizedPattern = normalizeKeyCombination(pattern);
  const normalizedCombination = normalizeKeyCombination(combination);
  
  return normalizedPattern === normalizedCombination;
};

/**
 * Normalize a key combination string for comparison
 */
export const normalizeKeyCombination = (combination: string): string => {
  const parts = combination.toLowerCase().split('+');
  const modifiers: string[] = [];
  let key = '';
  
  for (const part of parts) {
    if (['ctrl', 'alt', 'shift', 'cmd', 'meta'].includes(part)) {
      modifiers.push(part);
    } else {
      key = part;
    }
  }
  
  // Sort modifiers for consistent comparison
  modifiers.sort();
  
  return [...modifiers, key].join('+');
};

/**
 * Convert platform-specific key combinations to cross-platform format
 */
export const normalizePlatformKeys = (combination: string): string => {
  if (isMacOS()) {
    return combination.replace(/\bcmd\b/g, 'meta');
  } else {
    return combination.replace(/\bmeta\b/g, 'ctrl');
  }
};

/**
 * Get human-readable key combination string
 */
export const getHumanReadableKey = (combination: string): string => {
  const parts = combination.split('+');
  const humanParts: string[] = [];
  
  for (const part of parts) {
    switch (part.toLowerCase()) {
      case 'ctrl':
        humanParts.push(isMacOS() ? '⌃' : 'Ctrl');
        break;
      case 'alt':
        humanParts.push(isMacOS() ? '⌥' : 'Alt');
        break;
      case 'shift':
        humanParts.push(isMacOS() ? '⇧' : 'Shift');
        break;
      case 'cmd':
      case 'meta':
        humanParts.push(isMacOS() ? '⌘' : 'Win');
        break;
      case 'space':
        humanParts.push('Space');
        break;
      case 'enter':
        humanParts.push('Enter');
        break;
      case 'tab':
        humanParts.push('Tab');
        break;
      case 'esc':
        humanParts.push('Esc');
        break;
      case 'backspace':
        humanParts.push('Backspace');
        break;
      case 'del':
        humanParts.push('Delete');
        break;
      case 'up':
        humanParts.push('↑');
        break;
      case 'down':
        humanParts.push('↓');
        break;
      case 'left':
        humanParts.push('←');
        break;
      case 'right':
        humanParts.push('→');
        break;
      default:
        humanParts.push(part.toUpperCase());
    }
  }
  
  return humanParts.join(isMacOS() ? '' : '+');
};

/**
 * Validate a key combination string
 */
export const isValidKeyCombination = (combination: string): boolean => {
  if (!combination || typeof combination !== 'string') return false;
  
  const parts = combination.toLowerCase().split('+');
  if (parts.length === 0) return false;
  
  const validModifiers = ['ctrl', 'alt', 'shift', 'cmd', 'meta'];
  const modifiers = parts.slice(0, -1);
  const key = parts[parts.length - 1];
  
  // Check if all modifiers are valid
  for (const modifier of modifiers) {
    if (!validModifiers.includes(modifier)) return false;
  }
  
  // Check if key is valid (not empty and not a modifier)
  return key.length > 0 && !validModifiers.includes(key);
};
