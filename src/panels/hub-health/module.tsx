import { PanelPlugin } from '@grafana/data';

import { HubHealthPanel } from './panel';
import { HubHealthOptions, HubDisplayMode, HubSortField } from './types';

/**
 * Hub Health panel plugin module.
 *
 * Registers the Hub Health panel with the Grafana plugin system.
 * This panel visualizes health status, latency, error rates,
 * and availability of HarchOS Hub instances.
 */
export const plugin = new PanelPlugin<HubHealthOptions>(HubHealthPanel).setPanelOptions((builder) => {
  builder
    .addSelect({
      path: 'displayMode',
      name: 'Display mode',
      description: 'How to visualize hub health',
      defaultValue: HubDisplayMode.StatusGrid,
      settings: {
        options: [
          { value: HubDisplayMode.StatusGrid, label: 'Status Grid' },
          { value: HubDisplayMode.Table, label: 'Detailed Cards' },
          { value: HubDisplayMode.Gauges, label: 'Gauges' },
          { value: HubDisplayMode.MiniCards, label: 'Mini Cards' },
        ],
      },
    })
    .addBooleanSwitch({
      path: 'showLatency',
      name: 'Show latency',
      description: 'Display average and p99 latency metrics',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showRequestRates',
      name: 'Show request rates',
      description: 'Display requests per second',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showErrorRates',
      name: 'Show error rates',
      description: 'Display error rate percentage',
      defaultValue: true,
    })
    .addNumberInput({
      path: 'latencyWarningMs',
      name: 'Latency warning (ms)',
      description: 'Latency threshold for degraded status',
      defaultValue: 500,
      settings: { min: 0 },
    })
    .addNumberInput({
      path: 'latencyCriticalMs',
      name: 'Latency critical (ms)',
      description: 'Latency threshold for unhealthy status',
      defaultValue: 2000,
      settings: { min: 0 },
    })
    .addNumberInput({
      path: 'errorRateWarningPercent',
      name: 'Error rate warning (%)',
      description: 'Error rate threshold for degraded status',
      defaultValue: 5,
      settings: { min: 0, max: 100 },
    })
    .addNumberInput({
      path: 'errorRateCriticalPercent',
      name: 'Error rate critical (%)',
      description: 'Error rate threshold for unhealthy status',
      defaultValue: 15,
      settings: { min: 0, max: 100 },
    })
    .addBooleanSwitch({
      path: 'showSovereigntyCompliance',
      name: 'Show sovereignty compliance',
      description: 'Display data sovereignty compliance status per hub',
      defaultValue: true,
    })
    .addSelect({
      path: 'sortBy',
      name: 'Sort by',
      description: 'How to sort hubs in the display',
      defaultValue: HubSortField.Name,
      settings: {
        options: [
          { value: HubSortField.Name, label: 'Name' },
          { value: HubSortField.Status, label: 'Status' },
          { value: HubSortField.Latency, label: 'Latency' },
          { value: HubSortField.ErrorRate, label: 'Error Rate' },
        ],
      },
    });

  return builder;
});
