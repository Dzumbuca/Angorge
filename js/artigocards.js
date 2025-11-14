const API_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://angorge-1.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    const containerCursos = document.getElementById("containerCursos");

    async function carregarCursos() {
        try {
            const response = await fetch(`${API_URL}/api/cursos`);
            const data = await response.json();
            const cursos = data.cursos; // espera que o backend retorne { cursos, total, ... }

            containerCursos.innerHTML = ""; // limpa container

            cursos.forEach(curso => {
                // Só renderiza cursos que têm _id
                if (!curso._id) return;

                const card = document.createElement("div");
                card.classList.add("card-curso");
                card.innerHTML = `
                    <div class="card-curso-imagem">
                        <img src="${API_URL}${curso.imagem || '/uploads/default.jpg'}" alt="${curso.titulo}">
                    </div>
                    <div class="card-curso-conteudo">
                        <div class="card-curso-categoria">${curso.categoria || ''}</div>
                        <div class="card-curso-tipo">${curso.tipo || ''}</div>
                        <h3 class="card-curso-titulo">${curso.titulo}</h3>
                        <p class="card-curso-descricao">${curso.descricao || ''}</p>
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

    carregarCursos();
});
