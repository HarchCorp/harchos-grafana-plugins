import { DataSourcePlugin } from '@grafana/runtime';

import { HarchOSDataSource } from './datasource';
import { HarchOSConfigEditor } from './config-editor';
import { HarchOSQueryEditor } from './query-editor';
import { HarchOSQuery, HarchOSDataSourceOptions, HarchOSSecureJsonData } from './types';

/**
 * HarchOS Observability Data Source plugin entry point.
 *
 * Registers the data source, config editor, and query editor with Grafana.
 */
export const plugin = new DataSourcePlugin<HarchOSDataSource, HarchOSQuery, HarchOSDataSourceOptions, HarchOSSecureJsonData>(
  HarchOSDataSource,
)
  .setConfigEditor(HarchOSConfigEditor)
  .setQueryEditor(HarchOSQueryEditor);
