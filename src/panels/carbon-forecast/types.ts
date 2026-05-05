/**
 * Options for the Carbon Forecast panel.
 */
export interface CarbonForecastOptions {
  /** Display mode for carbon forecast */
  displayMode: CarbonForecastDisplayMode;
  /** Carbon intensity threshold for green classification (gCO2/kWh) */
  greenThreshold: number;
  /** Carbon intensity threshold for yellow/warning classification (gCO2/kWh) */
  yellowThreshold: number;
  /** Number of hours to show in the forecast */
  forecastHours: number;
  /** Whether to show green window highlights */
  showGreenWindows: boolean;
  /** Whether to show current intensity marker */
  showCurrentMarker: boolean;
  /** Whether to show zone labels */
  showZoneLabels: boolean;
}

/**
 * Display mode for the Carbon Forecast panel.
 */
export enum CarbonForecastDisplayMode {
  /** Timeline chart showing intensity over time */
  Timeline = 'timeline',
  /** Bar chart with color-coded intensity levels */
  Bars = 'bars',
  /** Summary cards with key metrics */
  Cards = 'cards',
}

/**
 * Carbon intensity level classification.
 */
export enum CarbonIntensityLevel {
  Green = 'green',
  Yellow = 'yellow',
  Red = 'red',
}

/**
 * Carbon forecast data point from the backend.
 */
export interface CarbonForecastDataPoint {
  /** Zone or region identifier */
  zone: string;
  /** Timestamp (ms since epoch) */
  timestamp: number;
  /** Carbon intensity in gCO2/kWh */
  carbonIntensity: number;
  /** Whether this is a green window */
  isGreenWindow: boolean;
  /** Optimal hub ID if available */
  optimalHubId?: string;
}

/**
 * Green window identified in the forecast.
 */
export interface GreenWindow {
  /** Start timestamp */
  startAt: number;
  /** End timestamp */
  endAt: number;
  /** Minimum intensity within the window */
  minIntensity: number;
  /** Average intensity within the window */
  avgIntensity: number;
  /** Duration in minutes */
  durationMin: number;
}

/**
 * Classify carbon intensity level based on thresholds.
 */
export function classifyIntensity(
  intensity: number,
  greenThreshold: number,
  yellowThreshold: number,
): CarbonIntensityLevel {
  if (intensity < greenThreshold) return CarbonIntensityLevel.Green;
  if (intensity < yellowThreshold) return CarbonIntensityLevel.Yellow;
  return CarbonIntensityLevel.Red;
}

/**
 * Get color for carbon intensity level.
 */
export function getIntensityColor(level: CarbonIntensityLevel): string {
  switch (level) {
    case CarbonIntensityLevel.Green:
      return '#73BF69';
    case CarbonIntensityLevel.Yellow:
      return '#FF9830';
    case CarbonIntensityLevel.Red:
      return '#E02F44';
    default:
      return '#8E8E8E';
  }
}

/**
 * Get color for a specific intensity value based on thresholds.
 */
export function getIntensityColorByValue(intensity: number, greenThreshold: number, yellowThreshold: number): string {
  const level = classifyIntensity(intensity, greenThreshold, yellowThreshold);
  return getIntensityColor(level);
}

/**
 * Format intensity for display.
 */
export function formatIntensity(intensity: number): string {
  return `${intensity.toFixed(1)} gCO₂/kWh`;
}

/**
 * Format timestamp for display.
 */
export function formatForecastTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
