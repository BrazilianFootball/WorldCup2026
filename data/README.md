# data/

Arquivos de entrada, dados brutos e artefatos gerados pelo pipeline de treinamento e simulação.

---

## Raiz

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `results.csv` | Histórico completo de partidas internacionais (Kaggle). Colunas: `date, home_team, away_team, home_score, away_score, tournament, city, country, neutral`. Inclui as partidas da Copa 2026 agendadas (scores nulos até serem jogadas). | Fonte principal de treinamento do modelo (`prepare_cycle_data`) e extração de resultados conhecidos da Copa 2026 em `sim_2026.py`. |
| `shootouts.csv` | Resultado de disputas por pênaltis (Kaggle). Colunas: `date, home_team, away_team, winner, first_shooter`. | Baixado pelo `data_pipeline()` junto com `results.csv`; disponível para uso no modelo. |
| `world_cup_results.csv` | Calendário oficial da Copa 2026. Colunas: `stage, group, home_team, away_team, home_real, away_real, date`. Times em português. Inclui linhas vazias para fases eliminatórias. | Referência de orientação home/away e grupo de cada partida da fase de grupos, lido por `_load_schedule_orientations()` em `src/tournament/bayesian.py`. |

`goalscorers.csv` (artilheiros por partida) foi removido: era baixado pelo `data_pipeline()` mas não consumido por nenhum script.

---

## raw/

Arquivos estáticos usados durante validação e treinamento. Não são sobrescritos pelo pipeline.

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `fifa_ranking_2014.csv` | Ranking FIFA ao final da Copa 2014. Mesmas colunas. | Prior bayesiano para o ciclo 2014 durante backtesting em `validate.py`. |
| `fifa_ranking_2018.csv` | Ranking FIFA ao final da Copa 2018. Mesmas colunas. | Prior bayesiano para o ciclo 2022 durante backtesting em `validate.py`. |
| `fifa_ranking_2022.csv` | Ranking FIFA ao final da Copa 2022. Mesmas colunas. | Prior bayesiano para o modelo da Copa 2026 em `train_2026.py` (`load_ranking_priors`). |
| `jogos_2014.csv` | Partidas da Copa 2014. Colunas: `date, home_team, away_team, home_score, away_score, tournament, city, country, neutral`. | Conjunto de teste para backtesting do modelo em `validate.py`. |
| `jogos_2018.csv` | Partidas da Copa 2018. Mesmas colunas. | Conjunto de teste para backtesting em `validate.py`. |
| `jogos_2022.csv` | Partidas da Copa 2022. Mesmas colunas. | Conjunto de teste para backtesting em `validate.py`. |

`fifa_ranking_2010.csv` (ranking FIFA ao final da Copa 2010) foi removido: nenhuma simulação da Copa 2010 existe no projeto.

---

## outputs/

Artefatos gerados pelos scripts do projeto. `outputs/results/` e `outputs/dashboards/` contêm só os arquivos **live** da competição corrente (hoje a Copa 2026), sobrescritos a cada execução do workflow. Todo artefato de backtesting/validação histórica (qualquer ciclo passado, de qualquer competição) fica isolado em `outputs/backtesting/` — ver seção abaixo.

### outputs/models/

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `draws_2026_n_poisson_ranking.npz` | Draws da posteriori Stan do modelo Dixon-Coles com ranking. Arrays comprimidos: `attack`, `defense`, `eta` (por amostra), `rho` (opcional), `teams` (nomes). ~170 MB. | Carregado por `BayesianDixonColesModel` em `sim_2026.py` para gerar as simulações do torneio. |

### outputs/results/

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `sim_results_2026.json` | Probabilidades por fase para todos os 48 times. Estrutura: `{stage: [{team, probability}]}`. Fases: `round_of_32`, `round_of_16`, `quarter_finalists`, `semi_finalists`, `finalists`, `champion`. | Lido por `generate_dashboard()` para construir o dashboard interativo. |

### outputs/dashboards/

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `dashboard_2026.html` | Dashboard interativo D3.js com probabilidades por fase para a Copa 2026. | Visualização principal gerada por `generate_dashboard()` em `sim_2026.py`. |

### outputs/backtesting/

Artefatos de validação de ciclos encerrados (hoje Copa 2018 e Copa 2022), gerados pelo pipeline de backtest compartilhado (`run_backtest_simulation`/`evaluate_brier` em `src/simulations/`, `src/model_sel/`) e por scripts de análise pontuais. Servem como evidência de que esse pipeline reaproduz corretamente um ciclo já conhecido — o mesmo motivo pelo qual ele foi desenhado pra ser reaproveitável entre competições (ex.: uma futura Copa Feminina). **Não são consumidos por nenhum outro script nem pelo frontend.**

| Arquivo | Conteúdo |
|---------|----------|
| `results/sim_results_2018.json`, `results/sim_results_2022.json` | Mesmo formato de `sim_results_2026.json`, para os ciclos 2018/2022. |
| `results/brier_score_2018.csv`, `results/brier_score_2022.csv` | Métricas Brier Score por fase para o modelo em cada ciclo. |
| `results/comparacao_brier_2018.png`, `results/comparacao_brier_2022.png` | Gráfico comparativo de Brier Score entre variantes do modelo, por ciclo. |
| `results/distribuicao_strength.png` | Distribuição das forças de ataque e defesa estimadas pelo modelo 2026. Gerado por `src/analysis/forces.py`. |
| `results/hist_total_weight.png`, `results/weekly_time_weight.png`, `results/weekly_total_weight.png` | Distribuição/evolução dos pesos (decaimento × torneio) aplicados às partidas no treinamento. Gerados por `src/analysis/weights.py`. |
| `results/elo_poisson_ataque_defesa.png`, `results/elo_poisson_heatmap_placares.png`, `results/elo_poisson_trajetoria_parametros.png` | Comparações exploratórias entre um modelo Elo e o Dixon-Coles ajustado (`notebooks/elo_poisson_model.ipynb`). |
| `dashboards/dashboard_2018.html`, `dashboards/dashboard_2022.html` | Dashboard histórico por ciclo. |
