/** @type {import('@remix-run/dev').AppConfig} */
const { getDependenciesToBundle } = require("@remix-run/dev");

module.exports = {
  ignoredRouteFiles: ["**/.*"],
  appDirectory: 'app',
  assetsBuildDirectory: 'public/build',
  publicPath: '/build/',
  serverBuildPath: 'build/index.js',
  devServerPort: 8002,
  serverModuleFormat: "cjs",
  future: {
    v2_errorBoundary: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
  serverDependenciesToBundle: [
    "marked"
  ]
};
