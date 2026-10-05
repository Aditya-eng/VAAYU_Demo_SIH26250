"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { Component, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { OrbitControls as Controls } from "three-stdlib";
import type { Aircraft, AircraftComponent } from "../domain/types";
import {
  createAirframePart,
  updatePart,
  PART_POS,
  EXPLODE,
} from "./airframe-geometry";
export type AircraftViewProps = {
  aircraft: Aircraft;
  selected: string;
  select: (id: string) => void;
  explode: boolean;
  labels: boolean;
  overlay: boolean;
  focus: number;
  reset: number;
};
function Part({
  component,
  props,
}: {
  component: AircraftComponent;
  props: AircraftViewProps;
}) {
  const part = useMemo(
    () => createAirframePart(component.id, true),
    [component.id],
  );
  useEffect(() => () => part.dispose(), [part]);
  useEffect(
    () =>
      updatePart(part, component, props.selected, props.overlay, props.explode),
    [part, component, props.selected, props.overlay, props.explode],
  );
  return (
    <primitive
      object={part.group}
      onClick={(e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        props.select(component.id);
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    />
  );
}
function Camera({ props }: { props: AircraftViewProps }) {
  const ref = useRef<Controls>(null);
  const { camera } = useThree();
  useEffect(() => {
    if (!props.focus) return;
    const p = PART_POS[props.selected],
      e = EXPLODE[props.selected];
    const t = new THREE.Vector3(
      p[0] + (props.explode ? e[0] : 0),
      p[1] + (props.explode ? e[1] : 0),
      p[2] + (props.explode ? e[2] : 0),
    );
    ref.current?.target.copy(t);
    camera.position.copy(t.clone().add(new THREE.Vector3(5, 4, -6)));
    ref.current?.update();
  }, [props.focus, props.selected, props.explode, camera]);
  useEffect(() => {
    camera.position.set(8, 6.5, -10);
    ref.current?.target.set(0, 0, -0.4);
    ref.current?.update();
  }, [props.reset, camera]);
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      minDistance={4}
      maxDistance={30}
      enableDamping
      dampingFactor={0.1}
    />
  );
}
export class ModelBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}
export default function AircraftModel(props: AircraftViewProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [8, 6.5, -10], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1.6} />
      <hemisphereLight args={["#ffffff", "#8b97a1", 2]} />
      <directionalLight position={[-4, 10, -6]} intensity={3} castShadow />
      <directionalLight position={[6, 4, 4]} intensity={2} />
      {props.aircraft.components.map((c) => (
        <Part key={c.id} component={c} props={props} />
      ))}
      <ContactShadows
        position={[0, -2.5, 0]}
        opacity={0.2}
        scale={22}
        blur={2.5}
        far={8}
      />
      <Camera props={props} />
    </Canvas>
  );
}
