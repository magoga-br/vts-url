import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/image", express.static(path.join(__dirname, "../image")));

const mongoUri = process.env.MONGO_URI || "mongodb+srv://seu_usuario:sua_senha@cluster0.mongodb.net/vts-url?retryWrites=true&w=majority";

try {
  await mongoose.connect(mongoUri);
  console.log("Conectado ao MongoDB com sucesso!");
} catch (error) {
  console.error("Erro ao conectar ao MongoDB:", error.message);
  console.error("String de conexão:", mongoUri ? "Configurada" : "Não configurada");
  process.exit(1);
}

// 1234 ->
const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
  name: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const Url = mongoose.model("Url", urlSchema);

// Função para gerar uma shortUrl única
async function generateUniqueShortUrl() {
  let shortUrl;
  let urlExists = true;
  while (urlExists) {
    shortUrl = Math.random().toString(36).substring(2, 8);
    const existingUrl = await Url.findOne({ shortUrl });
    if (!existingUrl) {
      urlExists = false;
    }
  }
  return shortUrl;
}

// ZOD validation
const urlValidationSchema = z.object({
  originalUrl: z.string().url({ message: "URL inválida" }),
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof z.ZodError) {
    return res.status(400).json({ errors: err.errors });
  }
  res.status(500).json({ message: "Ocorreu um erro interno no servidor" });
};

// shorten API p/ encurtar URLs
app.post("/api/shorten", async (req, res, next) => {
  try {
    const { originalUrl } = urlValidationSchema.parse(req.body);
    const shortUrl = await generateUniqueShortUrl();
    const url = new Url({ originalUrl, shortUrl });
    await url.save();
    res.status(201).json({ originalUrl, shortUrl });
  } catch (error) {
    next(error);
  }
});

// API de teste
app.get("/api/test", (req, res) => {
  res.json({ message: "API funcionando!", timestamp: new Date() });
});

// API para listar todas as URLs
app.get("/api/urls", async (req, res, next) => {
  try {
    console.log('Buscando URLs no banco...');
    const urls = await Url.find().sort({ createdAt: -1 });
    console.log('URLs encontradas:', urls.length);
    res.json(urls);
  } catch (error) {
    console.error('Erro ao buscar URLs:', error);
    next(error);
  }
});

// Rota para página de gerenciamento (DEVE vir ANTES da rota :shortUrl)
app.get("/manage", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/manage.html"));
});

// Redirect API to handle redirection of shortened URLs
app.get("/:shortUrl", async (req, res, next) => {
  try {
    const { shortUrl } = req.params;
    const url = await Url.findOne({ shortUrl });
    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }
    res.redirect(url.originalUrl);
  } catch (error) {
    next(error);
  }
});

// API para atualizar nome da URL
app.patch("/api/urls/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Nome não pode estar vazio" });
    }
    
    const url = await Url.findByIdAndUpdate(id, { name: name.trim() }, { new: true });
    
    if (!url) {
      return res.status(404).json({ message: "URL não encontrada" });
    }
    
    res.json(url);
  } catch (error) {
    next(error);
  }
});

// API para deletar URL
app.delete("/api/urls/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const url = await Url.findByIdAndDelete(id);
    
    if (!url) {
      return res.status(404).json({ message: "URL não encontrada" });
    }
    
    res.json({ message: "URL deletada com sucesso" });
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
