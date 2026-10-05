import * as THREE from "three";
import type { AircraftComponent } from "../domain/types";

export const PART_POS: Record<string, THREE.Vector3Tuple> = {
  fuselage: [0, 0, 0],
  "left-engine": [-0.66, -0.18, 1.55],
  "right-engine": [0.66, -0.18, 1.55],
  "left-wing": [-0.72, 0, 0.35],
  "right-wing": [0.72, 0, 0.35],
  avionics: [0, 0.45, -2.45],
  tail: [0, 0.15, 3.25],
  "landing-gear": [0, -0.6, 0.3],
};
export const EXPLODE: Record<string, THREE.Vector3Tuple> = {
  fuselage: [0, 0, 0],
  "left-engine": [-1.4, -0.6, 0.5],
  "right-engine": [1.4, -0.6, 0.5],
  "left-wing": [-1.8, 0.5, 0],
  "right-wing": [1.8, 0.5, 0],
  avionics: [0, 1.3, -1],
  tail: [0, 0.8, 1.7],
  "landing-gear": [0, -1.1, 0],
};
export const STATUS_COLORS: Record<string, string> = {
  HEALTHY: "#748d86",
  FAULT: "#c55c50",
  "INSPECTION REQUIRED": "#c69746",
  UNKNOWN: "#929aa2",
  STALE: "#929aa2",
};

