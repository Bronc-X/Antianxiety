'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import type { Points as ThreePoints } from 'three';
import * as random from 'maath/random/dist/maath-random.cjs';

// --- Particle System Component ---
function DigitalCortex() {
    const ref = useRef<ThreePoints>(null);

    // Generate 2000 random points in a sphere
    const [sphere] = useState(() => random.inSphere(new Float32Array(3000), { radius: 1.5 }));

    // Rotate the sphere every frame
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10;
            ref.current.rotation.y -= delta / 15;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#D4AF37" // Premium Gold
                    size={0.005}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.8}
                />
            </Points>
        </group>
    );
}

function DataStream() {
    const ref = useRef<ThreePoints>(null);
    const [stream] = useState(() => random.inSphere(new Float32Array(1000), { radius: 2.5 }));

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta / 8;
        }
    });

    return (
        <group rotation={[0, 0, 0]}>
            <Points ref={ref} positions={stream} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#0EA5E9" // Tech Cyan
                    size={0.003}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.5}
                />
            </Points>
        </group>
    )
}

// --- Main Background Component ---
export default function ThreeBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <DigitalCortex />
                <DataStream />
            </Canvas>
        </div>
    );
}
