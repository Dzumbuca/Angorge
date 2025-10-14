const mongoose = require("mongoose"); // apenas uma vez

const CursoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    autor: { type: String, default: "Equipe ANGORGE" },
    tipo: { type: String, default: "Treinamento" },
    categoria: { type: String },
    duracao: { type: String },
    descricao: { type: String },
    aprendizado: [{ type: String }],          // Lista de aprendizagens
    requisitos: [{ type: String }],           // Lista de requisitos
    curriculo: [
        {
            titulo: { type: String, default: "Módulo" },
            conteudo: { type: String, required: true }
        }
    ],
    inclui: [{ type: String }],               // Lista de benefícios
    preco: { type: mongoose.Schema.Types.Mixed, default: "Sob Consulta" }, // Aceita número ou texto
    status: { type: String, enum: ["Disponível", "Disponível Agora", "Em Breve", "Encerrado"], default: "Disponível Agora" }
    ,

    imagem: { type: String }                  // Caminho da imagem
}, { timestamps: true });

// Antes de salvar, podemos sanitizar campos se necessário
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
