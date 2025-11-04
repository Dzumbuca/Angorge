
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
            div.setAttribute("data-comment-id", c._id); // 👈 ADICIONE ESTA LINHA

            // 👇 Formata data amigável
            const formatarData = (data) => {
                const d = new Date(data);
                const hoje = new Date();
                if (d.toDateString() === hoje.toDateString()) return `Hoje • ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
                return d.toLocaleDateString("pt-PT") + ` • ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            };

            // 👇 Cabeçalho e texto do comentário
            div.innerHTML = `
                <div class="comentario-cabecalho">
                    <strong>${c.autor || "Anónimo"}</strong>
                    <span class="comentario-data">${formatarData(c.data)}</span>
                </div>
                <p class="comentario-texto">${c.texto}</p>
            `;

            // 👇 Contêiner de ações (like, responder, apagar)
            const acoes = document.createElement("div");
            acoes.classList.add("comentario-acoes");

            // 👇 Botão de like
            const likeBtn = document.createElement("button");
            likeBtn.className = "btn-like";
            likeBtn.innerHTML = `<i class="far fa-thumbs-up"></i> <span>${c.likes || 0}</span>`;
            likeBtn.dataset.commentId = c._id;

            const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
            if (likedComments.includes(c._id)) {
                likeBtn.innerHTML = `<i class="fas fa-thumbs-up"></i> <span>${c.likes || 0}</span>`;
                likeBtn.classList.add("favorito");
            }
            likeBtn.addEventListener("click", () => darLike(c._id, likeBtn));
            acoes.appendChild(likeBtn);

            // 👇 Botão Responder
            const btnResponder = document.createElement("button");
            btnResponder.textContent = "Responder";
            btnResponder.classList.add("btn-responder");
            acoes.appendChild(btnResponder);

            // 👇 Botão Apagar (só se for autor ou admin)
            const nomesIguais = utilizadorAtual &&
                c.autor?.trim().toLowerCase() === utilizadorAtual.trim().toLowerCase();

            if (nomesIguais || ehAdmin) {
                const btnApagar = document.createElement("button");
                btnApagar.textContent = "Apagar";
                btnApagar.classList.add("btn-apagar");
                btnApagar.addEventListener("click", () => apagarComentario(artigoId, c._id));
                acoes.appendChild(btnApagar);
            }

            div.appendChild(acoes);

            // 👇 Renderiza respostas (se houver)
            // 👇 Renderiza respostas (se houver)
            if (c.respostas && c.respostas.length > 0) {
                const respostasDiv = document.createElement("div");
                respostasDiv.classList.add("respostas-container");

                c.respostas.forEach(r => {
                    const respDiv = document.createElement("div");
                    respDiv.classList.add("resposta");
                    if (r.isAdm) respDiv.classList.add("resposta-adm");

                    // Cabeçalho da resposta
                    const cabecalhoResp = document.createElement("div");
                    cabecalhoResp.style.display = "flex";
                    cabecalhoResp.style.justifyContent = "space-between";
                    cabecalhoResp.style.alignItems = "center";
                    cabecalhoResp.innerHTML = `
            <strong>${r.autor || "Anónimo"}</strong>
            <small>${formatarData(r.data)}</small>
        `;

                    // Texto da resposta
                    const textoResp = document.createElement("p");
                    textoResp.style.margin = "4px 0";
                    textoResp.textContent = r.texto;

                    respDiv.appendChild(cabecalhoResp);
                    respDiv.appendChild(textoResp);

                    // 👇 Botão Apagar para respostas (só se for autor ou admin)
                    const nomesIguaisResp = utilizadorAtual &&
                        r.autor?.trim().toLowerCase() === utilizadorAtual.trim().toLowerCase();

                    if (nomesIguaisResp || ehAdmin) {
                        const acoesResp = document.createElement("div");
                        acoesResp.style.marginTop = "6px";
                        acoesResp.style.display = "flex";
                        acoesResp.style.justifyContent = "flex-end";

                        const btnApagarResp = document.createElement("button");
                        btnApagarResp.textContent = "Apagar";
                        btnApagarResp.classList.add("btn-apagar");
                        btnApagarResp.addEventListener("click", () => apagarResposta(artigoId, c._id, r._id));
                        acoesResp.appendChild(btnApagarResp);

                        respDiv.appendChild(acoesResp);
                    }

                    respostasDiv.appendChild(respDiv);
                });
                div.appendChild(respostasDiv);
            }


            // 👇 Formulário de resposta (só se estiver logado) - ESTILO YOUTUBE
            if (utilizadorAtual) {
                const formResp = document.createElement("form");
                formResp.className = "form-resposta";
                formResp.style.display = "none"; // começa escondido

                // Cria o campo de texto
                const textarea = document.createElement("textarea");
                textarea.placeholder = "Escreva uma resposta...";
                textarea.rows = 1;
                textarea.required = true;

                // Cria o botão
                const btnEnviarResposta = document.createElement("button");
                btnEnviarResposta.type = "submit";
                btnEnviarResposta.className = "btn-enviar-resposta";
                btnEnviarResposta.textContent = "Responder";

                // Adiciona os elementos ao formulário
                formResp.appendChild(textarea);
                formResp.appendChild(btnEnviarResposta);

                // Evento de envio
                formResp.addEventListener("submit", (e) => {
                    e.preventDefault();
                    const texto = textarea.value.trim();
                    if (texto) {
                        enviarResposta(c._id, texto, utilizadorAtual, ehAdmin);
                        textarea.value = ""; // limpa após enviar
                        formResp.style.display = "none"; // esconde formulário
                    }
                });

                // Ativa o formulário ao clicar em "Responder"
                btnResponder.addEventListener("click", (e) => {
                    e.stopPropagation();
                    formResp.style.display = formResp.style.display === "none" ? "flex" : "none";
                    if (formResp.style.display === "flex") {
                        textarea.focus();
                    }
                });

                div.appendChild(formResp);
            }

            // 👇 Separador visual
            const hr = document.createElement("hr");
            div.appendChild(hr);

            lista.appendChild(div);
        });

        destacarComentarioPorHash();
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


