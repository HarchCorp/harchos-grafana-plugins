import { PanelPlugin } from '@grafana/data';

import { GpuUtilizationPanel } from './panel';
import { GpuUtilizationOptions, GpuDisplayMode, buildGpuUtilizationOptions } from './types';

/**
 * GPU Utilization panel plugin module.
 *
 * Registers the GPU Utilization panel with the Grafana plugin system.
 * This panel visualizes GPU compute utilization, memory usage,
 * temperature, VRAM, and power metrics from HarchOS observability data.
 */
export const plugin = new PanelPlugin<GpuUtilizationOptions>(GpuUtilizationPanel)
  .setPanelOptions((builder) => {
    builder
      .addSelect({
        path: 'displayMode',
        name: 'Display mode',
        description: 'How to visualize GPU utilization',
        defaultValue: GpuDisplayMode.Gauges,
        settings: {
          options: [
            { value: GpuDisplayMode.Gauges, label: 'Gauges' },
            { value: GpuDisplayMode.Stats, label: 'Stats' },
            { value: GpuDisplayMode.BarChart, label: 'Bar Chart' },
            { value: GpuDisplayMode.TimeSeries, label: 'Time Series' },
          ],
        },
      })
      .addBooleanSwitch({
        path: 'showTemperature',
        name: 'Show temperature',
        description: 'Display GPU temperature alongside utilization',
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'showVram',
        name: 'Show VRAM usage',
        description: 'Display VRAM usage alongside utilization',
        defaultValue: true,
      })
      .addNumberInput({
        path: 'temperatureWarning',
        name: 'Temperature warning (°C)',
        description: 'Threshold for warning temperature indicator',
        defaultValue: 80,
        settings: { min: 0, max: 120, integer: true },
      })
      .addNumberInput({
        path: 'temperatureCritical',
        name: 'Temperature critical (°C)',
        description: 'Threshold for critical temperature indicator',
        defaultValue: 95,
        settings: { min: 0, max: 120, integer: true },
      })
      .addBooleanSwitch({
        path: 'groupByDevice',
        name: 'Group by device',
        description: 'Show one panel per GPU device',
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'showAverage',
        name: 'Show average',
        description: 'Show average utilization across all GPUs',
        defaultValue: false,
      });

    return builder;
  });
