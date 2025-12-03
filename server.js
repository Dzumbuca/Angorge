// ==========================
// 📌 IMPORTS
// ==========================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const multer = require("multer");
const bcrypt = require("bcrypt");

// ✅ IMPORTAÇÕES DE MODELOS PARA CONSISTÊNCIA E SEGURANÇA
const Comentario = require("./models/Comentario");
const Inscricao = require("./models/Inscricao");
const User = require("./models/modelsUser"); // Mover para o topo
const Artigo = require("./models/Artigo");   // Mover para o topo
const Curso = require("./models/Curso");     // Mover para o topo

// Configuração do Multer para upload de imagens de usuário
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "public", "uploads", "usuarios"));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, name + ext);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Apenas arquivos de imagem são permitidos!"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

// ==========================
// 📌 APP
// ==========================
const app = express();

// ==========================
// 📌 CONFIGURAÇÃO DE SEGURANÇA E SESSÃO
// ==========================
const SESSION_SECRET = process.env.SESSION_SECRET || "segredoSuperFortePadraoParaDesenvolvimento";

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 dia
}));

// ==========================
// 🛡️ MIDDLEWARES DE AUTORIZAÇÃO
// ==========================
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    // ✅ Melhoria: Acesso seguro à propriedade de perfil
    if (req.session.user.perfil !== "administrador") {
        return res.status(403).send("Acesso negado. Apenas administradores.");
    }
    next();
}

// ==========================
// 📌 CONFIGURAÇÃO DO APP
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ==========================
// 📌 CONEXÃO COM MONGODB
// ==========================
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/teuBanco";
mongoose.connect(MONGODB_URI)
    .then(() => console.log("✅ Conectado ao MongoDB"))
    .catch(err => console.error("❌ Erro ao conectar:", err));

// ==========================
// 📌 ROTAS DE API
// ==========================
app.use("/api", require("./routes/utilizadores"));
app.use("/api/artigos", require("./routes/roartigos"));
app.use("/api/comentarios", require("./routes/rocomentarios"));
app.use("/api/inscricoes", require("./routes/roinscricoes"));
app.use("/api/cursos", require("./routes/rocursos"));
app.use("/api", require("./routes/admin"));
app.use("/api", require("./routes/notificacoes"));


// ==========================
// 📌 ROTAS PÚBLICAS
// ==========================
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/login", (req, res) => res.render("login", { error: null }));

app.post("/login", async (req, res) => {
    const { nome, senha } = req.body;
    if (!nome || !senha) return res.render("login", { error: "Preencha todos os campos" });

    // ✅ Uso do modelo User importado no topo
    const user = await User.findOne({ nome });

    if (!user || !(await bcrypt.compare(senha, user.senha))) {
        return res.render("login", { error: "Nome de usuário ou senha inválidos" });
    }

    req.session.user = {
        nome: user.nome,
        perfil: user.perfil,
        email: user.email,
        telefone: user.telefone,
        status: user.status,
        foto: user.foto || "/Imagem/default-profile.jpg"
    };
    console.log("✅ Sessão criada:", req.session.user);
    res.redirect("/admin");
});
// ==========================
// 📌 ROTA DE REGISTO PARA FRONT-END
// ==========================
app.post("/api/register", async (req, res) => {
    try {
        const { nome, senha } = req.body;

        if (!nome || !senha) {
            return res.status(400).json({ error: "Preencha todos os campos" });
        }

        // Verifica se já existe
        const existingUser = await User.findOne({ nome });
        if (existingUser) {
            return res.status(400).json({ error: "Usuário já existe" });
        }

        // Criptografa a senha
        const hashedPassword = await bcrypt.hash(senha, 10);

        // Cria o usuário
        const newUser = new User({
            nome,
            senha: hashedPassword,
            perfil: "usuario", // perfil padrão

        });

        await newUser.save();

        res.status(201).json({ message: "Registrado com sucesso!" });

    } catch (err) {
        console.error("Erro ao registrar usuário:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// Página de registo
app.get("/registo", (req, res) => {
    res.render("registo", { error: null });
});



// ==========================
// 📌 LOGOUT
// ==========================
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Erro ao encerrar sessão:", err);
            return res.status(500).send("Erro ao sair");
        }
        res.clearCookie("connect.sid");
        res.redirect("/login");
    });
});
// ==========================
// 🛠️ ROTA DE INICIALIZAÇÃO: CRIA PRIMEIRO ADMIN SE NÃO EXISTIR
// ==========================
app.post("/primeiro-admin", async (req, res) => {
    try {
        // Verifica se já existe algum administrador
        const existeAdmin = await User.findOne({ perfil: "administrador" });
        if (existeAdmin) {
            return res.status(403).json({ error: "Já existe um administrador. Esta rota está desativada." });
        }

        const { nome, senha } = req.body;
        if (!nome || !senha) {
            return res.status(400).json({ error: "Nome e senha são obrigatórios." });
        }

        const hashedPassword = await bcrypt.hash(senha, 12);
        const admin = new User({
            nome,
            senha: hashedPassword,
            perfil: "administrador",

        });

        await admin.save();
        console.log("✅ Primeiro administrador criado com sucesso!");
        res.status(201).json({ message: "Administrador criado com sucesso!" });

    } catch (err) {
        console.error("Erro ao criar primeiro admin:", err);
        res.status(500).json({ error: "Erro interno" });
    }
});

// ==========================
// 📌 ROTAS PROTEGIDAS (todos logados)
// ==========================
app.get("/admin", requireAuth, (req, res) => {
    // A variável 'admin' na session é usada para passar os dados do usuário logado para o EJS
    res.render("dashbord", { admin: req.session.user });
});

