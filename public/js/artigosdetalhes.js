document.addEventListener("DOMContentLoaded", () => {
    // ✅ Obtém o ID diretamente do servidor (injetado no HTML via EJS)
    const artigoId = window.ARTIGO_ID;

    if (!artigoId || artigoId.length !== 24) {
        if (document.getElementById("artigo-titulo")) {
            document.getElementById("artigo-titulo").textContent = "Erro: ID do artigo inválido.";
        }
        return;
    }

    // ✅ Não carrega detalhes aqui (já estão no HTML via EJS)
    // ❌ REMOVIDO: carregarDetalhesArtigo(artigoId);

    // ✅ Carrega apenas o que é dinâmico (comentários, navegação, categorias)
    carregarComentarios(artigoId);
    carregarListaArtigos(artigoId);

    if (document.getElementById("categorias-lista")) {
        carregarCategorias();
    }

    // Evento de submissão do formulário de comentário
    const formComentarioPrincipal = document.getElementById("form-comentario-principal");
    if (formComentarioPrincipal) {
        formComentarioPrincipal.addEventListener("submit", (e) => {
            e.preventDefault();
            enviarComentarioPrincipal(formComentarioPrincipal, artigoId);
        });
    }
});

// Variável global para navegação
let listaArtigosOrdenados = [];
let indiceArtigoAtual = -1;

// ==========================================
// FUNÇÕES DE CARREGAMENTO
// ==========================================

