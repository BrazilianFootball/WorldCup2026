(function () {
    'use strict';

    const CSV_URL = window.CALENDARIO_CSV_URL || 'csv/vis/calendario.csv';
    const CITY_ORDER = [
        'Vancouver', 'Seattle', 'Área da Baía de São Francisco', 'Los Angeles',
        'Guadalajara', 'Cidade do México', 'Monterrey', 'Houston', 'Dallas', 'Kansas City',
        'Atlanta', 'Miami', 'Toronto', 'Boston', 'Philadelphia', 'Nova York/Nova Jersey'
    ];
    const PHASE_ORDER = [
        'Fase de grupos', 'Fase de 32', 'Oitavas de final', 'Quartas de final',
        'Semifinal', 'Disputa de 3º lugar', 'Final'
    ];
    const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    const state = {
        matches: [],
        filtered: [],
        activeView: 'grade',
        activeTimezone: 'et'
    };

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        const root = document.getElementById('calendario-copa');
        if (!root) return;

        try {
            const csvText = await loadCsv();
            state.matches = parseCsv(csvText)
                .filter(row => row.numero)
                .map(normalizeMatch)
                .sort(sortMatches);

            state.filtered = [...state.matches];
            buildFilters();
            bindEvents();
            render();
        } catch (error) {
            root.querySelector('[data-calendar-board]').innerHTML = `
                <div class="wc-empty">
                    <strong>Não foi possível carregar o calendário.</strong><br>
                    Verifique se o arquivo <code>calendario.csv</code> está na mesma pasta deste HTML.
                </div>`;
            console.error(error);
        }
    }

    async function loadCsv() {
        try {
            const response = await fetch(CSV_URL, { cache: 'no-store' });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return await response.text();
        } catch (fetchError) {
            const inline = document.getElementById('calendario-csv-inline');
            if (inline && inline.textContent.trim()) return inline.textContent.trim();
            throw fetchError;
        }
    }

    function parseCsv(text) {
        const rows = [];
        let current = '';
        let row = [];
        let inQuotes = false;

        for (let i = 0; i < text.length; i += 1) {
            const char = text[i];
            const next = text[i + 1];

            if (char === '"') {
                if (inQuotes && next === '"') {
                    current += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                row.push(current);
                current = '';
            } else if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && next === '\n') i += 1;
                row.push(current);
                if (row.some(value => value !== '')) rows.push(row);
                row = [];
                current = '';
            } else {
                current += char;
            }
        }

        if (current || row.length) {
            row.push(current);
            rows.push(row);
        }

        const headers = rows.shift().map(header => header.trim());
        return rows.map(values => {
            const object = {};
            headers.forEach((header, index) => {
                object[header] = (values[index] || '').trim();
            });
            return object;
        });
    }

    function normalizeMatch(match) {
        const dataEt = match.data_et || match.data;
        const dataBrt = match.data_brt || addHours(dataEt, match.hora_et, 1);
        // Campos usados pela barra de pesquisa: apenas seleções/códigos, sem número do jogo.
        const searchableFields = [
            match.mandante,
            match.visitante,
            match.mandante_codigo,
            match.visitante_codigo
        ];
        return {
            ...match,
            numero: Number(match.numero),
            grupo: match.grupo || '',
            data: match.data,
            data_et: dataEt,
            data_brt: dataBrt,
            hora_et: match.hora_et,
            mandante_codigo: match.mandante_codigo || '',
            visitante_codigo: match.visitante_codigo || '',
            searchText: normalizeText(searchableFields.join(' '))
        };
    }

    function bindEvents() {
        const controls = document.querySelectorAll('[data-calendar-filter]');
        controls.forEach(control => control.addEventListener('input', applyFilters));
        controls.forEach(control => control.addEventListener('change', applyFilters));

        const reset = document.getElementById('wc-reset-filters');
        if (reset) {
            reset.addEventListener('click', () => {
                document.querySelectorAll('[data-calendar-filter]').forEach(control => {
                    if (control.multiple) {
                        Array.from(control.options).forEach(option => {
                            option.selected = false;
                        });
                    } else {
                        control.value = '';
                    }
                });

                document.querySelectorAll('[data-multiselect-for]').forEach(wrapper => {
                    updateMultiSelectLabel(wrapper.dataset.multiselectFor);
                    wrapper.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                        checkbox.checked = false;
                    });
                });

                applyFilters();
            });
        }

        document.addEventListener('click', event => {
            if (!event.target.closest('.wc-multiselect')) {
                closeMultiSelectPanels();
            }
        });

        document.querySelectorAll('[data-timezone]').forEach(button => {
            button.addEventListener('click', () => {
                state.activeTimezone = button.dataset.timezone;
                document.querySelectorAll('[data-timezone]').forEach(btn => btn.classList.toggle('is-active', btn === button));
                render();
            });
        });

        document.querySelectorAll('[data-view]').forEach(button => {
            button.addEventListener('click', () => {
                state.activeView = button.dataset.view;
                document.querySelectorAll('[data-view]').forEach(btn => btn.classList.toggle('is-active', btn === button));
                document.getElementById('wc-board-view').hidden = state.activeView !== 'grade';
                document.getElementById('wc-list-view').hidden = state.activeView !== 'lista';
            });
        });
    }

    function buildFilters() {
        fillSelect('wc-filter-phase', orderedUnique(state.matches.map(match => match.fase), PHASE_ORDER));

        fillMultiSelect('wc-filter-group', ['A','B','C','D','E','F','G','H','I','J','K','L'], {
            singular: 'grupo selecionado',
            plural: 'grupos selecionados',
            formatter: value => `Grupo ${value}`
        });

        fillMultiSelect('wc-filter-region', orderedUnique(state.matches.map(match => match.regiao), ['Oeste','Central','Leste']), {
            singular: 'região selecionada',
            plural: 'regiões selecionadas',
            formatter: value => value
        });

        fillMultiSelect('wc-filter-city', CITY_ORDER.filter(city => state.matches.some(match => match.cidade === city)), {
            singular: 'cidade selecionada',
            plural: 'cidades selecionadas',
            formatter: value => value
        });
    }

    function fillSelect(id, values) {
        const select = document.getElementById(id);
        if (!select) return;

        const current = select.value;
        const label = select.dataset.allLabel || 'Todos';

        select.innerHTML = `<option value="">${escapeHtml(label)}</option>` + values.map(value => (
            `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
        )).join('');

        select.value = current;
    }

    function fillMultiSelect(id, values, config) {
        const select = document.getElementById(id);
        if (!select) return;

        const previousValues = getSelectedValues(id);
        const allLabel = select.dataset.allLabel || 'Todos';

        select.multiple = true;
        select.style.display = 'none';

        select.innerHTML = values.map(value => {
            const selected = previousValues.includes(value) ? ' selected' : '';
            return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(config.formatter(value))}</option>`;
        }).join('');

        const previousWrapper = document.querySelector(`[data-multiselect-for="${id}"]`);
        if (previousWrapper) previousWrapper.remove();

        const wrapper = document.createElement('div');
        wrapper.className = 'wc-multiselect';
        wrapper.dataset.multiselectFor = id;
        wrapper.dataset.allLabel = allLabel;
        wrapper.dataset.singular = config.singular;
        wrapper.dataset.plural = config.plural;

        wrapper.innerHTML = `
            <button type="button" class="wc-multiselect-button" aria-expanded="false">
                <span class="wc-multiselect-label">${escapeHtml(allLabel)}</span>
                <span class="wc-multiselect-arrow">▾</span>
            </button>
            <div class="wc-multiselect-panel" hidden>
                ${values.map(value => {
                    const checked = previousValues.includes(value) ? ' checked' : '';
                    return `
                        <label class="wc-multiselect-option">
                            <input type="checkbox" value="${escapeHtml(value)}"${checked}>
                            <span>${escapeHtml(config.formatter(value))}</span>
                        </label>
                    `;
                }).join('')}
            </div>
        `;

        select.insertAdjacentElement('afterend', wrapper);

        const button = wrapper.querySelector('.wc-multiselect-button');
        const panel = wrapper.querySelector('.wc-multiselect-panel');

        button.addEventListener('click', event => {
            event.stopPropagation();

            const shouldOpen = panel.hidden;
            closeMultiSelectPanels();

            panel.hidden = !shouldOpen;
            button.setAttribute('aria-expanded', String(shouldOpen));
        });

        wrapper.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const option = Array.from(select.options).find(item => item.value === checkbox.value);
                if (option) option.selected = checkbox.checked;

                updateMultiSelectLabel(id);
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });

        updateMultiSelectLabel(id);
    }

    function getSelectedValues(id) {
        const select = document.getElementById(id);
        if (!select) return [];

        return Array.from(select.selectedOptions).map(option => option.value);
    }

    function updateMultiSelectLabel(id) {
        const wrapper = document.querySelector(`[data-multiselect-for="${id}"]`);
        if (!wrapper) return;

        const selected = getSelectedValues(id);
        const label = wrapper.querySelector('.wc-multiselect-label');

        if (!label) return;

        if (!selected.length) {
            label.textContent = wrapper.dataset.allLabel || 'Todos';
            return;
        }

        const word = selected.length === 1 ? wrapper.dataset.singular : wrapper.dataset.plural;
        label.textContent = `${selected.length} ${word}`;
    }

    function closeMultiSelectPanels() {
        document.querySelectorAll('.wc-multiselect').forEach(wrapper => {
            const panel = wrapper.querySelector('.wc-multiselect-panel');
            const button = wrapper.querySelector('.wc-multiselect-button');

            if (panel) panel.hidden = true;
            if (button) button.setAttribute('aria-expanded', 'false');
        });
    }

    function applyFilters() {
        const query = normalizeText(document.getElementById('wc-search').value);
        const searchTerms = getSearchTerms(query);
        const phase = document.getElementById('wc-filter-phase').value;
        const groups = getSelectedValues('wc-filter-group');
        const regions = getSelectedValues('wc-filter-region');
        const cities = getSelectedValues('wc-filter-city');

        state.filtered = state.matches.filter(match => {
            const matchesText = !query || (searchTerms.length > 0 && searchTerms.some(term => match.searchText.includes(term)));
            const matchesPhase = !phase || match.fase === phase;
            const matchesGroup = !groups.length || groups.includes(match.grupo);
            const matchesRegion = !regions.length || regions.includes(match.regiao);
            const matchesCity = !cities.length || cities.includes(match.cidade);

            return matchesText && matchesPhase && matchesGroup && matchesRegion && matchesCity;
        });

        render();
    }

    function render() {
        renderSummary();
        renderBoard();
        renderTable();
        const count = document.getElementById('wc-result-count');
        if (count) count.textContent = `${state.filtered.length} jogo${state.filtered.length === 1 ? '' : 's'} encontrado${state.filtered.length === 1 ? '' : 's'}`;
    }

    function renderSummary() {
        const summary = document.getElementById('wc-summary');
        if (!summary) return;
        const groups = state.matches.filter(match => match.fase === 'Fase de grupos').length;
        const knockouts = state.matches.length - groups;
        const cities = new Set(state.matches.map(match => match.cidade)).size;
        const dates = new Set(state.matches.map(match => match.data)).size;
        summary.innerHTML = `
            ${summaryCard(state.matches.length, 'partidas')}
            ${summaryCard(groups, 'fase de grupos')}
            ${summaryCard(knockouts, 'mata-mata')}
            ${summaryCard(cities, 'cidades-sede')}
            ${summaryCard(dates, 'dias com jogos')}
        `;
    }

    function summaryCard(number, label) {
        return `<div class="wc-stat"><strong>${number}</strong><span>${escapeHtml(label)}</span></div>`;
    }

    function renderBoard() {
        const container = document.querySelector('[data-calendar-board]');
        if (!container) return;
        if (!state.filtered.length) {
            container.innerHTML = '<div class="wc-empty">Nenhum jogo encontrado com os filtros atuais.</div>';
            return;
        }

        const dates = orderedUnique(state.filtered.map(match => getDisplayDate(match))).sort();
        const cities = CITY_ORDER.filter(city => state.filtered.some(match => match.cidade === city));
        const cells = new Map();

        state.filtered.forEach(match => {
            const key = `${match.cidade}__${getDisplayDate(match)}`;
            if (!cells.has(key)) cells.set(key, []);
            cells.get(key).push(match);
        });

        const html = [];
        html.push(`<div class="wc-grid" style="--wc-cols:${dates.length}">`);
        html.push('<div class="wc-grid-corner">Sede</div>');
        dates.forEach(date => html.push(`<div class="wc-date-head">${formatDateHead(date)}</div>`));

        cities.forEach(city => {
            const region = state.filtered.find(match => match.cidade === city)?.regiao || '';
            html.push(`<div class="wc-city-head region-${slug(region)}"><span>${escapeHtml(city)}</span><small>${escapeHtml(region)}</small></div>`);
            dates.forEach(date => {
                const matches = (cells.get(`${city}__${date}`) || []).sort(sortMatches);
                html.push(`<div class="wc-cell">${matches.map(matchCard).join('')}</div>`);
            });
        });
        

        html.push('</div>');
        container.innerHTML = html.join('');
        bindBoardDrag();

        // TOP SCROLL HERE
        //const topScroll = document.querySelector('.wc-scroll-top');
        //const topInner = document.querySelector('.wc-scroll-inner');
        //const board = document.querySelector('.wc-board-wrap');

        //if (topScroll && topInner && board) {
            // largura fake para ativar scroll
        //    topInner.style.width = board.scrollWidth + 'px';

            // sincroniza scrolls
        //    topScroll.onscroll = () => board.scrollLeft = topScroll.scrollLeft;
        //    board.onscroll = () => topScroll.scrollLeft = board.scrollLeft;
        //}
    }

    function matchCard(match) {
        const phaseClass = match.grupo ? `group-${match.grupo}` : 'knockout';
        const home = match.mandante_codigo || shortLabel(match.mandante);
        const away = match.visitante_codigo || shortLabel(match.visitante);
        const hora = getDisplayHour(match);
        const title = `${match.mandante} x ${match.visitante} — ${formatFullDate(getDisplayDate(match))} às ${hora} ${getTimezoneLabel()}, ${match.cidade}`;
        return `
            <article class="wc-match-card ${phaseClass}" title="${escapeHtml(title)}">
                <div class="wc-card-top"><span>#${match.numero}</span><span>${hora}</span></div>
                <div class="wc-card-teams"><strong>${escapeHtml(home)}</strong><span>x</span><strong>${escapeHtml(away)}</strong></div>
                <div class="wc-card-meta">${match.grupo ? `Grupo ${escapeHtml(match.grupo)}` : escapeHtml(shortPhase(match.fase))}</div>
            </article>
        `;
    }

    function renderTable() {
        const body = document.getElementById('wc-table-body');
        if (!body) return;
        if (!state.filtered.length) {
            body.innerHTML = '<tr><td colspan="8">Nenhum jogo encontrado.</td></tr>';
            return;
        }

        body.innerHTML = [...state.filtered].sort(sortMatches).map(match => `
            <tr>
                <td><strong>#${match.numero}</strong></td>
                <td>${formatFullDate(getDisplayDate(match))}</td>
                <td>${getDisplayHour(match)} ${getTimezoneLabel()}</td>
                <td>${escapeHtml(match.fase)}</td>
                <td>${match.grupo ? `Grupo ${escapeHtml(match.grupo)}` : '—'}</td>
                <td>${teamName(match.mandante, match.mandante_codigo)} <span class="wc-vs">x</span> ${teamName(match.visitante, match.visitante_codigo)}</td>
                <td>${escapeHtml(match.cidade)}</td>
                <td>${escapeHtml(match.regiao)}</td>
            </tr>
        `).join('');
    }

    function exportCalendar() {
        if (!state.filtered.length) {
            window.alert('Nenhum jogo encontrado para exportar. Ajuste os filtros e tente novamente.');
            return;
        }

        const timezoneId = state.activeTimezone === 'brt' ? 'America/Sao_Paulo' : 'America/New_York';
        const timezoneLabel = getTimezoneLabel();
        const events = [...state.filtered].sort(sortMatches).map(match => buildCalendarEvent(match, timezoneId, timezoneLabel)).join('\r\n');
        const content = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//FGV EMAp//Calendario Copa do Mundo 2026//PT-BR',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:Calendário Copa do Mundo 2026',
            `X-WR-TIMEZONE:${timezoneId}`,
            events,
            'END:VCALENDAR'
        ].join('\r\n');

        downloadTextFile('calendario-copa-2026.ics', foldIcsContent(content), 'text/calendar;charset=utf-8');
    }

    function buildCalendarEvent(match, timezoneId, timezoneLabel) {
        const startDate = getDisplayDate(match);
        const startTime = getDisplayHour(match);
        const durationHours = match.fase === 'Fase de grupos' ? 2 : 3;
        const end = addHoursToLocalDateTime(startDate, startTime, durationHours);
        const summary = `[Copa do Mundo] ${match.mandante} x ${match.visitante}`;
        const description = [
            `Jogo #${match.numero}`,
            `Fase: ${match.fase}`,
            match.grupo ? `Grupo: ${match.grupo}` : '',
            `Região: ${match.regiao}`,
            `Horário Local: ${startTime} ${timezoneLabel}`
        ].filter(Boolean).join('\n');

        return [
            'BEGIN:VEVENT',
            `UID:copa-2026-jogo-${match.numero}-${state.activeTimezone}@emap.fgv.br`,
            `DTSTAMP:${formatIcsUtcDate(new Date())}`,
            `SUMMARY:${escapeIcsText(summary)}`,
            `DTSTART;TZID=${timezoneId}:${formatIcsLocalDateTime(startDate, startTime)}`,
            `DTEND;TZID=${timezoneId}:${formatIcsLocalDateTime(end.date, end.time)}`,
            `LOCATION:${escapeIcsText(match.cidade)}`,
            `DESCRIPTION:${escapeIcsText(description)}`,
            'CATEGORIES:Copa do Mundo 2026',
            'COLOR:#3CAC3B',
            'END:VEVENT'
        ].join('\r\n');
    }

    function downloadTextFile(filename, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function addHoursToLocalDateTime(dateString, timeString, hours) {
        const [year, month, day] = String(dateString || '').split('-').map(Number);
        const [hour, minute] = String(timeString || '').split(':').map(Number);
        if (![year, month, day, hour, minute].every(Number.isFinite)) {
            return { date: dateString, time: timeString };
        }
        const date = new Date(Date.UTC(year, month - 1, day, hour + hours, minute));
        return {
            date: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`,
            time: `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`
        };
    }

    function formatIcsLocalDateTime(dateString, timeString) {
        const [hour, minute] = String(timeString || '').split(':');
        return `${String(dateString).replace(/-/g, '')}T${String(hour || '0').padStart(2, '0')}${String(minute || '0').padStart(2, '0')}00`;
    }

    function formatIcsUtcDate(date) {
        return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}T${String(date.getUTCHours()).padStart(2, '0')}${String(date.getUTCMinutes()).padStart(2, '0')}${String(date.getUTCSeconds()).padStart(2, '0')}Z`;
    }

    function escapeIcsText(value) {
        return String(value || '')
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\r?\n/g, '\\n');
    }

    function foldIcsContent(content) {
        return content.split('\r\n').map(foldIcsLine).join('\r\n') + '\r\n';
    }

    function foldIcsLine(line) {
        const limit = 75;
        if (line.length <= limit) return line;
        const parts = [];
        let current = line;
        while (current.length > limit) {
            parts.push(current.slice(0, limit));
            current = ' ' + current.slice(limit);
        }
        parts.push(current);
        return parts.join('\r\n');
    }

    function bindBoardDrag() {
        const board = document.querySelector('.wc-board-wrap');
        if (!board || board.dataset.dragBound === 'true') return;

        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;

        board.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - board.offsetLeft;
            scrollLeft = board.scrollLeft;
        });

        board.addEventListener('mouseleave', () => {
            isDown = false;
        });

        board.addEventListener('mouseup', () => {
            isDown = false;
        });

        board.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - board.offsetLeft;
            const walk = (x - startX) * 1.5;
            board.scrollLeft = scrollLeft - walk;
        });

        board.dataset.dragBound = 'true';
    }

    function teamName(name, code) {
        return `<span class="wc-team">${code ? `<b>${escapeHtml(code)}</b> ` : ''}${escapeHtml(name)}</span>`;
    }

    function getDisplayDate(match) {
        if (state.activeTimezone === 'brt') {
            return splitDateTime(match.data_brt).date || match.data;
        }
        return match.data;
    }

    function getDisplayHour(match) {
        if (state.activeTimezone === 'brt') {
            return splitDateTime(match.data_brt).time || match.hora_et;
        }
        return match.hora_et;
    }

    function getTimezoneLabel() {
        return state.activeTimezone === 'brt' ? 'BRT' : 'ET';
    }

    function splitDateTime(value) {
        const parts = String(value || '').replace('T', ' ').trim().split(/\s+/);
        return {
            date: parts[0] || '',
            time: (parts[1] || '').slice(0, 5)
        };
    }

    function addHours(dateString, timeString, hours) {
        const [year, month, day] = String(dateString || '').split('-').map(Number);
        const [hour, minute] = String(timeString || '').split(':').map(Number);
        if (![year, month, day, hour, minute].every(Number.isFinite)) return '';
        const date = new Date(Date.UTC(year, month - 1, day, hour + hours, minute));
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')} ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
    }

    function sortMatches(a, b) {
        return `${a.data} ${a.hora_et} ${String(a.numero).padStart(3, '0')}`.localeCompare(`${b.data} ${b.hora_et} ${String(b.numero).padStart(3, '0')}`);
    }

    function orderedUnique(values, preferredOrder) {
        const unique = [...new Set(values.filter(Boolean))];
        if (!preferredOrder) return unique.sort();
        return preferredOrder.filter(value => unique.includes(value)).concat(unique.filter(value => !preferredOrder.includes(value)).sort());
    }

    function formatDateHead(dateString) {
        const date = parseDate(dateString);
        return `<strong>${WEEKDAYS[date.getDay()]}</strong><span>${String(date.getDate()).padStart(2, '0')}/${MONTHS[date.getMonth()]}</span>`;
    }

    function formatFullDate(dateString) {
        const date = parseDate(dateString);
        return `${WEEKDAYS[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} 2026`;
    }

    function parseDate(dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0);
    }

    function shortLabel(text) {
        return text
            .replace(/^Vencedor do jogo\s*/i, 'V')
            .replace(/^Perdedor do jogo\s*/i, 'P')
            .replace(/^1º do Grupo\s*/i, '1')
            .replace(/^2º do Grupo\s*/i, '2')
            .replace(/^3º dos Grupos\s*/i, '3 ')
            .replace(/\//g, '')
            .replace(/Grupo\s*/gi, 'G')
            .trim();
    }

    function shortPhase(phase) {
        return phase
            .replace('Fase de ', '')
            .replace('Oitavas de final', 'Oitavas')
            .replace('Quartas de final', 'Quartas')
            .replace('Disputa de 3º lugar', '3º lugar');
    }

    function getSearchTerms(query) {
        if (!query) return [];

        const ignoredTerms = new Set(['de', 'do', 'da', 'dos', 'das', 'e']);
        const rawTerms = query.includes(',')
            ? query.split(',')
            : query.split(/\s+/);

        return rawTerms
            .map(term => term.trim())
            .filter(term => term && /[a-z]/.test(term) && !ignoredTerms.has(term));
    }

    function normalizeText(text) {
        return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }

    function slug(text) {
        return normalizeText(text).replace(/[^a-z0-9]+/g, '-');
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
})();
