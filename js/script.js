const imagem_baner = document.getElementById("img_banner")

const lista_imagens = [
  "exodia.svg",
  "fiendsmith.svg",
  "maliss.svg",
  "melodious.svg",
  "tenpai.svg",
  "salamangreat.svg",
]
let positon_banner = 1
const nextImageBanner = () => {
  imagem_baner.setAttribute(
    "src",
    `images/svg/decks/${lista_imagens[positon_banner]}`
  )
  if (positon_banner === 5) {
    positon_banner = 0
  } else {
    positon_banner += 1
  }
}

let positon_cards = 1
const nextImagecards = (caminho) => {
  imagem_baner.setAttribute("src", `${caminho}img${[positon_cards]}`)
  if (positon === 4) {
    positon_cards = 1
  } else {
    positon_cards += 1
  }
}

setInterval(nextImageBanner, 4000)