// Shared mesh construction keeps WebGL and the CPU compatibility renderer identical.
export function createAirframePart(id: string, textured: boolean) {
  const group = new THREE.Group();
  group.name = id;
  const surface = new THREE.MeshStandardMaterial({
    color: "#a5afb7",
    metalness: 0.65,
    roughness: 0.49,
    side: THREE.DoubleSide,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: "#28333e",
    metalness: 0.7,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: "#77848d",
    metalness: 0.88,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#263f4f",
    metalness: 0.45,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  let texture: THREE.CanvasTexture | undefined;
  if (textured && typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#c1c8cd";
    ctx.fillRect(0, 0, 512, 512);
    let seed = 27;
    for (let i = 0; i < 16000; i++) {
      seed = (seed * 16807) % 2147483647;
      const x = seed % 512;
      seed = (seed * 16807) % 2147483647;
      ctx.fillStyle = i % 2 ? "#ffffff0b" : "#2637470c";
      ctx.fillRect(x, seed % 512, 1, 1);
    }
    ctx.strokeStyle = "#56677466";
    ctx.lineWidth = 1;
    for (let y = 64; y < 512; y += 96) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    for (let x = 0; x < 512; x += 128) {
      ctx.strokeRect(x + 8, 12, 112, 480);
      for (let y = 20; y < 500; y += 24) {
        ctx.fillStyle = "#59667099";
        ctx.fillRect(x + 12, y, 2, 2);
      }
    }
    ctx.fillStyle = "#39434e";
    ctx.font = "bold 18px monospace";
    ctx.fillText("VAAYU / DEMO", 20, 44);
    texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    surface.map = texture;
    surface.bumpMap = texture;
    surface.bumpScale = 0.015;
  }
  function mesh(
    geo: THREE.BufferGeometry,
    mat: THREE.Material = surface,
    pos: THREE.Vector3Tuple = [0, 0, 0],
    rot: THREE.Vector3Tuple = [0, 0, 0],
  ) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.componentId = id;
    group.add(m);
    return m;
  }
  function line(points: THREE.Vector3Tuple[], color = "#697781") {
    const g = new THREE.BufferGeometry().setFromPoints(
      points.map((p) => new THREE.Vector3(...p)),
    );
    group.add(
      new THREE.Line(
        g,
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.55,
        }),
      ),
    );
  }
  function plate(
    points: [number, number][],
    pos: THREE.Vector3Tuple = [0, 0, 0],
    vertical = false,
  ) {
    const shape = new THREE.Shape(points.map((p) => new THREE.Vector2(...p)));
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.065,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.025,
      bevelSegments: 2,
      steps: 1,
    });
    return mesh(
      g,
      surface,
      pos,
      vertical ? [0, Math.PI / 2, 0] : [Math.PI / 2, 0, 0],
    );
  }
  if (id === "fuselage") {
    // Elliptical stations form a continuous tapered airframe, rather than stacked primitives.
    const stations = [
      [-5.5, 0.018, 0.018],
      [-4.8, 0.24, 0.22],
      [-3.7, 0.49, 0.39],
      [-2.4, 0.63, 0.51],
      [-1.1, 0.88, 0.47],
      [0.6, 1.1, 0.42],
      [2.6, 1.02, 0.35],
      [4.05, 0.77, 0.26],
    ];
    const vertices: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    const rings = 32;
    stations.forEach(([z, w, h], i) => {
      for (let j = 0; j <= rings; j++) {
        const a = (j / rings) * Math.PI * 2;
        vertices.push(Math.cos(a) * w, Math.sin(a) * h, z);
        uv.push(j / rings, i / (stations.length - 1));
      }
    });
    for (let i = 0; i < stations.length - 1; i++)
      for (let j = 0; j < rings; j++) {
        const a = i * (rings + 1) + j,
          b = a + rings + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    mesh(g);
    for (const side of [-1, 1]) {
      plate(
        [
          [0, -2.5],
          [side * 0.7, -0.8],
          [side * 1.05, 1.5],
          [0, 2.4],
        ],
        [side * 0.5, 0.07, 0],
      );
      line([
        [side * 0.5, 0.12, -3.6],
        [side * 0.7, 0.32, -1.5],
        [side * 0.95, 0.23, 2.6],
      ]);
      for (let z = -0.7; z < 2.7; z += 0.4)
        line([
          [side * 0.94, 0.25, z],
          [side * 1.04, 0.14, z + 0.15],
        ]);
    }
    mesh(
      new THREE.ConeGeometry(0.055, 0.55, 8),
      steel,
      [0, 0, -5.73],
      [-Math.PI / 2, 0, 0],
    );
  } else if (id.includes("engine")) {
    mesh(
      new THREE.CylinderGeometry(0.46, 0.4, 3.7, 32, 1, true),
      surface,
      [0, 0, 0],
      [Math.PI / 2, 0, 0],
    );
    mesh(
      new THREE.CylinderGeometry(0.34, 0.43, 0.57, 32, 1, true),
      steel,
      [0, 0, 2.06],
      [Math.PI / 2, 0, 0],
    );
    for (const z of [-1.84, 2.34]) {
      mesh(new THREE.TorusGeometry(0.37, 0.035, 6, 32), steel, [0, 0, z]);
      mesh(
        new THREE.CircleGeometry(0.335, 32),
        dark,
        [0, 0, z],
        z < 0 ? [0, Math.PI, 0] : [0, 0, 0],
      );
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      mesh(
        new THREE.BoxGeometry(0.018, 0.11, 0.5),
        steel,
        [Math.cos(a) * 0.37, Math.sin(a) * 0.37, 2.03],
        [0, 0, a],
      );
      mesh(
        new THREE.BoxGeometry(0.19, 0.026, 0.024),
        steel,
        [Math.cos(a) * 0.19, Math.sin(a) * 0.19, -1.87],
        [0, 0, a + 0.5],
      );
    }
    mesh(
      new THREE.ConeGeometry(0.095, 0.21, 16),
      steel,
      [0, 0, -1.91],
      [-Math.PI / 2, 0, 0],
    );
    for (let z = -1.4; z < 1.6; z += 0.55) {
      mesh(new THREE.TorusGeometry(0.451, 0.008, 4, 32), steel, [0, 0, z]);
    }
  } else if (id.includes("wing")) {
    const side = id === "left-wing" ? -1 : 1;
    plate([
      [0, -1.3],
      [side * 3.4, 1.6],
      [side * 3.45, 2.35],
      [side * 0.3, 1.72],
      [0, 0.6],
    ]);
    line([
      [side * 0.4, 0.045, -0.85],
      [side * 2.95, 0.045, 1.55],
      [side * 3.25, 0.045, 1.7],
    ]);
    line([
      [side * 0.7, 0.05, 1.15],
      [side * 3.3, 0.05, 2.05],
    ]);
    mesh(new THREE.BoxGeometry(0.04, 0.075, 0.7), steel, [
      side * 3.42,
      0,
      1.95,
    ]);
    for (let i = 0; i < 6; i++)
      line([
        [side * (0.9 + i * 0.32), 0.05, 1.28 + i * 0.06],
        [side * (0.98 + i * 0.32), 0.05, 1.65 + i * 0.06],
      ]);
  } else if (id === "avionics") {
    const canopy = mesh(
      new THREE.SphereGeometry(1, 32, 18),
      glass,
      [0, 0.19, 0],
    );
    canopy.scale.set(0.44, 0.42, 1.03);
    const frame = mesh(
      new THREE.TorusGeometry(0.45, 0.026, 8, 32),
      steel,
      [0, 0.13, 0.46],
      [Math.PI / 2, 0, 0],
    );
    frame.scale.set(1, 1.6, 1);
    line(
      [
        [0, 0.5, -0.81],
        [0, 0.61, -0.2],
        [0, 0.55, 0.55],
        [0, 0.1, 1.03],
      ],
      "#b7c2ca",
    );
    mesh(new THREE.BoxGeometry(0.45, 0.12, 0.3), dark, [0, -0.12, 0.17]);
  } else if (id === "tail") {
    for (const side of [-1, 1]) {
      const fin = plate(
        [
          [0, 0],
          [0.55, 1.65],
          [1.55, 1.48],
          [1.5, 0],
        ],
        [side * 0.7, 0.05, -0.4],
        true,
      );
      fin.rotation.z = side * -0.2;
      plate(
        [
          [0, -0.45],
          [side * 1.8, 0.7],
          [side * 1.75, 1.25],
          [0, 1],
        ],
        [side * 0.65, 0, 0],
      );
      line([
        [side * 0.8, 0.09, 0.5],
        [side * 2.2, 0.09, 1.02],
      ]);
    }
  } else if (id === "landing-gear") {
    for (const [x, z] of [
      [-0.8, 1.3],
      [0.8, 1.3],
      [0, -3],
    ]) {
      mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.65, 10), steel, [
        x,
        -0.25,
        z,
      ]);
      mesh(
        new THREE.CylinderGeometry(0.19, 0.19, 0.16, 16),
        dark,
        [x, -0.61, z],
        [0, 0, Math.PI / 2],
      );
      mesh(
        new THREE.CylinderGeometry(0.085, 0.085, 0.17, 12),
        steel,
        [x, -0.61, z],
        [0, 0, Math.PI / 2],
      );
      mesh(new THREE.BoxGeometry(0.18, 0.045, 0.65), surface, [
        x + 0.12,
        -0.05,
        z,
      ]);
    }
  }
  group.position.set(...PART_POS[id]);
  return {
    group,
    surface,
    dispose() {
      group.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
          o.geometry.dispose();
          if (o instanceof THREE.Line) (o.material as THREE.Material).dispose();
        }
      });
      surface.dispose();
      dark.dispose();
      steel.dispose();
      glass.dispose();
      texture?.dispose();
    },
  };
}
export function updatePart(
  part: ReturnType<typeof createAirframePart>,
  c: AircraftComponent,
  selected: string,
  overlay: boolean,
  explode: boolean,
) {
  const p = PART_POS[c.id],
    e = EXPLODE[c.id];
  part.group.position.set(
    p[0] + (explode ? e[0] : 0),
    p[1] + (explode ? e[1] : 0),
    p[2] + (explode ? e[2] : 0),
  );
  part.surface.color.set(
    overlay || c.status === "FAULT" ? STATUS_COLORS[c.status] : "#a5afb7",
  );
  part.surface.emissive.set(c.id === selected ? "#34546a" : "#000000");
  part.surface.emissiveIntensity = c.id === selected ? 0.13 : 0;
}
