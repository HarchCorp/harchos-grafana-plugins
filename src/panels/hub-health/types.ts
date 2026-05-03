import { PanelOptionsEditorBuilder } from '@grafana/data';

/**
 * Options for the Hub Health panel.
 */
export interface HubHealthOptions {
  /** Display mode for hub health */
  displayMode: HubDisplayMode;
  /** Whether to show latency metrics */
  showLatency: boolean;
  /** Whether to show request rates */
  showRequestRates: boolean;
  /** Whether to show error rates */
  showErrorRates: boolean;
  /** Latency warning threshold in milliseconds */
  latencyWarningMs: number;
  /** Latency critical threshold in milliseconds */
  latencyCriticalMs: number;
  /** Error rate warning threshold (0-100%) */
  errorRateWarningPercent: number;
  /** Error rate critical threshold (0-100%) */
  errorRateCriticalPercent: number;
  /** Whether to show sovereignty compliance */
  showSovereigntyCompliance: boolean;
  /** Sort hubs by */
  sortBy: HubSortField;
}

/**
 * Display mode for the Hub Health panel.
 */
export enum HubDisplayMode {
  /** Status grid with colored indicators */
  StatusGrid = 'statusgrid',
  /** Detailed table view */
  Table = 'table',
  /** Health gauge per hub */
  Gauges = 'gauges',
  /** Compact mini cards */
  MiniCards = 'minicards',
}

/**
 * Sort field for hub listing.
 */
export enum HubSortField {
  Name = 'name',
  Status = 'status',
  Latency = 'latency',
  ErrorRate = 'errorrate',
}

/**
 * Health status of a hub.
 */
export enum HubStatus {
  Healthy = 'healthy',
  Degraded = 'degraded',
  Unhealthy = 'unhealthy',
  Offline = 'offline',
}

/**
 * Hub health data point from the backend.
 */
export interface HubHealthDataPoint {
  /** Hub identifier */
  hubId: string;
  /** Hub display name */
  hubName: string;
  /** Hub region/zone */
  region: string;
  /** Overall health status */
  status: HubStatus;
  /** Uptime percentage (0-100) */
  uptimePercent: number;
  /** Average latency in milliseconds */
  latencyMs: number;
  /** P99 latency in milliseconds */
  latencyP99Ms: number;
  /** Request rate per second */
  requestsPerSecond: number;
  /** Error rate (0-100%) */
  errorRatePercent: number;
  /** Active connections */
  activeConnections: number;
  /** Sovereignty compliance status */
  sovereigntyCompliant: boolean;
  /** Last heartbeat timestamp */
  lastHeartbeat: number;
  /** Hub version */
  version?: string;
}

/**
 * Determine hub status based on thresholds.
 */
export function determineHubStatus(
  latencyMs: number,
  errorRatePercent: number,
  uptimePercent: number,
  options: HubHealthOptions,
): HubStatus {
  if (uptimePercent < 50) return HubStatus.Offline;
  if (latencyMs > options.latencyCriticalMs || errorRatePercent > options.errorRateCriticalPercent) {
    return HubStatus.Unhealthy;
  }
  if (latencyMs > options.latencyWarningMs || errorRatePercent > options.errorRateWarningPercent) {
    return HubStatus.Degraded;
  }
  return HubStatus.Healthy;
}

/**
 * Get color for hub status.
 */
export function getStatusColor(status: HubStatus): string {
  switch (status) {
    case HubStatus.Healthy:
      return '#73BF69';
    case HubStatus.Degraded:
      return '#FF9830';
    case HubStatus.Unhealthy:
      return '#E02F44';
    case HubStatus.Offline:
      return '#8E8E8E';
    default:
      return '#8E8E8E';
  }
}

/**
 * Get icon for hub status.
 */
export function getStatusIcon(status: HubStatus): string {
  switch (status) {
    case HubStatus.Healthy:
      return 'check-circle';
    case HubStatus.Degraded:
      return 'exclamation-triangle';
    case HubStatus.Unhealthy:
      return 'times-circle';
    case HubStatus.Offline:
      return 'circle';
    default:
      return 'circle';
  }
}