// ⚠️ Esta função agora é usada APENAS na navegação dinâmica (Anterior/Próximo)
async function carregarDetalhesArtigo(artigoId) {
    if (!artigoId) {
        document.getElementById("artigo-titulo").textContent = "Erro: ID do artigo não especificado";
        return;
    }

    try {
        const response = await fetch(`/api/artigos/${artigoId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const artigo = await response.json();

        // Atualiza campo oculto
        const artigoIdInput = document.getElementById("input-artigo-id");
        if (artigoIdInput) {
            artigoIdInput.value = artigoId;
        }

        // Atualiza metadados
        document.getElementById("artigo-titulo").textContent = artigo.titulo || "Sem título";
        document.getElementById("artigo-autor").textContent = artigo.autor || "Autor desconhecido";
        document.getElementById("artigo-categoria").textContent = artigo.categoria || "Geral";
        document.getElementById("artigo-categoria-meta").textContent = artigo.categoria || "Geral";
        document.getElementById("artigo-data").textContent =
            artigo.dataPublicacao
                ? new Date(artigo.dataPublicacao).toLocaleDateString("pt-PT")
                : "—";

        // Atualiza conteúdo
        const conteudoEl = document.getElementById("artigo-conteudo");
        if (conteudoEl) {
            conteudoEl.innerHTML = artigo.descricao || "<p>Conteúdo não disponível.</p>";
        }

        // Atualiza imagem
        const bannerImg = document.querySelector(".artigo-banner-image img");
        if (bannerImg && artigo.imagem) {
            let src = artigo.imagem.trim();
            if (!src.startsWith("http") && !src.startsWith("/")) {
                src = "/" + src;
            }
            bannerImg.src = src;
        }

    } catch (error) {
        console.error("Erro ao carregar artigo:", error);
        document.getElementById("artigo-titulo").textContent = "Erro ao carregar artigo";
    }
}

async function carregarListaArtigos(artigoIdAtual) {
    try {
        const res = await fetch("/api/artigos?limit=100");
        const data = await res.json();
        const artigos = data.artigos || [];

        artigos.sort((a, b) => {
            const dataA = new Date(a.dataPublicacao || 0);
            const dataB = new Date(b.dataPublicacao || 0);
            return dataB - dataA;
        });

        listaArtigosOrdenados = artigos;
        indiceArtigoAtual = artigos.findIndex(a => a._id === artigoIdAtual);

        atualizarBotoesNavegacao();
    } catch (err) {
        console.error("Erro ao carregar lista de artigos:", err);
    }
}

function atualizarBotoesNavegacao() {
    const btnAnterior = document.querySelector(".btn-anterior");
    const btnProximo = document.querySelector(".btn-proximo");

    if (!btnAnterior || !btnProximo || indiceArtigoAtual === -1) {
        if (btnAnterior) btnAnterior.style.display = "none";
        if (btnProximo) btnProximo.style.display = "none";
        return;
    }

    if (indiceArtigoAtual > 0) {
        const anterior = listaArtigosOrdenados[indiceArtigoAtual - 1];
        btnAnterior.textContent = `← ${anterior.titulo}`;
        btnAnterior.href = `/artigo/${anterior._id}`;
        btnAnterior.style.display = "inline-block";
        btnAnterior.onclick = (e) => {
            e.preventDefault();
            indiceArtigoAtual--;
            carregarArtigoPorIndice();
        };
    } else {
        btnAnterior.style.display = "none";
    }

    if (indiceArtigoAtual < listaArtigosOrdenados.length - 1) {
        const proximo = listaArtigosOrdenados[indiceArtigoAtual + 1];
        btnProximo.textContent = `${proximo.titulo} →`;
        btnProximo.href = `/artigo/${proximo._id}`;
        btnProximo.style.display = "inline-block";
        btnProximo.onclick = (e) => {
            e.preventDefault();
            indiceArtigoAtual++;
            carregarArtigoPorIndice();
        };
    } else {
        btnProximo.style.display = "none";
    }
}

function carregarArtigoPorIndice() {
    const artigo = listaArtigosOrdenados[indiceArtigoAtual];
    if (!artigo) return;

    const novaUrl = `/artigo/${artigo._id}`;
    history.pushState({ id: artigo._id }, "", novaUrl);
    window.scrollTo(0, 0);

    // ✅ Aqui SIM usamos carregarDetalhesArtigo, pois mudamos de artigo dinamicamente
    carregarDetalhesArtigo(artigo._id);
    carregarComentarios(artigo._id);
    atualizarBotoesNavegacao();
}

async function carregarCategorias() {
    try {
        const response = await fetch("/api/artigos");
        const data = await response.json();
        const artigos = data.artigos || [];

        const categorias = [...new Set(
            artigos.map(art => art.categoria).filter(cat => cat?.trim())
        )].sort();

        const lista = document.getElementById("categorias-lista");
        if (!lista) return;

        if (categorias.length === 0) {
            lista.innerHTML = "<li><em>Nenhuma categoria disponível</em></li>";
            return;
        }

        const nomeAmigavel = {
            "gestao": "Gestão",
            "financas": "Finanças",
            "contabilidade": "Contabilidade",
            "fiscalidade": "Fiscalidade",
            "tecnologia": "Tecnologia",
            "educacao": "Educação",
            "marketing": "Marketing",
            "outros": "Outros"
        };

        lista.innerHTML = categorias.map(cat => {
            const total = artigos.filter(a => a.categoria === cat).length;
            const nomeExibicao = nomeAmigavel[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
            return `<li><span class="categoria-box">${nomeExibicao} <span>(${total})</span></span></li>`;
        }).join("");
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        const lista = document.getElementById("categorias-lista");
        if (lista) {
            lista.innerHTML = "<li><em>Erro ao carregar categorias</em></li>";
        }
    }
}

// ==========================================
// FUNÇÕES DE COMENTÁRIOS (sem alterações)
// ==========================================

async function carregarComentarios(artigoId) {
    const container = document.getElementById("lista-comentarios");
    if (!container) {
        console.error("Erro: O elemento #lista-comentarios não foi encontrado.");
        return;
    }
    if (!artigoId) {
        container.innerHTML = "<p>Erro: ID do artigo ausente.</p>";
        return;
    }

    try {
        const response = await fetch(`/api/comentarios?artigoId=${artigoId}`);
        if (!response.ok) throw new Error(`Status: ${response.status}`);

        const comentarios = await response.json();
        const currentUser = localStorage.getItem("user") || "Anónimo";

        if (comentarios.length === 0) {
            container.innerHTML = "<p>Nenhum comentário ainda. Seja o primeiro!</p>";
            return;
        }

        container.innerHTML = comentarios.map(com => {
            const respostas = com.respostas || [];
            const isAdmin = ["Joaquim", "Admin", "ANGORGE", "Equipe ANGORGE"].includes(currentUser);
            const podeApagar = isAdmin || (com.autor?.trim().toLowerCase() === currentUser.trim().toLowerCase());
            const userLiked = com.likedBy.includes(currentUser);

            return `
                <div class="comentario-item" data-id="${com._id}" style="border-bottom: 1px solid #eee; padding: 16px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong>${com.autor || 'Anónimo'}</strong>
                        <span style="font-size: 13px; color: #666;">${formatarData(com.data)}</span>
                    </div>
                    <p style="margin: 8px 0;">${com.texto}</p>

                    <div class="comentario-acoes" style="margin-top: 10px; display: flex; gap: 12px; align-items: center;">
                        <button class="btn-like" 
                            data-id="${com._id}" 
                            data-liked="${userLiked ? 'true' : 'false'}"
                            style="background: none; border: none; color: ${userLiked ? '#0d6efd' : '#6c757d'}; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 4px;">
                            <i class="${userLiked ? 'fas' : 'far'} fa-thumbs-up"></i>
                            <span>${com.likes || 0}</span>
                        </button>
                        <button class="btn-responder" 
                            data-id="${com._id}"
                            style="background: none; border: none; color: #28a745; cursor: pointer; font-size: 14px;">
                            Responder
                        </button>
                        ${podeApagar ? `
                            <button class="btn-eliminar" 
                                data-id="${com._id}"
                                style="background: none; border: none; color: #d9534f; cursor: pointer; font-size: 14px;">
                                Eliminar
                            </button>
                        ` : ''}
                    </div>

                    ${respostas.length > 0 ? `
                        <div class="respostas" style="margin-top: 12px; padding-left: 20px; border-left: 2px solid #f0f0f0;">
                        ${respostas.map(r => {
                const rIsAdmin = ["Joaquim", "Admin", "ANGORGE", "Equipe ANGORGE"].includes(r.autor);
                const rPodeApagar = isAdmin || (r.autor?.trim().toLowerCase() === currentUser.trim().toLowerCase());
                return `
                                <div class="resposta-item" style="margin: 8px 0; padding: 8px 0;">
                                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #555;">
                                        <strong>${r.autor || 'Anónimo'}</strong>
                                        <span>${formatarData(r.data)}</span>
                                    </div>
                                    <p>${r.texto}</p>
                                    ${rPodeApagar ? `
                                        <button class="btn-eliminar-resposta" 
                                                    data-comment-id="${com._id}" 
                                                    data-reply-id="${r._id}"
                                                    style="background: none; border: none; color: #d9534f; font-size: 12px; margin-top: 4px;">
                                                    Eliminar resposta
                                        </button>
                                    ` : ''}
                                </div>
                            `;
            }).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Eventos
        container.querySelectorAll(".btn-like").forEach(btn => {
            btn.addEventListener("click", () => alternarLike(btn, artigoId));
        });

        container.querySelectorAll(".btn-responder").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const commentId = btn.dataset.id;
                const commentEl = btn.closest(".comentario-item");
                if (commentEl.querySelector(".resposta-form")) return;

                const form = document.createElement("div");
                form.className = "resposta-form";
                form.innerHTML = `
                    <textarea placeholder="Escreva sua resposta..." rows="3" style="width: 100%; margin: 8px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                    <button type="button" class="btn-enviar-resposta" 
                                data-comment-id="${commentId}" 
                                style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px;">
                        Enviar
                    </button>
                    <button type="button" class="btn-cancelar-resposta" 
                                style="background: #6c757d; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                        Cancelar
                    </button>
                `;
                commentEl.appendChild(form);

                form.querySelector(".btn-enviar-resposta").addEventListener("click", () => enviarResposta(commentId, form, artigoId));
                form.querySelector(".btn-cancelar-resposta").addEventListener("click", () => form.remove());
            });
        });

        container.querySelectorAll(".btn-eliminar").forEach(btn => {
            btn.addEventListener("click", async () => {
                if (!(await customConfirm("Tem certeza que deseja eliminar este comentário?"))) return;

                const commentId = btn.dataset.id;
                await apagarComentario(commentId, artigoId);
            });
        });

        container.querySelectorAll(".btn-eliminar-resposta").forEach(btn => {
            btn.addEventListener("click", async () => {
                if (!(await customConfirm("Tem certeza que deseja eliminar este comentário?"))) return;

                const commentId = btn.dataset.commentId;
                const replyId = btn.dataset.replyId;
                await apagarResposta(commentId, replyId, artigoId);
            });
        });

    } catch (error) {
        console.error("Erro ao carregar comentários:", error);
        container.innerHTML = `<p>Erro ao carregar comentários: ${error.message}.</p>`;
    }
}

// ==========================================
// FUNÇÕES DE AÇÃO (sem alterações)
// ==========================================

async function enviarComentarioPrincipal(formEl, artigoId) {
    const texto = formEl.querySelector('textarea[name="texto"]').value.trim();
    const currentUser = localStorage.getItem("user") || "Anónimo";

    if (!texto) {
        showToast("Escreva algo antes de enviar o comentário.");
        return;
    }
    if (!currentUser || currentUser === "Anónimo") {
        showToast("Faça login para comentar.");
        return;
    }
    if (!artigoId || artigoId.length !== 24) {
        showToast("Erro interno: ID do artigo ausente/inválido.");
        return;
    }

    try {
        const res = await fetch(`/api/artigos/${artigoId}/comentarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ autor: currentUser, texto })
        });

        if (res.ok) {
            formEl.querySelector('textarea').value = '';
            mostrarNotificacao("Comentário publicado!");
            await carregarComentarios(artigoId);
        } else {
            const data = await res.json();
            showToast(data.error || "Erro ao publicar comentário.");
        }
    } catch (err) {
        console.error("Erro ao enviar comentário:", err);
        showToast("Falha na operação.");
    }
}

