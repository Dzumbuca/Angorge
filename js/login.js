document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value;
    const password = document.getElementById("password").value;
    const errorDiv = document.getElementById("login-error");

    // limpa mensagens antigas e remove classe show
    errorDiv.textContent = "";
    errorDiv.classList.remove("show");

    try {
        const response = await fetch("http://localhost:5000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, senha: password })
        });

        if (!response.ok) {
            const data = await response.json();
            showError(data.error || "Erro ao fazer login");
            return;
        }

        // login ok
        localStorage.setItem("user", nome);
        window.location.href = "dashbord.html";

    } catch (err) {
        console.error(err);
        showError("Erro ao conectar ao servidor");
    }

    // função para mostrar erro com animação
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.add("show");

        // desaparece depois de 3 segundos
        setTimeout(() => {
            errorDiv.classList.remove("show");
            errorDiv.textContent = "";
        }, 3000);
    }
});
