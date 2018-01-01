import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
  center: { lat: 43.2, lng: -79.8 },
  zoom: 10,
};

function loadPlaces(map, lat = 43.2, lng = -79.8) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then((res) => {
      const places = res.data;
      if (!places.length) {
        return;
      }
      // create a bounds
      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();

      const markers = places.map((place) => {
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({ map, position });
        marker.place = place;
        return marker;
      });

      // when someone clicks on a marker, show the details of that place
      markers.forEach(marker => marker.addListener('click', function () {
        const html = `
          <div class="popup">
            <a href="/store/${this.place.slug}">
              <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
              <p>${this.place.name} - ${this.place.location.address}</p>
            </a>
          </div>
        `;
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      }));

      // then zoom the map to fit all the markers perfectly
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    });
}

function makeMap(mapDiv) {
  if (!mapDiv) return;
  // make our map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);

  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
  });
}

export default makeMap;


// import axios from 'axios';
// import { $ } from './bling';
// // import {$} from ''
// const mapOptions = {
//   center: { lat: 43.2, lng: -79.8 },
//   zoom: 10,
// };

// function loadPlaces(map, lat = 43.2, lng = -79.8) {
//   axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
//     .then((res) => {
//       const places = res.data;
//       if (!places.length) {
//         alert('No Place Found');
//       }
//       const bounds = new google.maps.LatLngBounds();
//       const infoWindow = new google.maps.InfoWindow();

//       const markers = places.map((place) => {
//         // assign latlong from database
//         const [placeLng, placeLat] = place.location.coordinates;
//         const position = { lat: placeLat, lng: placeLng };
//         bounds.extend(position);
//         // make the marker in the map
//         const marker = new google.maps.Marker({ map, position });
//         marker.place = place; // for link
//         return markers;
//       });

//       // when user clicks a marker, show the details of that place
//       // addListener is from google maps
//       markers.forEach(marker => marker.addListener('click', function () {
//         const html = `
//           <div className="popup">
//             <a href="/store/${this.place.slug}">
//               <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}"/>
//               <p>${this.place.name} - ${this.place.location.address}</p>
//             </a>
//           </div>
//         `;
//         infoWindow.setContent(html);
//         infoWindow.open(map, this); // "this" is the marker that is
//       }));

//       map.setCenter(bounds.getCenter());
//       map.fitBounds(bounds);
//     });
// }

// function makeMap(mapDiv) {
//   // if the div with ID = map is not found in the page, stop the function
//   if (!mapDiv) return;
//   // render the map
//   const map = new google.maps.Map(mapDiv, mapOptions);
//   loadPlaces(map);
//   const input = $('[name="geolocate"]');
//   const autocomplete = new google.maps.places.Autocomplete(input);
// }

// export default makeMap;
