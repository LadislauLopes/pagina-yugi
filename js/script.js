// Efeito de revelar as seções ao rolar a página
function revealOnScroll() {
  const reveals = document.querySelectorAll(".reveal")
  for (const el of reveals) {
    const windowHeight = window.innerHeight
    const elementTop = el.getBoundingClientRect().top
    const revealPoint = 80
    if (elementTop < windowHeight - revealPoint) {
      el.classList.add("active")
    } else {
      el.classList.remove("active")
    }
  }
}
window.addEventListener("scroll", revealOnScroll)
window.addEventListener("DOMContentLoaded", revealOnScroll)
