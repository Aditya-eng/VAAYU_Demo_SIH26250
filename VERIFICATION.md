# VAAYU verification

## Automated checks

- Dependency installation completed with npm; lockfile included.
- Strict TypeScript check passed.
- ESLint passed.
- Production Vinext/Vite build passed; native Cloudflare-compatible Worker output generated.
- Eighteen domain tests cover positive and negative operational paths. Run `npm test` to repeat.

## Browser checks

The running application was exercised through its visible controls:

- Dashboard loaded with twelve aircraft, zero initial conflicts and seven feasible active missions.
- Three.js compatibility renderer loaded because the test browser has no WebGL context.
- Exploded view, independent engine selection, focus and reset camera worked.
- Recording a major left-engine fault on TR-03 created MX-204, reserved a spare, changed the rendered component to red and created a mission conflict and alerts.
- Schedule displayed RLF-204 CONFLICT and the assigned aircraft fault reason.
- Find alternatives recommended TR-07 at 14:18, with TR-06 at 14:47, and constraint explanations for rejected alternatives.
- Before/after showed conflicts 1→0, feasible active missions 6→7, delay 0→18 min, and changed crew/aircraft utilisation and feasible fuel.
- Approval updated RLF-204 and resolved its mission-conflict alert while retaining the aircraft fault alert.
- The work order required notes at every stage. Task completion and passed inspection preceded recorded clearance.
- Clearance changed TR-03 to AVAILABLE and the component to HEALTHY; the maintenance history recorded work and the spare was consumed.
- The 2D system schematic exposed the same component records and keyboard-accessible selections.

## Rendering scope

The WebGL implementation passed compilation; this browser could not supply a GPU context. Actual browser 3D checks exercised the automatic software-rendered Three.js geometry path. Both use the same domain records. No claim is made that the WebGL path was visually verified in a GPU-enabled browser.

No live operational integrations were tested or claimed. All scenario data is synthetic.

## Visual redesign verification — 03 October 2026

- Dependency installation completed (Motion added).
- Type checking, lint and the existing domain test suite passed after the redesign. Domain transitions and seed data were not changed.
- Browser inspected the daylight dashboard, representative jet and full mission map.
- Tested exploded mode, component-rail selection, focus/reset camera, 2D view and 2D component selection.
- Map route selection updated mission details; zoom/reset and weather toggle worked. Location names occupy separate opaque cards with leader lines, clear of the selected route at the default view.
- Component tags are normal-flow grid buttons, not camera-projected HTML labels. The selected callout has a reserved corner.
- The QA browser used the software 3D path. GPU texture/bump maps require a WebGL-enabled browser and were not visually verified here.
- Responsive CSS provides tablet/mobile layouts. Exact alternate viewport dimensions were not exercised in this browser session.
- Production build status is recorded by the successful publishing workflow.

## Aircraft and maintenance workspace — 04 October 2026

- Lint and strict TypeScript passed; all 18 domain tests passed, including inspection-only withholding, clearance, inventory conservation and role restrictions.
- Browser recorded a TR-03 left-engine fault, opened MX-204 directly, started maintenance, completed the three checks with notes, recorded passed verification, and issued clearance. The component returned to HEALTHY, TR-03 to AVAILABLE, the spare quantity fell from 4 to 3, and the mission/fault alerts resolved.
- 2D Left wing selection opened a component-specific inspection-only work order with its own scope and equipment. Mission RLF-204 became conflicted; generating alternatives selected TR-07 +18 minutes and TR-06 +47 minutes with dynamic 1→0 conflict comparison.
- Sourced A320 GLB loaded through the compatibility renderer. Nose/tail orientation was visually corrected. Focus and reset controls worked. WebGL textures are implemented but were not visually exercised because the QA browser has no GPU context.
- Responsive rules cover desktop, tablet and mobile; exact alternate viewport dimensions were not exercised in this browser session.
- MagicPath source upload was blocked by automatic approval review. Local source and design guidance remain integrated; no successful external component build is claimed.
- Approved the inspection-disrupted RLF-204 replan; the map displayed TR-07 / CREW-07 and the delayed ETA. Reset restored TR-03 / CREW-03, READY status and the original alert count.
- Final map visual check confirmed that Bravo and the other location cards were clear of the selected route at the default view.

## Expanded fleet — 05 October 2026

- Strict TypeScript and ESLint passed. All 21 domain tests passed, including five distinct model assignments, fighter cargo exclusion, fighter fault propagation and idempotent v1 saved-state migration preserving missions, work orders and audit history.
- The original hero workflow, dynamic comparison, maintenance clearance, approval, undo and full reset continue to pass automated tests against the 14-aircraft / 18-team seed.
- Browser loaded all five reference assets. Rafale, Su-35 and A350 orientation/geometry were visually checked. An interleaved-attribute software-rendering issue in the simplified Su-35 was fixed and visually rechecked.
- Fighter 2D Right wing selection updated the shared component panel and inspection scope. The Fighter jets filter displayed exactly the two new aircraft.
- Browser used SVG compatibility 3D. GPU materials/textures remain implemented but not visually verified in this GPU-less environment. Exact alternate viewport sizes were not exercised in this session.

## Geographic dashboard — 05 October 2026

- Installed Leaflet and its TypeScript definitions. Strict type checking and lint passed; all 22 domain tests passed, including empty-workspace collections and finite zero-valued metrics.
- Browser confirmed the new default workspace had no aircraft, missions, simulated weather, hub markers or alert counts. OpenStreetMap tiles loaded and were visually checked on the dashboard.
- Tested North regional navigation, the bundled outline-map toggle and Reset map. Tested entering the optional demo, selecting MED-012, displaying its crew/ETA/payload, opening layer controls and toggling weather.
- Leaving demo removed sample overlays. Reload preserved clean mode. Aircraft displayed a meaningful no-records state instead of a blank page or exception.
- Repeated endorsement wording was removed from the main UI. Map-provider attribution remains visible.
- Browser QA covered the available desktop viewport. Responsive CSS is provided; exact tablet/mobile viewport sizes were not exercised this session.
