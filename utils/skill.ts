
import { Hero } from '../types';

/**
 * Checks if a hero's skill is active based on their current status and skillType.
 * 
 * skillType Definition:
 * - 0: Always Active (Passive)
 * - 1xx: HP >= xx (High HP Condition - Absolute Value)
 * - 2xx: HP <= xx (Low HP Condition - Absolute Value)
 * 
 * Example:
 * - 150: HP >= 50 (Active if HP is 50 or more)
 * - 250: HP <= 50 (Active if HP is 50 or less)
 */
export const isSkillActive = (hero: Hero): boolean => {
  const type = hero.skillType || 0;
  
  // Default: Always active if 0 or undefined
  if (type === 0) return true;

  // 1st digit (100s): Condition Mode
  // 2nd & 3rd digits (10s, 1s): Threshold Value (rounded to nearest 10)
  const conditionMode = Math.floor(type / 100); 
  const thresholdVal = Math.floor((type % 100) / 10) * 10; 

  // Mode 0: Always active (types 0-99)
  if (conditionMode === 0) return true;

  // Mode 1: High HP Condition (>=)
  // Example: 150 -> HP >= 50 (Absolute Value)
  if (conditionMode === 1) {
     return hero.hp >= thresholdVal;
  }
  
  // Mode 2: Low HP Condition (<=)
  // Example: 250 -> HP <= 50 (Absolute Value)
  if (conditionMode === 2) {
     return hero.hp <= thresholdVal;
  }
  
  // Fallback for unknown modes
  return true;
};
