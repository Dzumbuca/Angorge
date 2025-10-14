const mongoose = require("mongoose");

const inscricaoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true },
    telefone: { type: String },
    cursoId: { type: String, required: true },
    data: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Inscricao", inscricaoSchema);
