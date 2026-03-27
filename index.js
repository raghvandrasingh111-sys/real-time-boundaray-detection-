const canvas = document.getElementById('detection-canvas');
const ctx = canvas.getContext('2d');
const mapContainer = document.getElementById('map-container');

// State
let currentFrame = 1;

// Resize canvas to match map container
function resize() {
    const parent = document.getElementById('map-parent');
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

function drawDetections(data) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    data.forEach((field, index) => {
        const points = mapCoords(field.coords);
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
        ctx.setLineDash([8, 4]); // Dashed line like the user's SVG
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // Label
        ctx.font = 'bold 10px Inter';
        ctx.fillStyle = '#39ff14';
        ctx.fillText(field.id.toUpperCase(), points[0].x, points[0].y - 10);
    });
}

function updateUI(data, frame) {
    const list = document.getElementById('detections-list');
    list.innerHTML = '';
    
    data.forEach(field => {
        const item = document.createElement('div');
        item.className = `flex items-center gap-4 px-6 py-4 text-[#baccb0] hover:text-[#e2e3e0] hover:bg-[#333534]/50 border-r-2 border-transparent transition-all cursor-pointer`;
        item.innerHTML = `
            <span class="material-symbols-outlined text-sm">radar</span>
            <div class="flex flex-col">
                <span class="font-['Inter'] uppercase tracking-widest text-[10px] text-white font-black">${field.id}</span>
                <span class="text-[9px] text-[#baccb0]">${field.area_ha} ha | Conf: ${(field.confidence * 100).toFixed(1)}%</span>
            </div>
        `;
        list.appendChild(item);
    });

    document.getElementById('cpu-stat').textContent = `${Math.floor(20 + Math.random() * 15)}%`;
    document.getElementById('latency-stat').textContent = `${Math.floor(40 + Math.random() * 10)}ms`;
}

async function fetchDetection(frame) {
    try {
        const response = await fetch(`detections_frame_${frame}.json`);
        return await response.json();
    } catch (e) {
        console.error("Error fetching frame:", e);
        return null;
    }
}

async function loop() {
    const data = await fetchDetection(currentFrame);
    if (data) {
        updateUI(data, currentFrame);
        
        // Soft fade
        canvas.style.opacity = 0.5;
        setTimeout(() => {
            drawDetections(data);
            canvas.style.opacity = 1;
        }, 100);
    }
    
    currentFrame = (currentFrame % 5) + 1;
    setTimeout(loop, 1500);
}

loop();
resize();
