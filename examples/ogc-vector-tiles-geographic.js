import MVT from '../src/ol/format/MVT.js';
import Map from '../src/ol/Map.js';
import OGCVectorTile from '../src/ol/source/OGCVectorTile.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import TileLayer from '../src/ol/layer/Tile.js';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new XYZ({
        attributions:
          'Tiles &copy; Esri &mdash; National Geographic, Esri, ' +
          'DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
        url:
          'https://server.arcgisonline.com/ArcGIS/rest/services/' +
          'NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
      })
}),
    new VectorTileLayer({
      source: new OGCVectorTile({
        //url: 'https://maps.gnosis.earth/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WorldCRS84Quad',
        url: 'https://demo.pygeoapi.io/master/collections/lakes/tiles/WorldCRS84Quad',
        //url: 'https://emotional.byteroad.net/collections/hex350_grid_cardio_1920/tiles/WorldCRS84Quad',
        format: new MVT(),
        projection: 'EPSG:4326',
      }) ,
      /* background: '#d1d1d1',*/
      style: {
        'stroke-width': 0.6,
        'stroke-color': 'red',
        'fill-color': 'black',
      }, 
    }),
  ],
  view: new View({
    center: [-0.260765354541958,51.409628133733456],
    zoom: 7,
    projection: 'EPSG:4326',
  }),
});
