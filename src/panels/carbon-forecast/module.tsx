import { PanelPlugin } from '@grafana/data';

import { CarbonForecastPanel } from './panel';
import { CarbonForecastOptions, CarbonForecastDisplayMode } from './types';

/**
 * Carbon Forecast panel plugin module.
 *
 * Registers the Carbon Forecast panel with the Grafana plugin system.
 * This panel shows carbon intensity forecast for the next 24 hours,
 * highlights green windows, and uses color coding:
 * green (<100 gCO2/kWh), yellow (100-200), red (>200).
 */
export const plugin = new PanelPlugin<CarbonForecastOptions>(CarbonForecastPanel).setPanelOptions((builder) => {
  builder
    .addSelect({
      path: 'displayMode',
      name: 'Display mode',
      description: 'How to visualize the carbon intensity forecast',
      defaultValue: CarbonForecastDisplayMode.Timeline,
      settings: {
        options: [
          { value: CarbonForecastDisplayMode.Timeline, label: 'Timeline Chart' },
          { value: CarbonForecastDisplayMode.Bars, label: 'Bar Chart' },
          { value: CarbonForecastDisplayMode.Cards, label: 'Summary Cards' },
        ],
      },
    })
    .addNumberInput({
      path: 'greenThreshold',
      name: 'Green threshold (gCO₂/kWh)',
      description: 'Carbon intensity below this value is classified as green',
      defaultValue: 100,
      settings: { min: 0, step: 10 },
    })
    .addNumberInput({
      path: 'yellowThreshold',
      name: 'Yellow threshold (gCO₂/kWh)',
      description: 'Carbon intensity above green but below this is moderate; above this is red',
      defaultValue: 200,
      settings: { min: 0, step: 10 },
    })
    .addNumberInput({
      path: 'forecastHours',
      name: 'Forecast hours',
      description: 'Number of hours to display in the forecast',
      defaultValue: 24,
      settings: { min: 1, max: 72, integer: true },
    })
    .addBooleanSwitch({
      path: 'showGreenWindows',
      name: 'Show green windows',
      description: 'Highlight time periods with green carbon intensity',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showCurrentMarker',
      name: 'Show current marker',
      description: 'Display a marker at the current time on the timeline',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showZoneLabels',
      name: 'Show zone labels',
      description: 'Display zone/region labels in the forecast view',
      defaultValue: true,
    });

  return builder;
});
