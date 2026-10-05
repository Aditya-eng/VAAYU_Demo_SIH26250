# VAAYU interface and inspection workspace

The shared interface uses dark graphite surfaces, restrained lime actions, muted steel text, compact technical labels and a custom geometric VAAYU mark. Status colors retain text and icons. Motion page transitions honor reduced-motion settings.

## Aircraft

The default inspector loads the licensed A320 reference GLB from amvlab, with its embedded texture in WebGL. Geometry is rotated and normalized for inspection. Copyright, license and modifications are documented in `public/models/ATTRIBUTION.md` and linked beside the viewer. Synthetic aircraft types and capacities are not specifications for the displayed A320.

Eight selectable numbered inspection zones correspond to the shared component records. Short markers use collision-aware placement; full names, status text and zone names remain in the left component register. The right panel shows findings, component-specific inspection scope, equipment, spares, work windows and a direct work-order action. Fleet issues expose faulty, due, stale and missing records.

These are approximate external reference zones. They are not segmented manufacturer CAD, internal components or approved maintenance instructions. An illustrative exploded component assembly and an accessible selectable 2D schematic remain available. SVG compatibility mode uses untextured materials when WebGL is unavailable.

## Maintenance

The queue and task console expose required resources, current stage, checklists, recorded notes and the next action. A visible demo-role switch enables Maintenance Officer controls. Start records a note automatically; completion and verification require checks and notes. Clearance requires its own recorded statement. The domain engine continues to enforce role, stage, spare and clearance constraints.

Inspection work orders can now be created for a selected non-faulted component, including UNKNOWN and STALE records. They withhold the aircraft and revalidate missions. They consume no replacement spare. Only the recorded clearance restores the component's HEALTHY state. Fault repairs use their existing work order and inventory reservation.

## Maps

Location labels occupy dedicated opaque cards connected to markers by leader lines. Route paths remain below labels. Selected routes and mission details use the same mission assignment as the schedule. All coordinates and constraints are synthetic.

## Design tools and provenance

- MagicPath MCP: queried its theme/interaction guidance and used the Ramp direction as a reference for restrained lime accents and compact surfaces. A reusable maintenance console was authored locally for integration and a canvas preview. Automatic approval review rejected sending private component source to MagicPath; no component upload or successful MagicPath render is claimed.
- Official shadcn MCP: started through its official CLI, retrieved the component audit checklist and tabs example. The inspector uses accessible Radix tab composition based on that interaction pattern, styled with VAAYU's shared CSS.
- Motion: used for short, reduced-motion-aware page transitions. The Motion MCP server was not connected.
- Componentry registry remains configured from the earlier iteration. Kokonut UI, Bklit UI and Watermelon UI were public composition references, not installed MCP servers. Emotion was not added because the project already uses a common CSS/Tailwind styling system.

No premium component code or unlicensed aircraft asset was imported.

## Expanded fleet — 05 October 2026

Five distinct CC BY 4.0 airframe references now share the same viewer: A320, A350, B737, Rafale and Su-35. Fighter fleet records are synthetic inspection/readiness demonstrations. The renderer preserves model hierarchies, calibrates their native axes to nose-forward, normalizes the complete airframe and uses fighter-specific approximate zones. Software rendering expands interleaved geometry attributes and uses a simplified Su-35 derivative; full WebGL models retain authored textures. Fleet filters, model cards and fighter 2D schematics expose the same shared state. Existing saved scenarios migrate without losing operational history.