function formatarData(data) {
    const d = new Date(data);
    const hoje = new Date();
    if (d.toDateString() === hoje.toDateString()) {
        return `Hoje • ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    return d.toLocaleDateString('pt-PT') + ` • ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function mostrarNotificacao(mensagem) {
    console.log(`[NOTIFICAÇÃO]: ${mensagem}`);
    // Você pode implementar um toast real aqui depois
}

async function alternarLike(btn, artigoId) {
    const commentId = btn.dataset.id;
    const isLiked = btn.dataset.liked === "true";
    const currentUser = localStorage.getItem("user") || "Anónimo";

    if (!currentUser || currentUser === "Anónimo") {
        showToast("Faça login para curtir comentários.");
        return;
    }

    try {
        const method = isLiked ? "DELETE" : "POST";
        const res = await fetch(`/api/comentarios/${commentId}/like`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ autor: currentUser })
        });

        if (res.ok) {
            const data = await res.json();
            btn.dataset.liked = (!isLiked).toString();
            btn.style.color = !isLiked ? "#0d6efd" : "#6c757d";
            btn.innerHTML = `<i class="${!isLiked ? 'fas' : 'far'} fa-thumbs-up"></i> <span>${data.likes}</span>`;
        } else {
            const data = await res.json();
            showToast(data.error || "Erro ao atualizar like.");
        }
    } catch (err) {
        console.error("Erro ao alternar like:", err);
        showToast("Falha na operação.");
    }
}

