(function () {
    "use strict";
    var aberto = null;
    var semAcento = function (s) {
        return String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    function valores(sel) {
        return Array.prototype.filter.call(sel.options, function (o) {
            return o.selected && o.value !== "";
        }).map(function (o) { return o.value; });
    }
    function fechar() {
        if (!aberto) return;
        var p = aberto.querySelector(".ms-painel"), b = aberto.querySelector(".ms-btn");
        p.hidden = true;
        b.setAttribute("aria-expanded", "false");
        aberto = null;
    }
    function init(sel) {
        if (!sel || sel._ms) return;
        sel._ms = true;
        sel.multiple = true;
        sel.classList.add("ms-original");
        var wrap = document.createElement("div");
        wrap.className = "ms";
        wrap.innerHTML =
            '<button type="button" class="ms-btn" aria-haspopup="true" aria-expanded="false">' +
                '<span class="ms-rot">Todos</span><span class="ms-seta" aria-hidden="true">&#9662;</span>' +
            '</button>' +
            '<div class="ms-painel" hidden>' +
                '<input type="search" class="ms-busca" placeholder="Buscar..." hidden>' +
                '<div class="ms-lista"></div>' +
                '<div class="ms-acoes"><button type="button" class="ms-limpar">Limpar seleção</button></div>' +
            '</div>';
        sel.parentNode.insertBefore(wrap, sel.nextSibling);

        var btn = wrap.querySelector(".ms-btn"),
            rot = wrap.querySelector(".ms-rot"),
            painel = wrap.querySelector(".ms-painel"),
            busca = wrap.querySelector(".ms-busca"),
            lista = wrap.querySelector(".ms-lista");
        if (sel.id) {
            btn.id = sel.id + "-ms";
            var lb = document.querySelector('label[for="' + sel.id + '"]');
            if (lb) lb.setAttribute("for", btn.id);
        }
        function opcoes() {
            return Array.prototype.filter.call(sel.options, function (o) { return o.value !== ""; });
        }
        function rotulo() {
            var v = valores(sel), txt;
            if (!v.length) {
                txt = (sel.options[0] && sel.options[0].value === "") ? sel.options[0].textContent : "Todos";
            } else if (v.length === 1) {
                var o = opcoes().filter(function (x) { return x.value === v[0]; })[0];
                txt = o ? o.textContent : v[0];
            } else {
                txt = v.length + " selecionados";
            }
            rot.textContent = txt;
            wrap.classList.toggle("tem", v.length > 0);
        }
        function montar() {
            var ops = opcoes();
            lista.innerHTML = "";
            busca.hidden = ops.length <= 8;
            busca.value = "";
            if (!ops.length) {
                var vz = document.createElement("div");
                vz.className = "ms-vazio";
                vz.textContent = "Sem opções";
                lista.appendChild(vz);
                return;
            }
            ops.forEach(function (o) {
                var l = document.createElement("label"), c = document.createElement("input"), t = document.createElement("span");
                l.className = "ms-op";
                c.type = "checkbox";
                c.value = o.value;
                c.checked = o.selected;
                t.textContent = o.textContent;
                l.appendChild(c);
                l.appendChild(t);
                lista.appendChild(l);
            });
        }
        function atualizar() { montar(); rotulo(); }
        sel._msAtualizar = atualizar;
        function emitir() { sel.dispatchEvent(new Event("change", { bubbles: true })); }
        lista.addEventListener("change", function (e) {
            var c = e.target;
            if (!c || c.type !== "checkbox") return;
            Array.prototype.forEach.call(sel.options, function (o) {
                if (o.value === c.value) o.selected = c.checked;
                else if (o.value === "") o.selected = false;
            });
            rotulo();
            emitir();
        });
        busca.addEventListener("input", function () {
            var q = semAcento(busca.value);
            Array.prototype.forEach.call(lista.children, function (l) {
                l.hidden = !!q && semAcento(l.textContent).indexOf(q) === -1;
            });
        });
        wrap.querySelector(".ms-limpar").addEventListener("click", function () {
            if (!valores(sel).length) return;
            MS.limpar(sel);
            emitir();
        });
        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (aberto === wrap) { fechar(); return; }
            fechar();
            painel.hidden = false;
            btn.setAttribute("aria-expanded", "true");
            aberto = wrap;
            if (!busca.hidden) busca.focus();
        });
        new MutationObserver(atualizar).observe(sel, { childList: true });
        atualizar();
    }
    function initAll(raiz) {
        Array.prototype.forEach.call((raiz || document).querySelectorAll("select[data-multi]"), init);
    }
    document.addEventListener("click", function (e) {
        if (aberto && !aberto.contains(e.target)) fechar();
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && aberto) {
            var b = aberto.querySelector(".ms-btn");
            fechar();
            b.focus();
        }
    });
    window.MS = {
        init: init,
        initAll: initAll,
        valores: valores,
        limpar: function (sel) {
            Array.prototype.forEach.call(sel.options, function (o) { o.selected = false; });
            if (sel._msAtualizar) sel._msAtualizar();
        },
        atualizar: function (sel) { if (sel._msAtualizar) sel._msAtualizar(); }
    };
    initAll();
    document.addEventListener("DOMContentLoaded", function () { initAll(); });
})();