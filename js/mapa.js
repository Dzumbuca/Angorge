// Espera o DOM carregar
document.addEventListener("DOMContentLoaded", function () {

    // Inicializa o mapa com centro e zoom provisório
    var map = L.map('mapa').setView([-8.889086, 13.258745], 6);

    // Tiles do OpenStreetMap (100% funcionam no Netlify)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
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

    // Pontos no mapa
    var luanda = L.marker([-8.889086407762266, 13.258745720225490], { icon: customIcon })
        .bindPopup("<b>Luanda</b><br>Camama, Sala 705<br>Junto às Bombas da Total")
        .addTo(map);

    var malanje = L.marker([-9.523851113490093, 16.36174061324447], { icon: customIcon })
        .bindPopup("<b>Malanje</b><br>Centro Comercial do Hotel Palanca<br>Loja 11")
        .addTo(map);

    // Agrupa os pontos e ajusta o zoom/padding
    var group = L.featureGroup([luanda, malanje]);

    // Timeout garante que o mapa está visível antes de calcular bounds
    setTimeout(() => {
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }, 100);

});
