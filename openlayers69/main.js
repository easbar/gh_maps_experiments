import 'ol/ol.css';
import MVT from 'ol/format/MVT';
import MapboxVectorLayer from 'ol/layer/MapboxVector';
import {Map, View} from 'ol';
import {fromLonLat} from 'ol/proj';

import olms from 'ol-mapbox-style';


//const map = new Map({
//  target: 'map-container',
//  view: new View({
//    center: fromLonLat([0, 0]),
//    zoom: 2,
//  }),
//});


//const layer = new MapboxVectorLayer({
//  styleUrl: 'https://api.maptiler.com/maps/1f566542-c726-4cc5-8f2d-2309b90083db/style.json?key=wYonyRi2hNgJVH2qgs81',
  // or, instead of the above, try
  // styleUrl: 'mapbox://styles/mapbox/bright-v9',
  // accessToken: 'Your token from https://mapbox.com/'
//});
//map.addLayer(layer);


olms(
  'map-container',
  'https://api.maptiler.com/maps/1f566542-c726-4cc5-8f2d-2309b90083db/style.json?key=wYonyRi2hNgJVH2qgs81'
);