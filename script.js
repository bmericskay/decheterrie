const map = new maplibregl.Map({
  container: 'map',
  style: 'https://geoserveis.icgc.cat/contextmaps/positron.json',
  center: [-1.67, 48.11],
  zoom: 10.5
});

map.on('load', () => {
 
  fetch('https://data.rennesmetropole.fr/api/explore/v2.1/catalog/datasets/decheteries_plateformes_vegetaux/exports/geojson?lang=fr&timezone=Europe%2FBerlin')
    .then(response => response.json())
    .then(data => {
      // Add the GeoJSON data as a source to the map
      map.addSource('places', {
        type: 'geojson',
        data: data
      });

      // Add markers and location list using fetched GeoJSON data
      addMarkers(data);
      buildLocationList(data);
    })
    .catch(error => {
      console.error('Error fetching GeoJSON data:', error);
    });
  
    // Ajout des Communes
  map.addSource('Communes', {
    type: 'geojson',
    data: 'https://data.rennesmetropole.fr/api/explore/v2.1/catalog/datasets/limites-communales-referentielles-de-rennes-metropole-polylignes/exports/geojson'
  });

  map.addLayer({
    'id': 'Communes',
    'type': 'line',
    'source': 'Communes',
    'paint': {
      'line-color': '#223b53',
      'line-width': 1.5
    }
  });
  
  
});

/**
 * Add a marker to the map for every store listing.
 **/
function addMarkers(data) {
  /* For each feature in the GeoJSON object above: */
  for (const marker of data.features) {
    /* Create a div element for the marker. */
    const el = document.createElement('div');
    /* Assign a unique `id` to the marker. */
    el.id = `marker-${marker.properties.id}`;
    /* Assign the `marker` class to each marker for styling. */
    el.className = 'marker';

    /**
     * Create a marker using the div element
     * defined above and add it to the map.
     **/
    new maplibregl.Marker(el, { offset: [0, -23] })
      .setLngLat(marker.geometry.coordinates)
      .addTo(map);

    /**
     * Listen to the element and when it is clicked, do three things:
     * 1. Fly to the point
     * 2. Close all other popups and display popup for clicked store
     * 3. Highlight listing in sidebar (and remove highlight for all other listings)
     **/
    el.addEventListener('click', (e) => {
      /* Fly to the point */
      flyToStore(marker);
      /* Close all other popups and display popup for clicked store */
      createPopUp(marker);
      /* Highlight listing in sidebar */
      const activeItem = document.getElementsByClassName('active');
      e.stopPropagation();
      if (activeItem[0]) {
        activeItem[0].classList.remove('active');
      }
      const listing = document.getElementById(
        `listing-${marker.properties.id}`
      );
      listing.classList.add('active');
    });
  }
}

/**
 * Add a listing for each store to the sidebar.
 **/
function buildLocationList(data) {
  for (const store of data.features) {
    /* Add a new listing section to the sidebar. */
    const listings = document.getElementById('listings');
    const listing = listings.appendChild(document.createElement('div'));
    /* Assign a unique `id` to the listing. */
    listing.id = `listing-${store.properties.id}`;
    /* Assign the `item` class to each listing for styling. */
    listing.className = 'item';

    /* Add the link to the individual listing created above. */
        const link = listing.appendChild(document.createElement('a'));
    link.href = '#';
    link.className = 'title';
    link.id = `link-${store.properties.id}`;
    link.innerHTML = `${store.properties.type} > ${store.properties.nom_court}`;

    const details = listing.appendChild(document.createElement('div'));
    details.innerHTML = `${store.properties.adresse}`;

    /**
     * Listen to the element and when it is clicked, do four things:
     * 1. Update the `currentFeature` to the store associated with the clicked link
     * 2. Fly to the point
     * 3. Close all other popups and display popup for clicked store
     * 4. Highlight listing in sidebar (and remove highlight for all other listings)
     **/
    link.addEventListener('click', function () {
      for (const feature of data.features) {
        if (this.id === `link-${feature.properties.id}`) {
          flyToStore(feature);
          createPopUp(feature);
        }
      }
      const activeItem = document.getElementsByClassName('active');
      if (activeItem[0]) {
        activeItem[0].classList.remove('active');
      }
      this.parentNode.classList.add('active');
    });
  }
}

/**
 * Use Mapbox GL JS's `flyTo` to move the camera smoothly
 * a given center point.
 **/
function flyToStore(currentFeature) {
  map.flyTo({
    center: currentFeature.geometry.coordinates,
    zoom: 15
  });
}

/**
 * Create a Mapbox GL JS `Popup`.
 **/
function createPopUp(currentFeature) {
  const popUps = document.getElementsByClassName('maplibregl-popup');
  if (popUps[0]) popUps[0].remove();
  const popup = new maplibregl.Popup({ closeOnClick: false })
    .setLngLat(currentFeature.geometry.coordinates)
   .setHTML('<h3>' + currentFeature.properties.nom_court + '</h3><h4>' + currentFeature.properties.horaires + '</h4>')
    .addTo(map);
}