// ============================
// === BUSCA PERFIL JOGADOR ===
// ============================

/**
 * Calcula o winrate ponderado de um jogador usando Bayes.
 */
function calcularWinratePonderadoPerfil(stats, playerId, C = 5) {
  const s = stats[playerId] || { partidas: 0, vitorias: 0 }

  const winratesArr = Object.values(stats)
    .filter((x) => x.partidas > 0)
    .map((x) => x.vitorias / x.partidas)

  const mediaGlobal = winratesArr.length
    ? winratesArr.reduce((a, b) => a + b, 0) / winratesArr.length
    : 0

  const bayesNumeric = (s.vitorias + C * mediaGlobal) / (s.partidas + C)
  return +(bayesNumeric * 100).toFixed(2)
}

/**
 * Busca informações completas do jogador
 */
async function buscarPerfilJogador(playerId) {
  try {
    const base =
      "https://opensheet.elk.sh/1hyJl5s4XDxgrsbcQBxKzNA0rpQwA4DwGcomf5CxtKH8"

    // Busca todos os dados necessários
    const [players, tournaments, matches, positions, decks] = await Promise.all(
      [
        fetch(`${base}/Player`).then((r) => r.json()),
        fetch(`${base}/Tournament`).then((r) => r.json()),
        fetch(`${base}/Match`).then((r) => r.json()),
        fetch(`${base}/Tournament_Position`).then((r) => r.json()),
        fetch(`${base}/Decks`).then((r) => r.json()),
      ]
    )

    const normalizeId = (v) =>
      v === null || v === undefined ? "" : String(v).trim()
    const playerIdNorm = normalizeId(playerId)

    // Busca o jogador
    const player = players.find(
      (p) => normalizeId(p.Id_Player) === playerIdNorm
    )
    if (!player) {
      throw new Error("Jogador não encontrado")
    }

    const nomeCompleto = `${player.FirstName || ""} ${
      player.LastName || ""
    }`.trim()

    // ============================
    // === Calcula estatísticas ===
    // ============================
    const stats = {}
    const deckUsage = {}
    const oponentes = {}

    // Busca decks usados pelo jogador através de Tournament_Position
    positions.forEach((pos) => {
      if (normalizeId(pos.Id_Player) === playerIdNorm && pos.Deck) {
        deckUsage[pos.Deck] = (deckUsage[pos.Deck] || 0) + 1
      }
    })

    matches.forEach((m) => {
      const p1 = normalizeId(m.Player_1)
      const p2 = normalizeId(m.Player_2)

      if (!p1 && !p2) return

      // Inicializa stats
      if (p1) stats[p1] = stats[p1] || { partidas: 0, vitorias: 0 }
      if (p2) stats[p2] = stats[p2] || { partidas: 0, vitorias: 0 }

      if (p1) stats[p1].partidas++
      if (p2) stats[p2].partidas++

      // Determina vencedor
      let winnerId = null
      const winnerNorm = normalizeId(m.Winner)

      if (winnerNorm && (winnerNorm === p1 || winnerNorm === p2)) {
        winnerId = winnerNorm
      } else if (winnerNorm === "1" && p1) {
        winnerId = p1
      } else if (winnerNorm === "2" && p2) {
        winnerId = p2
      }

      if (winnerId) {
        stats[winnerId] = stats[winnerId] || { partidas: 0, vitorias: 0 }
        stats[winnerId].vitorias++
      }

      // Análise específica do jogador
      if (p1 === playerIdNorm || p2 === playerIdNorm) {
        // Análise de oponentes
        const oponenteId = p1 === playerIdNorm ? p2 : p1
        if (oponenteId) {
          if (!oponentes[oponenteId]) {
            oponentes[oponenteId] = { vitorias: 0, derrotas: 0 }
          }

          if (winnerId === playerIdNorm) {
            oponentes[oponenteId].vitorias++
          } else if (winnerId === oponenteId) {
            oponentes[oponenteId].derrotas++
          }
        }
      }
    })

    // ============================
    // === Processa resultados ====
    // ============================

    // Deck mais usado
    let deckMaisUsado = "Nenhum"
    console.log("Deck usage:", deckUsage)
    console.log("Decks disponíveis:", decks)

    if (Object.keys(deckUsage).length > 0) {
      const deckIdMaisUsado = Object.entries(deckUsage).sort(
        (a, b) => b[1] - a[1]
      )[0][0]
      console.log("Deck ID mais usado:", deckIdMaisUsado)

      const deckObj = decks.find((d) => d.Id_Decks === deckIdMaisUsado)
      console.log("Deck encontrado:", deckObj)

      deckMaisUsado = deckObj ? deckObj.Nome : deckIdMaisUsado
    }

    // Oponente que mais ganha
    let ganhaMaisDe = "Nenhum"
    const oponentesGanha = Object.entries(oponentes)
      .filter(([_, stats]) => stats.vitorias > 0)
      .sort((a, b) => b[1].vitorias - a[1].vitorias)

    if (oponentesGanha.length > 0) {
      const opId = oponentesGanha[0][0]
      const opPlayer = players.find((p) => normalizeId(p.Id_Player) === opId)
      ganhaMaisDe = opPlayer
        ? `${opPlayer.FirstName} ${opPlayer.LastName}`.trim()
        : opId
    }

    // Oponente que mais perde
    let perdeMaisDe = "Nenhum"
    const oponentesPerde = Object.entries(oponentes)
      .filter(([_, stats]) => stats.derrotas > 0)
      .sort((a, b) => b[1].derrotas - a[1].derrotas)

    if (oponentesPerde.length > 0) {
      const opId = oponentesPerde[0][0]
      const opPlayer = players.find((p) => normalizeId(p.Id_Player) === opId)
      perdeMaisDe = opPlayer
        ? `${opPlayer.FirstName} ${opPlayer.LastName}`.trim()
        : opId
    }

    // Stats do jogador
    const playerStats = stats[playerIdNorm] || { partidas: 0, vitorias: 0 }
    const winrate =
      playerStats.partidas > 0
        ? ((playerStats.vitorias / playerStats.partidas) * 100).toFixed(2)
        : "0.00"

    // Winrate ponderado
    const winratePonderado = calcularWinratePonderadoPerfil(stats, playerIdNorm)

    // Torneios participados
    const torneiosParticipados = positions.filter(
      (p) => normalizeId(p.Id_Player) === playerIdNorm
    ).length

    return {
      nome: nomeCompleto,
      deckMaisUsado,
      ganhaMaisDe,
      perdeMaisDe,
      winrate: `${winrate}%`,
      torneiosParticipados,
      winratePonderado: `${winratePonderado}%`,
      vitorias: playerStats.vitorias,
      partidas: playerStats.partidas,
    }
  } catch (error) {
    console.error("Erro ao buscar perfil:", error)
    throw error
  }
}