// 👍👎 Alternar like/deslike
async function darLike(rawCommentId, button) {
    // Normaliza o id (garante string)
    const commentId = String(rawCommentId);
    const nomeDoUtilizador = localStorage.getItem("user") || "Anónimo"; // ✅ corrigido

    // Estado visual / segurança
    button.disabled = true;

    // Garante array de strings
    const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]').map(String);
    const jaDeuCurtida = likedComments.includes(commentId);

    try {
        let res;
        if (jaDeuCurtida) {
            // REMOVER LIKE
            res = await fetch(`http://localhost:5000/api/comentarios/${commentId}/like`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autor: nomeDoUtilizador }) // 👈 obrigatório
            });
        } else {
            // DAR LIKE
            res = await fetch(`http://localhost:5000/api/comentarios/${commentId}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autor: nomeDoUtilizador }) // 👈 obrigatório
            });

        }

        // tenta analisar JSON (alguns endpoints retornam vazio)
        let data;
        try {
            data = await res.json();
        } catch (e) {
            data = {};
        }

        // Se a resposta não for ok, mostra mensagem e sai sem alterar localStorage/UI
        if (!res.ok) {
            console.error("Resposta do servidor:", res.status, data);
            alert("❌ Falha ao alterar like: " + (data.error || data.message || "Erro no servidor"));
            return;
        }

        // Atualiza contagem no botão (usa resposta do servidor se existir)
        const countSpan = button.querySelector('span');
        const icon = button.querySelector('i');

        if (countSpan) {
            if (typeof data.likes === 'number') {
                countSpan.textContent = data.likes;
            } else {
                // fallback: ajusta localmente
                const atual = parseInt(countSpan.textContent || "0", 10);
                countSpan.textContent = jaDeuCurtida ? Math.max(0, atual - 1) : atual + 1;
            }
        }

        // Atualiza localStorage e ícone
        let novoLiked;
        if (jaDeuCurtida) {
            novoLiked = likedComments.filter(id => id !== commentId);
            if (icon) icon.className = "far fa-thumbs-up";
            button.style.color = "";
        } else {
            novoLiked = [...likedComments, commentId];
            if (icon) icon.className = "fas fa-thumbs-up";
            button.style.color = "#0d6efd";
        }
        localStorage.setItem('likedComments', JSON.stringify(novoLiked));

        // pequeno feedback visual
        setTimeout(() => { button.disabled = false; }, 300);

    } catch (err) {
        console.error("Erro ao alternar like:", err);
        alert("❌ Falha na ligação ao servidor.");
        button.disabled = false;
    }
}


// 💬 Enviar resposta (sem isAdm!)
async function enviarResposta(commentId, texto, autor, isAdm = false) {
    try {
        const res = await fetch(`http://localhost:5000/api/comentarios/${commentId}/respostas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ autor, texto, isAdm }) // ✅ agora envia corretamente
        });
        if (res.ok) {
            carregarComentarios(artigoIdGlobal);
        } else {
            alert("Erro ao enviar resposta");
        }
    } catch (err) {
        alert("Falha na conexão");
    }
}

