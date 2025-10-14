// ==========================
// cursodetalhe.js - script completo com debug, fallback e telefone no formulário
// ==========================

const API_URL = "http://localhost:5000"; // muda para produção quando necessário
const WHATSAPP_EMPRESA = "244937555618"; // número da empresa (formato: +244937555618)

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const cursoId = params.get("id");

    if (!cursoId) {
        console.error("❌ Nenhum ID de curso na URL. Ex.: cursodetalhe.html?id=<mongo_id>");
        alert("⚠️ Nenhum curso selecionado. Volta atrás e tenta 'Saiba Mais' num curso.");
        return;
    }

    console.log("➡️ Pedir dados do curso id:", cursoId);
    carregarDetalhesCurso(cursoId);
});

async function carregarDetalhesCurso(id) {
    const url = `${API_URL}/api/cursos/${id}`;
    try {
        const response = await fetch(url, { mode: "cors" });
        if (!response.ok) {
            const text = await response.text().catch(() => "<sem corpo>");
            console.error("❌ Resposta inválida da API:", response.status, text);
            alert(`Erro ao carregar curso (status ${response.status}). Ver consola.`);
            return;
        }

        const curso = await response.json();
        preencherEstrutura(curso);
    } catch (err) {
        console.error("❌ Erro no fetch/carregamento:", err);
        alert("Erro ao carregar curso. Ver console (F12) para mais detalhes.");
    }
}

function preencherEstrutura(curso) {
    if (!curso || typeof curso !== "object") return;

    // ---------- Banner ----------
    const tituloEl = document.querySelector(".treinamento-titulo");
    if (tituloEl) tituloEl.textContent = curso.titulo || "Sem título";

    const metaEl = document.querySelector(".treinamento-meta");
    if (metaEl) metaEl.innerHTML = `
        <span>Por <strong>${curso.autor || "Equipe ANGORGE"}</strong></span>
        <span>•</span>
        <span>Duração: ${curso.duracao || "Não informada"} horas</span>
        <span>•</span>
        <span>Modalidade: ${curso.tipo || "Online"}</span>
    `;

    const bannerImg = document.querySelector(".treinamento-banner-image img");
    if (bannerImg && curso.imagem) {
        let src = String(curso.imagem).trim();
        if (src.startsWith("http")) bannerImg.src = src;
        else if (src.startsWith("/")) bannerImg.src = `${API_URL}${src}`;
        else bannerImg.src = `${API_URL}/${src}`;
    }

    // ---------- Sobre o curso ----------
    const secoes = document.querySelectorAll(".secao-curso");
    if (secoes && secoes.length > 0) {
        const sobreP = secoes[0].querySelector("p");
        if (sobreP) sobreP.innerHTML = curso.descricao || "Descrição não disponível.";
    }

    // ---------- O que você vai aprender ----------
    const aprendizadoLista = document.querySelector(".aprendizado-lista");
    if (aprendizadoLista) {
        aprendizadoLista.innerHTML = "";
        const arr = Array.isArray(curso.aprendizado) ? curso.aprendizado : [];
        if (arr.length === 0) aprendizadoLista.innerHTML = `<li><i class="fas fa-check-circle"></i> Conteúdo em actualização.</li>`;
        else arr.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `<i class="fas fa-check-circle"></i> ${item}`;
            aprendizadoLista.appendChild(li);
        });
    }

    // ---------- Requisitos ----------
    const requisitosLista = document.querySelector(".requisitos-lista");
    if (requisitosLista) {
        requisitosLista.innerHTML = "";
        const arr = Array.isArray(curso.requisitos) ? curso.requisitos : [];
        if (arr.length === 0) requisitosLista.innerHTML = `<li><i class="fas fa-check-circle"></i> Nenhum requisito listado.</li>`;
        else arr.forEach(req => {
            const li = document.createElement("li");
            li.innerHTML = `<i class="fas fa-check-circle"></i> ${req}`;
            requisitosLista.appendChild(li);
        });
    }

    // ---------- Currículo ----------
    const curriculoLista = document.querySelector(".curriculo-lista");
    if (curriculoLista) {
        curriculoLista.innerHTML = "";
        const arr = Array.isArray(curso.curriculo) ? curso.curriculo : [];
        if (arr.length === 0) curriculoLista.innerHTML = `<li>Currículo em actualização.</li>`;
        else arr.forEach(secao => {
            const li = document.createElement("li");
            li.innerHTML = `
                <button class="curriculo-btn">${secao.titulo || "Módulo"}</button>
                <p class="conteudo-curriculo">${secao.conteudo || ""}</p>
            `;
            curriculoLista.appendChild(li);
        });
        curriculoLista.querySelectorAll('.curriculo-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.parentElement.classList.toggle('ativo'));
        });
    }

    // ---------- Sidebar ----------
    const sidebarUlList = document.querySelectorAll(".sidebar-box ul");
    if (sidebarUlList.length > 0) {
        const detalhesUl = sidebarUlList[0];
        detalhesUl.innerHTML = `
            <li><strong>Duração:</strong> ${curso.duracao || "—"} horas</li>
            <li><strong>Modalidade:</strong> ${curso.tipo || "Online"}</li>
            <li><strong>Nível:</strong> ${curso.nivel || "Iniciante a Intermediário"}</li>
            <li><strong>Preço:</strong> ${curso.preco || "Sob consulta"}</li>
        `;
    }

    if (sidebarUlList.length > 1) {
        const incluiUl = sidebarUlList[1];
        incluiUl.innerHTML = "";
        const arr = Array.isArray(curso.inclui) ? curso.inclui : [];
        if (arr.length === 0) incluiUl.innerHTML = `<li><i class="fas fa-dot-circle"></i> Informação em actualização.</li>`;
        else arr.forEach(it => {
            const li = document.createElement("li");
            li.innerHTML = `<i class="fas fa-dot-circle"></i> ${it}`;
            incluiUl.appendChild(li);
        });
    }
}

