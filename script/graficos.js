(function () {
    const COR = { ok: 'var(--ok)', nc: 'var(--crit)', and: '#D9A400', pend: 'var(--alta)', azul: 'var(--azul)' };
    function card(tit, sub, corpo, cls) {
        return `<section class="bloco gf-card ${cls || ''}"><h2>${esc(tit)}</h2><p class="rk-sub">${esc(sub)}</p>${corpo}</section>`;
    }
    function legenda(partes) {
        return `<ul class="gf-leg">${partes.map(p =>
            `<li><i style="background:${p.cor}"></i><span>${esc(p.rot)}</span><b>${p.v}</b></li>`).join('')}</ul>`;
    }
    function donut(partes, centro, rotCentro) {
        const tot = partes.reduce((s, p) => s + p.v, 0);
        const R = 52, C = 2 * Math.PI * R;
        let off = 0;
        const arcos = tot ? partes.filter(p => p.v > 0).map(p => {
            const len = p.v / tot * C;
            const a = `<circle cx="70" cy="70" r="${R}" fill="none" stroke-width="18" style="stroke:${p.cor}" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`;
            off += len;
            return a;
        }).join('') : '';
        return `<div class="gf-rosca">
            <svg viewBox="0 0 140 140" class="gf-donut" role="img" aria-label="${esc(rotCentro)}">
                <circle cx="70" cy="70" r="${R}" fill="none" stroke-width="18" style="stroke:#e8edfa"/>${arcos}
                <text x="70" y="70" text-anchor="middle" class="gf-dn">${centro}</text>
                <text x="70" y="88" text-anchor="middle" class="gf-dr">${esc(rotCentro)}</text>
            </svg>${legenda(partes)}</div>`;
    }
    function barrasH(itens) {
        const max = Math.max(1, ...itens.map(i => i.v));
        return `<ul class="gf-bh">${itens.map(i => `
            <li><span class="gf-bh-rot" title="${esc(i.rot)}">${esc(i.rot)}</span>
            <span class="gf-bh-trilho"><i style="width:${i.v ? Math.max(3, i.v / max * 100) : 0}%;background:${i.cor || COR.azul}"></i></span>
            <b>${i.v}</b></li>`).join('')}</ul>`;
    }
    const normSev = (v) => {
        const s = semAcento(v);
        if (s.startsWith('crit')) return 'Crítica';
        if (s.startsWith('alt')) return 'Alta';
        if (s.startsWith('med')) return 'Média';
        if (s.startsWith('baix')) return 'Baixa';
        return 'Sem severidade';
    };
    window.renderGraficos = function (lista, grupos) {
        let el = $('graficos');
        if (!el) {
            el = document.createElement('section');
            el.id = 'graficos';
            el.className = 'graficos';
            el.setAttribute('aria-label', 'Gráficos');
            $('rankings').before(el);
        }
        let comNc = 0;
        const an = { concluida: 0, andamento: 0, pendente: 0 };
        const sev = { 'Crítica': 0, 'Alta': 0, 'Média': 0, 'Baixa': 0, 'Sem severidade': 0 };
        const gr = {};
        lista.forEach(r => {
            const ncs = ncsDoRegistro(r, grupos);
            if (ncs.length) comNc++;
            ncs.forEach(n => {
                an[statusAnalise(r, n.check)]++;
                sev[normSev(r[n.check.sev])]++;
                gr[n.grupo] = (gr[n.grupo] || 0) + 1;
            });
        });
        const total = lista.length;
        const pct = total ? Math.round(comNc / total * 100) : 0;
        const totNc = an.concluida + an.andamento + an.pendente;
        const pctAn = totNc ? Math.round(an.concluida / totNc * 100) : 0;
        const sevCor = { 'Crítica': 'var(--crit)', 'Alta': 'var(--alta)', 'Média': 'var(--media)', 'Baixa': 'var(--baixa)', 'Sem severidade': '#c9d3ee' };
        el.innerHTML = [
            card('Conformidade', 'Registros com e sem NC',
                donut([
                    { rot: 'Conformes', v: total - comNc, cor: COR.ok },
                    { rot: 'Com NC', v: comNc, cor: COR.nc }
                ], pct + '%', 'com NC')),
            card('Andamento das análises', 'Causa raiz e solução por NC',
                donut([
                    { rot: 'Concluídas', v: an.concluida, cor: COR.ok },
                    { rot: 'Em andamento', v: an.andamento, cor: COR.and },
                    { rot: 'Pendentes', v: an.pendente, cor: COR.pend }
                ], pctAn + '%', 'concluídas')),
            card('NC por severidade', 'Distribuição das não conformidades',
                barrasH(Object.entries(sev).filter(([k, v]) => v || k !== 'Sem severidade')
                    .map(([k, v]) => ({ rot: k, v, cor: sevCor[k] })))),
            card('NC por grupo de item', 'Onde as falhas se concentram',
                Object.keys(gr).length
                    ? barrasH(Object.entries(gr).sort((a, b) => b[1] - a[1])
                        .map(([g, v]) => ({ rot: ITENS[g].nome, v })))
                    : '<div class="rk-vazio">Sem não conformidades.</div>')
        ].join('');
    };
})();