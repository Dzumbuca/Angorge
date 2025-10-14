
let artigoIdGlobal = null;

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    // ✅ Remove qualquer '#' ou espaços do ID
    const artigoId = params.get("id")?.replace("#", "").trim();
    artigoIdGlobal = artigoId;

    if (!artigoId) {
        mostrarNotificacao("❌ Artigo não encontrado", "erro");
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/artigos/${artigoId}`);
        const artigo = await res.json();

        document.querySelector(".artigo-titulo").textContent = artigo.titulo;
        document.querySelector(".artigo-categoria").textContent = artigo.categoria || "Sem categoria";
        document.querySelector(".artigo-meta strong").textContent = artigo.autor || "Anónimo";

        document.querySelector(".artigo-meta span:nth-child(5)").textContent = artigo.dataPublicacao
            ? new Date(artigo.dataPublicacao).toLocaleDateString("pt-PT")
            : "Sem data";

        if (artigo.imagem) {
            const imagemSrc = artigo.imagem.startsWith("http")
                ? artigo.imagem
                : `http://localhost:5000${artigo.imagem}`;
            document.querySelector(".artigo-banner-image img").src = imagemSrc;
        } else {
            document.querySelector(".artigo-banner-image img").src = "uploads/default.jpg";
        }

        document.querySelector(".artigo-texto").innerHTML = artigo.descricao;

        carregarComentarios(artigoId);
        setTimeout(() => carregarNavegacao(artigoId), 100);

    } catch (error) {
        console.error(error);
        mostrarNotificacao("⚠️ Erro ao carregar o artigo", "erro");
    }
});


// ============================
// 🔹 Carregar navegação entre artigos
// ============================
async function carregarNavegacao(artigoIdAtual) {
    try {
        const res = await fetch("http://localhost:5000/api/artigos");
        const data = await res.json();

        const artigos = Array.isArray(data) ? data : (data.artigos || []);
        const publicados = artigos.filter(a => a.status === "Publicado");

        // Normaliza IDs para comparação segura
        publicados.forEach(a => {
            a.idLimpo = a._id?.$oid || a._id?._id || a._id || String(a._id);
        });

        // Ordena do mais recente para o mais antigo
        publicados.sort((a, b) => new Date(b.dataPublicacao) - new Date(a.dataPublicacao));

        // Remove caracteres inválidos do ID atual (como # ou espaços)
        const idAtualLimpo = artigoIdAtual?.replace(/[^a-zA-Z0-9]/g, "") || "";

        // Encontra o índice do artigo atual
        const indexAtual = publicados.findIndex(a => a.idLimpo === idAtualLimpo);

        if (indexAtual === -1) {
            console.warn("⚠️ Artigo atual não encontrado entre os publicados.");
            return;
        }

        const anterior = publicados[indexAtual - 1];
        const proximo = publicados[indexAtual + 1];

        const btnAnterior = document.querySelector(".btn-anterior");
        const btnProximo = document.querySelector(".btn-proximo");

        if (anterior && btnAnterior) {
            btnAnterior.href = `artigodetalhe.html?id=${encodeURIComponent(anterior.idLimpo)}`;
            btnAnterior.textContent = `← ${anterior.titulo}`;
            btnAnterior.style.display = "inline-block";
        } else if (btnAnterior) {
            btnAnterior.style.display = "none";
        }

        if (proximo && btnProximo) {
            btnProximo.href = `artigodetalhe.html?id=${encodeURIComponent(proximo.idLimpo)}`;
            btnProximo.textContent = `${proximo.titulo} →`;
            btnProximo.style.display = "inline-block";
        } else if (btnProximo) {
            btnProximo.style.display = "none";
        }

    } catch (error) {
        console.error("Erro ao carregar navegação de artigos:", error);
        mostrarNotificacao("⚠️ Erro ao carregar navegação", "erro");
    }
}

