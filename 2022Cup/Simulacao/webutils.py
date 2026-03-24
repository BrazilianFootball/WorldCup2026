# -*- coding: utf-8 -*-
"""
Created on Thu May 24 16:24:08 2018

@author: paulo.carvalho
"""

import random, math, operator
from jinja2 import Environment, FileSystemLoader

def Mapa_Prob(alfa1, beta1, alfa2, beta2):
    l1 = alfa1/beta2
    l2 = alfa2/beta1
    g1 = math.floor(l1)
    g2 = math.floor(l2)
    fact = [0 for n in range(4)]
    fact[0] = 1
    prob=[[0.0 for n in range(4)] for i in range(4)]
    for i in range(4):
        for j in range(4):
            prob[i][j] = math.exp(-l1)*math.exp(-l2)*math.pow(l1, i)*math.pow(l2, j)/math.factorial(i)/math.factorial(j)
    return([g1, g2, prob])

def Resultados_grupo (grupo, alfa, beta):
    ajogar=[0 for j in range(6)]
    ajogar[0]=[grupo[0],grupo[1], 0, 0]
    ajogar[1]=[grupo[2],grupo[3], 0, 0]
    ajogar[2]=[grupo[0],grupo[2], 0, 0]
    #ajogar[3]=[grupo[3],grupo[1], 0, 0]
    #ajogar[4]=[grupo[3],grupo[0], 0, 0]
    ajogar[3]=[grupo[1],grupo[3], 0, 0]
    ajogar[4]=[grupo[0],grupo[3], 0, 0]
    ajogar[5]=[grupo[1],grupo[2], 0, 0]
    for  n in range(6):
        t1 = ajogar[n][0]
        t2 = ajogar[n][1]
        mapa = Mapa_Prob(alfa[t1-1], beta[t1-1], alfa[t2-1], beta[t2-1])           
        g1 = mapa[0]
        g2 = mapa[1]
        prob = mapa[2] 
        ajogar[n][2] = g1
        ajogar[n][3] = g2
    return(ajogar)

def Resultados_grupos (grupos, alfa, beta):
    n_grupos=len(grupos)
    resultados = [[] for j in range(n_grupos)]
    for n in range(n_grupos):
        resultados [n] = Resultados_grupo (grupos[n], alfa, beta)
    return(resultados)
    
def Previsoes_1fase(grupos, alfa, beta, selecoes, abrev):
    file_loader = FileSystemLoader('templates')
    env = Environment(loader=file_loader)
    template = env.get_template('previsoes.txt')
    nome_g = ["A", "B", "C", "D", "E", "F", "G", "H"]
    resultados = Resultados_grupos (grupos, alfa, beta) 
    previsoes = template.render(fase = "Fase de Grupos", nome_g = ["A", "B", "C", "D", "E", "F", "G", "H"], rodada = ["1", "2", "3"] , res = resultados, sel = selecoes, cod = abrev)
    saida = open("paginas web\\previsoes_grupos.html", "w", encoding = "utf-8")
    saida.write(previsoes)
    saida.close()
    
def Chances(selecoes, abrev, ordem, prob):
    file_loader = FileSystemLoader('templates')
    env = Environment(loader=file_loader)
    template = env.get_template('chances.txt') 
    chances = template.render(data = "16/11", sel = selecoes, em_ordem = ordem, abrev = abrev, p = prob)
    saida = open("paginas web\\chances_grupos.html", "w", encoding = "utf-8")
    saida.write(chances)
    saida.close()   
    
def Pagina_Grupo (grupo, alfa, beta, sel, g):
    # sel_ids=range(32)
    # cod=0
    # for n in grupo:
    #    sel_ids[n-1]=cod
    #    cod+=1
    ajogar=[0 for j in range(6)]
    ajogar[0]=[grupo[0],grupo[1]]
    ajogar[1]=[grupo[2],grupo[3]]
    ajogar[2]=[grupo[0],grupo[2]]
    ajogar[3]=[grupo[3],grupo[1]]
    ajogar[4]=[grupo[3],grupo[0]]
    ajogar[5]=[grupo[1],grupo[2]]
    print('Grupo',grupo)
    for  n in range(6):
        t1 = ajogar[n][0]
        t2 = ajogar[n][1]
        mapa = Mapa_Prob(alfa[t1-1], beta[t1-1], alfa[t2-1], beta[t2-1])           
        g1 = mapa[0]
        g2 = mapa[1]
        prob = mapa[2]  
        # print('Jogo ',str(n+1),str(t1),str(t2),prob)
        g.write("<tr>") 
        g.write("<td>")
        g.write (sel[t1]) #########
        g.write("<td>")
        g.write(str(g1))
        g.write("<td>")
        g.write(str(g2))
        g.write("<td>")
        g.write (sel[t2]) #######
        g.write("</tr>")
            
