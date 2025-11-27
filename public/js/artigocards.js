

document.addEventListener('DOMContentLoaded', () => {
    const containerArtigos = document.getElementById("containerArtigos");
    let currentPage = 1;
    const limit = 5;
    let loading = false;
    let totalPages = Infinity;

    async function carregarArtigos(page = 1) {
        if (loading || page > totalPages) return;
        loading = true;

        try {
            const res = await fetch(`/api/artigos?page=${page}&limit=${limit}`);
            const data = await res.json();
            totalPages = data.totalPages;

            const artigos = data.artigos || [];
            artigos.forEach(artigo => {
                const dataFormatada = artigo.dataPublicacao
                    ? new Date(artigo.dataPublicacao).toLocaleDateString('pt-PT')
                    : 'Data não disponível';
                const imagemSrc = artigo.imagem
                    ? (artigo.imagem.startsWith('http') ? artigo.imagem : artigo.imagem)
                    : '/uploads/default.jpg';

                const card = document.createElement("div");
                card.classList.add("card-artigo");
                card.innerHTML = `
                    <div class="card-artigo-imagem">
                        <img src="${imagemSrc}" alt="${artigo.titulo}">
                    </div>
                    <div class="card-artigo-conteudo">
                        <span class="card-artigo-categoria">${artigo.categoria || 'Sem categoria'}</span>
                        <h3 class="card-artigo-titulo">${artigo.titulo}</h3>
                        <p class="card-artigo-descricao">${artigo.descricao}</p>
                        <a class="card-artigo-link" href="/artigo/${artigo._id}">Veja mais</a>
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
        } finally {
            loading = false;
        }
    }

    // ✅ Detecta scroll próximo do final da página
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 300) {
            currentPage++;
            carregarArtigos(currentPage);
        }
    });

    // Carrega a primeira página
    carregarArtigos(currentPage);
});
