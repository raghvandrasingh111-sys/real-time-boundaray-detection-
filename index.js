const canvas = document.getElementById('detection-canvas');
const ctx = canvas.getContext('2d');
const fieldList = document.getElementById('field-list');

// Metrics elements
const statLatency = document.getElementById('stat-latency');
const statConf = document.getElementById('stat-conf');
const statFrame = document.getElementById('stat-frame');

let currentFrame = 1;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// Mock mapping from GeoJSON coords to screen coords
function mapCoords(coords) {
    const centerX = 12.45;
    const centerY = 45.15; // Adjusted to align with the new tile features
    const scale = 1200; // Lower scale means smaller polygons, fitting the fields better
    
    return coords.map(p => ({
        x: canvas.width / 2 + (p[0] - centerX) * scale,
        y: canvas.height / 2 - (p[1] - centerY) * scale
    }));
}

async function fetchDetection(frame) {
    try {
        const response = await fetch(`detections_frame_${frame}.json`);
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        return null;
    }
}

function updateUI(data, frameNum) {
    if (!data) return;
    
    statFrame.innerText = frameNum;
    statLatency.innerText = (45 + Math.random() * 5).toFixed(1) + ' ms';
    
    // Calculate average confidence
    const avgConf = data.features.reduce((acc, f) => acc + f.properties.confidence, 0) / data.features.length;
    statConf.innerText = (avgConf * 100).toFixed(0) + '%';
    
    // Update List
    fieldList.innerHTML = '';
    data.features.forEach(f => {
        const div = document.createElement('div');
        div.className = 'detection-card';
        div.innerHTML = `
            <div class="field-id">${f.properties.id.toUpperCase()}</div>
            <div class="field-meta">Area: ${f.properties.area} ha | Conf: ${(f.properties.confidence * 100).toFixed(1)}%</div>
        `;
        fieldList.appendChild(div);
    });
}

function drawDetections(data) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!data) return;
    
    data.features.forEach(feature => {
        const points = mapCoords(feature.geometry.coordinates[0]);
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#39ff14';
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Fill
        ctx.fillStyle = 'rgba(57, 255, 20, 0.1)';
        ctx.fill();
        
        // ID label
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#39ff14';
        ctx.font = 'bold 12px Inter';
        ctx.fillText(feature.properties.id.toUpperCase(), points[0].x, points[0].y - 10);
    });
}

async function loop() {
    const data = await fetchDetection(currentFrame);
    if (data) {
        updateUI(data, currentFrame);
        // Add a small fade effect between frames
        canvas.style.opacity = 0.5;
        setTimeout(() => {
            drawDetections(data);
            canvas.style.opacity = 1;
        }, 100);
    }
    
    currentFrame = (currentFrame % 5) + 1;
    setTimeout(loop, 1200); // Faster polling for better "real-time" feel
}

// Initial draw a background grid removed to prevent CSS override
// loop() handles the detection cycle
loop();
