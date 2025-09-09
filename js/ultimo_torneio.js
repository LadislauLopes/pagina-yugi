// =========================
// 1️⃣ Função para buscar CSV da planilha
// =========================
async function fetchSheetData(spreadsheetId, sheetName, range = null) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName
  )}${range ? "&range=" + encodeURIComponent(range) : ""}`
  try {
    const response = await fetch(url)
    if (!response.ok)
      throw new Error(`Erro ao buscar a planilha: ${response.status}`)
    return await response.text()
  } catch (err) {
    console.error(err)
    return null
  }
}

// =========================
// 2️⃣ Função para limpar valores
// =========================
function cleanValue(value) {
  return (value || "")
    .trim()
    .replace(/^"+|"+$/g, "") // remove aspas
    .replace(/\\+/g, "") // remove backslashes extras
    .replace(/\s+$/g, "") // remove espaços finais
}

// =========================
// 3️⃣ Função principal: buscar torneio mais recente + integrar decks
// =========================
async function fetchTorneioMaisRecente(
  spreadsheetId,
  rangeTorneios = "N1:AF22",
  numTorneios = 5,
  sheetDecks = "Decks",
  rangeDecks = "B4:C100"
) {
  // Função para gerar nome da planilha do torneio
  function getSheetTorneio(date) {
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]
    return `Liga ${meses[date.getMonth()]} ${date.getFullYear()}`
  }

  // 1️⃣ Buscar decks
  const csvDecks = await fetchSheetData(spreadsheetId, sheetDecks, rangeDecks)
  const decks = {}
  if (csvDecks) {
    csvDecks.split("\n").forEach((row, i) => {
      const [nomeDeckRaw, urlRaw] = row.split(",")
      if (!nomeDeckRaw || !urlRaw) return
      const nomeDeck = cleanValue(nomeDeckRaw).toLowerCase()
      const urlImagem = cleanValue(urlRaw)
      if (nomeDeck && urlImagem) decks[nomeDeck] = urlImagem
    })
  }

  // 2️⃣ Buscar torneios
  let date = new Date()
  let sheetTorneios = getSheetTorneio(date)
  let csvTorneios = await fetchSheetData(
    spreadsheetId,
    sheetTorneios,
    rangeTorneios
  )

  // Se vazio, tenta o mês anterior
  if (!csvTorneios || csvTorneios.trim() === "") {
    date.setMonth(date.getMonth() - 1)
    sheetTorneios = getSheetTorneio(date)
    csvTorneios = await fetchSheetData(
      spreadsheetId,
      sheetTorneios,
      rangeTorneios
    )
  }

  if (!csvTorneios || csvTorneios.trim() === "") return null

  const rows = csvTorneios.split("\n").map((r) => r.split(","))
  const torneios = []

  for (let t = 0; t < numTorneios; t++) {
    const startCol = t * 4
    const nomeTorneio = cleanValue(rows[0][startCol])
    const data = cleanValue(rows[1][startCol])
    const participantes = []

    const hasPoints = rows
      .slice(2)
      .some((row) => cleanValue(row[startCol + 3]) !== "")
    if (!hasPoints) continue

    for (let i = 2; i < rows.length; i++) {
      const nomeParticipante = cleanValue(rows[i][startCol])
      let deck = cleanValue(rows[i][startCol + 1])
      const posicao = cleanValue(rows[i][startCol + 2])
      const pontos = cleanValue(rows[i][startCol + 3])

      if (nomeParticipante && pontos !== "") {
        const deckKey = deck.toLowerCase().trim()
        const urlDeck = decks[deckKey] || null

        participantes.push({
          nome: nomeParticipante,
          deck,
          posicao: Number(posicao),
          pontos,
          urlDeck,
        })
      }
    }

    participantes.sort((a, b) => a.posicao - b.posicao)

    if (participantes.length > 0) {
      torneios.push({ data, nome: nomeTorneio, participantes })
    }
  }

  return torneios.length > 0 ? torneios[torneios.length - 1] : null
}

// =========================
// 4️⃣ Uso da função e atualização do HTML
// =========================
;(async () => {
  const spreadsheetId = "11eE0n9zHcdamJtO4q2s76imr4xLERTUZ-DMIa-9cvRA"
  const torneioMaisRecente = await fetchTorneioMaisRecente(
    spreadsheetId,
    "N1:AF22",
    5,
    "Decks",
    "B4:C100"
  )

  if (torneioMaisRecente && torneioMaisRecente.participantes) {
    torneioMaisRecente.participantes.forEach((p, index) => {
      const card = document.getElementById(`top_${index + 1}`)
      if (!card) return

      const pDeck = card.querySelector("p")
      if (pDeck) pDeck.textContent = p.deck

      if (p.urlDeck) {
        card.style.backgroundImage = `url(${p.urlDeck})`
        card.style.backgroundSize = "cover"
        card.style.backgroundPosition = "center"
      } else {
        console.warn(`[Aviso] URL não encontrada para: ${p.deck}`)
      }

      const h1Participante = card.nextElementSibling
      if (h1Participante && h1Participante.tagName === "H1") {
        h1Participante.textContent = p.nome
      }
    })
  }
})()
