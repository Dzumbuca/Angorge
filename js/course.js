// ====== ABRIR MODAL ======
function openCourseModal(service) {
    const modal = document.getElementById("course-modal");
    const modalBody = document.getElementById("course-modal-body");

    let content = "";

    switch (service) {
        case "contabilidade":
            content = `
                <h2>Contabilidade Geral e Analítica</h2>
                <div class="modal-section">
                    <h3>Descrição do curso</h3>
                    <p>Aprenda todos os fundamentos da contabilidade, desde lançamentos, reconciliações e elaboração de balanços, até análise patrimonial detalhada. Este curso é ideal para quem quer dominar a gestão financeira de empresas com rigor e precisão.</p>
                </div>
                <div class="modal-section">
                    <h3>Objetivos</h3>
                    <ul>
                        <li>Compreender princípios contábeis e normas fiscais.</li>
                        <li>Elaborar demonstrações financeiras completas.</li>
                        <li>Interpretar relatórios e tomar decisões estratégicas.</li>
                    </ul>
                </div>
                <div class="modal-section">
                    <h3>Ideal para</h3>
                    <p>Empresários, gestores e profissionais que precisam de uma gestão financeira sólida e confiável.</p>
                </div>
            `;
            break;

        case "custos":
            content = `
                <h2>Custos e Gestão de Stocks</h2>
                <div class="modal-section">
                    <h3>Descrição do curso</h3>
                    <p>Domine métodos práticos para controlar custos, reduzir desperdícios e gerir inventários de forma eficiente. Aprenda a otimizar recursos e maximizar a rentabilidade da empresa.</p>
                </div>
                <div class="modal-section">
                    <h3>Objetivos</h3>
                    <ul>
                        <li>Implementar sistemas de controlo de custos.</li>
                        <li>Gerir stocks de forma inteligente.</li>
                        <li>Reduzir perdas e desperdícios operacionais.</li>
                    </ul>
                </div>
                <div class="modal-section">
                    <h3>Ideal para</h3>
                    <p>Empresas comerciais, industriais ou de serviços que procuram maior eficiência e controlo financeiro.</p>
                </div>
            `;
            break;

        case "fluxo":
            content = `
                <h2>Demonstração de Fluxo de Caixa no Primavera ERP</h2>
                <div class="modal-section">
                    <h3>Descrição do curso</h3>
                    <p>Aprenda a configurar e gerar relatórios completos de fluxo de caixa usando o Primavera ERP, permitindo analisar entradas e saídas de forma detalhada e tomar decisões financeiras fundamentadas.</p>
                </div>
                <div class="modal-section">
                    <h3>Objetivos</h3>
                    <ul>
                        <li>Configurar o módulo financeiro do Primavera ERP.</li>
                        <li>Gerar relatórios de fluxo de caixa detalhados.</li>
                        <li>Otimizar a tesouraria e liquidez da empresa.</li>
                    </ul>
                </div>
                <div class="modal-section">
                    <h3>Ideal para</h3>
                    <p>Gestores financeiros, contadores e empresas que desejam digitalizar e automatizar o controlo financeiro.</p>
                </div>
            `;
            break;

        case "office":
            content = `
                <h2>Pacote Office (Word, Excel, PowerPoint, Outlook, Access)</h2>
                <div class="modal-section">
                    <h3>Descrição do curso</h3>
                    <p>Formações práticas e completas de todas as ferramentas do Office. Aprenda a criar documentos profissionais, planilhas complexas, apresentações impactantes e gerir emails de forma eficiente.</p>
                </div>
                <div class="modal-section">
                    <h3>Objetivos</h3>
                    <ul>
                        <li>Dominar Word, Excel, PowerPoint, Outlook e Access.</li>
                        <li>Aplicar técnicas avançadas de produtividade.</li>
                        <li>Automatizar tarefas do dia a dia com eficiência.</li>
                    </ul>
                </div>
                <div class="modal-section">
                    <h3>Ideal para</h3>
                    <p>Estudantes, profissionais e empresas que querem maximizar a produtividade e organização interna.</p>
                </div>
            `;
            break;

        case "excel":
            content = `
                <h2>Excel Avançado</h2>
                <div class="modal-section">
                    <h3>Descrição do curso</h3>
                    <p>Explore funções avançadas, tabelas dinâmicas, dashboards interativos e macros com VBA para automatizar relatórios e análises de dados complexas. Perfeito para profissionais que querem ir além do básico.</p>
                </div>
                <div class="modal-section">
                    <h3>Objetivos</h3>
                    <ul>
                        <li>Aprender fórmulas complexas e funções avançadas.</li>
                        <li>Construir dashboards e relatórios automatizados.</li>
                        <li>Utilizar macros e VBA para automação.</li>
                    </ul>
                </div>
                <div class="modal-section">
                    <h3>Ideal para</h3>
                    <p>Contabilistas, gestores, analistas de dados e todos que querem elevar o nível no Excel.</p>
                </div>
            `;
            break;

        case "rh":
            content = `
                <h2>Recursos Humanos no Primavera ERP</h2>
                <div class="modal-section">
                    <h3>Descrição do curso</h3>
                    <p>Aprenda a gerir contratos, salários, férias e obrigações legais usando o módulo de RH do Primavera ERP. Inclui formação prática e suporte completo para automatizar processos de gestão de pessoal.</p>
                </div>
                <div class="modal-section">
                    <h3>Objetivos</h3>
                    <ul>
                        <li>Gerir contratos e folhas de pagamento com precisão.</li>
                        <li>Controlar férias, licenças e benefícios.</li>
                        <li>Integrar o módulo de RH com contabilidade e finanças.</li>
                    </ul>
                </div>
                <div class="modal-section">
                    <h3>Ideal para</h3>
                    <p>Empresas que desejam modernizar e automatizar a gestão de recursos humanos.</p>
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
