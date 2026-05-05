# HarchOS Grafana Plugins

Grafana dashboard plugins for **HarchOS** observability — providing real-time monitoring of GPU utilization, carbon emissions, hub health, and workload distribution across your HarchOS infrastructure.

## Overview

This repository provides a suite of Grafana plugins designed for HarchOS observability:

| Plugin | Type | Description |
|--------|------|-------------|
| **HarchOS Observability** | Data Source | Prometheus-compatible data source with support for PromQL, LogQL, TraceQL, EnergyQL, and SovereigntyQL |
| **GPU Utilization** | Panel | Visualize GPU compute utilization, temperature, VRAM, and power metrics |
| **Carbon Metrics** | Panel | Track energy consumption, carbon emissions, cost estimation, and sustainability targets |
| **Hub Health** | Panel | Monitor health status, latency, error rates, and availability of HarchOS Hub instances |
| **Workload Distribution** | Panel | Visualize workload allocation across hubs with CPU, memory, tasks, and energy breakdown |
| **Carbon Forecast** | Panel | Shows carbon intensity forecast for next 24 hours with green window highlights and color-coded intensity levels |
| **Pricing Comparison** | Panel | Compare GPU pricing across regions and tiers, sortable by price, region, or carbon intensity |

## Query Languages

The HarchOS data source supports five query languages:

| Language | Description | Endpoint |
|----------|-------------|----------|
| **PromQL** | Prometheus Query Language for metric time-series queries | `/api/v1/query_range` |
| **LogQL** | Log Query Language for structured log queries (Loki-compatible) | `/loki/api/v1/query_range` |
| **TraceQL** | Trace Query Language for distributed trace queries (Tempo-compatible) | `/api/traces/search` |
| **EnergyQL** | HarchOS energy & carbon consumption query language | `/harchos/api/v1/energy/query_range` |
| **SovereigntyQL** | HarchOS data sovereignty & governance query language | `/harchos/api/v1/sovereignty/query` |

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/HarchCorp/harchos-grafana-plugins.git
cd harchos-grafana-plugins

# Install dependencies
npm install

# Build the plugin
npm run build

# Copy the dist/ directory to your Grafana plugins directory
cp -r dist/ /var/lib/grafana/plugins/harchos-grafana-plugins/
```

### Grafana Configuration

Add to your `grafana.ini`:

```ini
[plugins]
allow_loading_unsigned_plugins = harchos-datasource,harchos-gpu-utilization-panel,harchos-carbon-metrics-panel,harchos-hub-health-panel,harchos-workload-distribution-panel,harchos-carbon-forecast-panel,harchos-pricing-comparison-panel
```

Restart Grafana after installation.

### Drag-and-Drop Installation

1. Build the plugin with `npm run build`
2. Zip the `dist/` directory
3. In Grafana, go to **Plugins → Upload plugin**
4. Upload the zip file

## Quick Start

### 1. Configure the Data Source

1. Navigate to **Configuration → Data Sources → Add data source**
2. Select **HarchOS Observability**
3. Enter your HarchOS API URL (e.g., `http://harchos-observability:9090`)
4. Optionally configure authentication (API key, basic auth)
5. Click **Save & Test**

### 2. Import a Dashboard

Four pre-built dashboard templates are included:

- **Operations Overview** — Real-time monitoring of hubs, workloads, and system health
- **Model Performance** — GPU metrics, inference latency, and workload performance
- **Energy & Sustainability** — Carbon emissions, energy consumption, and environmental impact
- **Platform Overview** — Total GPUs, utilization, carbon metrics, active workloads, pricing, and carbon forecast

Import via **Dashboards → Import → Upload JSON file** and select from `src/dashboards/`.

### 3. Add Panels

All six panel plugins are available in the panel picker when editing a dashboard. Configure your HarchOS data source as the query target and start visualizing.

## Development

### Prerequisites

- Node.js >= 18
- npm >= 9
- Grafana >= 10.0

### Commands

```bash
# Install dependencies
npm install

# Development build with watch
npm run watch

# Production build
npm run build

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run typecheck

# Run tests
npm run test
```

### Development with Docker

```bash
# Start Grafana with the plugin loaded
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/dist:/var/lib/grafana/plugins/harchos-grafana-plugins \
  -e "GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=harchos-datasource,harchos-gpu-utilization-panel,harchos-carbon-metrics-panel,harchos-hub-health-panel,harchos-workload-distribution-panel,harchos-carbon-forecast-panel,harchos-pricing-comparison-panel" \
  grafana/grafana:latest
```

## Panel Details

### GPU Utilization Panel

Displays GPU compute utilization, memory usage, temperature, VRAM, and power draw metrics.

