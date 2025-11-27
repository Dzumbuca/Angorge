const express = require("express");
const Comentario = require("../models/Comentario");
const Inscricao = require("../models/Inscricao");

const router = express.Router();

router.get("/notificacoes", async (req, res) => {
    try {
        const comentarios = await Comentario.find()
            .sort({ data: -1 }) // ✅ campo 'data' existe no schema
            .limit(5)
            .populate({ path: "artigoId", select: "titulo" });

        const inscricoes = await Inscricao.find()
            .sort({ data: -1 }) // ✅ assumindo que Inscricao também tem 'data'
            .limit(5)
            .populate({ path: "cursoId", select: "titulo" });

        const notificacoes = [];

        comentarios.forEach(c => {
            if (c.artigoId && c.artigoId._id) {
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
            if (i.cursoId && i.cursoId._id) {
                notificacoes.push({
                    tipo: "inscricao",
                    texto: `Nova inscrição de ${i.nome} no curso "${i.cursoId.titulo}"`,
                    data: i.data,
                    cursoId: i.cursoId._id.toString()
                });
            }
        });

        notificacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
        res.json(notificacoes.slice(0, 10));
    } catch (error) {
        console.error("Erro ao buscar notificações:", error);
        res.status(500).json({ error: "Erro ao buscar notificações" });
    }
});

module.exports = router;