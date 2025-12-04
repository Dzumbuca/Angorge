const express = require("express");
const Comentario = require("../models/Comentario.js");
const mongoose = require("mongoose"); // Necessário para a otimização de resposta

const router = express.Router();

// As rotas de listagem e criação de comentários por Artigo FORAM MOVIDAS para roartigos.js

// 📌 POST /:id/respostas — Responder a um comentário | URL: /api/comentarios/:id/respostas
router.post("/:id/respostas", async (req, res) => {
    try {
        const { texto, autor } = req.body;
        if (!texto) {
            return res.status(400).json({ error: "⚠️ A resposta não pode estar vazia" });
        }

        const nomeAutor = autor?.trim() || "Anónimo";
        const admins = ["Joaquim", "Admin", "ANGORGE", "Equipe ANGORGE"];
        const isAdm = admins.includes(nomeAutor);

        const novaResposta = {
            autor: nomeAutor,
            texto: texto.trim(),
            isAdm,
            data: new Date()
        };

        // Usa findByIdAndUpdate com $push para eficiência
        const comentario = await Comentario.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    respostas: novaResposta
                }
            },
            { new: true } // Retorna o documento atualizado
        );

        if (!comentario) {
            return res.status(404).json({ error: "Comentário não encontrado" });
        }

        res.status(201).json({ message: "✅ Resposta adicionada com sucesso!", comentario });
    } catch (error) {
        console.error("Erro ao adicionar resposta:", error);
        res.status(500).json({ error: "Erro ao salvar resposta" });
    }
});

// 📌 DELETE /:id — Apagar comentário (por autor ou admin) | URL: /api/comentarios/:id
router.delete("/:id", async (req, res) => {
    try {
        const autor = req.query?.autor || req.body?.autor || "";
        const isAdmin = (req.query?.isAdmin === "true") || (req.body?.isAdmin === "true");

        if (!autor && !isAdmin) {
            return res.status(400).json({ error: "⚠️ Parâmetros 'autor' ou 'isAdmin' são obrigatórios" });
        }

        const comentario = await Comentario.findById(req.params.id);
        if (!comentario) {
            return res.status(404).json({ error: "Comentário não encontrado" });
        }

        const isOwner = comentario.autor?.trim().toLowerCase() === autor?.trim().toLowerCase();

        // ✅ Admin pode apagar qualquer comentário
        if (isAdmin || isOwner) {
            await Comentario.findByIdAndDelete(req.params.id);
            const msg = isAdmin ? "🗑️ Comentário apagado pelo administrador" : "✅ Comentário apagado pelo próprio autor";
            return res.status(200).json({ message: msg });
        }

        // 🚫 Sem permissão
        return res.status(403).json({ error: "❌ Não tens permissão para apagar este comentário" });
    } catch (error) {
        console.error("Erro ao apagar comentário:", error);
        res.status(500).json({ error: "Erro ao apagar comentário" });
    }
});

// 📌 DELETE /:comentarioId/respostas/:respostaId — Apagar uma resposta | URL: /api/comentarios/:comentarioId/respostas/:respostaId
router.delete("/:comentarioId/respostas/:respostaId", async (req, res) => {
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

        const resposta = comentario.respostas.id(respostaId);
        if (!resposta) {
            return res.status(404).json({ error: "Resposta não encontrada" });
        }

        const admins = ["Joaquim", "Admin", "ANGORGE", "Equipe ANGORGE"];
        const ehAdmin = isAdmin === "true" || admins.includes(autor);
        const podeApagar = ehAdmin ||
            (resposta.autor?.trim().toLowerCase() === autor?.trim().toLowerCase());

        if (!podeApagar) {
            return res.status(403).json({ error: "Sem permissão para apagar esta resposta" });
        }

        comentario.respostas.pull({ _id: respostaId });
        await comentario.save();

        res.json({ message: "✅ Resposta apagada com sucesso!" });
    } catch (error) {
        console.error("Erro ao apagar resposta:", error);
        res.status(500).json({ error: "Erro ao eliminar resposta" });
    }
});

