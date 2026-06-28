/* =========================
   DADOS — Copa do Mundo FIFA
   Atualizado até 2022 (80 seleções)
   Fonte: FIFA / Wikipédia
========================= */
const countries = [

/* ── CAMPEÕES ── */

{
  name: "Brazil",
  Selecao: "Brasil",
  campanha: "Campeão",
  aparicoes: 22,
  continente: "América do Sul",
  anos: "1958, 1962, 1970, 1994, 2002"
},
{
  name: "Germany",
  Selecao: "Alemanha",
  campanha: "Campeão",
  aparicoes: 20,
  continente: "Europa",
  anos: "1954, 1974, 1990, 2014"
},
{
  name: "Italy",
  Selecao: "Itália",
  campanha: "Campeão",
  aparicoes: 18,
  continente: "Europa",
  anos: "1934, 1938, 1982, 2006"
},
{
  name: "Argentina",
  Selecao: "Argentina",
  campanha: "Campeão",
  aparicoes: 18,
  continente: "América do Sul",
  anos: "1978, 1986, 2022"
},
{
  name: "France",
  Selecao: "França",
  campanha: "Campeão",
  aparicoes: 16,
  continente: "Europa",
  anos: "1998, 2018"
},
{
  name: "England",
  Selecao: "Inglaterra",
  campanha: "Campeão",
  aparicoes: 16,
  continente: "Europa",
  anos: "1966"
},


{
  name: "Spain",
  Selecao: "Espanha",
  campanha: "Campeão",
  aparicoes: 16,
  continente: "Europa",
  anos: "2010"
},
{
  name: "Uruguay",
  Selecao: "Uruguai",
  campanha: "Campeão",
  aparicoes: 14,
  continente: "América do Sul",
  anos: "1930, 1950"
},

/* ── VICE-CAMPEÕES ── */

{
  name: "Netherlands",
  Selecao: "Holanda",
  campanha: "Vice-campeão",
  aparicoes: 11,
  continente: "Europa",
  anos: "1974, 1978, 2010"
},
{
  name: "Czech Republic",
  Selecao: "Rep. Tcheca / Tchecoslováquia",
  campanha: "Vice-campeão",
  aparicoes: 9,
  continente: "Europa",
  anos: "1934, 1962 (Tchecoslováquia)"
},
{
  name: "Hungary",
  Selecao: "Hungria",
  campanha: "Vice-campeão",
  aparicoes: 9,
  continente: "Europa",
  anos: "1938, 1954"
},
{
  name: "Sweden",
  Selecao: "Suécia",
  campanha: "Vice-campeão",
  aparicoes: 12,
  continente: "Europa",
  anos: "1958"
},
{
  name: "Croatia",
  Selecao: "Croácia",
  campanha: "Vice-campeão",
  aparicoes: 6,
  continente: "Europa",
  anos: "2018 (vice), 2022 (3°)"
},

/* ── SEMIFINAL / 3° e 4° LUGAR ── */

{
  name: "Belgium",
  Selecao: "Bélgica",
  campanha: "Semifinal",
  aparicoes: 14,
  continente: "Europa",
  anos: "2018 (3°)"
},
{
  name: "Poland",
  Selecao: "Polônia",
  campanha: "Semifinal",
  aparicoes: 9,
  continente: "Europa",
  anos: "1974, 1982 (3°)"
},
{
  name: "Portugal",
  Selecao: "Portugal",
  campanha: "Semifinal",
  aparicoes: 8,
  continente: "Europa",
  anos: "1966 (3°)"
},
{
  name: "United States of America",
  Selecao: "Estados Unidos",
  campanha: "Semifinal",
  aparicoes: 11,
  continente: "América do Norte",
  anos: "1930 (3°)"
},
{
  name: "Chile",
  Selecao: "Chile",
  campanha: "Semifinal",
  aparicoes: 9,
  continente: "América do Sul",
  anos: "1962 (3°)"
},
{
  name: "Austria",
  Selecao: "Áustria",
  campanha: "Semifinal",
  aparicoes: 7,
  continente: "Europa",
  anos: "1954 (3°)"
},
{
  name: "Turkey",
  Selecao: "Turquia",
  campanha: "Semifinal",
  aparicoes: 2,
  continente: "Europa / Ásia",
  anos: "2002 (3°)"
},
{
  /* FIFA considera Sérvia sucessora da Iugoslávia */
  name: "Serbia",
  Selecao: "Sérvia / Iugoslávia",
  campanha: "Semifinal",
  aparicoes: 13,
  continente: "Europa",
  anos: "1930, 1962 (Iugoslávia, 4°)"
},
{
  /* FIFA considera Rússia sucessora da URSS */
  name: "Russia",
  Selecao: "Rússia / URSS",
  campanha: "Semifinal",
  aparicoes: 11,
  continente: "Europa",
  anos: "1966 (URSS, 4°)"
},
{
  name: "Bulgaria",
  Selecao: "Bulgária",
  campanha: "Semifinal",
  aparicoes: 7,
  continente: "Europa",
  anos: "1994 (4°)"
},
{
  name: "South Korea",
  Selecao: "Coreia do Sul",
  campanha: "Semifinal",
  aparicoes: 11,
  continente: "Ásia",
  anos: "2002 (4°)"
},
{
  name: "Morocco",
  Selecao: "Marrocos",
  campanha: "Semifinal",
  aparicoes: 6,
  continente: "África",
  anos: "2022 (4°)"
},

/* ── QUARTAS DE FINAL ── */
// UK
{ name: "Wales",
  Selecao: "País de Gales",
  campanha: "Quartas de Final",
  aparicoes: 2,
  continente: "Europa",
  anos: "1958"
},
{ name: "Northern Ireland",
  Selecao: "Irlanda do Norte",
  campanha: "Quartas de Final",
  aparicoes: 3,
  continente: "Europa",
  anos: "1958"
},
{
  name: "Mexico",
  Selecao: "México",
  campanha: "Quartas de Final",
  aparicoes: 17,
  continente: "América do Norte",
  anos: "1970, 1986"
},
{
  name: "Romania",
  Selecao: "Romênia",
  campanha: "Quartas de Final",
  aparicoes: 8,
  continente: "Europa",
  anos: "1994"
},
{
  name: "Cameroon",
  Selecao: "Camarões",
  campanha: "Quartas de Final",
  aparicoes: 8,
  continente: "África",
  anos: "1990"
},
{
  name: "Switzerland",
  Selecao: "Suíça",
  campanha: "Quartas de Final",
  aparicoes: 12,
  continente: "Europa",
  anos: "1934, 1938, 1954"
},
{
  name: "Ireland",
  Selecao: "Irlanda",
  campanha: "Quartas de Final",
  aparicoes: 3,
  continente: "Europa",
  anos: "1990"
},
{
  name: "North Korea",
  Selecao: "Coreia do Norte",
  campanha: "Quartas de Final",
  aparicoes: 2,
  continente: "Ásia",
  anos: "1966"
},
{
  name: "Denmark",
  Selecao: "Dinamarca",
  campanha: "Quartas de Final",
  aparicoes: 6,
  continente: "Europa",
  anos: "1998"
},
{
  name: "Ghana",
  Selecao: "Gana",
  campanha: "Quartas de Final",
  aparicoes: 4,
  continente: "África",
  anos: "2010"
},
{
  name: "Senegal",
  Selecao: "Senegal",
  campanha: "Quartas de Final",
  aparicoes: 3,
  continente: "África",
  anos: "2002"
},
{
  name: "Colombia",
  Selecao: "Colômbia",
  campanha: "Quartas de Final",
  aparicoes: 6,
  continente: "América do Sul",
  anos: "2014"
},
{
  name: "Costa Rica",
  Selecao: "Costa Rica",
  campanha: "Quartas de Final",
  aparicoes: 5,
  continente: "América Central",
  anos: "2014"
},
{
  name: "Peru",
  Selecao: "Peru",
  campanha: "Quartas de Final",
  aparicoes: 5,
  continente: "América do Sul",
  anos: "1970, 1978"
},
{
  name: "Ukraine",
  Selecao: "Ucrânia",
  campanha: "Quartas de Final",
  aparicoes: 1,
  continente: "Europa",
  anos: "2006"
},
{
  name: "Paraguay",
  Selecao: "Paraguai",
  campanha: "Quartas de Final",
  aparicoes: 8,
  continente: "América do Sul",
  anos: "2010"
},
{
  name: "Cuba",
  Selecao: "Cuba",
  campanha: "Quartas de Final",
  aparicoes: 1,
  continente: "América Central / Caribe",
  anos: "1938"
},

/* ── OITAVAS DE FINAL ── */

{
  name: "Japan",
  Selecao: "Japão",
  campanha: "Oitavas de Final",
  aparicoes: 7,
  continente: "Ásia",
  anos: "2002, 2010, 2018, 2022"
},
{
  name: "Nigeria",
  Selecao: "Nigéria",
  campanha: "Oitavas de Final",
  aparicoes: 6,
  continente: "África",
  anos: "1994, 1998, 2014"
},
{
  name: "Australia",
  Selecao: "Austrália",
  campanha: "Oitavas de Final",
  aparicoes: 6,
  continente: "Oceania",
  anos: "2006, 2022"
},
{
  name: "Algeria",
  Selecao: "Argélia",
  campanha: "Oitavas de Final",
  aparicoes: 4,
  continente: "África",
  anos: "2014"
},
{
  name: "Saudi Arabia",
  Selecao: "Arábia Saudita",
  campanha: "Oitavas de Final",
  aparicoes: 6,
  continente: "Ásia",
  anos: "1994"
},
{
  name: "Ecuador",
  Selecao: "Equador",
  campanha: "Oitavas de Final",
  aparicoes: 4,
  continente: "América do Sul",
  anos: "2006"
},
{
  /* R16 em 1938 (formato eliminatório) e 1998 */
  name: "Norway",
  Selecao: "Noruega",
  campanha: "Oitavas de Final",
  aparicoes: 3,
  continente: "Europa",
  anos: "1938, 1998"
},
{
  name: "Greece",
  Selecao: "Grécia",
  campanha: "Oitavas de Final",
  aparicoes: 3,
  continente: "Europa",
  anos: "2014"
},
{
  name: "Slovakia",
  Selecao: "Eslováquia",
  campanha: "Oitavas de Final",
  aparicoes: 1,
  continente: "Europa",
  anos: "2010"
},

/* ── FASE DE GRUPOS ── */

{
  name: "Scotland",
  Selecao: "Escócia",
  campanha: "Fase de Grupos",
  aparicoes: 8,
  continente: "Europa",
  anos: "1954, 1958, 1974, 1978, 1982, 1986, 1990, 1998"
},
{
  name: "Bolivia",
  Selecao: "Bolívia",
  campanha: "Fase de Grupos",
  aparicoes: 3,
  continente: "América do Sul",
  anos: "1930, 1950, 1994"
},
{
  name: "Bosnia and Herzegovina",
  Selecao: "Bósnia e Herzegovina",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "Europa",
  anos: "2014"
},
{
  name: "Canada",
  Selecao: "Canadá",
  campanha: "Fase de Grupos",
  aparicoes: 2,
  continente: "América do Norte",
  anos: "1986, 2022"
},
{
  name: "China",
  Selecao: "China",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "Ásia",
  anos: "2002"
},
{
  /* Competiu como Zaire em 1974; atualmente RD Congo */
  name: "Democratic Republic of the Congo",
  Selecao: "Zaire / R.D. Congo",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "África",
  anos: "1974 (Zaire)"
},
{
  name: "Egypt",
  Selecao: "Egito",
  campanha: "Fase de Grupos",
  aparicoes: 3,
  continente: "África",
  anos: "1934, 1990, 2018"
},
{
  name: "El Salvador",
  Selecao: "El Salvador",
  campanha: "Fase de Grupos",
  aparicoes: 2,
  continente: "América Central",
  anos: "1970, 1982"
},
{
  name: "Haiti",
  Selecao: "Haiti",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "América Central / Caribe",
  anos: "1974"
},
{
  name: "Honduras",
  Selecao: "Honduras",
  campanha: "Fase de Grupos",
  aparicoes: 3,
  continente: "América Central",
  anos: "1982, 2010, 2014"
},
{
  name: "Iceland",
  Selecao: "Islândia",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "Europa",
  anos: "2018"
},
{
  /* Classificou-se mas desistiu antes de jogar */
  name: "India",
  Selecao: "Índia",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "Ásia",
  anos: "1950 (desistiu)"
},
{
  /* Competiu como Índias Orientais Holandesas em 1938 */
  name: "Indonesia",
  Selecao: "Indonésia",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "Ásia",
  anos: "1938 (Índias Orientais Holandesas)"
},
{
  name: "Iran",
  Selecao: "Irã",
  campanha: "Fase de Grupos",
  aparicoes: 6,
  continente: "Ásia",
  anos: "1978, 1998, 2006, 2014, 2018, 2022"
},
{
  name: "Iraq",
  Selecao: "Iraque",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "Ásia",
  anos: "1986"
},
{
  name: "Israel",
  Selecao: "Israel",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "Ásia",
  anos: "1970"
},
{
  name: "Ivory Coast",
  Selecao: "Costa do Marfim",
  campanha: "Fase de Grupos",
  aparicoes: 3,
  continente: "África",
  anos: "2006, 2010, 2014"
},
{
  name: "Jamaica",
  Selecao: "Jamaica",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "América Central / Caribe",
  anos: "1998"
},
{
  name: "Kuwait",
  Selecao: "Kuwait",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "Ásia",
  anos: "1982"
},
{
  name: "New Zealand",
  Selecao: "Nova Zelândia",
  campanha: "Fase de Grupos",
  aparicoes: 2,
  continente: "Oceania",
  anos: "1982, 2010"
},
{
  name: "Panama",
  Selecao: "Panamá",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "América Central",
  anos: "2018"
},
{
  name: "Qatar",
  Selecao: "Catar",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "Ásia",
  anos: "2022"
},
{
  name: "Slovenia",
  Selecao: "Eslovênia",
  campanha: "Fase de Grupos",
  aparicoes: 2,
  continente: "Europa",
  anos: "2002, 2010"
},
{
  name: "South Africa",
  Selecao: "África do Sul",
  campanha: "Fase de Grupos",
  aparicoes: 3,
  continente: "África",
  anos: "1998, 2002, 2010"
},
{
  name: "Togo",
  Selecao: "Togo",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "África",
  anos: "2006"
},
{
  name: "Trinidad and Tobago",
  Selecao: "Trinidad e Tobago",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "América do Sul / Caribe",
  anos: "2006"
},
{
  name: "Tunisia",
  Selecao: "Tunísia",
  campanha: "Fase de Grupos",
  aparicoes: 6,
  continente: "África",
  anos: "1978, 1998, 2002, 2006, 2018, 2022"
},
{
  name: "Angola",
  Selecao: "Angola",
  campanha: "Fase de Grupos",
  aparicoes: 1,
  continente: "África",
  anos: "2006"
}

];

