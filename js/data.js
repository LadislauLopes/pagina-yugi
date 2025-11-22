// Links das worksheets já com corte do intervalo B4:D100
const urlAtual =
  "https://docs.google.com/spreadsheets/d/11eE0n9zHcdamJtO4q2s76imr4xLERTUZ-DMIa-9cvRA/export?format=csv&gid=818327823&range=B4:D100"
const urlAnual =
  "https://docs.google.com/spreadsheets/d/11eE0n9zHcdamJtO4q2s76imr4xLERTUZ-DMIa-9cvRA/export?format=csv&gid=1641707106&range=B4:D100"

// Função para carregar CSV
function carregarCSV(url, tabelaId) {
  fetch(url)
    .then((res) => res.text())
    .then((csv) => {
      const resultados = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // converte números automaticamente
      }).data

      // Remove linhas sem nome ou pontuação
      const dados = resultados
        .filter(
          (row) =>
            row.Nome && row.Pontuação !== undefined && row.Pontuação !== null
        )
        .map((row) => ({
          Nome: row.Nome,
          Pontuação: Number(row.Pontuação),
          Desempate: Number(row.Desempate || 0),
        }))

      // Remove jogadores com 0 pontos
      const dadosFiltrados = dados.filter((jogador) => jogador.Pontuação > 0)

      // Ordena por Pontuação e Desempate
      dadosFiltrados.sort((a, b) => {
        if (b.Pontuação === a.Pontuação) return b.Desempate - a.Desempate
        return b.Pontuação - a.Pontuação
      })

      renderTabela(dadosFiltrados, tabelaId)
    })
    .catch((err) => console.error("Erro ao carregar CSV:", err))
}

// Função para renderizar tabela com posição correta e medalhas
function renderTabela(data, tabelaId) {
  const tbody = document.getElementById(tabelaId)
  tbody.innerHTML = ""

  let lastPont = null
  let lastDesempate = null
  let pos = 0

  data.forEach((item, index) => {
    // Atualiza posição somente se não for empate
    if (item.Pontuação !== lastPont || item.Desempate !== lastDesempate) {
      pos = index + 1
      lastPont = item.Pontuação
      lastDesempate = item.Desempate
    }

    const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : ""

    const row = document.createElement("tr")
    row.innerHTML = `
      <td class="rank"><span class="medal">${medal}</span>${pos}</td>
      <td class="name">${item.Nome}</td>
      <td class="points">${item.Pontuação}</td>
    `
    tbody.appendChild(row)
  })
}

// Carregar rankings (ambos com desempate)
carregarCSV(urlAtual, "ranking-body-atual")
carregarCSV(urlAnual, "ranking-body-anual")

// Troca de abas
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"))
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"))

    btn.classList.add("active")
    document.getElementById(btn.dataset.target).classList.add("active")
  })
})
