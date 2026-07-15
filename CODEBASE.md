# Documentação do Código-Fonte

Este documento descreve a organização interna do repositório, a estrutura dos pacotes Python, os módulos Stan e os artefatos gerados. Para visão geral do projeto, configuração e citações de dados, veja o [README](README.md).

## Layout do Repositório

| Caminho | Descrição |
| --- | --- |
| `README.md` | Visão geral do projeto, configuração, comandos e citações de dados. |
| `CODEBASE.md` | Este arquivo: documentação técnica da base de código. |
| `pyproject.toml` | Metadados do pacote Python, dependências, configuração de Ruff, mypy, pytest e coverage. |
| `uv.lock` | Resolução de dependências travada para `uv`. |
| `.python-version` | Versão do Python fixada para as ferramentas do projeto. |
| `.pre-commit-config.yaml` | Configuração dos hooks de pré-commit. |
| `Makefile` | Comandos comuns de configuração, lint, formatação, download de dados e limpeza para macOS/Linux. |
| `setup.ps1` | Helper de configuração para Windows PowerShell. |
| `LICENSE` | Licença MIT. |
| `.github/` | Configuração do repositório no GitHub. |
| `data/` | Datasets atuais, tabelas de probabilidades derivadas, resumos de simulação e saídas geradas. |
| `data/raw/` | Entradas históricas de partidas e ranking FIFA usadas para treinamento e validação. |
| `data/outputs/models/` | Draws posteriores Stan salvos como arquivos `.npz`. Podem ser artefatos gerados de grande porte. |
| `data/outputs/results/` | Resultados JSON de simulação e tabelas/gráficos de avaliação. |
| `data/outputs/dashboards/` | Dashboards HTML standalone gerados. |
| `docs/` | Site estático servido pelo GitHub Pages ou qualquer servidor de arquivos estático. |
| `docs/csv/` | Arquivos CSV consumidos pelas páginas do site e visualizações JavaScript. |
| `docs/css/`, `docs/js/`, `docs/images/` | Estilização, comportamento client-side, fontes, bandeiras, fotos de seleções, mascotes, camisas e assets visuais. |
| `notebooks/` | Notebooks exploratórios para limpeza de dados, experimentação com modelos e exemplos. |
| `tests/` | Testes automatizados (pytest) para módulos de análise/lógica pura, sem dependência de CmdStan. |
| `src/` | Pacote Python principal: carregamento de dados, modelagem, simulação, exportação, análise e dashboards. |
| `src/analysis/` | Avaliação de Brier score, visualização de força das seleções e análise de confrontos simulados. |
| `src/data/` | Download do dataset Kaggle, ponderação por decaimento temporal e preparação do frame de treinamento. |
| `src/model/` | Classe base abstrata, wrapper Bayesiano e modelo frequentista Dixon-Coles. |
| `src/model_sel/` | Scripts de validação e avaliação de Brier score para os torneios de 2018 e 2022. |
| `src/output/` | Exportação de probabilidades de placar, atualização do HTML do site e geração de dashboards D3. |
| `src/simulations/` | Pontos de entrada para treinamento e simulação dos torneios de 2018, 2022 e 2026. |
| `src/tournament/` | Fase de grupos, alocação de terceiros colocados, chaveamento e simulação Monte Carlo. |
| `stan_models/` | Arquivos-fonte Stan (`.stan`) e binários compilados. |

## Estrutura do Pacote `src/`

`src/` é um pacote Python próprio. Todos os imports usam o namespace `src.*`.

### `src/constants.py`

Constantes centrais: caminhos de dados, pesos do torneio, grupos de 2026, regras de chaveamento, rótulos de placar, mapeamentos de nomes de seleções (`TEAM_MAP_EN_TO_PT`, `TEAM_MAP_PT_TO_EN`) e rótulos de exibição.

### `src/data/`

| Módulo | Finalidade |
| --- | --- |
| `loader.py` | Download do dataset Kaggle (`get_data()`, `data_pipeline()`), ponderação por decaimento temporal e importância (`prepare_cycle_data()`), carregamento de priori de ranking (`load_ranking_priors()`), resolução de nomes de seleções e `load_data()` para uso geral. |

### `src/model/`

| Módulo | Finalidade |
| --- | --- |
| `base.py` | Classe base abstrata `BaseDixonColesMatchModel`: `match_probs()`, `simulate_match()`, `win_draw_loss()`. |
| `params.py` | Dataclasses `TournamentModelParams` (parâmetros de ponto único) e `TournamentParamsSeries` (série posterior vetorizada). |
| `frequentist.py` | `DixonColesModel`: ajuste L-BFGS-B de parâmetros de ataque/defesa/casa/rho. Construtor de conveniência `build_model()`. |
| `bayesian.py` | `BayesianDixonColesModel`: carrega draws posteriores `.npz` e os envolve na interface compartilhada de probabilidade de partida. Helper `load_draws()`. |
| `utils.py` | `score_probability_matrix()`, `score_probability_matrix_batched()` e helpers de vantagem de mando de campo. |

### `src/tournament/`

