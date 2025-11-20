// Controle do menu hamburger
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("navbarToggle")
  const menu = document.getElementById("navbarMenu")
  if (!toggle || !menu) return

  function openMenu() {
    toggle.classList.add("active")
    menu.classList.add("open")
    document.body.classList.add("menu-open")
    toggle.setAttribute("aria-expanded", "true")
  }

  function closeMenu() {
    toggle.classList.remove("active")
    menu.classList.remove("open")
    document.body.classList.remove("menu-open")
    toggle.setAttribute("aria-expanded", "false")
  }

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.contains("open")
    if (isOpen) {
      closeMenu()
    } else {
      openMenu()
    }
  })

  // Fecha ao clicar em um link
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (menu.classList.contains("open")) {
        closeMenu()
      }
    })
  })

  // Fecha ao redimensionar para desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 769) {
      closeMenu()
    }
  })
})
