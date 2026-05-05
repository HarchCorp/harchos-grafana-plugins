import { PanelPlugin } from '@grafana/data';

import { PricingComparisonPanel } from './panel';
import { PricingComparisonOptions, PricingDisplayMode, PricingSortField, PricingSortDirection } from './types';

/**
 * Pricing Comparison panel plugin module.
 *
 * Registers the Pricing Comparison panel with the Grafana plugin system.
 * This panel shows GPU pricing across regions and tiers with sorting
 * by price, region, or carbon intensity.
 */
export const plugin = new PanelPlugin<PricingComparisonOptions>(PricingComparisonPanel).setPanelOptions((builder) => {
  builder
    .addSelect({
      path: 'displayMode',
      name: 'Display mode',
      description: 'How to visualize GPU pricing comparison',
      defaultValue: PricingDisplayMode.Table,
      settings: {
        options: [
          { value: PricingDisplayMode.Table, label: 'Table' },
          { value: PricingDisplayMode.BarComparison, label: 'Bar Comparison' },
          { value: PricingDisplayMode.Cards, label: 'Cards' },
        ],
      },
    })
    .addSelect({
      path: 'sortBy',
      name: 'Sort by',
      description: 'Field to sort pricing data by',
      defaultValue: PricingSortField.Price,
      settings: {
        options: [
          { value: PricingSortField.Region, label: 'Region' },
          { value: PricingSortField.Price, label: 'Price' },
          { value: PricingSortField.CarbonIntensity, label: 'Carbon Intensity' },
          { value: PricingSortField.Tier, label: 'Tier' },
        ],
      },
    })
    .addSelect({
      path: 'sortDirection',
      name: 'Sort direction',
      description: 'Sort ascending or descending',
      defaultValue: PricingSortDirection.Ascending,
      settings: {
        options: [
          { value: PricingSortDirection.Ascending, label: 'Ascending' },
          { value: PricingSortDirection.Descending, label: 'Descending' },
        ],
      },
    })
    .addBooleanSwitch({
      path: 'showGpuPricing',
      name: 'Show GPU pricing',
      description: 'Display per-GPU hourly pricing information',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showCarbonIntensity',
      name: 'Show carbon intensity',
      description: 'Display carbon intensity alongside pricing',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showRenewablePercentage',
      name: 'Show renewable percentage',
      description: 'Display renewable energy percentage per region',
      defaultValue: true,
    })
    .addTextInput({
      path: 'currencySymbol',
      name: 'Currency symbol',
      description: 'Currency symbol for price display',
      defaultValue: '$',
    })
    .addBooleanSwitch({
      path: 'highlightLowest',
      name: 'Highlight lowest price',
      description: 'Highlight the region with the lowest price',
      defaultValue: true,
    });

  return builder;
});
