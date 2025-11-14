
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
            const artigos = data.artigos || []; // ← agora é 'artigos'

            containerArtigos.innerHTML = ""; // limpa o container

            artigos.forEach(artigo => {
                if (!artigo._id) return;

                // Verifica se a data é válida
                const dataFormatada = artigo.dataPublicacao
                    ? new Date(artigo.dataPublicacao).toLocaleDateString('pt-PT')
                    : 'Data não disponível';

                const card = document.createElement("div");
                card.classList.add("card-artigo");
                card.innerHTML = `
                    <div class="card-artigo-imagem">
                        <img src="${API_URL}${artigo.imagem || '/uploads/default.jpg'}" alt="${artigo.titulo}">
                    </div>
                    <div class="card-artigo-conteudo">
                        <span class="card-artigo-categoria">${artigo.categoria || 'Sem categoria'}</span>
                        <h3 class="card-artigo-titulo">${artigo.titulo}</h3>
                        <p class="card-artigo-descricao">${artigo.descricao}</p>
                        <a class="card-artigo-link" href="artigodetalhe.html?id=${encodeURIComponent(artigo._id)}">Veja mais</a>
                    </div>
                    <div class="card-artigo-rodape">
                        <span class="card-artigo-autor">${artigo.autor || 'Autor desconhecido'}</span>
                        <span class="card-artigo-data">${dataFormatada}</span>
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
