window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'UA-119803899-1');


(function (vegaEmbed) {
  // Cole aqui, sem alterar, o mesmo objeto que hoje está dentro do <script> do mapa em vis.html
  // WE REMOVED TITLE "title": {"text": ["1930-2022"], "subtitle": ["Melhor classifica\u00e7\u00e3o de cada sele\u00e7\u00e3o em", "alguma edi\u00e7\u00e3o da Copa do Mundo de Futebol"]}
    const spec = {
    "config": {"view": {"continuousWidth": 400, "continuousHeight": 350, "strokeWidth": 0},
    "title": {"anchor": "start", "angle": 80, "dx": 5, "dy": -100, "font": "Cinzel",
    "fontSize": 28, "orient": "bottom", "subtitleFont": "Courier", "subtitleFontSize": 15}},
    "layer": [{"data": {"sphere": true}, "mark": {"type": "geoshape", "fill": "#ffffff"}},
    {"data": {"url": "https://cdn.jsdelivr.net/npm/vega-datasets@v1.29.0/data/world-110m.json",
    "format": {"feature": "countries", "type": "topojson"}}, "mark": {"type": "geoshape", "fill": "#dddddd", "stroke": "#999999", "strokeWidth": 0.1}},
    {"data": {"url": "https://cdn.jsdelivr.net/npm/vega-datasets@v1.29.0/data/world-110m.json",
    "format": {"feature": "countries", "type": "topojson"}}, "mark": {"type": "geoshape", "stroke": "#666666", "strokeWidth": 0.1},
    "encoding": {"color": {"field": "P", "legend": {"columns": 3, "direction": "horizontal",
    "fillColor": "lightgrey", "labelFont": "Courier", "labelFontSize": 10, "offset": 2, "orient": "bottom-right",
    "padding": 9, "strokeColor": "black", "symbolStrokeWidth": 1, "title": "Melhor posi\u00e7\u00e3o Histórica",
    "titleFont": "Courier", "titleFontSize": 15, "titleLimit": 300, "values": ["Campe\u00e3o", "Vice Campe\u00e3o",
    "Semi-Final", "Quartas de Final", "Oitavas de Final", "Fase de Grupos"]},
    "scale": {"domain": ["Campe\u00e3o", "Fase de Grupos", "Oitavas de Final", "Semi-Final", "Quartas de Final", "Vice Campe\u00e3o"],
    "range": ["#f2d15c", "#c4efc8", "#6acf53", "#295fbd", "#8efaf1", "#db5f5f"]},
    "sort": "ascending", "type": "nominal"}, "tooltip": [{"field": "Selecao", "title": "País", "type": "nominal"},
    {"field": "Posicao", "type": "quantitative", "title": "Melhor"}]},                              
    "transform": [{"lookup": "id", "from": {"data": {"name": "data-1b7430fc15a47c4e88d83de8f51031b0"},
    "key": "id", "fields": ["Posicao", "Selecao", "teste", "P", "Ano"]}}]}], "height": 400,
    "projection": {"type": "equirectangular"},
    "width": 800, "$schema": "https://vega.github.io/schema/vega-lite/v4.17.0.json", "datasets": {"data-1b7430fc15a47c4e88d83de8f51031b0":
    [{"Selecao": "Alemanha", "id": 276, "Posicao": 1, "Continente": "Europa", "Ano": 1934, "P": "Campe\u00e3o", "alpha2": "de", "teste": 0.045454545454545456, "name": "Germany", "alpha3": "deu"},
    {"Selecao": "Angola", "id": 24, "Posicao": 23, "Continente": "Africa", "Ano": 2006, "P": "Fase de Grupos", "alpha2": "ao", "teste": 0.043478260869565216, "name": "Angola", "alpha3": "ago"},
    {"Selecao": "Argentina", "id": 32, "Posicao": 1, "Continente": "AmeSul", "Ano": 1930, "P": "Campe\u00e3o", "alpha2": "ar", "teste": 0.05555555555555555, "name": "Argentina", "alpha3": "arg"},
    {"Selecao": "Arg\u00e9lia", "id": 12, "Posicao": 13, "Continente": "Africa", "Ano": 1982, "P": "Oitavas de Final", "alpha2": "dz", "teste": 0.03571428571428571, "name": "Algeria", "alpha3": "dza"}, {"Selecao": "Ar\u00e1bia Saudita", "id": 682, "Posicao": 12, "Continente": "Asia", "Ano": 1994, "P": "Oitavas de Final", "alpha2": "sa", "teste": 0.03125, "name": "Saudi Arabia", "alpha3": "sau"},
    {"Selecao": "Austr\u00e1lia", "id": 36, "Posicao": 11, "Continente": "Asia", "Ano": 2022, "P": "Oitavas de Final", "alpha2": "au", "teste": 0.03333333333333333, "name": "Australia", "alpha3": "aus"},
    {"Selecao": "Bol\u00edvia", "id": 68, "Posicao": 12, "Continente": "AmeSul", "Ano": 1930, "P": "Fase de Grupos", "alpha2": "bo", "teste": 0.047619047619047616, "name": "Bolivia (Plurinational State of)", "alpha3": "bol"}, {"Selecao": "Brasil", "id": 76, "Posicao": 1, "Continente": "AmeSul", "Ano": 1930, "P": "Campe\u00e3o", "alpha2": "br", "teste": 0.07142857142857142, "name": "Brazil", "alpha3": "bra"},
    {"Selecao": "Bulg\u00e1ria", "id": 100, "Posicao": 4, "Continente": "Europa", "Ano": 1962, "P": "Semi-Final", "alpha2": "bg", "teste": 0.034482758620689655, "name": "Bulgaria", "alpha3": "bgr"}, {"Selecao": "B\u00e9lgica", "id": 56, "Posicao": 3, "Continente": "Europa", "Ano": 1930, "P": "Semi-Final", "alpha2": "be", "teste": 0.05263157894736842, "name": "Belgium", "alpha3": "bel"},
    {"Selecao": "B\u00f3snia e Herzegovina", "id": 70, "Posicao": 20, "Continente": "Europa", "Ano": 2014, "P": "Fase de Grupos", "alpha2": "ba", "teste": 0.05, "name": "Bosnia and Herzegovina", "alpha3": "bih"},
    {"Selecao": "Camar\u00f5es", "id": 120, "Posicao": 7, "Continente": "Africa", "Ano": 1982, "P": "Quartas de Final", "alpha2": "cm", "teste": 0.03125, "name": "Cameroon", "alpha3": "cmr"},
    {"Selecao": "Canad\u00e1", "id": 124, "Posicao": 24, "Continente": "AmeNorte", "Ano": 1986, "P": "Fase de Grupos", "alpha2": "ca", "teste": 0.041666666666666664, "name": "Canada", "alpha3": "can"}, {"Selecao": "Chile", "id": 152, "Posicao": 3, "Continente": "AmeSul", "Ano": 1930, "P": "Semi-Final", "alpha2": "cl", "teste": 0.045454545454545456, "name": "Chile", "alpha3": "chl"},
    {"Selecao": "China", "id": 156, "Posicao": 31, "Continente": "Asia", "Ano": 2002, "P": "Fase de Grupos", "alpha2": "cn", "teste": 0.03225806451612903, "name": "China", "alpha3": "chn"}, {"Selecao": "Ch\u00e9quia", "id": 203, "Posicao": 2, "Continente": "Europa", "Ano": 1934, "P": "Vice Campe\u00e3o", "alpha2": "cz", "teste": 0.05, "name": "Czechia", "alpha3": "cze"},
    {"Selecao": "Col\u00f4mbia", "id": 170, "Posicao": 5, "Continente": "AmeSul", "Ano": 1962, "P": "Quartas de Final", "alpha2": "co", "teste": 0.047619047619047616, "name": "Colombia", "alpha3": "col"}, {"Selecao": "Coreia do Norte", "id": 408, "Posicao": 8, "Continente": "Asia", "Ano": 1966, "P": "Quartas de Final", "alpha2": "kp", "teste": 0.03125, "name": "Korea (Democratic People's Republic of)", "alpha3": "prk"},
    {"Selecao": "Coreia do Sul", "id": 410, "Posicao": 4, "Continente": "Asia", "Ano": 1954, "P": "Semi-Final", "alpha2": "kr", "teste": 0.03333333333333333, "name": "Korea, Republic of", "alpha3": "kor"}, {"Selecao": "Costa Rica", "id": 188, "Posicao": 8, "Continente": "AmeNorte", "Ano": 1990, "P": "Quartas de Final", "alpha2": "cr", "teste": 0.03225806451612903, "name": "Costa Rica", "alpha3": "cri"},
    {"Selecao": "Costa do Marfim", "id": 384, "Posicao": 17, "Continente": "Africa", "Ano": 2006, "P": "Fase de Grupos", "alpha2": "ci", "teste": 0.047619047619047616, "name": "C\u00f4te d'Ivoire", "alpha3": "civ"},
    {"Selecao": "Cro\u00e1cia", "id": 191, "Posicao": 2, "Continente": "Europa", "Ano": 1998, "P": "Vice Campe\u00e3o", "alpha2": "hr", "teste": 0.043478260869565216, "name": "Croatia", "alpha3": "hrv"},
    {"Selecao": "Cuba", "id": 192, "Posicao": 7, "Continente": "AmeNorte", "Ano": 1938, "P": "Quartas de Final", "alpha2": "cu", "teste": 0.14285714285714285, "name": "Cuba", "alpha3": "cub"}, {"Selecao": "Dinamarca", "id": 208, "Posicao": 8, "Continente": "Europa", "Ano": 1986, "P": "Quartas de Final", "alpha2": "dk", "teste": 0.041666666666666664, "name": "Denmark", "alpha3": "dnk"}, {"Selecao": "Egito", "id": 818, "Posicao": 13, "Continente": "Africa", "Ano": 1934, "P": "Oitavas de Final", "alpha2": "eg", "teste": 0.03225806451612903, "name": "Egypt", "alpha3": "egy"},
    {"Selecao": "El Salvador", "id": 222, "Posicao": 16, "Continente": "AmeNorte", "Ano": 1970, "P": "Fase de Grupos", "alpha2": "sv", "teste": 0.041666666666666664, "name": "El Salvador", "alpha3": "slv"}, {"Selecao": "Emirados \u00c1rabes Unidos", "id": 784, "Posicao": 24, "Continente": "Asia", "Ano": 1990, "P": "Fase de Grupos", "alpha2": "ae", "teste": 0.041666666666666664, "name": "United Arab Emirates", "alpha3": "are"},
    {"Selecao": "Equador", "id": 218, "Posicao": 12, "Continente": "AmeSul", "Ano": 2002, "P": "Oitavas de Final", "alpha2": "ec", "teste": 0.041666666666666664, "name": "Ecuador", "alpha3": "ecu"}, {"Selecao": "Eslov\u00e1quia", "id": 703, "Posicao": 16, "Continente": "Europa", "Ano": 2010, "P": "Oitavas de Final", "alpha2": "sk", "teste": 0.0625, "name": "Slovakia", "alpha3": "svk"}, {"Selecao": "Eslov\u00eania", "id": 705, "Posicao": 18, "Continente": "Europa", "Ano": 2002, "P": "Fase de Grupos", "alpha2": "si", "teste": 0.03333333333333333, "name": "Slovenia", "alpha3": "svn"},
    {"Selecao": "Espanha", "id": 724, "Posicao": 1, "Continente": "Europa", "Ano": 1934, "P": "Campe\u00e3o", "alpha2": "es", "teste": 0.043478260869565216, "name": "Spain", "alpha3": "esp"},
    {"Selecao": "Estados Unidos", "id": 840, "Posicao": 3, "Continente": "AmeNorte", "Ano": 1930, "P": "Semi-Final", "alpha2": "us", "teste": 0.03125, "name": "United States of America", "alpha3": "usa"},
    {"Selecao": "Fran\u00e7a", "id": 250, "Posicao": 1, "Continente": "Europa", "Ano": 1930, "P": "Campe\u00e3o", "alpha2": "fr", "teste": 0.034482758620689655, "name": "France", "alpha3": "fra"}, {"Selecao": "Gana", "id": 288, "Posicao": 7, "Continente": "Africa", "Ano": 2006, "P": "Quartas de Final", "alpha2": "gh", "teste": 0.04, "name": "Ghana", "alpha3": "gha"}, {"Selecao": "Gr\u00e9cia", "id": 300, "Posicao": 13, "Continente": "Europa", "Ano": 1994, "P": "Oitavas de Final", "alpha2": "gr", "teste": 0.04, "name": "Greece", "alpha3": "grc"},
    {"Selecao": "Haiti", "id": 332, "Posicao": 15, "Continente": "AmeNorte", "Ano": 1974, "P": "Fase de Grupos", "alpha2": "ht", "teste": 0.06666666666666667, "name": "Haiti", "alpha3": "hti"},
    {"Selecao": "Holanda", "id": 528, "Posicao": 2, "Continente": "Europa", "Ano": 1934, "P": "Vice Campe\u00e3o", "alpha2": "nl", "teste": 0.07142857142857142, "name": "Netherlands", "alpha3": "nld"},
    {"Selecao": "Honduras", "id": 340, "Posicao": 18, "Continente": "AmeNorte", "Ano": 1982, "P": "Fase de Grupos", "alpha2": "hn", "teste": 0.03225806451612903, "name": "Honduras", "alpha3": "hnd"}, {"Selecao": "Hungria", "id": 348, "Posicao": 2, "Continente": "Europa", "Ano": 1934, "P": "Vice Campe\u00e3o", "alpha2": "hu", "teste": 0.05555555555555555, "name": "Hungary", "alpha3": "hun"}, {"Selecao": "Indon\u00e9sia", "id": 360, "Posicao": 15, "Continente": "Asia", "Ano": 1938, "P": "Oitavas de Final", "alpha2": "id", "teste": 0.06666666666666667, "name": "Indonesia", "alpha3": "idn"},
    {"Selecao": "Inglaterra", "id": 826, "Posicao": 1, "Continente": "Europa", "Ano": 1950, "P": "Campe\u00e3o", "alpha2": "gb", "teste": 0.038461538461538464, "name": "United Kingdom of Great Britain and Northern Ireland", "alpha3": "gbr"}, {"Selecao": "Iraque", "id": 368, "Posicao": 23, "Continente": "Asia", "Ano": 1986, "P": "Fase de Grupos", "alpha2": "iq", "teste": 0.043478260869565216, "name": "Iraq", "alpha3": "irq"}, {"Selecao": "Irlanda", "id": 372, "Posicao": 8, "Continente": "Europa", "Ano": 1990, "P": "Quartas de Final", "alpha2": "ie", "teste": 0.0625, "name": "Ireland", "alpha3": "irl"},
    {"Selecao": "Ir\u00e3", "id": 364, "Posicao": 14, "Continente": "Asia", "Ano": 1978, "P": "Fase de Grupos", "alpha2": "ir", "teste": 0.03571428571428571, "name": "Iran (Islamic Republic of)", "alpha3": "irn"}, {"Selecao": "Isl\u00e2ndia", "id": 352, "Posicao": 28, "Continente": "Europa", "Ano": 2018, "P": "Fase de Grupos", "alpha2": "is", "teste": 0.03571428571428571, "name": "Iceland", "alpha3": "isl"},
    {"Selecao": "Israel", "id": 376, "Posicao": 12, "Continente": "Europa", "Ano": 1970, "P": "Fase de Grupos", "alpha2": "il", "teste": 0.08333333333333333, "name": "Israel", "alpha3": "isr"},
    {"Selecao": "It\u00e1lia", "id": 380, "Posicao": 1, "Continente": "Europa", "Ano": 1934, "P": "Campe\u00e3o", "alpha2": "it", "teste": 0.038461538461538464, "name": "Italy", "alpha3": "ita"}, {"Selecao": "Jamaica", "id": 388, "Posicao": 22, "Continente": "AmeNorte", "Ano": 1998, "P": "Fase de Grupos", "alpha2": "jm", "teste": 0.045454545454545456, "name": "Jamaica", "alpha3": "jam"},
    {"Selecao": "Jap\u00e3o", "id": 392, "Posicao": 9, "Continente": "Asia", "Ano": 1998, "P": "Oitavas de Final", "alpha2": "jp", "teste": 0.03225806451612903, "name": "Japan", "alpha3": "jpn"}, {"Selecao": "Kuwait", "id": 414, "Posicao": 21, "Continente": "Asia", "Ano": 1982, "P": "Fase de Grupos", "alpha2": "kw", "teste": 0.047619047619047616, "name": "Kuwait", "alpha3": "kwt"},
    {"Selecao": "Marrocos", "id": 504, "Posicao": 4, "Continente": "Africa", "Ano": 2022, "P": "Semi-Final", "alpha2": "ma", "teste": 0.037037037037037035, "name": "Morocco", "alpha3": "mar"}, {"Selecao": "M\u00e9xico", "id": 484, "Posicao": 6, "Continente": "AmeNorte", "Ano": 1930, "P": "Quartas de Final", "alpha2": "mx", "teste": 0.0625, "name": "Mexico", "alpha3": "mex"}, {"Selecao": "Nig\u00e9ria", "id": 566, "Posicao": 9, "Continente": "Africa", "Ano": 1994, "P": "Oitavas de Final", "alpha2": "ng", "teste": 0.037037037037037035, "name": "Nigeria", "alpha3": "nga"},
    {"Selecao": "Noruega", "id": 578, "Posicao": 12, "Continente": "Europa", "Ano": 1938, "P": "Oitavas de Final", "alpha2": "no", "teste": 0.058823529411764705, "name": "Norway", "alpha3": "nor"},
    {"Selecao": "Nova Zel\u00e2ndia", "id": 554, "Posicao": 22, "Continente": "Oceania", "Ano": 1982, "P": "Fase de Grupos", "alpha2": "nz", "teste": 0.043478260869565216, "name": "New Zealand", "alpha3": "nzl"}, {"Selecao": "Panam\u00e1", "id": 591, "Posicao": 32, "Continente": "AmeNorte", "Ano": 2018, "P": "Fase de Grupos", "alpha2": "pa", "teste": 0.03125, "name": "Panama", "alpha3": "pan"},
    {"Selecao": "Paraguai", "id": 600, "Posicao": 8, "Continente": "AmeSul", "Ano": 1930, "P": "Quartas de Final", "alpha2": "py", "teste": 0.05555555555555555, "name": "Paraguay", "alpha3": "pry"}, {"Selecao": "Peru", "id": 604, "Posicao": 7, "Continente": "AmeSul", "Ano": 1930, "P": "Quartas de Final", "alpha2": "pe", "teste": 0.05, "name": "Peru", "alpha3": "per"},
    {"Selecao": "Pol\u00f3nia", "id": 616, "Posicao": 3, "Continente": "Europa", "Ano": 1938, "P": "Semi-Final", "alpha2": "pl", "teste": 0.04, "name": "Poland", "alpha3": "pol"},
    {"Selecao": "Portugal", "id": 620, "Posicao": 3, "Continente": "Europa", "Ano": 1966, "P": "Semi-Final", "alpha2": "pt", "teste": 0.047619047619047616, "name": "Portugal", "alpha3": "prt"}, {"Selecao": "Rom\u00eania", "id": 642, "Posicao": 6, "Continente": "Europa", "Ano": 1930, "P": "Quartas de Final", "alpha2": "ro", "teste": 0.08333333333333333, "name": "Romania", "alpha3": "rou"},
    {"Selecao": "R\u00fassia", "id": 643, "Posicao": 4, "Continente": "Europa", "Ano": 1958, "P": "Semi-Final", "alpha2": "ru", "teste": 0.041666666666666664, "name": "Russian Federation", "alpha3": "rus"},
    {"Selecao": "Senegal", "id": 686, "Posicao": 7, "Continente": "Africa", "Ano": 2002, "P": "Quartas de Final", "alpha2": "sn", "teste": 0.058823529411764705, "name": "Senegal", "alpha3": "sen"}, {"Selecao": "Servia", "id": 688, "Posicao": 4, "Continente": "Europa", "Ano": 1930, "P": "Semi-Final", "alpha2": "rs", "teste": 0.03125, "name": "Serbia", "alpha3": "srb"}, {"Selecao": "Su\u00e9cia", "id": 752, "Posicao": 2, "Continente": "Europa", "Ano": 1934, "P": "Vice Campe\u00e3o", "alpha2": "se", "teste": 0.047619047619047616, "name": "Sweden", "alpha3": "swe"},
    {"Selecao": "Su\u00ed\u00e7a", "id": 756, "Posicao": 5, "Continente": "Europa", "Ano": 1934, "P": "Quartas de Final", "alpha2": "ch", "teste": 0.05263157894736842, "name": "Switzerland", "alpha3": "che"}, {"Selecao": "Togo", "id": 768, "Posicao": 30, "Continente": "Africa", "Ano": 2006, "P": "Fase de Grupos", "alpha2": "tg", "teste": 0.03333333333333333, "name": "Togo", "alpha3": "tgo"},
    {"Selecao": "Trindade e Tobago", "id": 780, "Posicao": 27, "Continente": "AmeNorte", "Ano": 2006, "P": "Fase de Grupos", "alpha2": "tt", "teste": 0.037037037037037035, "name": "Trinidad and Tobago", "alpha3": "tto"},
    {"Selecao": "Tun\u00edsia", "id": 788, "Posicao": 9, "Continente": "Africa", "Ano": 1978, "P": "Fase de Grupos", "alpha2": "tn", "teste": 0.034482758620689655, "name": "Tunisia", "alpha3": "tun"}, {"Selecao": "Turquia", "id": 792, "Posicao": 3, "Continente": "Europa", "Ano": 1954, "P": "Semi-Final", "alpha2": "tr", "teste": 0.1, "name": "Turkey", "alpha3": "tur"}, {"Selecao": "Ucr\u00e2nia", "id": 804, "Posicao": 8, "Continente": "Europa", "Ano": 2006, "P": "Quartas de Final", "alpha2": "ua", "teste": 0.125, "name": "Ukraine", "alpha3": "ukr"},
    {"Selecao": "Uruguai", "id": 858, "Posicao": 1, "Continente": "AmeSul", "Ano": 1930, "P": "Campe\u00e3o", "alpha2": "uy", "teste": 0.038461538461538464, "name": "Uruguay", "alpha3": "ury"},
    {"Selecao": "Zaire", "id": 180, "Posicao": 16, "Continente": "Africa", "Ano": 1974, "P": "Fase de Grupos", "alpha2": "cd", "teste": 0.0625, "name": "Congo, Democratic Republic of the", "alpha3": "cod"},
    {"Selecao": "\u00c1frica do Sul", "id": 710, "Posicao": 17, "Continente": "Africa", "Ano": 1998, "P": "Fase de Grupos", "alpha2": "za", "teste": 0.041666666666666664, "name": "South Africa", "alpha3": "zaf"},
    {"Selecao": "\u00c1ustria", "id": 40, "Posicao": 3, "Continente": "Europa", "Ano": 1934, "P": "Semi-Final", "alpha2": "at", "teste": 0.043478260869565216, "name": "Austria", "alpha3": "aut"}]}};


    const embedOpt = {
        renderer: "svg",
        mode: "vega-lite"
    };

    function showError(el, error) {
        el.innerHTML =
        '<div class="error" style="color:red;">' +
        '<p>JavaScript Error: ' + error.message + '</p>' +
        "<p>This usually means there's a typo in your chart specification. " +
        "See the javascript console for the full traceback.</p>" +
        '</div>';
        throw error;
    }

    const el = document.getElementById("vis");
    if (el) {
        vegaEmbed("#vis", spec, embedOpt).catch(error => showError(el, error));
    }
})(vegaEmbed);

