import prisma from "../lib/prisma.js";

export async function listMemoriais(req, res) {
  try {
    const memoriais = await prisma.memorial.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(memoriais);
  } catch (error) {
    console.error("Erro ao listar memoriais:", error);
    return res.status(500).json({ erro: error.message });
  }
}

export async function getMemorialById(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const memorial = await prisma.memorial.findUnique({
      where: { id },
    });

    if (!memorial) {
      return res.status(404).json({ erro: "Memorial não encontrado." });
    }

    return res.json(memorial);
  } catch (error) {
    console.error("Erro ao buscar memorial:", error);
    return res.status(500).json({ erro: error.message });
  }
}

export async function createMemorial(req, res) {
  try {
    const { nome, biografia, descricao, dataNascimento, dataMorte, localizacao, tipo } = req.body;

    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return res.status(400).json({ erro: "O campo nome é obrigatório." });
    }

    const imagensGaleria = (req.files?.galeria || []).map((file) => `/uploads/${file.filename}`);
    const imagemPrincipal = req.files?.imagem?.[0]
      ? `/uploads/${req.files.imagem[0].filename}`
      : (req.body.imagem?.trim() || imagensGaleria[0] || null);

    const memorial = await prisma.memorial.create({
      data: {
        nome: nome.trim(),
        biografia: biografia?.trim() || null,
        descricao: descricao?.trim() || null,
        dataNascimento: dataNascimento?.trim() || null,
        dataMorte: dataMorte?.trim() || null,
        localizacao: localizacao?.trim() || null,
        tipo: tipo || "historica",
        imagem: imagemPrincipal,
        galeria: imagensGaleria,
      },
    });

    return res.status(201).json(memorial);
  } catch (error) {
    console.error("Erro ao criar memorial:", error);
    return res.status(500).json({ erro: error.message });
  }
}

export async function updateMemorial(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const { nome, biografia, descricao, dataNascimento, dataMorte, localizacao, tipo } = req.body;

    const memorialExistente = await prisma.memorial.findUnique({
      where: { id },
    });

    if (!memorialExistente) {
      return res.status(404).json({ erro: "Memorial não encontrado." });
    }

    const galeriaNova = (req.files?.galeria || []).map((file) => `/uploads/${file.filename}`);
    const galeriaFinal = galeriaNova.length > 0 ? galeriaNova : memorialExistente.galeria ?? [];
    const imagemPrincipal = req.files?.imagem?.[0]
      ? `/uploads/${req.files.imagem[0].filename}`
      : (req.body.imagem?.trim() || memorialExistente.imagem || galeriaFinal[0] || null);

    const memorial = await prisma.memorial.update({
      where: { id },
      data: {
        nome: nome?.trim() || memorialExistente.nome,
        biografia: biografia === undefined ? memorialExistente.biografia : biografia?.trim() || null,
        descricao: descricao === undefined ? memorialExistente.descricao : descricao?.trim() || null,
        dataNascimento: dataNascimento === undefined ? memorialExistente.dataNascimento : dataNascimento?.trim() || null,
        dataMorte: dataMorte === undefined ? memorialExistente.dataMorte : dataMorte?.trim() || null,
        localizacao: localizacao === undefined ? memorialExistente.localizacao : localizacao?.trim() || null,
        tipo: tipo || memorialExistente.tipo || "historica",
        imagem: imagemPrincipal,
        galeria: galeriaFinal,
      },
    });

    return res.json(memorial);
  } catch (error) {
    console.error("Erro ao atualizar memorial:", error);
    return res.status(500).json({ erro: error.message });
  }
}

export async function deleteMemorial(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const memorialExistente = await prisma.memorial.findUnique({
      where: { id },
    });

    if (!memorialExistente) {
      return res.status(404).json({ erro: "Memorial não encontrado." });
    }

    await prisma.memorial.delete({
      where: { id },
    });

    return res.json({ mensagem: "Memorial removido com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir memorial:", error);
    return res.status(500).json({ erro: error.message });
  }
}
