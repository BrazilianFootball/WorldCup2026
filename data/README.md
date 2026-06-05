# data/

Arquivos de entrada, dados brutos e artefatos gerados pelo pipeline de treinamento e simulação.

---

## Raiz

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `results.csv` | Histórico completo de partidas internacionais (Kaggle). Colunas: `date, home_team, away_team, home_score, away_score, tournament, city, country, neutral`. Inclui as partidas da Copa 2026 agendadas (scores nulos até serem jogadas). | Fonte principal de treinamento do modelo (`prepare_cycle_data`) e extração de resultados conhecidos da Copa 2026 em `sim_2026.py`. |
| `shootouts.csv` | Resultado de disputas por pênaltis (Kaggle). Colunas: `date, home_team, away_team, winner, first_shooter`. | Baixado pelo `data_pipeline()` junto com `results.csv`; disponível para uso no modelo. |
| `goalscorers.csv` | Artilheiros por partida (Kaggle). Colunas: `date, home_team, away_team, team, scorer, minute, own_goal, penalty`. | Baixado pelo `data_pipeline()`; disponível para enriquecimento de análises. |
| `world_cup_results.csv` | Calendário oficial da Copa 2026. Colunas: `stage, group, home_team, away_team, home_real, away_real, date`. Times em português. Inclui linhas vazias para fases eliminatórias. | Referência de orientação home/away e grupo de cada partida da fase de grupos, lido por `_load_schedule_orientations()` em `src/tournament/bayesian.py`. |

---

## raw/

Arquivos estáticos usados durante validação e treinamento. Não são sobrescritos pelo pipeline.

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `fifa_ranking_2010.csv` | Ranking FIFA ao final da Copa 2010. Colunas: `date, semester, rank, team, acronym, total.points, previous.points, diff.points`. | Referência histórica; não usada diretamente no treinamento da Copa 2026. |
| `fifa_ranking_2014.csv` | Ranking FIFA ao final da Copa 2014. Mesmas colunas. | Prior bayesiano para o ciclo 2014 durante backtesting em `validate.py`. |
| `fifa_ranking_2018.csv` | Ranking FIFA ao final da Copa 2018. Mesmas colunas. | Prior bayesiano para o ciclo 2022 durante backtesting em `validate.py`. |
| `fifa_ranking_2022.csv` | Ranking FIFA ao final da Copa 2022. Mesmas colunas. | Prior bayesiano para o modelo da Copa 2026 em `train_2026.py` (`load_ranking_priors`). |
| `jogos_2014.csv` | Partidas da Copa 2014. Colunas: `date, home_team, away_team, home_score, away_score, tournament, city, country, neutral`. | Conjunto de teste para backtesting do modelo em `validate.py`. |
| `jogos_2018.csv` | Partidas da Copa 2018. Mesmas colunas. | Conjunto de teste para backtesting em `validate.py`. |
| `jogos_2022.csv` | Partidas da Copa 2022. Mesmas colunas. | Conjunto de teste para backtesting em `validate.py`. |

---

## outputs/

Artefatos gerados pelo pipeline. Todos são sobrescritos a cada execução do workflow.

### outputs/models/

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `draws_2026_n_poisson_ranking.npz` | Draws da posteriori Stan do modelo Dixon-Coles com ranking. Arrays comprimidos: `attack`, `defense`, `eta` (por amostra), `rho` (opcional), `teams` (nomes). ~170 MB. | Carregado por `BayesianDixonColesModel` em `sim_2026.py` para gerar as simulações do torneio. |

### outputs/results/

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `sim_results_2026.json` | Probabilidades por fase para todos os 48 times. Estrutura: `{stage: [{team, probability}]}`. Fases: `round_of_32`, `round_of_16`, `quarter_finalists`, `semi_finalists`, `finalists`, `champion`. | Lido por `generate_dashboard()` para construir o dashboard interativo. |
| `sim_results_2018.json` | Mesmo formato, Copa 2018. | Histórico; gerado durante backtesting. |
| `sim_results_2022.json` | Mesmo formato, Copa 2022. | Histórico; gerado durante backtesting. |
| `brier_score_2018.csv` | Métricas Brier Score por fase para o modelo na Copa 2018. | Avaliação de calibração do modelo. |
| `brier_score_2022.csv` | Métricas Brier Score por fase para o modelo na Copa 2022. | Avaliação de calibração do modelo. |
| `comparacao_brier_2018.png` | Gráfico comparativo de Brier Score entre variantes do modelo — Copa 2018. | Seleção de modelo em `validate.py`. |
| `comparacao_brier_2022.png` | Gráfico comparativo de Brier Score entre variantes do modelo — Copa 2022. | Seleção de modelo em `validate.py`. |
| `distribuicao_strength.png` | Distribuição das forças de ataque e defesa estimadas pelo modelo. | Diagnóstico da posteriori. |
| `hist_total_weight.png` | Histograma dos pesos totais aplicados às partidas no treinamento. | Diagnóstico do decaimento temporal. |
| `weekly_time_weight.png` | Evolução semanal do peso temporal. | Diagnóstico do decaimento temporal. |
| `weekly_total_weight.png` | Evolução semanal do peso total (decaimento × torneio). | Diagnóstico do decaimento temporal. |
| `elo_poisson_ataque_defesa.png` | Comparação entre força Elo e parâmetros de ataque/defesa do modelo. | Diagnóstico de consistência com ranking externo. |
| `elo_poisson_heatmap_placares.png` | Heatmap de probabilidade de placar para confronto de referência. | Visualização do modelo. |
| `elo_poisson_trajetoria_parametros.png` | Trajetória dos parâmetros ao longo das iterações MCMC. | Diagnóstico de convergência MCMC. |

### outputs/dashboards/

| Arquivo | Conteúdo | Utilização |
|---------|----------|------------|
| `dashboard_2026.html` | Dashboard interativo D3.js com probabilidades por fase para a Copa 2026. | Visualização principal gerada por `generate_dashboard()` em `sim_2026.py`. |
| `dashboard_2018.html` | Dashboard histórico — Copa 2018. | Referência; gerado durante backtesting. |
| `dashboard_2022.html` | Dashboard histórico — Copa 2022. | Referência; gerado durante backtesting. |
