import { PureComponent } from 'react';
import { PanelProps, DataFrame, FieldType, getFieldDisplayName } from '@grafana/data';
import { VerticalGroup, Icon, Tooltip, BarGauge } from '@grafana/ui';
import { css } from '@emotion/css';

import {
  PricingComparisonOptions,
  PricingDisplayMode,
  PricingSortField,
  PricingSortDirection,
  PricingDataPoint,
  formatPrice,
  getTierColor,
} from './types';

interface Props extends PanelProps<PricingComparisonOptions> {}

function extractPricingData(frames: DataFrame[]): PricingDataPoint[] {
  const dataPoints: PricingDataPoint[] = [];

  for (const frame of frames) {
    const timeField = frame.fields.find((f) => f.type === FieldType.time);
    const valueField = frame.fields.find((f) => f.type === FieldType.number);

    if (!valueField) continue;

    const metricName = getFieldDisplayName(valueField, frame);
    const labels = valueField.labels || {};

    for (let i = 0; i < frame.length; i++) {
      const value = valueField.values[i];
      if (value == null) continue;

      const regionId = labels.region_id || labels.region || 'unknown';
      const regionName = labels.region_name || labels.region || regionId;
      const country = labels.country || '';
      const gpuModel = labels.gpu_model || labels.gpu || 'A100';
      const pricingTier = labels.pricing_tier || labels.tier || 'standard';
      const sovereignty = labels.sovereignty || 'regional';

      // Check if this data point already exists for this region+gpu combo
      let existing = dataPoints.find(
        (dp) => dp.regionId === regionId && dp.gpuModel === gpuModel && dp.pricingTier === pricingTier,
      );

      if (!existing) {
        existing = {
          regionId,
          regionName,
          country,
          gpuModel,
          pricingTier,
          gpuHourlyPrice: 0,
          carbonIntensity: 0,
          renewablePercentage: 0,
          availableGpus: 0,
          sovereignty,
          timestamp: timeField?.values[i] ?? 0,
        };
        dataPoints.push(existing);
      }

      const lowerMetric = metricName.toLowerCase();
      if (lowerMetric.includes('price') || lowerMetric.includes('cost') || lowerMetric.includes('hourly')) {
        existing.gpuHourlyPrice = value;
      } else if (lowerMetric.includes('carbon') || lowerMetric.includes('intensity') || lowerMetric.includes('co2')) {
        existing.carbonIntensity = value;
      } else if (lowerMetric.includes('renewable') || lowerMetric.includes('green_percent')) {
        existing.renewablePercentage = value;
      } else if (lowerMetric.includes('gpu_count') || lowerMetric.includes('available')) {
        existing.availableGpus = Math.round(value);
      } else {
        existing.gpuHourlyPrice = value;
      }
    }
  }

  return dataPoints;
}

function sortPricingData(data: PricingDataPoint[], sortBy: PricingSortField, direction: PricingSortDirection): PricingDataPoint[] {
  return [...data].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case PricingSortField.Price:
        cmp = a.gpuHourlyPrice - b.gpuHourlyPrice;
        break;
      case PricingSortField.CarbonIntensity:
        cmp = a.carbonIntensity - b.carbonIntensity;
        break;
      case PricingSortField.Tier:
        cmp = a.pricingTier.localeCompare(b.pricingTier);
        break;
      case PricingSortField.Region:
      default:
        cmp = a.regionName.localeCompare(b.regionName);
        break;
    }
    return direction === PricingSortDirection.Ascending ? cmp : -cmp;
  });
}

function getCarbonColor(intensity: number): string {
  if (intensity < 100) return '#73BF69';
  if (intensity < 200) return '#FF9830';
  return '#E02F44';
}

