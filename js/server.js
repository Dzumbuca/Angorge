// ==========================
// 📌 IMPORTS
// ==========================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const Artigo = require("./Artigo.js");
const User = require("./modelsUser.js");
const Curso = require("./Curso.js");
const dashboardRoutes = require("./admin.js");
const Comentario = require("./Comentario.js");
const Inscricao = require("./Inscricao.js");

// ==========================
// 📌 CONFIGURAÇÃO DO APP
// ==========================
const app = express();
app.use(cors());
app.use(express.json());

// 👇 Servir arquivos estáticos (HTML, CSS, JS, imagens) da pasta raiz do site (Site/)
app.use(express.static(path.join(__dirname, "../Site"))); // ou ../public


// 👇 Servir arquivos de upload (imagens de cursos/artigos)
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// ==========================
// 📌 CONEXÃO COM MONGODB
// ==========================
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/teuBanco";
mongoose.connect(MONGODB_URI)
    .then(() => console.log("✅ Conectado ao MongoDB"))
    .catch(err => console.error("❌ Erro ao conectar:", err));

// ==========================
// 📌 CONFIGURAÇÃO DO MULTER
// ==========================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/uploads")); // ✅ pasta correta
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

app.use("/api", dashboardRoutes);

// ==========================
// 📌 ROTAS CURSOS
// ==========================

// Criar curso
app.post("/api/cursos", upload.single("imagem"), async (req, res) => {
    try {
        const {
            titulo, autor, tipo, categoria, duracao,
            descricao, aprendizado, requisitos, curriculo, inclui,
            preco, status
        } = req.body;

        const imagem = req.file ? `/uploads/${req.file.filename}` : null;

        const novoCurso = new Curso({
            titulo,
            autor: autor || "Equipe ANGORGE",
            tipo: tipo || "Treinamento",
            categoria,
            duracao,
            descricao,
            aprendizado: aprendizado ? JSON.parse(aprendizado) : [],
            requisitos: requisitos ? JSON.parse(requisitos) : [],
            curriculo: processarCurriculo(curriculo),
            inclui: inclui ? JSON.parse(inclui) : [],
            preco: processarPreco(preco),
            status,
            imagem
        });

        await novoCurso.save();
        res.status(201).json({ message: "✅ Curso criado com sucesso!", curso: novoCurso });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao salvar curso" });
    }
});

// Atualizar curso
app.put("/api/cursos/:id", upload.single("imagem"), async (req, res) => {
    try {
        let curriculo = processarCurriculo(req.body.curriculo);
        curriculo = curriculo.filter(item => item.conteudo && item.conteudo.trim() !== "");

        const updateData = {
            titulo: req.body.titulo,
            categoria: req.body.categoria,
            duracao: req.body.duracao,
            descricao: req.body.descricao,
            tipo: req.body.tipo,
            status: req.body.status,
            autor: req.body.autor || "Equipe ANGORGE",
            preco: processarPreco(req.body.preco),
            aprendizado: req.body.aprendizado ? JSON.parse(req.body.aprendizado) : [],
            requisitos: req.body.requisitos ? JSON.parse(req.body.requisitos) : [],
            inclui: req.body.inclui ? JSON.parse(req.body.inclui) : [],
            curriculo
        };

        if (req.file) {
            updateData.imagem = `/uploads/${req.file.filename}`;
        }

        const curso = await Curso.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!curso) {
            return res.status(404).json({ message: "Curso não encontrado" });
        }

        res.json({ message: "✅ Curso atualizado com sucesso!", curso });
    } catch (error) {
        console.error("Erro ao atualizar curso:", error);
        res.status(500).json({ error: "Erro ao atualizar curso" });
    }
});

// Listar cursos
app.get("/api/cursos", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const total = await Curso.countDocuments();
        const cursos = await Curso.find().skip(skip).limit(limit);

        res.json({
            cursos,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao buscar cursos" });
    }
});

// Buscar curso por ID
app.get("/api/cursos/:id", async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ message: "Curso não encontrado" });
        res.json(curso);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar curso" });
    }
});

