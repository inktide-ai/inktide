// Quackie login theme: the REC timecode, the tape label that follows the nickname (or the email's
// name on login), the show-password toggle, and feeding the tape into the deck on submit.
(function () {
  'use strict'

  var FPS = 24

  // HH:MM:SS:FF since the page opened, like the landing's.
  function timecode() {
    var el = document.querySelector('[data-qk-timecode]')
    if (!el) return
    var start = performance.now()
    function tick(now) {
      var frames = Math.floor(((now - start) / 1000) * FPS)
      var s = Math.floor(frames / FPS)
      el.textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60, frames % FPS]
        .map(function (n) { return String(n).padStart(2, '0') })
        .join(':')
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  function label() {
    var target = document.querySelector('[data-qk-label]')
    var source = document.querySelector('[data-qk-label-source]')
    if (!target || !source) return
    var placeholder = target.getAttribute('data-placeholder') || ''
    var fromEmail = source.getAttribute('data-qk-label-mode') === 'email'
    function render() {
      var value = source.value.trim()
      if (fromEmail) value = value.split('@')[0]
      target.textContent = value || placeholder
      target.classList.toggle('is-blank', !value)
    }
    source.addEventListener('input', render)
    render()
  }

  function passwordToggles() {
    document.querySelectorAll('[data-qk-toggle]').forEach(function (button) {
      var input = document.getElementById(button.getAttribute('data-qk-toggle'))
      if (!input) return
      button.addEventListener('click', function () {
        var shown = input.type === 'text'
        input.type = shown ? 'password' : 'text'
        button.setAttribute('aria-pressed', String(!shown))
        button.setAttribute('aria-label', button.getAttribute(shown ? 'data-show' : 'data-hide'))
        input.focus()
      })
    })
  }

  // The form posts as usual; the tape slides into the deck while the request is on its way.
  function record() {
    var form = document.querySelector('[data-qk-record]')
    if (!form) return
    form.addEventListener('submit', function () {
      // Keycloak checks the password against password-confirm; the sign-up form asks for it once.
      var confirm = form.querySelector('[data-qk-confirm]')
      var password = form.querySelector('input[name="password"]')
      if (confirm && password) confirm.value = password.value

      var deck = document.querySelector('[data-qk-deck]')
      if (deck) deck.classList.add('is-inserting')
      var button = form.querySelector('button[type="submit"]')
      if (button) button.disabled = true
    })
  }

  // Coming back with the browser's Back button restores the page from cache: take the tape out again.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return
    var deck = document.querySelector('[data-qk-deck]')
    if (deck) deck.classList.remove('is-inserting')
    document.querySelectorAll('[data-qk-record] button[type="submit"]').forEach(function (b) { b.disabled = false })
  })

  timecode()
  label()
  passwordToggles()
  record()
})()
