# docs/csv/previsoes/

Probabilidades e metadados exportados pelo pipeline de simulação. Esses arquivos alimentam o site público e são atualizados a cada execução do workflow.

---

## Arquivos gerados automaticamente

### `partidas.csv`

Probabilidades de cada partida da **fase de grupos**.

| Coluna | Descrição |
|--------|-----------|
| `group` | Grupo (A–L) |
| `home_team`, `away_team` | Times em português |
| `date` | Data da partida |
| `home_win`, `draw`, `away_win` | Probabilidade (%) de cada resultado |
| `zero_zero` … `four_four` | Probabilidade (%) de cada placar até 4×4 |

Gerado por: `src/simulations/sim_2026.py`

---

### `summary.csv`

Probabilidades de avanço por fase para cada um dos **48 times**.

| Coluna | Descrição |
|--------|-----------|
| `position` | Posição no ranking de favoritos |
| `team` | Nome do time em português |
| `champion` | % de chance de ser campeão |
| `final` | % de chance de chegar à final |
| `semifinals` | % de chance de chegar às semifinais |
| `quarterfinals` | % de chance de chegar às quartas |
| `round_of_16` | % de chance de chegar às oitavas |
| `round_of_32` | % de chance de sair da fase de grupos |
| `group_first_place` | % de chance de terminar 1º no grupo |
| `group_second_place` | % de chance de terminar 2º no grupo |
| `group_third_place` | % de chance de terminar 3º no grupo |

Gerado por: `src/simulations/sim_2026.py`

---

### `all_matchups.csv`

Probabilidades para **todos os 1.128 confrontos possíveis** entre os 48 times (C(48,2)).

Mesmas colunas de probabilidade que `partidas.csv` (`home_win`, `draw`, `away_win`, placar a placar). As probabilidades são calculadas diretamente pelos parâmetros do modelo.

Gerado por: `src/simulations/sim_2026.py`

---

### `chaveamento_probs.csv`

Histórico versionado das probabilidades de avanço nas **fases eliminatórias** (R32 até final e disputa do 3º lugar) — cada linha pertence a um snapshot de versão, análogo a `tabela_chances.csv`.

| Coluna | Descrição |
|--------|-----------|
| `versão` | Rótulo da execução (ex: `"Antes da data FIFA"`, `"Após a Fase de Grupos"`) |
| `side` | Lado do chaveamento (`left`, `right`, `final`, `terceiro`) |
| `round_index` | Índice numérico da fase (0 = R32, …, 4 = Final) |
| `round_label` | Rótulo da fase (`R32`, `Oitavas`, `Quartas`, `Semifinal`, `3º Lugar`, `Final`) |
| `order` | Ordem de exibição no bracket |
| `id` | Identificador do confronto (ex: `L1`, `RL2`, `F`) |
| `home_team`, `away_team` | Times mais prováveis de chegar a cada confronto |
| `prob_home`, `prob_away` | Probabilidade (%) de cada time avançar nesse confronto |
| `winner` | Qual lado (`home`/`away`) tem maior probabilidade de avançar |

Permite comparar a evolução do chaveamento ao longo do torneio. Atualizado por `update_chaveamento_probs()` em `src/output/export.py`.

---

### `tabela_chances.csv`

Histórico versionado de probabilidades — cada linha é um snapshot de uma execução anterior.

| Coluna | Descrição |
|--------|-----------|
| `versão` | Rótulo da execução (ex: `"Antes da data FIFA"`, `"Fase de Grupos — Rodada 1"`) |
| `pos` | Posição no ranking da versão |
| `team` | Nome do time em português |
| `flag` | URL da bandeira SVG |
| `champ`, `final`, `semi`, `qf`, `r16`, `r32` | Probabilidades (%) por fase naquela versão |

Permite comparar a evolução das probabilidades ao longo do torneio. Atualizado por `update_html_from_summary()` em `src/output/export.py`.

---

## Arquivo estático (não gerado automaticamente)

### `chaveamento_hist.csv`

Dados históricos e contextuais de cada seleção para exibição no site.

| Coluna | Descrição |
|--------|-----------|
| `team` | Nome do time em português |
| `flag` | Emoji da bandeira |
| `rank` | Posição no ranking FIFA usada como prior |
| `apps` | Número de participações em Copas do Mundo |
| `best` | Melhor resultado histórico com descrição |
| `last` | Resultado na Copa 2022 com descrição |
| `players` | Principais jogadores convocados |
| `wc_gold`, `wc_silver`, `wc_bronze` | Contagem de títulos, vice-campeonatos e terceiros lugares |

Arquivo mantido manualmente. Não é sobrescrito pelo workflow.
