import { PanelOptionsEditorBuilder } from '@grafana/data';

/**
 * Options for the GPU Utilization panel.
 */
export interface GpuUtilizationOptions {
  /** Display mode for GPU metrics */
  displayMode: GpuDisplayMode;
  /** Whether to show GPU temperature */
  showTemperature: boolean;
  /** Whether to show VRAM usage */
  showVram: boolean;
  /** Temperature warning threshold (°C) */
  temperatureWarning: number;
  /** Temperature critical threshold (°C) */
  temperatureCritical: number;
  /** Whether to group by GPU device */
  groupByDevice: boolean;
  /** Show average across all GPUs */
  showAverage: boolean;
}

/**
 * Display mode for the GPU Utilization panel.
 */
export enum GpuDisplayMode {
  /** Show all GPUs as individual gauges */
  Gauges = 'gauges',
  /** Show a single stat per GPU */
  Stats = 'stats',
  /** Show as a bar chart */
  BarChart = 'barchart',
  /** Show as a time series */
  TimeSeries = 'timeseries',
}

/**
 * GPU utilization data point from the backend.
 */
export interface GpuDataPoint {
  /** GPU device index (0-based) */
  deviceIndex: number;
  /** GPU device name (e.g. 'NVIDIA A100-SXM4-80GB') */
  deviceName: string;
  /** GPU compute utilization (0-100%) */
  utilizationPercent: number;
  /** GPU memory utilization (0-100%) */
  memoryUtilizationPercent: number;
  /** GPU temperature in Celsius */
  temperatureCelsius: number;
  /** VRAM used in bytes */
  vramUsedBytes: number;
  /** VRAM total in bytes */
  vramTotalBytes: number;
  /** Power draw in watts */
  powerDrawWatts: number;
  /** Power limit in watts */
  powerLimitWatts: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Builder for GPU Utilization panel options editor.
 */
export const buildGpuUtilizationOptions = (builder: PanelOptionsEditorBuilder<GpuUtilizationOptions>) => {
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
};
