document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const artigoId = urlParams.get("id");

    if (document.getElementById("artigo-titulo")) {
        if (artigoId) {
            carregarDetalhesArtigo();
            carregarComentarios(artigoId);
            carregarListaArtigos(artigoId); // ← Nova linha
        } else {
            document.getElementById("artigo-titulo").textContent = "Erro: ID do artigo não especificado";
        }
    }

    if (document.getElementById("categorias-lista")) {
        carregarCategorias();
    }
});

async function carregarDetalhesArtigo() {
    const urlParams = new URLSearchParams(window.location.search);
    const artigoId = urlParams.get("id");

    if (!artigoId) {
        document.getElementById("artigo-titulo").textContent = "Erro: ID do artigo não especificado";
        return;
    }

    try {
        const response = await fetch(`/api/artigos/${artigoId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const artigo = await response.json();

        // Preenche metadados
        document.getElementById("artigo-titulo").textContent = artigo.titulo || "Sem título";
        document.getElementById("artigo-autor").textContent = artigo.autor || "Autor desconhecido";
        document.getElementById("artigo-categoria").textContent = artigo.categoria || "Geral";
        document.getElementById("artigo-categoria-meta").textContent = artigo.categoria || "Geral";
        document.getElementById("artigo-data").textContent =
            artigo.dataPublicacao
                ? new Date(artigo.dataPublicacao).toLocaleDateString("pt-PT")
                : "—";

        // Preenche conteúdo
        const conteudoEl = document.getElementById("artigo-conteudo");
        if (conteudoEl) {
            conteudoEl.innerHTML = artigo.descricao || "<p>Conteúdo não disponível.</p>";
        }

        // ✅ Preenche a imagem do banner
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
// Variável global para armazenar a lista de artigos ordenados
let listaArtigosOrdenados = [];
let indiceArtigoAtual = -1;

// Carrega todos os artigos e identifica o atual
async function carregarListaArtigos(artigoIdAtual) {
    try {
        const res = await fetch("/api/artigos?limit=100"); // ajuste se tiver muitos artigos
        const data = await res.json();
        const artigos = data.artigos || [];

        // Ordena do mais recente para o mais antigo
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

// Atualiza os botões de navegação com base no índice atual
function atualizarBotoesNavegacao() {
    const btnAnterior = document.querySelector(".btn-anterior");
    const btnProximo = document.querySelector(".btn-proximo");

    if (indiceArtigoAtual === -1) {
        btnAnterior.style.display = "none";
        btnProximo.style.display = "none";
        return;
    }

    // Post anterior (mais recente → índice menor)
    if (indiceArtigoAtual > 0) {
        const anterior = listaArtigosOrdenados[indiceArtigoAtual - 1];
        btnAnterior.textContent = `← ${anterior.titulo}`;
        btnAnterior.href = `#`; // vamos usar JS para navegar
        btnAnterior.style.display = "inline-block";
        btnAnterior.onclick = (e) => {
            e.preventDefault();
            indiceArtigoAtual--;
            carregarArtigoPorIndice();
        };
    } else {
        btnAnterior.style.display = "none";
    }

    // Próximo post (mais antigo → índice maior)
    if (indiceArtigoAtual < listaArtigosOrdenados.length - 1) {
        const proximo = listaArtigosOrdenados[indiceArtigoAtual + 1];
        btnProximo.textContent = `${proximo.titulo} →`;
        btnProximo.href = `#`;
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

// Carrega o artigo com base no índice atual
function carregarArtigoPorIndice() {
    const artigo = listaArtigosOrdenados[indiceArtigoAtual];
    if (!artigo) return;

    // Atualiza a URL sem recarregar
    const novaUrl = `artigodetalhe.html?id=${artigo._id}`;
    history.pushState({ id: artigo._id }, "", novaUrl);

    // Atualiza o conteúdo
    document.getElementById("artigo-titulo").textContent = artigo.titulo || "Sem título";
    document.getElementById("artigo-autor").textContent = artigo.autor || "Autor desconhecido";
    document.getElementById("artigo-categoria").textContent = artigo.categoria || "Geral";
    document.getElementById("artigo-categoria-meta").textContent = artigo.categoria || "Geral";
    document.getElementById("artigo-data").textContent =
        artigo.dataPublicacao
            ? new Date(artigo.dataPublicacao).toLocaleDateString("pt-PT")
            : "—";

    const conteudoEl = document.getElementById("artigo-conteudo");
    if (conteudoEl) {
        conteudoEl.innerHTML = artigo.descricao || "<p>Conteúdo não disponível.</p>";
    }

    // Atualiza a imagem
    const bannerImg = document.querySelector(".artigo-banner-image img");
    if (bannerImg && artigo.imagem) {
        let src = artigo.imagem.trim();
        if (!src.startsWith("http") && !src.startsWith("/")) {
            src = "/" + src;
        }
        bannerImg.src = src;
    }

    // Atualiza comentários
    carregarComentarios(artigo._id);

    // Atualiza os botões de navegação
    atualizarBotoesNavegacao();
}
// Função para carregar categorias
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



// ===== GOOGLE LOGIN (mantido separado) =====
let orientacaoElement = null;

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

function mostrarNotificacao(texto) {
    let notif = document.createElement("div");
    notif.className = "notificacao-login";
    notif.textContent = texto;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        opacity: 0;
        transform: translateY(-10px);
        transition: opacity 0.3s, transform 0.3s;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.classList.add("visivel"), 10);
    setTimeout(() => {
        notif.style.opacity = "0";
        notif.style.transform = "translateY(-10px)";
        setTimeout(() => notif.remove(), 300);
    }, 2500);
}

function handleCredentialResponse(response) {
    const payload = parseJwt(response.credential);
    const nome = payload.name;
    const email = payload.email;

    localStorage.setItem("user", nome);
    localStorage.setItem("user_email", email);

    const nomeInput = document.querySelector('input[placeholder="Nome"]');
    const emailInput = document.querySelector('input[placeholder="E-mail"]');
    if (nomeInput) {
        nomeInput.value = nome;
        nomeInput.readOnly = true;
    }
    if (emailInput) {
        emailInput.value = email;
        emailInput.readOnly = true;
    }

    const btn = document.getElementById("google-login-button");
    if (btn) btn.style.display = "none";

    if (orientacaoElement?.parentNode) {
        orientacaoElement.parentNode.removeChild(orientacaoElement);
    }

    mostrarNotificacao(`Olá, ${nome}! Você está logado.`);
}

// Inicializa Google Login
if (document.getElementById("google-login-button")) {
    if (localStorage.getItem("user")) {
        // Já está logado
        const nome = localStorage.getItem("user");
        const email = localStorage.getItem("user_email");

        const nomeInput = document.querySelector('input[placeholder="Nome"]');
        const emailInput = document.querySelector('input[placeholder="E-mail"]');
        if (nomeInput && !nomeInput.value) nomeInput.value = nome;
        if (emailInput && !emailInput.value) emailInput.value = email;
        if (nomeInput) nomeInput.readOnly = true;
        if (emailInput) emailInput.readOnly = true;

        document.getElementById("google-login-button").style.display = "none";
    } else {
        // Mostra botão de login
        orientacaoElement = document.createElement("p");
        orientacaoElement.textContent = "Faça login para comentar";
        orientacaoElement.style.marginBottom = "12px";
        orientacaoElement.style.fontSize = "14px";
        orientacaoElement.style.color = "#555";
        document.getElementById("google-login-button").parentNode.insertBefore(orientacaoElement, document.getElementById("google-login-button"));

        const checkGoogle = setInterval(() => {
            if (typeof google !== "undefined") {
                clearInterval(checkGoogle);
                google.accounts.id.initialize({
                    client_id: "244625094049-do6orhdmknse8q7168oft6hu23tfuibk.apps.googleusercontent.com",
                    callback: handleCredentialResponse
                });
                google.accounts.id.renderButton(document.getElementById("google-login-button"), {
                    theme: "outline",
                    size: "large",
                    text: "signin_with"
                });
            }
        }, 100);
    }
}

// Função para carregar comentários do artigo
// ==========================================
// Função para carregar comentários com like, responder e eliminar
// ==========================================
async function carregarComentarios(artigoId) {
    const container = document.getElementById("lista-comentarios");
    if (!container) return;

    try {
        const response = await fetch(`/api/artigos/${artigoId}/comentarios`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

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

            return `
        <div class="comentario-item" data-id="${com._id}" style="border-bottom: 1px solid #eee; padding: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong>${com.autor || 'Anónimo'}</strong>
            <span style="font-size: 13px; color: #666;">${formatarData(com.data)}</span>
          </div>
          <p style="margin: 8px 0;">${com.texto}</p>

          <!-- Ações -->
          <div class="comentario-acoes" style="margin-top: 10px; display: flex; gap: 12px; align-items: center;">
            <button class="btn-like" 
                    data-id="${com._id}" 
                    data-liked="${com.likedBy.includes(currentUser) ? 'true' : 'false'}"
                    style="background: none; border: none; color: ${com.likedBy.includes(currentUser) ? '#0d6efd' : '#6c757d'}; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 4px;">
              <i class="far fa-thumbs-up"></i>
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

          <!-- Respostas -->
          ${respostas.length > 0 ? `
            <div class="respostas" style="margin-top: 12px; padding-left: 20px; border-left: 2px solid #f0f0f0;">
              ${respostas.map(r => {
                const rIsAdmin = ["Joaquim", "Admin", "ANGORGE", "Equipe ANGORGE"].includes(r.autor);
                const rPodeApagar = isAdmin || rIsAdmin;
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

        // ====== ADICIONAR EVENTOS ======
        // Like
        container.querySelectorAll(".btn-like").forEach(btn => {
            btn.addEventListener("click", () => alternarLike(btn, artigoId));
        });

        // Responder (abre um textarea abaixo do comentário)
        container.querySelectorAll(".btn-responder").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const commentId = btn.dataset.id;
                const commentEl = btn.closest(".comentario-item");
                if (commentEl.querySelector(".resposta-form")) return; // já aberto

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

                // Eventos do formulário
                form.querySelector(".btn-enviar-resposta").addEventListener("click", () => enviarResposta(commentId, form));
                form.querySelector(".btn-cancelar-resposta").addEventListener("click", () => form.remove());
            });
        });

        // Eliminar comentário
        container.querySelectorAll(".btn-eliminar").forEach(btn => {
            btn.addEventListener("click", async () => {
                if (!confirm("Tem certeza que deseja eliminar este comentário?")) return;
                const commentId = btn.dataset.id;
                await apagarComentario(commentId, artigoId);
            });
        });

        // Eliminar resposta
        container.querySelectorAll(".btn-eliminar-resposta").forEach(btn => {
            btn.addEventListener("click", async () => {
                if (!confirm("Eliminar esta resposta?")) return;
                const commentId = btn.dataset.commentId;
                const replyId = btn.dataset.replyId;
                await apagarResposta(commentId, replyId, artigoId);
            });
        });

    } catch (error) {
        console.error("Erro ao carregar comentários:", error);
        container.innerHTML = "<p>Erro ao carregar comentários.</p>";
    }
}

// ==========================================
// Funções auxiliares
// ==========================================

function formatarData(data) {
    const d = new Date(data);
    const hoje = new Date();
    if (d.toDateString() === hoje.toDateString()) {
        return `Hoje • ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    return d.toLocaleDateString('pt-PT') + ` • ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

async function alternarLike(btn, artigoId) {
    const commentId = btn.dataset.id;
    const isLiked = btn.dataset.liked === "true";
    const currentUser = localStorage.getItem("user") || "Anónimo";

    if (!currentUser || currentUser === "Anónimo") {
        alert("Faça login para curtir comentários.");
        return;
    }

    try {
        let res;
        if (isLiked) {
            res = await fetch(`/api/comentarios/${commentId}/like`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autor: currentUser })
            });
        } else {
            res = await fetch(`/api/comentarios/${commentId}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autor: currentUser })
            });
        }

        if (res.ok) {
            const data = await res.json();
            btn.dataset.liked = (!isLiked).toString();
            btn.style.color = !isLiked ? "#0d6efd" : "#6c757d";
            btn.innerHTML = `<i class="${!isLiked ? 'fas' : 'far'} fa-thumbs-up"></i> <span>${data.likes}</span>`;
            // Atualiza visualmente sem recarregar
        } else {
            alert("Erro ao atualizar like.");
        }
    } catch (err) {
        console.error("Erro ao alternar like:", err);
        alert("Falha na operação.");
    }
}

async function enviarResposta(commentId, formEl) {
    const texto = formEl.querySelector("textarea").value.trim();
    const currentUser = localStorage.getItem("user") || "Anónimo";

    if (!texto) {
        alert("Escreva algo antes de enviar.");
        return;
    }

    if (!currentUser || currentUser === "Anónimo") {
        alert("Faça login para comentar.");
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
            const artigoId = new URLSearchParams(window.location.search).get("id");
            await carregarComentarios(artigoId); // recarrega
        } else {
            alert("Erro ao enviar resposta.");
        }
    } catch (err) {
        console.error("Erro ao enviar resposta:", err);
        alert("Falha na operação.");
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
            await carregarComentarios(artigoId);
        } else {
            const data = await res.json();
            alert(data.error || "Erro ao apagar comentário.");
        }
    } catch (err) {
        console.error("Erro ao apagar comentário:", err);
        alert("Falha na ligação ao servidor.");
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
            await carregarComentarios(artigoId);
        } else {
            alert("Erro ao apagar resposta.");
        }
    } catch (err) {
        console.error("Erro ao apagar resposta:", err);
        alert("Falha na ligação ao servidor.");
    }
}

window.addEventListener("popstate", (e) => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
        const idx = listaArtigosOrdenados.findIndex(a => a._id === id);
        if (idx !== -1) {
            indiceArtigoAtual = idx;
            carregarArtigoPorIndice();
        }
    }
});