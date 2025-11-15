const mongoose = require("mongoose");

const ComentarioSchema = new mongoose.Schema({
    artigoId: { type: mongoose.Schema.Types.ObjectId, ref: "Artigo", required: true },
    autor: { type: String, default: "Anónimo" },
    texto: { type: String, required: true },
    data: { type: Date, default: Date.now },
    respostas: {
        type: [{
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // ✅ ESSENCIAL!
            autor: { type: String, default: "Anónimo" },
            texto: { type: String, required: true },
            data: { type: Date, default: Date.now },
            isAdm: { type: Boolean, default: false }
        }],
        default: []
    },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] }
});

module.exports = mongoose.model("Comentario", ComentarioSchema);