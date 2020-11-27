var menu = new Vue({
    el: '#menu',
    data: {
        layer: 'vector',
        showGraph: false,
        isochroneRadius: 600,
        useDeck: false
    },
    methods: {
        changeLayer: function (event) {
            this.showGraph = false;
            setGHMvtVisible(map, false);
            setLayer(map, event.target.id);
        },
        toggleGHMvt: function (event) {
            setGHMvtVisible(map, event.target.checked);
        }
    }
});
var mapTilerKey = 'yrAYvi6TTYgg9U5mBtiY';
var rasterStyle = {
    'version': 8,
    'sources': {
        'raster-tiles-source': {
            'type': 'raster',
            'tiles': [
                'https://a.tile.openstreetmap.de/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.de/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.de/{z}/{x}/{y}.png'
            ]
        }
    },
    'layers': [
        {
            'id': 'raster-tiles',
            'type': 'raster',
            'source': 'raster-tiles-source'
        }
    ]
};
var vectorStyle = 'https://api.maptiler.com/maps/basic/style.json?key=' + mapTilerKey;

var map = new mapboxgl.Map({
    container: 'map',
    style: vectorStyle,
    center: [13.4110450, 52.5214697],
    zoom: 9
});
map.on('style.load', function addGHMvt() {
    // add GraphHopper vector tiles of road network. this is also called when we change the style
    map.addSource('gh-mvt', {
        type: 'vector',
        tiles: ['http://localhost:8989/mvt/{z}/{x}/{y}.mvt?details=road_class']
    });
    map.addLayer({
        'id': 'gh',
        'type': 'line',
        'source': 'gh-mvt',
        'source-layer': 'roads',
        'paint': {
            'line-color': [
                'match',
                ['get', 'road_class'],
                'motorway', 'red',
                'primary', 'orange',
                'trunk', 'orange',
                'secondary', 'yellow',
          /*other*/ 'grey'
            ]
        },
        'layout': {
            'visibility': 'none'
        }
        // we make sure the map labels stay on top
    }, getFirstSymbolLayer(map));
});
map.on('click', function (e) {
    // fetch GraphHopper isochrone and draw on map
    var counter = 0;
    var coordinates = [];
    var radius = menu.isochroneRadius;
    Papa.parse("http://localhost:8989/spt?profile=car&point=" + e.lngLat.lat + ", " + e.lngLat.lng + "&columns=prev_longitude,prev_latitude,longitude,latitude,distance,time&time_limit=" + radius, {
        download: true,
        worker: true,
        step: function (results) {
            var d = results.data;
            // skip the first line (column names) and the second (root node)
            if (counter > 1)
                coordinates.push([[parseFloat(d[0]), parseFloat(d[1])], [parseFloat(d[2]), parseFloat(d[3])]]);
            counter++;
        },
        complete: function () {
            if (map.getLayer('isochrone-layer')) {
                map.removeLayer('isochrone-layer');
            }
            if (map.getLayer('isochrone-deck-layer')) {
                map.removeLayer('isochrone-deck-layer');
            }
            var geojson = {
                'type': 'FeatureCollection',
                'features': [
                    {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'MultiLineString',
                            'coordinates': coordinates
                        }
                    }
                ]
            };
            if (menu.useDeck) {
                var deckLayer = new deck.MapboxLayer({
                    'id': 'isochrone-deck-layer',
                    'type': deck.LineLayer,
                    'data': coordinates,
                    getSourcePosition: d => d[0],
                    getTargetPosition: d => d[1],
                    getColor: d => [0, 0, 200]
                });
                map.addLayer(deckLayer, getFirstSymbolLayer(map));
            } else {
                var source = map.getSource('isochrone');
                if (!source) {
                    map.addSource('isochrone', {
                        'type': 'geojson',
                        'data': geojson
                    });
                } else {
                    source.setData(geojson);
                }
                map.addLayer({
                    'id': 'isochrone-layer',
                    'type': 'line',
                    'source': 'isochrone',
                    'paint': {
                        'line-color': 'red'
                    }
                }, getFirstSymbolLayer(map));
            }
        },
        error: function (e) {
            console.log('error when trying to show isochrone', e);
        }
    });
});

function setLayer(map, layerId) {
    if (layerId == 'vector') {
        map.setStyle(vectorStyle);
    } else if (layerId == 'raster') {
        map.setStyle(rasterStyle);
    }
}

function setGHMvtVisible(map, visible) {
    if (visible) {
        map.setLayoutProperty('gh', 'visibility', 'visible');
    } else {
        map.setLayoutProperty('gh', 'visibility', 'none');
    }
}

function getFirstSymbolLayer(map) {
    var layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
            return layers[i].id;
        }
    }
} 
