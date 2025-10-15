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

  new Chart(ctx, {
    type: "pie",
    data,
    options: {
      layout: { padding: 60 },
      plugins: { legend: { display: false } },
    },
    plugins: [
      {
        afterDraw: (chart) => {
          const arcs = chart.getDatasetMeta(0).data
          const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0)
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

            const midRadius = outerRadius * 0.9
            const lineStartX = cx + midRadius * Math.cos(angleMid)
            const lineStartY = cy + midRadius * Math.sin(angleMid)
            const lineLength = outerRadius * 0.35
            const lineEndX =
              cx + (outerRadius + lineLength) * Math.cos(angleMid)
            const lineEndY =
              cy + (outerRadius + lineLength) * Math.sin(angleMid)
            const percent = ((slice.value / total) * 100).toFixed(1) + "%"
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
          })
        },
      },
    ],
  })
})
