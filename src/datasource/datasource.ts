import {
  DataSourceApi,
  DataSourceInstanceSettings,
  DataQueryRequest,
  DataQueryResponse,
  HealthCheckResult,
  HealthCheckStatus,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { Observable } from 'rxjs';
import { lastValueFrom } from 'rxjs/internal/lastValueFrom';

import { HarchOSQuery, HarchOSDataSourceOptions, HarchOSSecureJsonData, HarchOSQueryLanguage } from './types';
import { executeQueries } from './query';

/**
 * HarchOS Observability Data Source
 *
 * A Prometheus-compatible data source that connects to the HarchOS Observability API.
 * Supports standard query languages (PromQL, LogQL, TraceQL) plus HarchOS-specific
 * languages (EnergyQL, SovereigntyQL) for energy consumption and data sovereignty queries.
 */
export class HarchOSDataSource extends DataSourceApi<HarchOSQuery, HarchOSDataSourceOptions> {
  /** Base URL of the HarchOS Observability API */
  readonly url: string;

  /** Persisted (non-secret) JSON data */
  readonly jsonData: HarchOSDataSourceOptions;

  /** Instance settings for credentials handling */
  private readonly instanceSettings: DataSourceInstanceSettings<HarchOSDataSourceOptions>;

  constructor(instanceSettings: DataSourceInstanceSettings<HarchOSDataSourceOptions>) {
    super(instanceSettings);
    this.instanceSettings = instanceSettings;
    this.url = instanceSettings.url;
    this.jsonData = instanceSettings.jsonData;

    // Enable annotations support
    this.annotations = {};
  }

  /**
   * Build the HTTP headers for API requests.
   * Includes any custom headers from the configuration and the API key if set.
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge custom headers from JSON data
    if (this.jsonData.customHeaders) {
      for (const [key, value] of Object.entries(this.jsonData.customHeaders)) {
        headers[key] = value;
      }
    }

    return headers;
  }

  /**
   * Apply template variables to a query expression.
   */
  private interpolateVariables(expr: string): string {
    const templateSrv = getTemplateSrv();
    return templateSrv.replace(expr, undefined, 'csv');
  }

  /**
   * Execute queries against the HarchOS Observability API.
   */
  query(request: DataQueryRequest<HarchOSQuery>): Observable<DataQueryResponse> {
    // Interpolate template variables in each query expression
    const interpolatedTargets = request.targets.map((target) => ({
      ...target,
      expr: this.interpolateVariables(target.expr),
    }));

    const interpolatedRequest: DataQueryRequest<HarchOSQuery> = {
      ...request,
      targets: interpolatedTargets,
    };

    return executeQueries(interpolatedRequest, this.instanceSettings, this.getHeaders());
  }

  /**
   * Test the data source health by querying the /api/v1/labels endpoint.
   */
  async testDatasource(): Promise<HealthCheckResult> {
    const timeout = this.jsonData.timeout || 30_000;

    try {
      const response = await lastValueFrom(
        getBackendSrv().fetch({
          url: `${this.url}/api/v1/labels`,
          method: 'GET',
          headers: this.getHeaders(),
          credentials: this.instanceSettings.withCredentials ? 'include' : 'same-origin',
          params: { limit: 1 },
        }),
      );

      if (response.status === 200) {
        return {
          status: HealthCheckStatus.OK,
          message: 'HarchOS Observability API connection successful',
        };
      }

      return {
        status: HealthCheckStatus.Error,
        message: `Unexpected response status: ${response.status}`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown connection error';

      // Provide user-friendly messages for common errors
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        return {
          status: HealthCheckStatus.Error,
          message: `Cannot reach HarchOS API at ${this.url}. Verify the URL and network connectivity.`,
        };
      }

      if (message.includes('401') || message.includes('Unauthorized')) {
        return {
          status: HealthCheckStatus.Error,
          message: 'Authentication failed. Check your API key in the data source configuration.',
        };
      }

      if (message.includes('403') || message.includes('Forbidden')) {
        return {
          status: HealthCheckStatus.Error,
          message: 'Access denied. Verify your API key has the required permissions.',
        };
      }

      return {
        status: HealthCheckStatus.Error,
        message: `Connection failed: ${message}`,
      };
    }
  }

  /**
   * Return metadata about the data source – used by query editors for autocomplete.
   */
  async metricFindQuery(query: string, options?: { range?: unknown }): Promise<Array<{ text: string; value?: string }>> {
    const interpolated = this.interpolateVariables(query);

    try {
      const response = await lastValueFrom(
        getBackendSrv().fetch<{ status: string; data: string[] }>({
          url: `${this.url}/api/v1/label/${interpolated}/values`,
          method: 'GET',
          headers: this.getHeaders(),
          credentials: this.instanceSettings.withCredentials ? 'include' : 'same-origin',
        }),
      );

      if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
        return response.data.data.map((v) => ({ text: v, value: v }));
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * Get tag keys for annotation queries.
   */
  async getTagKeys(): Promise<Array<{ text: string }>> {
    try {
      const response = await lastValueFrom(
        getBackendSrv().fetch<{ status: string; data: Array<{ name: string }> }>({
          url: `${this.url}/api/v1/labels`,
          method: 'GET',
          headers: this.getHeaders(),
          credentials: this.instanceSettings.withCredentials ? 'include' : 'same-origin',
        }),
      );

      if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
        return response.data.data.map((label) => ({ text: label.name || label }));
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * Get tag values for annotation queries.
   */
  async getTagValues(options: { key?: string }): Promise<Array<{ text: string }>> {
    if (!options.key) {
      return [];
    }

    try {
      const response = await lastValueFrom(
        getBackendSrv().fetch<{ status: string; data: string[] }>({
          url: `${this.url}/api/v1/label/${options.key}/values`,
          method: 'GET',
          headers: this.getHeaders(),
          credentials: this.instanceSettings.withCredentials ? 'include' : 'same-origin',
        }),
      );

      if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
        return response.data.data.map((v) => ({ text: v }));
      }

      return [];
    } catch {
      return [];
    }
  }
}
