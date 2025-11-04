// ====== ABRIR MODAL ======
function openCourseModal(service) {
    const modal = document.getElementById("course-modal");
    const modalBody = document.getElementById("course-modal-body");

    let content = "";

    switch (service) {
        case "contabilidade":
            content = `
                <h2>Contabilidade e Fiscalidade</h2>
                <div class="modal-section">
                    <h3>Descrição do curso</h3>
 <p>Prestamos serviços completos de contabilidade e fiscalidade, garantindo conformidade legal, registos precisos e análises financeiras detalhadas para o seu negócio.</p>                </div>
                <div class="modal-section">
                    <h3>Objetivos</h3>
                    <ul>
                        <li>Garantir a conformidade com normas fiscais.</li>
                        <li>Organizar e controlar a contabilidade da empresa.</li>
                        <li>Fornecer relatórios financeiros confiáveis para tomada de decisão.</li>
                    </ul>
                </div>
                <div class="modal-section">
                   <h3>Ideal para</h3>
                    <p>Empresas de todos os portes que procuram gestão financeira sólida e profissional.</p>
                </div>
            `;
            break;

        case "custos":
            content = `
                <h2>Consultoria de Gestão</h2>
<div class="modal-section">
    <h3>Descrição do serviço</h3>
    <p>Oferecemos consultoria estratégica para otimizar processos, reduzir custos e aumentar a eficiência operacional da sua empresa.</p>
</div>
<div class="modal-section">
    <h3>Objetivos</h3>
    <ul>
        <li>Melhorar a performance operacional da empresa.</li>
        <li>Identificar oportunidades de crescimento e inovação.</li>
        <li>Orientar decisões estratégicas com base em dados.</li>
    </ul>
</div>
<div class="modal-section">
    <h3>Ideal para</h3>
    <p>Empresas que desejam melhorar a gestão interna e aumentar a competitividade.</p>
</div>

            `;
            break;

        case "fluxo":
            content = `
               <h2>Estudos de Viabilidade</h2>
<div class="modal-section">
    <h3>Descrição do serviço</h3>
    <p>Realizamos estudos completos de viabilidade para novos projetos ou investimentos, analisando riscos, retornos e oportunidades de mercado.</p>
</div>
<div class="modal-section">
    <h3>Objetivos</h3>
    <ul>
        <li>Fornecer análises detalhadas para decisões estratégicas.</li>
        <li>Avaliar a viabilidade financeira e operacional de projetos.</li>
        <li>Reduzir riscos e maximizar resultados dos investimentos.</li>
    </ul>
</div>
<div class="modal-section">
    <h3>Ideal para</h3>
    <p>Empresários e gestores que precisam de informações sólidas antes de iniciar novos projetos ou investimentos.</p>
</div>

            `;
            break;




        case "rh":
            content = `
              <h2>Recursos Humanos</h2>
<div class="modal-section">
    <h3>Descrição do serviço</h3>
    <p>Gestão completa de recursos humanos: recrutamento, folha de pagamento, contratos, férias e obrigações legais, com suporte especializado para empresas.</p>
</div>
<div class="modal-section">
    <h3>Objetivos</h3>
    <ul>
        <li>Automatizar processos de RH.</li>
        <li>Garantir conformidade legal e organizacional.</li>
        <li>Melhorar a gestão de talentos e desempenho da equipe.</li>
    </ul>
</div>
<div class="modal-section">
    <h3>Ideal para</h3>
    <p>Empresas que querem modernizar a gestão de pessoas de forma eficiente e segura.</p>
</div>

            `;
            break;

        default:
            content = "<p>Serviço não encontrado.</p>";
    }

    modalBody.innerHTML = content;
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

// ====== FECHAR MODAL ======
function closeCourseModal() {
    const modal = document.getElementById("course-modal");
    modal.style.display = "none";
    document.body.style.overflow = "";
}

// ====== FECHAR AO CLICAR FORA ======
window.addEventListener("click", function (event) {
    const modal = document.getElementById("course-modal");
    if (event.target === modal) {
        closeCourseModal();
    }
});
