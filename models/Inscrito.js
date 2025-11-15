const mongoose = require("mongoose");

const inscritoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true },
    curso: { type: mongoose.Schema.Types.ObjectId, ref: "Curso" },
    dataInscricao: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Inscrito", inscritoSchema);
