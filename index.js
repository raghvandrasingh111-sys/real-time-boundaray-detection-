const canvas = document.getElementById('detection-canvas');
const ctx = canvas.getContext('2d');
const mapContainer = document.getElementById('map-container');

// State
let currentFrame = 1;

// Resize canvas to match map container
function resize() {
    const parent = document.getElementById('map-parent');
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
}

window.addEventListener('resize', resize);
resize();

// Mock mapping from GeoJSON coords to screen coords
function mapCoords(coords) {
    // These offsets align with the 'vibrant_green_agri_map.png' features
    const centerX = 12.45;
    const centerY = 45.20; 
    const scale = 3000; 
    
    return coords.map(p => ({
        x: canvas.width / 2 + (p[0] - centerX) * scale,
        y: canvas.height / 2 - (p[1] - centerY) * scale
    }));
}

function drawDetections(features) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    features.forEach((feature) => {
        const props = feature.properties;
        const geom = feature.geometry;
        if (!geom || geom.type !== 'Polygon') return;

        // GeoJSON Polygons have nested arrays: [[[x,y], [x,y], ...]]
        const ring = geom.coordinates[0];
        const points = mapCoords(ring);
        if (points.length < 3) return;

        // Draw Glow Path
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();

        // Polygon style
        ctx.fillStyle = 'rgba(57, 255, 20, 0.15)';
        ctx.fill();
        
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#39ff14';
        ctx.setLineDash([8, 4]); 
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // Label
        ctx.font = 'bold 10px Inter';
        ctx.fillStyle = '#39ff14';
        ctx.fillText(props.id.toUpperCase(), points[0].x, points[0].y - 10);
    });
}

function updateUI(features, frame) {
    const list = document.getElementById('detections-list');
    if (!list) return;
    list.innerHTML = '';
    
    features.forEach(feature => {
        const props = feature.properties;
        const item = document.createElement('div');
        item.className = `flex items-center gap-4 px-6 py-4 text-[#baccb0] hover:text-[#e2e3e0] hover:bg-[#333534]/50 border-r-2 border-transparent transition-all cursor-pointer`;
        item.innerHTML = `
            <span class="material-symbols-outlined text-sm">radar</span>
            <div class="flex flex-col">
                <span class="font-['Inter'] uppercase tracking-widest text-[10px] text-white font-black">${props.id}</span>
                <span class="text-[9px] text-[#baccb0]">${props.area} ha | Conf: ${(props.confidence * 100).toFixed(1)}%</span>
            </div>
        `;
        list.appendChild(item);
    });

    const cpu = document.getElementById('cpu-stat');
    const lat = document.getElementById('latency-stat');
    if (cpu) cpu.textContent = `${Math.floor(20 + Math.random() * 15)}%`;
    if (lat) lat.textContent = `${Math.floor(40 + Math.random() * 10)}ms`;
}

async function fetchDetection(frame) {
    try {
        const response = await fetch(`detections_frame_${frame}.json`);
        const data = await response.json();
        // Handle GeoJSON FeatureCollection
        return data.features || [];
    } catch (e) {
        console.error("Error fetching frame:", e);
        return [];
    }
}

async function loop() {
    const features = await fetchDetection(currentFrame);
    if (features && features.length > 0) {
        updateUI(features, currentFrame);
        
        canvas.style.opacity = 0.5;
        setTimeout(() => {
            drawDetections(features);
            canvas.style.opacity = 1;
        }, 100);
    }
    
    currentFrame = (currentFrame % 5) + 1;
    setTimeout(loop, 1500);
}

loop();
resize();
