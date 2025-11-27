// Só administradores
function requireAdmin(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.perfil !== "administrador") {
        return res.status(403).send("Acesso negado. Apenas administradores.");
    }
    next();
}

// Acesso ao próprio perfil: qualquer usuário logado
function requireAuth(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    next();
}

// ⚠️ Exporta as funções
module.exports = { requireAdmin, requireAuth };