// Deletar curso
app.delete("/api/cursos/:id", async (req, res) => {
    try {
        const curso = await Curso.findByIdAndDelete(req.params.id);
        if (!curso) return res.status(404).json({ message: "Curso não encontrado" });
        res.json({ message: "🗑️ Curso removido com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao remover curso" });
    }
});

// ==========================
// 📌 FUNÇÕES AUXILIARES
// ==========================
function processarCurriculo(curriculo) {
    if (!curriculo) return [];
    if (typeof curriculo === "string") {
        try {
            const arr = JSON.parse(curriculo);
            if (Array.isArray(arr)) {
                return arr.map(item => {
                    if (typeof item === "string") {
                        const [titulo, conteudo] = item.split(":");
                        return { titulo: titulo?.trim() || "", conteudo: conteudo?.trim() || "" };
                    }
                    return item;
                });
            }
        } catch {
            if (curriculo.includes(":")) {
                const [titulo, conteudo] = curriculo.split(":");
                return [{ titulo: titulo.trim(), conteudo: conteudo.trim() }];
            }
            return [];
        }
    }
    if (Array.isArray(curriculo)) return curriculo;
    return [];
}

function processarPreco(preco) {
    if (!preco) return 0;
    if (typeof preco === "string" && preco.toLowerCase() === "sob consulta") return preco;
    return Number(preco) || 0;
}

// ==========================
// 📌 ROTAS UTILIZADOR
// ==========================
app.post("/api/register", async (req, res) => {
    try {
        const { nome, senha } = req.body;
        if (!nome || !senha) return res.status(400).json({ error: "⚠️ Nome e senha são obrigatórios" });

        const userExistente = await User.findOne({ nome });
        if (userExistente) return res.status(400).json({ message: "⚠️ Este nome já está registado" });

        const novoUser = new User({ nome, senha });
        await novoUser.save();
        res.json({ message: "✅ Utilizador registado com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao registar utilizador" });
    }
});

app.post("/api/login", async (req, res) => {
    const { nome, senha } = req.body;
    if (!nome || !senha) return res.status(400).json({ error: "Nome e senha obrigatórios" });

    try {
        const user = await User.findOne({ nome });
        if (!user || senha !== user.senha) return res.status(401).json({ error: "Nome ou senha inválidos" });
        res.json({ message: "✅ Login realizado com sucesso!", user: { nome: user.nome } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro no servidor" });
    }
});

// ==========================
// 📌 ROTAS ARTIGOS
// ==========================
app.get("/api/artigos", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const total = await Artigo.countDocuments();
        const artigos = await Artigo.find().skip(skip).limit(limit);
        res.json({ artigos, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao buscar artigos" });
    }
});

app.get("/api/artigos/:id", async (req, res) => {
    try {
        const artigo = await Artigo.findById(req.params.id);
        if (!artigo) return res.status(404).json({ message: "Artigo não encontrado" });
        res.json(artigo);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar artigo" });
    }
});

app.post("/api/artigos", upload.single("imagem"), async (req, res) => {
    try {
        const { titulo, categoria, autor, dataPublicacao, descricao, status } = req.body;
        if (!titulo || !descricao) {
            return res.status(400).json({ message: "⚠️ Campos obrigatórios: titulo e descricao" });
        }
        const imagem = req.file ? `/uploads/${req.file.filename}` : null;
        const novoArtigo = new Artigo({ titulo, categoria, autor, dataPublicacao, descricao, status, imagem });
        await novoArtigo.save();
        res.status(201).json({ message: "✅ Artigo criado com sucesso!", artigo: novoArtigo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao salvar artigo" });
    }
});

app.put("/api/artigos/:id", upload.single("imagem"), async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) updateData.imagem = `/uploads/${req.file.filename}`;
        const artigo = await Artigo.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!artigo) return res.status(404).json({ message: "Artigo não encontrado" });
        res.json({ message: "✅ Artigo atualizado com sucesso!", artigo });
    } catch (error) {
        console.error("Erro ao atualizar artigo:", error);
        res.status(500).json({ error: "Erro ao atualizar artigo" });
    }
});

