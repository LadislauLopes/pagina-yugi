fetch(
  "https://docs.google.com/spreadsheets/d/1atfDorD0HDMKrMy-IJDoKJOPPp8ac5v3tSQl7bAtJ-Y/export?format=csv"
)
  .then((res) => res.text())
  .then((csv) => {
    console.log("CSV bruto recebido:", csv)

    const linhas = csv.trim().split("\n")
    console.log("Linhas separadas:", linhas)

    const cabecalho = linhas[0].split(",").map((c) => c.trim())
    console.log("Cabeçalho limpo:", cabecalho)

    const dados = linhas.slice(1).map((linha, idx) => {
      const valores = linha.split(",").map((v) => v.trim())
      console.log(`Linha ${idx + 1}:`, valores)

      let obj = {}
      cabecalho.forEach((col, i) => {
        obj[col] = valores[i]
      })

      console.log("Objeto antes de converter:", obj)

      // limpeza e conversão dos pontos
      obj.Pontos = Number((obj.Pontos || "").replace(/[^0-9]/g, ""))
      console.log("Objeto depois de converter:", obj)

      return obj
    })

    renderTabela(dados)
  })
  .catch((err) => console.error("Erro ao carregar CSV:", err))

function renderTabela(data) {
  const tbody = document.getElementById("ranking-body")
  tbody.innerHTML = ""

  data
    .sort((a, b) => b.Pontos - a.Pontos)
    .forEach((item, index) => {
      const medal =
        index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : ""
      const row = document.createElement("tr")
      row.innerHTML = `
          <td class="rank"><span class="medal">${medal}</span>${index + 1}</td>
          <td class="name">${item.Pessoa}</td>
          <td class="points">${item.Pontos}</td>
        `
      tbody.appendChild(row)
    })
}
