import { ChangeEvent, PureComponent } from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { InlineField, InlineFieldRow, Input, Switch, SecretInput, FieldSet } from '@grafana/ui';

import { HarchOSDataSourceOptions, HarchOSSecureJsonData, HarchOSQueryLanguage, QUERY_LANGUAGE_OPTIONS } from './types';

/**
 * Props type derived from the Grafana DataSourcePluginOptionsEditorProps generic.
 */
interface Props extends DataSourcePluginOptionsEditorProps<HarchOSDataSourceOptions, HarchOSSecureJsonData> {}

/**
 * State for the config editor form.
 */
interface State {
  /** Custom header key being edited */
  newHeaderKey: string;
  /** Custom header value being edited */
  newHeaderValue: string;
}

/**
 * Configuration editor for the HarchOS Observability data source.
 *
 * Allows users to configure:
 *  - API URL
 *  - TLS verification toggle
 *  - Default query language
 *  - HarchOS-specific language toggle
 *  - Request timeout
 *  - Basic auth credentials
 *  - Bearer token
 *  - Custom HTTP headers
 */
export class HarchOSConfigEditor extends PureComponent<Props, State> {
  state: State = {
    newHeaderKey: '',
    newHeaderValue: '',
  };

  // ── Generic JSON data updater ──────────────────────────────────────────────

  private onJsonDataChange = (field: keyof HarchOSDataSourceOptions, value: unknown) => {
    const { onOptionsChange, options } = this.props;
    const newJsonData = { ...options.jsonData, [field]: value };
    onOptionsChange({ ...options, jsonData: newJsonData });
  };

  // ── Secure JSON data updater ───────────────────────────────────────────────

  private onSecureJsonDataChange = (field: keyof HarchOSSecureJsonData, value: string) => {
    const { onOptionsChange, options } = this.props;
    const newSecureJsonData = { ...options.secureJsonData, [field]: value };
    onOptionsChange({ ...options, secureJsonData: newSecureJsonData });
  };

  private onSecureJsonDataReset = (field: keyof HarchOSSecureJsonData) => {
    const { onOptionsChange, options } = this.props;
    const newSecureJsonFields = { ...options.secureJsonFields, [field]: false };
    onOptionsChange({ ...options, secureJsonFields: newSecureJsonFields });
  };

  // ── URL ────────────────────────────────────────────────────────────────────

