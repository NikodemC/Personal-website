import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import { Boat } from './Boat';
import { Buoys } from './Buoys';
import { CameraRig } from './CameraRig';
import { Creatures } from './Creatures';
import { detectCapabilities } from './capabilities';
import { Effects } from './Effects';
import { Island } from './Island';
import { Lights } from './Lights';
import { Moon } from './Moon';
import { Ocean } from './Ocean';
import { SceneFog } from './SceneFog';
import { Sky } from './Sky';
import { VoyageDriver } from './VoyageDriver';
import { Wake } from './Wake';

export const VoyageCanvas = () => {
  const [capabilities] = useState(detectCapabilities);
  const [degraded, setDegraded] = useState(capabilities.lowPower);

  if (!capabilities.webgl) return null;

  return (
    <div className="voyage-canvas" aria-hidden="true">
      <Canvas
        dpr={degraded ? [1, 1.25] : [1, 2]}
        gl={{
          antialias: !degraded,
          powerPreference: 'high-performance',
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 0.92,
        }}
        camera={{ position: [9, 30, 34], fov: 62, near: 0.5, far: 900 }}
      >
        <PerformanceMonitor onDecline={() => setDegraded(true)} />
        <AdaptiveDpr pixelated={false} />
        <Suspense fallback={null}>
          <VoyageDriver />
          <SceneFog />
          <CameraRig />
          <Lights />
          <Sky />
          <Moon />
          <Ocean />
          <Boat />
          {!degraded && <Wake />}
          <Buoys />
          {!degraded && <Creatures />}
          <Island />
          {!degraded && <Effects />}
        </Suspense>
      </Canvas>
    </div>
  );
};
