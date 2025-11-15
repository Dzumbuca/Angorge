
// Detecta ambiente local ou Render
const API_BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://angorge-1.onrender.com"; // <-- mete aqui o URL REAL do teu backend


document.addEventListener('DOMContentLoaded', async () => {
    const messageDiv = document.getElementById('curso-message');

    const showMessage = (msg, type = 'error') => {
        messageDiv.textContent = msg;
        messageDiv.style.color = type === 'success' ? 'green' : 'red';
        messageDiv.classList.add('show');

        setTimeout(() => {
            messageDiv.classList.remove('show');
            messageDiv.textContent = '';
        }, 4000); // some depois de 4 segundos
    };

    const params = new URLSearchParams(window.location.search);
    const cursoId = params.get('id');

    if (!cursoId) {
        showMessage('ID do curso não encontrado!', 'error');

        return;
    }

    // Seletores
    const titulo = document.getElementById('titulo');
    const descricao = document.getElementById('descricao');
    const autor = document.getElementById('autor');
    const preco = document.getElementById('preco');
    const tipoRadios = document.getElementsByName('tipo');
    const categoria = document.getElementById('categoria');
    const duracao = document.getElementById('duracao');
    const statusRadios = document.getElementsByName('status');
    const imagemPreview = document.getElementById('previewImg');
    const inputImagem = document.getElementById('imagemCurso');

    const aprendizadoWrapper = document.getElementById('aprendizado-wrapper');
    const requisitosWrapper = document.getElementById('requisitos-wrapper');
    const incluiWrapper = document.getElementById('inclui-wrapper');
    const curriculoWrapper = document.getElementById('curriculo-wrapper');

    const btnSalvar = document.getElementById('btn-salvar-curso');

    // ---------- Funções auxiliares ----------
    const popularLista = (wrapper, items) => {
        wrapper.innerHTML = '';
        (items || []).forEach(item => {
            const div = document.createElement('div');
            div.classList.add('item-requisito');
            div.innerHTML = `
                <input type="text" value="${item}" />
                <button type="button" class="remover-item">Remover</button>
            `;
            wrapper.appendChild(div);
            div.querySelector('.remover-item').addEventListener('click', () => div.remove());
        });
    };

    const popularCurriculo = (wrapper, curriculo) => {
        wrapper.innerHTML = '';
        (curriculo || []).forEach(aula => {
            const div = document.createElement('div');
            div.classList.add('item-requisito');
            div.dataset.titulo = aula.titulo;
            div.dataset.conteudo = aula.conteudo;
            div.textContent = `${aula.titulo} - ${aula.conteudo}`;
            wrapper.appendChild(div);
        });
    };

    const extrairItensLista = wrapper => Array.from(wrapper.children)
        .map(div => div.querySelector('input') ? div.querySelector('input').value.trim() : div.textContent.trim());

    const extrairCurriculo = wrapper => Array.from(wrapper.children).map(div => ({
        titulo: div.dataset.titulo,
        conteudo: div.dataset.conteudo
    }));

    // ---------- Carregar dados do curso ----------
    try {
        const response = await fetch(`${API_BASE_URL}/api/cursos/${cursoId}`);

        if (!response.ok) throw new Error('Erro ao carregar curso');
        const curso = await response.json();

        titulo.value = curso.titulo || '';
        descricao.value = curso.descricao || '';
        autor.value = curso.autor || '';
        preco.value = curso.preco || '';
        duracao.value = curso.duracao || '';
        categoria.value = curso.categoria || '';
        imagemPreview.src = curso.imagem
            ? `${API_BASE_URL}${curso.imagem}`
            : 'https://via.placeholder.com/800x500?text=Curso+Sem+Imagem';


        Array.from(tipoRadios).forEach(r => r.checked = r.value === curso.tipo);
        Array.from(statusRadios).forEach(r => r.checked = r.value.toLowerCase() === (curso.status || '').toLowerCase());

        popularLista(aprendizadoWrapper, curso.aprendizado);
        popularLista(requisitosWrapper, curso.requisitos);
        popularLista(incluiWrapper, curso.inclui);
        popularCurriculo(curriculoWrapper, curso.curriculo);

    } catch (err) {
        console.error(err);
        alert('Erro ao carregar dados do curso');
    }

    // ---------- Eventos ----------

    // Adicionar itens dinâmicos
    const adicionarItem = (inputId, wrapper) => {
        const input = document.getElementById(inputId);
        if (input.value.trim() !== '') {
            const div = document.createElement('div');
            div.classList.add('item-requisito');
            div.innerHTML = `
                <input type="text" value="${input.value.trim()}" />
                <button type="button" class="remover-item">Remover</button>
            `;
            wrapper.appendChild(div);
            input.value = '';
            div.querySelector('.remover-item').addEventListener('click', () => div.remove());
        }
    };

    document.getElementById('adicionar-aprendizado').addEventListener('click', () => adicionarItem('novo-aprendizado', aprendizadoWrapper));
    document.getElementById('adicionar-requisito').addEventListener('click', () => adicionarItem('novo-requisito', requisitosWrapper));
    document.getElementById('adicionar-inclui').addEventListener('click', () => adicionarItem('novo-inclui', incluiWrapper));

    document.getElementById('adicionar-curriculo').addEventListener('click', () => {
        const tituloAula = document.getElementById('titulo-aula').value.trim();
        const descricaoAula = document.getElementById('descricao-aula').value.trim();
        if (tituloAula && descricaoAula) {
            const div = document.createElement('div');
            div.classList.add('item-requisito');
            div.dataset.titulo = tituloAula;
            div.dataset.conteudo = descricaoAula;
            div.textContent = `${tituloAula} - ${descricaoAula}`;
            curriculoWrapper.appendChild(div);
            document.getElementById('titulo-aula').value = '';
            document.getElementById('descricao-aula').value = '';
        }
    });

    // Upload e preview de imagem
    document.querySelector('.btn-change').addEventListener('click', () => inputImagem.click());
    document.querySelector('.upload-area').addEventListener('click', () => inputImagem.click());

    inputImagem.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            if (imagemPreview.src) URL.revokeObjectURL(imagemPreview.src);
            imagemPreview.src = URL.createObjectURL(file);
        }
    });

    // Nova categoria
    document.getElementById('adicionar-categoria').addEventListener('click', () => {
        const novaCatInput = document.getElementById('nova-categoria');
        const novaCat = novaCatInput.value.trim();
        if (novaCat) {
            const option = document.createElement('option');
            option.value = novaCat.toLowerCase();
            option.textContent = novaCat;
            categoria.appendChild(option);
            categoria.value = novaCat.toLowerCase();
            novaCatInput.value = '';
        }
    });

    // ---------- Salvar curso ----------
    btnSalvar.addEventListener('click', async () => {
        if (!titulo.value.trim() || !descricao.value.trim()) {
            alert('Título e descrição são obrigatórios!');
            return;
        }

        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';

        const formData = new FormData();
        formData.append('titulo', titulo.value);
        formData.append('descricao', descricao.value);
        formData.append('autor', autor.value);
        formData.append('categoria', categoria.value);
        formData.append('duracao', duracao.value);
        formData.append('preco', preco.value);

        const tipoSelecionado = Array.from(tipoRadios).find(r => r.checked)?.value || '';
        const statusSelecionado = Array.from(statusRadios).find(r => r.checked)?.value || '';

        formData.append('tipo', tipoSelecionado);
        formData.append('status', statusSelecionado);

        formData.append('aprendizado', JSON.stringify(extrairItensLista(aprendizadoWrapper)));
        formData.append('requisitos', JSON.stringify(extrairItensLista(requisitosWrapper)));
        formData.append('inclui', JSON.stringify(extrairItensLista(incluiWrapper)));
        formData.append('curriculo', JSON.stringify(extrairCurriculo(curriculoWrapper)));

        if (inputImagem.files[0]) formData.append('imagem', inputImagem.files[0]);

        try {
            const response = await fetch(`${API_BASE_URL}/api/cursos/${cursoId}`, {
                method: 'PUT',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('✅ Curso atualizado com sucesso!', 'success');

                window.location.href = "cursos.html";
            } else {
                alert('❌ Erro: ' + (result.error || 'Falha ao atualizar'));
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão ao salvar curso');
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar Alterações';
        }
    });
});


