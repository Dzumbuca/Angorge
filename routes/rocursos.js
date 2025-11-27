const express = require("express");
const multer = require("multer");
const path = require("path");
const Curso = require("../models/Curso.js");

const router = express.Router();

// Configuração do Multer (única por rota que usa upload)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/uploads"));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// Funções auxiliares
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

// 📌 POST / — Criar curso
router.post("/", upload.single("imagem"), async (req, res) => {
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

// 📌 PUT /:id — Atualizar curso
router.put("/:id", upload.single("imagem"), async (req, res) => {
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

// 📌 GET / — Listar cursos (com paginação)
// 📌 GET / — Listar cursos (com paginação)
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // ✅ Adicione lean() e remova strict
        const total = await Curso.countDocuments();
        const cursos = await Curso.find()
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)
            .lean({ defaults: true }); // ← força conversão segura

        res.json({
            cursos,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Erro detalhado em /api/cursos:", error);
        res.status(500).json({
            message: "Erro ao buscar cursos",
            error: error.message // ← para ver o erro exato
        });
    }
});

// 📌 GET /:id — Buscar curso por ID
router.get("/:id", async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ message: "Curso não encontrado" });
        res.json(curso);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar curso" });
    }
});

// 📌 DELETE /:id — Deletar curso
router.delete("/:id", async (req, res) => {
    try {
        const curso = await Curso.findByIdAndDelete(req.params.id);
        if (!curso) return res.status(404).json({ message: "Curso não encontrado" });
        res.json({ message: "🗑️ Curso removido com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao remover curso" });
    }
});




module.exports = router;