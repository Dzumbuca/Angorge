const express = require("express");
const multer = require("multer");
const path = require("path");
const Artigo = require("../models/Artigo.js");
const Comentario = require("../models/Comentario.js");
const mongoose = require("mongoose"); // Necessário para criar novos _id de respostas
// ⚠️ ASSUMIMOS QUE ESTA IMPORTAÇÃO ESTÁ CORRETA.
const { requireAuth, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Configuração do Multer para uploads de imagem
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/uploads"));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });


// ===================================
// ROTAS DE ARTIGOS (CRUD e Paginação)
// ===================================
// 📌 GET / — Listar artigos (com paginação segura)
// URL: /api/artigos?page=1&limit=10
router.get("/", async (req, res) => {
    try {
        const artigos = await Artigo.find({ status: "publicado" })
            .sort({ createdAt: -1 })
            .select("-__v");

        res.json({
            success: true,
            artigos,
            meta: { total: artigos.length }
        });
    } catch (error) {
        console.error("❌ Erro ao buscar artigos:", error);
        res.status(500).json({ success: false, message: "Erro ao buscar artigos" });
    }
});


// 📌 GET /:id — Buscar artigo por ID | URL: /api/artigos/:id
router.get("/:id", async (req, res) => {
    try {
        const artigo = await Artigo.findById(req.params.id);
        if (!artigo) return res.status(404).json({ message: "Artigo não encontrado" });
        res.json(artigo);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar artigo" });
    }
});

// 📌 POST / — Criar novo artigo | URL: /api/artigos
// 🔒 Adicionado requireAdmin
router.post("/", requireAdmin, upload.single("imagem"), async (req, res) => {
    try {
        const { titulo, categoria, autor, dataPublicacao, descricao, status } = req.body;
        if (!titulo || !descricao) {
            return res.status(400).json({ message: "⚠️ Campos obrigatórios: titulo e descricao" });
        }

        const imagem = req.file ? `/uploads/${req.file.filename}` : null;
        const novoArtigo = new Artigo({
            titulo,
            categoria,
            autor: autor || "Equipe ANGORGE",
            dataPublicacao: dataPublicacao || new Date(),
            descricao,
            status: status || "rascunho",
            imagem
        });

        await novoArtigo.save();
        res.status(201).json({ message: "✅ Artigo criado com sucesso!", artigo: novoArtigo });
    } catch (error) {
        console.error("Erro ao salvar artigo:", error);
        res.status(500).json({ error: "Erro ao salvar artigo" });
    }
});

// 📌 PUT /:id — Atualizar artigo | URL: /api/artigos/:id
// 🔒 Adicionado requireAdmin (Linha 89 corrigida com o middleware)
router.put("/:id", requireAdmin, upload.single("imagem"), async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) {
            updateData.imagem = `/uploads/${req.file.filename}`;
        }

        const artigo = await Artigo.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!artigo) {
            return res.status(404).json({ message: "Artigo não encontrado" });
        }

        res.json({ message: "✅ Artigo atualizado com sucesso!", artigo });
    } catch (error) {
        console.error("Erro ao atualizar artigo:", error);
        res.status(500).json({ error: "Erro ao atualizar artigo" });
    }
});

// 📌 DELETE /:id — Deletar artigo | URL: /api/artigos/:id
// 🔒 Adicionado requireAdmin
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const artigo = await Artigo.findByIdAndDelete(req.params.id);
        if (!artigo) return res.status(404).json({ message: "Artigo não encontrado" });
        res.json({ message: "🗑️ Artigo removido com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao remover artigo" });
    }
});


// ===================================
// ROTAS DE COMENTÁRIOS (ANINHADAS)
// Estas rotas só funcionam se a rota pai for /api/artigos no server.js
// ===================================

// 📌 GET /:artigoId/comentarios — Listar comentários de um artigo | URL: /api/artigos/:artigoId/comentarios
router.get("/:artigoId/comentarios", async (req, res) => {
    try {
        const comentarios = await Comentario.find({ artigoId: req.params.artigoId }).sort({ data: -1 });
        res.json(comentarios);
    } catch (error) {
        console.error("Erro ao buscar comentários:", error);
        res.status(500).json({ error: "Erro ao buscar comentários" });
    }
});

// 📌 POST /:artigoId/comentarios — Adicionar comentário a um artigo | URL: /api/artigos/:artigoId/comentarios
router.post("/:artigoId/comentarios", async (req, res) => {
    try {
        const { autor, texto } = req.body;
        // ⚠️ Nota: O backend deveria usar req.session.user.nome para o autor, não confiar no body
        if (!texto) {
            return res.status(400).json({ error: "⚠️ O comentário não pode estar vazio" });
        }
        const novoComentario = new Comentario({
            artigoId: req.params.artigoId,
            autor: autor || "Anónimo",
            texto
        });
        await novoComentario.save();
        res.status(201).json({ message: "✅ Comentário adicionado com sucesso!", comentario: novoComentario });
    } catch (error) {
        console.error("Erro ao salvar comentário:", error);
        res.status(500).json({ error: "Erro ao salvar comentário" });
    }
});

