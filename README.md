# Copa do Mundo 2026

Modelagem preditiva, simulação, avaliação e assets de site estático para o projeto FIFA Copa do Mundo 2026, desenvolvido no contexto das atividades de previsão de futebol da EMAp/FGV.

O projeto estima a força das seleções nacionais a partir de resultados recentes de partidas internacionais e usa essas estimativas para simular torneios da Copa do Mundo. As principais saídas são:

- probabilidades de classificação e título por seleção;
- probabilidades de placar por partida;
- exportações de probabilidades do chaveamento por fase eliminatória;
- comparações entre modelos via Brier score;
- dashboards HTML e site estático em português para divulgação pública.

## Modelos

O projeto possui duas linhas de modelagem:

- **Bayesiano (Stan)**: ajuste via CmdStan com amostragem MCMC, draws salvos como arquivos NumPy comprimidos.
- **Frequentista (Dixon-Coles)**: ajuste por máxima verossimilhança (L-BFGS-B) para iteração rápida e exportação.

O modelo em produção para 2026 é o `n_poisson_ranking`. Para detalhes sobre os módulos, a estrutura de arquivos e as saídas geradas, consulte o [CODEBASE.md](CODEBASE.md).

## Configuração

### macOS / Linux

```bash
git clone <repo-url>
cd WorldCup2026
make local
```

### Windows PowerShell

```powershell
git clone <repo-url>
cd WorldCup2026
.\setup.ps1
```

Ambos os fluxos instalam `uv`, a versão Python de `.python-version`, criam o ambiente virtual, instalam as dependências e configuram os hooks de pré-commit.

Para workflows Stan, certifique-se de que o CmdStan esteja instalado e acessível ao `cmdstanpy`. O repositório inclui um binário compilado para `n_poisson_ranking` em `stan_models/`, mas é um artefato dependente de plataforma e pode precisar ser recompilado localmente.

## Comandos Comuns

| Tarefa | macOS/Linux | Windows PowerShell |
| --- | --- | --- |
| Configuração | `make local` | `.\setup.ps1` |
| Lint e typecheck | `make check` | `uv run ruff check src/; uv run mypy src/` |
| Formatar | `make format` | `uv run ruff format src/` |
| Rodar hooks de pré-commit | `make test` | `uv run pre-commit run --all-files` |
| Baixar dados do Kaggle | `make run-data` | `uv run python -c "from src.data.loader import data_pipeline; data_pipeline()"` |
| Atualizar página de chances | `make update-chances` | `uv run python src/output/export.py --wc-results data/world_cup_results.csv` |
| Limpar caches gerados | `make clean` | Remover `.venv`, pastas de cache e artefatos de build manualmente |

## Pontos de Entrada

```bash
# 1. Baixar / atualizar dados de partidas do Kaggle
make run-data

# 2. Treinar o modelo Bayesiano (Stan) para 2026
uv run python -m src.simulations.train_2026

# 3. Simular 2026 a partir dos draws Stan salvos (gera JSON, CSVs, dashboard)
uv run python -m src.simulations.sim_2026

# 4. Exportar probabilidades de placar e atualizar docs/chances.html
uv run python src/output/export.py --wc-results data/world_cup_results.csv

# 5. Treinar / avaliar modelos Stan para os ciclos de validação de 2018 e 2022
uv run python -m src.model_sel.validate
uv run python -m src.model_sel.evaluate_2018
uv run python -m src.model_sel.evaluate_2022
```

## Site

O site público está em `docs/` e é escrito em HTML/CSS/JavaScript estático em português. Inclui:

- `docs/index.html`: página inicial do projeto;
- `docs/modelos.html`: descrição dos modelos;
- `docs/previsoes.html`: previsões de partidas;
- `docs/chances.html`: probabilidades de avanço e título por seleção;
- `docs/calendario.html`: página de calendário;
- `docs/vis.html`: visualizações retrospectivas;
- `docs/equipe.html`: página da equipe;
- `docs/midia.html`: página de mídia;
- `docs/album.html`: álbum das seleções.

O site pode ser visualizado abrindo `docs/index.html` em um navegador ou servindo `docs/` com qualquer servidor de arquivos estático.

## Dados e Citações

### Resultados internacionais de futebol

Os dados históricos de partidas usados no treinamento dos modelos provêm do seguinte dataset público do Kaggle:

> Jürisoo, M. *International Football Results from 1872 to 2026*. Kaggle.
> https://www.kaggle.com/datasets/martj42/international-football-results-from-1872-to-2017

O dataset fornece três arquivos: `results.csv` (resultados de partidas), `shootouts.csv` (disputas por pênaltis) e `goalscorers.csv` (artilheiros individuais).

### Ranking FIFA

Os arquivos `data/raw/fifa_ranking_*.csv` contêm os pontos de ranking FIFA por semestre, obtidos da lista oficial de ranking publicada pela FIFA e usados como priori de força das seleções nos modelos Bayesianos.

> FIFA. *FIFA/Coca-Cola World Ranking*. Fédération Internationale de Football Association.
> https://www.fifa.com/fifa-world-ranking

### Resultados históricos das Copas do Mundo

Os arquivos `data/raw/jogos_2014.csv`, `data/raw/jogos_2018.csv` e `data/raw/jogos_2022.csv` contêm os resultados das Copas do Mundo de 2014, 2018 e 2022, derivados do mesmo dataset Kaggle de resultados internacionais citado acima, e utilizados para validação dos modelos.

## Notas para Contribuidores

- Mantenha separadas as alterações em `src/` e `stan_models/` das mudanças em saídas geradas.
- Use `data/world_cup_results.csv` para registrar resultados conhecidos de 2026 e execute `uv run python src/output/export.py --wc-results data/world_cup_results.csv` para propagar as mudanças nos resumos e arquivos do site.
- Execute formatação e checagens (`make check`) antes de commitar alterações de código.

## Licença

MIT — veja o arquivo `LICENSE`.