**Display modes:**
- **Gauges** — Individual gauge per GPU with temperature, VRAM, and power details
- **Stats** — Big value stats per GPU
- **Bar Chart** — Horizontal bar gauges for quick comparison
- **Time Series** — Standard time series visualization

**Configuration options:**
- Show/hide temperature, VRAM usage
- Temperature warning/critical thresholds
- Group by device, show average across GPUs

### Carbon Metrics Panel

Visualizes energy consumption, carbon emissions, cost estimation, and sustainability tracking.

**Display modes:**
- **Single Stat** — Total carbon with trend and sustainability target progress
- **Breakdown** — Zone-based breakdown with PUE and energy source
- **Timeline** — Historical carbon emission trends
- **Carbon Equivalents** — Visual equivalents (km driven, trees, smartphone charges, flights)

**Configuration options:**
- Carbon unit (g, kg, metric tons CO₂)
- Energy price per kWh for cost estimation
- Carbon intensity factor for your region
- Sustainability target tracking

### Hub Health Panel

Monitors health status, latency, error rates, and availability of HarchOS Hub instances.

**Display modes:**
- **Status Grid** — Compact colored indicators per hub
- **Detailed Cards** — Full metric breakdown per hub
- **Gauges** — Uptime gauge per hub
- **Mini Cards** — Minimal status + latency display

**Configuration options:**
- Latency warning/critical thresholds
- Error rate warning/critical thresholds
- Show sovereignty compliance status
- Sort by name, status, latency, or error rate

### Workload Distribution Panel

Visualizes workload allocation across HarchOS hubs with resource metrics.

**Display modes:**
- **Treemap** — Proportional area chart based on CPU usage
- **Pie Chart** — SVG-based pie chart with legend
- **Stacked Bar** — Horizontal bar gauges per group
- **Card Table** — Detailed card view per group
- **Bubble Chart** — (planned) Bubble visualization

**Configuration options:**
- Group by name, namespace, hub, priority, or status
- Show/hide CPU, memory, task counts, energy
- Color scheme: Default, Warm, Cool, HarchOS
- Maximum workloads to display

### Carbon Forecast Panel

Shows carbon intensity forecast for the next 24 hours with green window highlights.

**Display modes:**
- **Timeline Chart** — SVG-based intensity line chart with green/yellow/red zone backgrounds and threshold markers
- **Bar Chart** — Color-coded bar chart, one bar per time slot
- **Summary Cards** — Per-zone cards with current intensity, averages, and next green window

**Color coding:**
- Green — intensity < 100 gCO₂/kWh (configurable)
- Yellow — intensity 100–200 gCO₂/kWh (configurable)
- Red — intensity > 200 gCO₂/kWh (configurable)

**Configuration options:**
- Green and yellow threshold values
- Forecast hours (1–72h)
- Show/hide green window highlights
- Show current intensity marker
- Show zone labels

### Pricing Comparison Panel

Compares GPU pricing across regions and tiers with carbon intensity context.

**Display modes:**
- **Table** — Sortable table with region, GPU model, tier, price, carbon, renewable, and GPU count columns
- **Bar Comparison** — Horizontal bar gauges for quick price comparison
- **Cards** — Card layout per region with pricing, carbon, and sovereignty details

**Configuration options:**
- Sort by region, price, carbon intensity, or tier
- Sort ascending or descending
- Show/hide GPU pricing, carbon intensity, renewable percentage
- Currency symbol for price display
- Highlight lowest price

## Architecture

```
harchos-grafana-plugins/
├── src/
│   ├── datasource/          # HarchOS Observability data source
│   │   ├── datasource.ts    # Main data source class
│   │   ├── types.ts         # Query types, enums, constants
│   │   ├── query.ts         # Query execution and response parsing
│   │   ├── config-editor.tsx # Data source configuration UI
│   │   ├── query-editor.tsx # Query editor UI
│   │   └── module.ts        # Plugin entry point
│   ├── panels/
│   │   ├── gpu-utilization/ # GPU Utilization panel
│   │   ├── carbon-metrics/  # Carbon Metrics panel
│   │   ├── hub-health/      # Hub Health panel
│   │   ├── workload-distribution/ # Workload Distribution panel
│   │   ├── carbon-forecast/ # Carbon Forecast panel
│   │   └── pricing-comparison/ # Pricing Comparison panel
│   └── dashboards/          # Pre-built dashboard templates
├── .github/workflows/       # CI/CD
└── [config files]
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Licensed under the [Apache License 2.0](LICENSE).

## Links

- [HarchCorp](https://harchcorp.io)
- [Documentation](https://docs.harchcorp.io/harchos/grafana-plugins)
- [HarchOS](https://github.com/HarchCorp/harchos)
- [Grafana Plugin SDK](https://grafana.com/developers/plugin-tools)
