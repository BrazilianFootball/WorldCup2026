# -*- coding: utf-8 -*-
"""
Spyder Editor

Este é um arquivo de script temporário.
"""

import csv
import math
import numpy as np
import PIL
from PIL import Image, ImageDraw, ImageFont
#import aggdraw

def mais_provavel (alfa1, beta1, alfa2, beta2):
    l1 = alfa1/beta2
    l2 = alfa2/beta1
    g1 = math.floor(l1)
    g2 = math.floor(l2)
    prob = math.exp(-l1)*math.exp(-l2)*math.pow(l1, g1)*math.pow(l2, g2)/math.factorial(g1)/math.factorial(g2)
    return [g1, g2, prob]

def todas_probs(alfa1, beta1, alfa2, beta2):
    l1 = alfa1/beta2
    l2 = alfa2/beta1
    p_A = 0.0
    p_B = 0.0
    probs = [[0.0 for i in range(10)] for j in range(10)]
    for g1 in range(10):
        for g2 in range(10):
            probs[g1][g2] = math.exp(-l1)*math.exp(-l2)*math.pow(l1, g1)*math.pow(l2, g2)/math.factorial(g1)/math.factorial(g2)
            if g1>g2:
                p_A += probs[g1][g2]
            elif g1<g2:
                p_B += probs[g1][g2]
    return [probs, p_A, p_B]          
                
