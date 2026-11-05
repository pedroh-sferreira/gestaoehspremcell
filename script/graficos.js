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

        let conformes = 0;   // inspeções sem nenhuma NC
        let inspComNc = 0;   // inspeções com pelo menos uma NC
        let totNc = 0;       // NCs por item (usado nos demais gráficos)
        const an = { concluida: 0, andamento: 0, pendente: 0 };
        const sev = { 'Crítica': 0, 'Alta': 0, 'Média': 0, 'Baixa': 0, 'Sem severidade': 0 };
        const gr = {};

        lista.forEach(r => {
            // NCs do checklist + NCs fora do checklist (mesma lógica dos rankings)
            const outras = outrasNcs(r);
            const ncs = ncsTodas(r, grupos);

            // Inspeção conforme = nenhuma NC; com NC = pelo menos uma
            if (ncs.length) inspComNc++;
            else conformes++;

            let iFora = 0;
            ncs.forEach(n => {
                totNc++;
                an[statusAnalise(r, n.check)]++;
                if (n.fora) {
                    const o = outras[iFora++] || {};
                    sev[normSev(o.sev)]++;
                    const nome = n.check.nome;                 // categoria da NC (ex.: Evidências (fotos))
                    gr[nome] = (gr[nome] || 0) + 1;
                } else {
                    sev[normSev(r[n.check.sev])]++;
                    const nome = ITENS[n.grupo].nome;
                    gr[nome] = (gr[nome] || 0) + 1;
                }
            });
        });

        const totInsp = conformes + inspComNc;
        const pct = totInsp ? Math.round(conformes / totInsp * 100) : 0;
        const totAn = an.concluida + an.andamento + an.pendente;
        const pctAn = totAn ? Math.round(an.concluida / totAn * 100) : 0;
        const sevCor = { 'Crítica': 'var(--crit)', 'Alta': 'var(--alta)', 'Média': 'var(--media)', 'Baixa': 'var(--baixa)', 'Sem severidade': '#c9d3ee' };

        el.innerHTML = [
            card('Conformidade', 'Inspeções conformes x inspeções com NC',
                donut([
                    { rot: 'Conformes', v: conformes, cor: COR.ok },
                    { rot: 'Com NC', v: inspComNc, cor: COR.nc }
                ], pct + '%', 'conformes')),
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
                        .map(([nome, v]) => ({ rot: nome, v })))
                    : '<div class="rk-vazio">Sem não conformidades.</div>')
        ].join('');
    };
})();