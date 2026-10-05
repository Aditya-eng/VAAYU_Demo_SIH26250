import type { AirframeId } from "../domain/airframes";
export function AirframeSilhouette({ model }: { model: AirframeId }) {
  const fighter = model === "rafale" || model === "su35";
  const wings =
    model === "rafale"
      ? "M91 64 L27 143 L87 133 L100 154 L113 133 L173 143 L109 64 Z"
      : model === "su35"
        ? "M87 67 L25 118 L27 139 L83 120 L86 147 L56 167 L87 162 L100 178 L113 162 L144 167 L114 147 L117 120 L173 139 L175 118 L113 67 Z"
        : model === "a350"
          ? "M92 75 L11 133 L9 145 L90 115 L91 163 L58 182 L61 188 L100 179 L139 188 L142 182 L109 163 L110 115 L191 145 L189 133 L108 75 Z"
          : "M92 76 L22 125 L22 140 L91 115 L93 162 L64 179 L64 187 L100 177 L136 187 L136 179 L107 162 L109 115 L178 140 L178 125 L108 76 Z";
  return (
    <svg
      viewBox="0 0 200 210"
      className={`airframe-silhouette ${fighter ? "fighter" : ""}`}
      role="img"
      aria-label={`${model.toUpperCase()} airframe silhouette`}
    >
      <g
        fill="currentColor"
        fillOpacity=".18"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <path d={wings} />
        <path
          d={
            fighter
              ? "M100 12 C106 24 111 52 111 76 L114 149 L108 183 L92 183 L86 149 L89 76 C89 52 94 24 100 12 Z"
              : "M100 13 C112 25 110 48 110 64 L108 164 L100 192 L92 164 L90 64 C90 48 88 25 100 13 Z"
          }
        />
        {fighter ? (
          <>
            <path
              d="M96 41 Q100 31 104 41 L106 65 Q100 72 94 65 Z"
              fillOpacity=".5"
            />
            {model === "rafale" && (
              <path d="M89 57 L63 69 L61 77 L90 72 M111 57 L137 69 L139 77 L110 72" />
            )}
            <path d="M91 151 L91 182 M109 151 L109 182 M100 84 L100 152" />
          </>
        ) : (
          <>
            <rect x="60" y="105" width="12" height="30" rx="5" />
            <rect x="128" y="105" width="12" height="30" rx="5" />
            <path d="M94 35 Q100 31 106 35" />
          </>
        )}
      </g>
    </svg>
  );
}
