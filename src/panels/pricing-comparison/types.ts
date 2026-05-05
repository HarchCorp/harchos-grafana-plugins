/**
 * Options for the Pricing Comparison panel.
 */
export interface PricingComparisonOptions {
  /** Display mode for pricing comparison */
  displayMode: PricingDisplayMode;
  /** Sort field for the comparison */
  sortBy: PricingSortField;
  /** Sort direction */
  sortDirection: PricingSortDirection;
  /** Whether to show GPU pricing */
  showGpuPricing: boolean;
  /** Whether to show carbon intensity alongside pricing */
  showCarbonIntensity: boolean;
  /** Whether to show renewable percentage */
  showRenewablePercentage: boolean;
  /** Currency symbol for pricing display */
  currencySymbol: string;
  /** Highlight lowest price */
  highlightLowest: boolean;
}

/**
 * Display mode for the Pricing Comparison panel.
 */
export enum PricingDisplayMode {
  /** Table view with sortable columns */
  Table = 'table',
  /** Horizontal bar comparison */
  BarComparison = 'barcomparison',
  /** Card-based layout */
  Cards = 'cards',
}

/**
 * Sort field for pricing comparison.
 */
export enum PricingSortField {
  Region = 'region',
  Price = 'price',
  CarbonIntensity = 'carbonintensity',
  Tier = 'tier',
}

/**
 * Sort direction.
 */
export enum PricingSortDirection {
  Ascending = 'asc',
  Descending = 'desc',
}

/**
 * Pricing data point from the backend.
 */
export interface PricingDataPoint {
  /** Region identifier */
  regionId: string;
  /** Region display name */
  regionName: string;
  /** Country */
  country: string;
  /** GPU model */
  gpuModel: string;
  /** Pricing tier */
  pricingTier: string;
  /** Hourly price per GPU */
  gpuHourlyPrice: number;
  /** Carbon intensity in gCO2/kWh */
  carbonIntensity: number;
  /** Renewable energy percentage */
  renewablePercentage: number;
  /** Available GPU count */
  availableGpus: number;
  /** Sovereignty level */
  sovereignty: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Format price for display.
 */
export function formatPrice(price: number, currency: string): string {
  return `${currency}${price.toFixed(3)}/hr`;
}

/**
 * Get pricing tier color.
 */
export function getTierColor(tier: string): string {
  switch (tier.toLowerCase()) {
    case 'budget':
      return '#73BF69';
    case 'standard':
      return '#5794F2';
    case 'premium':
      return '#FF9830';
    case 'enterprise':
      return '#A352CC';
    default:
      return '#8E8E8E';
  }
}
