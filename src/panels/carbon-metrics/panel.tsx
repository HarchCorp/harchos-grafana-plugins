import React, { PureComponent } from 'react';
import {
  PanelProps,
  DataFrame,
  FieldType,
  getFieldDisplayName,
  getValueFormat,
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
  Sparkline,
  ThresholdsConfig,
  ThresholdsMode,
} from '@grafana/ui';
import { css } from '@emotion/css';

import {
  CarbonMetricsOptions,
  CarbonDisplayMode,
  CarbonUnit,
  CarbonDataPoint,
  CarbonEquivalent,
  calculateEquivalents,
} from './types';

interface Props extends PanelProps<CarbonMetricsOptions> {}

/**
 * Extract carbon data from panel data frames.
 */
function extractCarbonData(frames: DataFrame[], intensityFactor: number): CarbonDataPoint[] {
  const dataPoints: CarbonDataPoint[] = [];

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

      // Find or create a data point
      let existing = dataPoints.find((dp) => dp.zone === zone && dp.timestamp === timestamp);
      if (!existing) {
        existing = {
          zone,
          energyKwh: 0,
          carbonGrams: 0,
          timestamp,
          source: labels.source,
          pue: labels.pue ? parseFloat(labels.pue) : undefined,
        };
        dataPoints.push(existing);
      }

      const lowerMetric = metricName.toLowerCase();
      if (lowerMetric.includes('energy') || lowerMetric.includes('kwh') || lowerMetric.includes('watt')) {
        existing.energyKwh = value;
        // Auto-calculate carbon if not present
        if (existing.carbonGrams === 0) {
          existing.carbonGrams = value * intensityFactor;
        }
      } else if (lowerMetric.includes('carbon') || lowerMetric.includes('co2') || lowerMetric.includes('emission')) {
        existing.carbonGrams = value;
      } else {
        // Default: treat as carbon grams
        existing.carbonGrams = value;
      }
    }
  }

  return dataPoints.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Convert carbon grams to the selected unit.
 */
function convertCarbonUnit(grams: number, unit: CarbonUnit): number {
  switch (unit) {
    case CarbonUnit.KilogramsCO2:
      return grams / 1000;
    case CarbonUnit.MetricTonsCO2:
      return grams / 1_000_000;
    case CarbonUnit.GramsCO2:
    default:
      return grams;
  }
}

/**
 * Format carbon value with unit.
 */
function formatCarbonValue(grams: number, unit: CarbonUnit): string {
  const value = convertCarbonUnit(grams, unit);
  const unitStr = unit === CarbonUnit.GramsCO2 ? 'g' : unit === CarbonUnit.KilogramsCO2 ? 'kg' : 't';
  return `${value.toFixed(value < 10 ? 2 : 1)} ${unitStr} CO₂`;
}

/**
 * Get sustainability score color.
 */
function getCarbonColor(grams: number, target: number): string {
  if (target <= 0) return '#73BF69';
  const ratio = grams / target;
  if (ratio > 1.5) return '#E02F44';
  if (ratio > 1.0) return '#FF9830';
  if (ratio > 0.7) return '#FFB347';
  return '#73BF69';
}

// ── Styles ────────────────────────────────────────────────────────────────────────

const getStyles = () => ({
  container: css({
    width: '100%',
    height: '100%',
    overflow: 'auto',
    padding: '12px',
  }),
  grid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  }),
  card: css({
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }),
  cardHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  }),
  zoneLabel: css({
    fontSize: '14px',
    fontWeight: 600,
    color: '#D6D6D6',
  }),
  sourceBadge: css({
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '12px',
    background: 'rgba(115, 191, 105, 0.15)',
    color: '#73BF69',
  }),
  metricRow: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    fontSize: '13px',
  }),
  metricLabel: css({ color: '#A0A0A0' }),
  metricValue: css({ fontWeight: 500, color: '#D6D6D6' }),
  equivalentsGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px',
  }),
  equivalentCard: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
  }),
  equivalentIcon: css({
    fontSize: '28px',
    marginBottom: '8px',
  }),
  equivalentValue: css({
    fontSize: '20px',
    fontWeight: 700,
    color: '#73BF69',
  }),
  equivalentLabel: css({
    fontSize: '11px',
    color: '#8E8E8E',
    marginTop: '4px',
  }),
  sustainabilityBar: css({
    width: '100%',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '8px',
  }),
  sustainabilityFill: css({
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease-in-out',
  }),
});

/**
 * Carbon Metrics Panel Component
 *
 * Displays energy consumption, carbon emissions, and sustainability
 * metrics from HarchOS observability data. Supports multiple visualization
 * modes including single stat, breakdown, timeline, and carbon equivalents.
 */
