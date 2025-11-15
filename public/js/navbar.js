// js/navbar.js

// HTML do navbar como string
const navbarHTML = `
<nav class="navbar">
    <div class="logo">
        <a href="index.html">
            <img src="Imagem/brancod.png" alt="ANGORGE LDA" class="logo-img logo-branco" />
            <img src="Imagem/Ativo 1.svg" alt="ANGORGE LDA" class="logo-img logo-preto" />
        </a>
    </div>

    <div class="hamburger" id="hamburger">
        <span>☰</span>
    </div>

    <ul class="nav-links" id="navLinks">
        <li><a href="index.html">Início</a></li>
        <li><a href="sobre.html">Sobre</a></li>
        <li><a href="servico.html">Serviços</a></li>
        <li><a href="fomacao.html">Formação</a></li>
        <li><a href="artigosfront.html">Blog</a></li>
        <li><a href="contacto.html">Contacto</a></li>
    </ul>

    <div class="overlay" id="overlay"></div>
</nav>
`;

// Inserir navbar no DOM quando estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('navbar-container');
    if (container) {
        container.innerHTML = navbarHTML;
        initNavbar();
        setActiveNavLink();
        handleNavbarScrollEffect();
    }
});

// Configurar interações do menu
function initNavbar() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const overlay = document.getElementById('overlay');

    if (!navLinks) return;

    // Função para alternar menu
    const toggleMenu = () => {
        navLinks.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
    };

    // Abrir/fechar com hambúrguer
    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }

    // Fechar ao clicar no overlay
    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }

    // Fechar ao clicar em qualquer link
    const allLinks = navLinks.querySelectorAll('a');
    allLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    });
}

// Marcar link ativo conforme a página atual
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (
            href === currentPage ||
            (currentPage === 'index.html' && href === 'index.html')
        ) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Efeito de scroll: mudar fundo e cor do logo/texto
function handleNavbarScrollEffect() {
    const navbar = document.querySelector('.navbar');
    const logoBranco = document.querySelector('.logo-branco');
    const logoPreto = document.querySelector('.logo-preto');
    const navLinks = document.querySelectorAll('.nav-links a');

    if (!navbar || !logoBranco || !logoPreto) return;

    const updateNavbarStyle = () => {
        if (window.scrollY > 50) {
            // Estilo com scroll
            navbar.style.background = 'rgba(255, 255, 255, 0.8)';
            navbar.style.backdropFilter = 'blur(12px)';
            navbar.style.boxShadow = '0 1px 10px rgba(0, 0, 0, 0.1)';
            logoBranco.style.opacity = '0';
            logoPreto.style.opacity = '1';
            navLinks.forEach(a => a.style.color = '#000');
        } else {
            // Estilo no topo (transparente)
            navbar.style.background = 'rgba(255, 255, 255, 0.1)';
            navbar.style.backdropFilter = 'blur(6px)';
            navbar.style.boxShadow = 'none';
            logoBranco.style.opacity = '1';
            logoPreto.style.opacity = '0';
            navLinks.forEach(a => a.style.color = '#fff');
        }
    };

    window.addEventListener('scroll', updateNavbarStyle);
    updateNavbarStyle(); // Executar ao carregar
}