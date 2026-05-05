import { PureComponent } from 'react';
import { PanelProps, DataFrame, FieldType, getFieldDisplayName } from '@grafana/data';
import { VerticalGroup, Icon, Tooltip } from '@grafana/ui';
import { css } from '@emotion/css';

import {
  CarbonForecastOptions,
  CarbonForecastDisplayMode,
  CarbonForecastDataPoint,
  GreenWindow,
  classifyIntensity,
  getIntensityColor,
  getIntensityColorByValue,
  formatIntensity,
  formatForecastTime,
  CarbonIntensityLevel,
} from './types';

interface Props extends PanelProps<CarbonForecastOptions> {}

function extractForecastData(frames: DataFrame[], options: CarbonForecastOptions): CarbonForecastDataPoint[] {
  const dataPoints: CarbonForecastDataPoint[] = [];

  for (const frame of frames) {
    const timeField = frame.fields.find((f) => f.type === FieldType.time);
    const valueField = frame.fields.find((f) => f.type === FieldType.number);

    if (!valueField) continue;

    const metricName = getFieldDisplayName(valueField, frame);
    const labels = valueField.labels || {};

    for (let i = 0; i < frame.length; i++) {
      const value = valueField.values[i];
      if (value == null) continue;

      const zone = labels.zone || labels.region || labels.instance || 'default';
      const timestamp = timeField?.values[i] ?? 0;

      dataPoints.push({
        zone,
        timestamp,
        carbonIntensity: value,
        isGreenWindow: value < options.greenThreshold,
      });
    }
  }

  return dataPoints.sort((a, b) => a.timestamp - b.timestamp);
}

function identifyGreenWindows(dataPoints: CarbonForecastDataPoint[], greenThreshold: number): GreenWindow[] {
  const windows: GreenWindow[] = [];
  let windowStart: number | null = null;
  let windowIntensities: number[] = [];

  for (const dp of dataPoints) {
    if (dp.carbonIntensity < greenThreshold) {
      if (windowStart === null) {
        windowStart = dp.timestamp;
        windowIntensities = [dp.carbonIntensity];
      } else {
        windowIntensities.push(dp.carbonIntensity);
      }
    } else {
      if (windowStart !== null) {
        const minI = Math.min(...windowIntensities);
        const avgI = windowIntensities.reduce((s, v) => s + v, 0) / windowIntensities.length;
        windows.push({
          startAt: windowStart,
          endAt: dp.timestamp,
          minIntensity: minI,
          avgIntensity: avgI,
          durationMin: Math.round((dp.timestamp - windowStart) / 60000),
        });
        windowStart = null;
        windowIntensities = [];
      }
    }
  }

  // Close any open window
  if (windowStart !== null && dataPoints.length > 0) {
    const lastDp = dataPoints[dataPoints.length - 1];
    const minI = Math.min(...windowIntensities);
    const avgI = windowIntensities.reduce((s, v) => s + v, 0) / windowIntensities.length;
    windows.push({
      startAt: windowStart,
      endAt: lastDp.timestamp,
      minIntensity: minI,
      avgIntensity: avgI,
      durationMin: Math.round((lastDp.timestamp - windowStart) / 60000),
    });
  }

  return windows;
}

