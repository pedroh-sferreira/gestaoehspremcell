(function () {
    const CONFIG = {
        colunaRegiao: 'centro_custo',
        perfisAdmin: ['admin', 'administrador', 'adm', 'master'],

        camposRegiaoUsuario: ['regioes', 'regiao', 'regional', 'centro_custo']
    };

    const norm = (s) => String(s ?? '').normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

    const usuario = () => (window.SESSAO && window.SESSAO.usuario) || {};

    function perfil() {
        const u = usuario();
        return norm(u.funcao || u.perfil || u.cargo || '');
    }

    function ehAdmin() {
        return CONFIG.perfisAdmin.includes(perfil());
    }

    function regioes() {
        const u = usuario();
        for (const campo of CONFIG.camposRegiaoUsuario) {
            const v = u[campo];
            if (v === undefined || v === null || v === '') continue;
            const lista = Array.isArray(v) ? v : String(v).split(/[;|,]+/);
            const out = lista.map(norm).filter(Boolean);
            if (out.length) return out;
        }
        return [];
    }
    function filtrar(registros) {
        if (ehAdmin()) return registros;
        const minhas = regioes();
        if (!minhas.length) {
            console.warn('Usuário sem regional definida: nenhum registro será exibido.');
            return [];   
        }
        return registros.filter(r => minhas.includes(norm(r[CONFIG.colunaRegiao])));
    }

    window.ACESSO = { ehAdmin, regioes, filtrar, perfil };
})();