// ===================================
// ROTAS DE COMENTÁRIOS (AÇÕES DIRETAS)
// ⚠️ Estas rotas NÃO devem ser montadas em /api/artigos no server.js para evitar conflitos!
// Devem ser montadas em /api/comentarios.
// ===================================

// 📌 POST/DELETE /comentarios/:id/like — Alternar like em um comentário
router.all("/comentarios/:id/like", async (req, res) => {
    const autorToken = req.body.autor;
    const commentId = req.params.id;

    if (!autorToken || autorToken === "Anónimo") {
        return res.status(401).json({ error: "É necessário fazer login para curtir." });
    }

    try {
        const comentario = await Comentario.findById(commentId);
        if (!comentario) return res.status(404).json({ error: "Comentário não encontrado." });

        const isLiked = comentario.likedBy.includes(autorToken);

        if (req.method === 'POST') {
            if (!isLiked) {
                comentario.likedBy.push(autorToken);
            }
        } else if (req.method === 'DELETE') {
            if (isLiked) {
                comentario.likedBy = comentario.likedBy.filter(u => u !== autorToken);
            }
        } else {
            return res.status(405).json({ error: "Método não permitido." });
        }

        await comentario.save();
        res.json({ likes: comentario.likedBy.length });

    } catch (error) {
        res.status(500).json({ error: "Erro ao processar o like." });
    }
});

// 📌 POST /comentarios/:id/respostas — Adicionar resposta a um comentário
router.post("/comentarios/:id/respostas", requireAuth, async (req, res) => {
    const { autor, texto } = req.body;
    const commentId = req.params.id;

    if (!texto) {
        return res.status(400).json({ error: "O texto da resposta não pode estar vazio." });
    }
    // ⚠️ Adicione uma verificação de autor/usuário aqui!

    try {
        const resposta = {
            _id: new mongoose.Types.ObjectId(),
            autor: autor || "Anónimo",
            texto: texto,
            data: new Date()
        };

        const comentario = await Comentario.findByIdAndUpdate(
            commentId,
            { $push: { respostas: resposta } },
            { new: true }
        );

        if (!comentario) return res.status(404).json({ error: "Comentário principal não encontrado." });

        res.status(201).json({ message: "Resposta adicionada com sucesso!" });

    } catch (error) {
        res.status(500).json({ error: "Erro ao salvar resposta." });
    }
});

// 📌 DELETE /comentarios/:id — Eliminar Comentário Principal
router.delete("/comentarios/:id", requireAuth, async (req, res) => {
    const commentId = req.params.id;
    // ⚠️ Idealmente, use req.session.user para verificar se é autor ou admin
    const { autor, isAdmin } = req.query; // Pega do query string (inseguro, use sessão!)

    try {
        const comentario = await Comentario.findById(commentId);
        if (!comentario) return res.status(404).json({ error: "Comentário não encontrado." });

        if (comentario.autor !== autor && isAdmin !== 'true') {
            return res.status(403).json({ error: "Acesso negado. Não é o autor nem administrador." });
        }

        await Comentario.findByIdAndDelete(commentId);
        res.json({ message: "Comentário eliminado com sucesso." });

    } catch (error) {
        res.status(500).json({ error: "Erro ao eliminar comentário." });
    }
});


// 📌 DELETE /comentarios/:commentId/respostas/:replyId — Eliminar Resposta
router.delete("/comentarios/:commentId/respostas/:replyId", requireAuth, async (req, res) => {
    const { commentId, replyId } = req.params;
    // ⚠️ Idealmente, use req.session.user para verificar se é autor ou admin
    const { autor, isAdmin } = req.query; // Pega do query string (inseguro, use sessão!)

    try {
        const comentario = await Comentario.findById(commentId);
        if (!comentario) return res.status(404).json({ error: "Comentário principal não encontrado." });

        const respostaIndex = comentario.respostas.findIndex(r => r._id.toString() === replyId);
        if (respostaIndex === -1) {
            return res.status(404).json({ error: "Resposta não encontrada." });
        }

        if (comentario.respostas[respostaIndex].autor !== autor && isAdmin !== 'true') {
            return res.status(403).json({ error: "Acesso negado. Não é o autor nem administrador." });
        }

        comentario.respostas.splice(respostaIndex, 1);
        await comentario.save();

        res.json({ message: "Resposta eliminada com sucesso." });

    } catch (error) {
        res.status(500).json({ error: "Erro ao eliminar resposta." });
    }
});


module.exports = router;