
const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    nome: { type: String, required: true, unique: true },
    senha: { type: String }, // ⚠️ pode ser null/undefined para contas Google
    email: { type: String },
    telefone: { type: String },
    perfil: {
        type: String,
        enum: ["administrador", "editor", "usuario"],
        default: "usuario"
    },
    status: {
        type: String,
        enum: ["ativo", "inativo"],
        default: "ativo"
    },
    foto: { type: String },
    // ✅ Campo essencial para login com Google
    googleId: { 
        type: String, 
        unique: true, 
        sparse: true // permite múltiplos nulls (não obrigatório para usuários normais)
    }
}, { timestamps: true });


module.exports = mongoose.model("User", userSchema);