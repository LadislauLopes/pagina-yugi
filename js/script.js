const imagem_baner = document.getElementById("img_banner")

const lista_imagens = [
  "exodia.svg",
  "fiendsmith.svg",
  "maliss.svg",
  "melodious.svg",
  "tenpai.svg",
  "salamangreat.svg",]
let positon = 1 
const nextImage = () => {
  imagem_baner.setAttribute("src", `images/svg/${lista_imagens[positon]}`)
  if (positon===5){
    positon=0
  }else{
    positon+=1
  }
}

setInterval(nextImage,4000)