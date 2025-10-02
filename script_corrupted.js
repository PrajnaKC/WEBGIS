// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAMAp2xDXp9        // Add default layer (Google Satellite)
        googleSatellite.addTo(map);
        console.log('Google Maps satellite layer loaded as default');

        // Create layer groups
        const baseMaps = {
            "🛰️ Google Satellite": googleSatellite,
            "🗺️ Google Hybrid": googleHybrid,
            "🛣️ Google Streets": googleStreets,
            "🏔️ Google Terrain": googleTerrain,
            "📍 OpenStreetMap (Fallback)": osmLayer
        };cueAB2y3v4Ao';

// Global variables
let map;
let googleMap;
let isGoogleMapsMode = false;

// Google Maps initialization callback
function initGoogleMap() {
    console.log('Google Maps API loaded successfully');
    // Initialize with Leaflet first, then add Google Maps toggle
    initLeafletMap();
}

// Initialize Leaflet map with Google Maps integration
function initLeafletMap() {
    console.log('Initializing with Google Maps tiles...');
    
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet library not loaded!');
        document.getElementById('map').innerHTML = '<p style="text-align: center; padding: 50px;">Error: Leaflet library failed to load.</p>';
        return;
    }
    
    try {
        const villageCenter = [12.9716, 77.5946];
        const mapZoom = 15;

        map = L.map('map').setView(villageCenter, mapZoom);
        console.log('Map initialized - switching to Google Maps satellite view');

        // Google Maps layers using your API key - Fixed URLs
        const googleSatellite = L.tileLayer('https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 22,
            attribution: '© Google Maps',
            name: 'Google Satellite',
            subdomains: ['0', '1', '2', '3']
        });

        const googleHybrid = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            maxZoom: 22,
            attribution: '© Google Maps',
            name: 'Google Hybrid',
            subdomains: ['0', '1', '2', '3']
        });

        const googleStreets = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 22,
            attribution: '© Google Maps',
            name: 'Google Streets',
            subdomains: ['0', '1', '2', '3']
        });

        const googleTerrain = L.tileLayer('https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
            maxZoom: 22,
            attribution: '© Google Maps',
            name: 'Google Terrain',
            subdomains: ['0', '1', '2', '3']
        });

        // Fallback layers
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors',
            name: 'OpenStreetMap'
        });

        // Add default layer (Google Satellite)
        googleSatellite.addTo(map);

        // Create layer groups
        const baseMaps = {
            "�️ Google Satellite": googleSatellite,
            "�️ Google Hybrid": googleHybrid,
            "🛣️ Google Streets": googleStreets,
            "🏔️ Google Terrain": googleTerrain,
            "🗺️ OpenStreetMap": osmLayer
        };

        // Add layer control
        const layerControl = L.control.layers(baseMaps, {}, {
            position: 'topright',
            collapsed: false
        }).addTo(map);

        // Add Google Maps native mode toggle
        const googleMapsToggle = L.Control.extend({
            options: {
                position: 'topleft'
            },
            onAdd: function (map) {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
                container.style.backgroundColor = 'white';
                container.style.width = '40px';
                container.style.height = '40px';
                container.style.cursor = 'pointer';
                container.innerHTML = '�️';
                container.style.fontSize = '20px';
                container.style.textAlign = 'center';
                container.style.lineHeight = '40px';
                container.title = 'Switch to Native Google Maps';
                
                container.onclick = function(){
                    toggleGoogleMapsMode();
                }
                
                return container;
            }
        });

        map.addControl(new googleMapsToggle());

        console.log('Google Maps layers and controls added');

        // Add a marker to show the center
        L.marker(villageCenter)
            .addTo(map)
            .bindPopup('🏘️ Village Center<br>�️ Powered by Google Maps API!')
            .openPopup();

        // Load GeoJSON data
        loadGeoJSONData();

    } catch (error) {
        console.error('Error initializing map:', error);
        document.getElementById('map').innerHTML = `<p style="text-align: center; padding: 50px; color: red;">Error: ${error.message}</p>`;
    }
}