def Pagina_Grupos (grupos, alfa, beta, sel, g):
    n_grupos=len(grupos)
    for n in range(n_grupos):
        g.write("<h3>Grupo")
        g.write(str(n+1))
        g.write("</h3>")
        g.write ("<table border>")
        Pagina_Grupo(grupos[n], alfa, beta, sel, g)
    g.write("</table>")


            

         
def Jogo(alfa, beta, grupo, ajogar, sel, g):
    g.write('<td align = center width=12% style="font-family:verdana">')
    t1 = 4*grupo+ajogar[0]
    t2 = 4*grupo+ajogar[1]
    res = Mapa_Prob(alfa[t1], beta[t1], alfa[t2], beta[t2])
    g1 = res[0]
    g2 = res[1]
    g.write(sel[t1+1])
    g.write("<br>")
    g.write(str(int(g1)))
    g.write("x")
    g.write(str(int(g2)))
    g.write("<br>")
    g.write(sel[t2+1])
    g.write("</td>")

def Imagem(grupo, ajogar, sel_abrev, g):
    g.write("<td align = center width=12%>")
    g.write('<a href ="')
    t1 = 4*grupo+ajogar[0]
    t2 = 4*grupo+ajogar[1]
    fname = str(t1+1)+"_"+ str(t2+1) + "-"+ sel_abrev[t1+1] + "X" + sel_abrev[t2+1]+ ".png"
    g.write(fname)
    g.write('">')
    g.write('<img src = "')
    g.write(fname)
    g.write('" width=120 height = 156> </a></td>')
 
                        