app.get("/cursos", requireAuth, async (req, res) => {
    try {
        // ✅ Uso do modelo Curso importado no topo
        const cursos = await Curso.find({ status: "publicado" }).sort({ createdAt: -1 });
        res.render("cursos", { cursos, user: req.session.user, admin: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao carregar cursos");
    }
});

app.get("/artigos", async (req, res) => {
    try {
        // ✅ Uso do modelo Artigo importado no topo
        const artigos = await Artigo.find({ status: "publicado" }).sort({ createdAt: -1 });
        res.render("artigos", { artigos, user: req.session.user, admin: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao carregar artigos");
    }
});
// ✅ NOVO: Rota para carregar o Artigo e seus Comentários
// ✅ Rota Corrigida: Simplesmente serve o template EJS
app.get("/artigo/:id", async (req, res) => {
    const { id } = req.params;

    // 🔍 Valida se é um ObjectId válido ANTES de consultar o banco
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send("ID de artigo inválido.");
    }

    try {
        const artigo = await Artigo.findById(id);
        if (!artigo || artigo.status !== "publicado") {
            return res.status(404).send("Artigo não encontrado.");
        }
        // 🔍 LOG PARA DEBUG
        console.log("✅ Artigo carregado para renderização:", {
            _id: artigo._id,
            titulo: artigo.titulo,
            descricao: artigo.descricao ? artigo.descricao.substring(0, 30) + "..." : null
        });
        // ✅ Agora sim: passe o artigo para o template!
        res.render("DetalheArtigo", {
            artigo, // ← ISSO ERA O QUE FALTAVA!
            user: req.session.user,
            admin: req.session.user
        });
    } catch (err) {
        console.error("Erro ao carregar artigo:", err);
        res.status(500).send("Erro interno ao carregar artigo.");
    }
});

app.get("/curso/:id", async (req, res) => {
    try {
        // ✅ Uso do modelo Curso importado no topo
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).send("Curso não encontrado");
        res.render("Cursodetalhe", { curso, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao carregar curso");
    }
});

// ✅ PRÓPRIO PERFIL (qualquer usuário)
app.get("/perfil", async (req, res) => {
    try {
        // ✅ Uso do modelo User importado no topo
        const usuario = await User.findOne({ nome: req.session.user.nome });
        if (!usuario) return res.redirect("/login");
        res.render("perfil", {
            user: usuario,
            admin: req.session.user,
            isOwnProfile: true
        });
    } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        res.status(500).send("Erro ao carregar perfil");
    }
});

// ==========================
// 📌 ROTAS SÓ PARA ADMINISTRADOR
// ==========================
app.get("/admin/usuarios", requireAdmin, (req, res) => {
    res.render("usuarios", { admin: req.session.user });
});

app.get("/admin/usuarios/novo", requireAdmin, (req, res) => {
    res.render("AdicionarUsuario", { admin: req.session.user });
});
// ==========================
// 📌 ROTAS PARA DASHBORD (contagem)
// ==========================
app.get("/api/dashbord/contagens", requireAuth, async (req, res) => {
    try {
        const [cursos, artigos, inscritos] = await Promise.all([
            Curso.countDocuments({
                $or: [
                    { status: "publicado" },
                    { status: "Disponível Agora" }
                ]
            }), Artigo.countDocuments({ status: "publicado" }),
            Inscricao.countDocuments() // ou User.countDocuments({ perfil: "usuario" }) se for "usuários"
        ]);

        res.json({
            cursosPublicados: cursos,
            artigosPublicados: artigos,
            inscritos: inscritos
        });
    } catch (err) {
        console.error("Erro ao buscar contagens:", err);
        res.status(500).json({ error: "Erro ao carregar dados do dashboard" });
    }
});

// ✅ Perfil de outro usuário (só admin)
app.get("/admin/usuarios/:id/perfil", async (req, res) => {
    try {
        // ✅ Uso do modelo User importado no topo - CORREÇÃO DE VULNERABILIDADE/PERFORMANCE
        const usuario = await User.findById(req.params.id);
        if (!usuario) return res.status(404).send("Usuário não encontrado");
        res.render("perfil", {
            user: usuario,
            admin: req.session.user,
            isOwnProfile: false
        });
    } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        res.status(500).send("Erro ao carregar perfil");
    }
});

// Rotas de cursos e artigos (admin)
app.get("/admin/cursos/novo", requireAuth, (req, res) => {
    res.render("novocurso", { admin: req.session.user });
});

app.get("/admin/artigos/novo", requireAuth, (req, res) => {
    res.render("AdicionarArtigo", { admin: req.session.user });
});
// ✅ Página de edição de artigo (admin)
app.get("/admin/artigos/:id/editar", async (req, res) => {
    try {
        const artigo = await Artigo.findById(req.params.id);
        if (!artigo) return res.status(404).send("Artigo não encontrado");
        res.render("editarArtigo", { admin: req.session.user, artigo });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao carregar artigo para edição");
    }
});


app.get("/admin/cursos/:id/editar", async (req, res) => {
    try {
        // ✅ Uso do modelo Curso importado no topo
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).send("Curso não encontrado");
        res.render("editarcursos", { admin: req.session.user, curso });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao carregar curso");
    }
});

// ==========================
// 📌 ROTAS DE UTILIDADE
// ==========================
app.get("/healthz", (req, res) => res.status(200).send("OK"));

// ==========================
// 📌 ARQUIVOS ESTÁTICOS
// ==========================
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ==========================
// 📌 ROTA FALLBACK
// ==========================
app.get("*", (req, res) => res.status(404).send("Página não encontrada"));

// ==========================
// 🚀 INICIAR SERVIDOR
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));