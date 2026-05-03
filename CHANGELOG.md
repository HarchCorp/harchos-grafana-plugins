# Changelog

All notable changes to the HarchOS Grafana Plugins project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-01

### Added

- **HarchOS Observability Data Source**
  - Prometheus-compatible data source connecting to HarchOS Observability API
  - Support for PromQL, LogQL, TraceQL query languages
  - Support for HarchOS-specific EnergyQL and SovereigntyQL query languages
  - Configuration editor with URL, TLS, authentication, and custom headers
  - Query editor with language selection, expression editor, legend format, offset, and instant toggle
  - Health check endpoint with user-friendly error messages
  - Template variable interpolation support
  - Metric autocomplete via `metricFindQuery`
  - Annotation support with `getTagKeys` and `getTagValues`

- **GPU Utilization Panel**
  - Gauges, Stats, Bar Chart, and Time Series display modes
  - GPU compute utilization, memory utilization, temperature, VRAM, and power draw metrics
  - Color-coded thresholds for utilization and temperature
  - Group by device with average utilization summary
  - Configurable temperature warning/critical thresholds
  - Toggle for temperature, VRAM, and power display

- **Carbon Metrics Panel**
  - Single Stat, Breakdown, Timeline, and Carbon Equivalents display modes
  - Energy consumption, carbon emissions, and cost estimation
  - Zone-based breakdown with PUE and energy source indicators
  - Carbon equivalents calculator (km driven, smartphone charges, tree offset days, flights)
  - Configurable carbon unit (g, kg, metric tons CO₂)
  - Sustainability target tracking with progress bar
  - Carbon intensity factor per region

- **Hub Health Panel**
  - Status Grid, Detailed Cards, Gauges, and Mini Cards display modes
  - Health status, uptime, latency (avg/p99), request rates, error rates per hub
  - Automatic status determination from configurable thresholds
  - Sovereignty compliance status per hub
  - Sortable hub listing with tooltip details
  - Heartbeat tracking with time-since-last format

- **Workload Distribution Panel**
  - Treemap, Pie Chart, Stacked Bar, Card Table, and Bubble display modes
  - CPU, memory, task counts, and energy metrics per workload
  - Group by name, namespace, hub, priority, or status
  - SVG-based pie chart with color legend
  - Proportional treemap visualization
  - Summary stats row with totals
  - HarchOS brand color palette plus Default, Warm, Cool schemes

- **Dashboard Templates**
  - Operations Overview: hub status, GPU, carbon, workloads, request rate, latency, error rate
  - Model Performance: GPU utilization, inference latency, throughput, VRAM, power draw
  - Energy & Sustainability: carbon emissions, energy by zone, sovereignty compliance, renewable mix

- **Project Infrastructure**
  - TypeScript with Grafana Plugin SDK
  - Webpack build with multi-entry configuration (SWC loader)
  - ESLint and Prettier configuration
  - GitHub Actions CI workflow with lint, typecheck, test, build, and validate stages
  - CODEOWNERS with team assignments
  - Apache 2.0 license

[1.0.0]: https://github.com/HarchCorp/harchos-grafana-plugins/releases/tag/v1.0.0