def Pagina_Visual_Grupos(alfa, beta, grupos, sel, sel_abrev, g):
    ajogar=[0 for j in range(6)]
    ajogar[0]=[0,1]
    ajogar[1]=[2,3]
    ajogar[2]=[0,2] 
    ajogar[3]=[1,3]
    ajogar[4]=[0,3]
    ajogar[5]=[1,2]
    g.write('<h1 style="font-family:verdana">Previs&otilde;es para a primeira fase</h1>')
    g.write("<table border>")
    g.write("<tr>")
    g.write('<td width=24% colspan=2 style="font-family:verdana"><b> Grupo 1</b> </td>')
    g.write('<td width=24% colspan=2 style="font-family:verdana"><b> Grupo 2</b></td>')
    g.write('<td width=24% colspan=2 style="font-family:verdana"><b> Grupo 3</b></td>')
    g.write('<td width=24% colspan=2 style="font-family:verdana"><b> Grupo 4</b></td></tr>')
    g.write("<tr>")
    Imagem(0, ajogar[0], sel_abrev, g)
    Imagem(0, ajogar[1], sel_abrev, g)
    Imagem(1, ajogar[0], sel_abrev, g)
    Imagem(1, ajogar[1], sel_abrev, g)
    Imagem(2, ajogar[0], sel_abrev, g)
    Imagem(2, ajogar[1], sel_abrev, g)
    Imagem(3, ajogar[0], sel_abrev, g)
    Imagem(3, ajogar[1], sel_abrev, g)
    g.write("</tr><tr>")
    Jogo(alfa, beta, 0, ajogar[0], sel, g)
    Jogo(alfa, beta, 0, ajogar[1], sel, g)
    Jogo(alfa, beta, 1, ajogar[0], sel, g)
    Jogo(alfa, beta, 1, ajogar[1], sel, g)
    Jogo(alfa, beta, 2, ajogar[0], sel, g)
    Jogo(alfa, beta, 2, ajogar[1], sel, g)
    Jogo(alfa, beta, 3, ajogar[0], sel, g)
    Jogo(alfa, beta, 3, ajogar[1], sel, g)    
    g.write("</tr><tr>")
    Imagem(0, ajogar[2], sel_abrev, g)
    Imagem(0, ajogar[3], sel_abrev, g)
    Imagem(1, ajogar[2], sel_abrev, g)
    Imagem(1, ajogar[3], sel_abrev, g)
    Imagem(2, ajogar[2], sel_abrev, g)
    Imagem(2, ajogar[3], sel_abrev, g)
    Imagem(3, ajogar[2], sel_abrev, g)
    Imagem(3, ajogar[3], sel_abrev, g)
    g.write("</tr><tr>")
    Jogo(alfa, beta, 0, ajogar[2], sel, g)
    Jogo(alfa, beta, 0, ajogar[3], sel, g)
    Jogo(alfa, beta, 1, ajogar[2], sel, g)
    Jogo(alfa, beta, 1, ajogar[3], sel, g)
    Jogo(alfa, beta, 2, ajogar[2], sel, g)
    Jogo(alfa, beta, 2, ajogar[3], sel, g)
    Jogo(alfa, beta, 3, ajogar[2], sel, g)
    Jogo(alfa, beta, 3, ajogar[3], sel, g)
    g.write("</tr><tr>")
    Imagem(0, ajogar[4], sel_abrev, g)
    Imagem(0, ajogar[5], sel_abrev, g)
    Imagem(1, ajogar[4], sel_abrev, g)
    Imagem(1, ajogar[5], sel_abrev, g)
    Imagem(2, ajogar[4], sel_abrev, g)
    Imagem(2, ajogar[5], sel_abrev, g)
    Imagem(3, ajogar[4], sel_abrev, g)
    Imagem(3, ajogar[5], sel_abrev, g)
    g.write("</tr><tr>")
    Jogo(alfa, beta, 0, ajogar[4], sel, g)
    Jogo(alfa, beta, 0, ajogar[5], sel, g)
    Jogo(alfa, beta, 1, ajogar[4], sel, g)
    Jogo(alfa, beta, 1, ajogar[5], sel, g)
    Jogo(alfa, beta, 2, ajogar[4], sel, g)
    Jogo(alfa, beta, 2, ajogar[5], sel, g)
    Jogo(alfa, beta, 3, ajogar[4], sel, g)
    Jogo(alfa, beta, 3, ajogar[5], sel, g)
    g.write("</tr><tr> <td colspan = 8 width =96%> </tr><tr>")    
    g.write('<td width=24% colspan=2 style="font-family:verdana"><b> Grupo 5</b></td>')
    g.write('<td width=24% colspan=2 style="font-family:verdana"><b> Grupo 6</b></td>')
    g.write('<td width=24% colspan=2 style="font-family:verdana"><b> Grupo 7</b></td>')
    g.write('<td width=24% colspan=2 style="font-family:verdana"><b> Grupo 8</b></td></tr>')
    g.write("<tr>")
    Imagem(4, ajogar[0], sel_abrev, g)
    Imagem(4, ajogar[1], sel_abrev, g)
    Imagem(5, ajogar[0], sel_abrev, g)
    Imagem(5, ajogar[1], sel_abrev, g)
    Imagem(6, ajogar[0], sel_abrev, g)
    Imagem(6, ajogar[1], sel_abrev, g)
    Imagem(7, ajogar[0], sel_abrev, g)
    Imagem(7, ajogar[1], sel_abrev, g)
    g.write("</tr><tr>")
    Jogo(alfa, beta, 4, ajogar[0], sel, g)
    Jogo(alfa, beta, 4, ajogar[1], sel, g)
    Jogo(alfa, beta, 5, ajogar[0], sel, g)
    Jogo(alfa, beta, 5, ajogar[1], sel, g)
    Jogo(alfa, beta, 6, ajogar[0], sel, g)
    Jogo(alfa, beta, 6, ajogar[1], sel, g)
    Jogo(alfa, beta, 7, ajogar[0], sel, g)
    Jogo(alfa, beta, 7, ajogar[1], sel, g)    
    g.write("</tr><tr>")
    Imagem(4, ajogar[2], sel_abrev, g)
    Imagem(4, ajogar[3], sel_abrev, g)
    Imagem(5, ajogar[2], sel_abrev, g)
    Imagem(5, ajogar[3], sel_abrev, g)
    Imagem(6, ajogar[2], sel_abrev, g)
    Imagem(6, ajogar[3], sel_abrev, g)
    Imagem(7, ajogar[2], sel_abrev, g)
    Imagem(7, ajogar[3], sel_abrev, g)
    g.write("</tr><tr>")
    Jogo(alfa, beta, 4, ajogar[2], sel, g)
    Jogo(alfa, beta, 4, ajogar[3], sel, g)
    Jogo(alfa, beta, 5, ajogar[2], sel, g)
    Jogo(alfa, beta, 5, ajogar[3], sel, g)
    Jogo(alfa, beta, 6, ajogar[2], sel, g)
    Jogo(alfa, beta, 6, ajogar[3], sel, g)
    Jogo(alfa, beta, 7, ajogar[2], sel, g)
    Jogo(alfa, beta, 7, ajogar[3], sel, g)
    g.write("</tr><tr>")
    Imagem(4, ajogar[4], sel_abrev, g)
    Imagem(4, ajogar[5], sel_abrev, g)
    Imagem(5, ajogar[4], sel_abrev, g)
    Imagem(5, ajogar[5], sel_abrev, g)
    Imagem(6, ajogar[4], sel_abrev, g)
    Imagem(6, ajogar[5], sel_abrev, g)
    Imagem(7, ajogar[4], sel_abrev, g)
    Imagem(7, ajogar[5], sel_abrev, g)
    g.write("</tr><tr>")
    Jogo(alfa, beta, 4, ajogar[4], sel, g)
    Jogo(alfa, beta, 4, ajogar[5], sel, g)
    Jogo(alfa, beta, 5, ajogar[4], sel, g)
    Jogo(alfa, beta, 5, ajogar[5], sel, g)
    Jogo(alfa, beta, 6, ajogar[4], sel, g)
    Jogo(alfa, beta, 6, ajogar[5], sel, g)
    Jogo(alfa, beta, 7, ajogar[4], sel, g)
    Jogo(alfa, beta, 7, ajogar[5], sel, g)
    g.write("</tr></table>")
    
    g.close()
    
#def Pagina_Probabilidades(sel, prob):
  
