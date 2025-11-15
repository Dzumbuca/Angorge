const mongoose = require("mongoose");

const artigoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    categoria: { type: String, required: true },
    autor: { type: String, required: true },
    dataPublicacao: { type: Date, default: Date.now },
    descricao: { type: String, required: true },
    status: { type: String, enum: ["Publicado", "Rascunho", "Agendado"], default: "Rascunho" },
    imagem: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Artigo", artigoSchema);
