const express = require("express");
const router = express.Router();

const Artigo = require("./Artigo");          // caminho correto
const Curso = require("./Curso");            // caminho correto para o teu modelo de curso
const Inscrito = require("./Inscrito");      // caminho correto para inscritos

// Rota para totais da dashboard
router.get("/dashboard-totais", async (req, res) => {
    try {
        const cursosTotal = await Curso.countDocuments();
        const artigosTotal = await Artigo.countDocuments();
        const inscritosTotal = await Inscrito.countDocuments();

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