// ============================
// 🔹 Apagar resposta
// ============================
async function apagarResposta(artigoId, comentarioId, respostaId) {
    // Normaliza os IDs (garante string)
    const comentarioIdStr = comentarioId?.$oid || comentarioId?._id || comentarioId || String(comentarioId);
    const respostaIdStr = respostaId?.$oid || respostaId?._id || respostaId || String(respostaId);

    const userName = localStorage.getItem("user");
    const ehAdmin = localStorage.getItem("admin") === "true";

    if (!userName && !ehAdmin) {
        mostrarNotificacao("⚠️ Precisas de estar logado para apagar respostas.", "erro");
        return;
    }

    try {
        const url = new URL(`http://localhost:5000/api/comentarios/${comentarioIdStr}/respostas/${respostaIdStr}`);
        url.searchParams.append("autor", ehAdmin ? "admin" : userName);
        url.searchParams.append("isAdmin", ehAdmin ? "true" : "false");

        console.log("🔹 Apagando resposta:", url.toString()); // 👈 para debug

        const res = await fetch(url.toString(), { method: "DELETE" });
        const data = await res.json();

        if (res.ok) {
            mostrarNotificacao("✅ Resposta apagada com sucesso!", "sucesso");
            setTimeout(() => carregarComentarios(artigoId), 500);
        } else {
            mostrarNotificacao(data.error || "⚠️ Erro ao apagar resposta.", "erro");
        }
    } catch (err) {
        console.error("Erro ao apagar resposta:", err);
        mostrarNotificacao("❌ Falha na ligação ao servidor.", "erro");
    }
}


// Destaca e rola até o comentário ao carregar a página
function destacarComentarioPorHash() {
    const hash = window.location.hash; // ex: #comentario-672a1b3c4d5e6f7g8h9i0j1k
    if (hash.startsWith("#comentario-")) {
        const comentarioId = hash.replace("#comentario-", "");
        const el = document.querySelector(`[data-comment-id="${comentarioId}"]`);
        if (el) {
            // Destaque visual
            el.style.backgroundColor = "#fff9db";
            el.style.transition = "background-color 0.3s";
            // Rolar suavemente
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            // Remover destaque após 3s
            setTimeout(() => {
                el.style.backgroundColor = "";
            }, 3000);
        }
    }
}

// Chame isso APÓS carregar os comentários
// Dentro da função carregarComentarios(), no final:
// destacarComentarioPorHash();


