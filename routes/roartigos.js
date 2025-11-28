// ==========================
// 📌 IMPORTS
// ==========================
const express = require("express");
const multer = require("multer");
const path = require("path");
const Artigo = require("../models/Artigo.js");
const Comentario = require("../models/Comentario.js");
const { requireAuth, requireAdmin } = require("../middlewares/auth");
const fs = require("fs");


const router = express.Router();


// ==========================
// 📌 GARANTIR QUE A PASTA DE UPLOAD EXISTA
// ==========================
const ensureUploadDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};
// Caminho absoluto da pasta de upload
const uploadDir = path.join(__dirname, "../public/uploads/artigos");
ensureUploadDir(uploadDir);
// ==========================
// 📌 CONFIGURAÇÃO DO MULTER
// ==========================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // usa caminho absoluto seguro
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Apenas imagens são permitidas!"));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // opcional: limite de 5MB
});

// ==========================
// 📌 LISTAR ARTIGOS (PAGINADO)
// ==========================
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Artigo.countDocuments();
        const artigos = await Artigo.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            total,
            page,
            totalPages: Math.ceil(total / limit),
            artigos
        });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao listar artigos", error: error.message });
    }
});

// ==========================
// 📌 OBTER UM ARTIGO PELO ID
// ==========================
router.get("/:id", async (req, res) => {
    try {
        const artigo = await Artigo.findById(req.params.id);
        if (!artigo) return res.status(404).json({ mensagem: "Artigo não encontrado" });

        res.json(artigo);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao buscar artigo", error: error.message });
    }
});

// ==========================
// 📌 CRIAR ARTIGO
// ==========================
router.post("/", requireAdmin, upload.single("imagem"), async (req, res) => {
    try {
        const { titulo, categoria, autor, dataPublicacao, descricao, status } = req.body;

        if (!titulo || !descricao || !categoria) {
            return res.status(400).json({ mensagem: "Preencha os campos obrigatórios: Título, Descrição e Categoria" });
        }

        const novoArtigo = await Artigo.create({
            titulo,
            categoria,
            autor,
            dataPublicacao: dataPublicacao || Date.now(),
            descricao,
            status: status || "rascunho",
            imagem: req.file ? `/uploads/artigos/${req.file.filename}` : null
        });

        res.status(201).json({ mensagem: "Artigo criado com sucesso!", artigo: novoArtigo });
    } catch (error) {
        console.error("Erro ao criar artigo:", error);
        res.status(500).json({ mensagem: "Erro ao criar artigo", error: error.message });
    }
});

// ==========================
// 📌 ATUALIZAR ARTIGO
// ==========================
router.put("/:id", requireAdmin, upload.single("imagem"), async (req, res) => {
    try {
        const updates = {
            titulo: req.body.titulo,
            categoria: req.body.categoria,
            autor: req.body.autor,
            dataPublicacao: req.body.dataPublicacao,
            descricao: req.body.descricao,
            status: req.body.status
        };

        if (req.file) updates.imagem = `/uploads/artigos/${req.file.filename}`;

        const artigo = await Artigo.findByIdAndUpdate(req.params.id, updates, { new: true });

        if (!artigo) return res.status(404).json({ mensagem: "Artigo não encontrado" });

        res.json({ mensagem: "Artigo atualizado com sucesso!", artigo });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao atualizar artigo", error: error.message });
    }
});

// ==========================
// 📌 DELETAR ARTIGO
// ==========================
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const artigo = await Artigo.findByIdAndDelete(req.params.id);
        if (!artigo) return res.status(404).json({ mensagem: "Artigo não encontrado" });

        res.json({ mensagem: "Artigo removido com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao deletar artigo", error: error.message });
    }
});

// ==========================
// 📌 EXPORTAR ROTAS
// ==========================
module.exports = router;
