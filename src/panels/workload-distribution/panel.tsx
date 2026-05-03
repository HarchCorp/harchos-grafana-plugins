import React, { PureComponent } from 'react';
import {
  PanelProps,
  DataFrame,
  FieldType,
  getFieldDisplayName,
} from '@grafana/data';
import {
  BigValue,
  BigValueColorMode,
  BigValueGraphMode,
  BigValueTextMode,
  HorizontalGroup,
  VerticalGroup,
  Icon,
  BarGauge,
} from '@grafana/ui';
import { css } from '@emotion/css';

import {
  WorkloadDistributionOptions,
  WorkloadDisplayMode,
  WorkloadGroupBy,
  WorkloadColorScheme,
  WorkloadDataPoint,
  WorkloadStatus,
  WorkloadGroup,
  COLOR_PALETTES,
} from './types';

interface Props extends PanelProps<WorkloadDistributionOptions> {}

/**
 * Extract workload data from panel data frames.
 */
function extractWorkloadData(frames: DataFrame[]): WorkloadDataPoint[] {
  const dataPoints: WorkloadDataPoint[] = [];

  for (const frame of frames) {
    const timeField = frame.fields.find((f) => f.type === FieldType.time);
    const valueField = frame.fields.find((f) => f.type === FieldType.number);

    if (!valueField) continue;

    const metricName = getFieldDisplayName(valueField, frame);
    const labels = valueField.labels || {};

    for (let i = 0; i < frame.length; i++) {
      const value = valueField.values[i];
      if (value == null) continue;

      const workloadId = labels.workload_id || labels.workload || labels.job || `wl-${dataPoints.length}`;
      const name = labels.workload_name || labels.workload || labels.job || workloadId;
      const namespace = labels.namespace || labels.project || 'default';
      const hub = labels.hub || labels.instance || 'default';
      const priority = labels.priority || 'normal';

      let existing = dataPoints.find((dp) => dp.workloadId === workloadId);
      if (!existing) {
        existing = {
          workloadId,
          name,
          namespace,
          hub,
          status: WorkloadStatus.Running,
          priority,
          cpuRequested: 0,
          cpuUsed: 0,
          memoryRequestedBytes: 0,
          memoryUsedBytes: 0,
          taskCount: 0,
          energyKwh: 0,
          timestamp: timeField?.values[i] ?? 0,
        };
        dataPoints.push(existing);
      }

      const lowerMetric = metricName.toLowerCase();
      if (lowerMetric.includes('cpu_requested') || lowerMetric.includes('cpu_request')) {
        existing.cpuRequested = value;
      } else if (lowerMetric.includes('cpu_used') || lowerMetric.includes('cpu_usage')) {
        existing.cpuUsed = value;
      } else if (lowerMetric.includes('memory_requested') || lowerMetric.includes('mem_request')) {
        existing.memoryRequestedBytes = value;
      } else if (lowerMetric.includes('memory_used') || lowerMetric.includes('mem_usage')) {
        existing.memoryUsedBytes = value;
      } else if (lowerMetric.includes('task_count') || lowerMetric.includes('replicas') || lowerMetric.includes('tasks')) {
        existing.taskCount = value;
      } else if (lowerMetric.includes('energy') || lowerMetric.includes('kwh')) {
        existing.energyKwh = value;
      } else if (lowerMetric.includes('status')) {
        existing.status = mapWorkloadStatus(value);
      } else {
        // Default: treat as CPU usage
        existing.cpuUsed = value;
      }
    }
  }

  return dataPoints;
}

/**
 * Map numeric status to WorkloadStatus enum.
 */
function mapWorkloadStatus(value: number): WorkloadStatus {
  switch (value) {
    case 0: return WorkloadStatus.Running;
    case 1: return WorkloadStatus.Pending;
    case 2: return WorkloadStatus.Succeeded;
    case 3: return WorkloadStatus.Failed;
    default: return WorkloadStatus.Unknown;
  }
}

/**
 * Group workloads by the specified dimension.
 */
