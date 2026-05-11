// Component weights — must sum to 1.0
export const WEIGHTS = Object.freeze({
  geographic:   0.35,
  country:      0.30,
  disruption:   0.20,
  singleSource: 0.15,
})

// Raw point values per event severity before time decay
export const SEVERITY_SCORES = Object.freeze({
  critical: 25,
  high:     15,
  medium:   8,
  low:      3,
})

// Age thresholds (days) that trigger decay multiplier changes
export const TIME_DECAY_DAYS = Object.freeze({
  recent: 90,
  medium: 180,
})

// Multipliers applied to severity score based on event age
export const TIME_DECAY_MULTIPLIERS = Object.freeze({
  recent: 1.00,  // ≤ 90 days old — full weight
  medium: 0.50,  // 91–180 days old
  old:    0.25,  // > 180 days old
})

// Single-source score by supplier count for a commodity
export const SINGLE_SOURCE_SCORES = Object.freeze({
  1: 100,
  2: 50,
  3: 20,
})
export const SINGLE_SOURCE_DEFAULT_SCORE = 5  // 4+ suppliers

// Score bands → risk level labels
export const RISK_THRESHOLDS = Object.freeze({
  MODERATE: 30,
  HIGH:     55,
  CRITICAL: 75,
})

// Color tokens for each risk level (mirrors Tailwind design tokens)
export const RISK_COLORS = Object.freeze({
  LOW:      '#22C55E',
  MODERATE: '#F59E0B',
  HIGH:     '#F97316',
  CRITICAL: '#EF4444',
})
