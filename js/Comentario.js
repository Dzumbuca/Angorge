// Comentario.js
const mongoose = require("mongoose");

const ComentarioSchema = new mongoose.Schema({
    artigoId: { type: mongoose.Schema.Types.ObjectId, ref: "Artigo", required: true },
    autor: { type: String, default: "Anónimo" },
    texto: { type: String, required: true },
    data: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Comentario", ComentarioSchema);
