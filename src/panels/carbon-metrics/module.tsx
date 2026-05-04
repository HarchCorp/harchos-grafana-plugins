import { PanelPlugin } from '@grafana/data';

import { CarbonMetricsPanel } from './panel';
import { CarbonMetricsOptions, CarbonDisplayMode, CarbonUnit } from './types';

/**
 * Carbon Metrics panel plugin module.
 *
 * Registers the Carbon Metrics panel with the Grafana plugin system.
 * This panel visualizes energy consumption, carbon emissions,
 * cost estimation, and sustainability metrics from HarchOS.
 */
export const plugin = new PanelPlugin<CarbonMetricsOptions>(CarbonMetricsPanel).setPanelOptions((builder) => {
  builder
    .addSelect({
      path: 'displayMode',
      name: 'Display mode',
      description: 'How to visualize carbon metrics',
      defaultValue: CarbonDisplayMode.Breakdown,
      settings: {
        options: [
          { value: CarbonDisplayMode.SingleStat, label: 'Single Stat' },
          { value: CarbonDisplayMode.Breakdown, label: 'Breakdown by Zone' },
          { value: CarbonDisplayMode.Timeline, label: 'Timeline' },
          { value: CarbonDisplayMode.Equivalents, label: 'Carbon Equivalents' },
        ],
      },
    })
    .addSelect({
      path: 'carbonUnit',
      name: 'Carbon unit',
      description: 'Unit for displaying carbon emissions',
      defaultValue: CarbonUnit.GramsCO2,
      settings: {
        options: [
          { value: CarbonUnit.GramsCO2, label: 'Grams CO₂' },
          { value: CarbonUnit.KilogramsCO2, label: 'Kilograms CO₂' },
          { value: CarbonUnit.MetricTonsCO2, label: 'Metric Tons CO₂' },
        ],
      },
    })
    .addBooleanSwitch({
      path: 'showEnergy',
      name: 'Show energy consumption',
      description: 'Display energy consumption in kWh',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showCost',
      name: 'Show cost estimation',
      description: 'Estimate cost based on energy price',
      defaultValue: false,
    })
    .addNumberInput({
      path: 'energyPricePerKwh',
      name: 'Energy price ($/kWh)',
      description: 'Energy price for cost estimation',
      defaultValue: 0.12,
      settings: { min: 0, step: 0.01 },
    })
    .addNumberInput({
      path: 'carbonIntensityFactor',
      name: 'Carbon intensity (gCO₂/kWh)',
      description: 'Grid carbon intensity factor for your region',
      defaultValue: 475,
      settings: { min: 0 },
    })
    .addBooleanSwitch({
      path: 'showTrend',
      name: 'Show trend',
      description: 'Show carbon emission trends over time',
      defaultValue: true,
    })
    .addNumberInput({
      path: 'sustainabilityTarget',
      name: 'Sustainability target (gCO₂)',
      description: 'Target carbon emission level for progress tracking',
      defaultValue: 0,
      settings: { min: 0 },
    });

  return builder;
});
