// pagina-detalhe.js
// Script leve e seguro — só para a página cursodetalhe.html

// Fecha modal
function fecharModal() {
    const modal = document.getElementById("modalInscricao");
    if (modal) modal.classList.add("hidden");
}

// Só executa se estiver na página de detalhe
document.addEventListener("DOMContentLoaded", () => {
    // Botão de inscrição
    const btnEnviar = document.querySelector(".btn-enviar");
    if (btnEnviar) {
        btnEnviar.addEventListener("click", (e) => {
            e.preventDefault();
            const modal = document.getElementById("modalInscricao");
            if (modal) modal.classList.remove("hidden");

            // Preenche o cursoId no formulário
            const params = new URLSearchParams(window.location.search);
            const id = params.get("id");
            const inputCursoId = document.getElementById("cursoId");
            if (inputCursoId && id) {
                inputCursoId.value = id;
            }
        });
    }

    // Fechar modal ao clicar no "X"
    const fecharBtn = document.querySelector(".fechar");
    if (fecharBtn) {
        fecharBtn.addEventListener("click", fecharModal);
    }

    // Fechar modal ao clicar fora do conteúdo
    const modal = document.getElementById("modalInscricao");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) fecharModal();
        });
    }

    // Envio do formulário
    const form = document.getElementById("formInscricao");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nome = form.nome.value.trim();
            const email = form.email.value.trim();
            const telefone = form.telefone.value.trim();
            const cursoId = form.cursoId.value;

            if (!nome || !email || !telefone || !cursoId) {
                alert("Preencha todos os campos.");
                return;
            }

            const data = { nome, email, telefone, cursoId };

            try {
                // Enviar para o backend
                const res = await fetch("http://localhost:5000/api/inscricoes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const json = await res.json();
                document.getElementById("mensagemInscricao").textContent =
                    json.message || "Inscrição enviada com sucesso!";

                // Abrir WhatsApp
                const WHATSAPP_EMPRESA = "244937555618";
                const mensagem = `Nova inscrição:\nNome: ${nome}\nEmail: ${email}\nTelefone: ${telefone}\nID do curso: ${cursoId}`;
                const urlWhatsApp = `https://wa.me/${WHATSAPP_EMPRESA}?text=${encodeURIComponent(mensagem)}`;
                window.open(urlWhatsApp, "_blank");

                form.reset();
            } catch (err) {
                console.error("Erro ao enviar inscrição:", err);
                document.getElementById("mensagemInscricao").textContent = "Erro ao enviar. Tente novamente.";
            }
        });
    }
});