const getStyles = () => ({
  container: css({ width: '100%', height: '100%', overflow: 'auto', padding: '12px' }),
  timelineContainer: css({
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  }),
  timelineHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '12px',
    color: '#8E8E8E',
  }),
  timelineChart: css({ flex: 1, position: 'relative', minHeight: '120px' }),
  greenWindowOverlay: css({
    position: 'absolute',
    top: 0,
    height: '100%',
    background: 'rgba(115, 191, 105, 0.12)',
    borderLeft: '2px solid rgba(115, 191, 105, 0.4)',
    borderRight: '2px solid rgba(115, 191, 105, 0.4)',
    pointerEvents: 'none',
  }),
  barContainer: css({ display: 'flex', flexWrap: 'wrap', gap: '2px', alignItems: 'flex-end', height: '100%' }),
  barCell: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: '1 1 0',
    minWidth: '8px',
    maxWidth: '24px',
  }),
  barFill: css({ width: '100%', borderRadius: '2px 2px 0 0', minHeight: '4px' }),
  barLabel: css({ fontSize: '8px', color: '#8E8E8E', marginTop: '2px', textAlign: 'center' }),
  cardsGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
  }),
  card: css({
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
  }),
  cardHeader: css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }),
  cardZone: css({ fontSize: '14px', fontWeight: 600, color: '#D6D6D6' }),
  cardIntensity: css({ fontSize: '24px', fontWeight: 700 }),
  cardLevel: css({ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }),
  greenWindowBadge: css({
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '12px',
    background: 'rgba(115, 191, 105, 0.15)',
    color: '#73BF69',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '8px',
  }),
  legendRow: css({ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px', fontSize: '11px' }),
  legendItem: css({ display: 'flex', alignItems: 'center', gap: '4px' }),
  legendDot: css({ width: '10px', height: '10px', borderRadius: '2px' }),
  metricRow: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '3px 0',
    fontSize: '12px',
  }),
  metricLabel: css({ color: '#A0A0A0' }),
  metricValue: css({ fontWeight: 500, color: '#D6D6D6' }),
});

export class CarbonForecastPanel extends PureComponent<Props> {
  render() {
    const { data, options } = this.props;
    const dataPoints = extractForecastData(data.series, options);

    if (dataPoints.length === 0) {
      return (
        <div
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#8E8E8E' }}
        >
          <VerticalGroup align="center">
            <Icon name="cloud" size="xxxl" />
            <div>No carbon forecast data available</div>
            <div style={{ fontSize: '12px' }}>Use EnergyQL to query carbon intensity forecast from HarchOS</div>
          </VerticalGroup>
        </div>
      );
    }

    switch (options.displayMode) {
      case CarbonForecastDisplayMode.Timeline:
        return this.renderTimeline(dataPoints);
      case CarbonForecastDisplayMode.Bars:
        return this.renderBars(dataPoints);
      case CarbonForecastDisplayMode.Cards:
        return this.renderCards(dataPoints);
      default:
        return this.renderTimeline(dataPoints);
    }
  }