  private onUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({ ...options, url: event.target.value });
  };

  // ── Toggle helpers ─────────────────────────────────────────────────────────

  private onTlsSkipVerifyChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.onJsonDataChange('tlsSkipVerify', event.target.checked);
  };

  private onEnableHarchOSLanguagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.onJsonDataChange('enableHarchOSLanguages', event.target.checked);
  };

  // ── Default language ───────────────────────────────────────────────────────

  private onDefaultLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    this.onJsonDataChange('defaultLanguage', event.target.value as HarchOSQueryLanguage);
  };

  // ── Timeout ────────────────────────────────────────────────────────────────

  private onTimeoutChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      this.onJsonDataChange('timeout', value);
    }
  };

  // ── Basic auth ─────────────────────────────────────────────────────────────

  private onBasicAuthToggle = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      basicAuth: event.target.checked,
    });
  };

  private onBasicAuthUserChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      basicAuthUser: event.target.value,
    });
  };

  // ── Custom headers ─────────────────────────────────────────────────────────

  private onAddHeader = () => {
    const { newHeaderKey, newHeaderValue } = this.state;
    if (!newHeaderKey.trim()) {
      return;
    }

    const customHeaders = { ...(this.props.options.jsonData.customHeaders || {}), [newHeaderKey]: newHeaderValue };
    this.onJsonDataChange('customHeaders', customHeaders);
    this.setState({ newHeaderKey: '', newHeaderValue: '' });
  };

  private onRemoveHeader = (key: string) => {
    const customHeaders = { ...(this.props.options.jsonData.customHeaders || {}) };
    delete customHeaders[key];
    this.onJsonDataChange('customHeaders', customHeaders);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  render() {
    const { options } = this.props;
    const { jsonData, secureJsonData, secureJsonFields } = options;
    const { newHeaderKey, newHeaderValue } = this.state;
    const customHeaders = jsonData.customHeaders || {};

    return (
      <div className="gf-form-group">
        {/* ── Connection Settings ─────────────────────────────────────────── */}
        <FieldSet label="Connection">
          <InlineFieldRow>
            <InlineField label="URL" labelWidth={14} grow>
              <Input
                name="url"
                value={options.url}
                placeholder="http://harchos-observability:9090"
                onChange={this.onUrlChange}
                width={40}
              />
            </InlineField>
          </InlineFieldRow>

          <InlineFieldRow>
            <InlineField label="Skip TLS Verify" labelWidth={14}>
              <Switch value={jsonData.tlsSkipVerify || false} onChange={this.onTlsSkipVerifyChange} />
            </InlineField>
          </InlineFieldRow>

          <InlineFieldRow>
            <InlineField label="Request Timeout (ms)" labelWidth={14}>
              <Input
                name="timeout"
                type="number"
                value={jsonData.timeout || 30000}
                placeholder="30000"
                onChange={this.onTimeoutChange}
                width={16}
              />
            </InlineField>
          </InlineFieldRow>
        </FieldSet>

        {/* ── Query Language Defaults ──────────────────────────────────────── */}
        <FieldSet label="Query Language">
          <InlineFieldRow>
            <InlineField label="Default Language" labelWidth={14}>
              <select
                className="gf-form-input gf-form-input--form-input"
                value={jsonData.defaultLanguage || HarchOSQueryLanguage.PromQL}
                onChange={this.onDefaultLanguageChange}
              >
                {QUERY_LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </InlineField>
          </InlineFieldRow>

          <InlineFieldRow>
            <InlineField
              label="Enable HarchOS Languages"
              labelWidth={14}
              tooltip="Enable EnergyQL and SovereigntyQL query languages specific to HarchOS"
            >
              <Switch value={jsonData.enableHarchOSLanguages ?? true} onChange={this.onEnableHarchOSLanguagesChange} />
            </InlineField>
          </InlineFieldRow>
        </FieldSet>

        {/* ── Authentication ──────────────────────────────────────────────── */}
        <FieldSet label="Authentication">
          <InlineFieldRow>
            <InlineField label="Basic Auth" labelWidth={14}>
              <Switch value={!!options.basicAuth} onChange={this.onBasicAuthToggle} />
            </InlineField>
          </InlineFieldRow>

          {options.basicAuth && (
            <InlineFieldRow>
              <InlineField label="User" labelWidth={14}>
                <Input value={options.basicAuthUser || ''} onChange={this.onBasicAuthUserChange} width={24} />
              </InlineField>
              <InlineField label="Password" labelWidth={10}>
                <SecretInput
                  value={secureJsonData?.basicAuthPassword || ''}
                  isConfigured={!!secureJsonFields?.basicAuthPassword}
                  onReset={() => this.onSecureJsonDataReset('basicAuthPassword')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => this.onSecureJsonDataChange('basicAuthPassword', e.target.value)}
                />
              </InlineField>
            </InlineFieldRow>
          )}

          <InlineFieldRow>
            <InlineField label="API Key (Bearer)" labelWidth={14}>
              <SecretInput
                value={secureJsonData?.apiKey || ''}
                isConfigured={!!secureJsonFields?.apiKey}
                onReset={() => this.onSecureJsonDataReset('apiKey')}
                onChange={(e: ChangeEvent<HTMLInputElement>) => this.onSecureJsonDataChange('apiKey', e.target.value)}
                placeholder="Bearer token for HarchOS API"
              />
            </InlineField>
          </InlineFieldRow>
        </FieldSet>

        {/* ── Custom Headers ──────────────────────────────────────────────── */}
        <FieldSet label="Custom HTTP Headers">
          {Object.entries(customHeaders).map(([key]) => (
            <InlineFieldRow key={key}>
              <InlineField label={key} labelWidth={14}>
                <span>••••••••</span>
              </InlineField>
              <button className="btn btn-danger btn-small" type="button" onClick={() => this.onRemoveHeader(key)}>
                Remove
              </button>
            </InlineFieldRow>
          ))}

          <InlineFieldRow>
            <InlineField label="Header Name" labelWidth={14}>
              <Input
                value={newHeaderKey}
                placeholder="X-Custom-Header"
                onChange={(e: ChangeEvent<HTMLInputElement>) => this.setState({ newHeaderKey: e.target.value })}
                width={20}
              />
            </InlineField>
            <InlineField label="Value" labelWidth={8}>
              <Input
                value={newHeaderValue}
                placeholder="header-value"
                onChange={(e: ChangeEvent<HTMLInputElement>) => this.setState({ newHeaderValue: e.target.value })}
                width={20}
              />
            </InlineField>
            <button className="btn btn-primary btn-small" type="button" onClick={this.onAddHeader}>
              Add
            </button>
          </InlineFieldRow>
        </FieldSet>
      </div>
    );
  }
}
