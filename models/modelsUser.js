// models/modelsUser.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    nome: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    email: { type: String },
    telefone: { type: String },
    perfil: {
        type: String,
        enum: ["administrador", "editor", "usuario"], // ✅ adicione "usuario"
        default: "usuario"                            // ✅ valor padrão válido
    },
    status: {
        type: String,
        enum: ["ativo", "inativo"], // ✅ use minúsculas para consistência
        default: "ativo"            // ✅ tudo em minúsculo
    },
    foto: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);