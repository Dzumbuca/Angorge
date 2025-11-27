// limpar-cursos.js
const mongoose = require("mongoose");
const Curso = require("./models/Curso");

mongoose.connect("mongodb://localhost:27017/teuBanco");

async function limpar() {
    // Remove cursos com curriculo inválido OU sem título
    await Curso.deleteMany({
        $or: [
            { titulo: { $exists: false } },
            { titulo: null },
            { titulo: "" },
            { curriculo: { $exists: false } },
            {
                curriculo: {
                    $not: {
                        $elemMatch: {
                            conteudo: { $exists: true, $ne: null, $ne: "" }
                        }
                    }
                }
            }
        ]
    });
    console.log("✅ Cursos inválidos removidos!");
    await mongoose.connection.close();
    process.exit();
}

limpar();