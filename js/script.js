let lista_imagens = [
  "exodia.svg",
  "fiendsmith.svg",
  "maliss.svg",
  "melodious.svg",
  "tenpai.svg",
  "salamangreat.svg",
]
let imagem_baner = document.getElementById("img_banner")

function trocar_imagem() {
  for (let img in lista_imagens) {
    setTimeout(() => {
      imagem_baner.setAttribute( 'src',`images/svg/${lista_imagens[img]}`)
    }, img*4000)
  }
  
}

trocar_imagem()