// Toggle between Leaflet and native Google Maps
function toggleGoogleMapsMode() {
    const mapContainer = document.getElementById('map');
    
    if (!isGoogleMapsMode) {
        // Switch to native Google Maps
        mapContainer.innerHTML = '<div id="google-map" style="width: 100%; height: 100%;"></div>';
        
        googleMap = new google.maps.Map(document.getElementById('google-map'), {
            center: { lat: 12.9716, lng: 77.5946 },
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.SATELLITE,
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_CENTER,
                mapTypeIds: [
                    google.maps.MapTypeId.ROADMAP,
                    google.maps.MapTypeId.SATELLITE,
                    google.maps.MapTypeId.HYBRID,
                    google.maps.MapTypeId.TERRAIN
                ]
            },
            zoomControl: true,
            streetViewControl: true,
            fullscreenControl: true
        });

        // Add marker to Google Maps
        const marker = new google.maps.Marker({
            position: { lat: 12.9716, lng: 77.5946 },
            map: googleMap,
            title: 'Village Center'
        });

        const infoWindow = new google.maps.InfoWindow({
            content: '🏘️ Village Center<br>🗺️ Native Google Maps Mode!'
        });

        marker.addListener('click', () => {
            infoWindow.open(googleMap, marker);
        });

        // Load GeoJSON on Google Maps
        loadGeoJSONOnGoogleMaps();
        
        isGoogleMapsMode = true;
        console.log('Switched to native Google Maps mode');
        
    } else {
        // Switch back to Leaflet
        location.reload(); // Simple way to restore Leaflet
    }
}

// Load GeoJSON data on Leaflet
function loadGeoJSONData() {
    console.log('Attempting to load GeoJSON...');
    fetch('mygeodata_merged.geojson')
        .then(response => {
            console.log('GeoJSON fetch response:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('GeoJSON data loaded:', data);
            L.geoJSON(data, {
                style: {
                    color: '#4285f4',
                    weight: 3,
                    fillOpacity: 0.3,
                    fillColor: '#4285f4'
                },
                onEachFeature: function (feature, layer) {
                    let popupContent = '<h4>🏞️ Land Plot Details</h4>';
                    if (feature.properties) {
                        Object.keys(feature.properties).forEach(key => {
                            popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
                        });
                    }
                    popupContent += '<hr><small>�️ Powered by Google Maps API</small>';
                    layer.bindPopup(popupContent);
                }
            }).addTo(map);
            console.log('GeoJSON layer added to map');
        })
        .catch(error => {
            console.error('Error loading GeoJSON:', error);
            L.popup()
                .setLatLng([12.9716, 77.5946])
                .setContent('📍 Land plot data not found.<br>�️ Google Maps is active.')
                .openOn(map);
        });
}

// Load GeoJSON data on Google Maps
function loadGeoJSONOnGoogleMaps() {
    fetch('mygeodata_merged.geojson')
        .then(response => response.json())
        .then(data => {
            googleMap.data.addGeoJson(data);
            
            googleMap.data.setStyle({
                fillColor: '#4285f4',
                strokeColor: '#4285f4',
                strokeWeight: 3,
                fillOpacity: 0.3
            });

            googleMap.data.addListener('click', function(event) {
                let content = '<h4>🏞️ Land Plot Details</h4>';
                event.feature.forEachProperty(function(value, name) {
                    content += `<strong>${name}:</strong> ${value}<br>`;
                });
                content += '<hr><small>🗺️ Native Google Maps</small>';
                
                const infoWindow = new google.maps.InfoWindow({
                    content: content,
                    position: event.latLng
                });
                infoWindow.open(googleMap);
            });
            
            console.log('GeoJSON loaded on Google Maps');
        })
        .catch(error => {
            console.error('Error loading GeoJSON on Google Maps:', error);
        });
}

// Wait for the page to load completely
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, waiting for Google Maps API...');
    
    // If Google Maps API is already loaded, initialize immediately
    if (typeof google !== 'undefined' && google.maps) {
        initGoogleMap();
    }
    // Otherwise, initGoogleMap will be called by the API callback
});