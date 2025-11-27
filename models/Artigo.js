// models/Artigo.js
const mongoose = require("mongoose"); // ← ESSENCIAL!

const artigoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    categoria: { type: String, required: true },
    autor: { type: String, required: true },
    dataPublicacao: { type: Date, default: Date.now },
    descricao: { type: String, required: true },
    status: {
        type: String,
        enum: ["publicado", "rascunho", "agendado"],
        default: "rascunho"
    },
    imagem: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Artigo", artigoSchema);