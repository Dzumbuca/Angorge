// ==========================
// 📊 CARREGAR DADOS DO DASHBOARD
// ==========================
async function carregarContagensDashboard() {
    try {
        const res = await fetch("/api/dashbord/contagens");
        if (!res.ok) throw new Error("Falha ao carregar contagens");
        const dados = await res.json();

        document.getElementById("cursos-count").textContent = dados.cursosPublicados;
        document.getElementById("artigos-count").textContent = dados.artigosPublicados;
        document.getElementById("inscritos-count").textContent = dados.inscritos;
    } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        // Opcional: mostre "–" ou mantenha 0
    }
}





document.addEventListener("DOMContentLoaded", async () => {
    await carregarContagensDashboard();
    // Dados do utilizador logado (usa o nome que já existe no header)
    const currentUser = (document.querySelector('.user-name')?.textContent || 'Admin').trim();
    setInterval(carregarContagensDashboard, 30000);

    // --- Notificações (mantive a tua lógica, sem mexer muito) ---
    // --- Notificações Melhoradas ---
    const bell = document.getElementById("notification-bell");
    const dropdown = document.getElementById("notification-dropdown");
    const list = document.getElementById("notification-list");
    const countBadge = document.getElementById("notification-count");

    let notifications = [];
    let lastNotificationCount = 0;
    let isInitialLoad = true;

    async function fetchNotifications() {
        try {
            const res = await fetch("/api/notificacoes");
            if (!res.ok) throw new Error("Falha ao buscar notificações");
            const dados = await res.json();

            const newNotifications = Array.isArray(dados) ? dados : [];
            const newCount = newNotifications.length;

            // Só atualiza se houver mudança
            if (isInitialLoad || newCount !== lastNotificationCount) {
                notifications = newNotifications;
                renderNotifications();
                lastNotificationCount = newCount;
                isInitialLoad = false;
            }
        } catch (err) {
            console.error("Erro ao buscar notificações:", err);
        }
    }
    function escapeXml(str = '') {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderNotifications() {
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = '<li style="padding:12px 16px; text-align:center; color:#777;">Nenhuma notificação</li>';
            countBadge.style.display = 'none';
            return;
        }

        // ✅ Carrega IDs já lidos do localStorage
        const lidos = new Set(JSON.parse(localStorage.getItem('notificacoesLidas') || '[]'));
        let novasNaoLidas = 0;

        const items = notifications.map(n => {
            // Cria um ID único para cada notificação
            const notifId = `${n.tipo}-${n.data}`;
            const estaLida = lidos.has(notifId);

            if (!estaLida) {
                novasNaoLidas++;
            }

            let icon = '💬';
            let iconClass = 'comentario';
            let url = '#';
            let textoFormatado = '';

            if (n.tipo === 'comentario' && n.artigoId) {
                icon = '💬';
                iconClass = 'comentario';
                url = `/artigo/${n.artigoId}#comentario-${n.comentarioId}`;
                const autor = escapeHtml(n.autor || 'Alguém');
                const titulo = escapeXml(escapeHtml(n.artigoTitulo || 'um artigo'));
                textoFormatado = `${autor} comentou no artigo<br><strong>"${titulo}"</strong>`;
            }
            else if (n.tipo === 'inscricao' && n.cursoId) {
                icon = '🎓';
                iconClass = 'inscricao';
                url = `/curso/${n.cursoId}`;
                const autor = escapeHtml(n.autor || 'Alguém');
                const titulo = escapeXml(escapeHtml(n.cursoTitulo || 'um curso'));
                textoFormatado = `${autor} se inscreveu no curso<br><strong>"${titulo}"</strong>`;
            }
            else {
                textoFormatado = escapeHtml(n.texto || 'Nova atividade');
            }

            const dataFormatada = formatarData(n.data);
            const classeLida = estaLida ? '' : 'unread';

            return `
        <li class="${classeLida}" data-notif-id="${notifId}">
            <a href="${url}" style="text-decoration: none; color: inherit; display: flex; gap: 12px; width: 100%;">
                <span class="notification-icon ${iconClass}">${icon}</span>
                <div class="notification-text" style="line-height: 1.4;">
                    ${textoFormatado}
                    <div style="font-size: 0.85em; color: #888; margin-top: 4px;">
                        ${dataFormatada}
                    </div>
                </div>
            </a>
        </li>
        `;
        }).join('');

        list.innerHTML = items;
        countBadge.textContent = novasNaoLidas;
        countBadge.style.display = novasNaoLidas > 0 ? 'inline-block' : 'none';

        // ✅ Marca como lida ao clicar no link
        list.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                const li = link.closest('li');
                const notifId = li?.dataset.notifId;
                if (notifId) {
                    lidos.add(notifId);
                    localStorage.setItem('notificacoesLidas', JSON.stringify(Array.from(lidos)));
                    li.classList.remove('unread');
                    // Atualiza contador
                    const restantes = list.querySelectorAll('li.unread').length;
                    countBadge.textContent = restantes;
                    if (restantes === 0) countBadge.style.display = 'none';
                }
            });
        });


    }

    function escapeHtml(str = '') {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Evento do sino
    bell?.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown?.classList.toggle("show");

        if (dropdown?.classList.contains("show")) {
            // ✅ Marca todas como lidas ao abrir
            const lidos = new Set(JSON.parse(localStorage.getItem('notificacoesLidas') || '[]'));
            notifications.forEach(n => {
                lidos.add(`${n.tipo}-${n.data}`);
            });
            localStorage.setItem('notificacoesLidas', JSON.stringify(Array.from(lidos)));
            countBadge.style.display = 'none';

            renderNotifications();
        }
    });

    // Fecha dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        if (!bell?.contains(e.target) && !dropdown?.contains(e.target)) {
            dropdown?.classList.remove("show");
        }
    });

    // Carrega imediatamente e depois a cada 8s (mais responsivo)
    await fetchNotifications();
    setInterval(fetchNotifications, 8000);

    // --- Comentários / Accordion / Respostas ---
    let paginaAtual = 1;
    const comentariosPorPagina = 5;
    let listaComentarios = [];

    const container = document.getElementById("comentarios-container");
    // Opção A: Se o endpoint for /api/comentarios/admin
    async function carregarComentarios() {
        try {
            const res = await fetch("/api/comentarios/admin"); // <-- CORREÇÃO AQUI
            const dados = await res.json();
            listaComentarios = Array.isArray(dados) ? dados : (dados.comentarios || []);
            renderizarComentarios();
        } catch (err) {
            console.error("Erro ao carregar comentários:", err);
        }
    }

    function renderizarComentarios() {
        const inicio = (paginaAtual - 1) * comentariosPorPagina;
        const fim = inicio + comentariosPorPagina;
        const pagina = listaComentarios.slice(inicio, fim);

        if (pagina.length === 0) {
            container.innerHTML = "<p>📭 Nenhum comentário disponível.</p>";
            return;
        }

        const totalPaginas = Math.max(1, Math.ceil(listaComentarios.length / comentariosPorPagina));
        container.innerHTML = pagina.map((c, index) => {
            const respostas = Array.isArray(c.respostas) ? c.respostas : (c.replies || []);
            const respostasCount = respostas.length;
            const resumoRespostas = respostas.slice(0, 2).map((r, idx) => `
  <div class="resposta-item">
    <div class="resposta-meta">${escapeHtml(r.autor || 'Anónimo')} <span class="data-badge">${escapeHtml(formatarData(r.data || r.createdAt || Date.now()))}</span></div>
    <div class="resposta-texto">${escapeHtml(r.texto || '')}</div>
    <div style="margin-top:6px;"><button class="btn-acao btn-eliminar-resposta" 
       data-comment-id="${c._id}"
        data-reply-id="${r._id}"> <!-- _id real -->
    Eliminar resposta
</button></div>
  </div>
`).join('');

            return `
        <div class="comentarios-admi ${index % 2 === 0 ? 'bg-laranja' : 'bg-cinza'}" data-comment-id="${c._id}">
          <strong>${escapeHtml(c.autor || "Anónimo")}</strong>
          <p>${escapeHtml(c.texto || "")}</p>
          <div class="comentario-acoes">
            <button class="btn-acao btn-responder" data-comment-id="${c._id}">Responder</button>
            <span>|</span>
            <button class="btn-acao btn-gostar" data-comment-id="${c._id}">
  <i class="far fa-thumbs-up"></i> <span>${c.likes || 0}</span>
</button>
            <span>|</span>
            <button class="btn-acao" style="color:#d9534f;" onclick="apagarComentarioAdmin('${c._id}')">Eliminar</button>
          </div>

          ${respostasCount > 0 ? `<button class="ver-respostas-btn" data-comment-id="${c._id}"> ${respostasCount} resposta${respostasCount > 1 ? 's' : ''} ▾</button>` : ''}
          
          <div class="respostas-wrapper" id="respostas-${c._id}">
            ${resumoRespostas}
            ${respostasCount > 2 ? `<div style="font-size:0.9rem; margin-top:6px;"><em>Mostrando 2 de ${respostasCount}. Expande para ver todas.</em></div>` : ''}
            <!-- aqui será injectado o box de resposta quando o utilizador clicar em 'Responder' -->
          </div>
        </div>
      `;
        }).join("");

        // Paginação
        container.innerHTML += `
      <div class="paginacao">
        <button id="prevPage" ${paginaAtual === 1 ? "disabled" : ""}>Anterior</button>
        <span> Página ${paginaAtual} de ${totalPaginas} </span>
        <button id="nextPage" ${fim >= listaComentarios.length ? "disabled" : ""}>Próximo</button>
      </div>
    `;

        // Events: pagination buttons
        document.getElementById("prevPage")?.addEventListener("click", () => { if (paginaAtual > 1) { paginaAtual--; renderizarComentarios(); } });
        document.getElementById("nextPage")?.addEventListener("click", () => { if (paginaAtual < totalPaginas) { paginaAtual++; renderizarComentarios(); } });

        // Delegation: responder, toggle accordion, eliminar resposta
        container.querySelectorAll('.ver-respostas-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-comment-id');
                toggleAccordion(id, btn);
            });
        });
        // 👍 Listener para botões de "Gostar" — ADICIONE AQUI
        container.querySelectorAll('.btn-gostar').forEach(b => {
            b.addEventListener('click', (e) => {
                const commentId = b.getAttribute('data-comment-id');
                darLike(commentId, b);
            });
        });

        container.querySelectorAll('.btn-responder').forEach(b => {
            b.addEventListener('click', (e) => {
                const id = b.getAttribute('data-comment-id');
                abrirCaixaRespostaInline(id);
            });
        });

        // Delegation for eliminar resposta (botões que já foram renderizados)
        // ✅ CERTO — usa data-reply-index
        container.querySelectorAll('.btn-eliminar-resposta').forEach(b => {
            b.addEventListener('click', async (e) => {
                const commentId = b.getAttribute('data-comment-id');
                const replyId = b.getAttribute('data-reply-id'); // ← AGORA CORRETO
                if (!confirm("Eliminar esta resposta?")) return;
                await eliminarResposta(commentId, replyId);
            });
        });
    }

    // --- Helpers ---
    function escapeHtml(str = '') {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Formata data de forma amigável: "Hoje • 14:30", "27 out • 16:45", etc.
    function formatarData(data) {
        const d = new Date(data);
        const hoje = new Date();
        const ontem = new Date();
        ontem.setDate(hoje.getDate() - 1);

        // Hoje
        if (d.toDateString() === hoje.toDateString()) {
            return `Hoje • ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
        // Ontem
        if (d.toDateString() === ontem.toDateString()) {
            return `Ontem • ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
        // Este ano
        if (d.getFullYear() === hoje.getFullYear()) {
            const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
            return `${d.getDate()} ${meses[d.getMonth()]} • ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
        // Anos anteriores
        return d.toLocaleDateString('pt-BR') + ` • ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }

    // Toggle accordion: busca todas as respostas completas e abre
    async function toggleAccordion(commentId, btn) {
        const wrapper = document.getElementById(`respostas-${commentId}`);
        if (!wrapper) return;
        const isExpanded = wrapper.classList.contains('expanded');

        if (isExpanded) {
            wrapper.classList.remove('expanded');
            btn.innerHTML = btn.innerHTML.replace('▾', '▸');
            return;
        }

        // se não tiveres as respostas completas, busca do backend
        try {
            const res = await fetch("/api/comentarios/admin/comentarios");

            if (!res.ok) throw new Error("Erro ao buscar respostas");
            const dados = await res.json(); // espera { respostas: [...] } ou array
            const respostas = Array.isArray(dados) ? dados : (dados.respostas || []);
            // renderiza todas as respostas
            wrapper.innerHTML = respostas.map((r, idx) => `
  <div class="resposta-item">
    <div class="resposta-meta">${escapeHtml(r.autor || currentUser)} <span class="data-badge">${escapeHtml(formatarData(r.data || r.createdAt || Date.now()))}</span></div>
    <div class="resposta-texto">${escapeHtml(r.texto || '')}</div>
    <div style="margin-top:6px;"><button class="btn-acao btn-eliminar-resposta" 
         data-comment-id="${commentId}"" 
         data-reply-id="${r._id}">
    Eliminar resposta
</button>Eliminar</button></div>
  </div>
`).join('') + `
  <div style="margin-top:8px;" class="responder-box-inline"></div>
`;

            // adicionar event listeners para eliminar respostas dentro do wrapper
            wrapper.querySelectorAll('.btn-eliminar-resposta').forEach(b => {
                b.addEventListener('click', async (e) => {
                    const replyIndex = b.getAttribute('data-reply-index'); // ✅ CERTO
                    if (!confirm("Eliminar esta resposta?")) return;
                    await eliminarResposta(commentId, replyIndex);
                });
            });

            // adiciona o botão de abrir caixa inline (responder) se desejar
            const inlineBox = wrapper.querySelector('.responder-box-inline');
            inlineBox.innerHTML = ''; // limpo por garantia
            inlineBox.appendChild(criarBoxRespostaDom(commentId));

            wrapper.classList.add('expanded');
            btn.innerHTML = btn.innerHTML.replace('▸', '▾');
        } catch (err) {
            console.error("Erro ao buscar respostas:", err);
            wrapper.innerHTML = `<p>⚠️ Não foi possível carregar respostas.</p>`;
            wrapper.classList.add('expanded');
        }
    }

    // Cria a caixa de resposta DOM (retorna um elemento)
    function criarBoxRespostaDom(commentId) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('responder-box');

        const textarea = document.createElement('textarea');

        textarea.setAttribute('data-comment-id', commentId);

        const btnEnviar = document.createElement('button');
        btnEnviar.className = 'btn btn-enviar';
        btnEnviar.textContent = 'Enviar';
        btnEnviar.addEventListener('click', async () => {
            const texto = textarea.value.trim();
            if (!texto) { alert('Escreve algo antes de enviar.'); return; }
            btnEnviar.disabled = true;
            try {
                await enviarResposta(commentId, { autor: currentUser, texto });
                textarea.value = '';
                // Recarrega comentários (e mantém pagina atual)
                await carregarComentarios();
            } catch (err) {
                console.error(err);
                alert('Erro ao enviar resposta.');
            } finally {
                btnEnviar.disabled = false;
            }
        });

        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn btn-cancel';
        btnCancel.textContent = 'Cancelar';
        btnCancel.addEventListener('click', () => {
            // se a caixa estiver dentro do accordion, apenas limpa; se foi criada abaixo do comentário, remove
            const parentResp = wrapper.parentElement;
            if (parentResp && parentResp.classList.contains('respostas-wrapper')) {
                textarea.value = '';
            } else {
                wrapper.remove();
            }
        });

        wrapper.appendChild(textarea);
        wrapper.appendChild(btnEnviar);
        wrapper.appendChild(btnCancel);
        return wrapper;
    }

    // Abre a caixa de resposta inline logo abaixo do comentário (quando clicas no botão "Responder")
    function abrirCaixaRespostaInline(commentId) {
        const commentEl = container.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentEl) return;
        // evita duplicar caixas
        if (commentEl.querySelector('.responder-box-inline-origin')) {
            const ta = commentEl.querySelector('.responder-box-inline-origin textarea');
            ta.focus();
            return;
        }
        const box = criarBoxRespostaDom(commentId);
        const containerBox = document.createElement('div');
        containerBox.className = 'responder-box responder-box-inline-origin';
        containerBox.appendChild(box);
        // insere antes da respostas-wrapper (se existir) ou no fim do comentário
        const respostasWrapper = commentEl.querySelector('.respostas-wrapper');
        if (respostasWrapper) {
            respostasWrapper.parentNode.insertBefore(containerBox, respostasWrapper);
        } else {
            commentEl.appendChild(containerBox);
        }
        // foco no textarea
        containerBox.querySelector('textarea').focus();
    }

    // Envia resposta para o backend

    async function enviarResposta(commentId, { autor, texto }) {
        try {
            const res = await fetch(`/api/comentarios/${commentId}/respostas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autor, texto })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(err.error || 'Erro ao enviar resposta');
            }

            return await res.json();
        } catch (err) {
            throw err;
        }
    }

    // Eliminar resposta (faz pedido ao backend)
    // ✅ Agora recebe replyIndex (número), não replyId
    async function eliminarResposta(commentId, replyId) {
        try {
            const res = await fetch(`/api/comentarios/${commentId}/respostas/${replyId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Erro ao eliminar resposta");
            await carregarComentarios();
        } catch (err) {
            console.error("Erro ao eliminar resposta:", err);
            alert('Erro ao eliminar resposta.');
        }
    }

    // --- Função global já existente (tu tens esta mais acima) - deixei-a como global para continuar a funcionar ---
    window.apagarComentarioAdmin = async function (comentarioId) {
        if (!confirm("Tem certeza que deseja eliminar este comentário?")) return;
        try {
            const url = new URL(`/api/comentarios/${comentarioId}`, window.location.origin);
            url.searchParams.append("autor", currentUser);
            url.searchParams.append("isAdmin", "true");
            const res = await fetch(url, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                await carregarComentarios();
            } else {
                alert(data.error || "⚠️ Erro ao apagar comentário.");
            }
        } catch (err) {
            console.error("Erro ao apagar comentário:", err);
            alert("❌ Falha na ligação ao servidor.");
        }
    };

    // Inicial load e poll
    await carregarComentarios();
    setInterval(carregarComentarios, 15000);
});



// 👍👎 Alternar like/deslike
async function darLike(commentId, button) {
    const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
    const jaDeuCurtida = likedComments.includes(commentId);
    const currentUser = (document.querySelector('.user-name')?.textContent || 'Anónimo').trim();

    try {
        let novaContagem;

        if (jaDeuCurtida) {
            // ❌ Remover like
            const res = await fetch(`/api/comentarios/${commentId}/like`, { // ✅
                method: jaDeuCurtida ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autor: currentUser })
            });
            if (!res.ok) throw new Error("Erro ao remover like");

            const data = await res.json();
            novaContagem = data.likes;

            const novosLiked = likedComments.filter(id => id !== commentId);
            localStorage.setItem('likedComments', JSON.stringify(novosLiked));
        } else {
            // ✅ Dar like
            const res = await fetch(`/api/comentarios/${commentId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autor: currentUser })
            });
            if (!res.ok) throw new Error("Erro ao dar like");

            const data = await res.json();
            novaContagem = data.likes;

            likedComments.push(commentId);
            localStorage.setItem('likedComments', JSON.stringify(likedComments));
        }

        // Atualiza o botão
        const countSpan = button.querySelector('span');
        const icon = button.querySelector('i');

        countSpan.textContent = novaContagem;
        icon.className = jaDeuCurtida ? "far fa-thumbs-up" : "fas fa-thumbs-up";
        button.style.color = jaDeuCurtida ? "" : "#0d6efd";

        button.disabled = true;
        setTimeout(() => { button.disabled = false; }, 500);
    } catch (err) {
        console.error("Erro ao alternar like:", err);
        alert("❌ Não foi possível alterar o like.");
    }
}