const getStyles = () => ({
  container: css({ width: '100%', height: '100%', overflow: 'auto', padding: '12px' }),
  table: css({
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  }),
  th: css({
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: '2px solid rgba(255,255,255,0.15)',
    color: '#A0A0A0',
    fontWeight: 500,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }),
  td: css({
    padding: '8px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    color: '#D6D6D6',
  }),
  priceCell: css({ fontWeight: 600, fontSize: '13px' }),
  lowestBadge: css({
    fontSize: '10px',
    padding: '1px 6px',
    borderRadius: '8px',
    background: 'rgba(115,191,105,0.15)',
    color: '#73BF69',
    marginLeft: '6px',
  }),
  tierBadge: css({
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: 500,
    display: 'inline-block',
  }),
  cardsGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '12px',
  }),
  card: css({
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
  }),
  cardHeader: css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }),
  cardRegion: css({ fontSize: '14px', fontWeight: 600, color: '#D6D6D6' }),
  cardPrice: css({ fontSize: '20px', fontWeight: 700, color: '#D6D6D6' }),
  cardPriceUnit: css({ fontSize: '11px', color: '#8E8E8E', fontWeight: 400 }),
  metricRow: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '3px 0',
    fontSize: '12px',
  }),
  metricLabel: css({ color: '#A0A0A0' }),
  metricValue: css({ fontWeight: 500 }),
  barSection: css({ display: 'flex', flexDirection: 'column', gap: '6px' }),
  barRow: css({ display: 'flex', alignItems: 'center', gap: '8px' }),
  barLabel: css({
    width: '100px',
    fontSize: '12px',
    color: '#D6D6D6',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
});

export class PricingComparisonPanel extends PureComponent<Props> {
  render() {
    const { data, options } = this.props;
    const rawData = extractPricingData(data.series);

    if (rawData.length === 0) {
      return (
        <div
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#8E8E8E' }}
        >
          <VerticalGroup align="center">
            <Icon name="dollar-sign" size="xxxl" />
            <div>No pricing data available</div>
            <div style={{ fontSize: '12px' }}>Query GPU pricing metrics from HarchOS data source</div>
          </VerticalGroup>
        </div>
      );
    }

    const sorted = sortPricingData(rawData, options.sortBy, options.sortDirection);
    const lowestPrice = Math.min(...sorted.map((d) => d.gpuHourlyPrice));

    switch (options.displayMode) {
      case PricingDisplayMode.Table:
        return this.renderTable(sorted, lowestPrice);
      case PricingDisplayMode.BarComparison:
        return this.renderBarComparison(sorted, lowestPrice);
      case PricingDisplayMode.Cards:
        return this.renderCards(sorted, lowestPrice);
      default:
        return this.renderTable(sorted, lowestPrice);
    }
  }

