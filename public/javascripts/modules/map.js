import axios from 'axios';
import { $ } from './bling';
// import {$} from ''
const mapOptions = {
  center: { lat: 43.2, lng: -79.8 },
  zoom: 10,
};

function loadPlaces(map, lat = 43.2, lng = -79.8) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then((res) => {
      const places = res.data;
      if (!places.length) {
        alert('No Place Found');
      }
      const bounds = new google.maps.LatLngBounds();

      const markers = places.map((place) => {
        // assign latlong from database
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        // make the marker in the map
        const marker = new google.maps.Marker({ map, position });
        marker.place = place; // for link
        return markers;
      });
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    });
}

function makeMap(mapDiv) {
  // if the div with ID = map is not found in the page, stop the function
  if (!mapDiv) return;
  // render the map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);
  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
}

export default makeMap;
