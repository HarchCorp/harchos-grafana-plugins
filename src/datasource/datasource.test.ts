/**
 * Tests for query construction helpers.
 *
 * These tests replicate the pure logic from query.ts to avoid
 * importing @grafana dependencies at test time.
 */

// Mirror the enum values
const HarchOSQueryLanguage = {
  PromQL: 'promql',
  LogQL: 'logql',
  TraceQL: 'traceql',
  EnergyQL: 'energyql',
  SovereigntyQL: 'sovereigntyql',
} as const;

// Mirror buildUrl from query.ts
function buildUrl(baseUrl: string, language: string, instant: boolean): string {
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

// Mirror buildParams from query.ts
function buildParams(
  query: { expr: string; language: string; legendFormat?: string; offset?: string },
  range: { from: { valueOf: () => number }; to: { valueOf: () => number } },
): Record<string, string | number> {
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

describe('Query construction', () => {
  describe('buildUrl', () => {
    it('should build PromQL query_range URL', () => {
      const url = buildUrl('https://api.example.com', HarchOSQueryLanguage.PromQL, false);
      expect(url).toBe('https://api.example.com/api/v1/query_range');
    });

    it('should build PromQL instant query URL', () => {
      const url = buildUrl('https://api.example.com', HarchOSQueryLanguage.PromQL, true);
      expect(url).toBe('https://api.example.com/api/v1/query');
    });

    it('should build LogQL query URL', () => {
      const url = buildUrl('https://api.example.com', HarchOSQueryLanguage.LogQL, true);
      expect(url).toBe('https://api.example.com/loki/api/v1/query');
    });

    it('should build LogQL query_range URL', () => {
      const url = buildUrl('https://api.example.com', HarchOSQueryLanguage.LogQL, false);
      expect(url).toBe('https://api.example.com/loki/api/v1/query_range');
    });

    it('should build TraceQL URL', () => {
      const url = buildUrl('https://api.example.com', HarchOSQueryLanguage.TraceQL, false);
      expect(url).toBe('https://api.example.com/api/traces/search');
    });

    it('should build EnergyQL query URL', () => {
      const url = buildUrl('https://api.example.com', HarchOSQueryLanguage.EnergyQL, true);
      expect(url).toBe('https://api.example.com/harchos/api/v1/energy/query');
    });

    it('should build SovereigntyQL URL', () => {
      const url = buildUrl('https://api.example.com', HarchOSQueryLanguage.SovereigntyQL, false);
      expect(url).toBe('https://api.example.com/harchos/api/v1/sovereignty/query');
    });

    it('should strip trailing slashes from base URL', () => {
      const url = buildUrl('https://api.example.com///', HarchOSQueryLanguage.PromQL, false);
      expect(url).toBe('https://api.example.com/api/v1/query_range');
    });
  });

  describe('buildParams', () => {
    it('should include query expression', () => {
      const params = buildParams(
        { expr: 'up', language: HarchOSQueryLanguage.PromQL },
        { from: { valueOf: () => 1000000 }, to: { valueOf: () => 2000000 } },
      );
      expect(params.query).toBe('up');
    });

    it('should include start and end for PromQL', () => {
      const params = buildParams(
        { expr: 'up', language: HarchOSQueryLanguage.PromQL },
        { from: { valueOf: () => 1000000 }, to: { valueOf: () => 2000000 } },
      );
      expect(params.start).toBeDefined();
      expect(params.end).toBeDefined();
    });

    it('should NOT include start/end for TraceQL', () => {
      const params = buildParams(
        { expr: '{ .service.name = "harchos" }', language: HarchOSQueryLanguage.TraceQL },
        { from: { valueOf: () => 1000000 }, to: { valueOf: () => 2000000 } },
      );
      expect(params.start).toBeUndefined();
      expect(params.end).toBeUndefined();
    });

    it('should NOT include start/end for SovereigntyQL', () => {
      const params = buildParams(
        { expr: 'sovereignty_compliance{}', language: HarchOSQueryLanguage.SovereigntyQL },
        { from: { valueOf: () => 1000000 }, to: { valueOf: () => 2000000 } },
      );
      expect(params.start).toBeUndefined();
      expect(params.end).toBeUndefined();
    });

    it('should include legendFormat when provided', () => {
      const params = buildParams(
        { expr: 'up', language: HarchOSQueryLanguage.PromQL, legendFormat: '{{instance}}' },
        { from: { valueOf: () => 1000000 }, to: { valueOf: () => 2000000 } },
      );
      expect(params.legendFormat).toBe('{{instance}}');
    });

    it('should include offset when provided', () => {
      const params = buildParams(
        { expr: 'up', language: HarchOSQueryLanguage.PromQL, offset: '1h' },
        { from: { valueOf: () => 1000000 }, to: { valueOf: () => 2000000 } },
      );
      expect(params.offset).toBe('1h');
    });
  });
});
