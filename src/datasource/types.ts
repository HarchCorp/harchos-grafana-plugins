import { DataQuery, DataSourceJsonData, SelectableValue } from '@grafana/data';

/**
 * Supported query languages for the HarchOS Observability data source.
 *
 * Standard languages:
 *  - PromQL:  Prometheus Query Language for metric queries
 *  - LogQL:   Log query language (Loki-compatible)
 *  - TraceQL: Trace query language (Tempo-compatible)
 *
 * HarchOS-specific:
 *  - energyql:      Query language for energy consumption and carbon metrics
 *  - sovereigntyql: Query language for data sovereignty and governance checks
 */
export enum HarchOSQueryLanguage {
  PromQL = 'promql',
  LogQL = 'logql',
  TraceQL = 'traceql',
  EnergyQL = 'energyql',
  SovereigntyQL = 'sovereigntyql',
}

/** Human-readable labels + descriptions for the query language dropdown */
export const QUERY_LANGUAGE_OPTIONS: SelectableValue<HarchOSQueryLanguage>[] = [
  {
    value: HarchOSQueryLanguage.PromQL,
    label: 'PromQL',
    description: 'Prometheus Query Language – metric time-series queries',
  },
  {
    value: HarchOSQueryLanguage.LogQL,
    label: 'LogQL',
    description: 'Log Query Language – structured log queries (Loki-compatible)',
  },
  {
    value: HarchOSQueryLanguage.TraceQL,
    label: 'TraceQL',
    description: 'Trace Query Language – distributed trace queries (Tempo-compatible)',
  },
  {
    value: HarchOSQueryLanguage.EnergyQL,
    label: 'EnergyQL',
    description: 'HarchOS energy & carbon consumption query language',
  },
  {
    value: HarchOSQueryLanguage.SovereigntyQL,
    label: 'SovereigntyQL',
    description: 'HarchOS data sovereignty & governance query language',
  },
];

/**
 * Represents a single query issued to the HarchOS Observability data source.
 */
export interface HarchOSQuery extends DataQuery {
  /** The query expression (PromQL, LogQL, TraceQL, EnergyQL, or SovereigntyQL) */
  expr: string;
  /** Selected query language */
  language: HarchOSQueryLanguage;
  /** Optional legend template, e.g. `{{instance}}` */
  legendFormat?: string;
  /** Optional time range offset (e.g. '1h', '24h') for comparisons */
  offset?: string;
  /** Whether to resolve instant values only (vs. range vector) */
  instant?: boolean;
}

/**
 * Persisted configuration for the HarchOS Observability data source.
 */
export interface HarchOSDataSourceOptions extends DataSourceJsonData {
  /** Base URL of the HarchOS Observability API (Prometheus-compatible) */
  url: string;
  /** Whether to skip TLS verification (self-signed certs) */
  tlsSkipVerify?: boolean;
  /** Custom HTTP headers sent with every request */
  customHeaders?: Record<string, string>;
  /** Default query language when none specified */
  defaultLanguage?: HarchOSQueryLanguage;
  /** Timeout in milliseconds for API requests */
  timeout?: number;
  /** Enable HarchOS-specific query languages (EnergyQL, SovereigntyQL) */
  enableHarchOSLanguages?: boolean;
}

/**
 * Secure (secret) configuration stored server-side.
 */
export interface HarchOSSecureJsonData {
  /** Bearer token for authenticating against the HarchOS Observability API */
  apiKey?: string;
  /** Basic auth password */
  basicAuthPassword?: string;
}

/** Type guard: returns true if the query language is HarchOS-specific */
export function isHarchOSLanguage(language: HarchOSQueryLanguage): boolean {
  return language === HarchOSQueryLanguage.EnergyQL || language === HarchOSQueryLanguage.SovereigntyQL;
}

/** Default query expression by language */
export const DEFAULT_EXPRESSIONS: Record<HarchOSQueryLanguage, string> = {
  [HarchOSQueryLanguage.PromQL]: 'up',
  [HarchOSQueryLanguage.LogQL]: '{job="harchos"}',
  [HarchOSQueryLanguage.TraceQL]: '{ .service.name = "harchos-hub" }',
  [HarchOSQueryLanguage.EnergyQL]: 'energy_consumption_watts{zone="default"}',
  [HarchOSQueryLanguage.SovereigntyQL]: 'sovereignty_compliance{region="eu-west"}',
};
