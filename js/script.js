let lista_imagens = [
  "exodia.svg",
  "fiendsmith.svg",
  "maliss.svg",
  "melodious.svg",
  "tenpai.svg",
  "salamangreat.svg",
]
let imagem_baner = document.getElementById("img_banner").src

function trocar_imagem() {
  for (let img in lista_imagens) {
    setTimeout(() => {
      imagem_baner = `images/svg/${lista_imagens[img]}`
      console.log(imagem_baner)
    }, img*1000)

  }
}
trocar_imagem()
