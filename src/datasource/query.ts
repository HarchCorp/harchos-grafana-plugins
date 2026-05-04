import { DataQueryRequest, DataQueryResponse, MutableDataFrame, FieldType, TimeRange } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Observable, from, of, merge } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { HarchOSQuery, HarchOSDataSourceOptions, HarchOSQueryLanguage } from './types';

// ────────────────────────────────────────────────────────────────────────────────
// API response shape (Prometheus-compatible + HarchOS extensions)
// ────────────────────────────────────────────────────────────────────────────────

interface PromqlMatrixValue {
  metric: Record<string, string>;
  values: Array<[number, string]>;
}

interface PromqlVectorValue {
  metric: Record<string, string>;
  value: [number, string];
}

interface PromqlRangeResponse {
  status: string;
  data: {
    resultType: 'matrix' | 'vector';
    result: PromqlMatrixValue[] | PromqlVectorValue[];
  };
}

interface LogqlStreamResponse {
  status: string;
  data: {
    resultType: 'streams';
    result: Array<{
      stream: Record<string, string>;
      values: Array<[string, string]>;
    }>;
  };
}

interface TraceqlResponse {
  status: string;
  data: {
    traces: Array<{
      traceID: string;
      rootServiceName: string;
      rootTraceName: string;
      startTimeUnixNano: string;
      durationMs: number;
    }>;
  };
}

/** HarchOS-specific energy response */
interface EnergyqlResponse {
  status: string;
  data: {
    resultType: 'matrix' | 'vector';
    result: PromqlMatrixValue[] | PromqlVectorValue[];
    /** Carbon-equivalent grams CO₂ per series */
    carbonGrams?: Record<string, number>;
    /** Energy unit label (e.g. 'watts', 'kWh') */
    energyUnit?: string;
  };
}

/** HarchOS-specific sovereignty response */
interface SovereigntyqlResponse {
  status: string;
  data: {
    resultType: 'vector';
    result: PromqlVectorValue[];
    /** Compliance status per series: 'compliant' | 'non-compliant' | 'partial' */
    compliance?: Record<string, string>;
    /** Regulatory framework (e.g. 'GDPR', 'CCPA', 'HarchOS-Default') */
    framework?: string;
  };
}

type ApiResponse =
  | PromqlRangeResponse
  | LogqlStreamResponse
  | TraceqlResponse
  | EnergyqlResponse
  | SovereigntyqlResponse;

// ────────────────────────────────────────────────────────────────────────────────
// Query execution helpers
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Build the request URL based on the query language.
 */
function buildUrl(baseUrl: string, language: HarchOSQueryLanguage, instant: boolean): string {
  const base = baseUrl.replace(/\/+$/, '');
  switch (language) {
    case HarchOSQueryLanguage.PromQL:
      return `${base}/api/v1/${instant ? 'query' : 'query_range'}`;
    case HarchOSQueryLanguage.LogQL:
      return `${base}/loki/api/v1/${instant ? 'query' : 'query_range'}`;
    case HarchOSQueryLanguage.TraceQL:
      return `${base}/api/traces/search`;
    case HarchOSQueryLanguage.EnergyQL:
      return `${base}/harchos/api/v1/energy/${instant ? 'query' : 'query_range'}`;
    case HarchOSQueryLanguage.SovereigntyQL:
      return `${base}/harchos/api/v1/sovereignty/query`;
    default:
      return `${base}/api/v1/query_range`;
  }
}

/**
 * Build query parameters for the API request.
 */
function buildParams(query: HarchOSQuery, range: TimeRange): Record<string, string | number> {
  const params: Record<string, string | number> = {
    query: query.expr,
  };

  if (query.language !== HarchOSQueryLanguage.TraceQL && query.language !== HarchOSQueryLanguage.SovereigntyQL) {
    params.start = Math.floor(range.from.valueOf() / 1000);
    params.end = Math.floor(range.to.valueOf() / 1000);
    params.step = 15;
  }

  if (query.legendFormat) {
    params.legendFormat = query.legendFormat;
  }

  if (query.offset) {
    params.offset = query.offset;
  }

  return params;
}

/**
 * Parse a Prometheus-compatible matrix result into a MutableDataFrame.
 */
function parseMatrixResult(result: PromqlMatrixValue, refId: string, name?: string): MutableDataFrame {
  const labels = result.metric;
  const frameName = name || labels.__name__ || refId;
  const timeValues: number[] = [];
  const metricValues: number[] = [];

  for (const [ts, val] of result.values) {
    timeValues.push(ts * 1000);
    metricValues.push(parseFloat(val));
  }

  const frame = new MutableDataFrame({
    refId,
    name: frameName,
    fields: [
      { name: 'time', type: FieldType.time, values: timeValues },
      {
        name: 'value',
        type: FieldType.number,
        values: metricValues,
        labels: Object.fromEntries(Object.entries(labels).filter(([k]) => k !== '__name__')),
      },
    ],
  });

  return frame;
}

/**
 * Parse a Prometheus-compatible instant vector result into a MutableDataFrame.
 */
function parseVectorResult(result: PromqlVectorValue, refId: string, name?: string): MutableDataFrame {
  const labels = result.metric;
  const frameName = name || labels.__name__ || refId;
  const [ts, val] = result.value;

  const frame = new MutableDataFrame({
    refId,
    name: frameName,
    fields: [
      { name: 'time', type: FieldType.time, values: [ts * 1000] },
      {
        name: 'value',
        type: FieldType.number,
        values: [parseFloat(val)],
        labels: Object.fromEntries(Object.entries(labels).filter(([k]) => k !== '__name__')),
      },
    ],
  });

  return frame;
}

