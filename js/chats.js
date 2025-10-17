const ctx = document.getElementById("pieChart").getContext("2d")

const slices = [
  { label: "Yummy", value: 40, color: "#ccc", image: "images/img1.jpg" },
  { label: "Mitsurugi", value: 35, color: "#ccc", image: "images/img4.jpg" },
  { label: "Blue-Eyes", value: 30, color: "#ccc", image: "images/img3.jpg" },
  { label: "Dracotail", value: 15, color: "#ccc", image: "images/img7.jpg" },
  { label: "Outros", value: 10, color: "#ccc", image: "images/img6.jpg" },
]

const imagePromises = slices.map((slice) => {
  const img = new Image()
  img.src = slice.image
  slice.imgObj = img
  return new Promise((resolve) => (img.onload = resolve))
})

Promise.all(imagePromises).then(() => {
  const data = {
    labels: slices.map((s) => s.label),
    datasets: [
      {
        data: slices.map((s) => s.value),
        backgroundColor: slices.map((s) => s.color),
      },
    ],
  }

  // Helper: cria/atualiza a legenda HTML abaixo do canvas
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
      // remove legenda se existir
      legendEl.style.display = "none"
      return
    }

    // Preenche a legenda
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

  // Plugin para desenhar imagens nas fatias, porém controlar as labels de texto
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
          // desenha linhas e labels apenas em desktop/tablet
          const midRadius = outerRadius * 0.9
          const lineStartX = cx + midRadius * Math.cos(angleMid)
          const lineStartY = cy + midRadius * Math.sin(angleMid)
          const lineLength = outerRadius * 0.35
          const lineEndX = cx + (outerRadius + lineLength) * Math.cos(angleMid)
          const lineEndY = cy + (outerRadius + lineLength) * Math.sin(angleMid)
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

  // Inicializa legenda e atualiza em resize
  renderLegendIfMobile()
  window.addEventListener("resize", () => {
    renderLegendIfMobile()
    chart.update()
  })
})
