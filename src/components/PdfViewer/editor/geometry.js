export function createCloudPoints(width, height, left = 0, top = 0) {
    return Array.from({ length: 33 }, (_value, index) => {
        const angle = index / 32 * Math.PI * 2;
        const ripple = .92 + .08 * Math.sin(angle * 8);
        return {
            x: left + width / 2 + Math.cos(angle) * width / 2 * ripple,
            y: top + height / 2 + Math.sin(angle) * height / 2 * ripple
        };
    });
}
