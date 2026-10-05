import React from 'react';
import { ReportSidebar } from '@custom/extension-reporting';
import ObservationPanel from './ObservationPanel';

export const id = '@custom/extension-observations';

export default {
  id,
  getPanelModule({ hotkeysManager }) {
    return [
      {
        name: 'observations',
        iconName: 'tab-patient-info',
        iconLabel: 'Observations',
        label: 'Observations',
        component: () => <ObservationPanel ReportComponent={ReportSidebar} hotkeysManager={hotkeysManager} />,
      },
    ];
  },
};