/* =========================
   CORES
========================= */

function getColor(campanha) {
  switch (campanha) {
    case "Campeão":         return "#ffc45e";   /* âmbar dourado    */
    case "Vice-campeão":    return "#22c55e";   /* verde esmeralda  */
    case "Semifinal":       return "#f97316";   /* laranja          */
    case "Quartas de Final":return "#a855f7";   /* violeta          */
    case "Oitavas de Final":return "#3b82f6";   /* azul             */
    default:                return "#7f92aa";   /* cinza (grupos)   */
  }
}


/* =========================
   MAPA
========================= */

const map = L.map("map", {
  zoomControl: true,
  attributionControl: false,
  worldCopyJump: false,
  minZoom: 1.3,
  maxZoom: 5,
  maxBounds: [[-85, -180], [85, 180]],
  maxBoundsViscosity: 1.0,
  tap: true
}).setView([25, 20], 1.2);


/* =========================
   TILE LAYER (sem rótulos)
========================= */

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
  {
    subdomains: "abcd",
    maxZoom: 6,
    minZoom: 1,
    noWrap: true
  }
).addTo(map);


/* =========================
 (Natural Earth Map Units — UK já dividido)
========================= */

fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_map_units.geojson")
  .then(r => r.json())
  .then(world => {

    const geojson = L.geoJSON(world, {

      style: feature => {
        const found = countries.find(c => c.name === feature.properties.GEOUNIT);
        return {
          fillColor:   found ? getColor(found.campanha) : "#e2e8f0",
          weight:      0.6,
          opacity:     1,
          color:       "#ffffff",
          fillOpacity: found ? 0.92 : 0.7
        };
      },

      onEachFeature: (feature, layer) => {
        const found = countries.find(c => c.name === feature.properties.GEOUNIT);
        if (!found) return;

        const badgeColor = getColor(found.campanha);

        const isYellow = badgeColor === '#eca90d';

        const content = `
          <div style="font-family:'Segoe UI',sans-serif;font-size:11px;line-height:1.3;background:${badgeColor}15;padding:8px;border-radius:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid ${badgeColor}22;">
              <span style="font-weight:700;color:${isYellow ? '#78350f' : '#0f172a'}">${found.Selecao}</span>
              <span style="background:${badgeColor};color:#fff;padding:1px 6px;border-radius:10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;">${found.campanha}</span>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:10px;">
              <tr><td style="color:${isYellow ? '#92400e' : '#475569'}"> Ano(s) </td><td style="font-weight:600;text-align:right;color:#0f172a">${found.anos}</td></tr>
              <tr><td style="color:${isYellow ? '#92400e' : '#475569'}"> Participou </td><td style="font-weight:700;text-align:right;color:#0f172a">${found.aparicoes}×</td></tr>
              <tr><td style="color:${isYellow ? '#92400e' : '#475569'}"> Continente </td><td style="font-weight:600;text-align:right;color:#0f172a">${found.continente}</td></tr>
            </table>
          </div>
        `;


        layer.bindTooltip(content, {
          sticky: false,
          direction: "auto",
          opacity: 1,
          offset: [12, 0],
          className: "leaflet-tooltip-custom"
        });

        layer.on({
          mouseover: e => {
            const l = e.target;
            l.setStyle({
              weight: 2.5,
              color: "#1e293b",
              fillOpacity: 1
            });
            l.openTooltip();
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              l.bringToFront();
            }
          },
          mouseout: e => {
            const l = e.target;
            geojson.resetStyle(l);
            l.closeTooltip();
          }
        });
      }

    }).addTo(map);

    /* Fecha tooltip e reseta estilo durante navegação */
    map.on("dragstart zoomstart", () => {
      geojson.eachLayer(layer => {
        geojson.resetStyle(layer);
        if (layer.closeTooltip) layer.closeTooltip();
      });
    });

  });


/* =========================
   LEGENDA
========================= */

const legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
  const div = L.DomUtil.create("div", "legend");

  div.innerHTML = `
    <div class="legend-title">Melhor campanha</div>

    <div class="legend-item">
      <span class="legend-color" style="background:#f59e0b"></span>
      Campeão
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background:#22c55e"></span>
      Vice-campeão
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background:#f97316"></span>
      Semifinal (3° / 4°)
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background:#a855f7"></span>
      Quartas de Final
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background:#3b82f6"></span>
      Oitavas de Final
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background:#94a3b8"></span>
      Fase de Grupos
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background:#e2e8f0; border:1px solid #cbd5e1"></span>
      Nunca participou
    </div>
  `;

  return div;
};

