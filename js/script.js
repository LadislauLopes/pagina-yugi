const imagem_baner = document.getElementById("img_banner")
const lista_imagens = [
  "exodia.svg",
  "blue-eyes.svg",
  "yummy.svg",
  "fiendsmith.svg",
  "maliss.svg",
  "melodious.svg",
  "tenpai.svg",
  "crystron.svg",
  "albaz.svg",
  "centurion.svg",
]
let positon_banner = 1
const quantidade_na_lista = lista_imagens.length - 1

const nextImageBanner = () => {

  imagem_baner.classList.remove("visible")
  imagem_baner.classList.add("fade")


  setTimeout(() => {
    imagem_baner.setAttribute(
      "src",
      `images/svg/decks/${lista_imagens[positon_banner]}`
    )


    if (positon_banner === quantidade_na_lista) {
      positon_banner = 0
    } else {
      positon_banner += 1
    }


    imagem_baner.classList.remove("fade")
    imagem_baner.classList.add("visible")
  }, 300) 
}

let positon_cards = 1
const nextImagecards = (caminho) => {
  imagem_card_1.setAttribute("src", `images/png/turma/img${positon_cards}.jpg`)
  imagem_card_2.setAttribute("src", `images/png/jogos/jogo${positon_cards}.jpg`)
  if (positon_cards === 4) {
    positon_cards = 1
  } else {
    positon_cards += 1
  }
}
setInterval(nextImageBanner, 3000)
// setInterval(nextImagecards, 6000)
