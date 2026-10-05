"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { airframeFor } from "../domain/airframes";
import type { AircraftViewProps } from "./aircraft-model";
const TRANSPORT_ZONES: Record<string, THREE.Vector3Tuple> = {
  "left-engine": [-1.65, -0.7, -1.0],
  "right-engine": [1.65, -0.7, -1.0],
  "left-wing": [-3.4, -0.15, 0.6],
  "right-wing": [3.4, -0.15, 0.6],
  "landing-gear": [0, -1.25, 0.3],
  fuselage: [0, -0.05, 0.5],
  avionics: [0, 0.15, -4],
  tail: [0, 0.7, 4],
};
const TRANSPORT_SIZES: Record<string, THREE.Vector3Tuple> = {
  "left-engine": [1.0, 0.9, 1.6],
  "right-engine": [1.0, 0.9, 1.6],
  "left-wing": [3.4, 0.3, 2.7],
  "right-wing": [3.4, 0.3, 2.7],
  "landing-gear": [1.7, 0.5, 2.6],
  fuselage: [1.1, 1, 5],
  avionics: [0.9, 0.6, 1.1],
  tail: [2.3, 1.6, 1.5],
};
const COLORS: Record<string, string> = {
  HEALTHY: "#b7d871",
  "INSPECTION REQUIRED": "#edb55e",
  FAULT: "#ef7e65",
  UNKNOWN: "#9eabc0",
  STALE: "#9eabc0",
};
type API = { update: () => void; focus: () => void; reset: () => void };
export default function SourcedAircraft(props: AircraftViewProps) {
  const hostRef = useRef<HTMLDivElement>(null),
    latest = useRef(props),
    api = useRef<API | null>(null);
  const [status, setStatus] = useState("Loading licensed aircraft model…");
  useEffect(() => {
    latest.current = props;
    api.current?.update();
  }, [props]);
  useEffect(() => {
    if (props.focus) api.current?.focus();
  }, [props.focus]);
  useEffect(() => {
    api.current?.reset();
  }, [props.reset]);
  useEffect(() => {
    const host = hostRef.current!;
    const spec = airframeFor(latest.current.aircraft);
    const fighter = spec.family === "FIGHTER";
    const ZONES: Record<string, THREE.Vector3Tuple> = fighter
      ? {
          "left-engine": [-0.65, -0.35, 2.8],
          "right-engine": [0.65, -0.35, 2.8],
          "left-wing": [-2, 0, 0.7],
          "right-wing": [2, 0, 0.7],
          "landing-gear": [0, -0.8, -0.3],
          fuselage: [0, 0, -0.5],
          avionics: [0, 0.15, -3.5],
          tail: [0, 0.8, 3.6],
        }
      : TRANSPORT_ZONES;
    const SIZES: Record<string, THREE.Vector3Tuple> = fighter
      ? {
          ...TRANSPORT_SIZES,
          "left-engine": [0.65, 0.7, 1.6],
          "right-engine": [0.65, 0.7, 1.6],
          "left-wing": [2.7, 0.3, 2.8],
          "right-wing": [2.7, 0.3, 2.8],
        }
      : TRANSPORT_SIZES;
    let disposed = false;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    let renderer: THREE.WebGLRenderer | SVGRenderer;
    let gpu = false;
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2", { antialias: true, alpha: true });
      if (!gl) throw Error("GPU unavailable");
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: gl,
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
      renderer.setClearColor("#10171c", 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      gpu = true;
    } catch {
      renderer = new SVGRenderer();
      renderer.setQuality("high");
      renderer.setPrecision(2);
      renderer.setClearColor(new THREE.Color("#10171c"), 0);
    }
    renderer.domElement.setAttribute(
      "aria-label",
      `Licensed ${spec.name} model. Select an inspection zone using numbered markers or the component list.`,
    );
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 6;
    controls.maxDistance = 26;
    controls.maxPolarAngle = Math.PI * 0.85;
    scene.add(new THREE.AmbientLight("#d7e2e4", gpu ? 2 : 0.8));
    const key = new THREE.DirectionalLight("#ffffff", gpu ? 3 : 1);
    key.position.set(-6, 10, -5);
    scene.add(key);
    const fill = new THREE.DirectionalLight("#a7c6c4", gpu ? 2 : 0.4);
    fill.position.set(6, 3, 5);
    scene.add(fill);
    const zones = new Map<string, THREE.Mesh>(),
      markers = new Map<string, HTMLButtonElement>();
    latest.current.aircraft.components.forEach((c, i) => {
      const mat = new THREE.MeshBasicMaterial({
        color: COLORS[c.status],
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        wireframe: true,
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(...SIZES[c.id]), mat);
      box.position.set(...ZONES[c.id]);
      scene.add(box);
      zones.set(c.id, box);
      const button = document.createElement("button");
      button.className = "inspection-pin";
      button.textContent = String(i + 1).padStart(2, "0");
      button.setAttribute("aria-label", `${c.name} inspection zone`);
      button.onclick = () => latest.current.select(c.id);
      host.appendChild(button);
      markers.set(c.id, button);
    });
    let model: THREE.Group | undefined;
    let targets: THREE.Object3D[] = [];
    const render = () => {
      if (disposed) return;
      renderer.render(scene, camera);
      const placed: { x: number; y: number }[] = [];
      latest.current.aircraft.components.forEach((c) => {
        const el = markers.get(c.id)!;
        const p = zones.get(c.id)!.position.clone().project(camera);
        let x = ((p.x + 1) * host.clientWidth) / 2,
          y = ((1 - p.y) * host.clientHeight) / 2;
        x = Math.max(22, Math.min(host.clientWidth - 22, x));
        y = Math.max(22, Math.min(host.clientHeight - 60, y));
        // Keep clustered projections separate, including near viewport edges.
        if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < 38)) {
          const candidates: { x: number; y: number }[] = [];
          for (let gy = 24; gy < host.clientHeight - 84; gy += 40)
            for (let gx = 24; gx < host.clientWidth - 24; gx += 40)
              if (placed.every((q) => Math.hypot(q.x - gx, q.y - gy) >= 38))
                candidates.push({ x: gx, y: gy });
          candidates.sort(
            (a, b) =>
              Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
          );
          if (candidates[0]) ({ x, y } = candidates[0]);
        }
        placed.push({ x, y });
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.display = latest.current.labels ? "grid" : "none";
        el.style.setProperty("--pin-color", COLORS[c.status]);
        el.classList.toggle("active", latest.current.selected === c.id);
        el.title = `${c.name}: ${c.status}`;
      });
    };
    const reset = () => {
      camera.position.set(8.5, 6, -11);
      controls.target.set(0, -0.25, 0);
      controls.update();
      render();
    };
    const update = () => {
      latest.current.aircraft.components.forEach((c) => {
        const zone = zones.get(c.id)!;
        zone.visible =
          c.id === latest.current.selected ||
          (latest.current.overlay && c.status !== "HEALTHY");
        (zone.material as THREE.MeshBasicMaterial).color.set(COLORS[c.status]);
        (zone.material as THREE.MeshBasicMaterial).opacity =
          c.id === latest.current.selected ? 0.32 : 0.14;
      });
      render();
    };
    const resize = () => {
      if (!host.clientWidth || !host.clientHeight) return;
      renderer.setSize(host.clientWidth, host.clientHeight);
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      render();
    };
    new GLTFLoader().load(
      !gpu && spec.lowDetailPath ? spec.lowDetailPath : spec.path,
      (gltf) => {
        if (disposed) return;
        // Normalize the complete hierarchy once, preserving authored mesh alignment.
        // Reference assets have different native axes and must share nose = -Z.
        const oriented = new THREE.Group();
        oriented.add(gltf.scene);
        oriented.rotation.set(...spec.rotation);
        oriented.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(oriented);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const scale = 10.8 / size.z;
        oriented.position.copy(center).multiplyScalar(-scale);
        oriented.position.y += 0.6;
        oriented.scale.setScalar(scale);
        model = oriented;
        model.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            // SVGRenderer reads packed arrays directly; expand interleaved GLB attributes.
            if (!gpu)
              o.geometry = o.geometry.index
                ? o.geometry.toNonIndexed()
                : o.geometry.clone();
            const prepare = (original: THREE.Material) => {
              const mat = original.clone() as THREE.MeshStandardMaterial;
              if ("roughness" in mat) {
                mat.metalness = Math.min(mat.metalness ?? 0.2, 0.45);
                mat.roughness = Math.max(mat.roughness ?? 0.5, 0.38);
              }
              if (!gpu && mat.color) {
                mat.map = null;
                mat.color.lerp(new THREE.Color("#9cabb2"), 0.55);
              }
              return mat;
            };
            o.material = Array.isArray(o.material)
              ? o.material.map(prepare)
              : prepare(o.material);
            targets.push(o);
          }
        });
        scene.add(model);
        setStatus(`${spec.name} · ${gpu ? "textured 3D" : "compatibility 3D"}`);
        update();
      },
      undefined,
      () => {
        setStatus(
          "Model could not load. The component list and 2D view remain available.",
        );
      },
    );
    const ray = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let down = [0, 0];
    const start = (e: PointerEvent) => {
      down = [e.clientX, e.clientY];
    };
    const end = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(targets, true)[0];
      if (hit) {
        const nearest = Object.entries(ZONES).sort(
          (a, b) =>
            hit.point.distanceTo(new THREE.Vector3(...a[1])) -
            hit.point.distanceTo(new THREE.Vector3(...b[1])),
        )[0];
        latest.current.select(nearest[0]);
      }
    };
    renderer.domElement.addEventListener("pointerdown", start as EventListener);
    renderer.domElement.addEventListener("pointerup", end as EventListener);
    controls.addEventListener("change", render);
    api.current = {
      update,
      reset,
      focus: () => {
        const t = new THREE.Vector3(...ZONES[latest.current.selected]);
        controls.target.copy(t);
        camera.position.copy(t.clone().add(new THREE.Vector3(5, 3, -6)));
        controls.update();
        render();
      },
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    reset();
    resize();
    return () => {
      disposed = true;
      observer.disconnect();
      controls.removeEventListener("change", render);
      controls.dispose();
      renderer.domElement.removeEventListener(
        "pointerdown",
        start as EventListener,
      );
      renderer.domElement.removeEventListener(
        "pointerup",
        end as EventListener,
      );
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => {
            const tex = (m as THREE.MeshStandardMaterial).map;
            tex?.dispose();
            m.dispose();
          });
        }
      });
      if (renderer instanceof THREE.WebGLRenderer) renderer.dispose();
      host.replaceChildren();
      api.current = null;
      targets = [];
    };
  }, []);
  return (
    <>
      <div ref={hostRef} className="sourced-aircraft" />
      <span className="renderer-note">{status}</span>
    </>
  );
}
