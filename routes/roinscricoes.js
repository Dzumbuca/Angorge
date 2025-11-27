const express = require("express");
const Inscricao = require("../models/Inscricao.js");

const router = express.Router();

// 📌 POST / — Criar nova inscrição
router.post("/", async (req, res) => {
    try {
        const { nome, email, telefone, cursoId } = req.body;
        if (!nome || !email || !cursoId) {
            return res.status(400).json({ error: "Campos obrigatórios: nome, email e cursoId" });
        }

        const novaInscricao = new Inscricao({
            nome,
            email,
            telefone: telefone || "", // opcional
            cursoId
        });

        await novaInscricao.save();
        res.status(201).json({ message: "✅ Inscrição salva com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar inscrição:", error);
        res.status(500).json({ error: "Erro ao salvar inscrição" });
    }
});

module.exports = router;