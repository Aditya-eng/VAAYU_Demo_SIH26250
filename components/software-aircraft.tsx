"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createAirframePart, updatePart } from "./airframe-geometry";
import type { AircraftViewProps } from "./aircraft-model";
type API = { update: () => void; focus: () => void; reset: () => void };
export default function SoftwareAircraft(props: AircraftViewProps) {
  const hostRef = useRef<HTMLDivElement>(null),
    latest = useRef(props),
    api = useRef<API | null>(null);
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
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100),
      renderer = new SVGRenderer();
    renderer.setQuality("high");
    renderer.setPrecision(2);
    renderer.setClearColor(new THREE.Color("#eff3f6"), 0);
    renderer.overdraw = 0.25;
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive representative twin-engine jet. Drag to rotate; scroll to zoom.",
    );
    renderer.domElement.setAttribute("role", "img");
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 4;
    controls.maxDistance = 30;
    scene.add(new THREE.AmbientLight("#ffffff", 0.65));
    const key = new THREE.DirectionalLight("#ffffff", 0.95);
    key.position.set(-4, 10, -6);
    scene.add(key);
    const fill = new THREE.DirectionalLight("#b6c8d9", 0.35);
    fill.position.set(6, 4, 4);
    scene.add(fill);
    const parts = latest.current.aircraft.components.map((c) =>
      createAirframePart(c.id, false),
    );
    parts.forEach((p) => scene.add(p.group));
    const render = () => renderer.render(scene, camera);
    const reset = () => {
      camera.position.set(8, 6.5, -10);
      controls.target.set(0, 0, -0.4);
      controls.update();
      render();
    };
    const update = () => {
      latest.current.aircraft.components.forEach((c, i) =>
        updatePart(
          parts[i],
          c,
          latest.current.selected,
          latest.current.overlay,
          latest.current.explode,
        ),
      );
      render();
    };
    const resize = () => {
      if (!host.clientWidth || !host.clientHeight) return;
      renderer.setSize(host.clientWidth, host.clientHeight);
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      render();
    };
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down = [0, 0];
    const hit = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      return ray
        .intersectObjects(
          parts.map((p) => p.group),
          true,
        )
        .find((h) => h.object.userData.componentId)?.object.userData
        .componentId as string | undefined;
    };
    const start = (e: PointerEvent) => {
      down = [e.clientX, e.clientY];
    };
    const end = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 5) {
        const id = hit(e);
        if (id) latest.current.select(id);
      }
    };
    const move = (e: PointerEvent) => {
      const id = hit(e);
      host.style.cursor = id ? "pointer" : "grab";
      renderer.domElement.setAttribute(
        "aria-label",
        id ? `Select ${id}` : "Drag to rotate aircraft",
      );
    };
    renderer.domElement.addEventListener("pointerdown", start);
    renderer.domElement.addEventListener("pointerup", end);
    renderer.domElement.addEventListener("pointermove", move);
    controls.addEventListener("change", render);
    api.current = {
      update,
      reset,
      focus: () => {
        const part = parts.find(
          (p) => p.group.name === latest.current.selected,
        )!;
        controls.target.copy(part.group.position);
        camera.position.copy(
          part.group.position.clone().add(new THREE.Vector3(5, 4, -6)),
        );
        controls.update();
        render();
      },
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    reset();
    update();
    resize();
    return () => {
      observer.disconnect();
      controls.removeEventListener("change", render);
      controls.dispose();
      parts.forEach((p) => p.dispose());
      host.replaceChildren();
      api.current = null;
    };
  }, []);
  return (
    <>
      <div className="software-aircraft" ref={hostRef} />
      <span className="renderer-note">
        Compatibility 3D · simplified materials
      </span>
    </>
  );
}