  private renderTimeline(dataPoints: CarbonForecastDataPoint[]) {
    const { options, width, height } = this.props;
    const styles = getStyles();
    const greenWindows = identifyGreenWindows(dataPoints, options.greenThreshold);

    const minTime = dataPoints[0]?.timestamp ?? 0;
    const maxTime = dataPoints[dataPoints.length - 1]?.timestamp ?? 1;
    const timeRange = maxTime - minTime || 1;

    const intensities = dataPoints.map((dp) => dp.carbonIntensity);
    const maxIntensity = Math.max(...intensities, options.yellowThreshold * 1.2);

    const chartHeight = Math.max(80, height - 80);
    const chartWidth = width - 24;

    // Build polyline for the forecast line
    const points = dataPoints.map((dp) => {
      const x = ((dp.timestamp - minTime) / timeRange) * chartWidth;
      const y = chartHeight - (dp.carbonIntensity / maxIntensity) * chartHeight;
      return `${x},${y}`;
    });
    const polyline = points.join(' ');

    // Threshold lines
    const greenY = chartHeight - (options.greenThreshold / maxIntensity) * chartHeight;
    const yellowY = chartHeight - (options.yellowThreshold / maxIntensity) * chartHeight;

    // Current marker (last data point)
    const currentDp = dataPoints[dataPoints.length - 1];
    const currentLevel = classifyIntensity(currentDp.carbonIntensity, options.greenThreshold, options.yellowThreshold);

    return (
      <div className={styles.container}>
        <div className={styles.timelineContainer}>
          <div className={styles.timelineHeader}>
            <span>Carbon Intensity Forecast (next {options.forecastHours}h)</span>
            <span>Current: {formatIntensity(currentDp.carbonIntensity)}</span>
          </div>

          <div className={styles.timelineChart}>
            <svg width={chartWidth} height={chartHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
              {/* Green zone background */}
              <rect x={0} y={0} width={chartWidth} height={greenY} fill="rgba(115,191,105,0.05)" />

              {/* Yellow zone background */}
              <rect
                x={0}
                y={greenY}
                width={chartWidth}
                height={yellowY - greenY}
                fill="rgba(255,152,48,0.05)"
              />

              {/* Red zone background */}
              <rect
                x={0}
                y={yellowY}
                width={chartWidth}
                height={chartHeight - yellowY}
                fill="rgba(224,47,68,0.05)"
              />

              {/* Green threshold line */}
              <line
                x1={0}
                y1={greenY}
                x2={chartWidth}
                y2={greenY}
                stroke="#73BF69"
                strokeWidth={1}
                strokeDasharray="4,4"
                opacity={0.6}
              />
              <text x={4} y={greenY - 4} fill="#73BF69" fontSize="10" opacity={0.8}>
                {options.greenThreshold} gCO₂
              </text>

              {/* Yellow threshold line */}
              <line
                x1={0}
                y1={yellowY}
                x2={chartWidth}
                y2={yellowY}
                stroke="#FF9830"
                strokeWidth={1}
                strokeDasharray="4,4"
                opacity={0.6}
              />
              <text x={4} y={yellowY - 4} fill="#FF9830" fontSize="10" opacity={0.8}>
                {options.yellowThreshold} gCO₂
              </text>

              {/* Forecast line */}
              <polyline
                points={polyline}
                fill="none"
                stroke={getIntensityColor(currentLevel)}
                strokeWidth={2}
              />

              {/* Current marker */}
              {options.showCurrentMarker && (
                <circle
                  cx={((currentDp.timestamp - minTime) / timeRange) * chartWidth}
                  cy={chartHeight - (currentDp.carbonIntensity / maxIntensity) * chartHeight}
                  r={5}
                  fill={getIntensityColor(currentLevel)}
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            </svg>

            {/* Green window overlays */}
            {options.showGreenWindows &&
              greenWindows.map((gw, idx) => {
                const left = ((gw.startAt - minTime) / timeRange) * chartWidth;
                const gwWidth = Math.max(4, ((gw.endAt - gw.startAt) / timeRange) * chartWidth);
                return (
                  <Tooltip
                    key={idx}
                    content={`Green Window: ${formatForecastTime(gw.startAt)} - ${formatForecastTime(gw.endAt)} (${gw.durationMin}min, avg ${gw.avgIntensity.toFixed(1)} gCO₂/kWh)`}
                  >
                    <div
                      className={styles.greenWindowOverlay}
                      style={{ left, width: gwWidth }}
                    />
                  </Tooltip>
                );
              })}
          </div>

          <div className={styles.legendRow}>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: '#73BF69' }} />
              <span style={{ color: '#8E8E8E' }}>&lt;{options.greenThreshold} gCO₂/kWh</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: '#FF9830' }} />
              <span style={{ color: '#8E8E8E' }}>
                {options.greenThreshold}–{options.yellowThreshold}
              </span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: '#E02F44' }} />
              <span style={{ color: '#8E8E8E' }}>&gt;{options.yellowThreshold} gCO₂/kWh</span>
            </div>
            {greenWindows.length > 0 && (
              <div className={styles.legendItem}>
                <Icon name="favorite" style={{ color: '#73BF69', fontSize: '10px' }} />
                <span style={{ color: '#73BF69' }}>{greenWindows.length} green window(s)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  private renderBars(dataPoints: CarbonForecastDataPoint[]) {
    const { options, height } = this.props;
    const styles = getStyles();
    const maxIntensity = Math.max(...dataPoints.map((dp) => dp.carbonIntensity), 1);
    const barHeight = height - 40;

    // Sample to at most 48 bars (one per 30min)
    const maxBars = 48;
    const step = Math.max(1, Math.floor(dataPoints.length / maxBars));
    const sampled = dataPoints.filter((_, i) => i % step === 0);

    return (
      <div className={styles.container}>
        <div className={styles.barContainer} style={{ height: barHeight }}>
          {sampled.map((dp, idx) => {
            const heightPct = (dp.carbonIntensity / maxIntensity) * 100;
            const color = getIntensityColorByValue(dp.carbonIntensity, options.greenThreshold, options.yellowThreshold);
            return (
              <Tooltip key={idx} content={`${formatForecastTime(dp.timestamp)}: ${formatIntensity(dp.carbonIntensity)}`}>
                <div className={styles.barCell}>
                  <div
                    className={styles.barFill}
                    style={{
                      height: `${heightPct}%`,
                      background: color,
                      opacity: dp.isGreenWindow ? 1 : 0.7,
                    }}
                  />
                  {idx % 4 === 0 && (
                    <div className={styles.barLabel}>{formatForecastTime(dp.timestamp)}</div>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>

        <div className={styles.legendRow}>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#73BF69' }} />
            <span style={{ color: '#8E8E8E' }}>Green (&lt;{options.greenThreshold})</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#FF9830' }} />
            <span style={{ color: '#8E8E8E' }}>Moderate</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#E02F44' }} />
            <span style={{ color: '#8E8E8E' }}>High (&gt;{options.yellowThreshold})</span>
          </div>
        </div>
      </div>
    );
  }

  private renderCards(dataPoints: CarbonForecastDataPoint[]) {
    const { options } = this.props;
    const styles = getStyles();
    const greenWindows = identifyGreenWindows(dataPoints, options.greenThreshold);

    // Group by zone
    const byZone = new Map<string, CarbonForecastDataPoint[]>();
    for (const dp of dataPoints) {
      const list = byZone.get(dp.zone) || [];
      list.push(dp);
      byZone.set(dp.zone, list);
    }

    return (
      <div className={styles.container}>
        <div className={styles.cardsGrid}>
          {Array.from(byZone.entries()).map(([zone, points]) => {
            const latest = points[points.length - 1];
            const level = classifyIntensity(latest.carbonIntensity, options.greenThreshold, options.yellowThreshold);
            const zoneGreenWindows = greenWindows.filter((gw) =>
              points.some((p) => p.timestamp >= gw.startAt && p.timestamp <= gw.endAt),
            );
            const nextGreenWindow = zoneGreenWindows[0];

            const avgIntensity = points.reduce((s, p) => s + p.carbonIntensity, 0) / points.length;
            const minIntensity = Math.min(...points.map((p) => p.carbonIntensity));
            const maxIntensityVal = Math.max(...points.map((p) => p.carbonIntensity));

            return (
              <div className={styles.card} key={zone}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardZone}>{options.showZoneLabels ? zone : 'Carbon Forecast'}</span>
                  <span
                    className={styles.cardLevel}
                    style={{
                      background:
                        level === CarbonIntensityLevel.Green
                          ? 'rgba(115,191,105,0.15)'
                          : level === CarbonIntensityLevel.Yellow
                          ? 'rgba(255,152,48,0.15)'
                          : 'rgba(224,47,68,0.15)',
                      color: getIntensityColor(level),
                    }}
                  >
                    {level === CarbonIntensityLevel.Green
                      ? 'Green'
                      : level === CarbonIntensityLevel.Yellow
                      ? 'Moderate'
                      : 'High'}
                  </span>
                </div>

                <div className={styles.cardIntensity} style={{ color: getIntensityColor(level) }}>
                  {latest.carbonIntensity.toFixed(1)}
                </div>
                <div style={{ fontSize: '11px', color: '#8E8E8E' }}>gCO₂/kWh (current)</div>

                <div style={{ marginTop: '10px' }}>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Avg (24h)</span>
                    <span className={styles.metricValue}>{avgIntensity.toFixed(1)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Min</span>
                    <span className={styles.metricValue} style={{ color: '#73BF69' }}>
                      {minIntensity.toFixed(1)}
                    </span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Max</span>
                    <span className={styles.metricValue} style={{ color: '#E02F44' }}>
                      {maxIntensityVal.toFixed(1)}
                    </span>
                  </div>
                </div>

                {options.showGreenWindows && nextGreenWindow && (
                  <div className={styles.greenWindowBadge}>
                    <Icon name="favorite" size="xs" />
                    Next green: {formatForecastTime(nextGreenWindow.startAt)} ({nextGreenWindow.durationMin}min)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
