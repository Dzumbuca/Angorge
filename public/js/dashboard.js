// ==========================
// 📊 CARREGAR DADOS DO DASHBOARD
// ==========================
async function carregarContagensDashboard() {
    try {
        const res = await fetch("/api/dashbord/contagens");
        if (!res.ok) throw new Error("Falha ao carregar contagens");
        const dados = await res.json();

        document.getElementById("cursos-count").textContent = dados.cursosPublicados || 0;
        document.getElementById("artigos-count").textContent = dados.artigosPublicados || 0;
        document.getElementById("inscritos-count").textContent = dados.inscritos || 0;

        inicializarGraficos(dados);
    } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
    }
}

// ==========================
// 📊 INICIALIZAR GRÁFICOS
// ==========================
function inicializarGraficos(dados) {
    const ctxCursos = document.getElementById('cursosChart')?.getContext('2d');
    const ctxArtigos = document.getElementById('artigosChart')?.getContext('2d');
    const ctxInscritos = document.getElementById('inscritosChart')?.getContext('2d');

    if (!ctxCursos || !ctxArtigos || !ctxInscritos) return;

    // 📘 Cursos
    new Chart(ctxCursos, {
        type: 'bar',
        data: {
            labels: ['Cursos Publicados'],
            datasets: [{
                label: 'Total',
                data: [dados.cursosPublicados],
                backgroundColor: ['#E8AD21'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { display: false }
            }
        }
    });

    // 📘 Artigos
    new Chart(ctxArtigos, {
        type: 'bar',
        data: {
            labels: ['Artigos Publicados'],
            datasets: [{
                label: 'Total',
                data: [dados.artigosPublicados],
                backgroundColor: ['#007698'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { display: false }
            }
        }
    });

    // 📘 Inscritos
    new Chart(ctxInscritos, {
        type: 'bar',
        data: {
            labels: ['Inscritos'],
            datasets: [{
                label: 'Total',
                data: [dados.inscritos],
                backgroundColor: ['#28a745'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { display: false }
            }
        }
    });
}




document.addEventListener("DOMContentLoaded", async () => {
    await carregarContagensDashboard();
    const currentUser = (document.querySelector('.user-name')?.textContent || 'Admin').trim();
    setInterval(carregarContagensDashboard, 30000);

    // --- Notificações ---
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

    function escapeHtml(str = '') {
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

        const lidos = new Set(JSON.parse(localStorage.getItem('notificacoesLidas') || '[]'));
        let novasNaoLidas = 0;

        const items = notifications.map(n => {
            const notifId = `${n.tipo}-${n.data}`;
            const estaLida = lidos.has(notifId);
            if (!estaLida) novasNaoLidas++;

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
            } else if (n.tipo === 'inscricao' && n.cursoId) {
                icon = '🎓';
                iconClass = 'inscricao';
                url = `/curso/${n.cursoId}`;
                const autor = escapeHtml(n.autor || 'Alguém');
                const titulo = escapeXml(escapeHtml(n.cursoTitulo || 'um curso'));
                textoFormatado = `${autor} se inscreveu no curso<br><strong>"${titulo}"</strong>`;
            } else {
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

        list.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                const li = link.closest('li');
                const notifId = li?.dataset.notifId;
                if (notifId) {
                    lidos.add(notifId);
                    localStorage.setItem('notificacoesLidas', JSON.stringify(Array.from(lidos)));
                    li.classList.remove('unread');
                    const restantes = list.querySelectorAll('li.unread').length;
                    countBadge.textContent = restantes;
                    if (restantes === 0) countBadge.style.display = 'none';
                }
            });
        });
    }

    function formatarData(data) {
        const d = new Date(data);
        const hoje = new Date();
        const ontem = new Date();
        ontem.setDate(hoje.getDate() - 1);

        if (d.toDateString() === hoje.toDateString()) {
            return `Hoje • ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
        if (d.toDateString() === ontem.toDateString()) {
            return `Ontem • ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
        if (d.getFullYear() === hoje.getFullYear()) {
            const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
            return `${d.getDate()} ${meses[d.getMonth()]} • ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
        return d.toLocaleDateString('pt-BR') + ` • ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }

    bell?.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown?.classList.toggle("show");
        if (dropdown?.classList.contains("show")) {
            const lidos = new Set(JSON.parse(localStorage.getItem('notificacoesLidas') || '[]'));
            notifications.forEach(n => lidos.add(`${n.tipo}-${n.data}`));
            localStorage.setItem('notificacoesLidas', JSON.stringify(Array.from(lidos)));
            countBadge.style.display = 'none';
            renderNotifications();
        }
    });

    document.addEventListener('click', (e) => {
        if (!bell?.contains(e.target) && !dropdown?.contains(e.target)) {
            dropdown?.classList.remove("show");
        }
    });

    await fetchNotifications();
    setInterval(fetchNotifications, 8000);

    // --- Comentários ---
    let paginaAtual = 1;
    const comentariosPorPagina = 5;
    let listaComentarios = [];
    const container = document.getElementById("comentarios-container");

    async function carregarComentarios() {
        try {
            const res = await fetch("/api/comentarios/admin");
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
                    <div style="margin-top:6px;">
                        <button class="btn-acao btn-eliminar-resposta" data-comment-id="${c._id}" data-reply-id="${r._id}">
                            Eliminar resposta
                        </button>
                    </div>
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
                    </div>
                </div>
            `;
        }).join("");

        container.innerHTML += `
            <div class="paginacao">
                <button id="prevPage" ${paginaAtual === 1 ? "disabled" : ""}>Anterior</button>
                <span> Página ${paginaAtual} de ${totalPaginas} </span>
                <button id="nextPage" ${fim >= listaComentarios.length ? "disabled" : ""}>Próximo</button>
            </div>
        `;

        document.getElementById("prevPage")?.addEventListener("click", () => {
            if (paginaAtual > 1) { paginaAtual--; renderizarComentarios(); }
        });
        document.getElementById("nextPage")?.addEventListener("click", () => {
            if (paginaAtual < totalPaginas) { paginaAtual++; renderizarComentarios(); }
        });

        container.querySelectorAll('.ver-respostas-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-comment-id');
                toggleAccordion(id, btn);
            });
        });
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
        container.querySelectorAll('.btn-eliminar-resposta').forEach(b => {
            b.addEventListener('click', async (e) => {
                const commentId = b.getAttribute('data-comment-id');
                const replyId = b.getAttribute('data-reply-id');
                if (!confirm("Eliminar esta resposta?")) return;
                await eliminarResposta(commentId, replyId);
            });
        });
    }

 async function toggleAccordion(commentId, btn) {
    const wrapper = document.getElementById(`respostas-${commentId}`);
    if (!wrapper) return;
    const isExpanded = wrapper.classList.contains('expanded');

    if (isExpanded) {
        wrapper.classList.remove('expanded');
        btn.innerHTML = btn.innerHTML.replace('▾', '▸');
        return;
    }

    // ✅ Buscar o comentário já carregado (sem fazer nova requisição)
    const comentario = listaComentarios.find(c => c._id === commentId);
    if (!comentario) {
        wrapper.innerHTML = `<p>⚠️ Comentário não encontrado.</p>`;
        wrapper.classList.add('expanded');
        return;
    }

    const respostas = Array.isArray(comentario.respostas) ? comentario.respostas : [];
    if (respostas.length === 0) {
        wrapper.innerHTML = `<p>Nenhuma resposta.</p>`;
        wrapper.classList.add('expanded');
        return;
    }

    wrapper.innerHTML = respostas.map((r, idx) => `
        <div class="resposta-item">
            <div class="resposta-meta">${escapeHtml(r.autor || currentUser)} <span class="data-badge">${escapeHtml(formatarData(r.data || r.createdAt || Date.now()))}</span></div>
            <div class="resposta-texto">${escapeHtml(r.texto || '')}</div>
            <div style="margin-top:6px;">
                <button class="btn-acao btn-eliminar-resposta" data-comment-id="${commentId}" data-reply-id="${r._id}">
                    Eliminar resposta
                </button>
            </div>
        </div>
    `).join('') + `<div style="margin-top:8px;" class="responder-box-inline"></div>`;

    // Reanexar eventos
    wrapper.querySelectorAll('.btn-eliminar-resposta').forEach(b => {
        b.addEventListener('click', async (e) => {
            const replyId = b.getAttribute('data-reply-id');
            if (!confirm("Eliminar esta resposta?")) return;
            await eliminarResposta(commentId, replyId);
        });
    });

    const inlineBox = wrapper.querySelector('.responder-box-inline');
    inlineBox.innerHTML = '';
    inlineBox.appendChild(criarBoxRespostaDom(commentId));

    wrapper.classList.add('expanded');
    btn.innerHTML = btn.innerHTML.replace('▸', '▾');
}
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

    function abrirCaixaRespostaInline(commentId) {
        const commentEl = container.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentEl) return;
        if (commentEl.querySelector('.responder-box-inline-origin')) {
            commentEl.querySelector('.responder-box-inline-origin textarea').focus();
            return;
        }
        const box = criarBoxRespostaDom(commentId);
        const containerBox = document.createElement('div');
        containerBox.className = 'responder-box responder-box-inline-origin';
        containerBox.appendChild(box);
        const respostasWrapper = commentEl.querySelector('.respostas-wrapper');
        if (respostasWrapper) {
            respostasWrapper.parentNode.insertBefore(containerBox, respostasWrapper);
        } else {
            commentEl.appendChild(containerBox);
        }
        containerBox.querySelector('textarea').focus();
    }

    async function enviarResposta(commentId, { autor, texto }) {
        try {
            const res = await fetch(`/api/comentarios/${commentId}/respostas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autor, texto })
            });
            if (!res.ok) throw new Error('Erro ao enviar resposta');
            return await res.json();
        } catch (err) {
            throw err;
        }
    }

    async function eliminarResposta(commentId, replyId) {
        try {
            const res = await fetch(`/api/comentarios/${commentId}/respostas/${replyId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Erro ao eliminar resposta");
            await carregarComentarios();
        } catch (err) {
            console.error("Erro ao eliminar resposta:", err);
            alert('Erro ao eliminar resposta.');
        }
    }

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
            const res = await fetch(`/api/comentarios/${commentId}/like`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autor: currentUser })
            });
            if (!res.ok) throw new Error("Erro ao remover like");
            const data = await res.json();
            novaContagem = data.likes;
            const novosLiked = likedComments.filter(id => id !== commentId);
            localStorage.setItem('likedComments', JSON.stringify(novosLiked));
        } else {
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
