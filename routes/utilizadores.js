// routes/utilizadores.js
const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/modelsUser");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Necessário para deletar arquivos em caso de erro

// ===========================================
// 🛠️ CONFIGURAÇÃO DO MULTER (COPIADA DO server.js)
// IMPORTANTE: O caminho 'destination' foi ajustado para funcionar a partir de 'routes/utilizadores.js'
// ===========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Volta um nível (de routes) para chegar em src/public/uploads/usuarios
        cb(null, path.join(__dirname, "..", "public", "uploads", "usuarios"));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, name + ext);
    }
});
const upload = multer({ storage: storage });
// ===========================================

// 🔐 Middleware de autenticação
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: "Não autenticado" });
    }
    next();
}

// 📌 GET /api/usuarios — Listar usuários (só admin!)
router.get("/usuarios", requireAuth, async (req, res) => {
    // 🔒 Reforçar: só administradores podem listar usuários
    if (req.session.user.perfil !== "administrador") {
        return res.status(403).json({ error: "Acesso negado" });
    }
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await User.countDocuments();
        const usuarios = await User.find()
            .select("nome perfil status email telefone foto")
            .skip(skip)
            .limit(limit);

        res.json({
            usuarios,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Erro em GET /api/usuarios:", error);
        res.status(500).json({ error: "Erro ao carregar usuários" });
    }
});

// 📌 POST /api/usuarios — Criar usuário (só admin!)
// ✅ APLICAÇÃO DO MULTER AQUI
router.post("/usuarios", requireAuth, upload.single("fotoPerfil"), async (req, res) => {
    if (req.session.user.perfil !== "administrador") {
        return res.status(403).json({ error: "Só administradores podem criar usuários" });
    }

    // Se o multer salvou um arquivo, ele estará em req.file
    const fotoPath = req.file ? `/uploads/usuarios/${req.file.filename}` : undefined;

    try {
        const { nome, perfil, email, telefone, senha, status } = req.body;

        // 🛑 VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
        if (!nome || !senha || !perfil) {
            // Se falhar a validação, deleta a foto que o Multer salvou
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: "Campos obrigatórios: nome, senha e perfil." });
        }

        const userExistente = await User.findOne({ nome });
        if (userExistente) {
            // Se falhar a validação (usuário existente), deleta a foto
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: "Usuário já existe." });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);

        // 📝 CONSTRUÇÃO DOS DADOS DO USUÁRIO
        const dadosUsuario = {
            nome,
            senha: hashedPassword,
            perfil,
            status: status || "Ativo",
            ...(email && { email }),
            ...(telefone && { telefone }),
            ...(fotoPath && { foto: fotoPath }) // ✅ Inclui o caminho da foto
        };

        const novoUser = new User(dadosUsuario);
        await novoUser.save();
        res.status(201).json({ message: "Usuário criado com sucesso!" });

    } catch (error) {
        console.error("Erro ao criar usuário:", error);

        // Em caso de erro interno, deleta a foto
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ message: "Erro interno do servidor" });
    }
});

// 📌 PUT /api/usuarios/:id — Atualizar outro usuário (só admin!)
// ... (outras rotas) ...

// Rota PUT /api/usuarios/:id (Permitindo a atualização da foto)
router.put("/usuarios/:id", requireAuth, upload.single("fotoPerfil"), async (req, res) => {
    if (req.session.user.perfil !== "administrador") {
        // Se o multer salvou um arquivo, excluímos ele aqui
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ error: "Só administradores podem editar outros usuários" });
    }

    // Caminho da nova foto, se houver upload
    const novaFotoPath = req.file ? `/uploads/usuarios/${req.file.filename}` : undefined;

    try {
        const { nome, perfil, email, telefone, status } = req.body;

        // Dados a serem atualizados
        const updateData = { nome, perfil, email, telefone, status };
        if (novaFotoPath) {
            updateData.foto = novaFotoPath;
        }

        const usuarioAtual = await User.findById(req.params.id);
        if (!usuarioAtual) {
            // Deleta a foto se o usuário não for encontrado
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        // ⚠️ Lógica para deletar a foto antiga, se existir e se uma nova foi carregada
        if (novaFotoPath && usuarioAtual.foto) {
            const oldPath = path.join(__dirname, "..", "public", usuarioAtual.foto);
            // Verifica se o arquivo existe e deleta
            if (fs.existsSync(oldPath) && !usuarioAtual.foto.includes("default-profile")) {
                fs.unlink(oldPath, (err) => {
                    if (err) console.error("Erro ao deletar foto antiga:", err);
                });
            }
        }


        const usuario = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({ message: "Perfil atualizado com sucesso!", usuario });
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        // Deleta a foto se houver erro no processamento do update
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
});

// 📌 PUT /api/perfil — Atualizar PRÓPRIO perfil (qualquer usuário logado)
router.put("/perfil", requireAuth, async (req, res) => {
    try {
        const { nome, email, telefone, status } = req.body; // ❌ NÃO inclui 'perfil'!

        const updateData = { nome, email, telefone, status };

        // Para garantir que o próprio usuário não pode mudar o perfil
        delete updateData.perfil;

        const usuario = await User.findOneAndUpdate(
            { nome: req.session.user.nome }, // só permite atualizar o próprio
            updateData,
            { new: true }
        );

        if (!usuario) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        // Atualiza a sessão com os novos dados
        req.session.user = {
            ...req.session.user,
            nome: usuario.nome,
            email: usuario.email,
            telefone: usuario.telefone,
            status: usuario.status,
            // Mantém perfil e foto
        };

        res.json({ message: "Perfil atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar próprio perfil:", error);
        res.status(500).json({ error: "Erro ao atualizar perfil" });
    }
});

// 📌 DELETE /api/usuarios/:id — Excluir usuário (só admin!)
router.delete("/usuarios/:id", requireAuth, async (req, res) => {
    if (req.session.user.perfil !== "administrador") {
        return res.status(403).json({ error: "Só administradores podem excluir usuários" });
    }
    try {
        const usuario = await User.findByIdAndDelete(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        // 🗑️ Lógica para deletar a foto antiga ao excluir o usuário
        if (usuario.foto) {
            const oldPath = path.join(__dirname, "..", "public", usuario.foto);
            // Evita deletar imagens padrão e verifica se o arquivo existe
            if (fs.existsSync(oldPath) && !usuario.foto.includes("default-profile")) {
                fs.unlink(oldPath, (err) => {
                    if (err) console.error("Erro ao deletar foto do usuário excluído:", err);
                });
            }
        }

        res.json({ message: "Usuário removido com sucesso!" });
    } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        res.status(500).json({ error: "Erro ao excluir usuário" });
    }
});

// 📌 POST /api/login — Login
router.post("/login", async (req, res) => {
    const { nome, senha } = req.body;
    if (!nome || !senha) {
        return res.status(400).json({ error: "Nome e senha obrigatórios" });
    }
    try {
        const user = await User.findOne({ nome });
        if (!user || !(await bcrypt.compare(senha, user.senha))) {
            return res.status(401).json({ error: "Nome ou senha inválidos" });
        }
        req.session.user = {
            nome: user.nome,
            perfil: user.perfil,
            email: user.email,
            telefone: user.telefone,
            status: user.status,
            foto: user.foto || "/Imagem/default-profile.jpg"
        };
        res.json({ message: "✅ Login realizado com sucesso!", user: req.session.user });
    } catch (err) {
        console.error("Erro no login:", err);
        res.status(500).json({ error: "Erro no servidor" });
    }
});

module.exports = router;