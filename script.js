// Google Maps API Integration - Native Google as default, Leaflet fallback
console.log('Initializing Google Maps integration...');

// Global state
let googleMap;          // Native Google Map instance
let leafletMap;         // Leaflet fallback / alternative instance
let leafletLayerGroup;  // Layer group for GeoJSON in Leaflet
let googleDataLayerLoaded = false;
let lastGeoJSON;        // Cache loaded GeoJSON for reuse across modes

const CENTER = { lat: 12.9716, lng: 77.5946 };
const DEFAULT_ZOOM = 15;

// -------- Status Panel Helpers --------
function updateStatus(partial = {}) {
    const modeEl = document.getElementById('status-mode');
    const featEl = document.getElementById('status-features');
    const fbEl = document.getElementById('status-fallback');
    const msgEl = document.getElementById('status-message');
    if (partial.mode && modeEl) modeEl.textContent = partial.mode;
    if (typeof partial.features === 'number' && featEl) featEl.textContent = partial.features;
    if (typeof partial.fallback === 'boolean' && fbEl) fbEl.textContent = partial.fallback ? 'Yes' : 'No';
    if (partial.message && msgEl) msgEl.textContent = partial.message;
}
updateStatus({ mode: 'Starting…', features: 0, fallback: false, message: 'Initializing Google Maps…' });

// Sentinels to confirm script execution
window.__APP_SCRIPT_LOADED = true;
window.__APP_SCRIPT_VERSION = '1.0.1-callback-hardening';

// Entry point (callback from Maps JS API)
window.initGoogleMap = function() {
    try {
        const container = document.getElementById('map');
        container.innerHTML = '<div id="google-map" style="width:100%;height:100%;"></div>';
        googleMap = new google.maps.Map(document.getElementById('google-map'), {
            center: CENTER,
            zoom: DEFAULT_ZOOM,
            mapTypeId: google.maps.MapTypeId.SATELLITE,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
        });

        const marker = new google.maps.Marker({ position: CENTER, map: googleMap, title: 'Village Center' });
        const infoWindow = new google.maps.InfoWindow({
            content: '<h4>✅ Google Maps Active</h4><p>Native Google Maps is the default view.</p>'
        });
        marker.addListener('click', () => infoWindow.open(googleMap, marker));

        addModeToggleButton();
        loadGeoJSON(); // Will populate native map; caches for Leaflet later
        updateStatus({ mode: 'Google (Native)', fallback: false, message: 'Google Maps ready.' });
        console.log('✅ Native Google Maps initialized as default.');
    } catch (err) {
        console.error('Failed to initialize Google Maps, falling back to Leaflet:', err);
        initLeafletFallback();
    }
};

// Add a simple floating control to toggle to Leaflet fallback
function addModeToggleButton() {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.top = '10px';
    div.style.left = '10px';
    div.style.zIndex = '9999';
    div.innerHTML = '<button id="toggleLeaflet" style="background:#1a73e8;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;font-size:12px;box-shadow:0 1px 4px rgba(0,0,0,0.3);">Switch to Leaflet</button>';
    document.body.appendChild(div);
    document.getElementById('toggleLeaflet').addEventListener('click', switchToLeaflet);
}

// Switch from native Google to Leaflet fallback
function switchToLeaflet() {
    if (leafletMap) {
        console.log('Leaflet already initialized.');
        return;
    }
    console.log('Switching to Leaflet fallback...');
    updateStatus({ mode: 'Switching…', message: 'Creating Leaflet map…' });
    initLeafletFallback();
}

// Initialize Leaflet (without unauthorized Google tile scraping)
function initLeafletFallback() {
    if (typeof L === 'undefined') {
        console.error('Leaflet library not available for fallback.');
        return;
    }
    const mapDiv = document.getElementById('map');
    mapDiv.innerHTML = '<div id="leaflet-map" style="width:100%;height:100%;"></div>';
    leafletMap = L.map('leaflet-map').setView([CENTER.lat, CENTER.lng], DEFAULT_ZOOM);

    // Compliant basemap (Esri World Imagery) + OSM
    const esriWorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri & contributors'
    }).addTo(leafletMap);
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    });

    L.control.layers({ '�️ Esri World Imagery': esriWorldImagery, '🗺️ OpenStreetMap': osm }).addTo(leafletMap);

    leafletLayerGroup = L.layerGroup().addTo(leafletMap);
    L.marker([CENTER.lat, CENTER.lng]).addTo(leafletMap).bindPopup('Leaflet Fallback Active').openPopup();

    if (lastGeoJSON) {
        addGeoJSONToLeaflet(lastGeoJSON);
    }
    updateStatus({ mode: 'Leaflet (Fallback)', fallback: true, message: 'Leaflet map active.' });
}

