// ============================
// === FUNÇÃO AUXILIAR =======
// ============================
/**
 * Calcula o winrate ponderado de um jogador usando Bayes.
 * @param {string} playerId - ID do jogador
 * @param {Object} stats - Objeto com stats de todos os jogadores { id: { partidas, vitorias } }
 * @param {number} [C=5] - Constante de suavização Bayesiana
 * @returns {number} Winrate ponderado em porcentagem (2 casas decimais)
 */
function calcularWinratePonderado(playerId, stats, C = 5) {
  const s = stats[playerId] || { partidas: 0, vitorias: 0 }

  // Gera array de winrates de todos os jogadores com partidas > 0
  const winratesArr = Object.values(stats)
    .filter((x) => x.partidas > 0)
    .map((x) => x.vitorias / x.partidas)

  const mediaGlobal = winratesArr.length
    ? winratesArr.reduce((a, b) => a + b, 0) / winratesArr.length
    : 0

  // Winrate Bayesiano
  const bayesNumeric = (s.vitorias + C * mediaGlobal) / (s.partidas + C)
  return +(bayesNumeric * 100).toFixed(2)
}

// ============================
// === CARREGA RANKING ANUAL ===
// ============================
async function carregarRankingAnual() {
  try {
    const base =
      "https://opensheet.elk.sh/1hyJl5s4XDxgrsbcQBxKzNA0rpQwA4DwGcomf5CxtKH8"

    const [players, tournaments, matches] = await Promise.all([
      fetch(`${base}/Player`).then((r) => r.json()),
      fetch(`${base}/Tournament`).then((r) => r.json()),
      fetch(`${base}/Match`).then((r) => r.json()),
    ])

    const anoAtual = new Date().getFullYear()

    // Normaliza IDs e nomes dos jogadores
    const playersMap = {}
    players.forEach((p) => {
      if (!p || !p.Id_Player) return
      const id = String(p.Id_Player).trim()
      playersMap[id] = {
        Id_Player: id,
        FirstName: (p.FirstName || "").trim(),
        LastName: (p.LastName || "").trim(),
      }
    })

    // Filtra torneios do ano atual
    const torneiosAno = tournaments.filter((t) => {
      const d = new Date(t.Date || t.Data)
      return d.getFullYear() === anoAtual
    })
    const idsTorneiosAno = new Set(
      torneiosAno.map((t) => String(t.Id_Tournament).trim())
    )

    // Filtra partidas desses torneios
    const partidasAno = matches.filter((m) =>
      idsTorneiosAno.has(String(m.Id_Tournament || "").trim())
    )

    // ============================
    // === Calcula stats jogadores
    // ============================
    const stats = {}
    const normalizeId = (v) =>
      v === null || v === undefined ? "" : String(v).trim()

    partidasAno.forEach((m) => {
      const p1 = normalizeId(m.Player_1)
      const p2 = normalizeId(m.Player_2)
      if (!p1 && !p2) return

      // Inicializa estatísticas
      if (p1) {
        stats[p1] = stats[p1] || { partidas: 0, vitorias: 0 }
        stats[p1].partidas++
      }
      if (p2) {
        stats[p2] = stats[p2] || { partidas: 0, vitorias: 0 }
        stats[p2].partidas++
      }

      // Determina vencedor
      let winnerRaw = m.Winner
      const winnerNorm = normalizeId(winnerRaw)
      let winnerId = null

      if (winnerNorm && (winnerNorm === p1 || winnerNorm === p2)) {
        winnerId = winnerNorm
      } else if (winnerNorm === "1" && p1) {
        winnerId = p1
      } else if (winnerNorm === "2" && p2) {
        winnerId = p2
      } else {
        const maybeByName = String(winnerRaw || "").trim()
        if (maybeByName) {
          const found = players.find((pl) => {
            const full = `${pl.FirstName || ""} ${pl.LastName || ""}`.trim()
            return full.toLowerCase() === maybeByName.toLowerCase()
          })
          if (found) winnerId = normalizeId(found.Id_Player)
        }
      }

      if (winnerId) stats[winnerId] = stats[winnerId] || { partidas: 0, vitorias: 0 }, stats[winnerId].vitorias++
    })

    // Remove jogadores sem partidas
    Object.keys(stats).forEach((id) => {
      if (!stats[id].partidas || stats[id].partidas === 0) delete stats[id]
    })

    // ============================
    // === Gera ranking com Bayes
    // ============================
    const ranking = Object.entries(stats)
      .map(([id, s]) => {
        const playerObj = playersMap[id]
        const nome = playerObj
          ? `${playerObj.FirstName} ${playerObj.LastName}`
              .split(" ")
              .slice(0, 2)
              .join(" ")
          : id

        const winrateNumeric = s.partidas ? s.vitorias / s.partidas : 0
        const bayesNumeric = (s.vitorias + 5 * (Object.values(stats).reduce((a,b)=>a+(b.vitorias/b.partidas),0)/Object.values(stats).length)) / (s.partidas + 5)

        return {
          id,
          nome,
          vitorias: s.vitorias,
          partidas: s.partidas,
          winrate: +(winrateNumeric * 100).toFixed(2),
          bayes: +(bayesNumeric * 100).toFixed(2),
          _bayesNum: bayesNumeric,
          _vitoriasNum: s.vitorias,
          _partidasNum: s.partidas,
        }
      })
      .filter((r) => r.partidas > 0)
      .sort((a, b) => {
        if (b._bayesNum !== a._bayesNum) return b._bayesNum - a._bayesNum
        if (b._vitoriasNum !== a._vitoriasNum) return b._vitoriasNum - a._vitoriasNum
        return b._partidasNum - a._partidasNum
      })
      .slice(0, 3)

    console.log("Top 3 ranking anual (robusto):", ranking)

    // ============================
    // === Atualiza DOM ===========
    // ============================
    const titulo = document.getElementById("rankingTitulo")
    if (titulo)
      titulo.textContent = `Top 3 Jogadores (${anoAtual}) - Ranking Anual`

    const container = document.getElementById("rankingContainer")
    if (container) {
      container.innerHTML = ranking
        .map(
          (p, i) => `
          <div class="rank_card">
            <div class="rank_position">#${i + 1}</div>
            <div class="rank_info">
              <h3 class="rank_name">${p.nome}</h3>
              <p><strong>Vitórias:</strong> ${p.vitorias}</p>
              <p><strong>Partidas:</strong> ${p.partidas}</p>
              <p><strong>Winrate:</strong> ${p.winrate}%</p>
              <p><strong>Média Ponderada:</strong> ${p.bayes}%</p>
            </div>
          </div>
        `
        )
        .join("")
    }
  } catch (err) {
    console.error("Erro ao carregar ranking anual:", err)
  }
}

carregarRankingAnual()
