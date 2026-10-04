import {
  basicLayout,
  basicRoute,
  mode as basicMode,
  modeInstance as basicModeInstance,
  extensionDependencies as basicDependencies,
} from '@ohif/mode-basic';

export const id = '@custom/mode-observations';
const observationsPanel = '@custom/extension-observations.panelModule.observations';

export const extensionDependencies = {
  ...basicDependencies,
  '@custom/extension-observations': '^0.1.0',
};

// Extend the installed basic mode instead of duplicating its tools or viewports.
export const modeInstance = {
  ...basicModeInstance,
  id,
  routeName: 'observations',
  displayName: 'Observation Viewer',
  hide: false,
  activatePanelTrigger: false,
  extensions: extensionDependencies,
  routes: [
    {
      ...basicRoute,
      path: 'observations',
      layoutInstance: {
        ...basicLayout,
        props: {
          ...basicLayout.props,
          rightPanels: [observationsPanel],
          rightPanelClosed: false,
          rightPanelResizable: true,
          rightPanelInitialExpandedWidth: 360,
          rightPanelMinimumExpandedWidth: 280,
        },
      },
    },
  ],
};

export const mode = {
  ...basicMode,
  id,
  modeInstance,
  extensionDependencies,
  modeFactory({ modeConfiguration }) {
    return basicMode.modeFactory.call(
      {
        // Each instance owns its cleanup subscriptions. OHIF applies optional
        // app-config overrides through the basic mode's existing factory.
        modeInstance: { ...this.modeInstance, _activatePanelTriggersSubscriptions: [] },
      },
      { modeConfiguration }
    );
  },
};

export default mode;
