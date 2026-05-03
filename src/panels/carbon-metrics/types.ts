import { PanelOptionsEditorBuilder } from '@grafana/data';

/**
 * Options for the Carbon Metrics panel.
 */
export interface CarbonMetricsOptions {
  /** Display mode for carbon metrics */
  displayMode: CarbonDisplayMode;
  /** Carbon unit for display */
  carbonUnit: CarbonUnit;
  /** Whether to show energy consumption */
  showEnergy: boolean;
  /** Whether to show cost estimation */
  showCost: boolean;
  /** Energy price per kWh in configured currency */
  energyPricePerKwh: number;
  /** Carbon intensity factor (gCO₂/kWh) for the region */
  carbonIntensityFactor: number;
  /** Whether to show trend comparison */
  showTrend: boolean;
  /** Sustainability target in gCO₂ */
  sustainabilityTarget: number;
}

/**
 * Display mode for the Carbon Metrics panel.
 */
export enum CarbonDisplayMode {
  /** Single big value with trend */
  SingleStat = 'singlestat',
  /** Breakdown by source/zone */
  Breakdown = 'breakdown',
  /** Timeline view */
  Timeline = 'timeline',
  /** Carbon equivalent visualizations (trees, km driven, etc.) */
  Equivalents = 'equivalents',
}

/**
 * Carbon emission unit.
 */
export enum CarbonUnit {
  GramsCO2 = 'g',
  KilogramsCO2 = 'kg',
  MetricTonsCO2 = 't',
}

/**
 * Carbon metric data point from the backend.
 */
export interface CarbonDataPoint {
  /** Zone or source identifier */
  zone: string;
  /** Energy consumption in kWh */
  energyKwh: number;
  /** Carbon emissions in grams CO₂ */
  carbonGrams: number;
  /** Timestamp */
  timestamp: number;
  /** Energy source (e.g. 'grid', 'solar', 'wind') */
  source?: string;
  /** PUE (Power Usage Effectiveness) of the data center */
  pue?: number;
}

/**
 * Carbon equivalent for visualization.
 */
export interface CarbonEquivalent {
  /** Description of the equivalent */
  label: string;
  /** Value */
  value: number;
  /** Unit string */
  unit: string;
  /** Icon name */
  icon: string;
}

/**
 * Calculate carbon equivalents from grams CO₂.
 */
export function calculateEquivalents(carbonGrams: number): CarbonEquivalent[] {
  return [
    {
      label: 'Km driven (avg car)',
      value: carbonGrams / 170, // ~170g CO₂/km for avg car
      unit: 'km',
      icon: 'car',
    },
    {
      label: 'Smartphone charges',
      value: carbonGrams / 8.22, // ~8.22g CO₂ per charge
      unit: 'charges',
      icon: 'mobile',
    },
    {
      label: 'Tree days of offset',
      value: carbonGrams / 21000 / 365, // ~21kg CO₂ per tree per year
      unit: 'days',
      icon: 'tree',
    },
    {
      label: 'Flights (NYC↔LA)',
      value: carbonGrams / 900000, // ~900kg CO₂ per flight
      unit: 'flights',
      icon: 'plane',
    },
  ];
}