async function enviarResposta(commentId, formEl, artigoId) {
    const texto = formEl.querySelector("textarea").value.trim();
    const currentUser = localStorage.getItem("user") || "Anónimo";

    if (!texto) {
        showToast("Escreva algo antes de enviar.");
        return;
    }
    if (!currentUser || currentUser === "Anónimo") {
        showToast("Faça login para responder.");
        return;
    }

    try {
        const res = await fetch(`/api/comentarios/${commentId}/respostas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ autor: currentUser, texto })
        });

        if (res.ok) {
            formEl.remove();
            mostrarNotificacao("Resposta enviada!");
            await carregarComentarios(artigoId);
        } else {
            const data = await res.json();
            showToast(data.error || "Erro ao enviar resposta.");
        }
    } catch (err) {
        console.error("Erro ao enviar resposta:", err);
        showToast("Falha na operação.");
    }
}

async function apagarComentario(commentId, artigoId) {
    const currentUser = localStorage.getItem("user") || "Anónimo";
    const isAdmin = ["Joaquim", "Admin", "ANGORGE", "Equipe ANGORGE"].includes(currentUser);

    try {
        const url = new URL(`/api/comentarios/${commentId}`, window.location.origin);
        url.searchParams.append("autor", currentUser);
        url.searchParams.append("isAdmin", isAdmin ? "true" : "false");

        const res = await fetch(url, { method: "DELETE" });
        if (res.ok) {
            mostrarNotificacao("Comentário eliminado!");
            await carregarComentarios(artigoId);
        } else {
            const data = await res.json();
            showToast(data.error || "Erro ao apagar comentário.");
        }
    } catch (err) {
        console.error("Erro ao apagar comentário:", err);
        showToast("Falha na ligação ao servidor.");
    }
}

async function apagarResposta(commentId, replyId, artigoId) {
    const currentUser = localStorage.getItem("user") || "Anónimo";
    const isAdmin = ["Joaquim", "Admin", "ANGORGE", "Equipe ANGORGE"].includes(currentUser);

    try {
        const url = new URL(`/api/comentarios/${commentId}/respostas/${replyId}`, window.location.origin);
        url.searchParams.append("autor", currentUser);
        url.searchParams.append("isAdmin", isAdmin ? "true" : "false");

        const res = await fetch(url, { method: "DELETE" });
        if (res.ok) {
            mostrarNotificacao("Resposta eliminada!");
            await carregarComentarios(artigoId);
        } else {
            const data = await res.json();
            showToast(data.error || "Erro ao apagar resposta.");
        }
    } catch (err) {
        console.error("Erro ao apagar resposta:", err);
        showToast("Falha na ligação ao servidor.");
    }
}

// ==========================================
// NAVEGAÇÃO DO BROWSER (sem alterações)
// ==========================================

window.addEventListener("popstate", (e) => {
    const pathSegments = window.location.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    if (id && id.length === 24) {
        const idx = listaArtigosOrdenados.findIndex(a => a._id === id);
        if (idx !== -1) {
            indiceArtigoAtual = idx;
            carregarArtigoPorIndice();
        }
    }
});


function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 50);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


function customConfirm(message) {
    return new Promise(resolve => {
        const modal = document.getElementById("confirm-modal");
        const msg = document.getElementById("confirm-message");
        const yesBtn = document.getElementById("confirm-yes");
        const noBtn = document.getElementById("confirm-no");

        msg.textContent = message;
        modal.style.display = "flex";

        yesBtn.onclick = () => {
            modal.style.display = "none";
            resolve(true);
        };

        noBtn.onclick = () => {
            modal.style.display = "none";
            resolve(false);
        };
    });
}
