const API_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://angorge-1.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    const containerArtigos = document.getElementById("containerArtigos");

    if (!containerArtigos) {
        console.error("❌ Não encontrei #containerArtigos no DOM");
        return;
    }

    async function carregarArtigos() {
        try {
            const response = await fetch(`${API_URL}/api/artigos`);
            const data = await response.json();
            const artigos = data.artigos;

            containerArtigos.innerHTML = ""; // limpa container

            artigos.forEach(artigo => {
                if (!artigo._id) return;

                const card = document.createElement("div");
                card.classList.add("card-artigo");
                card.innerHTML = `
                    <div class="card-artigo-imagem">
                        <img src="${API_URL}${artigo.imagem || '/uploads/default.jpg'}" alt="${artigo.titulo}">
                    </div>
                    <div class="card-artigo-conteudo">
                        <h3>${artigo.titulo}</h3>
                        <p>${artigo.descricao}</p>
                        <a href="artigo-detalhe.html?id=${encodeURIComponent(artigo._id)}">Leia Mais</a>
                    </div>
                `;
                containerArtigos.appendChild(card);
            });
        } catch (error) {
            console.error("Erro ao carregar artigos:", error);
            containerArtigos.innerHTML = "<p>Não foi possível carregar os artigos.</p>";
        }
    }

    carregarArtigos();
});