document.addEventListener("DOMContentLoaded", function () {
  const CSV_PATH = "csv/vis/golden_ball.csv";
  const FALLBACK_IMG = "images/placeholder.jpg";

  function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function getAwardClass(premio) {
    const value = normalizeText(premio);

    if (value === "bola de ouro" || value === "golden ball") return "award-gold";
    if (value === "bola de prata" || value === "silver ball") return "award-silver";
    if (value === "bola de bronze" || value === "bronze ball") return "award-bronze";

    return "";
  }

  function getAwardImage(premio) {
    const value = normalizeText(premio);

    if (value === "bola de ouro" || value === "golden ball") return "images/bola_de_ouro.png";
    if (value === "bola de prata" || value === "silver ball") return "images/bola_de_prata.png";
    if (value === "bola de bronze" || value === "bronze ball") return "images/bola_de_bronze.png";

    return "";
  }

  function getImageUrl(player) {
    const directImage =
      (player.player_image_url || "").trim() ||
      (player.wikipedia_profile_link || "").trim();

    const isDirectImage =
      /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(directImage) ||
      directImage.includes("upload.wikimedia.org");

    return isDirectImage ? directImage : FALLBACK_IMG;
  }

  function awardRank(premio) {
    const value = normalizeText(premio);
    const order = {
      "bola de ouro": 1,
      "bola de prata": 2,
      "bola de bronze": 3
    };
    return order[value] || 999;
  }

  function getProfileUrl(player) {
    const link = (player.wikipedia_profile_link || "").trim();
    return /^https?:\/\//i.test(link) ? link : "#";
  }

  function renderCards(data, selectedYear) {
    const container = document.getElementById("ballAwardGrid");
    if (!container) return;

    const players = data
      .filter(row => String(row.year).trim() === String(selectedYear).trim())
      .filter(row => awardRank(row.premio) < 999)
      .sort((a, b) => awardRank(a.premio) - awardRank(b.premio))
      .slice(0, 3);

    container.innerHTML = players.map(player => `
      <div class="flip-card">
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <img
              src="${escapeHtml(getImageUrl(player))}"
              alt="${escapeHtml(player.player_name)}"
              onerror="this.src='${FALLBACK_IMG}'"
            />

            <div class="scorer-info">
              <h3>
                <a href="${escapeHtml(getProfileUrl(player))}" target="_blank" rel="noopener noreferrer">
                  ${escapeHtml(player.player_name)}
                </a>
              </h3>

              <div class="scorer-team">${escapeHtml(player.nome_time || "-")}</div>
              <div class="ball-award-prize ${getAwardClass(player.premio)}">
                ${escapeHtml(player.premio || "-")}
              </div>

              ${getAwardImage(player.premio) ? `
                <img
                  class="ball-award-icon"
                  src="${escapeHtml(getAwardImage(player.premio))}"
                  alt="${escapeHtml(player.premio || '')}"
                />
              ` : ""}
            </div>
          </div>

          <div class="flip-card-back">
            <div class="card-back-title">${escapeHtml(player.player_name)}</div>

            <div class="card-back-list">
              <div class="card-back-item">
                <strong>Idade na Edição</strong>
                ${escapeHtml(player.age || "-")}
              </div>

              <div class="card-back-item">
                <strong>Posição Básica</strong>
                ${escapeHtml(player["posição"] || "-")}
              </div>

              <div class="card-back-item">
                <strong>Gols na Edição</strong>
                ${escapeHtml(player.n_gols || "-")}
              </div>

              <div class="card-back-item">
                <strong>Aparições na Edição</strong>
                ${escapeHtml(player.n_matches || "-")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join("");
  }

  Papa.parse(CSV_PATH, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const data = results.data;

      const years = [...new Set(
        data.map(row => String(row.year).trim()).filter(Boolean)
      )].sort((a, b) => Number(b) - Number(a));

      const select = document.getElementById("tournamentSelect");
      if (!select) return;

      select.innerHTML = years.map(year => `
        <option value="${escapeHtml(year)}">${escapeHtml(year)}</option>
      `).join("");

      if (years.length > 0) {
        renderCards(data, years[0]);
      }

      select.addEventListener("change", function () {
        renderCards(data, this.value);
      });
    },
    error: function (err) {
      const grid = document.getElementById("ballAwardGrid");
      if (grid) {
        grid.innerHTML = `<p style="color:red;">Erro ao carregar o CSV: ${escapeHtml(err.message)}</p>`;
      }
      console.error(err);
    }
  });
});



//  CHAVEAMENTO ELIMINATÓRIO 
(function () {
const BK_ED = {
    2022: {
    host: 'Qatar', champion: 'Argentina', champFlag: '🇦🇷', rounds: [
        [{ a: 'Países Baixos', af: '🇳🇱', as: 3, b: 'Estados Unidos', bf: '🇺🇸', bs: 1, w: 'a' }, { a: 'Argentina', af: '🇦🇷', as: 2, b: 'Austrália', bf: '🇦🇺', bs: 1, w: 'a' }, { a: 'Japão', af: '🇯🇵', as: 1, b: 'Croácia', bf: '🇭🇷', bs: 1, w: 'b', n: 'pens' }, { a: 'Brasil', af: '🇧🇷', as: 4, b: 'Coreia do Sul', bf: '🇰🇷', bs: 1, w: 'a' }, { a: 'França', af: '🇫🇷', as: 3, b: 'Polônia', bf: '🇵🇱', bs: 1, w: 'a' }, { a: 'Inglaterra', af: '🇬🇧', as: 3, b: 'Senegal', bf: '🇸🇳', bs: 0, w: 'a' }, { a: 'Marrocos', af: '🇲🇦', as: 0, b: 'Espanha', bf: '🇪🇸', bs: 0, w: 'a', n: 'pens' }, { a: 'Portugal', af: '🇵🇹', as: 6, b: 'Suíça', bf: '🇨🇭', bs: 1, w: 'a' }],
        [{ a: 'Países Baixos', af: '🇳🇱', as: 2, b: 'Argentina', bf: '🇦🇷', bs: 2, w: 'b', n: 'pens' }, { a: 'Croácia', af: '🇭🇷', as: 1, b: 'Brasil', bf: '🇧🇷', bs: 1, w: 'a', n: 'pens' }, { a: 'França', af: '🇫🇷', as: 2, b: 'Inglaterra', bf: '🇬🇧', bs: 1, w: 'a' }, { a: 'Marrocos', af: '🇲🇦', as: 1, b: 'Portugal', bf: '🇵🇹', bs: 0, w: 'a' }],
        [{ a: 'Argentina', af: '🇦🇷', as: 3, b: 'Croácia', bf: '🇭🇷', bs: 0, w: 'a' }, { a: 'França', af: '🇫🇷', as: 2, b: 'Marrocos', bf: '🇲🇦', bs: 0, w: 'a' }],
        [{ a: 'Argentina', af: '🇦🇷', as: 3, b: 'França', bf: '🇫🇷', bs: 3, w: 'a', n: 'pens' }]]
    },
    2018: {
    host: 'Rússia', champion: 'França', champFlag: '🇫🇷', rounds: [
        [{ a: 'França', af: '🇫🇷', as: 4, b: 'Argentina', bf: '🇦🇷', bs: 3, w: 'a' }, { a: 'Uruguai', af: '🇺🇾', as: 2, b: 'Portugal', bf: '🇵🇹', bs: 1, w: 'a' }, { a: 'Bélgica', af: '🇧🇪', as: 3, b: 'Japão', bf: '🇯🇵', bs: 2, w: 'a' }, { a: 'Brasil', af: '🇧🇷', as: 2, b: 'México', bf: '🇲🇽', bs: 0, w: 'a' }, { a: 'Croácia', af: '🇭🇷', as: 1, b: 'Dinamarca', bf: '🇩🇰', bs: 1, w: 'a', n: 'pens' }, { a: 'Rússia', af: '🇷🇺', as: 1, b: 'Espanha', bf: '🇪🇸', bs: 1, w: 'a', n: 'pens' }, { a: 'Suécia', af: '🇸🇪', as: 1, b: 'Suíça', bf: '🇨🇭', bs: 0, w: 'a' }, { a: 'Colômbia', af: '🇨🇴', as: 1, b: 'Inglaterra', bf: '🇬🇧', bs: 1, w: 'b', n: 'pens' }],
        [{ a: 'França', af: '🇫🇷', as: 2, b: 'Uruguai', bf: '🇺🇾', bs: 0, w: 'a' }, { a: 'Bélgica', af: '🇧🇪', as: 2, b: 'Brasil', bf: '🇧🇷', bs: 1, w: 'a' }, { a: 'Croácia', af: '🇭🇷', as: 2, b: 'Rússia', bf: '🇷🇺', bs: 2, w: 'a', n: 'pens' }, { a: 'Suécia', af: '🇸🇪', as: 0, b: 'Inglaterra', bf: '🇬🇧', bs: 2, w: 'b' }],
        [{ a: 'França', af: '🇫🇷', as: 1, b: 'Bélgica', bf: '🇧🇪', bs: 0, w: 'a' }, { a: 'Croácia', af: '🇭🇷', as: 2, b: 'Inglaterra', bf: '🇬🇧', bs: 1, w: 'a' }],
        [{ a: 'França', af: '🇫🇷', as: 4, b: 'Croácia', bf: '🇭🇷', bs: 2, w: 'a' }]]
    },
    2014: {
    host: 'Brasil', champion: 'Alemanha', champFlag: '🇩🇪', rounds: [
        [{ a: 'Alemanha', af: '🇩🇪', as: 2, b: 'Argélia', bf: '🇩🇿', bs: 1, w: 'a', n: 'AET' }, { a: 'França', af: '🇫🇷', as: 2, b: 'Nigéria', bf: '🇳🇬', bs: 0, w: 'a' }, { a: 'Brasil', af: '🇧🇷', as: 1, b: 'Chile', bf: '🇨🇱', bs: 1, w: 'a', n: 'pens' }, { a: 'Colômbia', af: '🇨🇴', as: 2, b: 'Uruguai', bf: '🇺🇾', bs: 0, w: 'a' }, { a: 'Países Baixos', af: '🇳🇱', as: 2, b: 'México', bf: '🇲🇽', bs: 1, w: 'a' }, { a: 'Costa Rica', af: '🇨🇷', as: 1, b: 'Grécia', bf: '🇬🇷', bs: 1, w: 'a', n: 'pens' }, { a: 'Argentina', af: '🇦🇷', as: 1, b: 'Suíça', bf: '🇨🇭', bs: 0, w: 'a', n: 'AET' }, { a: 'Bélgica', af: '🇧🇪', as: 2, b: 'Estados Unidos', bf: '🇺🇸', bs: 1, w: 'a', n: 'AET' }],
        [{ a: 'Alemanha', af: '🇩🇪', as: 1, b: 'França', bf: '🇫🇷', bs: 0, w: 'a' }, { a: 'Brasil', af: '🇧🇷', as: 2, b: 'Colômbia', bf: '🇨🇴', bs: 1, w: 'a' }, { a: 'Países Baixos', af: '🇳🇱', as: 0, b: 'Costa Rica', bf: '🇨🇷', bs: 0, w: 'a', n: 'pens' }, { a: 'Argentina', af: '🇦🇷', as: 1, b: 'Bélgica', bf: '🇧🇪', bs: 0, w: 'a' }],
        [{ a: 'Alemanha', af: '🇩🇪', as: 7, b: 'Brasil', bf: '🇧🇷', bs: 1, w: 'a' }, { a: 'Países Baixos', af: '🇳🇱', as: 0, b: 'Argentina', bf: '🇦🇷', bs: 0, w: 'b', n: 'pens' }],
        [{ a: 'Alemanha', af: '🇩🇪', as: 1, b: 'Argentina', bf: '🇦🇷', bs: 0, w: 'a', n: 'AET' }]]
    },
    2010: {
    host: 'África do Sul', champion: 'Espanha', champFlag: '🇪🇸', rounds: [
        [{ a: 'Espanha', af: '🇪🇸', as: 1, b: 'Portugal', bf: '🇵🇹', bs: 0, w: 'a' }, { a: 'Paraguai', af: '🇵🇾', as: 0, b: 'Japão', bf: '🇯🇵', bs: 0, w: 'a', n: 'pens' }, { a: 'Alemanha', af: '🇩🇪', as: 4, b: 'Inglaterra', bf: '🇬🇧', bs: 1, w: 'a' }, { a: 'Argentina', af: '🇦🇷', as: 3, b: 'México', bf: '🇲🇽', bs: 1, w: 'a' }, { a: 'Países Baixos', af: '🇳🇱', as: 2, b: 'Eslováquia', bf: '🇸🇰', bs: 1, w: 'a' }, { a: 'Brasil', af: '🇧🇷', as: 3, b: 'Chile', bf: '🇨🇱', bs: 0, w: 'a' }, { a: 'Uruguai', af: '🇺🇾', as: 2, b: 'Coreia do Sul', bf: '🇰🇷', bs: 1, w: 'a' }, { a: 'Gana', af: '🇬🇭', as: 2, b: 'Estados Unidos', bf: '🇺🇸', bs: 1, w: 'a', n: 'AET' }],
        [{ a: 'Espanha', af: '🇪🇸', as: 1, b: 'Paraguai', bf: '🇵🇾', bs: 0, w: 'a' }, { a: 'Alemanha', af: '🇩🇪', as: 4, b: 'Argentina', bf: '🇦🇷', bs: 0, w: 'a' }, { a: 'Países Baixos', af: '🇳🇱', as: 2, b: 'Brasil', bf: '🇧🇷', bs: 1, w: 'a' }, { a: 'Uruguai', af: '🇺🇾', as: 1, b: 'Gana', bf: '🇬🇭', bs: 1, w: 'a', n: 'pens' }],
        [{ a: 'Espanha', af: '🇪🇸', as: 1, b: 'Alemanha', bf: '🇩🇪', bs: 0, w: 'a' }, { a: 'Países Baixos', af: '🇳🇱', as: 3, b: 'Uruguai', bf: '🇺🇾', bs: 2, w: 'a' }],
        [{ a: 'Espanha', af: '🇪🇸', as: 1, b: 'Países Baixos', bf: '🇳🇱', bs: 0, w: 'a', n: 'AET' }]]
    },
    2006: {
    host: 'Alemanha', champion: 'Itália', champFlag: '🇮🇹', rounds: [
        [{ a: 'Itália', af: '🇮🇹', as: 1, b: 'Austrália', bf: '🇦🇺', bs: 0, w: 'a' }, { a: 'Ucrânia', af: '🇺🇦', as: 0, b: 'Suíça', bf: '🇨🇭', bs: 0, w: 'a', n: 'pens' }, { a: 'Alemanha', af: '🇩🇪', as: 2, b: 'Suécia', bf: '🇸🇪', bs: 0, w: 'a' }, { a: 'Argentina', af: '🇦🇷', as: 2, b: 'México', bf: '🇲🇽', bs: 1, w: 'a', n: 'AET' }, { a: 'Inglaterra', af: '🇬🇧', as: 1, b: 'Equador', bf: '🇪🇨', bs: 0, w: 'a' }, { a: 'Portugal', af: '🇵🇹', as: 1, b: 'Países Baixos', bf: '🇳🇱', bs: 0, w: 'a' }, { a: 'Brasil', af: '🇧🇷', as: 3, b: 'Gana', bf: '🇬🇭', bs: 0, w: 'a' }, { a: 'França', af: '🇫🇷', as: 3, b: 'Espanha', bf: '🇪🇸', bs: 1, w: 'a' }],
        [{ a: 'Itália', af: '🇮🇹', as: 3, b: 'Ucrânia', bf: '🇺🇦', bs: 0, w: 'a' }, { a: 'Alemanha', af: '🇩🇪', as: 1, b: 'Argentina', bf: '🇦🇷', bs: 1, w: 'a', n: 'pens' }, { a: 'Inglaterra', af: '🇬🇧', as: 0, b: 'Portugal', bf: '🇵🇹', bs: 0, w: 'b', n: 'pens' }, { a: 'Brasil', af: '🇧🇷', as: 0, b: 'França', bf: '🇫🇷', bs: 1, w: 'b' }],
        [{ a: 'Itália', af: '🇮🇹', as: 2, b: 'Alemanha', bf: '🇩🇪', bs: 0, w: 'a', n: 'AET' }, { a: 'Portugal', af: '🇵🇹', as: 0, b: 'França', bf: '🇫🇷', bs: 1, w: 'b' }],
        [{ a: 'Itália', af: '🇮🇹', as: 1, b: 'França', bf: '🇫🇷', bs: 1, w: 'a', n: 'pens' }]]
    }
};
const BK_RL = ['Oitavas de Final', 'Quartas de Final', 'Semifinais', 'Final'];
const BK_RS = ['Oitavas', 'Quartas', 'Semifinal', 'Final'];
let bkYear = 2022, bkHov = null, bkLM = {};
const bkW = m => m.w === 'a' ? m.a : m.b;
function bkRP(el, c) { const er = el.getBoundingClientRect(), cr = c.getBoundingClientRect(); return { right: er.right - cr.left, left: er.left - cr.left, cy: er.top - cr.top + er.height / 2 }; }
function bkInit() { bkPills(); bkEdition(); }
function bkPills() {
    const el = document.getElementById('bk-pills'); el.innerHTML = '';
    Object.keys(BK_ED).sort((a, b) => +b - +a).forEach(y => {
    const btn = document.createElement('button'); btn.className = 'bk-pill' + (y == bkYear ? ' bk-active' : ''); btn.textContent = y; btn.onclick = () => bkSwitch(+y); el.appendChild(btn);
    });
}
function bkEdition() {
    const ed = BK_ED[bkYear];
    document.getElementById('bk-cbName').textContent = ed.champFlag + ' ' + ed.champion;
    document.getElementById('bk-cbYear').textContent = ed.host + ' · ' + bkYear;
    bkBracket(ed); bkPath(ed);
    bkHL();
}
function bkBracket(ed) {
    const bw = document.getElementById('bk-bw'); bw.querySelectorAll('.bk-rc').forEach(e => e.remove());
    ed.rounds.forEach((matches, ri) => {
    const col = document.createElement('div'); col.className = 'bk-rc';
    col.innerHTML = `<div class="bk-rc-head">${BK_RL[ri]}</div>`;
    const body = document.createElement('div'); body.className = 'bk-rc-body';
    matches.forEach((m, mi) => {
        const card = document.createElement('div'); card.className = 'bk-mc'; card.dataset.r = ri; card.dataset.m = mi;
        ['a', 'b'].forEach(slot => {
        const row = document.createElement('div'); row.className = 'bk-tr' + (m.w === slot ? ' bk-won' : ''); row.dataset.team = m[slot] || '';
        const note = m.w === slot && m.n ? `<span class="bk-nt">${m.n}</span>` : '';
        row.innerHTML = `<span class="bk-tf">${m[slot + 'f'] || ''}</span><span class="bk-tn${!m[slot] ? ' bk-tbd' : ''}">${m[slot] || 'A definir'}</span>${m[slot + 's'] !== undefined ? `<span class="bk-ts">${m[slot + 's']}</span>` : ''}${note}`;
        row.addEventListener('mouseenter', () => { bkHov = m[slot]; bkHL(); });
        row.addEventListener('mouseleave', () => { bkHov = null; bkHL(); });
        card.appendChild(row);
        });
        body.appendChild(card);
    });
    col.appendChild(body); bw.appendChild(col);
    });
    requestAnimationFrame(() => requestAnimationFrame(bkLines));
}
function bkLines() {
    const ed = BK_ED[bkYear], bw = document.getElementById('bk-bw'), svg = document.getElementById('bk-svg');
    svg.setAttribute('width', bw.scrollWidth); svg.setAttribute('height', bw.offsetHeight);
    svg.innerHTML = ''; bkLM = {}; const champ = ed.champion;
    ed.rounds.forEach((matches, ri) => {
    if (ri >= ed.rounds.length - 1) return;
    matches.forEach((match, mi) => {
        const nextMi = Math.floor(mi / 2), isTop = mi % 2 === 0;
        const srcCard = bw.querySelector(`.bk-mc[data-r="${ri}"][data-m="${mi}"]`);
        const tgtCard = bw.querySelector(`.bk-mc[data-r="${ri + 1}"][data-m="${nextMi}"]`);
        if (!srcCard || !tgtCard) return;
        const sr = bkRP(srcCard, bw), tr = bkRP(tgtCard, bw);
        const x0 = sr.right, y0 = sr.cy;
        const tgtRows = tgtCard.querySelectorAll('.bk-tr');
        const trr = bkRP(isTop ? tgtRows[0] : tgtRows[1], bw);
        const x3 = tr.left, y3 = trr.cy, mx = x0 + (x3 - x0) * 0.5;
        const d = `M ${x0} ${y0} H ${mx} V ${y3} H ${x3}`;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
        const winner = bkW(match); bkLM[`${ri}-${mi}`] = { path, winner };
        bkLS(path, winner === champ, false); svg.appendChild(path);
    });
    });
}

function bkLS(path, isChamp, isHov) {
    if (isHov) { path.setAttribute('stroke', '#4c9bc2'); path.setAttribute('stroke-width', '2'); path.setAttribute('opacity', '0.9'); }
    else if (isChamp) { path.setAttribute('stroke', '#f7db09'); path.setAttribute('stroke-width', '1.8'); path.setAttribute('opacity', '0.65'); }
    else { path.setAttribute('stroke', '#e2e3e0'); path.setAttribute('stroke-width', '1.5'); path.setAttribute('opacity', '1'); }
}

function bkHL() {
    const ed = BK_ED[bkYear], champ = ed.champion;
    document.querySelectorAll('.bk-mc').forEach(card => {
    card.classList.remove('bk-is-champ', 'bk-is-hover');
    const m = ed.rounds[+card.dataset.r][+card.dataset.m];
    if (bkHov && (m.a === bkHov || m.b === bkHov)) card.classList.add('bk-is-hover');
    else if (m.a === champ || m.b === champ) card.classList.add('bk-is-champ');
    });
    document.querySelectorAll('.bk-tr').forEach(row => { row.classList.remove('bk-hl'); if (bkHov && row.dataset.team === bkHov) row.classList.add('bk-hl'); });
    Object.values(bkLM).forEach(({ path, winner }) => bkLS(path, winner === champ, bkHov && winner === bkHov));
    const t = document.getElementById('bk-pathTitle');
    if (bkHov) { t.innerHTML = `TRAJETÓRIA — <span style="color:#1a5276">${bkHov}</span>`; bkPath(ed, bkHov); }
    else { t.innerHTML = 'TRAJETÓRIA DO CAMPEÃO'; bkPath(ed); }
}
function bkPath(ed, over) {
    const target = over || ed.champion;
    let tf = over ? '' : ed.champFlag;
    if (over) for (const r of ed.rounds) for (const m of r) { if (m.a === target) { tf = m.af; break; } if (m.b === target) { tf = m.bf; break; } }
    const c = document.getElementById('bk-pathCards'); c.innerHTML = '';
    const tr = document.createElement('div'); tr.className = 'bk-trophy';
    tr.innerHTML = `<div style="font-size:20px">${over ? '⚽' : '🏆'}</div><div style="font-size:28px;line-height:1">${tf}</div><div style="font-size:13px;font-weight:900;color:#7d5a00;line-height:1;margin-top:2px">${target}</div><div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#bbb">${over ? bkYear : 'Campeão ' + bkYear}</div>`;
    c.appendChild(tr);
    ed.rounds.forEach((round, ri) => {
    round.forEach(m => {
        const isA = m.a === target, isB = m.b === target; if (!isA && !isB) return;
        const won = (isA && m.w === 'a') || (isB && m.w === 'b');
        const myS = isA ? m.as : m.bs, oppS = isA ? m.bs : m.as, opp = isA ? m.b : m.a, oppF = isA ? m.bf : m.af;
        const card = document.createElement('div'); card.className = 'bk-pc'; if (!won) card.style.opacity = '0.5';
        card.innerHTML = `<div class="bk-pc-rnd">${BK_RS[ri]}</div><div class="bk-pc-w"><span class="wf">${tf}</span><span class="wn">${target}</span><span class="ws">${myS}</span></div><div class="bk-pc-sep"></div><div class="bk-pc-l"><span class="lf">${oppF}</span><span class="ln">${opp}</span><span class="ls">${oppS}</span></div>${m.n ? `<span class="bk-pc-note">${m.n}</span>` : ''}`;
        c.appendChild(card);
    });
    });
}
function bkSwitch(y) {
    if (y === bkYear) return;
    const bw = document.getElementById('bk-bw'); bkHov = null; bw.style.opacity = 0;
    setTimeout(() => { bkYear = y; bkPills(); bkEdition(); bw.style.opacity = 1; }, 180);
}
document.addEventListener('DOMContentLoaded', () => {
    bkInit();
    window.addEventListener('resize', () => requestAnimationFrame(bkLines));
});
})();


/* =========================================================
    EVOLUÇÃO DAS BOLAS DA COPA DO MUNDO
   ========================================================= */
(function () {

  const BALLS = [
    { year: 2026, name: "Trionda Pro", img:"images/wc-ball-trionda-2026.png", panels: "orbita",desc: "Bola oficial da Copa do Mundo da FIFA 2026. O seu nome e design são inspirados na famosa 'ola' das arquibancadas e na união dos três países-sede: Estados Unidos, México e Canadá. Primeiro Mundial com 48 seleções.", host: "EUA/CAN/MEX" },
    { year: 2022, name: "Al Rihla", img:"https://digitalhub.fifa.com/transform/ce00eb6b-cee2-49df-aeaa-10d4a2e41316/FIFA-World-Cup-Qatar-2022-official-match-ball-Al-Rihla?&io=transform:fill,width:1024&quality=75", panels: "alrihla", desc: "20 painéis de diferentes formatos. Mais rápida da história em voo. Inspirada em barcos e arquitetura do Catar. Argentina tricampeã.", host: "Catar" },
    { year: 2018, name: "Telstar 18",img:"https://digitalhub.fifa.com/transform/07487a6b-1bd8-4850-8c99-239c8de73c65/2018-FIFA-World-Cup-Russia-official-match-ball-Telstar-18?&io=transform:fill,width:1024&quality=75",  panels: "telstar18", desc: "Homenagem ao Telstar original de 1970 com design de pixels digitais em P&B. Primeira bola com chip NFC. França bicampeã.", host: "Rússia" },
    { year: 2014, name: "Brazuca", img:"https://digitalhub.fifa.com/transform/f3c744d4-b4c0-403d-a461-6fc9fba7f494/2014-FIFA-World-Cup-Brazil-official-match-ball-Brazuca?&io=transform:fill,width:1024&quality=75",   panels: "brazuca", desc: "6 painéis em forma de hélice, a bola mais testada da história (600 pessoas, 3 anos de testes). Cores do Brasil. Alemanha e campeã.", host: "Brasil" },
    { year: 2010, name: "Jabulani", img:"https://digitalhub.fifa.com/transform/d75d71cf-892a-4547-86d4-143a31fdc3bf/2010-FIFA-World-Cup-South-Africa-official-match-ball-Jabulani?&io=transform:fill,width:1024&quality=75",  panels: "jabulani", desc: "8 painéis em forma de propelina, termocolados. Muito criticada por trajetória instável ('efeito borboleta'). VUVUZELA, WAKA WAKA e o PRIMEIRO TÍTULO ESPANHOL.", host: "África do Sul" },
    { year: 2006, name: "Teamgeist", img:"https://digitalhub.fifa.com/transform/44bb6dab-2512-479c-a5c0-8fe78bc1ff2e/2006-FIFA-World-Cup-Germany-official-match-ball-Teamgeist?&io=transform:fill,width:1024&quality=75",  panels: "teamgeist", desc: "Apenas 14 painéis termocolados (sem costura), inspirado no movimento de hélice. Mais esférica da história até então. Itália campeã, Zidane dá uma cabeçada.", host: "Alemanha" },
    { year: 2002, name: "Fevernova", img:"https://digitalhub.fifa.com/transform/a557b04b-09ac-447f-91de-238828bd4435/2002-FIFA-World-Cup-Japan-South-Korea-official-match-ball-Fevernova?&io=transform:fill,width:1024&quality=75", panels: "fevernova", desc: "Design em ondas laranja, vermelhas e douradas inspirado em motivos asiáticos. Criticada pelos goleiros por trajetória imprevisível. Brasil pentacampeão.", host: "Coreia/Japão" },
    { year: 1998, name: "Tricolore", img:"https://digitalhub.fifa.com/transform/bb2315eb-d08d-4af8-901a-bf58ad6a1b4d/1998-FIFA-World-Cup-France-official-match-ball-Tricolore?&io=transform:fill,width:1024&quality=75", panels: "tricolor", desc: "Primeira bola colorida (azul, vermelho, dourado) da Copa. Design multicolorido em homenagem à França. França campeã em casa.", host: "França" },
    { year: 1994, name: "Questra", img:"https://digitalhub.fifa.com/transform/aea4e93f-1250-43fb-8ec6-a206609f7857/1994-FIFA-World-Cup-USA-official-match-ball-Questra?&io=transform:fill,width:1024&quality=75",  panels: "questra", desc: "Design futurista em azul e branco, com espuma de polietileno. Mais rápida e responsiva. Brasil tetracampeão, Baggio perde o pênalti final.", host: "EUA" },
    { year: 1990, name: "Etrusco Unico", img:"https://digitalhub.fifa.com/transform/a867e037-8b0e-40d8-9e6a-5bbdc6fbe783/1990-FIFA-World-Cup-Italy-official-match-ball-Etrusco-Unico?&io=transform:fill,width:1024&quality=75", panels: "azteca", desc: "Decoração inspirada na arte etrusca italiana. Primeira bola com núcleo de polibutadieno para maior precisão. Alemanha campeã.", host: "Itália" },
    { year: 1986, name: "Azteca", img:"https://digitalhub.fifa.com/transform/4adf2e7b-14f8-4679-82fe-f2c5687188c1/1986-FIFA-World-Cup-Mexico-official-match-ball-Azteca?&io=transform:fill,width:1024&quality=75",  panels: "azteca", desc: "Primeira bola sintética (poliuretano) da Copa. Padrão inspirado em mosaicos astecas. Copa do México — mão de Deus e gol do século de Maradona.", host: "México" },
    { year: 1982, name: "Tango España", img:"https://digitalhub.fifa.com/transform/3b256e13-51c8-4b7f-bd9c-91dcabf0ab3f/1982-FIFA-World-Cup-Spain-official-match-ball-Tango-Espana?&io=transform:fill,width:1024&quality=75",  panels: "tango", desc: "Primeira bola impermeável da Copa, com revestimento especial. Manteve o design Tango. Copa da Espanha, Itália tricampeã.", host: "Espanha" },
    { year: 1978, name: "Tango River Plate", img:"https://digitalhub.fifa.com/transform/4123c86e-0a7c-48b3-a815-3d7fb07d7566/1978-FIFA-World-Cup-Argentina-official-match-ball-Tango?&io=transform:fill,width:1024&quality=75",  panels: "tango", desc: "Primeira Tango: 20 círculos com triângulos curvos criam a ilusão de 12 faces esféricas. Padrão clássico que durou décadas. Argentina campeã em casa.", host: "Argentina" },
    { year: 1974, name: "Telstar Durlast", img:"https://digitalhub.fifa.com/transform/d749f413-b26b-4317-813b-69bff3fd4a10/1974-FIFA-World-Cup-West-Germany-official-match-ball-Telstar-Durlast?&io=transform:fill,width:1024&quality=75", panels: "telstar", desc: "Versão aprimorada do Telstar, com revestimento Durlast mais durável e resistente à água. Alemanha Ocidental campeã.", host: "Alemanha Occ." },
    { year: 1970, name: "Telstar", img:"https://digitalhub.fifa.com/transform/247cbf49-feea-4219-a382-2f7a9e61c1e1/1970-FIFA-World-Cup-Mexico-official-match-ball-Telstar?&io=transform:fill,width:1024&quality=75", panels: "telstar", desc: "Ícone absoluto: a primeira bola branca com 32 painéis pretos e brancos (12 pentágonos pretos + 20 hexágonos brancos). Adidas estreia na Copa. Pelé ergue a taça.", host: "México" },
    { year: 1966, name: "Challenge 4-Star", img:"https://digitalhub.fifa.com/transform/0e323528-f3e2-4888-8ea0-9aebba14d08a/1966-FIFA-World-Cup-official-match-ball-Challenge-4-Star?&io=transform:fill,width:1024&quality=75",panels: "classic", desc: "Única bola vermelha-alaranjada da história da Copa. Copa da Inglaterra, onde o país-sede venceu o único título.", host: "Inglaterra" },
    { year: 1962, name: "Crack", img:"https://digitalhub.fifa.com/transform/9cc7554d-17bd-47f5-8cc3-aac62a4b1c80/1962-FIFA-World-Cup-Chile-official-match-ball-Crack?&io=transform:fill,width:1024&quality=75",panels: "classic", desc: "Bola amarela-dourada, produzida no Chile. A Copa foi marcada pela falta de Pelé lesionado, e pelo Brasil bicampeão.", host: "Chile" },
    { year: 1958, name: "Top Star", img:"https://digitalhub.fifa.com/transform/208d1c9d-5934-4e30-95ce-ea8ad962d05c/1958-FIFA-World-Cup-Sweden-official-match-ball-Top-Star?&io=transform:fill,width:1024&quality=75", panels: "classic", desc: "Bola dourada amarela, muito mais consistente em forma. Copa da Suécia, onde Pelé brilhou com 17 anos.", host: "Suécia" },
    { year: 1954, name: "Swiss WC", img:"images/wc-ball-swiss_world_champion-1954.png",panels: "classic", desc: "Bola dourada brilhante, a mais redonda até então. Introduziu painéis hexagonais mais regulares, usada na Copa da Suíça.", host: "Suíça" },
    { year: 1950, name: "Super Duplo T", img:"https://digitalhub.fifa.com/transform/9bfc026e-7c07-434c-80e3-f4602369b726/1950-FIFA-World-Cup-Brazil-match-ball-Duplo-T?&io=transform:fill,width:1024&quality=75",panels: "leather", desc: "Bola usada na Copa do Mundo no Brasil, com painéis de couro mais claros. Famosa pelo 'Maracanazo' - derrota do Brasil para o Uruguai.", host: "Brasil" },
    { year: 1938, name: "Allen", img:"https://digitalhub.fifa.com/transform/23ca6174-13b7-4fc2-8178-bd5d268a6f14/1938-FIFA-World-Cup-Italy-Allen-official-match-ball?&io=transform:fill,width:1024&quality=75",  panels: "leather", desc: "Primeira bola a ter uma câmara de ar de borracha. Painéis de couro dourado escuro, usada na Copa da França.", host: "França" },
    { year: 1934, name: "Federale 102", img:"https://digitalhub.fifa.com/transform/15101f27-81d2-48b2-a1ca-0f42f58bf7e9/1934-FIFA-World-Cup-Italy-Federale-102-match-ball?&io=transform:fill,width:1024&quality=75", panels: "leather", desc: "Bola italiana de couro marrom-alaranjado, mais redonda que a de 1930, com 13 painéis costurados manualmente.", host: "Itália" },
    { year: 1930, name: "T-Model / Tiento", img:"https://digitalhub.fifa.com/transform/30cbf02a-9e51-457f-8169-a30a2eeea3ce/FIFA-World-Cup-Uruguay-1930-ball-T-model?&io=transform:fill,width:1024&quality=75", panels: "leather", desc: "Bola de couro tradicional com painéis costurados. Cada time trouxe sua própria bola; a Argentina jogou o primeiro tempo com a sua, o Uruguai o segundo com a deles.", host: "Uruguai" }
];
  

  let selectedYear = 2026; 
  function renderBalls() {
    const grid = document.getElementById('balls-grid');
    if (!grid) return;

    BALLS.forEach((ball) => {
      const card = document.createElement('div');
      card.className = 'ball-card';
      card.style.width = '90px';
      card.style.textAlign = 'center';
      card.style.cursor = 'pointer';

      const img = document.createElement('img');
      // img.src = `images/ball/wc-ball-${ball.year}.png`;
      img.src = ball.img;
      img.alt = ball.name;
      img.style.width = '72px';
      img.style.height = '72px';
      img.style.objectFit = 'contain';

      const yearEl = document.createElement('div');
      yearEl.textContent = ball.year;
      yearEl.style.fontSize = '12px';
      yearEl.style.fontWeight = '700';

      const nameEl = document.createElement('div');
      nameEl.textContent = ball.name;
      nameEl.style.fontSize = '11px';

      card.appendChild(img);
      card.appendChild(yearEl);
      card.appendChild(nameEl);

      card.addEventListener('click', () => {
        document.querySelectorAll('.ball-card').forEach(c => c.classList.remove('ball-selected'));
        showBallDetail(ball);
      });

      // card.addEventListener('mouseenter', () => {
      //   document.querySelectorAll('.ball-card').forEach(c => c.classList.remove('ball-selected'));
      //   card.classList.add('ball-selected');
      //   showBallDetail(ball);
      // });

      grid.appendChild(card);
    });

    const detailDiv = document.createElement('div');
    detailDiv.id = 'ball-detail';
    // detailDiv.style.cssText =
    //   'display:none;background:#f7f9fc;border:1.5px solid #e8edf4;border-radius:8px;padding:20px;margin-top:20px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;';

    document.getElementById('balls-container').appendChild(detailDiv);

    const defaultBall = BALLS.find(b => b.year === selectedYear);
    if (defaultBall) {
      showBallDetail(defaultBall);
    }    
  }

  function showBallDetail(ball) {
    const d = document.getElementById('ball-detail');
    d.innerHTML = '';
    d.style.display = 'flex';

    const img = document.createElement('img');
    img.src = ball.img;
    img.style.width = '120px';
    img.style.height = '120px';
    img.style.objectFit = 'contain';
    img.style.flexShrink = '0'; 

    const info = document.createElement('div');
    info.style.flex = '1'; 

    info.innerHTML = `
      <div style="font-size:20px;font-weight:900;color:#1a5276;">
        ${ball.year} — ${ball.name}
      </div>
      <div style="font-size:12px;color:#c9940a;margin-bottom:10px;">
        🏟️ ${ball.host}
      </div>
      <div style="font-size:13px;color:#444;">
        ${ball.desc}
      </div>
    `;

    d.appendChild(img);
    d.appendChild(info);
  }

  document.addEventListener('DOMContentLoaded', renderBalls);

})();


/* =========================================================
  CAMISAS DA SELEÇÃO BRASILEIRA
========================================================= */
(function () {

  const SHIRTS = [
      {
      year: 1930, era: '1930-1950', img:"https://images.tcdn.com.br/img/img_prod/311840/camisa_brasil_1930_retro_branca_50832_1_20201130180836.jpg",
        desc: 'Camisa branca com gola em V. O Brasil usava branco antes do amarelo se tornar padrão, após o trauma de 1950.', kit: 'away'
      },
      {
        year: 1938, era: '1930-1950', img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQC81mJb9ExZpDbD_AlrlNd7kzBzzrxrH7Law&s",
        desc: 'Camisa branca com detalhes verdes. Copa da França — Brasil ficou em 3º lugar, com Leônidas artilheiro.', kit: 'away'
      },
      {
        year: 1950, era: '1930-1950', img:"https://cdn.awsli.com.br/1166/1166432/produto/44805095/b5d11169b2.jpg",
        desc: 'Camisa branca — o Brasil perdeu a final (Maracanazo) com essa camisa. Foi o trauma que levou à adoção do amarelo.', kit: 'away'
      },
      {
        year: 1954, era: '1954-1965', img:"https://www.tetereinaldim.com.br/wp-content/uploads/2014/06/Camisa-do-Brasil-de-1954.jpg",
        desc: 'Primeira vez com amarelo! A nova camisa, desenhada pelo artista Aldyr Garcia Schlee, surge após o trauma de 1950.', kit: 'home'
      },
      {
        year: 1958, era: '1954-1965', img:"https://cdn.awsli.com.br/2500x2500/1166/1166432/produto/44826973/f4fc1e472d.jpg",
        desc: 'Com a camisa amarela, Pelé com 17 anos marca seu primeiro gol na Copa. Brasil bicampeão na Suécia.', kit: 'home'
      },
      {
        year: 1962, era: '1954-1965', img:"https://cdn.awsli.com.br/600x450/1166/1166432/produto/44803145/0cdf8fae63.jpg",
        desc: 'Brasil tricampeão no Chile. Garrincha assume o protagonismo após lesão de Pelé na fase de grupos.', kit: 'home'
      },
      {
        year: 1966, era: '1954-1965', img:"https://http2.mlstatic.com/D_NQ_NP_698094-MLB96522843993_102025-O-camisa-seleco-brasileira-1966-retro-original-athleta.webp",
        desc: 'Eliminação precoce na fase de grupos pela primeira vez. Pelé sofre muitas faltas e jura não jogar mais Copas.', kit: 'home'
      },
      {
        year: 1970, era: '1970-1982', img:"https://http2.mlstatic.com/D_NQ_NP_2X_770749-MLB88871631525_072025-F-camisa-brasil-retr-1970-amarela-e-verde.webp",
        desc: 'Camisa com gola V, considerada o melhor time da história. Pelé, Jairzinho, Tostão — tetracampeão! Número 10 icônico.', kit: 'home'
      },
      {
        year: 1974, era: '1970-1982', img:"https://cdn.awsli.com.br/600x450/1166/1166432/produto/44803823/72d39125d8.jpg",
        desc: 'Geração pós-1970, 4º lugar. Rivelino e Zico presentes. Camisa com gola V ajustada.', kit: 'home'
      },
      {
        year: 1978, era: '1970-1982', img:"images/shirts/wc-shirt-1978.png",
        desc: 'Brasil fica em 3º lugar, invicto no torneio. Zico, Rivellino, Roberto Dinamite. Controverso 3x0 sobre Polônia.', kit: 'home'
      },
      {
        year: 1982, era: '1970-1982', img:"images/shirts/wc-shirt-1982.png",
        desc: 'A camisa mais amada da história do Brasil! Listras verdes nas mangas. Seleção de Zico, Sócrates, Falcão — eliminada pela Itália de Rossi.', kit: 'home'
      },
      {
        year: 1986, era: '1986-1994', img:"https://minasretro.com.br/wp-content/uploads/2023/04/brasil86.jpg",
        desc: 'Listras verdes finas nas mangas. Eliminados pela França nos pênaltis. Zico perde o pênalti. Sócrates também.', kit: 'home'
      },
      {
        year: 1990, era: '1986-1994',   img:"images/shirts/wc-shirt-1990.png",
        desc: 'Camisa com listras verdes nas mangas. Eliminados pela Argentina de Maradona no jogo que ficou famoso pelo gol de Caniggia.', kit: 'home'
      },
      {
        year: 1994, era: '1986-1994',   img:"images/shirts/wc-shirt-1994.png",
        desc: 'Tetracampeão! Romário e Bebeto. Baggio perde o pênalti. Copa dos EUA. Camisa com detalhes verdes nas mangas e ombros.', kit: 'home'
      },
      {
        year: 1998, era: '1998-2006',   img:"images/shirts/wc-shirt-1998.png",
        desc: 'Camisa com detalhe azul. Vice-campeão — Brasil perde a final para a França. Ronaldo joga doente — o episódio do desmaio.', kit: 'home'
      },
      {
        year: 2002, era: '1998-2006',   img:"images/shirts/wc-shirt-2002.png",
        desc: 'PENTACAMPEÃO! Ronaldo ressurge, marca 8 gols. Ronaldinho, Rivaldo. Camisa sem gola, com detalhe verde.', kit: 'home'
      },
      {
        year: 2006, era: '1998-2006', img:"images/shirts/wc-shirt-2006.png",
        desc: 'Eliminados pela França nas quartas. Ronaldo iguala o recorde de Gerd Müller. Camisa mais simples, sem detalhes.', kit: 'home'
      },
      {
        year: 2010, era: '2010-2018', img:"images/shirts/wc-shirt-2010.png",
        desc: 'Eliminados pela Holanda nas quartas. Robinho, Kaká. Camisa com ombros verdes e faixa central.', kit: 'home'
      },
      {
        year: 2014, era: '2010-2018', img:"images/shirts/wc-shirt-2014.png",
        desc: 'Eliminação dolorosa: 7x1 para a Alemanha. Neymar se machuca nas quartas. 4º lugar em casa. Camisa com faixas diagonais.', kit: 'home'
      },
      {
        year: 2018, era: '2010-2018', img:"images/shirts/wc-shirt-2018.png",
        desc: 'Eliminados pela Bélgica nas quartas. Neymar lidera a equipe. Camisa com detalhes azuis e verde nas laterais.', kit: 'home'
      },
      {
        year: 2022, era: '2022-2026', img:"images/shirts/wc-shirt-2022.png",
        desc: 'Eliminados pela Croácia nas quartas (pênaltis). Neymar marca gol olímpico. Copa do Catar. Camisa com trama especial amarela e verde.', kit: 'home'
      },
      {
        year: 2026, era: '2022-2026', img:"images/shirts/wc-shirt-2026.png",
        desc: 'Copa do Mundo nos EUA, México e Canadá. Primeira Copa com 48 seleções. A busca pelo hexacampeonato.', kit: 'home'
      },
    ];

  let selectedYear = 2026;

  const SHIRTS_DESC = [...SHIRTS].sort((a, b) => b.year - a.year);

  function renderShirts() {
    const filterDiv = document.getElementById('shirt-filter');
    const eras = [...new Set(SHIRTS_DESC.map(s => s.era))];

    // BOTÃO TODAS
    const allBtn = document.createElement('button');
    allBtn.textContent = 'Todas';
    allBtn.className = 'era-pill active';
    allBtn.onclick = () => {
      setActive(filterDiv, allBtn);
      renderGrid(SHIRTS_DESC);
    };
    filterDiv.appendChild(allBtn);

    // ERAS
    eras.forEach(era => {
      const btn = document.createElement('button');
      btn.textContent = era;
      btn.className = 'era-pill';

      btn.onclick = () => {
        setActive(filterDiv, btn);
        renderGrid(SHIRTS.filter(s => s.era === era));
      };

      filterDiv.appendChild(btn);
    });

    renderGrid(SHIRTS_DESC);
    showShirtDetail(SHIRTS_DESC.find(s => s.year === selectedYear));
  }

  function setActive(parent, el) {
    parent.querySelectorAll('.era-pill').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
  }

  function renderGrid(shirts) {
    const grid = document.getElementById('shirts-grid');
    grid.innerHTML = '';

    shirts.forEach(shirt => {
      const card = document.createElement('div');
      card.className = 'shirt-thumb' + (shirt.year === selectedYear ? ' shirt-selected' : '');

      const img = document.createElement('img');
      img.src = shirt.img
      const year = document.createElement('div');
      year.className = 'shirt-thumb-year';
      year.textContent = shirt.year;

      card.appendChild(img);
      card.appendChild(year);

      // //  HOVER (mostra detalhe)
      // card.addEventListener('mouseenter', () => {
      //   showShirtDetail(shirt);
      // });

      //  CLICK (fixa seleção)
      card.addEventListener('click', () => {
        selectedYear = shirt.year;

        document.querySelectorAll('.shirt-thumb')
          .forEach(c => c.classList.remove('shirt-selected'));

        card.classList.add('shirt-selected');
        showShirtDetail(shirt);
      });

      

      grid.appendChild(card);
    });
  }

  function showShirtDetail(shirt) {
    const d = document.getElementById('shirt-detail');
    d.innerHTML = '';

    const img = document.createElement('img');
    img.src = shirt.img;
    img.style.width = '140px';
    img.style.objectFit = 'contain';
    img.style.flexShrink = '0';

    const info = document.createElement('div');
    info.style.flex = '1';

    info.innerHTML = `
      <div style="font-size:22px;font-weight:900;color:#009c3b;">
        ${shirt.year}
      </div>

      <div style="font-size:12px;margin:10px 0;color:#666;">
        🇧🇷 Seleção Brasileira
      </div>

      <div style="font-size:14px;color:#444;">
        ${shirt.desc}
      </div>
    `;

    d.appendChild(img);
    d.appendChild(info);
  }

  document.addEventListener('DOMContentLoaded', renderShirts);

})();