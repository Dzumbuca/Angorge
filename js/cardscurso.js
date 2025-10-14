document.addEventListener('DOMContentLoaded', () => {
    const containerCursos = document.getElementById("containerCursos");

    // Função para buscar cursos do backend
    async function carregarCursos() {
        try {
            const response = await fetch("http://localhost:5000/api/cursos"); // URL do backend
            const data = await response.json();
            const cursos = data.cursos; // Backend retorna { cursos, total, page, totalPages }

            containerCursos.innerHTML = ""; // limpa container antes de adicionar

            cursos.forEach(curso => {
                console.log("Curso:", curso); // 👈 Isso vai mostrar cada curso no console

                // Verifica se o curso tem _id
                if (!curso._id) {
                    console.warn("⚠️ Curso sem _id:", curso.titulo || "Sem título");
                    return; // pula este curso
                }

                const card = document.createElement("div");
                card.classList.add("card-curso");
                card.innerHTML = `
        <div class="card-curso-imagem">
           <img src="http://localhost:5000${curso.imagem}" alt="${curso.titulo}">
        </div>
        <div class="card-curso-conteudo">
            <div class="card-curso-categoria">${curso.categoria || ''}</div>
            <div class="card-curso-tipo">${curso.tipo || ''}</div>
            <h3 class="card-curso-titulo">${curso.titulo}</h3>
            <p class="card-curso-descricao">${curso.descricao}</p>
            <div class="card-curso-rodape">
                <span class="card-curso-duracao">${curso.duracao || ''}h</span>
                <a href="Cursodetalhe.html?id=${encodeURIComponent(curso._id)}">Saiba Mais</a>
                <span class="card-curso-status">${curso.status || ''}</span>
            </div>
        </div>
    `;
                containerCursos.appendChild(card);
            });
        } catch (error) {
            console.error("Erro ao carregar cursos:", error);
            containerCursos.innerHTML = "<p>Não foi possível carregar os cursos.</p>";
        }
    }

    // Chama a função ao carregar a página
    carregarCursos();
});