// Load GeoJSON (shared for both modes) with fallback filenames & HTML detection
function loadGeoJSON() {
    const CANDIDATES = [
        'mygeodata_merged.geojson',
        'village_plots.geojson',
        'village_plots.json',
        'plots.geojson',
        'data.geojson'
    ];

    let tried = [];

    function tryNext() {
        if (!CANDIDATES.length) {
            updateStatus({ message: 'No GeoJSON file found', features: 0 });
            console.warn('All GeoJSON candidates failed. Tried:', tried.join(', '));
            return;
        }
        const file = CANDIDATES.shift();
        tried.push(file);
        updateStatus({ message: `Trying ${file}...` });
        fetch(file)
            .then(async r => {
                if (!r.ok) {
                    throw new Error(r.status + ' ' + r.statusText);
                }
                const text = await r.text();
                if (text.trim().startsWith('<')) {
                    // Probably an HTML error / index fallback
                    throw new Error('Received HTML instead of JSON for ' + file);
                }
                try {
                    const json = JSON.parse(text);
                    return json;
                } catch (parseErr) {
                    throw new Error('JSON parse error in ' + file + ': ' + parseErr.message);
                }
            })
            .then(data => {
                lastGeoJSON = data; // cache
                addGeoJSONToGoogle(data);
                updateStatus({ features: data.features ? data.features.length : 0, message: `Loaded ${file}` });
                console.log('Loaded GeoJSON from', file);
            })
            .catch(err => {
                console.warn('Failed loading', file, '-', err.message);
                tryNext();
            });
    }

    tryNext();
}

// Add GeoJSON to native Google Maps
function addGeoJSONToGoogle(geojson) {
    if (!googleMap) return;
    if (googleDataLayerLoaded) return; // avoid duplicates
    googleMap.data.addGeoJson(geojson);
    googleMap.data.setStyle(f => ({
        fillColor: '#d81b60',
        strokeColor: '#880e4f',
        strokeWeight: 2,
        fillOpacity: 0.35
    }));
    googleMap.data.addListener('click', e => {
        let html = '<div style="font-size:12px">';
        e.feature.forEachProperty((v, k) => html += `<strong>${k}</strong>: ${v}<br>`);
        html += '</div>';
        new google.maps.InfoWindow({ content: html, position: e.latLng }).open(googleMap);
    });
    googleDataLayerLoaded = true;
    console.log('GeoJSON added to Google Maps data layer.');
}

// Add GeoJSON to Leaflet fallback
function addGeoJSONToLeaflet(geojson) {
    if (!leafletMap) return;
    leafletLayerGroup.clearLayers();
    const layer = L.geoJSON(geojson, {
        style: { color: '#d81b60', weight: 2, fillOpacity: 0.35 },
        onEachFeature: (feature, lyr) => {
            let popup = '<h4>Feature</h4>';
            if (feature.properties) {
                Object.entries(feature.properties).forEach(([k, v]) => popup += `<strong>${k}</strong>: ${v}<br>`);
            }
            lyr.bindPopup(popup);
        }
    }).addTo(leafletLayerGroup);
    try { leafletMap.fitBounds(layer.getBounds(), { padding: [20, 20] }); } catch (_) {}
    console.log('GeoJSON added to Leaflet fallback.');
    const featureCount = geojson.features ? geojson.features.length : 0;
    updateStatus({ features: featureCount, message: `Features loaded in Leaflet (${featureCount}).` });
}

// Error handling for Google Maps API auth failure
window.gm_authFailure = function() {
    console.error('❌ Google Maps API authentication failed. Falling back to Leaflet.');
    initLeafletFallback();
    updateStatus({ mode: 'Leaflet (Fallback)', fallback: true, message: 'Google auth failed; using Leaflet.' });
};

console.log('Script loaded. Awaiting Google Maps API callback...');

// Poller fallback: if callback not invoked but API present, initialize manually
let pollAttempts = 0;
const pollInterval = setInterval(() => {
    if (googleMap) { clearInterval(pollInterval); return; }
    if (typeof google !== 'undefined' && google.maps && typeof window.initGoogleMap === 'function') {
        console.warn('Callback not fired automatically; invoking initGoogleMap manually.');
        try { window.initGoogleMap(); } catch(e){ console.error('Manual init failed:', e); }
        clearInterval(pollInterval);
    }
    if (++pollAttempts > 10) { // ~5s if 500ms interval
        clearInterval(pollInterval);
    }
}, 500);

// Watchdog: if after 5s googleMap not created, notify user
setTimeout(() => {
    if (!googleMap) {
        console.warn('Google Maps not initialized within expected time.');
        updateStatus({ mode: 'Pending...', message: 'Still waiting for Google Maps API…', fallback: false });
    }
}, 5000);