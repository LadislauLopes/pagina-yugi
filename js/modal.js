// Modal Meu Perfil
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("perfilModal")
  const openBtn = document.getElementById("openModalBtn")
  const closeBtn = document.querySelector(".close")
  const btnBuscar = document.getElementById("btnBuscar")
  const inputId = document.getElementById("idJogador")

  const loadingDiv = document.getElementById("loadingPerfil")
  const resultadoDiv = document.getElementById("resultadoPerfil")
  const erroDiv = document.getElementById("erroPerfil")

  // Abrir modal
  openBtn.addEventListener("click", function (e) {
    e.preventDefault()
    modal.style.display = "block"
    document.body.style.overflow = "hidden"
    limparResultados()

    // Carrega ID salvo se existir
    const idSalvo = localStorage.getItem("meuIdYugioh")
    if (idSalvo) {
      inputId.value = idSalvo
    }
  })

  // Fechar modal ao clicar no X
  closeBtn.addEventListener("click", function () {
    fecharModal()
  })

  // Fechar modal ao clicar fora dele
  window.addEventListener("click", function (e) {
    if (e.target === modal) {
      fecharModal()
    }
  })

  // Fechar modal com a tecla ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.style.display === "block") {
      fecharModal()
    }
  })

  // Buscar ao clicar no botão
  btnBuscar.addEventListener("click", function () {
    buscarPerfil()
  })

  // Buscar ao pressionar Enter no input
  inputId.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      buscarPerfil()
    }
  })

  function fecharModal() {
    modal.style.display = "none"
    document.body.style.overflow = "auto"
  }

  function limparResultados() {
    loadingDiv.style.display = "none"
    resultadoDiv.style.display = "none"
    erroDiv.style.display = "none"
  }

  async function buscarPerfil() {
    const playerId = inputId.value.trim()

    if (!playerId) {
      alert("Por favor, digite um ID válido")
      return
    }

    limparResultados()
    loadingDiv.style.display = "block"

    try {
      const perfil = await buscarPerfilJogador(playerId)

      // Salva ID no localStorage
      localStorage.setItem("meuIdYugioh", playerId)

      // Atualiza DOM com os dados
      document.getElementById("perfilNome").textContent = perfil.nome
      document.getElementById("perfilDeck").textContent = perfil.deckMaisUsado
      document.getElementById("perfilGanhaMais").textContent =
        perfil.ganhaMaisDe
      document.getElementById("perfilPerdeMais").textContent =
        perfil.perdeMaisDe
      document.getElementById("perfilWinrate").textContent = perfil.winrate
      document.getElementById("perfilTorneios").textContent =
        perfil.torneiosParticipados
      document.getElementById("perfilWinratePonderado").textContent =
        perfil.winratePonderado

      // Atualiza a imagem com o deck mais usado
      const avatarImg = document.querySelector("#resultadoPerfil .avatar-img")
      if (avatarImg && perfil.deckImagemUrl) {
        avatarImg.src = perfil.deckImagemUrl
        avatarImg.alt = `Deck mais usado: ${perfil.deckMaisUsado}`
      }

      // Mostra resultado
      loadingDiv.style.display = "none"
      resultadoDiv.style.display = "block"

      console.log("Perfil carregado:", perfil)
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
      loadingDiv.style.display = "none"
      erroDiv.style.display = "block"
    }
  }
})