// 📌 POST /:id/like — Dar like num comentário | URL: /api/comentarios/:id/like
router.post("/:id/like", async (req, res) => {
    try {
        const { autor } = req.body;
        if (!autor || !autor.trim()) {
            return res.status(400).json({ error: "⚠️ O campo 'autor' é obrigatório." });
        }

        const comentario = await Comentario.findById(req.params.id);
        if (!comentario) {
            return res.status(404).json({ error: "Comentário não encontrado." });
        }

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

// 📌 DELETE /:id/like — Remover like de um comentário | URL: /api/comentarios/:id/like
router.delete("/:id/like", async (req, res) => {
    try {
        const { autor } = req.body;
        if (!autor || !autor.trim()) {
            return res.status(400).json({ error: "⚠️ O campo 'autor' é obrigatório." });
        }

        const comentario = await Comentario.findById(req.params.id);
        if (!comentario) {
            return res.status(404).json({ error: "Comentário não encontrado." });
        }

        comentario.likedBy = comentario.likedBy.filter(u => u !== autor);
        comentario.likes = comentario.likedBy.length;
        await comentario.save();

        res.json({ message: "👎 Like removido com sucesso!", likes: comentario.likes });
    } catch (error) {
        console.error("Erro ao remover like:", error);
        res.status(500).json({ error: "❌ Erro no servidor ao remover like." });
    }
});

// 📌 GET /admin — Listar todos os comentários (para admin, com paginação) | URL: /api/comentarios/admin
router.get("/admin", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Comentario.countDocuments();
        const comentarios = await Comentario.find()
            .sort({ data: -1 })
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
// 📌 POST / — Criar novo comentário | URL: /api/comentarios
// rocomentarios.js - Rota POST / — Criar novo comentário | URL: /api/comentarios
// 📌 POST / — Criar novo comentário | URL: /api/comentarios
router.post("/", async (req, res) => {
    // 🔍 DEBUG: Verificar se a sessão está chegando corretamente
    console.log("➡️ Sessão recebida no backend:", req.session.user);
    console.log("➡️ Corpo da requisição:", req.body);

    // ✅ Obter autor da sessão, NÃO do corpo (req.body)
    if (!req.session.user || !req.session.user.nome) {
        return res.status(401).json({ error: "Precisa estar logado para comentar." });
    }
    const autor = req.session.user.nome; // Usa o autor da sessão

    const { texto, artigoId } = req.body; // Pega o texto e artigoId do corpo

    try {
        // Validação
        if (!texto || !artigoId) { // Autor já é garantido pela sessão
            return res.status(400).json({ error: "Campos 'texto' e 'artigoId' são obrigatórios." });
        }

        // Valida se artigoId é um ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(artigoId)) {
            return res.status(400).json({ error: "ID do artigo inválido." });
        }

        // Cria o comentário
        const novoComentario = new Comentario({
            autor: autor.trim(), // Usa o nome da sessão
            texto: texto.trim(),
            artigoId: new mongoose.Types.ObjectId(artigoId)
        });

        await novoComentario.save();
        res.status(201).json(novoComentario);
    } catch (error) {
        console.error("Erro ao criar comentário:", error);
        res.status(500).json({ error: "Erro ao salvar comentário." });
    }
});
// 📌 GET / — Listar comentários por artigoId | URL: /api/comentarios?artigoId=...
router.get("/", async (req, res) => {
    try {
        const { artigoId } = req.query;

        if (!artigoId) {
            return res.status(400).json({ error: "Parâmetro 'artigoId' é obrigatório." });
        }

        if (!mongoose.Types.ObjectId.isValid(artigoId)) {
            return res.status(400).json({ error: "ID do artigo inválido." });
        }

        const comentarios = await Comentario.find({ artigoId })
            .sort({ data: 1 }); // do mais antigo ao mais novo

        res.json(comentarios);
    } catch (error) {
        console.error("Erro ao buscar comentários por artigo:", error);
        res.status(500).json({ error: "Erro ao carregar comentários." });
    }
});

module.exports = router;