// Função para animar elementos ao rolar
function animateOnScroll() {
    const elements = document.querySelectorAll(
        'section, .service-card, .team-content, .experience-content h2, .subtitle2, .feature-img-card'
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    elements.forEach(el => observer.observe(el));
}

// Carregar cursos do JSON
async function loadCourses() {
    try {
        const response = await fetch('data/cursos.json');
        if (!response.ok) throw new Error(`Erro ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error("Erro ao carregar cursos:", err);
        throw err;
    }
}

// Render público
async function renderCoursesPublic() {
    const container = document.getElementById('cursos-list');
    if (!container) return;

    try {
        const cursos = await loadCourses();
        if (cursos.length === 0) {
            container.innerHTML = '<p>Nenhum curso disponível no momento.</p>';
            return;
        }

        container.innerHTML = '';
        cursos.forEach(curso => {
            const card = document.createElement('div');
            card.className = 'course-card';
            card.innerHTML = `
                <img src="Imagem/curso1.png" alt="${curso.titulo}" class="course-image">
                <div class="course-category">${curso.categoria}</div>
                <div class="course-modalidade">${curso.modalidade}</div>
                <h3 class="course-title">${curso.titulo}</h3>
                <p class="course-description">${curso.descricao}</p>
                <div class="course-footer">
                    <span class="duration">${curso.duracao}</span>
                    <div class="action">
                        <button class="btn btn-secondary">Solicite orçamento</button>
                        <button class="btn btn-primary">Disponível Agora</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        container.innerHTML = `
            <p style="color: #e74c3c; text-align: center;">
                Falha ao carregar cursos. Tente novamente mais tarde.
            </p>
        `;
    }
}

// Render admin
async function renderCoursesAdmin() {
    const container = document.getElementById('cursos-list');
    if (!container) return;

    try {
        const cursos = await loadCourses();
        if (cursos.length === 0) {
            container.innerHTML = '<p>Nenhum curso cadastrado.</p>';
            return;
        }

        container.innerHTML = '';
        cursos.forEach(curso => {
            const card = document.createElement('div');
            card.className = 'course-card';
            card.innerHTML = `
                <img src="Imagem/curso1.png" alt="${curso.titulo}" class="course-image">
                <div class="course-category">${curso.categoria}</div>
                <div class="course-modalidade">${curso.modalidade}</div>
                <h3 class="course-title">${curso.titulo}</h3>
                <p class="course-description">${curso.descricao}</p>
                <div class="course-footer">
                    <span class="duration">${curso.duracao}</span>
                    <div class="action">
                        <button class="btn btn-secondary">Editar</button>
                        <button class="btn btn-primary">Excluir</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        container.innerHTML = `
            <p style="color: #e74c3c; text-align: center;">
                Erro ao carregar cursos (admin).
            </p>
        `;
    }
}

// Inicialização principal
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // 1. Animações iniciais
    const heroText = document.querySelector('.hero-text');
    const heroImage = document.querySelector('.hero-image');
    const h2 = document.querySelector('.experience-content h2');
    const subtitle = document.querySelector('.subtitle2');

    if (heroText || heroImage || h2 || subtitle) {
        setTimeout(() => {
            heroText?.classList.add('visible');
            heroImage?.classList.add('visible');
            h2?.classList.add('animate');
            subtitle?.classList.add('animate');
        }, 100);
    }

    // 2. Animação ao scroll
    animateOnScroll();

    // 3. Contadores de estatísticas
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach((counter, index) => {
        if (index === 0) return;
        const target = +counter.getAttribute('data-target');
        if (!target) return;

        counter.innerText = '0';

        const updateCounter = () => {
            const current = +counter.innerText.replace(/\D/g, '');
            const increment = Math.ceil(target / 200);
            if (current < target) {
                counter.innerText = `${current + increment}`;
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = target.toLocaleString();
            }
        };

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.6 });

        observer.observe(counter);
    });

    // 4. Botão scroll para o topo
    const scrollBtn = document.getElementById("scrollTopBtn");
    if (scrollBtn) {
        const toggleScrollBtn = () => {
            scrollBtn.style.display = window.scrollY > 300 ? "block" : "none";
        };
        window.addEventListener("scroll", toggleScrollBtn);
        toggleScrollBtn();

        scrollBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // 5. Parallax na seção de estatísticas
    const statsSection = document.querySelector(".stats-section");
    const statsBg = document.querySelector(".stats-bg");

    if (statsSection && statsBg) {
        function handleParallax() {
            if (window.innerWidth <= 768) {
                statsBg.style.backgroundPosition = "center center";
                return;
            }
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            const sectionTop = statsSection.offsetTop;
            const scrollIn = scrollY - sectionTop;
            const parallaxSpeed = 0.3;
            const yPos = scrollIn * -parallaxSpeed;
            const initialOffset = 150;
            statsBg.style.backgroundPosition = `center ${yPos + initialOffset}px`;
        }

        window.addEventListener("scroll", handleParallax, { passive: true });
        handleParallax();
    }

    // 6. Animação dos stat-cards
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length > 0) {
        const statsObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        statCards.forEach(card => statsObserver.observe(card));
    }

    // 7. Carregar cursos conforme a página
    if (path.includes('cursos.html') && document.getElementById('cursos-list')) {
        renderCoursesPublic();
    } else if (path.includes('admin-cursos.html') && document.getElementById('cursos-list')) {
        renderCoursesAdmin();
    }

    // 8. Formulário de adição de curso (admin)
    const cursoForm = document.getElementById('curso-form');
    if (cursoForm) {
        cursoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(cursoForm);
            const novoCurso = {
                id: Date.now(),
                categoria: formData.get('categoria'),
                modalidade: formData.get('modalidade'),
                titulo: formData.get('titulo'),
                descricao: formData.get('descricao'),
                duracao: formData.get('duracao'),
                status: formData.get('status')
            };
            alert('Curso adicionado com sucesso!');
            cursoForm.reset();
        });
    }
});
document.addEventListener("DOMContentLoaded", function () {
    fetch("navbar.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("navbar-placeholder").innerHTML = data;

            // Depois de o menu estar no DOM, carrega o JS do menu
            const script = document.createElement("script");
            script.src = "js/navbar.js";
            document.body.appendChild(script);
        })
        .catch(error => console.error("Erro ao carregar o menu:", error));
});