export class CarbonMetricsPanel extends PureComponent<Props> {
  render() {
    const { data, options } = this.props;
    const dataPoints = extractCarbonData(data.series, options.carbonIntensityFactor);

    if (dataPoints.length === 0) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#8E8E8E' }}>
          <VerticalGroup align="center">
            <Icon name="leaf" size="xxxl" />
            <div>No carbon data available</div>
            <div style={{ fontSize: '12px' }}>Use EnergyQL to query carbon metrics from HarchOS</div>
          </VerticalGroup>
        </div>
      );
    }

    switch (options.displayMode) {
      case CarbonDisplayMode.SingleStat:
        return this.renderSingleStat(dataPoints);
      case CarbonDisplayMode.Breakdown:
        return this.renderBreakdown(dataPoints);
      case CarbonDisplayMode.Timeline:
        return this.renderBreakdown(dataPoints);
      case CarbonDisplayMode.Equivalents:
        return this.renderEquivalents(dataPoints);
      default:
        return this.renderBreakdown(dataPoints);
    }
  }

  private renderSingleStat(dataPoints: CarbonDataPoint[]) {
    const { options } = this.props;
    const styles = getStyles();

    // Sum all carbon for the latest time point
    const totalCarbon = dataPoints.reduce((sum, dp) => sum + dp.carbonGrams, 0);
    const totalEnergy = dataPoints.reduce((sum, dp) => sum + dp.energyKwh, 0);
    const color = getCarbonColor(totalCarbon, options.sustainabilityTarget);

    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <VerticalGroup align="center" spacing="lg">
          <BigValue
            value={{
              numeric: convertCarbonUnit(totalCarbon, options.carbonUnit),
              suffix: ` ${options.carbonUnit} CO₂`,
              title: 'Carbon Emissions',
              color,
            }}
            colorMode={BigValueColorMode.Background}
            graphMode={BigValueGraphMode.Area}
            textMode={BigValueTextMode.ValueAndName}
            height={120}
            width={300}
          />

          {options.showEnergy && (
            <div className={styles.metricRow} style={{ width: '100%' }}>
              <span className={styles.metricLabel}>⚡ Energy Consumed</span>
              <span className={styles.metricValue}>{totalEnergy.toFixed(2)} kWh</span>
            </div>
          )}

          {options.showCost && (
            <div className={styles.metricRow} style={{ width: '100%' }}>
              <span className={styles.metricLabel}>💰 Estimated Cost</span>
              <span className={styles.metricValue}>${(totalEnergy * options.energyPricePerKwh).toFixed(2)}</span>
            </div>
          )}

          {options.sustainabilityTarget > 0 && (
            <div style={{ width: '100%' }}>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>🎯 Sustainability Target</span>
                <span className={styles.metricValue}>
                  {formatCarbonValue(options.sustainabilityTarget, options.carbonUnit)}
                </span>
              </div>
              <div className={styles.sustainabilityBar}>
                <div
                  className={styles.sustainabilityFill}
                  style={{
                    width: `${Math.min(100, (totalCarbon / options.sustainabilityTarget) * 100)}%`,
                    background: color,
                  }}
                />
              </div>
            </div>
          )}
        </VerticalGroup>
      </div>
    );
  }

  private renderBreakdown(dataPoints: CarbonDataPoint[]) {
    const { options } = this.props;
    const styles = getStyles();

    // Group by zone
    const byZone = new Map<string, CarbonDataPoint[]>();
    for (const dp of dataPoints) {
      const list = byZone.get(dp.zone) || [];
      list.push(dp);
      byZone.set(dp.zone, list);
    }

    return (
      <div className={styles.container}>
        <div className={styles.grid}>
          {Array.from(byZone.entries()).map(([zone, points]) => {
            const latestPoint = points[points.length - 1];
            const totalCarbon = points.reduce((sum, dp) => sum + dp.carbonGrams, 0);
            const totalEnergy = points.reduce((sum, dp) => sum + dp.energyKwh, 0);
            const color = getCarbonColor(totalCarbon, options.sustainabilityTarget);

            return (
              <div className={styles.card} key={zone}>
                <div className={styles.cardHeader}>
                  <span className={styles.zoneLabel}>{zone}</span>
                  {latestPoint.source && (
                    <span className={styles.sourceBadge}>{latestPoint.source}</span>
                  )}
                </div>

                <Gauge
                  value={convertCarbonUnit(totalCarbon, options.carbonUnit)}
                  unit={` ${options.carbonUnit}`}
                  thresholds={[
                    { value: 0, color: '#73BF69' },
                    { value: convertCarbonUnit(options.sustainabilityTarget * 0.7, options.carbonUnit), color: '#FFB347' },
                    { value: convertCarbonUnit(options.sustainabilityTarget, options.carbonUnit), color: '#E02F44' },
                  ]}
                  height={80}
                />

                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>⚡ Energy</span>
                  <span className={styles.metricValue}>{totalEnergy.toFixed(2)} kWh</span>
                </div>

                {options.showCost && (
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>💰 Cost</span>
                    <span className={styles.metricValue}>${(totalEnergy * options.energyPricePerKwh).toFixed(2)}</span>
                  </div>
                )}

                {latestPoint.pue && (
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>🏢 PUE</span>
                    <span className={styles.metricValue}>{latestPoint.pue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  private renderEquivalents(dataPoints: CarbonDataPoint[]) {
    const { options } = this.props;
    const styles = getStyles();

    const totalCarbon = dataPoints.reduce((sum, dp) => sum + dp.carbonGrams, 0);
    const equivalents = calculateEquivalents(totalCarbon);

    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: '#8E8E8E', marginBottom: '4px' }}>Carbon Equivalents</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#D6D6D6' }}>
            {formatCarbonValue(totalCarbon, options.carbonUnit)}
          </div>
        </div>

        <div className={styles.equivalentsGrid}>
          {equivalents.map((eq) => (
            <div className={styles.equivalentCard} key={eq.label}>
              <div className={styles.equivalentIcon}>
                <Icon name={eq.icon as any} size="xxxl" />
              </div>
              <div className={styles.equivalentValue}>{eq.value < 1 ? eq.value.toFixed(3) : eq.value.toFixed(1)}</div>
              <div className={styles.equivalentLabel}>
                {eq.unit} — {eq.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
