const express = require("express");
const router = express.Router();

const Artigo = require("../models/Artigo");
const Curso = require("../models/Curso");
const Inscricao = require("../models/Inscricao"); // ✅ Corrigido!

// Rota para totais da dashboard
router.get("/dashboard-totais", async (req, res) => {
    try {
        const cursosTotal = await Curso.countDocuments({ status: "publicado" }); // opcional: só publicados
        const artigosTotal = await Artigo.countDocuments({ status: "publicado" });
        const inscritosTotal = await Inscricao.countDocuments(); // ✅ Agora conta inscrições

        res.json({
            cursos: cursosTotal,
            artigos: artigosTotal,
            inscritos: inscritosTotal
        });
    } catch (error) {
        console.error("Erro ao buscar totais da dashboard:", error);
        res.status(500).json({ message: "Erro ao buscar totais" });
    }
});

module.exports = router;