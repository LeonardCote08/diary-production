// Add debug rendering to check if triangles are being drawn
window.debugWebGLRendering = function () {
    const renderer = window.nativeHotspotRenderer;
    if (!renderer) {
        console.error('No renderer found');
        return;
    }

    console.group('🔍 WebGL RENDERING DEBUG');

    // 1. Check canvas visibility
    const canvas = renderer.canvas;
    if (canvas) {
        const rect = canvas.getBoundingClientRect();
        console.log('Canvas position:', {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0,
            display: window.getComputedStyle(canvas).display,
            opacity: window.getComputedStyle(canvas).opacity,
            zIndex: window.getComputedStyle(canvas).zIndex
        });

        // Check if canvas is behind something
        const elementAtCenter = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
        );
        console.log(
            'Element at canvas center:',
            elementAtCenter?.className || elementAtCenter?.tagName
        );
    }

    // 2. Check projection matrix
    if (renderer.projectionMatrix) {
        const m = renderer.projectionMatrix;
        console.log('Projection Matrix:');
        console.log(
            `[${m[0].toFixed(3)}, ${m[4].toFixed(3)}, ${m[8].toFixed(3)}, ${m[12].toFixed(3)}]`
        );
        console.log(
            `[${m[1].toFixed(3)}, ${m[5].toFixed(3)}, ${m[9].toFixed(3)}, ${m[13].toFixed(3)}]`
        );
        console.log(
            `[${m[2].toFixed(3)}, ${m[6].toFixed(3)}, ${m[10].toFixed(3)}, ${m[14].toFixed(3)}]`
        );
        console.log(
            `[${m[3].toFixed(3)}, ${m[7].toFixed(3)}, ${m[11].toFixed(3)}, ${m[15].toFixed(3)}]`
        );
    }

    // 3. Check viewport bounds
    if (renderer.viewer) {
        const bounds = renderer.viewer.viewport.getBounds();
        console.log('Viewport bounds:', {
            x: bounds.x.toFixed(3),
            y: bounds.y.toFixed(3),
            width: bounds.width.toFixed(3),
            height: bounds.height.toFixed(3)
        });
    }

    // 4. Sample hotspot coordinates
    if (renderer.hotspots && renderer.hotspots.length > 0) {
        const firstHotspot = renderer.hotspots[0];
        console.log('First hotspot:', {
            id: firstHotspot.id,
            shape: firstHotspot.shape,
            firstCoord: firstHotspot.coordinates[0],
            bounds: renderer.calculateBounds(firstHotspot)
        });
    }

    // 5. Force a simple test render
    if (renderer.gl) {
        const gl = renderer.gl;

        // Try to fill with solid color first
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.0, 1.0, 0.0, 1.0); // Bright green
        gl.clear(gl.COLOR_BUFFER_BIT);

        console.log('Cleared to green - is it visible?');
    }

    console.groupEnd();
};

// Test coordinate transformation
window.testCoordinateTransform = function () {
    const renderer = window.nativeHotspotRenderer;
    if (!renderer || !renderer.hotspots || renderer.hotspots.length === 0) {
        console.error('No renderer or hotspots');
        return;
    }

    // Update projection matrix first
    renderer.updateProjectionMatrix();

    // Test with first hotspot
    const hotspot = renderer.hotspots[0];
    const bounds = renderer.calculateBounds(hotspot);

    console.group('🎯 COORDINATE TRANSFORM TEST');
    console.log('Hotspot bounds (image space):', bounds);

    // Transform center point
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    // Apply projection matrix manually
    const m = renderer.projectionMatrix;
    const ndcX = centerX * m[0] + centerY * m[4] + m[12];
    const ndcY = centerX * m[1] + centerY * m[5] + m[13];

    console.log('Center in image space:', { x: centerX, y: centerY });
    console.log('Center in NDC space:', { x: ndcX, y: ndcY });
    console.log('Should be visible?', ndcX >= -1 && ndcX <= 1 && ndcY >= -1 && ndcY <= 1);

    console.groupEnd();
};

// Add this to the existing debug functions
window.debugWebGL = debugWebGLRendering;
