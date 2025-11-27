const mongoose = require("mongoose");

const CursoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    autor: { type: String, default: "Equipe ANGORGE" },
    tipo: { type: String, default: "Treinamento" },
    categoria: { type: String },
    duracao: { type: String },
    descricao: { type: String },
    aprendizado: [{ type: String }],
    requisitos: [{ type: String }],
    curriculo: [
        {
            titulo: { type: String, default: "Módulo" },
            conteudo: { type: String } // ← SEM required: true
        }
    ],
    inclui: [{ type: String }],
    preco: { type: mongoose.Schema.Types.Mixed, default: "Sob Consulta" },
    status: {
        type: String,
        enum: ["Disponível", "Disponível Agora", "Em Breve", "Encerrado"],
        default: "Disponível Agora"
    },
    imagem: { type: String }
}, { timestamps: true });

// Middleware de limpeza (mantenha assim)
CursoSchema.pre("save", function (next) {
    if (this.curriculo && this.curriculo.length > 0) {
        this.curriculo = this.curriculo
            .map(item => ({
                titulo: item.titulo || "Módulo",
                conteudo: item.conteudo || null
            }))
            .filter(item => item.conteudo); // remove módulos sem conteudo
    }
    next();
});

module.exports = mongoose.model("Curso", CursoSchema);