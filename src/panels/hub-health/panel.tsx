import React, { PureComponent } from 'react';
import {
  PanelProps,
  DataFrame,
  FieldType,
  getFieldDisplayName,
  dateTimeFormat,
} from '@grafana/data';
import {
  BigValue,
  BigValueColorMode,
  BigValueGraphMode,
  BigValueTextMode,
  Gauge,
  HorizontalGroup,
  VerticalGroup,
  Icon,
  Tooltip,
  Badge,
  TableCellDisplayMode,
} from '@grafana/ui';
import { css } from '@emotion/css';

import {
  HubHealthOptions,
  HubDisplayMode,
  HubSortField,
  HubStatus,
  HubHealthDataPoint,
  determineHubStatus,
  getStatusColor,
  getStatusIcon,
} from './types';

interface Props extends PanelProps<HubHealthOptions> {}

/**
 * Extract hub health data from panel data frames.
 */
function extractHubData(frames: DataFrame[], options: HubHealthOptions): HubHealthDataPoint[] {
  const dataPoints: HubHealthDataPoint[] = [];

  for (const frame of frames) {
    const timeField = frame.fields.find((f) => f.type === FieldType.time);
    const valueField = frame.fields.find((f) => f.type === FieldType.number);

    if (!valueField) continue;

    const metricName = getFieldDisplayName(valueField, frame);
    const labels = valueField.labels || {};

    for (let i = 0; i < frame.length; i++) {
      const value = valueField.values[i];
      if (value == null) continue;

      const hubId = labels.hub_id || labels.hub || labels.instance || 'unknown';
      const hubName = labels.hub_name || labels.hub || hubId;
      const region = labels.region || labels.zone || 'default';

      // Find or create data point
      let existing = dataPoints.find((dp) => dp.hubId === hubId);
      if (!existing) {
        existing = {
          hubId,
          hubName,
          region,
          status: HubStatus.Healthy,
          uptimePercent: 100,
          latencyMs: 0,
          latencyP99Ms: 0,
          requestsPerSecond: 0,
          errorRatePercent: 0,
          activeConnections: 0,
          sovereigntyCompliant: true,
          lastHeartbeat: timeField?.values[i] ?? 0,
          version: labels.version,
        };
        dataPoints.push(existing);
      }

      // Route metric to the correct field
      const lowerMetric = metricName.toLowerCase();
      if (lowerMetric.includes('latency') || lowerMetric.includes('duration')) {
        if (lowerMetric.includes('p99')) {
          existing.latencyP99Ms = value;
        } else {
          existing.latencyMs = value;
        }
      } else if (lowerMetric.includes('error_rate') || lowerMetric.includes('errorrate')) {
        existing.errorRatePercent = value;
      } else if (lowerMetric.includes('request_rate') || lowerMetric.includes('rps')) {
        existing.requestsPerSecond = value;
      } else if (lowerMetric.includes('uptime')) {
        existing.uptimePercent = value;
      } else if (lowerMetric.includes('connection') || lowerMetric.includes('active')) {
        existing.activeConnections = value;
      } else if (lowerMetric.includes('sovereignty') || lowerMetric.includes('compliance')) {
        existing.sovereigntyCompliant = value > 0;
      } else if (lowerMetric.includes('heartbeat')) {
        existing.lastHeartbeat = value;
      }

      // Determine status from metrics
      existing.status = determineHubStatus(
        existing.latencyMs,
        existing.errorRatePercent,
        existing.uptimePercent,
        options,
      );
    }
  }

  // Sort hubs
  const sorted = dataPoints.sort((a, b) => {
    switch (options.sortBy) {
      case HubSortField.Latency:
        return b.latencyMs - a.latencyMs;
      case HubSortField.ErrorRate:
        return b.errorRatePercent - a.errorRatePercent;
      case HubSortField.Status:
        const statusOrder = { [HubStatus.Offline]: 0, [HubStatus.Unhealthy]: 1, [HubStatus.Degraded]: 2, [HubStatus.Healthy]: 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      case HubSortField.Name:
      default:
        return a.hubName.localeCompare(b.hubName);
    }
  });

  return sorted;
}

/**
 * Format milliseconds to human-readable.
 */
function formatLatency(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Time since last heartbeat.
 */
function timeSinceHeartbeat(timestamp: number): string {
  if (!timestamp) return 'Never';
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

// ── Styles ────────────────────────────────────────────────────────────────────────

const getStyles = () => ({
  container: css({
    width: '100%',
    height: '100%',
    overflow: 'auto',
    padding: '12px',
  }),
  statusGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '10px',
  }),
  statusCell: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 8px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.08)',
    },
  }),
  statusIndicator: css({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    marginBottom: '6px',
  }),
  hubNameLabel: css({
    fontSize: '12px',
    fontWeight: 600,
    color: '#D6D6D6',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  }),
  regionLabel: css({
    fontSize: '10px',
    color: '#8E8E8E',
    marginTop: '2px',
  }),
  hubCard: css({
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
  }),
  hubGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '12px',
  }),
  cardHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  }),
  cardTitle: css({
    fontSize: '14px',
    fontWeight: 600,
    color: '#D6D6D6',
  }),
  metricRow: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '3px 0',
    fontSize: '12px',
  }),
  metricLabel: css({ color: '#A0A0A0' }),
  metricValue: css({ fontWeight: 500 }),
  miniCard: css({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
  }),
  miniGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '8px',
  }),
});

/**
 * Hub Health Panel Component
 *
 * Displays health status, latency, error rates, and availability
 * of HarchOS Hub instances from observability data.
 */
