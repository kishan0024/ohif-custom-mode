/** Local Observation Viewer. Orthanc is proxied by dev:observations. */
window.config = {
  routerBasename: '/',
  extensions: [],
  modes: [],
  showStudyList: true,
  showLoadingIndicator: true,
  maxNumberOfWebWorkers: 3,
  investigationalUseDialog: { option: 'never' },
  defaultDataSourceName: 'orthanc',
  reporting: {
    apiBaseUrl: '/api',
    // The embedding application may replace this with its authenticated token provider.
    // Use the access token returned after selecting the active clinic.
    getAccessToken: () => window.sessionStorage.getItem('mediscribe.accessToken') || '',
  },
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'orthanc',
      configuration: {
        friendlyName: 'Local Orthanc',
        name: 'Orthanc',
        wadoUriRoot: '/pacs/dicom-web',
        qidoRoot: '/pacs/dicom-web',
        wadoRoot: '/pacs/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        dicomUploadEnabled: true,
        omitQuotationForMultipartRequest: true,
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
      },
    },
  ],
};
