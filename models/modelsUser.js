// models/modelsUser.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    nome: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    email: { type: String },
    telefone: { type: String },
    perfil: {
        type: String,
        enum: ["administrador", "editor"],
        default: "visitante"
    },
    status: {
        type: String,
        enum: ["Ativo", "Inativo"],
        default: "Ativo"
    },
    foto: { type: String } // Para upload de imagem
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);