export class HubHealthPanel extends PureComponent<Props> {
  render() {
    const { data, options } = this.props;
    const dataPoints = extractHubData(data.series, options);

    if (dataPoints.length === 0) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#8E8E8E' }}>
          <VerticalGroup align="center">
            <Icon name="heart" size="xxxl" />
            <div>No hub health data available</div>
            <div style={{ fontSize: '12px' }}>Configure a HarchOS data source with hub metrics</div>
          </VerticalGroup>
        </div>
      );
    }

    switch (options.displayMode) {
      case HubDisplayMode.StatusGrid:
        return this.renderStatusGrid(dataPoints);
      case HubDisplayMode.Table:
        return this.renderCards(dataPoints);
      case HubDisplayMode.Gauges:
        return this.renderGauges(dataPoints);
      case HubDisplayMode.MiniCards:
        return this.renderMiniCards(dataPoints);
      default:
        return this.renderStatusGrid(dataPoints);
    }
  }

  private renderStatusGrid(dataPoints: HubHealthDataPoint[]) {
    const styles = getStyles();

    return (
      <div className={styles.container}>
        <div className={styles.statusGrid}>
          {dataPoints.map((hub) => (
            <Tooltip key={hub.hubId} content={this.renderTooltip(hub)}>
              <div className={styles.statusCell}>
                <div
                  className={styles.statusIndicator}
                  style={{ background: getStatusColor(hub.status) }}
                />
                <div className={styles.hubNameLabel}>{hub.hubName}</div>
                <div className={styles.regionLabel}>{hub.region}</div>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  }

  private renderCards(dataPoints: HubHealthDataPoint[]) {
    const { options } = this.props;
    const styles = getStyles();

    return (
      <div className={styles.container}>
        <div className={styles.hubGrid}>
          {dataPoints.map((hub) => (
            <div className={styles.hubCard} key={hub.hubId}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{hub.hubName}</span>
                <Icon
                  name={getStatusIcon(hub.status) as any}
                  style={{ color: getStatusColor(hub.status), fontSize: '18px' }}
                />
              </div>

              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Status</span>
                <span className={styles.metricValue} style={{ color: getStatusColor(hub.status) }}>
                  {hub.status.charAt(0).toUpperCase() + hub.status.slice(1)}
                </span>
              </div>

              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Uptime</span>
                <span className={styles.metricValue}>{hub.uptimePercent.toFixed(2)}%</span>
              </div>

              {options.showLatency && (
                <>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Latency (avg)</span>
                    <span
                      className={styles.metricValue}
                      style={{ color: hub.latencyMs > options.latencyWarningMs ? '#FF9830' : '#73BF69' }}
                    >
                      {formatLatency(hub.latencyMs)}
                    </span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Latency (p99)</span>
                    <span className={styles.metricValue}>{formatLatency(hub.latencyP99Ms)}</span>
                  </div>
                </>
              )}

              {options.showRequestRates && (
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Requests/s</span>
                  <span className={styles.metricValue}>{hub.requestsPerSecond.toFixed(1)}</span>
                </div>
              )}

              {options.showErrorRates && (
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Error Rate</span>
                  <span
                    className={styles.metricValue}
                    style={{ color: hub.errorRatePercent > options.errorRateWarningPercent ? '#E02F44' : '#73BF69' }}
                  >
                    {hub.errorRatePercent.toFixed(2)}%
                  </span>
                </div>
              )}

              {options.showSovereigntyCompliance && (
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Sovereignty</span>
                  <span
                    className={styles.metricValue}
                    style={{ color: hub.sovereigntyCompliant ? '#73BF69' : '#E02F44' }}
                  >
                    {hub.sovereigntyCompliant ? 'Compliant' : 'Non-compliant'}
                  </span>
                </div>
              )}

              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Connections</span>
                <span className={styles.metricValue}>{hub.activeConnections}</span>
              </div>

              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Last Heartbeat</span>
                <span className={styles.metricValue} style={{ fontSize: '11px' }}>
                  {timeSinceHeartbeat(hub.lastHeartbeat)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  private renderGauges(dataPoints: HubHealthDataPoint[]) {
    const styles = getStyles();

    return (
      <div className={styles.container}>
        <div className={styles.hubGrid}>
          {dataPoints.map((hub) => (
            <div key={hub.hubId} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#D6D6D6', marginBottom: '4px' }}>
                {hub.hubName}
              </div>
              <Gauge
                value={hub.uptimePercent}
                unit="%"
                thresholds={[
                  { value: 0, color: '#E02F44' },
                  { value: 95, color: '#FF9830' },
                  { value: 99, color: '#73BF69' },
                ]}
                height={100}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  private renderMiniCards(dataPoints: HubHealthDataPoint[]) {
    const styles = getStyles();

    return (
      <div className={styles.container}>
        <div className={styles.miniGrid}>
          {dataPoints.map((hub) => (
            <div className={styles.miniCard} key={hub.hubId}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: getStatusColor(hub.status),
                  flexShrink: 0,
                }}
              />
              <span className={styles.hubNameLabel} style={{ flex: 1 }}>{hub.hubName}</span>
              <span style={{ fontSize: '11px', color: '#8E8E8E' }}>{formatLatency(hub.latencyMs)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  private renderTooltip(hub: HubHealthDataPoint): React.ReactNode {
    return (
      <div style={{ padding: '8px', fontSize: '12px' }}>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{hub.hubName}</div>
        <div>Status: {hub.status}</div>
        <div>Uptime: {hub.uptimePercent.toFixed(2)}%</div>
        <div>Latency: {formatLatency(hub.latencyMs)}</div>
        <div>Errors: {hub.errorRatePercent.toFixed(2)}%</div>
      </div>
    );
  }
}