function groupWorkloads(workloads: WorkloadDataPoint[], groupBy: WorkloadGroupBy): WorkloadGroup[] {
  const groupMap = new Map<string, WorkloadDataPoint[]>();

  for (const wl of workloads) {
    let key: string;
    switch (groupBy) {
      case WorkloadGroupBy.Namespace:
        key = wl.namespace;
        break;
      case WorkloadGroupBy.Hub:
        key = wl.hub;
        break;
      case WorkloadGroupBy.Priority:
        key = wl.priority;
        break;
      case WorkloadGroupBy.Status:
        key = wl.status;
        break;
      case WorkloadGroupBy.Name:
      default:
        key = wl.name;
        break;
    }

    const list = groupMap.get(key) || [];
    list.push(wl);
    groupMap.set(key, list);
  }

  const groups: WorkloadGroup[] = [];
  for (const [key, wls] of groupMap.entries()) {
    groups.push({
      key,
      count: wls.length,
      totalCpu: wls.reduce((s, w) => s + w.cpuUsed, 0),
      totalCpuRequested: wls.reduce((s, w) => s + w.cpuRequested, 0),
      totalMemoryBytes: wls.reduce((s, w) => s + w.memoryUsedBytes, 0),
      totalMemoryRequestedBytes: wls.reduce((s, w) => s + w.memoryRequestedBytes, 0),
      totalTasks: wls.reduce((s, w) => s + w.taskCount, 0),
      totalEnergyKwh: wls.reduce((s, w) => s + w.energyKwh, 0),
      workloads: wls,
    });
  }

  return groups.sort((a, b) => b.totalCpu - a.totalCpu);
}

/**
 * Format bytes to human-readable.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Get status color.
 */
function getWorkloadStatusColor(status: WorkloadStatus): string {
  switch (status) {
    case WorkloadStatus.Running: return '#73BF69';
    case WorkloadStatus.Pending: return '#FFB347';
    case WorkloadStatus.Succeeded: return '#5794F2';
    case WorkloadStatus.Failed: return '#E02F44';
    default: return '#8E8E8E';
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────────

const getStyles = () => ({
  container: css({
    width: '100%',
    height: '100%',
    overflow: 'auto',
    padding: '12px',
  }),
  summaryRow: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '8px',
    marginBottom: '16px',
  }),
  summaryItem: css({
    textAlign: 'center',
    padding: '8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '6px',
  }),
  summaryValue: css({
    fontSize: '18px',
    fontWeight: 700,
    color: '#D6D6D6',
  }),
  summaryLabel: css({
    fontSize: '11px',
    color: '#8E8E8E',
    marginTop: '2px',
  }),
  groupGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
  }),
  groupCard: css({
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
  }),
  groupHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  }),
  groupName: css({
    fontSize: '14px',
    fontWeight: 600,
    color: '#D6D6D6',
  }),
  groupCount: css({
    fontSize: '11px',
    background: 'rgba(255,255,255,0.08)',
    padding: '2px 8px',
    borderRadius: '12px',
    color: '#A0A0A0',
  }),
  metricRow: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '3px 0',
    fontSize: '12px',
  }),
  metricLabel: css({ color: '#A0A0A0' }),
  metricValue: css({ fontWeight: 500, color: '#D6D6D6' }),
  treemapContainer: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    alignItems: 'flex-end',
    height: '100%',
  }),
  treemapCell: css({
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    '&:hover': {
      opacity: 0.85,
    },
  }),
  treemapLabel: css({
    fontSize: '10px',
    fontWeight: 600,
    color: '#fff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  }),
  treemapValue: css({
    fontSize: '9px',
    color: 'rgba(255,255,255,0.8)',
  }),
  pieContainer: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '24px',
  }),
  pieSvg: css({
    transform: 'rotate(-90deg)',
  }),
  legendContainer: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }),
  legendItem: css({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
  }),
  legendDot: css({
    width: '10px',
    height: '10px',
    borderRadius: '2px',
    flexShrink: 0,
  }),
  barRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
  }),
  barLabel: css({
    width: '100px',
    fontSize: '12px',
    color: '#D6D6D6',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
});

