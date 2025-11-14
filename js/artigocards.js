const API_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://angorge-1.onrender.com";



document.addEventListener('DOMContentLoaded', () => {
    const containerArtigos = document.getElementById("containerArtigos");

    // Função para buscar artigos do backend
    async function carregarArtigos() {
        try {
            const response = await fetch("${API_URL}/api/artigos"); // URL do backend para artigos
            const data = await response.json();
            const artigos = data.artigos; // Backend retorna { artigos, total, page, totalPages }

            containerArtigos.innerHTML = ""; // limpa container antes de adicionar

            // Renderizar os artigos em cards
            artigos.forEach(artigo => {
                const card = document.createElement("div");
                card.classList.add("card-artigo");
                card.innerHTML = `
                <div class="card-artigo-imagem">
                    <img src="${API_URL}${artigo.imagem || '/uploads/default.jpg'}" alt="${artigo.titulo}">
                </div>
                <div class="card-artigo-conteudo">
                    <div class="card-artigo-categoria">${artigo.categoria || "Sem categoria"}</div>
                    <h3 class="card-artigo-titulo">${artigo.titulo}</h3>
                    <p class="card-artigo-descricao">${artigo.descricao}</p>
                    <div class="card-artigo-rodape">
                        <span class="card-artigo-data">
                            ${new Date(artigo.dataPublicacao).toLocaleDateString('pt-PT')}
                        </span>
                        <span class="card-artigo-autor">${artigo.autor || "Anónimo"}</span>
                        <a href="artigoDetalhe.html?id=${artigo._id}" class="card-artigo-link">Veja mais →</a>
                    </div>
                </div>
            `;
                containerArtigos.appendChild(card);
            });
        } catch (error) {
            console.error("Erro ao carregar artigos:", error);
            containerArtigos.innerHTML = "<p>Não foi possível carregar os artigos.</p>";
        }
    }

    // Chama a função ao carregar a página
    carregarArtigos();
});