"""
Quem: João Marcos
Para: jogos do site para txt
Data: 02/06/2018
"""




import pandas as pd
import os
import datetime as dt
path = "D:\\Dropbox\\Projeto Copa 2018\\resultados_selecoes\\"


jogos = pd.read_csv(os.path.join(path, 'jogos mar-jun.csv'), sep=',', encoding='utf-8')
jogos.score.value_counts()
jogos['home_score'] = jogos['score'].apply(lambda x: int(x.split('-')[0]))
jogos['away_score'] = jogos['score'].apply(lambda x: int(x.split('-')[1]))
jogos['month'] = jogos['date'].apply(lambda x: int(x[3:5]))


#jogos = jogos[jogos.month >= 4]
jogos = jogos.drop('month', axis=1)

codigo = pd.read_excel('D:\\Dropbox\\Projeto Copa 2018\\resultados_selecoes\\resultados_internacionais_\
2014_abr_2018.xlsx', sheet_name='Paises_conf', header=None)

codigo = codigo.drop([3, 4, 5], axis=1)
codigo.columns = ['cod_sel', 'selecao', 'conf']


def prepara(base, codigos):
    resultado = pd.merge(left=base, right=codigos, how='left', left_on='home_team', right_on='selecao')
    resultado['home_team'] = resultado.cod_sel
    resultado = resultado.drop(['score', 'cod_sel', 'selecao'], axis = 1)
    resultado = resultado.rename(columns={'conf': 'home_conf'})
    resultado = pd.merge(left=resultado, right=codigos, how='left', left_on='away_team', right_on='selecao')
    resultado['away_team'] = resultado.cod_sel
    resultado = resultado.drop(['cod_sel', 'selecao'], axis=1)
    resultado = resultado.rename(columns={'conf': 'away_conf'})
    return resultado

jogos = prepara(jogos, codigo)
jogos= jogos[[ 'home_team',  'home_score', 'away_score', 'away_team', 'date', 'weight', 'local',
       'home_conf', 'away_conf']]


jogos.head()

def ordinaldate (x):
    day = int(x[0:2])
    month = int(x[3:5])
    year = int(x[6:10])
    d = dt.date(year, month, day)
    return d.toordinal()


jogos['date'] = jogos['date'].apply(lambda x: ordinaldate(x))

jogos = jogos[['home_team',  'home_score', 'away_score', 'away_team', 'date', 'weight']]
jogos.to_csv(os.path.join(path,'resultado_atualizados.csv'), sep=',', index=False, header=False)


jogos_paulo ="D:\\Dropbox\\Projeto Copa 2018\\Simulação\\Estimação\\"
os.chdir(jogos_paulo)

internacionais = pd.read_table('internacionais.txt', header= None)
internacionais.columns = ['home_team',  'home_score', 'away_score', 'away_team', 'date', 'weight']
internacionais = internacionais.append(jogos)
internacionais = internacionais.drop_duplicates().reset_index().drop('index', axis=1)
internacionais = internacionais.sort_values( by =['date'])

internacionais.to_csv('internacionais.txt', header=None, sep='\t', index=None)
internacionais['data'] = internacionais['date'].apply(lambda x: dt.date.fromordinal(x).strftime("%d-%m-%Y "))
internacionais = internacionais.sort_values( by =['data'])
internacionais.to_csv('Resultados_Asla.csv', sep=',', index=None)
########################################################################################################################

# Estatísticas
def gen_resultado(home,away):
    resultado = []
    for i in range(len(home)):
        if home[i]>away[i]:
            resultado.append(3)
        elif home[i]<away[i]:
            resultado.append(0)
        else:
            resultado.append(1)
    return resultado

internacionais = internacionais.reset_index().drop('index', axis=1)
internacionais['result'] = gen_resultado(internacionais.home_score, internacionais.away_score)
internacionais.shape
len(internacionais.drop_duplicates())
home = internacionais[['home_team', 'home_score', 'away_score', 'weight', 'result']]
away = internacionais[['away_team', 'away_score', 'home_score', 'weight', 'result']]
home.columns = ['team', 'score', 'conceded', 'weight', 'result']
away.columns = ['team', 'score', 'conceded', 'weight', 'result']
def traduz(result):
    resultado =[]
    for i in range(len(result)):
        if result[i]==3:
            resultado.append(0)
        elif result[i]==0:
            resultado.append(3)
        else:
            resultado.append(1)
    return resultado
away.result = traduz(away.result)

est = home.append(away).reset_index().drop('index', axis=1)

copa = pd.read_csv('selecoes_copa.txt', sep='\t', header=None)
copa = copa.drop([0,3], axis=1 )
copa.columns = ['sig','team']

est = est.merge(copa,on='team') # Apenas seleções que vão pra copa

est[['sig','score']].groupby('sig').describe()
#vitórias,empates e derrota
est.groupby('sig')['result'].value_counts()

#--------------------------------
# Gols sofridos
est.groupby('sig')['conceded'].sum()
#Gols feitos
est.groupby('sig')['score'].sum()
#Total de jogos
est.groupby('sig')['result'].count()

