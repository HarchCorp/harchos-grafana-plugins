const CopyPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const path = require('path');

module.exports = (env) => {
  const isProduction = env.production === true;
  const isDevelopment = env.development === true;

  const plugins = [
    new CopyPlugin({
      patterns: [
        { from: 'plugin.json', to: '.' },
        { from: 'README.md', to: '.' },
        { from: 'LICENSE', to: '.' },
        { from: '**/*.json', to: '.', context: 'src/dashboards/', noErrorOnMissing: true },
        // Sub-plugin plugin.json files
        { from: 'src/panels/gpu-utilization/plugin.json', to: 'gpu-utilization/plugin.json' },
        { from: 'src/panels/hub-health/plugin.json', to: 'hub-health/plugin.json' },
        { from: 'src/panels/carbon-metrics/plugin.json', to: 'carbon-metrics/plugin.json' },
        { from: 'src/panels/workload-distribution/plugin.json', to: 'workload-distribution/plugin.json' },
        { from: 'src/panels/carbon-forecast/plugin.json', to: 'carbon-forecast/plugin.json' },
        { from: 'src/panels/pricing-comparison/plugin.json', to: 'pricing-comparison/plugin.json' },
        { from: 'src/datasource/plugin.json', to: 'datasource/plugin.json' },
        // Images
        { from: 'img/', to: 'img/', noErrorOnMissing: true },
        { from: 'src/panels/gpu-utilization/img/', to: 'gpu-utilization/img/', noErrorOnMissing: true },
        { from: 'src/panels/hub-health/img/', to: 'hub-health/img/', noErrorOnMissing: true },
        { from: 'src/panels/carbon-metrics/img/', to: 'carbon-metrics/img/', noErrorOnMissing: true },
        { from: 'src/panels/workload-distribution/img/', to: 'workload-distribution/img/', noErrorOnMissing: true },
        { from: 'src/panels/carbon-forecast/img/', to: 'carbon-forecast/img/', noErrorOnMissing: true },
        { from: 'src/panels/pricing-comparison/img/', to: 'pricing-comparison/img/', noErrorOnMissing: true },
        { from: 'src/datasource/img/', to: 'datasource/img/', noErrorOnMissing: true },
      ],
    }),
    new ForkTsCheckerWebpackPlugin({
      async: !isProduction,
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
      },
      issue: {
        exclude: [{ file: '**/*.test.ts' }, { file: '**/*.test.tsx' }],
      },
    }),
  ];

  if (isDevelopment) {
    plugins.push(new LiveReloadPlugin({ port: 35730 }));
  }

  return {
    entry: {
      datasource: './src/datasource/module.ts',
      'gpu-utilization': './src/panels/gpu-utilization/module.tsx',
      'carbon-metrics': './src/panels/carbon-metrics/module.tsx',
      'hub-health': './src/panels/hub-health/module.tsx',
      'workload-distribution': './src/panels/workload-distribution/module.tsx',
      'carbon-forecast': './src/panels/carbon-forecast/module.tsx',
      'pricing-comparison': './src/panels/pricing-comparison/module.tsx',
    },
    output: {
      filename: '[name]/module.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      alias: {
        '@harchos/datasource': path.resolve(__dirname, 'src/datasource'),
        '@harchos/panels': path.resolve(__dirname, 'src/panels'),
      },
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                target: 'es2020',
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                  },
                },
              },
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    externals: {
      react: 'react',
      'react-dom': 'react-dom',
      '@grafana/data': 'grafanaData',
      '@grafana/runtime': 'grafanaRuntime',
      '@grafana/ui': 'grafanaUi',
      '@grafana/schema': 'grafanaSchema',
      'rxjs': 'rxjs',
    },
    plugins,
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
  };
};
