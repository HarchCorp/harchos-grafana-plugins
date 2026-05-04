import { PanelPlugin } from '@grafana/data';

import { WorkloadDistributionPanel } from './panel';
import { WorkloadDistributionOptions, WorkloadDisplayMode, WorkloadGroupBy, WorkloadColorScheme } from './types';

/**
 * Workload Distribution panel plugin module.
 *
 * Registers the Workload Distribution panel with the Grafana plugin system.
 * This panel visualizes workload allocation across HarchOS hubs with
 * CPU, memory, task counts, and energy metrics.
 */
export const plugin = new PanelPlugin<WorkloadDistributionOptions>(WorkloadDistributionPanel).setPanelOptions(
  (builder) => {
    builder
      .addSelect({
        path: 'displayMode',
        name: 'Display mode',
        description: 'How to visualize workload distribution',
        defaultValue: WorkloadDisplayMode.Table,
        settings: {
          options: [
            { value: WorkloadDisplayMode.Treemap, label: 'Treemap' },
            { value: WorkloadDisplayMode.PieChart, label: 'Pie Chart' },
            { value: WorkloadDisplayMode.StackedBar, label: 'Stacked Bar' },
            { value: WorkloadDisplayMode.Table, label: 'Card Table' },
            { value: WorkloadDisplayMode.Bubble, label: 'Bubble Chart' },
          ],
        },
      })
      .addSelect({
        path: 'groupBy',
        name: 'Group by',
        description: 'Dimension to group workloads by',
        defaultValue: WorkloadGroupBy.Namespace,
        settings: {
          options: [
            { value: WorkloadGroupBy.Name, label: 'Workload Name' },
            { value: WorkloadGroupBy.Namespace, label: 'Namespace' },
            { value: WorkloadGroupBy.Hub, label: 'Hub' },
            { value: WorkloadGroupBy.Priority, label: 'Priority' },
            { value: WorkloadGroupBy.Status, label: 'Status' },
          ],
        },
      })
      .addBooleanSwitch({
        path: 'showCpu',
        name: 'Show CPU allocation',
        description: 'Display CPU used / requested per group',
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'showMemory',
        name: 'Show memory allocation',
        description: 'Display memory used / requested per group',
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'showTaskCounts',
        name: 'Show task counts',
        description: 'Display number of tasks per group',
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'showEnergyPerWorkload',
        name: 'Show energy per workload',
        description: 'Display energy consumption per workload group',
        defaultValue: false,
      })
      .addNumberInput({
        path: 'maxWorkloads',
        name: 'Max workloads',
        description: 'Maximum number of workloads to display',
        defaultValue: 20,
        settings: { min: 1, max: 200, integer: true },
      })
      .addSelect({
        path: 'colorScheme',
        name: 'Color scheme',
        description: 'Color palette for the visualization',
        defaultValue: WorkloadColorScheme.HarchOS,
        settings: {
          options: [
            { value: WorkloadColorScheme.Default, label: 'Grafana Default' },
            { value: WorkloadColorScheme.Warm, label: 'Warm' },
            { value: WorkloadColorScheme.Cool, label: 'Cool' },
            { value: WorkloadColorScheme.HarchOS, label: 'HarchOS' },
          ],
        },
      });

    return builder;
  },
);
