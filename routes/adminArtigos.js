const express = require("express");
const multer = require("multer");
const path = require("path");
const Artigo = require("../models/Artigo");

const router = express.Router();

// Multer para upload de imagem
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, "../public/uploads")),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Página de edição
router.get("/:id/editar", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    const artigo = await Artigo.findById(req.params.id);
    if (!artigo) return res.status(404).send("Artigo não encontrado");
    res.render("EditarArtigo", { admin: req.session.user, artigo });
});

// POST para atualizar
router.post("/:id/editar", upload.single("imagem"), async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    try {
        const { titulo, categoria, descricao, status } = req.body;
        const updateData = { titulo, categoria, descricao, status };
        if (req.file) updateData.imagem = `/uploads/${req.file.filename}`;

        const artigo = await Artigo.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!artigo) return res.status(404).send("Artigo não encontrado");

        res.redirect("/admin"); // ou para a lista de artigos
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao atualizar artigo");
    }
});

module.exports = router;
