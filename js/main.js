const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = { get() { try { return JSON.parse(localStorage.getItem('probsta.completed') || '[]') } catch (e) { return [] } }, toggle(id) { try { const a = this.get(), i = a.indexOf(id); i < 0 ? a.push(id) : a.splice(i, 1); localStorage.setItem('probsta.completed', JSON.stringify(a)); return i < 0 } catch (e) { return false } } };
const nav = $('nav'), onS = () => nav.classList.toggle('solid', scrollY > 40); onS(); addEventListener('scroll', onS, { passive: true });
const links = $('.links'); $('#burger').addEventListener('click', () => links.classList.toggle('open'));
$$('.links a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target) } }), { threshold: .1 });
$$('.rv').forEach(e => io.observe(e));
function paint() { const d = store.get(); $$('a[data-id]').forEach(a => a.classList.toggle('done', d.includes(a.dataset.id))); $$('.card').forEach(c => { const l = $$('a[data-id]', c), n = l.filter(a => a.classList.contains('done')).length; $('.cnt', c).textContent = n + '/' + l.length + ' explored'; $('.bar i', c).style.width = (100 * n / l.length) + '%' }); const t = $('#total'); if (t) t.textContent = $$('a.done').length + ' of ' + $$('a[data-id]').length + ' lessons explored' }
paint(); addEventListener('pageshow', paint); addEventListener('storage', paint);
const q = $('#q'); if (q) q.addEventListener('input', () => { const v = q.value.trim().toLowerCase(); $$('.card').forEach(c => { const hit = !v || c.dataset.k.includes(v); c.hidden = !hit; $('details', c).open = !!v && hit; $$('a[data-id]', c).forEach(a => a.classList.toggle('hit', !!v && a.textContent.toLowerCase().includes(v))) }); $('#none').hidden = $$('.card:not([hidden])').length > 0 });
if (/^#unit\d$/.test(location.hash)) { const d = $(location.hash + ' details'); if (d) d.open = true }
(function () {
    const me = document.currentScript; if (!me) return;
    const root = me.src.replace(/js\/main\.js.*$/, '');
    if (!document.querySelector('link[href*="grid-bg.css"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = root + 'css/grid-bg.css'; document.head.appendChild(l) }
    if (!window.__gridBg && !document.querySelector('script[src*="grid-bg.js"]')) { const s = document.createElement('script'); s.src = root + 'js/grid-bg.js'; document.body.appendChild(s) }
})();