app.delete("/api/artigos/:id", async (req, res) => {
    try {
        const artigo = await Artigo.findByIdAndDelete(req.params.id);
        if (!artigo) return res.status(404).json({ message: "Artigo não encontrado" });
        res.json({ message: "🗑️ Artigo removido com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao remover artigo" });
    }
});

// ==========================
// 📌 ROTAS COMENTÁRIOS
// ==========================
app.get("/api/artigos/:id/comentarios", async (req, res) => {
    try {
        const comentarios = await Comentario.find({ artigoId: req.params.id }).sort({ data: -1 });
        res.json(comentarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar comentários" });
    }
});

app.post("/api/artigos/:id/comentarios", async (req, res) => {
    try {
        const { autor, texto } = req.body;
        if (!texto) return res.status(400).json({ error: "⚠️ O comentário não pode estar vazio" });
        const novoComentario = new Comentario({ artigoId: req.params.id, autor: autor || "Anónimo", texto });
        await novoComentario.save();
        res.status(201).json({ message: "✅ Comentário adicionado com sucesso!", comentario: novoComentario });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao salvar comentário" });
    }
});

// Rota para buscar notificações recentes
app.get("/api/notificacoes", async (req, res) => {
    try {
        const comentarios = await Comentario.find().sort({ data: -1 }).limit(5);
        const inscricoes = await Inscricao.find().sort({ data: -1 }).limit(5);

        const notificacoes = [];

        comentarios.forEach(c => {
            notificacoes.push({
                tipo: "comentario",
                texto: `Novo comentário de ${c.autor}`,
                data: c.data // adiciona a data
            });
        });

        inscricoes.forEach(i => {
            notificacoes.push({
                tipo: "inscricao",
                texto: `Nova inscrição de ${i.nome}`,
                data: i.data // adiciona a data
            });
        });

        // Ordenar por data mais recente
        notificacoes.sort((a, b) => new Date(b.data) - new Date(a.data));

        res.json(notificacoes.slice(0, 10)); // enviar apenas 10 mais recentes
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar notificações" });
    }
});



// ==========================
// 📌 ROTA DE INSCRIÇÕES
// ==========================
app.post("/api/inscricoes", async (req, res) => {
    try {
        const { nome, email, telefone, cursoId } = req.body;
        if (!nome || !email || !cursoId) {
            return res.status(400).json({ error: "Campos obrigatórios: nome, email e cursoId" });
        }
        const novaInscricao = new Inscricao({ nome, email, telefone, cursoId });
        await novaInscricao.save();
        res.status(201).json({ message: "✅ Inscrição salva com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar inscrição:", error);
        res.status(500).json({ error: "Erro ao salvar inscrição" });
    }
});
// ==========================
// 📌 ROTA PARA DADOS DO DASHBOARD
// ==========================
app.get("/api/dashboard-totais", async (req, res) => {
    try {
        const cursos = await Curso.countDocuments({ status: "publicado" }); // ou remova o filtro se quiser todos
        const artigos = await Artigo.countDocuments({ status: "publicado" });
        const inscritos = await Inscricao.countDocuments();

        res.json({
            cursos,
            artigos,
            inscritos
        });
    } catch (error) {
        console.error("Erro ao buscar totais do dashboard:", error);
        res.status(500).json({ error: "Erro ao carregar estatísticas" });
    }
});

// ==========================
// 📌 APAGAR COMENTÁRIO (usuário ou admin) - VERSÃO FINAL
// ==========================
app.delete("/api/comentarios/:id", async (req, res) => {
    console.log("🛠️ DELETE recebido em /api/comentarios/", req.params.id);
    console.log("Query params:", req.query);

    try {
        const autor = req.query?.autor || req.body?.autor || "";
        const isAdmin = (req.query?.isAdmin === "true") || (req.body?.isAdmin === "true");


        console.log("=== DELETE COMENTÁRIO ===");
        console.log("Autor:", autor);
        console.log("isAdmin:", isAdmin);
        console.log("ID:", req.params.id);

        if (!autor && !isAdmin) {
            return res.status(400).json({ error: "⚠️ Parâmetros 'autor' ou 'isAdmin' são obrigatórios" });
        }

        const comentario = await Comentario.findById(req.params.id);
        if (!comentario) {
            return res.status(404).json({ error: "Comentário não encontrado" });
        }

        console.log("Comparando autor:", comentario.autor, "com", autor);

        // ✅ Se for admin
        if (isAdmin) {
            await Comentario.findByIdAndDelete(req.params.id);
            return res.status(200).json({ message: "🗑️ Comentário apagado pelo administrador" });
        }

        // ✅ Se for o autor
        if (comentario.autor?.trim().toLowerCase() === autor?.trim().toLowerCase()) {
            await Comentario.findByIdAndDelete(req.params.id);
            return res.status(200).json({ message: "✅ Comentário apagado pelo próprio autor" });
        }

        // 🚫 Se não tiver permissão
        return res.status(403).json({ error: "❌ Não tens permissão para apagar este comentário" });

    } catch (error) {
        console.error("Erro ao apagar comentário:", error);
        res.status(500).json({ error: "Erro ao apagar comentário" });
    }
});
// ==========================
// 📋 Listar todos os comentários (admin)
// ==========================
app.get("/api/admin/comentarios", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Comentario.countDocuments();
        const comentarios = await Comentario.find()
            .sort({ dataComentario: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            comentarios,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Erro ao buscar comentários:", error);
        res.status(500).json({ error: "Erro ao carregar comentários" });
    }
});




// ✅ APAGAR RESPOSTA POR _id (não por índice)
// ✅ APAGAR RESPOSTA POR _id (compatível com Mongoose 6+)
app.delete("/api/comentarios/:comentarioId/respostas/:respostaId", async (req, res) => {
    try {
        const { comentarioId, respostaId } = req.params;
        const { autor, isAdmin } = req.query;

        if (!autor && isAdmin !== "true") {
            return res.status(400).json({ error: "Parâmetros 'autor' ou 'isAdmin' são obrigatórios" });
        }

        const comentario = await Comentario.findById(comentarioId);
        if (!comentario) {
            return res.status(404).json({ error: "Comentário não encontrado" });
        }

        // 👇 Verifica se a resposta existe
        const resposta = comentario.respostas.id(respostaId);
        if (!resposta) {
            return res.status(404).json({ error: "Resposta não encontrada" });
        }

        // 👇 Verifica permissões
        const admins = ["Joaquim", "Admin", "ANGORGE", "Equipe ANGORGE"];
        const ehAdmin = isAdmin === "true" || admins.includes(autor);
        const podeApagar = ehAdmin ||
            (resposta.autor?.trim().toLowerCase() === autor?.trim().toLowerCase());

        if (!podeApagar) {
            return res.status(403).json({ error: "Sem permissão para apagar esta resposta" });
        }

        // ✅ CORRETO PARA MONGOOSE 6+:
        comentario.respostas.pull({ _id: respostaId });
        await comentario.save();

        res.json({ message: "✅ Resposta apagada com sucesso!" });

    } catch (error) {
        console.error("Erro ao apagar resposta:", error);
        res.status(500).json({ error: "Erro ao eliminar resposta" });
    }
});


// Rota para buscar notificações recentes (ATUALIZADA)
app.get("/api/notificacoes", async (req, res) => {
    try {
        const comentarios = await Comentario.find().sort({ data: -1 }).limit(5).populate("artigoId");
        const inscricoes = await Inscricao.find().sort({ data: -1 }).limit(5).populate("cursoId");

        const notificacoes = [];

        comentarios.forEach(c => {
            if (c.artigoId) {
                notificacoes.push({
                    tipo: "comentario",
                    texto: `Novo comentário de ${c.autor}`,
                    data: c.data,
                    artigoId: c.artigoId._id.toString(),
                    comentarioId: c._id.toString()
                });
            }
        });

        inscricoes.forEach(i => {
            if (i.cursoId) {
                notificacoes.push({
                    tipo: "inscricao",
                    texto: `Nova inscrição de ${i.nome} no curso "${i.cursoId.titulo}"`,
                    data: i.data,
                    cursoId: i.cursoId._id.toString()
                });
            }
        });

        // Ordenar por data mais recente
        notificacoes.sort((a, b) => new Date(b.data) - new Date(a.data));

        res.json(notificacoes.slice(0, 10));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar notificações" });
    }
});



// 💬 Responder a um comentário (VERSÃO ÚNICA E CORRIGIDA)
app.post("/api/comentarios/:id/respostas", async (req, res) => {
    try {
        const { texto, autor } = req.body;

        if (!texto) {
            return res.status(400).json({ error: "⚠️ A resposta não pode estar vazia" });
        }

        const comentario = await Comentario.findById(req.params.id);
        if (!comentario) {
            return res.status(404).json({ error: "Comentário não encontrado" });
        }

        if (!Array.isArray(comentario.respostas)) {
            comentario.respostas = [];
        }

        const nomeAutor = autor?.trim() || "Anónimo";
        const admins = ["Joaquim", "Admin", "ANGORGE", "Equipe ANGORGE"];
        const isAdm = admins.includes(nomeAutor);

        // ✅ CORRETO: nome da propriedade explícito
        comentario.respostas.push({
            autor: nomeAutor,
            texto: texto.trim(),
            isAdm,
            data: new Date()
        });


        await comentario.save();
        res.status(201).json({ message: "✅ Resposta adicionada com sucesso!", comentario });
    } catch (error) {
        console.error("Erro ao adicionar resposta:", error);
        res.status(500).json({ error: "Erro ao salvar resposta" });
    }
});
// 👍 Adicionar like a um comentário
app.post("/api/comentarios/:id/like", async (req, res) => {
    try {
        const { autor } = req.body;

        if (!autor || !autor.trim()) {
            return res.status(400).json({ error: "⚠️ O campo 'autor' é obrigatório." });
        }

        const comentario = await Comentario.findById(req.params.id);
        if (!comentario) {
            return res.status(404).json({ error: "Comentário não encontrado." });
        }

        // ✅ Verifica se o utilizador já deu like
        if (comentario.likedBy.includes(autor)) {
            return res.status(400).json({ error: "❌ Já deste like neste comentário." });
        }

        comentario.likedBy.push(autor);
        comentario.likes = comentario.likedBy.length;
        await comentario.save();

        res.json({ message: "👍 Like adicionado com sucesso!", likes: comentario.likes });
    } catch (error) {
        console.error("Erro ao adicionar like:", error);
        res.status(500).json({ error: "❌ Erro no servidor ao adicionar like." });
    }
});


// 👎 Remover like de um comentário
// 👎 Remover like de um comentário
app.delete("/api/comentarios/:id/like", async (req, res) => {
    try {
        const { autor } = req.body;

        if (!autor || !autor.trim()) {
            return res.status(400).json({ error: "⚠️ O campo 'autor' é obrigatório." });
        }

        const comentario = await Comentario.findById(req.params.id);
        if (!comentario) {
            return res.status(404).json({ error: "Comentário não encontrado." });
        }

        // ✅ Remove o utilizador da lista de likes
        comentario.likedBy = comentario.likedBy.filter(u => u !== autor);
        comentario.likes = comentario.likedBy.length;
        await comentario.save();

        res.json({ message: "👎 Like removido com sucesso!", likes: comentario.likes });
    } catch (error) {
        console.error("Erro ao remover like:", error);
        res.status(500).json({ error: "❌ Erro no servidor ao remover like." });
    }
});


app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});

// ✅ Rota específica para /registo
app.get("/registo", (req, res) => {
    res.sendFile(path.join(__dirname, "../Site/registo.html"));
});

// ✅ Rota fallback para SPA (se aplicável) — geralmente index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../Site/index.html"));
});



// 🚀 INICIAR SERVIDOR
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