// ---------- Modal ----------
document.querySelector(".btn-enviar")?.addEventListener("click", (e) => {
    e.preventDefault();
    const modal = document.getElementById("modalInscricao");
    if (modal) modal.classList.remove("hidden");

    const params = new URLSearchParams(window.location.search);
    const cursoId = params.get("id");
    const input = document.getElementById("cursoId");
    if (input && cursoId) {
        input.value = cursoId;
    }
});

function fecharModal() {
    const modal = document.getElementById("modalInscricao");
    if (modal) modal.classList.add("hidden");
}

// Fecha modal ao clicar no "X" ou fora do conteúdo
document.querySelector(".fechar")?.addEventListener("click", fecharModal);
document.getElementById("modalInscricao")?.addEventListener("click", (e) => {
    if (e.target.id === "modalInscricao") fecharModal();
});

// ---------- Enviar inscrição ----------
document.getElementById("formInscricao")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation(); // 👈 adiciona esta linha para garantir

    const params = new URLSearchParams(window.location.search);
    const cursoId = params.get("id");

    if (!cursoId) {
        alert("⚠️ Erro: ID do curso não encontrado. Redirecionando...");
        window.location.href = "formacao.html";
        return;
    }

    const { nome, email, telefone } = Object.fromEntries(new FormData(e.target));
    if (!nome || !email || !telefone) {
        alert("Preencha todos os campos.");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/inscricoes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, telefone, cursoId })
        });

        const json = await res.json();
        document.getElementById("mensagemInscricao").textContent = json.message || "Inscrição enviada!";

        // ✅ WhatsApp sem espaço
        const mensagem = `Nova inscrição:\nNome: ${nome}\nEmail: ${email}\nTelefone: ${telefone}\nCurso ID: ${cursoId}`;
        // ✅ CERTO:
        const urlWhatsApp = `https://wa.me/${WHATSAPP_EMPRESA}?text=${encodeURIComponent(mensagem)}`;
        window.open(urlWhatsApp, "_blank");

        e.target.reset();
    } catch (err) {
        console.error("Erro na inscrição:", err);
        document.getElementById("mensagemInscricao").textContent = "Erro ao enviar. Tente novamente.";
    }
});