  private renderTable(data: PricingDataPoint[], lowestPrice: number) {
    const { options } = this.props;
    const styles = getStyles();

    return (
      <div className={styles.container}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Region</th>
              <th className={styles.th}>GPU</th>
              <th className={styles.th}>Tier</th>
              <th className={styles.th}>Price</th>
              {options.showCarbonIntensity && <th className={styles.th}>Carbon</th>}
              {options.showRenewablePercentage && <th className={styles.th}>Renewable</th>}
              <th className={styles.th}>GPUs</th>
            </tr>
          </thead>
          <tbody>
            {data.map((dp) => (
              <tr key={`${dp.regionId}-${dp.gpuModel}-${dp.pricingTier}`}>
                <td className={styles.td}>
                  {dp.regionName}
                  <div style={{ fontSize: '10px', color: '#8E8E8E' }}>{dp.country}</div>
                </td>
                <td className={styles.td}>{dp.gpuModel}</td>
                <td className={styles.td}>
                  <span className={styles.tierBadge} style={{ background: `${getTierColor(dp.pricingTier)}22`, color: getTierColor(dp.pricingTier) }}>
                    {dp.pricingTier}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.priceCell}`}>
                  {formatPrice(dp.gpuHourlyPrice, options.currencySymbol)}
                  {options.highlightLowest && dp.gpuHourlyPrice === lowestPrice && (
                    <span className={styles.lowestBadge}>Lowest</span>
                  )}
                </td>
                {options.showCarbonIntensity && (
                  <td className={styles.td}>
                    <span style={{ color: getCarbonColor(dp.carbonIntensity) }}>
                      {dp.carbonIntensity.toFixed(0)} gCO₂
                    </span>
                  </td>
                )}
                {options.showRenewablePercentage && (
                  <td className={styles.td}>{dp.renewablePercentage.toFixed(0)}%</td>
                )}
                <td className={styles.td}>{dp.availableGpus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  private renderBarComparison(data: PricingDataPoint[], lowestPrice: number) {
    const { options, width } = this.props;
    const styles = getStyles();
    const maxPrice = Math.max(...data.map((d) => d.gpuHourlyPrice), lowestPrice * 1.5);

    return (
      <div className={styles.container}>
        <div className={styles.barSection}>
          {data.map((dp) => (
            <Tooltip
              key={`${dp.regionId}-${dp.gpuModel}-${dp.pricingTier}`}
              content={`${dp.regionName} - ${dp.gpuModel} (${dp.pricingTier}): ${formatPrice(dp.gpuHourlyPrice, options.currencySymbol)}, Carbon: ${dp.carbonIntensity.toFixed(0)} gCO₂/kWh`}
            >
              <div className={styles.barRow}>
                <span className={styles.barLabel}>{dp.regionName}</span>
                <BarGauge
                  value={{ numeric: dp.gpuHourlyPrice, text: formatPrice(dp.gpuHourlyPrice, options.currencySymbol) }}
                  field={{
                    thresholds: {
                      mode: 0 as const,
                      steps: [{ value: 0, color: getTierColor(dp.pricingTier) }],
                    },
                  } as any}
                  theme={{} as any}
                  height={22}
                  width={width - 140}
                  displayMode={'gradient' as any}
                  orientation={'horizontal' as any}
                />
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  }

  private renderCards(data: PricingDataPoint[], lowestPrice: number) {
    const { options } = this.props;
    const styles = getStyles();

    return (
      <div className={styles.container}>
        <div className={styles.cardsGrid}>
          {data.map((dp) => (
            <div
              className={styles.card}
              key={`${dp.regionId}-${dp.gpuModel}-${dp.pricingTier}`}
              style={{
                borderLeftColor: getTierColor(dp.pricingTier),
                borderLeftWidth: '3px',
              }}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardRegion}>
                  {dp.regionName}
                  <div style={{ fontSize: '10px', color: '#8E8E8E', fontWeight: 400 }}>{dp.country}</div>
                </span>
                <span className={styles.tierBadge} style={{ background: `${getTierColor(dp.pricingTier)}22`, color: getTierColor(dp.pricingTier) }}>
                  {dp.pricingTier}
                </span>
              </div>

              <div className={styles.cardPrice}>
                {formatPrice(dp.gpuHourlyPrice, options.currencySymbol)}
                {options.highlightLowest && dp.gpuHourlyPrice === lowestPrice && (
                  <span className={styles.lowestBadge} style={{ fontSize: '10px', marginLeft: '6px' }}>Best</span>
                )}
              </div>

              <div style={{ fontSize: '11px', color: '#8E8E8E', marginBottom: '8px' }}>
                {dp.gpuModel} • {dp.availableGpus} GPUs
              </div>

              {options.showCarbonIntensity && (
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Carbon</span>
                  <span className={styles.metricValue} style={{ color: getCarbonColor(dp.carbonIntensity) }}>
                    {dp.carbonIntensity.toFixed(0)} gCO₂/kWh
                  </span>
                </div>
              )}

              {options.showRenewablePercentage && (
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Renewable</span>
                  <span className={styles.metricValue} style={{ color: dp.renewablePercentage > 60 ? '#73BF69' : dp.renewablePercentage > 30 ? '#FF9830' : '#E02F44' }}>
                    {dp.renewablePercentage.toFixed(0)}%
                  </span>
                </div>
              )}

              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Sovereignty</span>
                <span className={styles.metricValue}>{dp.sovereignty}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