/**
 * Parse LogQL stream results into a MutableDataFrame.
 */
function parseLogStreams(
  results: Array<{ stream: Record<string, string>; values: Array<[string, string]> }>,
  refId: string,
): MutableDataFrame[] {
  return results.map((stream, idx) => {
    const timeValues: number[] = [];
    const lineValues: string[] = [];

    for (const [ts, line] of stream.values) {
      timeValues.push(parseFloat(ts) / 1_000_000);
      lineValues.push(line);
    }

    return new MutableDataFrame({
      refId,
      name: `${refId}-stream-${idx}`,
      fields: [
        { name: 'time', type: FieldType.time, values: timeValues },
        { name: 'line', type: FieldType.string, values: lineValues, labels: stream.stream },
      ],
    });
  });
}

/**
 * Parse TraceQL results into a MutableDataFrame.
 */
function parseTraceResults(
  traces: Array<{
    traceID: string;
    rootServiceName: string;
    rootTraceName: string;
    startTimeUnixNano: string;
    durationMs: number;
  }>,
  refId: string,
): MutableDataFrame {
  const ids: string[] = [];
  const services: string[] = [];
  const names: string[] = [];
  const times: number[] = [];
  const durations: number[] = [];

  for (const trace of traces) {
    ids.push(trace.traceID);
    services.push(trace.rootServiceName);
    names.push(trace.rootTraceName);
    times.push(Number(trace.startTimeUnixNano) / 1_000_000);
    durations.push(trace.durationMs);
  }

  return new MutableDataFrame({
    refId,
    name: `${refId}-traces`,
    fields: [
      { name: 'traceID', type: FieldType.string, values: ids },
      { name: 'service', type: FieldType.string, values: services },
      { name: 'operation', type: FieldType.string, values: names },
      { name: 'time', type: FieldType.time, values: times },
      { name: 'duration_ms', type: FieldType.number, values: durations },
    ],
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// Public query execution function
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Execute a set of HarchOS queries and return an Observable of DataQueryResponse.
 */
export function executeQueries(
  request: DataQueryRequest<HarchOSQuery>,
  instanceSettings: { url?: string; jsonData: HarchOSDataSourceOptions; withCredentials?: boolean },
  headers: Record<string, string>,
): Observable<DataQueryResponse> {
  const { range } = request;
  const queries = request.targets.filter((q) => q.expr && !q.hide);
  const baseUrl = instanceSettings.url || '';

  if (queries.length === 0) {
    return of({ data: [] });
  }

  const observables = queries.map((query) => {
    const url = buildUrl(baseUrl, query.language, !!query.instant);
    const params = buildParams(query, range);

    return from(
      getBackendSrv().fetch<ApiResponse>({
        url,
        params,
        method: 'GET',
        headers: { ...headers },
        credentials: instanceSettings.withCredentials ? 'include' : 'same-origin',
        showErrorAlert: true,
      }),
    ).pipe(
      map((response) => {
        const data = response.data;
        const frames: MutableDataFrame[] = [];

        if (!data || (data as unknown as Record<string, unknown>).status !== 'success') {
          return { data: frames, key: query.refId, state: 'Done' } as DataQueryResponse;
        }

        switch (query.language) {
          case HarchOSQueryLanguage.PromQL:
          case HarchOSQueryLanguage.EnergyQL: {
            const resp = data as PromqlRangeResponse | EnergyqlResponse;
            if (resp.data.resultType === 'matrix') {
              for (const r of resp.data.result as PromqlMatrixValue[]) {
                frames.push(parseMatrixResult(r, query.refId, query.legendFormat));
              }
            } else if (resp.data.resultType === 'vector') {
              for (const r of resp.data.result as PromqlVectorValue[]) {
                frames.push(parseVectorResult(r, query.refId, query.legendFormat));
              }
            }
            break;
          }

          case HarchOSQueryLanguage.LogQL: {
            const resp = data as LogqlStreamResponse;
            frames.push(...parseLogStreams(resp.data.result, query.refId));
            break;
          }

          case HarchOSQueryLanguage.TraceQL: {
            const resp = data as TraceqlResponse;
            frames.push(parseTraceResults(resp.data.traces, query.refId));
            break;
          }

          case HarchOSQueryLanguage.SovereigntyQL: {
            const resp = data as SovereigntyqlResponse;
            if (resp.data.result) {
              for (const r of resp.data.result as PromqlVectorValue[]) {
                const frame = parseVectorResult(r, query.refId, query.legendFormat);
                // Augment with compliance metadata if present
                if (resp.data.compliance) {
                  const complianceVal = resp.data.compliance[r.metric.__name__ || ''] ?? 'unknown';
                  frame.addField({ name: 'compliance', type: FieldType.string, values: [complianceVal] });
                }
                if (resp.data.framework) {
                  frame.addField({ name: 'framework', type: FieldType.string, values: [resp.data.framework] });
                }
                frames.push(frame);
              }
            }
            break;
          }

          default:
            break;
        }

        return { data: frames, key: query.refId, state: 'Done' } as DataQueryResponse;
      }),
      catchError((err) => {
        const errorFrame = new MutableDataFrame({
          refId: query.refId,
          fields: [{ name: 'error', type: FieldType.string, values: [err.message || 'Unknown error'] }],
        });
        return of({ data: [errorFrame], key: query.refId, state: 'Error' } as DataQueryResponse);
      }),
    );
  });

  return merge(...observables);
}
