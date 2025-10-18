async function carregarGraficoTopDecks() {
  try {
    const base =
      "https://opensheet.elk.sh/1hyJl5s4XDxgrsbcQBxKzNA0rpQwA4DwGcomf5CxtKH8"

    const [players, tournaments, decks, positions] = await Promise.all([
      fetch(`${base}/Player`).then((r) => r.json()),
      fetch(`${base}/Tournament`).then((r) => r.json()),
      fetch(`${base}/Decks`).then((r) => r.json()),
      fetch(`${base}/Tournament_Position`).then((r) => r.json()),
    ])

    if (!tournaments.length) return console.warn("Nenhum torneio encontrado")

    // Pega os últimos 4 torneios
    const ultimosTorneios = tournaments
      .map((t) => ({ ...t, DateObj: new Date(t.Date || t.Data) }))
      .sort((a, b) => b.DateObj - a.DateObj)
      .slice(0, 4)

    // Atualiza título do gráfico com datas inicial e final
    const graficoTitulo = document.getElementById("graficoTitulo")
    if (graficoTitulo && ultimosTorneios.length) {
      const datas = ultimosTorneios.map((t) => t.DateObj)
      const dataInicial = new Date(Math.min(...datas)).toLocaleDateString()
      const dataFinal = new Date(Math.max(...datas)).toLocaleDateString()
      graficoTitulo.textContent = `Distribuição de Decks do Top 4 (${dataInicial} - ${dataFinal})`
    }

    // Contagem de decks
    const deckCounts = {}
    ultimosTorneios.forEach((torneio) => {
      const top4 = positions
        .filter((p) => p.Id_Tournament === torneio.Id_Tournament)
        .sort((a, b) => Number(a.Position) - Number(b.Position))
        .slice(0, 4)

      top4.forEach((p) => {
        const deck = decks.find((d) => d.Id_Decks === p.Deck)
        const nomeDeck = deck ? deck.Nome : "Desconhecido"
        if (!deckCounts[nomeDeck])
          deckCounts[nomeDeck] = { count: 0, url: deck?.url || "" }
        deckCounts[nomeDeck].count++
      })
    })

    // Constrói slices do gráfico
    const totalCount = Object.values(deckCounts).reduce(
      (a, b) => a + b.count,
      0
    )
    const slices = []
    let outrosCount = 0

    Object.entries(deckCounts).forEach(([nome, info]) => {
      const percent = (info.count / totalCount) * 100
      if (percent < 10) {
        outrosCount += info.count
      } else {
        slices.push({
          label: nome,
          value: info.count,
          color: "#000",
          image: info.url,
        })
      }
    })

    if (outrosCount > 0) {
      slices.push({
        label: "Outros",
        value: outrosCount,
        color: "#ccc",
        image: "images/png/outros.jpg",
      })
    }

    // Preload imagens
    const imagePromises = slices.map((slice) => {
      const img = new Image()
      img.src = slice.image
      slice.imgObj = img
      return new Promise((resolve) => (img.onload = resolve))
    })
    await Promise.all(imagePromises)

    const ctx = document.getElementById("pieChart").getContext("2d")
    const data = {
      labels: slices.map((s) => s.label),
      datasets: [
        {
          data: slices.map((s) => s.value),
          backgroundColor: slices.map((s) => s.color),
        },
      ],
    }

    // Plugin para desenhar imagens nas fatias
    const imageSlicesPlugin = {
      id: "imageSlicesPlugin",
      afterDraw: (chart) => {
        const arcs = chart.getDatasetMeta(0).data
        const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0)
        const isMobile = window.matchMedia("(max-width: 600px)").matches

        arcs.forEach((arc, i) => {
          const slice = slices[i]
          const img = slice.imgObj
          const { x: cx, y: cy, outerRadius, startAngle, endAngle } = arc
          const angleMid = (startAngle + endAngle) / 2
          const radiusMid = outerRadius * 0.5
          const centerX = cx + radiusMid * Math.cos(angleMid)
          const centerY = cy + radiusMid * Math.sin(angleMid)

          const sliceWidth = outerRadius * (endAngle - startAngle)
          const sliceHeight = outerRadius * 1.1
          const imgRatio = img.width / img.height
          let drawWidth, drawHeight
          if (sliceWidth / sliceHeight > imgRatio) {
            drawWidth = sliceWidth
            drawHeight = drawWidth / imgRatio
          } else {
            drawHeight = sliceHeight
            drawWidth = drawHeight * imgRatio
          }

          ctx.save()
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.arc(cx, cy, outerRadius, startAngle, endAngle)
          ctx.closePath()
          ctx.clip()
          ctx.drawImage(
            img,
            centerX - drawWidth / 2,
            centerY - drawHeight / 2,
            drawWidth,
            drawHeight
          )
          ctx.restore()

          if (!isMobile) {
            const midRadius = outerRadius * 0.9
            const lineStartX = cx + midRadius * Math.cos(angleMid)
            const lineStartY = cy + midRadius * Math.sin(angleMid)
            const lineLength = outerRadius * 0.35
            const lineEndX =
              cx + (outerRadius + lineLength) * Math.cos(angleMid)
            const lineEndY =
              cy + (outerRadius + lineLength) * Math.sin(angleMid)
            const percent = ((slice.value / total) * 100).toFixed(2) + "%"

            ctx.beginPath()
            ctx.moveTo(lineStartX, lineStartY)
            ctx.lineTo(lineEndX, lineEndY)
            ctx.lineWidth = 2
            ctx.strokeStyle = slice.color
            ctx.stroke()

            ctx.font = "14px Arial"
            ctx.fillStyle = "#000"
            ctx.textAlign = Math.cos(angleMid) > 0 ? "left" : "right"
            const textX = Math.min(
              Math.max(lineEndX + (Math.cos(angleMid) > 0 ? 10 : -10), 20),
              chart.width - 20
            )
            const textY = Math.min(Math.max(lineEndY, 20), chart.height - 10)
            ctx.fillText(`${slice.label} (${percent})`, textX, textY)
          }
        })
      },
    }

    const chart = new Chart(ctx, {
      type: "pie",
      data,
      options: {
        layout: { padding: 60 },
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: false,
      },
      plugins: [imageSlicesPlugin],
    })

    // Legenda móvel
    function renderLegendIfMobile(containerSelector = ".grafico_container") {
      const isMobile = window.matchMedia("(max-width: 600px)").matches
      const container = document.querySelector(containerSelector)
      if (!container) return

      let legendEl = container.querySelector(".grafico_legenda")
      if (!legendEl) {
        legendEl = document.createElement("div")
        legendEl.className = "grafico_legenda"
        container.appendChild(legendEl)
      }

      if (!isMobile) {
        legendEl.style.display = "none"
        return
      }

      legendEl.innerHTML = ""
      slices.forEach((s) => {
        const item = document.createElement("div")
        item.className = "grafico_legenda_item"
        const color = document.createElement("span")
        color.className = "grafico_legenda_cor"
        color.style.background = s.color
        const text = document.createElement("span")
        const total = slices.reduce((a, b) => a + b.value, 0)
        const percent = ((s.value / total) * 100).toFixed(2) + "%"
        text.textContent = `${s.label} (${percent})`
        item.appendChild(color)
        item.appendChild(text)
        legendEl.appendChild(item)
      })
      legendEl.style.display = "flex"
    }

    renderLegendIfMobile()
    window.addEventListener("resize", () => {
      renderLegendIfMobile()
      chart.update()
    })
  } catch (err) {
    console.error("Erro ao carregar gráfico de decks:", err)
  }
}

// Chama a função
carregarGraficoTopDecks()