/**
 * Workload Distribution Panel Component
 *
 * Displays workload allocation and distribution across HarchOS hubs,
 * showing CPU, memory, task counts, and energy per workload.
 */
export class WorkloadDistributionPanel extends PureComponent<Props> {
  render() {
    const { data, options } = this.props;
    const workloads = extractWorkloadData(data.series);

    if (workloads.length === 0) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#8E8E8E' }}>
          <VerticalGroup align="center">
            <Icon name="apps" size="xxxl" />
            <div>No workload data available</div>
            <div style={{ fontSize: '12px' }}>Query workload metrics from HarchOS data source</div>
          </VerticalGroup>
        </div>
      );
    }

    const limitedWorkloads = workloads.slice(0, options.maxWorkloads || 20);
    const groups = groupWorkloads(limitedWorkloads, options.groupBy);

    return (
      <div className={getStyles().container}>
        {this.renderSummary(limitedWorkloads)}
        {(() => {
          switch (options.displayMode) {
            case WorkloadDisplayMode.Treemap:
              return this.renderTreemap(groups);
            case WorkloadDisplayMode.PieChart:
              return this.renderPieChart(groups);
            case WorkloadDisplayMode.StackedBar:
              return this.renderStackedBar(groups);
            case WorkloadDisplayMode.Table:
              return this.renderCards(groups);
            case WorkloadDisplayMode.Bubble:
              return this.renderCards(groups);
            default:
              return this.renderCards(groups);
          }
        })()}
      </div>
    );
  }

  private renderSummary(workloads: WorkloadDataPoint[]) {
    const { options } = this.props;
    const styles = getStyles();

    const totalCpu = workloads.reduce((s, w) => s + w.cpuUsed, 0);
    const totalMemory = workloads.reduce((s, w) => s + w.memoryUsedBytes, 0);
    const totalTasks = workloads.reduce((s, w) => s + w.taskCount, 0);
    const totalEnergy = workloads.reduce((s, w) => s + w.energyKwh, 0);
    const runningCount = workloads.filter((w) => w.status === WorkloadStatus.Running).length;

    return (
      <div className={styles.summaryRow}>
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue}>{workloads.length}</div>
          <div className={styles.summaryLabel}>Total Workloads</div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue} style={{ color: '#73BF69' }}>{runningCount}</div>
          <div className={styles.summaryLabel}>Running</div>
        </div>
        {options.showCpu && (
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>{totalCpu.toFixed(1)}</div>
            <div className={styles.summaryLabel}>CPU Cores</div>
          </div>
        )}
        {options.showMemory && (
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>{formatBytes(totalMemory)}</div>
            <div className={styles.summaryLabel}>Memory Used</div>
          </div>
        )}
        {options.showTaskCounts && (
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>{totalTasks}</div>
            <div className={styles.summaryLabel}>Total Tasks</div>
          </div>
        )}
        {options.showEnergyPerWorkload && (
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>{totalEnergy.toFixed(2)}</div>
            <div className={styles.summaryLabel}>Energy (kWh)</div>
          </div>
        )}
      </div>
    );
  }

  private renderCards(groups: WorkloadGroup[]) {
    const { options } = this.props;
    const styles = getStyles();
    const colors = COLOR_PALETTES[options.colorScheme] || COLOR_PALETTES[WorkloadColorScheme.Default];

    return (
      <div className={styles.groupGrid}>
        {groups.map((group, idx) => {
          const color = colors[idx % colors.length];
          return (
            <div className={styles.groupCard} key={group.key} style={{ borderLeftColor: color, borderLeftWidth: '3px' }}>
              <div className={styles.groupHeader}>
                <span className={styles.groupName}>{group.key}</span>
                <span className={styles.groupCount}>{group.count} workload{group.count !== 1 ? 's' : ''}</span>
              </div>

              {options.showCpu && (
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>CPU</span>
                  <span className={styles.metricValue}>
                    {group.totalCpu.toFixed(2)} / {group.totalCpuRequested.toFixed(2)} cores
                  </span>
                </div>
              )}

              {options.showMemory && (
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Memory</span>
                  <span className={styles.metricValue}>
                    {formatBytes(group.totalMemoryBytes)} / {formatBytes(group.totalMemoryRequestedBytes)}
                  </span>
                </div>
              )}

              {options.showTaskCounts && (
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Tasks</span>
                  <span className={styles.metricValue}>{group.totalTasks}</span>
                </div>
              )}

              {options.showEnergyPerWorkload && (
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Energy</span>
                  <span className={styles.metricValue}>{group.totalEnergyKwh.toFixed(3)} kWh</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  private renderTreemap(groups: WorkloadGroup[]) {
    const { options, width, height } = this.props;
    const styles = getStyles();
    const colors = COLOR_PALETTES[options.colorScheme] || COLOR_PALETTES[WorkloadColorScheme.Default];

    const maxCpu = Math.max(...groups.map((g) => g.totalCpu), 1);

    return (
      <div className={styles.treemapContainer} style={{ height: height - 80 }}>
        {groups.map((group, idx) => {
          const proportion = group.totalCpu / maxCpu;
          const minDim = 60;
          const size = Math.max(minDim, Math.sqrt(proportion) * Math.min(width - 40, height - 100));

          return (
            <div
              className={styles.treemapCell}
              key={group.key}
              style={{
                background: colors[idx % colors.length],
                width: `${size}px`,
                height: `${size}px`,
                flexBasis: `${size}px`,
              }}
            >
              <span className={styles.treemapLabel}>{group.key}</span>
              <span className={styles.treemapValue}>{group.totalCpu.toFixed(1)} cores</span>
            </div>
          );
        })}
      </div>
    );
  }

  private renderPieChart(groups: WorkloadGroup[]) {
    const { options } = this.props;
    const styles = getStyles();
    const colors = COLOR_PALETTES[options.colorScheme] || COLOR_PALETTES[WorkloadColorScheme.Default];

    const totalCpu = groups.reduce((s, g) => s + g.totalCpu, 0) || 1;
    const size = 200;
    const radius = size / 2 - 10;
    const cx = size / 2;
    const cy = size / 2;

    let currentAngle = 0;
    const slices = groups.map((group, idx) => {
      const proportion = group.totalCpu / totalCpu;
      const startAngle = currentAngle;
      const endAngle = currentAngle + proportion * 2 * Math.PI;
      currentAngle = endAngle;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);
      const largeArcFlag = proportion > 0.5 ? 1 : 0;

      return {
        path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
        color: colors[idx % colors.length],
        group,
        proportion,
      };
    });

    return (
      <div className={styles.pieContainer}>
        <svg width={size} height={size} className={styles.pieSvg}>
          {slices.map((slice, idx) => (
            <path key={idx} d={slice.path} fill={slice.color} stroke="#1a1a1a" strokeWidth="1" />
          ))}
        </svg>
        <div className={styles.legendContainer}>
          {groups.map((group, idx) => (
            <div className={styles.legendItem} key={group.key}>
              <div className={styles.legendDot} style={{ background: colors[idx % colors.length] }} />
              <span style={{ color: '#D6D6D6' }}>{group.key}</span>
              <span style={{ color: '#8E8E8E', marginLeft: 'auto' }}>
                {((group.totalCpu / totalCpu) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  private renderStackedBar(groups: WorkloadGroup[]) {
    const { options, width } = this.props;
    const styles = getStyles();
    const colors = COLOR_PALETTES[options.colorScheme] || COLOR_PALETTES[WorkloadColorScheme.Default];

    return (
      <div>
        {groups.map((group, idx) => (
          <div className={styles.barRow} key={group.key}>
            <span className={styles.barLabel}>{group.key}</span>
            <BarGauge
              value={group.totalCpu}
              displayValue={`${group.totalCpu.toFixed(2)} cores`}
              thresholds={[
                { value: 0, color: colors[idx % colors.length] },
              ]}
              height={20}
              width={width - 140}
            />
          </div>
        ))}
      </div>
    );
  }
}
