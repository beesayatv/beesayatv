(function (window) {
    'use strict';

    var assetUrl = window.beesayatvCebuMapAssetUrl;

    if (!assetUrl || !window.L || !window.maplibregl || !window.pmtiles) {
        return;
    }

    var protocol = new window.pmtiles.Protocol();
    window.maplibregl.addProtocol('pmtiles', protocol.tile);

    window.beesayatvCebuBasemap = {
        add: function (leafletMap) {
            return window.L.maplibreGL({
                interactive: false,
                style: {
                    version: 8,
                    sources: {
                        cebu: {
                            type: 'vector',
                            url: 'pmtiles://' + assetUrl + '/cebu-compact.pmtiles',
                            attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
                        }
                    },
                    layers: [
                        { id: 'background', type: 'background', paint: { 'background-color': '#f4f1e8' } },
                        { id: 'landcover', type: 'fill', source: 'cebu', 'source-layer': 'landcover', paint: { 'fill-color': ['match', ['get', 'kind'], 'forest', '#b8ceb0', 'wood', '#b8ceb0', 'farmland', '#e1ddae', 'grass', '#cbdcaf', 'meadow', '#cbdcaf', 'residential', '#e8e2d4', 'commercial', '#e4d9ca', 'industrial', '#ddd3c6', 'park', '#bed7b5', '#e5e1d3'], 'fill-opacity': 0.88 } },
                        { id: 'water', type: 'fill', source: 'cebu', 'source-layer': 'water', paint: { 'fill-color': '#b9dbe1' } },
                        { id: 'waterway', type: 'line', source: 'cebu', 'source-layer': 'waterway', paint: { 'line-color': '#8bc4d0', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 15, 2] } },
                        { id: 'buildings', type: 'fill', source: 'cebu', 'source-layer': 'buildings', minzoom: 14, paint: { 'fill-color': '#d6cec0', 'fill-outline-color': '#c9c0b2', 'fill-opacity': 0.72 } },
                        { id: 'roads-casing', type: 'line', source: 'cebu', 'source-layer': 'roads', filter: ['!', ['match', ['get', 'class'], ['track', 'path', 'footway', 'steps'], true, false]], paint: { 'line-color': '#a99f90', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.7, 12, 2.8, 16, 7], 'line-opacity': 0.72 } },
                        { id: 'roads', type: 'line', source: 'cebu', 'source-layer': 'roads', filter: ['!', ['match', ['get', 'class'], ['track', 'path', 'footway', 'steps'], true, false]], paint: { 'line-color': ['match', ['get', 'class'], 'trunk', '#f2c875', 'primary', '#f6d99a', 'secondary', '#fff9ee', 'tertiary', '#fffdf6', '#fffdf8'], 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 12, 2, 16, 5.5], 'line-opacity': 0.98 } },
                        { id: 'trails', type: 'line', source: 'cebu', 'source-layer': 'roads', filter: ['match', ['get', 'class'], ['path', 'footway', 'track', 'steps'], true, false], paint: { 'line-color': '#8a7453', 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.6, 16, 2.1], 'line-dasharray': [1.2, 1.2] } },
                        { id: 'poi', type: 'circle', source: 'cebu', 'source-layer': 'pois', minzoom: 13, paint: { 'circle-radius': 3, 'circle-color': '#416a5c', 'circle-stroke-color': '#fffdf7', 'circle-stroke-width': 1 } }
                    ]
                }
            }).addTo(leafletMap);
        }
    };
}(window));
