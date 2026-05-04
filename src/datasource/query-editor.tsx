import React, { ChangeEvent, PureComponent } from 'react';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { InlineField, InlineFieldRow, Input, Select, Switch, TextArea } from '@grafana/ui';

import { HarchOSDataSource } from './datasource';
import {
  HarchOSQuery,
  HarchOSDataSourceOptions,
  HarchOSQueryLanguage,
  QUERY_LANGUAGE_OPTIONS,
  DEFAULT_EXPRESSIONS,
  isHarchOSLanguage,
} from './types';

type Props = QueryEditorProps<HarchOSDataSource, HarchOSQuery, HarchOSDataSourceOptions>;

/**
 * Query editor for the HarchOS Observability data source.
 *
 * Provides controls for:
 *  - Query expression (textarea)
 *  - Query language selection
 *  - Legend format template
 *  - Time offset
 *  - Instant toggle
 */
export class HarchOSQueryEditor extends PureComponent<Props> {
  // ── Expression ─────────────────────────────────────────────────────────────

  private onExpressionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, expr: event.target.value });
  };

  // ── Query Language ─────────────────────────────────────────────────────────

  private onLanguageChange = (value: SelectableValue<HarchOSQueryLanguage>) => {
    const { onChange, query, onRunQuery } = this.props;
    const language = value.value || HarchOSQueryLanguage.PromQL;

    // If the current expression matches the previous language default, update it
    const newExpr = query.expr === DEFAULT_EXPRESSIONS[query.language] ? DEFAULT_EXPRESSIONS[language] : query.expr;

    onChange({ ...query, language, expr: newExpr });
    onRunQuery();
  };

  // ── Legend Format ──────────────────────────────────────────────────────────

  private onLegendFormatChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, legendFormat: event.target.value });
  };

  // ── Offset ─────────────────────────────────────────────────────────────────

  private onOffsetChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, offset: event.target.value || undefined });
  };

  // ── Instant Toggle ─────────────────────────────────────────────────────────

  private onInstantChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, instant: event.target.checked });
    onRunQuery();
  };

  // ── Keyboard shortcut: Ctrl/Cmd+Enter to run query ────────────────────────

  private onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      this.props.onRunQuery();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  render() {
    const { query, datasource } = this.props;
    const enableHarchOSLanguages = datasource?.jsonData?.enableHarchOSLanguages ?? true;

    // Filter query language options based on config
    const languageOptions = enableHarchOSLanguages
      ? QUERY_LANGUAGE_OPTIONS
      : QUERY_LANGUAGE_OPTIONS.filter((opt) => !isHarchOSLanguage(opt.value!));

    const currentLanguageOption = languageOptions.find((opt) => opt.value === query.language) || languageOptions[0];

    return (
      <div className="gf-form-group">
        {/* ── Query Language ────────────────────────────────────────────────── */}
        <InlineFieldRow>
          <InlineField label="Query Language" labelWidth={14}>
            <Select<HarchOSQueryLanguage>
              options={languageOptions}
              value={currentLanguageOption}
              onChange={this.onLanguageChange}
              width={24}
              isSearchable={false}
            />
          </InlineField>
        </InlineFieldRow>

        {/* ── Expression ────────────────────────────────────────────────────── */}
        <InlineFieldRow>
          <InlineField label="Expression" labelWidth={14} grow>
            <TextArea
              value={query.expr}
              onChange={this.onExpressionChange}
              onKeyDown={this.onKeyDown}
              placeholder={DEFAULT_EXPRESSIONS[query.language || HarchOSQueryLanguage.PromQL]}
              rows={3}
              className="harchos-query-input"
            />
          </InlineField>
        </InlineFieldRow>

        {/* ── Options Row ───────────────────────────────────────────────────── */}
        <InlineFieldRow>
          <InlineField label="Legend" labelWidth={14} tooltip="Template for the legend label, e.g. {{instance}}">
            <Input
              value={query.legendFormat || ''}
              onChange={this.onLegendFormatChange}
              placeholder="{{instance}}"
              width={20}
            />
          </InlineField>
          <InlineField
            label="Offset"
            labelWidth={8}
            tooltip="Time offset for comparison queries (e.g. '1h', '24h')"
          >
            <Input value={query.offset || ''} onChange={this.onOffsetChange} placeholder="1h" width={10} />
          </InlineField>
          <InlineField label="Instant" labelWidth={8} tooltip="Return only the latest value instead of a range">
            <Switch value={query.instant || false} onChange={this.onInstantChange} />
          </InlineField>
        </InlineFieldRow>

        {/* ── HarchOS language hint ──────────────────────────────────────────── */}
        {isHarchOSLanguage(query.language) && (
          <div className="text-muted" style={{ marginTop: '8px', fontSize: '12px' }}>
            <i className="fa fa-info-circle" /> This query uses a HarchOS-specific language (
            {query.language === HarchOSQueryLanguage.EnergyQL ? 'EnergyQL' : 'SovereigntyQL'}). Ensure your HarchOS
            Observability API supports this endpoint.
          </div>
        )}
      </div>
    );
  }
}
