import ObservationPanel from './ObservationPanel';

export const id = '@custom/extension-observations';

export default {
  id,
  getPanelModule() {
    return [
      {
        name: 'observations',
        iconName: 'tab-patient-info',
        iconLabel: 'Observations',
        label: 'Observations',
        component: ObservationPanel,
      },
    ];
  },
};
