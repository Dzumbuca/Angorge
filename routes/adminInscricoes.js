// routes/adminInscricoes.js
const express = require("express");
const router = express.Router();
const Inscricao = require("../models/Inscricao");
const Curso = require("../models/Curso");
const mongoose = require("mongoose");
// ✅ Middleware para PÁGINAS (redireciona para login)
function requireAdminPage(req, res, next) {
    if (!req.session?.user || req.session.user.perfil !== "administrador") {
        return res.redirect("/login"); // ← HTML: redireciona
    }
    next();
}

// ✅ Middleware para API (retorna JSON)
function requireAdminAPI(req, res, next) {
    if (!req.session?.user || req.session.user.perfil !== "administrador") {
        return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
    }
    next();
}

// 🔹 Página de listagem (HTML)
router.get("/", requireAdminPage, (req, res) => {
    res.render("admin/inscricoes", { admin: req.session.user });
});

// 🔹 API para dados (JSON)
router.get("/api", requireAdminAPI, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const inscricoes = await Inscricao.find()
            .populate({ path: 'cursoId', select: 'titulo', model: Curso })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Inscricao.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            inscricoes: inscricoes.map(insc => ({
                _id: insc._id,
                nome: insc.nome,
                email: insc.email,
                telefone: insc.telefone,
                cursoTitulo: insc.cursoId?.titulo || '—',
                data: insc.createdAt || insc.data
            })),
            page,
            totalPages,
            total
        });
    } catch (err) {
        console.error("Erro ao buscar inscrições:", err);
        res.status(500).json({ error: "Erro ao carregar inscrições" });
    }
});
// 🔹 DELETE /admin/inscricoes/:id → eliminar inscrição
router.delete("/:id", requireAdminAPI, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "ID inválido." });
        }

        const inscricao = await Inscricao.findByIdAndDelete(id);
        if (!inscricao) {
            return res.status(404).json({ error: "Inscrição não encontrada." });
        }

        res.json({ message: "Inscrição eliminada com sucesso." });
    } catch (err) {
        console.error("Erro ao eliminar inscrição:", err);
        res.status(500).json({ error: "Erro interno ao eliminar inscrição." });
    }
});
// 🔹 PUT /admin/inscricoes/:id → atualizar inscrição
router.put("/:id", requireAdminAPI, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, telefone } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "ID inválido." });
        }

        if (!nome || !email || !telefone) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios." });
        }

        const inscricao = await Inscricao.findByIdAndUpdate(
            id,
            { nome, email, telefone },
            { new: true, runValidators: true }
        );

        if (!inscricao) {
            return res.status(404).json({ error: "Inscrição não encontrada." });
        }

        res.json({ message: "Inscrição atualizada com sucesso.", inscricao });
    } catch (err) {
        console.error("Erro ao atualizar inscrição:", err);
        res.status(500).json({ error: "Erro interno ao atualizar." });
    }
});
module.exports = router;