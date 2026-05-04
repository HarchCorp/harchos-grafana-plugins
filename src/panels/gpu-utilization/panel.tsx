import { PureComponent } from 'react';
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
  Gauge,
  BarGauge,
  VerticalGroup,
  Icon,
} from '@grafana/ui';
import { css } from '@emotion/css';

import { GpuUtilizationOptions, GpuDisplayMode, GpuDataPoint } from './types';

interface Props extends PanelProps<GpuUtilizationOptions> {}

/**
 * Extract GPU data points from the panel's data frames.
 */
function extractGpuData(frames: DataFrame[]): GpuDataPoint[] {
  const dataPoints: GpuDataPoint[] = [];

  for (const frame of frames) {
    const timeField = frame.fields.find((f) => f.type === FieldType.time);
    const valueField = frame.fields.find((f) => f.type === FieldType.number);

    if (!valueField) continue;

    const metricName = getFieldDisplayName(valueField, frame);
    const labels = valueField.labels || {};

    for (let i = 0; i < frame.length; i++) {
      const value = valueField.values[i];
      if (value == null) continue;

      const deviceIndex = parseInt(labels.deviceIndex || labels.gpu || '0', 10);
      const deviceName = labels.deviceName || labels.gpu_name || `GPU ${deviceIndex}`;

      let existing = dataPoints.find(
        (dp) => dp.deviceIndex === deviceIndex && dp.timestamp === (timeField?.values[i] ?? 0),
      );

      if (!existing) {
        existing = {
          deviceIndex,
          deviceName,
          utilizationPercent: 0,
          memoryUtilizationPercent: 0,
          temperatureCelsius: 0,
          vramUsedBytes: 0,
          vramTotalBytes: 0,
          powerDrawWatts: 0,
          powerLimitWatts: 0,
          timestamp: timeField?.values[i] ?? 0,
        };
        dataPoints.push(existing);
      }

      const lowerMetric = metricName.toLowerCase();
      if (lowerMetric.includes('utilization') || lowerMetric.includes('compute')) {
        existing.utilizationPercent = value;
      } else if (lowerMetric.includes('memory') || lowerMetric.includes('vram_util')) {
        existing.memoryUtilizationPercent = value;
      } else if (lowerMetric.includes('temperature') || lowerMetric.includes('temp')) {
        existing.temperatureCelsius = value;
      } else if (lowerMetric.includes('vram_used') || lowerMetric.includes('memory_used')) {
        existing.vramUsedBytes = value;
      } else if (lowerMetric.includes('vram_total') || lowerMetric.includes('memory_total')) {
        existing.vramTotalBytes = value;
      } else if (lowerMetric.includes('power_draw') || lowerMetric.includes('power')) {
        existing.powerDrawWatts = value;
      } else if (lowerMetric.includes('power_limit')) {
        existing.powerLimitWatts = value;
      } else {
        existing.utilizationPercent = value;
      }
    }
  }

  return dataPoints.sort((a, b) => a.deviceIndex - b.deviceIndex);
}

function getUtilizationColor(percent: number): string {
  if (percent >= 90) return '#E02F44';
  if (percent >= 70) return '#FF9830';
  if (percent >= 50) return '#FFB347';
  return '#73BF69';
}

function getTemperatureColor(temp: number, warning: number, critical: number): string {
  if (temp >= critical) return '#E02F44';
  if (temp >= warning) return '#FF9830';
  return '#73BF69';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

const getStyles = () => ({
  container: css({
    width: '100%',
    height: '100%',
    overflow: 'auto',
    padding: '8px',
  }),
  gpuGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px',
  }),
  gpuCard: css({
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }),
  gpuHeader: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  }),
  gpuName: css({
    fontSize: '13px',
    fontWeight: 600,
    color: '#D6D6D6',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  gpuIndex: css({
    fontSize: '11px',
    color: '#8E8E8E',
    background: 'rgba(255, 255, 255, 0.08)',
    padding: '2px 6px',
    borderRadius: '4px',
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
  barContainer: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '8px',
  }),
  barRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }),
  barLabel: css({
    width: '80px',
    fontSize: '12px',
    color: '#D6D6D6',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
});

const gaugeThresholds = [
  { value: 0, color: '#73BF69' },
  { value: 50, color: '#FFB347' },
  { value: 70, color: '#FF9830' },
  { value: 90, color: '#E02F44' },
];

