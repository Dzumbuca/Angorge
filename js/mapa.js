var map = L.map('mapa').setView([-8.839, 13.234], 13);

// Tiles azulados claros
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; Stadia Maps, &copy; OpenStreetMap contributors'
}).addTo(map);

// Marcador vermelho
var customIcon = L.divIcon({
    className: "custom-marker",
    html: `<svg width="24" height="24" viewBox="0 0 24 24">
             <circle cx="12" cy="12" r="10" fill="#007bb5" />
           </svg>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

L.marker([-8.839, 13.234], { icon: customIcon }).addTo(map);


L.marker([-8.839, 13.234], { icon: redIcon }).addTo(map).bindPopup("Local 1");
