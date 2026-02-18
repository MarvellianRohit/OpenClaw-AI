import { motion } from 'framer-motion';

interface HardwareGridProps {
    gpuLoad: number; // 0-100
}

export default function HardwareGrid({ gpuLoad }: HardwareGridProps) {
    // Determine opacity/glow based on load
    // Low load: Dim grid. High load: Bright, pulsing grid.
    const opacity = 0.05 + (gpuLoad / 100) * 0.15; // 0.05 to 0.2

    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Base Grid */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `linear-gradient(to right, #333 1px, transparent 1px),
                                      linear-gradient(to bottom, #333 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    opacity: opacity,
                    transition: 'opacity 0.5s ease-out'
                }}
            />

            {/* Glow Effect at High Load (Overlay) */}
            <motion.div
                className="absolute inset-0 bg-neon-cyan blur-[100px]"
                animate={{
                    opacity: gpuLoad > 50 ? (gpuLoad - 50) / 200 : 0
                }}
                transition={{ duration: 0.5 }}
            />

            {/* Dynamic Pulse if Critical Load */}
            {gpuLoad > 80 && (
                <motion.div
                    className="absolute inset-0 border-4 border-neon-cyan/20"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                />
            )}
        </div>
    );
}
