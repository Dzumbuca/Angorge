// Menu responsivo
function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    const overlay = document.getElementById('overlay');
    navLinks.classList.toggle('show');
    overlay.classList.toggle('show');
}

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay');
    const heroText = document.querySelector('.hero-text');
    const heroImage = document.querySelector('.hero-image');
    const h2 = document.querySelector('.experience-content h2');
    const subtitle = document.querySelector('.subtitle2');

    // Fecha menu ao clicar no overlay
    overlay?.addEventListener('click', toggleMenu);

    // Animação inicial Hero + textos
    setTimeout(() => {
        heroText?.classList.add('visible');
        heroImage?.classList.add('visible');

        // Forçar logo que apareçam
        h2?.classList.add('animate');
        subtitle?.classList.add('animate');
    }, 100);

    // Ativar animação no scroll
    animateOnScroll();

    // ======================================
    // Contagem animada dos números (Stats)
    // ======================================
    const counters = document.querySelectorAll('.stat-number');

    counters.forEach((counter, index) => {
        if (index === 0) return;
        counter.innerText = '0+';

        const updateCounter = () => {
            const target = +counter.getAttribute('data-target');
            const current = +counter.innerText.replace(/\D/g, '');
            const increment = target / 200;

            if (current < target) {
                counter.innerText = `${Math.ceil(current + increment)}+`;
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = `${target}+`;
            }
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 1 });

        observer.observe(counter);
    });

    // ======================================
    // Botão Scroll para Topo
    // ======================================
    const scrollBtn = document.getElementById("scrollTopBtn");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            scrollBtn.style.display = "block";
        } else {
            scrollBtn.style.display = "none";
        }
    });

    scrollBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});

// Função para animar elementos ao rolar
function animateOnScroll() {
    const elements = document.querySelectorAll(
        'section, .service-card, .team-content, .experience-content h2, .subtitle2, .feature-img-card'
    );

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    elements.forEach(el => observer.observe(el));
}
