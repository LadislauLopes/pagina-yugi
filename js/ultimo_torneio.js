async function carregarUltimoTorneio() {
  try {
    const base =
      "https://opensheet.elk.sh/1hyJl5s4XDxgrsbcQBxKzNA0rpQwA4DwGcomf5CxtKH8"

    // Busca todos os dados necessários
    const [players, tournaments, decks, positions] = await Promise.all([
      fetch(`${base}/Player`).then((r) => r.json()),
      fetch(`${base}/Tournament`).then((r) => r.json()),
      fetch(`${base}/Decks`).then((r) => r.json()),
      fetch(`${base}/Tournament_Position`).then((r) => r.json()),
    ])

    if (!tournaments.length) return console.warn("Nenhum torneio encontrado")

    // Pega o torneio mais recente
    const ultimoTorneio = tournaments
      .map((t) => ({ ...t, DateObj: new Date(t.Date || t.Data) }))
      .sort((a, b) => b.DateObj - a.DateObj)[0]

    // Filtra as posições do Top 4
    const posicoes = positions
      .filter((p) => p.Id_Tournament === ultimoTorneio.Id_Tournament)
      .sort((a, b) => Number(a.Position) - Number(b.Position))
      .slice(0, 4)

    // Cria array de participantes com nome limitado a duas palavras
    const participantes = posicoes.map((p) => {
      const player = players.find((pl) => pl.Id_Player === p.Id_Player)
      const deck = decks.find((d) => d.Id_Decks === p.Deck)
      return {
        nome: player
          ? `${player.FirstName} ${player.LastName}`
              .split(" ")
              .slice(0, 2)
              .join(" ")
          : "Desconhecido",
        deck: deck ? deck.Nome : "Desconhecido",
        urlDeck: deck && deck.url ? deck.url : "images/png/enerd/unknown.png", // fallback
      }
    })

    // Atualiza título do torneio com data e número de participantes
    const title = document.querySelector(".title_dourado")
    if (title) {
      const dataObj = new Date(ultimoTorneio.Date || ultimoTorneio.Data)
      const dataFormatada = dataObj.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      title.textContent = `Resultado do Torneio em ${dataFormatada} - Top ${participantes.length}`
    }

    // Atualiza cards do Top 4
    participantes.forEach((p, index) => {
      const card = document.getElementById(`top_${index + 1}`)
      if (!card) return

      // Atualiza o nome do deck dentro do card
      const pDeck = card.querySelector("p")
      if (pDeck) pDeck.textContent = p.deck

      // Aplica imagem do deck como fundo
      card.style.backgroundImage = `url(${p.urlDeck})`
      card.style.backgroundSize = "cover"
      card.style.backgroundPosition = "center"

      // Atualiza o nome do jogador no <h1> ao lado de fora
      const h1Participante = card.nextElementSibling
      if (h1Participante && h1Participante.tagName === "H1") {
        h1Participante.textContent = p.nome
      }
    })

    console.log("Top 4 carregado:", participantes)
  } catch (err) {
    console.error("Erro ao carregar dados do torneio:", err)
  }
}

// Chama a função
carregarUltimoTorneio()