export class GpuUtilizationPanel extends PureComponent<Props> {
  render() {
    const { data, options } = this.props;
    const dataPoints = extractGpuData(data.series);

    if (dataPoints.length === 0) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#8E8E8E' }}>
          <VerticalGroup align="center">
            <Icon name="monitor" size="xxxl" />
            <div>No GPU data available</div>
            <div style={{ fontSize: '12px' }}>Configure a HarchOS data source with GPU metrics</div>
          </VerticalGroup>
        </div>
      );
    }

    switch (options.displayMode) {
      case GpuDisplayMode.Gauges:
        return this.renderGauges(dataPoints);
      case GpuDisplayMode.Stats:
        return this.renderStats(dataPoints);
      case GpuDisplayMode.BarChart:
        return this.renderBarChart(dataPoints);
      case GpuDisplayMode.TimeSeries:
      default:
        return this.renderGauges(dataPoints);
    }
  }

  private renderGauges(dataPoints: GpuDataPoint[]) {
    const { options } = this.props;
    const styles = getStyles();

    return (
      <div className={styles.container}>
        <div className={styles.gpuGrid}>
          {dataPoints.map((gpu) => (
            <div className={styles.gpuCard} key={gpu.deviceIndex}>
              <div className={styles.gpuHeader}>
                <span className={styles.gpuName}>{gpu.deviceName}</span>
                <span className={styles.gpuIndex}>GPU {gpu.deviceIndex}</span>
              </div>

              {/* Utilization gauge */}
              <Gauge
                value={{ numeric: gpu.utilizationPercent, text: `${gpu.utilizationPercent.toFixed(1)}%` }}
                field={{ thresholds: { mode: 0 as const, steps: gaugeThresholds }, unit: '%' } as any}
                theme={{} as any}
                showThresholdMarkers={true}
                showThresholdLabels={false}
                height={80}
                width={200}
              />

              {options.showTemperature && gpu.temperatureCelsius > 0 && (
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Temperature</span>
                  <span className={styles.metricValue} style={{ color: getTemperatureColor(gpu.temperatureCelsius, options.temperatureWarning, options.temperatureCritical) }}>
                    {gpu.temperatureCelsius.toFixed(0)}°C
                  </span>
                </div>
              )}

              {options.showVram && gpu.vramTotalBytes > 0 && (
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>VRAM</span>
                  <span className={styles.metricValue}>
                    {formatBytes(gpu.vramUsedBytes)} / {formatBytes(gpu.vramTotalBytes)}
                  </span>
                </div>
              )}

              {gpu.powerDrawWatts > 0 && (
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Power</span>
                  <span className={styles.metricValue}>
                    {gpu.powerDrawWatts.toFixed(0)}W
                    {gpu.powerLimitWatts > 0 ? ` / ${gpu.powerLimitWatts.toFixed(0)}W` : ''}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {options.showAverage && this.renderAverageStat(dataPoints)}
      </div>
    );
  }

  private renderStats(dataPoints: GpuDataPoint[]) {
    const styles = getStyles();

    return (
      <div className={styles.container}>
        <div className={styles.gpuGrid}>
          {dataPoints.map((gpu) => (
            <BigValue
              key={gpu.deviceIndex}
              value={{
                numeric: gpu.utilizationPercent,
                text: `${gpu.utilizationPercent.toFixed(1)}%`,
                title: gpu.deviceName,
                color: getUtilizationColor(gpu.utilizationPercent),
              }}
              colorMode={BigValueColorMode.Value}
              graphMode={BigValueGraphMode.Area}
              textMode={BigValueTextMode.ValueAndName}
              height={80}
              width={200}
            />
          ))}
        </div>
      </div>
    );
  }

  private renderBarChart(dataPoints: GpuDataPoint[]) {
    const styles = getStyles();

    return (
      <div className={styles.barContainer}>
        {dataPoints.map((gpu) => (
          <div className={styles.barRow} key={gpu.deviceIndex}>
            <span className={styles.barLabel}>{gpu.deviceName}</span>
            <BarGauge
              value={{ numeric: gpu.utilizationPercent, text: `${gpu.utilizationPercent.toFixed(1)}%` }}
              field={{ thresholds: { mode: 0 as const, steps: gaugeThresholds } } as any}
              theme={{} as any}
              height={24}
              width={this.props.width - 140}
              displayMode={'gradient' as any}
              orientation={'horizontal' as any}
            />
          </div>
        ))}
      </div>
    );
  }

  private renderAverageStat(dataPoints: GpuDataPoint[]) {
    const avgUtil = dataPoints.reduce((sum, dp) => sum + dp.utilizationPercent, 0) / dataPoints.length;

    return (
      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
        <BigValue
          value={{
            numeric: avgUtil,
            text: `${avgUtil.toFixed(1)}%`,
            title: 'Average Utilization',
            color: getUtilizationColor(avgUtil),
          }}
          colorMode={BigValueColorMode.Value}
          graphMode={BigValueGraphMode.None}
          textMode={BigValueTextMode.ValueAndName}
          height={60}
          width={200}
        />
      </div>
    );
  }
}
