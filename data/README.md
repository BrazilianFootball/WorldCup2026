# data/

Arquivos de entrada, dados brutos e artefatos gerados pelo pipeline de treinamento e simulação.

---

## Raiz

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `results.csv` | Histórico completo de partidas internacionais (Kaggle). Colunas: `date, home_team, away_team, home_score, away_score, tournament, city, country, neutral`. Inclui as partidas da Copa 2026 agendadas (scores nulos até serem jogadas). | Fonte principal de treinamento do modelo (`prepare_cycle_data`) e extração de resultados conhecidos da Copa 2026 em `sim_2026.py`. |
| `shootouts.csv` | Resultado de disputas por pênaltis (Kaggle). Colunas: `date, home_team, away_team, winner, first_shooter`. | Baixado pelo `data_pipeline()` junto com `results.csv`; disponível para uso no modelo. |
| `goalscorers.csv` | Artilheiros por partida (Kaggle). Colunas: `date, home_team, away_team, team, scorer, minute, own_goal, penalty`. | Baixado pelo `data_pipeline()`, mas **não consumido por nenhum script ativo** — `load_data()` (única função que o retorna) não é chamada pelo pipeline. |
| `world_cup_results.csv` | Calendário oficial da Copa 2026. Colunas: `stage, group, home_team, away_team, home_real, away_real, date`. Times em português. Inclui linhas vazias para fases eliminatórias. | Referência de orientação home/away e grupo de cada partida da fase de grupos, lido por `_load_schedule_orientations()` em `src/tournament/bayesian.py`. |

---

## raw/

Arquivos estáticos usados durante validação e treinamento. Não são sobrescritos pelo pipeline.

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `fifa_ranking_2010.csv` | Ranking FIFA ao final da Copa 2010. Colunas: `date, semester, rank, team, acronym, total.points, previous.points, diff.points`. | **Não referenciado em nenhum script** — nenhuma simulação da Copa 2010 existe no projeto. |
| `fifa_ranking_2014.csv` | Ranking FIFA ao final da Copa 2014. Mesmas colunas. | Prior bayesiano para o ciclo 2014 durante backtesting em `validate.py`. |
| `fifa_ranking_2018.csv` | Ranking FIFA ao final da Copa 2018. Mesmas colunas. | Prior bayesiano para o ciclo 2022 durante backtesting em `validate.py`. |
| `fifa_ranking_2022.csv` | Ranking FIFA ao final da Copa 2022. Mesmas colunas. | Prior bayesiano para o modelo da Copa 2026 em `train_2026.py` (`load_ranking_priors`). |
| `jogos_2014.csv` | Partidas da Copa 2014. Colunas: `date, home_team, away_team, home_score, away_score, tournament, city, country, neutral`. | Conjunto de teste para backtesting do modelo em `validate.py`. |
| `jogos_2018.csv` | Partidas da Copa 2018. Mesmas colunas. | Conjunto de teste para backtesting em `validate.py`. |
| `jogos_2022.csv` | Partidas da Copa 2022. Mesmas colunas. | Conjunto de teste para backtesting em `validate.py`. |

---

## outputs/

Artefatos gerados pelos scripts do projeto. Os arquivos da Copa 2026 são sobrescritos a cada execução do workflow. Os demais são gerados pontualmente por scripts de análise e backtesting e **não são consumidos por nenhum outro script nem pelo frontend**.

### outputs/models/

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `draws_2026_n_poisson_ranking.npz` | Draws da posteriori Stan do modelo Dixon-Coles com ranking. Arrays comprimidos: `attack`, `defense`, `eta` (por amostra), `rho` (opcional), `teams` (nomes). ~170 MB. | Carregado por `BayesianDixonColesModel` em `sim_2026.py` para gerar as simulações do torneio. |

### outputs/results/

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `sim_results_2026.json` | Probabilidades por fase para todos os 48 times. Estrutura: `{stage: [{team, probability}]}`. Fases: `round_of_32`, `round_of_16`, `quarter_finalists`, `semi_finalists`, `finalists`, `champion`. | Lido por `generate_dashboard()` para construir o dashboard interativo. |
| `sim_results_2018.json` | Mesmo formato, Copa 2018. | Gerado por `sim_2018.py` (backtesting); não lido por nenhum outro script. |
| `sim_results_2022.json` | Mesmo formato, Copa 2022. | Gerado por `sim_2022.py` (backtesting); não lido por nenhum outro script. |
| `brier_score_2018.csv` | Métricas Brier Score por fase para o modelo na Copa 2018. | Gerado por `evaluate_2018.py`; não lido por nenhum outro script. |
| `brier_score_2022.csv` | Métricas Brier Score por fase para o modelo na Copa 2022. | Gerado por `evaluate_2022.py`; não lido por nenhum outro script. |
| `comparacao_brier_2018.png` | Gráfico comparativo de Brier Score entre variantes do modelo — Copa 2018. | Gerado por `evaluate_2018.py`; não referenciado no frontend. |
| `comparacao_brier_2022.png` | Gráfico comparativo de Brier Score entre variantes do modelo — Copa 2022. | Gerado por `evaluate_2022.py`; não referenciado no frontend. |
| `distribuicao_strength.png` | Distribuição das forças de ataque e defesa estimadas pelo modelo. | Gerado por `forces.py`; não referenciado no frontend. |
| `hist_total_weight.png` | Histograma dos pesos totais aplicados às partidas no treinamento. | Gerado por `weights.py`; não referenciado no frontend. |
| `weekly_time_weight.png` | Evolução semanal do peso temporal. | Gerado por `weights.py`; não referenciado no frontend. |
| `weekly_total_weight.png` | Evolução semanal do peso total (decaimento × torneio). | Gerado por `weights.py`; não referenciado no frontend. |
| `elo_poisson_ataque_defesa.png` | Comparação entre força Elo e parâmetros de ataque/defesa do modelo. | Não referenciado no frontend. |
| `elo_poisson_heatmap_placares.png` | Heatmap de probabilidade de placar para confronto de referência. | Não referenciado no frontend. |
| `elo_poisson_trajetoria_parametros.png` | Trajetória dos parâmetros ao longo das iterações MCMC. | Não referenciado no frontend. |

### outputs/dashboards/

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `dashboard_2026.html` | Dashboard interativo D3.js com probabilidades por fase para a Copa 2026. | Visualização principal gerada por `generate_dashboard()` em `sim_2026.py`. |
| `dashboard_2018.html` | Dashboard histórico — Copa 2018. | Gerado por `sim_2018.py` (backtesting); não referenciado no frontend. |
| `dashboard_2022.html` | Dashboard histórico — Copa 2022. | Gerado por `sim_2022.py` (backtesting); não referenciado no frontend. |