def figurinha(sel1, sel2, cod1, cod2, alfa1, beta1, alfa2, beta2):

    #im = Image.new("RGBA", (500, 650), (255, 153, 0, 255)) #Medida da imagem
    im = Image.open("base_figurinha.png")
    band1 = Image.open("bandeiras/" + cod1 + ".png")
    band2 = Image.open("bandeiras/" + cod2 + ".png")


    resultado = mais_provavel(alfa1, beta1, alfa2, beta2)
    [probs, pA, pB] = todas_probs(alfa1, beta1, alfa2, beta2)
    g1mp = resultado[0]
    g2mp = resultado[1]

    draw_aa = aggdraw.Draw(im)
    b = aggdraw.Brush((255, 255, 255), opacity=255)
    draw_aa.rectangle([10, 10, 490, 640], None, b)
    b = aggdraw.Brush((88, 140, 8), opacity=200)
    draw_aa.rectangle([10, 10, 250, 640], None, b)
    b = aggdraw.Brush((56, 89, 7), opacity=200)
    draw_aa.rectangle([250, 10, 490, 640], None, b)

    for g1 in range(5):
        for g2 in range(5):
            cx = 250 + int((g2 - g1) * 25 * math.sqrt(2))
            cy = 455 - int((g1 + g2) * 25 * math.sqrt(2))
            cor = min(math.ceil(255 * math.log((1 + probs[g1][g2] * 100), 26)),255)  #alteração para evitar overflow da cor
            b = aggdraw.Brush((255, 255 - cor, 255 - cor), opacity=230)
            draw_aa.ellipse([cx - 25, cy - 25, cx + 25, cy + 25], None, b)

    cx = 250 + int((g2mp - g1mp) * 25 * math.sqrt(2))
    cy = 455 - int((g1mp + g2mp) * 25 * math.sqrt(2))
    p = aggdraw.Pen((0, 0, 0), 4)
    draw_aa.ellipse([cx - 25, cy - 25, cx + 25, cy + 25], p, None)
    # ad.ellipse([cx-25, cy-25, cx+25, cy+25], fill = (255, 255 -cor, 255-cor, 230))

    draw_aa.flush()

    im.paste(band1.resize([84, 55], resample=PIL.Image.BICUBIC), box=[38, 42])
    im.paste(band2.resize([84, 55], resample=PIL.Image.BICUBIC), box=[480 - 97, 42])

    draw = ImageDraw.Draw(im)

    prob = str(int(100.0 * resultado[2]))
    f1 = ImageFont.truetype("arial.ttf", 16)
    draw.text([175, 28], "Placar mais provável:", font=f1, fill=(0, 0, 0, 255))
    f2 = ImageFont.truetype("arial.ttf", 46)
    sz = draw.textsize(str(g1mp) + " x " + str(g2mp), spacing=0, font=f2)
    x = 250 - sz[0] / 2
    y = 54  # 98 - sz[1]/2
    draw.text([x, y], str(g1mp) + " x " + str(g2mp), font=f2, fill=(0, 0, 0, 255))
    sz = draw.textsize("Probabilidade do placar: " + prob + "%", spacing=0, font=f1)
    x = 250 - sz[0] / 2
    y = 113
    draw.text([x, y], "Probabilidade do placar: " + prob + "%", font=f1, fill=(0, 0, 0, 255))

    
    # ajusta o arredondamento das probabilidades para a barra inferior da figura
    a = [pA * 100, (1 - pA - pB) * 100, pB * 100]
    b = [x - int(x) for x in a]
    c = [int(x) for x in a]
    if sum(c) == 98:
        if (b[0] < b[1] and b[0] < b[2]):
            c[1] += 1
            c[2] += 1
        elif (b[2] < b[1]):
            c[0] += 1
            c[1] += 1
        else:
            c[0] += 1
            c[2] += 1
    elif sum(c) == 99:
        if (b[1] > b[0] and b[1] > b[2]):
            c[1] += 1
        elif b[2] > b[0]:
            c[2] += 1
        else:
            c[0] += 1
    pA = c[0]
    pB = c[2]

    larg_empate = int(240 * (100 - pA - pB) / 100)
    larg_A = int(240 * pA / 100)
    larg_B = int(240 * pB / 100)
    draw.rectangle([250 - larg_empate / 2, 540, 250 + larg_empate / 2, 570], outline=(240, 240, 255, 255),
                   fill=(200, 200, 230, 230))
    draw.rectangle([250 - larg_empate / 2 - larg_A, 540, 250 - larg_empate / 2, 570], outline=(240, 240, 255, 255),
                   fill=(170, 170, 255, 230))
    draw.rectangle([250 + larg_empate / 2, 540, 250 + larg_empate / 2 + larg_B, 570], outline=(240, 240, 255, 255),
                   fill=(170, 170, 255, 230))

    f3 = ImageFont.truetype("arial.ttf", 14)
    sz = draw.textsize(str(int(100 - pA - pB)) + "%", spacing=0, font=f3)
    x = 250 - int(sz[0] / 2)
    y = 515  # 503
    draw.text([x, y], str(int(100 - pA - pB)) + "%", font=f3, fill=(0, 0, 0, 255))
    # sz = draw.textsize(str(int(pA)) + "%", spacing=0, font=f3)
    x = 160
    y = 515  # 503
    draw.text([x, y], str(int(pA)) + "%", font=f3, fill=(0, 0, 0, 255))
    # sz = draw.textsize(str(int(pB)) + "%", spacing=0, font=f3)
    x = 320
    y = 515  # 503
    draw.text([x, y], str(int(pB)) + "%", font=f3, fill=(0, 0, 0, 255))

    f4 = ImageFont.truetype("arial.ttf", 25)
    sz = draw.textsize(sel1, spacing=0, font=f4)
    x = 240 - sz[0]
    y = 580
    draw.text([x, y], sel1, font=f4, fill=(0, 0, 0, 255))
    sz = draw.textsize(sel2, spacing=0, font=f4)
    x = 260
    y = 580
    draw.text([x, y], sel2, font=f4, fill=(0, 0, 0, 255))
    f5 = ImageFont.truetype("arial.ttf", 10)
    for g1 in range(5):
        for g2 in range(5):
            cx = 250 + int((g2 - g1) * 25 * math.sqrt(2))
            cy = 455 - int((g1 + g2) * 25 * math.sqrt(2))
            sz = draw.textsize(str(g1) + " x " + str(g2), spacing=0, font=f5)
            x = cx - sz[0] / 2
            y = cy + 3
            draw.text([x, y], str(g1) + " x " + str(g2), font=f5, fill=(0, 0, 0, 255))
            if probs[g1][g2] >= 0.01:
                prob_text = str(int(100 * probs[g1][g2])) + "%"
            elif probs[g1][g2] >= 0.001:
                prob_text = "<1%"
            else:
                prob_text = "<0,1%"
            sz = draw.textsize(prob_text, spacing=0, font=f5)
            x = cx - sz[0] / 2
            y = cy - 11
            draw.text([x, y], prob_text, font=f5, fill=(0, 0, 0, 255))
    f6 = ImageFont.truetype("arial.ttf", 10)
    draw.text([5, 638], 'FGV-EMAp - Escola de Matemática Aplicada', font=f6, fill=(0, 0, 0, 208))
    draw.text([362, 638], 'Projeto Esporte em Números', font=f6, fill=(0, 0, 0, 208))
    im.save("confrontos/" + cod1 + "x" + cod2 + ".png")


    
figurinha("Brasil", "Espanha", "BRA" , "ESP", 3.7533, 2.0214, 1.9867, 1.5357)


