/**
 * Options for the Workload Distribution panel.
 */
export interface WorkloadDistributionOptions {
  /** Display mode for workload distribution */
  displayMode: WorkloadDisplayMode;
  /** Group workloads by */
  groupBy: WorkloadGroupBy;
  /** Whether to show CPU allocation */
  showCpu: boolean;
  /** Whether to show memory allocation */
  showMemory: boolean;
  /** Whether to show task counts */
  showTaskCounts: boolean;
  /** Whether to show energy per workload */
  showEnergyPerWorkload: boolean;
  /** Maximum workloads to display */
  maxWorkloads: number;
  /** Color scheme */
  colorScheme: WorkloadColorScheme;
}

/**
 * Display mode for the Workload Distribution panel.
 */
export enum WorkloadDisplayMode {
  /** Treemap visualization */
  Treemap = 'treemap',
  /** Pie / donut chart */
  PieChart = 'piechart',
  /** Stacked bar chart */
  StackedBar = 'stackedbar',
  /** Table view */
  Table = 'table',
  /** Bubble chart */
  Bubble = 'bubble',
}

/**
 * Group workloads by this dimension.
 */
export enum WorkloadGroupBy {
  /** Group by workload name */
  Name = 'name',
  /** Group by namespace/project */
  Namespace = 'namespace',
  /** Group by hub */
  Hub = 'hub',
  /** Group by priority class */
  Priority = 'priority',
  /** Group by status */
  Status = 'status',
}

/**
 * Color scheme for workload distribution.
 */
export enum WorkloadColorScheme {
  /** Grafana default palette */
  Default = 'default',
  /** Warm colors */
  Warm = 'warm',
  /** Cool colors */
  Cool = 'cool',
  /** HarchOS brand palette */
  HarchOS = 'harchos',
}

/**
 * Workload data point from the backend.
 */
export interface WorkloadDataPoint {
  /** Workload identifier */
  workloadId: string;
  /** Workload name */
  name: string;
  /** Namespace or project */
  namespace: string;
  /** Hub where the workload runs */
  hub: string;
  /** Workload status */
  status: WorkloadStatus;
  /** Priority class */
  priority: string;
  /** CPU cores requested */
  cpuRequested: number;
  /** CPU cores used */
  cpuUsed: number;
  /** Memory requested in bytes */
  memoryRequestedBytes: number;
  /** Memory used in bytes */
  memoryUsedBytes: number;
  /** Number of tasks/replicas */
  taskCount: number;
  /** Energy consumed in kWh */
  energyKwh: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Workload status.
 */
export enum WorkloadStatus {
  Running = 'running',
  Pending = 'pending',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Unknown = 'unknown',
}

/**
 * Aggregated workload group.
 */
export interface WorkloadGroup {
  /** Group key */
  key: string;
  /** Number of workloads in this group */
  count: number;
  /** Total CPU used */
  totalCpu: number;
  /** Total CPU requested */
  totalCpuRequested: number;
  /** Total memory used in bytes */
  totalMemoryBytes: number;
  /** Total memory requested in bytes */
  totalMemoryRequestedBytes: number;
  /** Total task count */
  totalTasks: number;
  /** Total energy in kWh */
  totalEnergyKwh: number;
  /** Individual workloads */
  workloads: WorkloadDataPoint[];
}

/**
 * Color palettes.
 */
export const COLOR_PALETTES: Record<WorkloadColorScheme, string[]> = {
  [WorkloadColorScheme.Default]: [
    '#73BF69',
    '#FF9830',
    '#5794F2',
    '#F2495C',
    '#A352CC',
    '#FFB347',
    '#8AB8FF',
    '#FF6B6B',
    '#C0564F',
    '#7C3AED',
  ],
  [WorkloadColorScheme.Warm]: [
    '#FF6B6B',
    '#FF9830',
    '#FFB347',
    '#F2495C',
    '#C0564F',
    '#E02F44',
    '#FF7B54',
    '#FF9A76',
    '#FFD56F',
    '#FF4757',
  ],
  [WorkloadColorScheme.Cool]: [
    '#5794F2',
    '#8AB8FF',
    '#73BF69',
    '#A352CC',
    '#7C3AED',
    '#3B82F6',
    '#06B6D4',
    '#10B981',
    '#6366F1',
    '#0EA5E9',
  ],
  [WorkloadColorScheme.HarchOS]: [
    '#00D68F',
    '#0095FF',
    '#FFAA00',
    '#FF3D71',
    '#00E096',
    '#3366FF',
    '#FFB347',
    '#E02F44',
    '#73BF69',
    '#5794F2',
  ],
};
