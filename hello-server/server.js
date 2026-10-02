const express = require('express')
const fs = require('node:fs/promises')
const path = require('node:path')

const app = express()
const PORT = 3000
const DATA_FILE = path.join(__dirname, 'data.json')

app.use(express.json())

async function lerEmprestimos() {
  try {
    const dados = await fs.readFile(DATA_FILE, 'utf8')
    return JSON.parse(dados)
  } catch (erro) {
    if (erro.code === 'ENOENT') return []
    throw erro
  }
}

async function salvarEmprestimos(emprestimos) {
  await fs.writeFile(DATA_FILE, JSON.stringify(emprestimos, null, 2))
}

function campoObrigatorioAusente(body) {
  if (!body?.nomeAluno) return 'nomeAluno'
  if (!body?.livro) return 'livro'
  return null
}

//rotas

app.get('/', (req, res) => {
  res.send('Hello, world!')
})

app.get('/emprestimos', async (req, res) => {
  const emprestimos = await lerEmprestimos()
  res.json(emprestimos.filter((emprestimo) => !emprestimo.devolvidoEm))
})

app.get('/emprestimos/:id', async (req, res) => {
  const emprestimos = await lerEmprestimos()
  const id = Number(req.params.id)
  const emprestimo = emprestimos.find((item) => item.id === id)

  if (!emprestimo) return res.status(404).json({ erro: 'Empréstimo não encontrado' })
  res.json(emprestimo)
})

app.post('/emprestimos', async (req, res) => {
  const campoAusente = campoObrigatorioAusente(req.body)
  if (campoAusente) {
    return res.status(400).json({ erro: `Campo obrigatório: ${campoAusente}` })
  }

  const emprestimos = await lerEmprestimos()
  const id = emprestimos.reduce((maiorId, item) => Math.max(maiorId, Number(item.id) || 0), 0) + 1
  const novoEmprestimo = {
    id,
    nomeAluno: req.body.nomeAluno,
    livro: req.body.livro,
    devolvidoEm: null,
  }

  emprestimos.push(novoEmprestimo)
  await salvarEmprestimos(emprestimos)
  res.status(201).json(novoEmprestimo)
})

app.put('/emprestimos/:id', async (req, res) => {
  const campoAusente = campoObrigatorioAusente(req.body)
  if (campoAusente) {
    return res.status(400).json({ erro: `Campo obrigatório: ${campoAusente}` })
  }

  const emprestimos = await lerEmprestimos()
  const id = Number(req.params.id)
  const indice = emprestimos.findIndex((item) => item.id === id)

  if (indice === -1) return res.status(404).json({ erro: 'Empréstimo não encontrado' })

  const atualizado = {
    id,
    nomeAluno: req.body.nomeAluno,
    livro: req.body.livro,
    devolvidoEm: emprestimos[indice].devolvidoEm ?? null,
  }
  emprestimos[indice] = atualizado
  await salvarEmprestimos(emprestimos)
  res.json(atualizado)
})

app.patch('/emprestimos/:id', async (req, res) => {
  const emprestimos = await lerEmprestimos()
  const id = Number(req.params.id)
  const emprestimo = emprestimos.find((item) => item.id === id)

  if (!emprestimo) return res.status(404).json({ erro: 'Empréstimo não encontrado' })

  if (req.body?.nomeAluno !== undefined) emprestimo.nomeAluno = req.body.nomeAluno
  if (req.body?.livro !== undefined) emprestimo.livro = req.body.livro

  await salvarEmprestimos(emprestimos)
  res.json(emprestimo)
})

app.delete('/emprestimos/:id', async (req, res) => {
  const emprestimos = await lerEmprestimos()
  const id = Number(req.params.id)
  const emprestimo = emprestimos.find((item) => item.id === id)

  if (!emprestimo) return res.status(404).json({ erro: 'Empréstimo não encontrado' })
  if (emprestimo.devolvidoEm) {
    return res.status(409).json({ erro: 'Empréstimo já foi devolvido' })
  }

  emprestimo.devolvidoEm = new Date().toISOString()
  await salvarEmprestimos(emprestimos)
  res.status(204).end()
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})