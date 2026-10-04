# Observation Viewer mode

This is a local OHIF mode package, not a separate viewer application.

- Package / mode ID: `@custom/mode-observations`
- Entry point: `src/index.ts`
- Viewer route: `/observations?StudyInstanceUIDs=<uid>`
- Worklist label: **Observation Viewer**
- Required custom panel: `@custom/extension-observations.panelModule.observations`

The mode follows the derived-mode pattern in the installed OHIF 3.12.12 checkout:

1. Import the existing basic mode, its mode instance, route, and layout.
2. Export a `modeInstance` that sets the mode ID, route name, and observation panel.
3. Export the mode with its factory and extension dependencies.
4. Link this package and the observation extension to the existing viewer.

The viewer supplies image rendering, study navigation, tools, SOP handlers, hanging protocol, and enter/exit lifecycle. Only the mode configuration lives here. Each factory invocation gets its own cleanup subscription array, and app-config mode overrides still work.

The observation React component belongs to the extension. The mode references its registered panel ID in `rightPanels`; it does not directly render the component or save observations.

Run `npm run link:viewer` from this custom repository to restore local package links and registration after reinstalling viewer dependencies. See the root README for startup and tests. The link helper uses project-local symbolic links and does not require a global Yarn link registry.

References: [OHIF modes](https://docs.ohif.org/platform/modes/), [panel modules](https://docs.ohif.org/platform/extensions/modules/panel/), and the existing viewer's `modes/basic/src/index.tsx` and `modes/longitudinal/src/index.ts`.