// ============================
// 🔹 Carregar comentários
// ============================
async function carregarComentarios(artigoId) {
    const container = document.querySelector(".artigo-comentarios");
    const listaExistente = container.querySelector(".lista-comentarios");
    if (listaExistente) listaExistente.remove();

    const lista = document.createElement("div");
    lista.classList.add("lista-comentarios");
    container.insertBefore(lista, container.querySelector(".comentario-form"));

    try {
        const res = await fetch(`http://localhost:5000/api/artigos/${artigoId}/comentarios`);
        const comentarios = await res.json();

        const utilizadorAtual = localStorage.getItem("user");
        const ehAdmin = localStorage.getItem("admin") === "true";

        if (!comentarios.length) {
            lista.innerHTML = `<p class="sem-comentarios">Nenhum comentário ainda. Seja o primeiro a comentar!</p>`;
            return;
        }

        comentarios.forEach(c => {
            const div = document.createElement("div");
            div.classList.add("comentario");

            div.innerHTML = `
                <div class="comentario-cabecalho">
                    <strong>${c.autor || "Anónimo"}</strong>
                    <span class="comentario-data">
                        ${c.dataComentario ? new Date(c.dataComentario).toLocaleString("pt-PT") : ""}
                    </span>
                </div>
                <p class="comentario-texto">${c.texto}</p>
            `;

            const nomesIguais = utilizadorAtual &&
                c.autor?.trim().toLowerCase() === utilizadorAtual.trim().toLowerCase();

            if (nomesIguais || ehAdmin) {
                console.log("🧩 ID do comentário recebido:", c._id);

                const btnApagar = document.createElement("button");
                btnApagar.textContent = "🗑️ Apagar";
                btnApagar.classList.add("btn-apagar");

                const comentarioId = c._id?.$oid || c._id?._id || c._id;
                console.log("🧨 artigoIdGlobal:", artigoIdGlobal, "| comentário ID:", comentarioId);

                btnApagar.addEventListener("click", () => {
                    console.log("🧨 Clicaste para apagar o comentário:", comentarioId);
                    apagarComentario(artigoIdGlobal, comentarioId);
                });

                div.appendChild(btnApagar);
            }

            // ✅ Adiciona o separador depois de tudo
            const hr = document.createElement("hr");
            div.appendChild(hr);

            lista.appendChild(div);
        });

    } catch (error) {
        console.error("Erro ao carregar comentários:", error);
        lista.innerHTML = `<p class="erro-comentarios">⚠️ Erro ao carregar comentários.</p>`;
    }
}



// ============================
// 🔹 Enviar comentário
// ============================
document.querySelector(".comentario-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const artigoId = params.get("id")?.replace("#", "").trim();

    const texto = e.target.querySelector("textarea").value.trim();
    const autor = e.target.querySelector("input[type=text]").value.trim();

    if (!texto) {
        mostrarNotificacao("⚠️ O comentário não pode estar vazio", "erro");
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/artigos/${artigoId}/comentarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texto, autor })
        });

        const data = await res.json();
        if (res.ok) {
            mostrarNotificacao("✅ Comentário enviado com sucesso!", "sucesso");
            e.target.reset();
            carregarComentarios(artigoId);
        } else {
            mostrarNotificacao("⚠️ " + (data.error || data.message), "erro");
        }
    } catch (error) {
        console.error(error);
        mostrarNotificacao("❌ Erro ao enviar comentário", "erro");
    }
});


// ============================
// 🔹 Apagar comentário - VERSÃO CORRIGIDA
// ============================
async function apagarComentario(artigoId, comentarioId) {
    const userName = localStorage.getItem("user");
    const ehAdmin = localStorage.getItem("admin") === "true";

    if (!userName && !ehAdmin) {
        mostrarNotificacao("⚠️ Precisas de estar logado para apagar comentários.", "erro");
        return;
    }

    try {
        // ✅ envia o autor e isAdmin como query params
        const url = new URL(`http://localhost:5000/api/comentarios/${comentarioId}`);
        url.searchParams.append("autor", ehAdmin ? "admin" : userName);
        url.searchParams.append("isAdmin", ehAdmin ? "true" : "false");

        console.log("🔸 A enviar pedido DELETE para:", url.toString());

        const res = await fetch(url.toString(), { method: "DELETE" });
        const data = await res.json();

        console.log("Resposta do servidor:", res.status, data);

        if (res.ok) {
            mostrarNotificacao(data.message || "✅ Comentário apagado com sucesso!", "sucesso");

            // espera 500ms antes de recarregar, para dar tempo de ver a notificação
            setTimeout(() => carregarComentarios(artigoId), 500);
        } else {
            mostrarNotificacao(data.error || "⚠️ Erro ao apagar comentário.", "erro");
        }
    } catch (err) {
        console.error("Erro ao apagar comentário:", err);
        mostrarNotificacao("❌ Falha na ligação ao servidor.", "erro");
    }
}

// ============================
// 🔹 Sistema de Notificação
// ============================
function mostrarNotificacao(mensagem, tipo = "info") {
    let notificacao = document.createElement("div");
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;

    document.body.appendChild(notificacao);

    setTimeout(() => notificacao.classList.add("visivel"), 50);
    setTimeout(() => {
        notificacao.classList.remove("visivel");
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}
