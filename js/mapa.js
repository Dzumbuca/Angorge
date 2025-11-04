// Criar mapa
var map = L.map('mapa');

// Tiles azulados claros
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; Stadia Maps, &copy; OpenStreetMap contributors'
}).addTo(map);

// Marcador azul personalizado
var customIcon = L.divIcon({
    className: "custom-marker",
    html: `<svg width="24" height="24" viewBox="0 0 24 24">
             <circle cx="12" cy="12" r="10" fill="#007bb5" />
           </svg>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

// Endereço 1: Luanda - Camama
var luanda = L.marker([-8.889086407762266, 13.258745720225490], { icon: customIcon })
    .bindPopup("<b>Luanda</b><br>Camama, Sala 705<br>Junto às Bombas da Total")
    .addTo(map);

// Endereço 2: Malanje
var malanje = L.marker([-9.523851113490093, 16.36174061324447], { icon: customIcon })
    .bindPopup("<b>Malanje</b><br>Centro Comercial do Hotel Palanca<br>Loja 11")
    .addTo(map);

// Ajusta o mapa para mostrar os dois pontos de forma otimizada
var group = L.featureGroup([luanda, malanje]);
map.fitBounds(group.getBounds(), { padding: [50, 50] }); // padding para não ficar colado nas bordas
