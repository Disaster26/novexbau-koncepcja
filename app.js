(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* menu na telefonie */
  var panel = $('#panel'), burger = $('#burger');
  function openPanel() { panel.hidden = false; burger.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
  function closePanel() { panel.hidden = true; burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  burger.addEventListener('click', openPanel);
  $('#panelX').addEventListener('click', closePanel);
  panel.querySelectorAll('nav a').forEach(function (a) { a.addEventListener('click', closePanel); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) closePanel(); });

  /* dolny pasek: dopiero po przewinięciu za przycisk w hero, chowany przy formularzu */
  var mob = $('#mob'), cta = $('#heroCta'), zap = $('#zapytanie');
  if ('IntersectionObserver' in window) {
    var pastHero = false, inForm = false;
    var upd = function () { mob.classList.toggle('widac', pastHero && !inForm); };
    new IntersectionObserver(function (en) {
      var e = en[0]; pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; upd();
    }).observe(cta);
    new IntersectionObserver(function (en) { inForm = en[0].isIntersecting; upd(); }, { threshold: 0.15 }).observe(zap);
  }

  /* formularz zapytania */
  var form = $('#form'), msg = $('#msg'), lista = $('#lista'), input = $('#pliki'), drop = $('#drop');
  var pliki = [], MAX = 10;

  function render() {
    lista.innerHTML = '';
    pliki.forEach(function (p, i) {
      var li = document.createElement('li');
      if (p.url) { var im = document.createElement('img'); im.src = p.url; im.alt = p.f.name; li.appendChild(im); }
      else { var d = document.createElement('div'); d.className = 'pdf'; d.textContent = p.f.name; li.appendChild(d); }
      var b = document.createElement('button'); b.type = 'button'; b.className = 'rm'; b.setAttribute('aria-label', 'Usuń ' + p.f.name); b.textContent = '×';
      b.addEventListener('click', function () { if (p.url) URL.revokeObjectURL(p.url); pliki.splice(i, 1); render(); });
      li.appendChild(b); lista.appendChild(li);
    });
  }
  function dodaj(files) {
    var odrzucone = 0;
    Array.prototype.forEach.call(files, function (f) {
      if (pliki.length >= MAX) { odrzucone++; return; }
      var img = /^image\//.test(f.type);
      if (!img && f.type !== 'application/pdf') { odrzucone++; return; }
      pliki.push({ f: f, url: img ? URL.createObjectURL(f) : null });
    });
    render();
    msg.textContent = odrzucone ? 'Można dodać do ' + MAX + ' zdjęć lub plików PDF.' : '';
  }
  input.addEventListener('change', function () { dodaj(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer) dodaj(e.dataTransfer.files); });

  function oznacz(el, zle) { el.classList.toggle('err', zle); }
  form.addEventListener('input', function (e) { if (e.target.classList) e.target.classList.remove('err'); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var prace = Array.prototype.map.call(form.querySelectorAll('input[name=prace]:checked'), function (c) { return c.value; });
    var opis = $('#opis'), imie = $('#imie'), email = $('#email'), zgoda = $('#zgoda');
    var bledy = [];
    if (!prace.length && !opis.value.trim()) { bledy.push('zaznacz rodzaj prac lub opisz je'); oznacz(opis, true); }
    if (!imie.value.trim()) { bledy.push('podaj imię'); oznacz(imie, true); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { bledy.push('wpisz poprawny e-mail'); oznacz(email, true); }
    if (!zgoda.checked) bledy.push('zaznacz zgodę na kontakt');
    if (bledy.length) { msg.textContent = 'Prosimy: ' + bledy.join(', ') + '.'; return; }
    msg.textContent = '';

    var miejsce = $('#miejsce').value.trim(), termin = $('#termin').value, tel = $('#tel').value.trim();
    var txt = [
      'Zapytanie ze strony Novexbau',
      'Prace: ' + (prace.join(', ') || 'opisane niżej'),
      miejsce ? 'Miejsce: ' + miejsce : '',
      termin ? 'Termin: ' + termin : '',
      opis.value.trim() ? 'Opis: ' + opis.value.trim() : '',
      pliki.length ? 'Załączniki: ' + pliki.length + ' (proszę dołączyć do wiadomości)' : '',
      'Imię: ' + imie.value.trim(), 'E-mail: ' + email.value.trim(), tel ? 'Telefon: ' + tel : ''
    ].filter(Boolean).join('\n');

    $('#doneTxt').textContent = (prace.length ? prace.join(', ') : 'Zakres opisany w wiadomości') +
      (miejsce ? ', ' + miejsce : '') + (pliki.length ? '. Dołączone pliki: ' + pliki.length + '.' : '.');
    $('#doneMail').href = 'mailto:novexbau@gmail.com?subject=' + encodeURIComponent('Zapytanie o wycenę' + (miejsce ? ' - ' + miejsce : '')) + '&body=' + encodeURIComponent(txt);
    form.hidden = true; $('#done').hidden = false;
    $('#done').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  $('#again').addEventListener('click', function () {
    form.reset(); pliki.forEach(function (p) { if (p.url) URL.revokeObjectURL(p.url); }); pliki = []; render();
    $('#done').hidden = true; form.hidden = false;
  });
})();