legend.addTo(map);


// ----------------------------------------------
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

    if (value === "bola de ouro" || value === "golden ball") return "images/bola_de_ouro1.png";
    if (value === "bola de prata" || value === "silver ball") return "images/bola_de_prata1.png";
    if (value === "bola de bronze" || value === "bronze ball") return "images/bola_de_bronze1.png";

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
      "bola de ouro": 2,
      "bola de prata": 1,
      "bola de bronze": 3
    };
    return order[value] || 999;
  }

  function getProfileUrl(player) {
    const link = (player.wikipedia_profile_link || "").trim();
    return /^https?:\/\//i.test(link) ? link : "#";
  }

   function isMobileCardMode() {
    return window.matchMedia("(hover: none), (pointer: coarse)").matches;
  }

  function setupMobileFlipCards(container) {
    const cards = container.querySelectorAll(".flip-card");

    cards.forEach(card => {
      card.addEventListener("click", function (event) {
        if (!isMobileCardMode()) return;

        event.preventDefault();

        const wasFlipped = card.classList.contains("is-flipped");

        cards.forEach(otherCard => {
          otherCard.classList.remove("is-flipped");
        });

        if (!wasFlipped) {
          card.classList.add("is-flipped");
        }
      });
    });
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

    setupMobileFlipCards(container);
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



//  ESTATÍSTICAS e CHAVEAMENTO
const ISO_MAP = {
    'argentina':'ar','franca':'fr','alemanha':'de','italia':'it','espanha':'es',
    'brasil':'br','croacia':'hr','marrocos':'ma','paises baixos':'nl','portugal':'pt',
    'uruguai':'uy','belgica':'be','inglaterra':'gb-eng','japao':'jp','coreia do sul':'kr',
    'australia':'au','senegal':'sn','estados unidos':'us','polonia':'pl','suica':'ch',
    'dinamarca':'dk','russia':'ru','suecia':'se','colombia':'co','mexico':'mx',
    'argelia':'dz','nigeria':'ng','chile':'cl','costa rica':'cr','grecia':'gr',
    'gana':'gh','eslovaquia':'sk','paraguai':'py','ucrania':'ua','equador':'ec',
    'qatar':'qa','africa do sul':'za'
};
function norm(s){return String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');}
function getISO(name){return ISO_MAP[norm(name)]||'';}
function fi(code,w,h){if(!code)return '<span style="opacity:.2">—</span>';return `<img class="flag-img" src="https://flagcdn.com/w40/${code}.png" alt="" style="width:${w||18}px;height:${h||13}px;" onerror="this.style.display='none'">`;}

const wcTooltip=document.createElement('div');
wcTooltip.className='wc-tooltip';
document.body.appendChild(wcTooltip);

function getTitles(team){
    const key = norm(team);
    const t = WC_TITLES[key];
    const iso = getISO(team);

    const flag = iso
        ? `<img class="flag-img" src="https://flagcdn.com/w40/${iso}.png" alt="${team}" onerror="this.style.display='none'">`
        : '🏳️';

    let medals;

    if (!t || (!t.gold && !t.silver && !t.bronze)) {
        medals = `<div class="medals"><span class="med">Sem títulos / pódios</span></div>`;
    } else {
        medals = `
            <div class="medals">
                ${t.gold ? `<span class="med g">🏆 ${t.gold}×</span>` : ''}
                ${t.silver ? `<span class="med s">🥈 ${t.silver}×</span>` : ''}
                ${t.bronze ? `<span class="med b">🥉 ${t.bronze}×</span>` : ''}
            </div>
        `;
    }

    return `
        <div class="tt-h">
            <div class="tt-flag">${flag}</div>
            <div class="tt-name">${team}</div>
        </div>
        ${medals}
        <div class="tt-div"></div>
    `;
}

const ED={
    2022:{host:'Qatar',champion:'Argentina',runners_up:'França',third:'Croácia',fourth:'Marrocos',
    stats:{matches:64,goals:172,gpm:'2.69',att:'3.404.252',apm:'53.191'},
    awards:{topScorer:{name:'Kylian Mbappé',fc:'fr',goals:8},bestPlayer:{name:'Lionel Messi',fc:'ar'},bestYoung:{name:'Enzo Fernández',fc:'ar'},bestGK:{name:'Emiliano Martínez',fc:'ar'},fairPlay:{name:'Argentina',fc:'ar'}},
    thirdPlace:{a:'Croácia',af:'hr',as:2,b:'Marrocos',bf:'ma',bs:1,w:'a'},
    rounds:[
        [{a:'Países Baixos',af:'nl',as:3,b:'Estados Unidos',bf:'us',bs:1,w:'a'},{a:'Argentina',af:'ar',as:2,b:'Austrália',bf:'au',bs:1,w:'a'},{a:'Japão',af:'jp',as:1,b:'Croácia',bf:'hr',bs:1,w:'b',n:'pens'},{a:'Brasil',af:'br',as:4,b:'Coreia do Sul',bf:'kr',bs:1,w:'a'},{a:'França',af:'fr',as:3,b:'Polônia',bf:'pl',bs:1,w:'a'},{a:'Inglaterra',af:'gb-eng',as:3,b:'Senegal',bf:'sn',bs:0,w:'a'},{a:'Marrocos',af:'ma',as:0,b:'Espanha',bf:'es',bs:0,w:'a',n:'pens'},{a:'Portugal',af:'pt',as:6,b:'Suíça',bf:'ch',bs:1,w:'a'}],
        [{a:'Países Baixos',af:'nl',as:2,b:'Argentina',bf:'ar',bs:2,w:'b',n:'pens'},{a:'Croácia',af:'hr',as:1,b:'Brasil',bf:'br',bs:1,w:'a',n:'pens'},{a:'França',af:'fr',as:2,b:'Inglaterra',bf:'gb-eng',bs:1,w:'a'},{a:'Marrocos',af:'ma',as:1,b:'Portugal',bf:'pt',bs:0,w:'a'}],
        [{a:'Argentina',af:'ar',as:3,b:'Croácia',bf:'hr',bs:0,w:'a'},{a:'França',af:'fr',as:2,b:'Marrocos',bf:'ma',bs:0,w:'a'}],
        [{a:'Argentina',af:'ar',as:3,b:'França',bf:'fr',bs:3,w:'a',n:'pens'}]
    ]},
    2018:{host:'Rússia',champion:'França',runners_up:'Croácia',third:'Bélgica',fourth:'Inglaterra',
    stats:{matches:64,goals:169,gpm:'2.64',att:'3.031.768',apm:'47.371'},
    awards:{topScorer:{name:'Harry Kane',fc:'gb-eng',goals:6},bestPlayer:{name:'Luka Modrić',fc:'hr'},bestYoung:{name:'Kylian Mbappé',fc:'fr'},bestGK:{name:'Thibaut Courtois',fc:'be'},fairPlay:{name:'Espanha',fc:'es'}},
    thirdPlace:{a:'Bélgica',af:'be',as:2,b:'Inglaterra',bf:'gb-eng',bs:0,w:'a'},
    rounds:[
        [{a:'França',af:'fr',as:4,b:'Argentina',bf:'ar',bs:3,w:'a'},{a:'Uruguai',af:'uy',as:2,b:'Portugal',bf:'pt',bs:1,w:'a'},{a:'Bélgica',af:'be',as:3,b:'Japão',bf:'jp',bs:2,w:'a'},{a:'Brasil',af:'br',as:2,b:'México',bf:'mx',bs:0,w:'a'},{a:'Croácia',af:'hr',as:1,b:'Dinamarca',bf:'dk',bs:1,w:'a',n:'pens'},{a:'Rússia',af:'ru',as:1,b:'Espanha',bf:'es',bs:1,w:'a',n:'pens'},{a:'Suécia',af:'se',as:1,b:'Suíça',bf:'ch',bs:0,w:'a'},{a:'Colômbia',af:'co',as:1,b:'Inglaterra',bf:'gb-eng',bs:1,w:'b',n:'pens'}],
        [{a:'França',af:'fr',as:2,b:'Uruguai',bf:'uy',bs:0,w:'a'},{a:'Bélgica',af:'be',as:2,b:'Brasil',bf:'br',bs:1,w:'a'},{a:'Croácia',af:'hr',as:2,b:'Rússia',bf:'ru',bs:2,w:'a',n:'pens'},{a:'Suécia',af:'se',as:0,b:'Inglaterra',bf:'gb-eng',bs:2,w:'b'}],
        [{a:'França',af:'fr',as:1,b:'Bélgica',bf:'be',bs:0,w:'a'},{a:'Croácia',af:'hr',as:2,b:'Inglaterra',bf:'gb-eng',bs:1,w:'a',n:'AET'}],
        [{a:'França',af:'fr',as:4,b:'Croácia',bf:'hr',bs:2,w:'a'}]
    ]},
    2014:{host:'Brasil',champion:'Alemanha',runners_up:'Argentina',third:'Países Baixos',fourth:'Brasil',
    stats:{matches:64,goals:171,gpm:'2.67',att:'3.429.873',apm:'53.592'},
    awards:{topScorer:{name:'James Rodríguez',fc:'co',goals:6},bestPlayer:{name:'Lionel Messi',fc:'ar'},bestYoung:{name:'Paul Pogba',fc:'fr'},bestGK:{name:'Manuel Neuer',fc:'de'},fairPlay:{name:'Colômbia',fc:'co'}},
    thirdPlace:{a:'Brasil',af:'br',as:0,b:'Países Baixos',bf:'nl',bs:3,w:'b'},
    rounds:[
        [{a:'Alemanha',af:'de',as:2,b:'Argélia',bf:'dz',bs:1,w:'a',n:'AET'},{a:'França',af:'fr',as:2,b:'Nigéria',bf:'ng',bs:0,w:'a'},{a:'Brasil',af:'br',as:1,b:'Chile',bf:'cl',bs:1,w:'a',n:'pens'},{a:'Colômbia',af:'co',as:2,b:'Uruguai',bf:'uy',bs:0,w:'a'},{a:'Países Baixos',af:'nl',as:2,b:'México',bf:'mx',bs:1,w:'a'},{a:'Costa Rica',af:'cr',as:1,b:'Grécia',bf:'gr',bs:1,w:'a',n:'pens'},{a:'Argentina',af:'ar',as:1,b:'Suíça',bf:'ch',bs:0,w:'a',n:'AET'},{a:'Bélgica',af:'be',as:2,b:'Estados Unidos',bf:'us',bs:1,w:'a',n:'AET'}],
        [{a:'Alemanha',af:'de',as:1,b:'França',bf:'fr',bs:0,w:'a'},{a:'Brasil',af:'br',as:2,b:'Colômbia',bf:'co',bs:1,w:'a'},{a:'Países Baixos',af:'nl',as:0,b:'Costa Rica',bf:'cr',bs:0,w:'a',n:'pens'},{a:'Argentina',af:'ar',as:1,b:'Bélgica',bf:'be',bs:0,w:'a'}],
        [{a:'Alemanha',af:'de',as:7,b:'Brasil',bf:'br',bs:1,w:'a'},{a:'Países Baixos',af:'nl',as:0,b:'Argentina',bf:'ar',bs:0,w:'b',n:'pens'}],
        [{a:'Alemanha',af:'de',as:1,b:'Argentina',bf:'ar',bs:0,w:'a',n:'AET'}]
    ]},
    2010:{host:'África do Sul',champion:'Espanha',runners_up:'Países Baixos',third:'Alemanha',fourth:'Uruguai',
    stats:{matches:64,goals:145,gpm:'2.27',att:'3.178.856',apm:'49.670'},
    awards:{topScorer:{name:'Müller / Villa / Sneijder / Forlán',fc:'',goals:5},bestPlayer:{name:'Diego Forlán',fc:'uy'},bestYoung:{name:'Thomas Müller',fc:'de'},bestGK:{name:'Iker Casillas',fc:'es'},fairPlay:{name:'Espanha',fc:'es'}},
    thirdPlace:{a:'Uruguai',af:'uy',as:2,b:'Alemanha',bf:'de',bs:3,w:'b'},
    rounds:[
        [{a:'Espanha',af:'es',as:1,b:'Portugal',bf:'pt',bs:0,w:'a'},{a:'Paraguai',af:'py',as:0,b:'Japão',bf:'jp',bs:0,w:'a',n:'pens'},{a:'Alemanha',af:'de',as:4,b:'Inglaterra',bf:'gb-eng',bs:1,w:'a'},{a:'Argentina',af:'ar',as:3,b:'México',bf:'mx',bs:1,w:'a'},{a:'Países Baixos',af:'nl',as:2,b:'Eslováquia',bf:'sk',bs:1,w:'a'},{a:'Brasil',af:'br',as:3,b:'Chile',bf:'cl',bs:0,w:'a'},{a:'Uruguai',af:'uy',as:2,b:'Coreia do Sul',bf:'kr',bs:1,w:'a'},{a:'Gana',af:'gh',as:2,b:'Estados Unidos',bf:'us',bs:1,w:'a',n:'AET'}],
        [{a:'Espanha',af:'es',as:1,b:'Paraguai',bf:'py',bs:0,w:'a'},{a:'Alemanha',af:'de',as:4,b:'Argentina',bf:'ar',bs:0,w:'a'},{a:'Países Baixos',af:'nl',as:2,b:'Brasil',bf:'br',bs:1,w:'a'},{a:'Uruguai',af:'uy',as:1,b:'Gana',bf:'gh',bs:1,w:'a',n:'pens'}],
        [{a:'Espanha',af:'es',as:1,b:'Alemanha',bf:'de',bs:0,w:'a'},{a:'Países Baixos',af:'nl',as:3,b:'Uruguai',bf:'uy',bs:2,w:'a'}],
        [{a:'Espanha',af:'es',as:1,b:'Países Baixos',bf:'nl',bs:0,w:'a',n:'AET'}]
    ]},
    2006:{host:'Alemanha',champion:'Itália',runners_up:'França',third:'Alemanha',fourth:'Portugal',
    stats:{matches:64,goals:147,gpm:'2.30',att:'3.359.439',apm:'52.491'},
    awards:{topScorer:{name:'Miroslav Klose',fc:'de',goals:5},bestPlayer:{name:'Zinedine Zidane',fc:'fr'},bestYoung:{name:'Lukas Podolski',fc:'de'},bestGK:{name:'Gianluigi Buffon',fc:'it'},fairPlay:{name:'Brasil / Espanha',fc:''}},
    thirdPlace:{a:'Alemanha',af:'de',as:3,b:'Portugal',bf:'pt',bs:1,w:'a'},
    rounds:[
        [{a:'Itália',af:'it',as:1,b:'Austrália',bf:'au',bs:0,w:'a'},{a:'Ucrânia',af:'ua',as:0,b:'Suíça',bf:'ch',bs:0,w:'a',n:'pens'},{a:'Alemanha',af:'de',as:2,b:'Suécia',bf:'se',bs:0,w:'a'},{a:'Argentina',af:'ar',as:2,b:'México',bf:'mx',bs:1,w:'a',n:'AET'},{a:'Inglaterra',af:'gb-eng',as:1,b:'Equador',bf:'ec',bs:0,w:'a'},{a:'Portugal',af:'pt',as:1,b:'Países Baixos',bf:'nl',bs:0,w:'a'},{a:'Brasil',af:'br',as:3,b:'Gana',bf:'gh',bs:0,w:'a'},{a:'França',af:'fr',as:3,b:'Espanha',bf:'es',bs:1,w:'a'}],
        [{a:'Itália',af:'it',as:3,b:'Ucrânia',bf:'ua',bs:0,w:'a'},{a:'Alemanha',af:'de',as:1,b:'Argentina',bf:'ar',bs:1,w:'a',n:'pens'},{a:'Inglaterra',af:'gb-eng',as:0,b:'Portugal',bf:'pt',bs:0,w:'b',n:'pens'},{a:'Brasil',af:'br',as:0,b:'França',bf:'fr',bs:1,w:'b'}],
        [{a:'Itália',af:'it',as:2,b:'Alemanha',bf:'de',bs:0,w:'a',n:'AET'},{a:'Portugal',af:'pt',as:0,b:'França',bf:'fr',bs:1,w:'b'}],
        [{a:'Itália',af:'it',as:1,b:'França',bf:'fr',bs:1,w:'a',n:'pens'}]
    ]}
};

const WC_DATA={
    2006:{logo:"https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/2006_FIFA_World_Cup.svg/250px-2006_FIFA_World_Cup.svg.png",dates:"9 Junho – 9 Julho",teams:32,venues:12,cities:12},
    2010:{logo:"https://upload.wikimedia.org/wikipedia/en/thumb/0/0d/2010_FIFA_World_Cup.svg/500px-2010_FIFA_World_Cup.svg.png",dates:"11 Junho – 11 Julho",teams:32,venues:10,cities:9},
    2014:{logo:"https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/2014_FIFA_World_Cup.svg/250px-2014_FIFA_World_Cup.svg.png",dates:"12 Junho – 13 Julho",teams:32,venues:12,cities:12},
    2018:{logo:"https://upload.wikimedia.org/wikipedia/en/thumb/6/67/2018_FIFA_World_Cup.svg/250px-2018_FIFA_World_Cup.svg.png",dates:"14 Junho – 15 Julho",teams:32,venues:12,cities:11},
    2022:{logo:"https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/500px-2022_FIFA_World_Cup.svg.png",dates:"20 Novembro – 18 Dezembro",teams:32,venues:8,cities:5}
};

const WC_TITLES={
    brasil:{gold:5,silver:2,bronze:2},alemanha:{gold:4,silver:4,bronze:4},
    italia:{gold:4,silver:2,bronze:1},argentina:{gold:3,silver:3,bronze:0},
    franca:{gold:2,silver:2,bronze:2},uruguai:{gold:2,silver:0,bronze:0},
    inglaterra:{gold:1,silver:0,bronze:0},espanha:{gold:1,silver:0,bronze:0},
    'paises baixos':{gold:0,silver:3,bronze:1},croacia:{gold:0,silver:1,bronze:2},
    suecia:{gold:0,silver:1,bronze:2},hungria:{gold:0,silver:2,bronze:0},
    tchecoslovaquia:{gold:0,silver:2,bronze:0},polonia:{gold:0,silver:0,bronze:2},
    austria:{gold:0,silver:0,bronze:1},belgica:{gold:0,silver:0,bronze:1},
    chile:{gold:0,silver:0,bronze:1},portugal:{gold:0,silver:0,bronze:1},
    turquia:{gold:0,silver:0,bronze:1},eua:{gold:0,silver:0,bronze:1}
};

const RL=['Oitavas de Final','Quartas de Final','Semifinais'];
const RS=['Oitavas','Quartas','Semifinal','Final'];
let curYear=2022,hovTeam=null,linksMap={};

function init(){renderPills();renderEdition();}

function renderPills(){
    const el=document.getElementById('pills');
    el.innerHTML='';
    const label=document.createElement('span');
    label.textContent='Edição:';
    label.style.cssText='font-size:11px;font-weight:800;text-transform:uppercase;color:#7f8692;letter-spacing:1px;margin-right:8px;';
    el.appendChild(label);
    Object.keys(ED).sort((a,b)=>+b-+a).forEach(y=>{
    const btn=document.createElement('button');
    btn.className='pill'+(+y===curYear?' active':'');
    btn.textContent=y;
    btn.onclick=()=>switchYear(+y);
    el.appendChild(btn);
    });
}

function switchYear(y){
    if(y===curYear)return;
    const bw=document.getElementById('bk-bw');
    hovTeam=null;bw.style.opacity=0;
    setTimeout(()=>{curYear=y;renderPills();renderEdition();bw.style.opacity=1;},180);
}

function renderEdition(){
    const ed=ED[curYear];
    renderBadge(ed);renderPodium(ed);renderStats(ed);renderAwards(ed);
    renderBracket(ed);renderPath(ed);
}

function renderBadge(ed){
    const fc=getISO(ed.champion),extra=WC_DATA[curYear]||{};
    document.getElementById('edition-badge').innerHTML=`
    <div class="eb-left"><div class="eb-meta"><div class="eb-host">${ed.host}</div>${extra.dates||''}<br>${extra.teams||''} seleções<br>${extra.venues||''} estádios · ${extra.cities||''} cidades</div></div>
    <div class="eb-logo">${extra.logo?`<img src="${extra.logo}" alt="Logo ${curYear}">`:''}  </div>
    <div class="eb-champ">${fi(fc,52,38)}<div class="eb-champ-info"><div class="eb-champ-label">Campeã</div><div class="eb-champ-name">${ed.champion}</div></div></div>`;
}

function renderPodium(ed){
    const pos=[{n:ed.champion,cls:'p1',pos:'🥇 1º Lugar'},{n:ed.runners_up,cls:'p2',pos:'🥈 2º Lugar'},{n:ed.third,cls:'p3',pos:'🥉 3º Lugar'},{n:ed.fourth,cls:'p4',pos:'4º Lugar'}];
    document.getElementById('podium').innerHTML=pos.map(p=>`<div class="podium-card ${p.cls}"><div class="podium-pos">${p.pos}</div><div class="podium-flag">${fi(getISO(p.n),36,25)}</div><div class="podium-team">${p.n}</div></div>`).join('');
}

function renderStats(ed){
    const s=ed.stats;
    document.getElementById('stats').innerHTML=`
    <div class="stat-item"><div class="stat-val">${s.matches}</div><div class="stat-lbl">Partidas</div></div>
    <div class="stat-item"><div class="stat-val">${s.goals}</div><div class="stat-lbl">Gols</div><div class="stat-sub">${s.gpm} por jogo</div></div>
    <div class="stat-item"><div class="stat-val">${s.att}</div><div class="stat-lbl">Público</div><div class="stat-sub">${s.apm} por jogo</div></div>`;
}

function renderAwards(ed){
    const a=ed.awards;
    const rows=[
    {lbl:'Artilheiro',d:a.topScorer,extra:`<span class="award-goals">${a.topScorer.goals} gols</span>`},
    {lbl:'Melhor Jogador',d:a.bestPlayer},{lbl:'Melhor Jovem',d:a.bestYoung},
    {lbl:'Melhor Goleiro',d:a.bestGK},{lbl:'Fair Play',d:a.fairPlay}
    ];
    document.getElementById('awards').innerHTML=rows.map(r=>`<div class="award-row"><div class="award-lbl">${r.lbl}</div><div class="award-val">${r.d.fc?fi(r.d.fc,14,10):''}${r.d.name}${r.extra||''}</div></div>`).join('');
}

function renderBracket(ed){
    const bw=document.getElementById('bk-bw');
    bw.querySelectorAll('.bk-rc,.bk-last-col').forEach(e=>e.remove());
    ed.rounds.slice(0,3).forEach((matches,ri)=>{
    const col=document.createElement('div');col.className='bk-rc';
    col.innerHTML=`<div class="bk-rc-head">${RL[ri]}</div>`;
    const body=document.createElement('div');body.className='bk-rc-body';
    matches.forEach((m,mi)=>body.appendChild(makeCard(m,ri,mi,ed.champion,false)));
    col.appendChild(body);bw.appendChild(col);
    });
    const lastCol=document.createElement('div');lastCol.className='bk-last-col';
    lastCol.style.cssText='display:flex;flex-direction:column;height:100%;';
    const finalWrap=document.createElement('div');
    finalWrap.style.cssText='flex:1;display:flex;flex-direction:column;justify-content:center;';
    const finalHead=document.createElement('div');finalHead.className='bk-rc-head';finalHead.textContent='Final';
    const finalBody=document.createElement('div');finalBody.className='bk-rc-body';
    finalBody.appendChild(makeCard(ed.rounds[3][0],3,0,ed.champion,false));
    finalWrap.appendChild(finalHead);finalWrap.appendChild(finalBody);
    const thirdWrap=document.createElement('div');thirdWrap.style.marginTop='auto';
    const thirdHead=document.createElement('div');thirdHead.className='bk-rc-head';thirdHead.textContent='3º Lugar';
    const thirdBody=document.createElement('div');thirdBody.className='bk-rc-body';
    thirdBody.appendChild(makeCard(ed.thirdPlace,99,0,ed.champion,true));
    thirdWrap.appendChild(thirdHead);thirdWrap.appendChild(thirdBody);
    lastCol.appendChild(finalWrap);lastCol.appendChild(thirdWrap);bw.appendChild(lastCol);
    requestAnimationFrame(()=>{
    const h=bw.offsetHeight;lastCol.style.height=h+'px';
    requestAnimationFrame(()=>drawLines(ed));
    });
}

function makeCard(m,ri,mi,champ,isThird){
    const card=document.createElement('div');
    card.className='bk-mc'+(isThird?' is-third':'');
    card.dataset.r=ri;card.dataset.m=mi;
    ['a','b'].forEach(slot=>{
    const row=document.createElement('div');
    const won=m.w===slot;
    row.className='bk-tr'+(won?' won':'');
    row.dataset.team=m[slot]||'';
    const note=won&&m.n?`<span class="bk-nt">${m.n}</span>`:'';
    const code=m[slot+'f']||'';
    const flagHtml=code?`<img class="flag-img" src="https://flagcdn.com/w40/${code}.png" alt="" onerror="this.style.display='none'">`:`<span style="width:18px;display:inline-block;"></span>`;
    row.innerHTML=`${flagHtml}<span class="bk-tn${!m[slot]?' tbd':''}">${m[slot]||'—'}</span>${m[slot+'s']!==undefined?`<span class="bk-ts">${m[slot+'s']}</span>`:''}${note}`;
    row.addEventListener('mouseenter',()=>{hovTeam=m[slot];doHL(ED[curYear]);wcTooltip.innerHTML=getTitles(m[slot]);wcTooltip.style.opacity=1;});
    row.addEventListener('mousemove',(e)=>{wcTooltip.style.left=e.pageX+'px';wcTooltip.style.top=e.pageY+'px';});
    row.addEventListener('mouseleave',()=>{hovTeam=null;doHL(ED[curYear]);wcTooltip.style.opacity=0;});
    card.appendChild(row);
    });
    if(!isThird&&(m.a===champ||m.b===champ))card.classList.add('is-champ');
    return card;
}

function drawLines(ed){
    const bw=document.getElementById('bk-bw'),svg=document.getElementById('bk-svg');
    svg.setAttribute('width',bw.scrollWidth);svg.setAttribute('height',bw.offsetHeight);
    svg.innerHTML='';linksMap={};
    const champ=ed.champion;
    [0,1].forEach(ri=>{
    ed.rounds[ri].forEach((match,mi)=>{
        const nextMi=Math.floor(mi/2),isTop=mi%2===0;
        const src=bw.querySelector(`.bk-mc[data-r="${ri}"][data-m="${mi}"]`);
        const tgt=bw.querySelector(`.bk-mc[data-r="${ri+1}"][data-m="${nextMi}"]`);
        if(!src||!tgt)return;
        const s=rp(src,bw),t=rp(tgt,bw);
        const tRows=tgt.querySelectorAll('.bk-tr');
        const tr=rp(isTop?tRows[0]:tRows[1],bw);
        const mx=s.right+(t.left-s.right)*0.5;
        const d=`M${s.right} ${s.cy} H${mx} V${tr.cy} H${t.left}`;
        const path=mkPath(d);
        const winner=match.w==='a'?match.a:match.b;
        linksMap[`${ri}-${mi}`]={path,winner};
        stLink(path,winner===champ,false);svg.appendChild(path);
    });
    });
    ed.rounds[2].forEach((match,mi)=>{
    const src=bw.querySelector(`.bk-mc[data-r="2"][data-m="${mi}"]`);
    const tgt=bw.querySelector(`.bk-mc[data-r="3"][data-m="0"]`);
    if(!src||!tgt)return;
    const s=rp(src,bw),t=rp(tgt,bw);
    const tRows=tgt.querySelectorAll('.bk-tr');
    const tr=rp(mi===0?tRows[0]:tRows[1],bw);
    const mx=s.right+(t.left-s.right)*0.5;
    const d=`M${s.right} ${s.cy} H${mx} V${tr.cy} H${t.left}`;
    const path=mkPath(d);
    const winner=match.w==='a'?match.a:match.b;
    linksMap[`2-${mi}`]={path,winner};
    stLink(path,winner===champ,false);svg.appendChild(path);
    });
}

function rp(el,c){const er=el.getBoundingClientRect(),cr=c.getBoundingClientRect();return{right:er.right-cr.left,left:er.left-cr.left,cy:er.top-cr.top+er.height/2};}
function mkPath(d){const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);p.setAttribute('fill','none');p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');return p;}
function stLink(p,isChamp,isHov){
    if(isHov)       {p.setAttribute('stroke','#2ab8cc');p.setAttribute('stroke-width','2');  p.setAttribute('opacity','0.8');}
    else if(isChamp){p.setAttribute('stroke','#f0c820');p.setAttribute('stroke-width','1.8');p.setAttribute('opacity','0.55');}
    else            {p.setAttribute('stroke','#121e28');p.setAttribute('stroke-width','1.5');p.setAttribute('opacity','1');}
}

function doHL(ed){
    const champ=ed.champion;
    document.querySelectorAll('.bk-mc:not(.is-third)').forEach(card=>{
    card.classList.remove('is-champ','is-hover');
    const ri=+card.dataset.r,mi=+card.dataset.m;
    const m=ed.rounds[ri]?.[mi];if(!m)return;
    if(hovTeam&&(m.a===hovTeam||m.b===hovTeam))card.classList.add('is-hover');
    else if(m.a===champ||m.b===champ)card.classList.add('is-champ');
    });
    const tp3=document.querySelector('.bk-mc.is-third');
    if(tp3){const m3=ed.thirdPlace;if(hovTeam&&(m3.a===hovTeam||m3.b===hovTeam))tp3.classList.add('is-hover');else tp3.classList.remove('is-hover');}
    document.querySelectorAll('.bk-tr').forEach(row=>{row.classList.remove('hl');if(hovTeam&&row.dataset.team===hovTeam)row.classList.add('hl');});
    Object.values(linksMap).forEach(({path,winner})=>stLink(path,winner===champ,hovTeam&&winner===hovTeam));
    const t=document.getElementById('path-title');
    if(hovTeam){t.innerHTML=`TRAJETÓRIA — <span style="color:#0b3560">${hovTeam}</span>`;renderPath(ed,hovTeam);}
    else{t.innerHTML='TRAJETÓRIA DO CAMPEÃO';renderPath(ed);}
}

function renderPath(ed,over){
    const target=over||ed.champion;
    let fc='';
    outer:for(const r of ed.rounds)for(const m of r){if(m.a===target){fc=m.af;break outer;}if(m.b===target){fc=m.bf;break outer;}}
    if(!fc){const tp=ed.thirdPlace;if(tp.a===target)fc=tp.af;else if(tp.b===target)fc=tp.bf;}
    if(!fc)fc=getISO(target);
    const c=document.getElementById('path-cards');c.innerHTML='';
    const isChamp=!over||over===ed.champion;
    const flagSrc=fc?`https://flagcdn.com/w40/${fc}.png`:'';
    const fEl=(w,h,op)=>flagSrc?`<img src="${flagSrc}" style="width:${w}px;height:${h}px;object-fit:cover;border-radius:1px;${op?'opacity:'+op+';':''}" alt="">`:'';
    const tr=document.createElement('div');tr.className='path-trophy';
    tr.innerHTML=`<div style="font-size:16px"></div>${fEl(28,20)}<div class="pt-name">${target}</div><div class="pt-label">${isChamp?'Campeão '+curYear:curYear}</div>`;
    c.appendChild(tr);
    ed.rounds.forEach((round,ri)=>{
    round.forEach(m=>{
        const isA=m.a===target,isB=m.b===target;if(!isA&&!isB)return;
        const won=(isA&&m.w==='a')||(isB&&m.w==='b');
        const myS=isA?m.as:m.bs,oppS=isA?m.bs:m.as;
        const opp=isA?m.b:m.a,oppFc=isA?m.bf:m.af;
        const card=document.createElement('div');card.className='path-card'+(won?'':' lost');
        const oppSrc=oppFc?`https://flagcdn.com/w40/${oppFc}.png`:'';
        card.innerHTML=`<div class="pc-rnd">${RS[ri]}</div><div class="pc-team">${fEl(15,11)}<span class="ptn">${target}</span><span class="pts">${myS}</span></div><div class="pc-sep"></div><div class="pc-opp">${oppSrc?`<img src="${oppSrc}" style="width:15px;height:11px;object-fit:cover;border-radius:1px;opacity:.5;" alt="">`:''}<span class="pon">${opp}</span><span class="pos">${oppS}</span></div>${m.n?`<span class="pc-note">${m.n}</span>`:''}`;
        c.appendChild(card);
    });
    });
    const tp=ed.thirdPlace,isA3=tp.a===target,isB3=tp.b===target;
    if(isA3||isB3){
    const won3=(isA3&&tp.w==='a')||(isB3&&tp.w==='b');
    const myS3=isA3?tp.as:tp.bs,oppS3=isA3?tp.bs:tp.as;
    const opp3=isA3?tp.b:tp.a,oppFc3=isA3?tp.bf:tp.af;
    const card=document.createElement('div');card.className='path-card'+(won3?'':' lost');
    const oppSrc3=oppFc3?`https://flagcdn.com/w40/${oppFc3}.png`:'';
    card.innerHTML=`<div class="pc-rnd third-rnd">3º Lugar</div><div class="pc-team">${fEl(15,11)}<span class="ptn">${target}</span><span class="pts">${myS3}</span></div><div class="pc-sep"></div><div class="pc-opp">${oppSrc3?`<img src="${oppSrc3}" style="width:15px;height:11px;object-fit:cover;border-radius:1px;opacity:.5;" alt="">`:''}<span class="pon">${opp3}</span><span class="pos">${oppS3}</span></div>${tp.n?`<span class="pc-note">${tp.n}</span>`:''}`;
    c.appendChild(card);
    }
}

document.addEventListener('DOMContentLoaded',()=>{
    init();
    window.addEventListener('resize',()=>requestAnimationFrame(()=>drawLines(ED[curYear])));
});


/* =========================================================
    EVOLUÇÃO DOS MASCOTES DA COPA DO MUNDO
   ========================================================= */
(function () {

  const MASCOTS = [
    {
      year: 2026,
      name: "Maple, Zayu & Clutch",
      img: "images\\mascotes\\wc-mct-2026.png",
      desc: "Primeira vez com trio de mascotes representando os três países-sede. Maple é um alce canadense (goleiro nº 1), Zayu é um jaguar mexicano (atacante nº 9), e Clutch é uma águia-careca americana (meia nº 10). Primeira Copa com 48 seleções.",
      host: "EUA / Canadá / México"
    },
    {
      year: 2022,
      name: "La'eeb",
      img: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjO-lnxkfDRwIpw6dsmmuU2zkJcQN8Xfr-hO17IRPDH2KZzJ4SBhXMIvfAvAKcpbW3_Aff3maGAqkuOSFfxvTCFZosmXB09hSNUldtX9bgHV7qhrcxAsRoNA8cAaxpEAcWRxFdNOSjYdbvQc8eRA7x-sXrhakvOAA0jZdPpfWjvTZ17CCWHN_pmP397_A/s300/laeb.png",
      desc: "Personagem abstrato inspirado no gutra, o tradicional lenço branco do Catar, com olhos e boca expressivos. Flutua no ar e viaja entre mundos paralelos. O nome significa 'jogador super habilidoso' em árabe. Argentina tricampeã.",
      host: "Catar"
    },
    {
      year: 2018,
      name: "Zabivaka",
      img: "images/mascotes/wc-mct-2018.png",
      desc: "Lobo cinzento com óculos esportivos, camisa branco-e-azul e calção vermelho. O nome significa 'aquele que marca gols' em russo. Escolhido por voto popular com 53% dos votos entre um milhão de participantes. França bicampeã.",
      host: "Rússia"
    },
    {
      year: 2014,
      name: "Fuleco",
      img: "images/mascotes/wc-mct-2014.png",
      desc: "Tatu-bola azul com detalhes verde e amarelo, espécie ameaçada nativa do Nordeste do Brasil. Nome é junção de 'futebol' e 'ecologia'. Eleito por voto popular e muito presente nos estádios. Alemanha tetracampeã.",
      host: "Brasil"
    },
    {
      year: 2010,
      name: "Zakumi",
      img: "images/mascotes/wc-mct-2010.png",
      desc: "Leopardo com juba verde e uniforme dourado, cores dos esportes sul-africanos. O nome vem de 'ZA' (África do Sul) e 'kumi' (dez, em várias línguas africanas). Primeira Copa realizada no continente africano. Espanha campeã.",
      host: "África do Sul"
    },
    {
      year: 2006,
      name: "Goleo VI & Pille",
      img:"images/mascotes/wc-mct-2006.png",
      desc: "Leão vestindo a camisa alemã com o número '06' e seu parceiro inseparável Pille, uma bola de futebol falante. Criado pela Jim Henson Creature Shop. Polêmico por não usar calça. Itália campeã — Zidane dá a histórica cabeçada em Materazzi.",
      host: "Alemanha"
    },
    {
      year: 2002,
      name: "Ato, Kaz & Nik",
      img: "images/mascotes/wc-mct-2002.png",
      desc: "Trio de criaturas futuristas geradas por computador (os 'Spheriks'): Ato (laranja), Kaz (azul) e Nik (roxo). Inspirados em animes e videogames, jogavam um esporte fictício chamado 'Atmosball'. Segunda vez com múltiplos mascotes. Brasil pentacampeão.",
      host: "Coreia / Japão"
    },
    {
      year: 1998,
      name: "Footix",
      img: "images/mascotes/wc-mct-1998.png",
      desc: "Galo azul com crista vermelha, símbolo nacional da França. Um dos mascotes mais populares e carismáticos da história — mais de 1 milhão de bonecos vendidos. O nome mistura 'football' e o sufixo '-ix' de Asterix. França campeã em casa.",
      host: "França"
    },
    {
      year: 1994,
      name: "Striker",
      img: "images/mascotes/wc-mct-1994.png",
      desc: "Cachorro esportista criado pela equipe de animação da Warner Bros., vestindo as cores vermelha, branca e azul dos EUA. Copa que popularizou o futebol no país-sede. Brasil tetracampeão — Baggio perde o pênalti decisivo na final.",
      host: "Estados Unidos"
    },
    {
      year: 1990,
      name: "Ciao",
      img: "images/mascotes/wc-mct-1990.png",
      desc: "Figura geométrica com corpo nas cores da bandeira italiana (verde, branco, vermelho) e uma bola de futebol como cabeça. Design vanguardista criado por Lucio Boscardin, vencedor de concurso com mais de 50 mil inscritos. Alemanha campeã.",
      host: "Itália"
    },
    {
      year: 1986,
      name: "Pique",
      img: "images/mascotes/wc-mct-1986.png",
      desc: "Pimenta jalapeño antropomórfica com bigode e sombrero, ícone da culinária mexicana. O nome vem de 'picante'. Controverso no México por estereotipar a cultura local. Copa do México — mão de Deus e gol do século de Maradona.",
      host: "México"
    },
    {
      year: 1982,
      name: "Naranjito",
      img: "images/mascotes/wc-mct-1982.png",
      desc: "Laranja antropomórfica usando o uniforme da Espanha — fruto abundante e símbolo do país. Estrelou até um desenho animado de 26 episódios. Itália tricampeã.",
      host: "Espanha"
    },
    {
      year: 1978,
      name: "Gauchito",
      img: "images/mascotes/wc-mct-1978.png",
      desc: "Menino com traje típico de gaúcho argentino: chapéu de aba larga com 'ARGENTINA 78', lenço no pescoço, calça bombacha e facão. Inspirado no folklore dos campos da América Latina. Argentina campeã em casa pela primeira vez.",
      host: "Argentina"
    },
    {
      year: 1974,
      name: "Tip & Tap",
      img: "images/mascotes/wc-mct-1974.png",
      desc: "Dois garotos sorrindo: um com 'WM' (Weltmeisterschaft) na camisa, outro com '74'. Criados para simbolizar a união entre Alemanha Oriental e Ocidental, que competiam no mesmo torneio. Primeira dupla de mascotes da história da Copa. Alemanha Ocidental campeã.",
      host: "Alemanha Ocidental"
    },
    {
      year: 1970,
      name: "Juanito",
      img: "images/mascotes/wc-mct-1970.png",
      desc: "Menino de uniforme verde e branco do México, com sombrero estampado 'MEXICO 70'. Primeiro mascote humano da Copa e pioneiro no álbum de figurinhas Panini. Primeira Copa televisionada para o mundo. Pelé ergue a taça pela terceira e última vez.",
      host: "México"
    },
    {
      year: 1966,
      name: "World Cup Willie",
      img: "images/mascotes/wc-mct-1966.png",
      desc: "O primeiro mascote oficial da história das Copas. Leão com camisa estampada com a Union Jack e os dizeres 'WORLD CUP'. Criado pelo ilustrador Reg Hoye. Apareceu em centenas de produtos e ganhou música própria com Lonnie Donegan. Inglaterra campeã.",
      host: "Inglaterra"
    }
  ];

  let selectedMascotYear = 2026;

  function renderMascots() {
    const grid = document.getElementById('mascots-grid');
    if (!grid) return;

    MASCOTS.forEach((mascot) => {
      const card = document.createElement('div');
      card.className = 'mascot-card';
      card.style.textAlign = 'center';
      card.style.cursor = 'pointer';

      const img = document.createElement('img');
      img.src = mascot.img;
      img.alt = mascot.name;
      img.style.width = '72px';
      img.style.height = '72px';
      img.style.objectFit = 'contain';
      img.onerror = function () {
        this.onerror = null;
        this.src = `images/mascot-${mascot.year}.png`;
      };

      const yearEl = document.createElement('div');
      yearEl.textContent = mascot.year;
      yearEl.style.fontSize = '12px';
      yearEl.style.fontWeight = '700';

      const nameEl = document.createElement('div');
      nameEl.textContent = mascot.name;
      nameEl.style.fontSize = '11px';

      card.appendChild(img);
      card.appendChild(yearEl);
      card.appendChild(nameEl);

      card.addEventListener('click', () => {
        document.querySelectorAll('.mascot-card').forEach(c => c.classList.remove('mascot-selected'));
        card.classList.add('mascot-selected');
        showMascotDetail(mascot);
      });

      grid.appendChild(card);
    });

    const defaultMascot = MASCOTS.find(m => m.year === selectedMascotYear);
    if (defaultMascot) {
      showMascotDetail(defaultMascot);
      // Marca o primeiro card (2026) como selecionado
      setTimeout(() => {
        const first = document.querySelector('.mascot-card');
        if (first) first.classList.add('mascot-selected');
      }, 0);
    }
  }

  function showMascotDetail(mascot) {
    const d = document.getElementById('mascot-detail');
    d.innerHTML = '';

    const img = document.createElement('img');
    img.src = mascot.img;
    img.alt = mascot.name;
    img.className = 'history-detail-media';
    img.onerror = function () {
      this.onerror = null;
      this.src = `images/mascot-${mascot.year}.png`;
    };

    const meta = document.createElement('div');
    meta.className = 'history-detail-meta';
    meta.innerHTML = `
      <div class="history-detail-title">
        ${mascot.year} — ${mascot.name}
      </div>
      <div class="history-detail-host">
        🏟️ ${mascot.host}
      </div>
    `;

    const desc = document.createElement('div');
    desc.className = 'history-detail-desc';
    desc.textContent = mascot.desc;

    d.appendChild(img);
    d.appendChild(meta);
    d.appendChild(desc);
  }

  document.addEventListener('DOMContentLoaded', renderMascots);

})();


/* =========================================================
    EVOLUÇÃO DAS BOLAS DA COPA DO MUNDO
   ========================================================= */
(function () {

  const BALLS = [
    { year: 2026, name: "Trionda Pro", img:"images/wc-ball-trionda-2026.png", panels: "orbita",desc: "Bola oficial da Copa do Mundo da FIFA 2026. O seu nome e design são inspirados na famosa 'ola' das arquibancadas e na união dos três países-sede: Estados Unidos, México e Canadá. Primeiro Mundial com 48 seleções.", host: "EUA/CAN/MEX" },
    { year: 2022, name: "Al Rihla", img:"https://digitalhub.fifa.com/transform/ce00eb6b-cee2-49df-aeaa-10d4a2e41316/FIFA-World-Cup-Qatar-2022-official-match-ball-Al-Rihla?&io=transform:fill,width:1024&quality=75", panels: "alrihla", desc: "20 painéis de diferentes formatos. Mais rápida da história em voo. Inspirada em barcos e arquitetura do Catar. Argentina tricampeã.", host: "Catar" },
    { year: 2018, name: "Telstar 18",img:"https://digitalhub.fifa.com/transform/07487a6b-1bd8-4850-8c99-239c8de73c65/2018-FIFA-World-Cup-Russia-official-match-ball-Telstar-18?&io=transform:fill,width:1024&quality=75",  panels: "telstar18", desc: "Homenagem ao Telstar original de 1970 com design de pixels digitais em P&B. Primeira bola com chip NFC. França bicampeã.", host: "Rússia" },
    { year: 2014, name: "Brazuca", img:"https://digitalhub.fifa.com/transform/f3c744d4-b4c0-403d-a461-6fc9fba7f494/2014-FIFA-World-Cup-Brazil-official-match-ball-Brazuca?&io=transform:fill,width:1024&quality=75",   panels: "brazuca", desc: "6 painéis em forma de hélice, a bola mais testada da história (600 pessoas, 3 anos de testes). Cores do Brasil. Alemanha tetracampeã.", host: "Brasil" },
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
    { year: 1958, name: "Top Star", img:"https://digitalhub.fifa.com/transform/208d1c9d-5934-4e30-95ce-ea8ad962d05c/1958-FIFA-World-Cup-Sweden-official-match-ball-Top-Star?&io=transform:fill,width:1024&quality=75", panels: "classic", desc: "Modelo de 24 tiras com formato muito mais consistente, produzido em amarelo, marrom e branco. A versão branca — com cera contra a umidade — foi a mais usada e esteve na grande final. A Copa onde Fontaine fez 13 gols e Pelé brilhou aos 17 anos no primeiro título do Brasil.", host: "Suécia" },
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

      const img = document.createElement('img');
      img.src = ball.img;
      img.alt = ball.name;
      img.className = 'history-detail-media';

      const meta = document.createElement('div');
      meta.className = 'history-detail-meta';
      meta.innerHTML = `
        <div class="history-detail-title">
          ${ball.year} — ${ball.name}
        </div>
        <div class="history-detail-host">
          🏟️ ${ball.host}
        </div>
      `;

      const desc = document.createElement('div');
      desc.className = 'history-detail-desc';
      desc.textContent = ball.desc;

      d.appendChild(img);
      d.appendChild(meta);
      d.appendChild(desc);
  }

  document.addEventListener('DOMContentLoaded', renderBalls);

})();


/* =========================================================
  CAMISAS DA SELEÇÃO BRASILEIRA
========================================================= */
(function () {

  const SHIRTS = [
    {
      year: 1930, era: '1930-1950',
      img:"images\\shirts\\wc-shirt-1930.png",
      desc: 'Foi o uniforme usado na primeira Copa do Mundo, realizada no Uruguai. Em relação ao modelo anterior, houve uma mudança na gola da camisa e no escudo da CBD (Confederação Brasileira de Desportos), que permaneceu sem mudanças significativas até 1967.', kit: 'home'
    },
    {
      year: 1934, era: '1930-1950',
      img: "images\\shirts\\wc-shirt-1934.png",
      desc: 'Similar ao modelo de 1930, manteve o branco como cor principal e a gola polo azul. Foi o uniforme da única partida do Brasil naquela Copa (contra a Espanha).',
      kit: 'home'
    },

    {
      year: 1938, era: '1930-1950',
      img:"images\\shirts\\wc-shirt-1938.png",
      desc: 'A seleção brasileira inovou na gola de sua já tradicional camisa branca, os cadarços das copas anteriores deram lugar a um modelo em "V". Copa da França — Brasil ficou em 3º lugar, com Leônidas artilheiro.', kit: 'home'
    },
    {
      year: 1950, era: '1930-1950',
      img:"images\\shirts\\wc-shirt-1950.png",
      desc: 'Para a primeira Copa do Mundo em casa, a Seleção mudou mais uma vez a gola da camisa, usando o modelo "polo". A seleção perdeu a final para o Uruguai no Maracanã, no episódio conhecido como Maracanazo. O trauma da derrota levou à adoção definitiva da camisa amarela.', kit: 'home'
    },
    {
      year: 1954, era: '1954-1965',
      img:"images\\shirts\\wc-shirt-1954.png",
      desc: 'Primeira vez com a amarelinha! A camisa canarinho da Seleção foi ideia do jornalista e desenhista Aldyr Schlee, que venceu um concurso promovido em 1953 pelo jornal carioca “Correio da Manhã". Sua estreia foi nas eliminatórias da Copa daquele ano e marcou o início de um vitorioso legado.', kit: 'home'
    },
    {
      year: 1958, era: '1954-1965', img:"images\\shirts\\wc-shirt-1958.png",
      desc: 'Com a camisa amarela, Pelé com 17 anos marca seu primeiro gol na Copa. Brasil Campeão na Suécia. A Seleção usou a amarelinha na maior parte da campanha do primeiro título, mas a taça foi conquistada de azul. No improviso: como a Suécia também atuava de amarelo, o chefe da delegação, Paulo Machado de Carvalho, comprou camisas azuis na véspera da final e motivou os atletas dizendo que era a cor do manto de Nossa Senhora Aparecida.', kit: 'home'
    },
    {
      year: 1962, era: '1954-1965',
      img:"images\\shirts\\wc-shirt-1962.png",
      desc: 'Brasil bicampeão no Chile. Foi a terceira Copa do Mundo com o mesmo modelo da camisa canarinho, que parecia dar sorte. Após a lesão de Pelé ainda na fase de grupos, Garrincha assumiu o protagonismo da equipe, e o capitão Mauro ergueu a taça usando a amarelinha.', kit: 'home'
    },
    {
      year: 1966, era: '1954-1965',
      img:"images\\shirts\\wc-shirt-1966.png",
      desc: 'Na Copa do Mundo daquele ano, na Inglaterra, o primeiro modelo da camisa amarela foi usada pela última vez. Eliminação precoce na fase de grupos pela primeira vez. Pelé sofre muitas faltas e jura não jogar mais Copas.', kit: 'home'
    },
    {
      year: 1970, era: '1970-1982',
      img:"images\\shirts\\wc-shirt-1970.png",
      desc: 'Considerado o melhor time da história. Pelé, Jairzinho, Tostão — Tricampeão! Número 10 icônico.', kit: 'home'
    },
    {
      year: 1974, era: '1970-1982',
      img:"images\\shirts\\wc-shirt-1974.png",
      desc: 'Geração pós-1970, 4º lugar. Rivelino e Zico presentes.', kit: 'home'
    },
    {
      year: 1978, era: '1970-1982', img:"images\\shirts\\wc-shirt-1978.png",
      desc: 'Pela primeira vez, a CBD (Confederação Brasileira de Desporto) assinou com uma fornecedora de material esportivo e exibiu as três listras da Adidas na manga. Brasil fica em 3º lugar, "invicto" no torneio. Zico, Rivellino, Roberto Dinamite.', kit: 'home'
    },
    {
      year: 1982, era: '1970-1982', img:"images\\shirts\\wc-shirt-1982.png",
      desc: 'A principal mudança é o novo escudo da CBF, que ganhou o desenho da Taça Jules Rimet após concurso na Escola de Belas Artes, no Rio. Para burlar regra da Fifa, o ramo de café foi incluído dentro do símbolo. A inscrição "Brasil" passou a ser adotada abaixo do escudo. Seleção de Zico, Sócrates, Falcão — eliminada pela Itália de Rossi.', kit: 'home'
    },
    {
      year: 1986, era: '1986-1994',
      img:"images\\shirts\\wc-shirt-1986.png",
      desc: 'A gola polo voltou a ser usada na camisa. Pela primeira vez a marca do fornecedor do material apareceu na parte frontal. Eliminados pela França nos pênaltis. Zico perde o pênalti. Sócrates também.', kit: 'home'
    },
    {
      year: 1990, era: '1986-1994',   img:"images\\shirts\\wc-shirt-1990.png",
      desc: 'A seleção brasileira manteve a gola polo da edição anterior, mas mudou o corte "V", deixando o modelo mais fechado na altura do pescoço. Foi a última Copa com o novo símbolo da CBF. Eliminados pela Argentina de Maradona no jogo que ficou famoso pelo gol de Caniggia.', kit: 'home'
    },
    {
      year: 1994, era: '1986-1994',   img:"images\\shirts\\wc-shirt-1994.png",
      desc: 'Tetracampeão! Para a Copa da conquista do tetra, a camisa ganhou símbolos da CBF em grandes marcas d\'água que remetiam ao tricampeonato mundial.  Romário e Bebeto. Baggio perde o pênalti. Copa dos EUA.', kit: 'home'
    },
    {
      year: 1998, era: '1998-2006',   img:"images\\shirts\\wc-shirt-1998.png",
      desc: 'Em 1997, a Nike entrou no lugar da Umbro. Para a Copa do Mundo na França, em 1998, a empresa fez uma camisa simples, com uma listra grossa na manga acompanhada de duas mais finas. Quatro estrelas foram colocadas acima do escudo. Vice-campeão — Brasil perde a final para a França. Ronaldo joga doente — o episódio do desmaio.', kit: 'home'
    },
    {
      year: 2002, era: '1998-2006',   img:"images\\shirts\\wc-shirt-2002.png",
      desc: 'PENTACAMPEÃO! Ronaldo ressurge, marca 8 gols. Ronaldinho, Rivaldo. Camisa sem gola, com detalhes em verde.', kit: 'home'
    },
    {
      year: 2006, era: '1998-2006', img:"images\\shirts\\wc-shirt-2006.png",
      desc: 'Camisa mais simples, sem detalhes. Uma pequena abertura na parte frontal da gola é o único detalhe deste modelo da camisa. Eliminados pela França nas quartas. Ronaldo iguala o recorde de Gerd Müller.', kit: 'home'
    },
    {
      year: 2010, era: '2010-2018', img:"images\\shirts\\wc-shirt-2010.png",
      desc: 'Camisa amarela minimalista com gola redonda verde e uma linha fina verde nos ombros. Eliminados pela Holanda nas quartas. Robinho, Kaká. Camisa com ombros verdes e faixa central.', kit: 'home'
    },
    {
      year: 2014, era: '2010-2018', img:"images\\shirts\\wc-shirt-2014.png",
      desc: 'A amarelinha da Copa em casa ganhou gola em formato "V" e manteve a simplicidade. Porém, a inscrição "Brasil" abaixo do escudo foi retirada. Neymar se machuca nas quartas. 4º lugar em casa', kit: 'home'
    },
    {
      year: 2018, era: '2010-2018', img:"images\\shirts\\wc-shirt-2018.png",
      desc: 'Camisa amarela em tom vibrante (\'Samba Gold\') com ranhuras sutis nas mangas e gola com detalhe em azul na nuca. Eliminados pela Bélgica nas quartas. Neymar, Philippe Coutinho.', kit: 'home'
    },
    {
      year: 2022, era: '2022-2026', img:"images\\shirts\\wc-shirt-2022.png",
      desc: 'Camisa amarela clara com estampa de \'onça-pintada\' em marca d\'água e gola verde com botão azul. Eliminados pela Croácia nas quartas (pênaltis). Neymar marca gol olímpico. Copa do Catar. ', kit: 'home'
    },
    {
      year: 2026, era: '2022-2026', img:"images\\shirts\\wc-shirt-2026.png",
      desc: 'Camisa com visual moderno e detalhes em verde nas mangas e na gola, combinando tradição e elementos contemporâneos. Copa do Mundo nos EUA, México e Canadá. Primeira Copa com 48 seleções. A busca pelo hexacampeonato.', kit: 'home'
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
    img.alt = `Camisa ${shirt.year}`;
    img.className = 'history-detail-media history-detail-media-shirt';

    const meta = document.createElement('div');
    meta.className = 'history-detail-meta';
    meta.innerHTML = `
      <div class="history-detail-title history-detail-title-shirt">
        ${shirt.year}
      </div>

      <div class="history-detail-host history-detail-host-shirt">
        🇧🇷 Seleção Brasileira
      </div>
    `;

    const desc = document.createElement('div');
    desc.className = 'history-detail-desc history-detail-desc-shirt';
    desc.textContent = shirt.desc;

    d.appendChild(img);
    d.appendChild(meta);
    d.appendChild(desc);
  }

  document.addEventListener('DOMContentLoaded', renderShirts);

})();