| Módulo | Finalidade |
| --- | --- |
| `base.py` | Dataclasses `GroupStanding`, `TournamentResult` e classe base abstrata `TournamentSimulator`. |
| `frequentist.py` | `WorldCup2026`: simulador do torneio de 48 seleções usando um `DixonColesModel` ajustado. Trata classificação em grupos, alocação de terceiros colocados, rodada de 32 e fases eliminatórias. |
| `bayesian.py` | `BayesianWorldCup2026`: simulador Monte Carlo vetorizado (padrão 100 000 execuções) orientado por draws posteriores Stan. `simulate_stage_and_remaining()` para atualizações de fase durante o torneio. Expõe `last_stage_arrays`: os índices de seleção por simulação em cada fase eliminatória (pares consecutivos = partidas daquela fase), usados por `src.analysis.matchup_events` para contar confrontos específicos. |

### `src/simulations/`

| Módulo | Finalidade |
| --- | --- |
| `train_2026.py` | Compila modelos Stan e treina o posterior de 2026; salva draws em `data/outputs/models/`. |
| `sim_2026.py` | Executa 100 000 simulações do torneio a partir dos draws salvos; gera JSON, CSVs e dashboard. |
| `analyze_matchup_events.py` | Treina o modelo até uma data de corte (`--cutoff-date`), simula o torneio e reporta (1) a frequência de eventos configuráveis em `EVENTS` (confrontos específicos ou conjuntos por fase) e (2) as top-N combinações de jogos mais prováveis por fase (`--top-n`), com probabilidade conjunta para fases com mais de uma partida simultânea. |
| `export_all_matchups.py` | Exporta tabelas de probabilidade de todos os confrontos possíveis. |
| `sim_2022.py`, `sim_2018.py` | Pontos de entrada de simulação histórica para 2022 e 2018. |
| `utils.py` | `build_all_matchups_dataframe_mc()` — probabilidades Monte Carlo de todos os confrontos. |

### `src/model_sel/`

| Módulo | Finalidade |
| --- | --- |
| `validate.py` | `train_and_save()`: treina um modelo Stan e salva os draws posteriores. |
| `evaluate_2018.py` | Avaliação de Brier score contra os resultados da Copa do Mundo de 2018. |
| `evaluate_2022.py` | Avaliação de Brier score contra os resultados da Copa do Mundo de 2022. |

### `src/output/`

| Módulo | Finalidade |
| --- | --- |
| `export.py` | `export_phase_probs()`, `build_prob_dataframe()`, `build_stage_dataframe()`, `build_all_matchups_dataframe()`, `update_html_from_summary()`, `update_chaveamento_probs()` e CLI `main()`. |
| `dashboard.py` | `generate_dashboard()`: constrói um dashboard D3 HTML standalone a partir do JSON de simulação. |

### `src/analysis/`

| Módulo | Finalidade |
| --- | --- |
| `evaluation.py` | `calculate_model_brier()`: calcula resumos de Brier score para draws posteriores salvos. |
| `forces.py` | Gera gráficos de distribuição posterior da força das seleções a partir dos draws Stan. |
| `weights.py` | Helpers de peso por importância de partida e decaimento temporal. |
| `matchup_events.py` | `count_matchup_event()` / `analyze_events()`: frequência de confrontos específicos (ou conjuntos) por fase. `top_matchups_by_stage()` / `top_matchups_all_stages()`: top-N combinações de jogos mais prováveis por fase, com probabilidade conjunta para fases com mais de uma partida simultânea. Opera sobre `last_stage_arrays` de `BayesianWorldCup2026`. |

## Track de Modelos Stan

O workflow Bayesiano usa arquivos `.stan` em `stan_models/`, prepara dados ponderados de partidas com `src.data.loader`, executa CmdStan através de `cmdstanpy`, salva draws posteriores em `data/outputs/models/` e simula torneios a partir desses draws usando `BayesianWorldCup2026`.

Os nomes dos modelos codificam duas escolhas:

- `poisson` vs. `dc`: Poisson independente vs. correção Dixon-Coles para placares baixos.
- `ranking` vs. `noranking`: se informações do ranking FIFA são incluídas como atributo de força a priori.
- `n_` vs. `st_`: parametrização estilo normal vs. Student-t na família de modelos Stan.

O modelo em produção para 2026 é o `n_poisson_ranking`.

## Saídas Geradas

Vários arquivos em `data/`, `docs/csv/` e `data/outputs/` são gerados pelos scripts de treinamento e simulação:

- draws do modelo: `data/outputs/models/*.npz`, incluindo `draws_2026_<cutoff_date>_<model>.npz` por data de corte gerado por `analyze_matchup_events.py`;
- JSON de simulação: `data/outputs/results/sim_results_*.json`;
- dashboards: `data/outputs/dashboards/dashboard_*.html`;
- tabelas públicas de probabilidades: `data/summary.csv`, `docs/csv/previsoes/partidas.csv`, `docs/csv/previsoes/summary.csv`, `docs/csv/previsoes/chaveamento_probs.csv` (snapshots versionados do chaveamento) e `docs/csv/previsoes/tabela_chances.csv` (snapshots versionados das probabilidades de avanço);
- tabelas e gráficos de avaliação: `data/outputs/results/brier_score_*.csv` e `data/outputs/results/comparacao_brier_*.png`.

Ao alterar o código de modelagem, regenere as saídas relevantes antes de atualizar o site.

## Convenções de Código

Os scripts Stan ativos e os módulos compartilhados usam nomes de variáveis e funções padronizados em inglês. Rótulos em português, nomes de arquivos de saída e caminhos voltados ao site — como `docs/csv/previsoes/` — são mantidos como parte do contrato do site estático público.
