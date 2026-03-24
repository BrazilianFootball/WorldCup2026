int margemEsq = 40;
int margemSup = 40;
int numSelecoes = 220;
int[][] matrizGols;
int[] posRanking; 
int[] ranking; 
String[] nomeTime;

int[][] paleta5Cores ={
	{4, 76, 41},
    {23, 127, 47},
    {69, 191, 55},
    {151, 237, 68},
	{179,177,174},
	//{253,251,214},
	{210, 60, 60},
	{180, 60, 60},
	{150, 60, 60},
	{100, 60, 60}};
	
void setup() {
  size(1400,1400);
  
  matrizGols = new int[244][244];
  posRanking = new int[244];
  ranking = new int[244];
  nomeTime = new String[244];
  // inicializei a matriz para diferenciar 0x0 de casos em que nao houve confronto
	for (int i=0; i < 244; i++) {	
		for (int j=0; j < 244; j++) {	
			matrizGols[i][j] = -1;
		}
	}
  
  //leitura do arquivo de gols
	fill(20);
	String lines[] = loadStrings("gols1gols2.csv");
	for (int i=0; i < 4011; i++) {	
		String nums[] = split(lines[i], ';');
		if(i>0){
			matrizGols[int(nums[0])][int(nums[3])] = int(nums[1]);
			matrizGols[int(nums[3])][int(nums[0])] = int(nums[2]);
		}
	}
	String lines1[] = loadStrings("ranking.csv");
	for (int i=0; i < 244; i++) {	
		String nums[] = split(lines1[i], ';');
		if(i>0){
			posRanking[int(nums[0])] = i;
			ranking[i]=int(nums[0]);
			nomeTime[int(nums[0])]= nums[1];
		}
	}
}

void draw() {
	int sizeMark = 2;
	int afast = 1;
	background(255);
	stroke(10);
	noFill();
	rect(1,1,width-2, height-2);
	
	
	// Titulo
    textSize(16);
    textAlign(RIGHT, CENTER);
	fill(0, 2, 0);
    text("Resultados do último enfrentamento entre Seleções em um período de 4 anos", numSelecoes*4, 8+9);
	
	//Legenda mostra paleta 9 cores
	textSize(14);
	stroke(40);
	for(int i=0; i<9; i=i+1){
		fill(paleta5Cores[i][0],paleta5Cores[i][1],paleta5Cores[i][2]);
		rect(8,margemSup+18*i, 18,18);
		fill(0, 2, 0);
		textAlign(CENTER, CENTER);
		//text(">"+str(i*3), 8+20, margemSup+i*18+9); 
	}
	
	noStroke();
	//desenha o padrão de fundo com todos os resultados	
	for (int i=0; i < numSelecoes; i++) {
		for (int j=0; j < numSelecoes; j++) {	
			if(matrizGols[i][j]>-1 || matrizGols[j][i]>-1){
			drawMark(margemEsq+ 2*(sizeMark+afast)*posRanking[i], margemSup+ 2*(sizeMark+afast)*posRanking[j], i, j, sizeMark, 0, 2, 120);
		}
		} 
	}
	
	//interpreta a posição do mouse em termos do time
    int timeA;
	int timeB;
	
	timeA = ranking[int(ceil((mouseX-margemEsq)/(2*(sizeMark+afast))))];
	timeB = ranking[int(ceil((mouseY-margemSup)/(2*(sizeMark+afast))))];
	
  //interatividade das posições da matriz
  noFill();
  rect(margemEsq,margemSup,numSelecoes*2*(sizeMark+afast),numSelecoes*2*(sizeMark+afast)); //retangulo de teste da area sensivel
    if (mouseX>margemEsq && mouseX<margemEsq+numSelecoes*2*(sizeMark+afast)){
      if(mouseY>margemSup && mouseY<margemSup+numSelecoes*2*(sizeMark+afast)){
        
		//texto interativo com placar do jogo
		
        if(matrizGols[timeA][timeB]>-1 || matrizGols[timeB][timeA]>-1){
			textSize(14);
			String jogo = " || "+ matrizGols[timeB][timeA]+" X "+matrizGols[timeA][timeB]+" || ";
			int sizeMark2=6;
			if(mouseX>numSelecoes*(sizeMark+afast)){
				textAlign(RIGHT);
				fill(0, 2, 0);
				text(nomeTime[timeB]+jogo+nomeTime[timeA],mouseX,mouseY-5);
				stroke(0, 2, 0);
				//line(mouseX+10-int(sizeMark2/2), mouseY-int(sizeMark2/2), mouseX+10+2*sizeMark2, mouseY-int(sizeMark2/2));
				drawMark(mouseX+2*sizeMark2, mouseY-3*sizeMark2, timeB, timeA, sizeMark2, 0, 0, 250);
			  } else{
				textAlign(LEFT);
				fill(0, 2, 0);
				text(nomeTime[timeB]+jogo+nomeTime[timeA],mouseX,mouseY-5);
				stroke(0, 2, 0);
				//line(mouseX-10-int(sizeMark2/2), mouseY-int(sizeMark2/2), mouseX-10+2*sizeMark2, mouseY-int(sizeMark2/2));
				drawMark(mouseX-2*sizeMark2, mouseY-3*sizeMark2, timeB, timeA, sizeMark2, 0, 0, 250);
			  }
		}
    }
	}
	
	//interatividade do texto lateral e brushing
	int afastamentoTxt = 2;

	fill(240);
	int Xsensivel = margemEsq+numSelecoes*2*(sizeMark+afast)+4;
	rect(Xsensivel, margemSup, width-margemEsq-numSelecoes*2*(sizeMark+afast)-8, numSelecoes*2*(sizeMark+afast));
	
	if (mouseX>Xsensivel && mouseX<Xsensivel+width-margemEsq-numSelecoes*2*(sizeMark+afast)-8){
		if(mouseY>margemSup && mouseY<margemSup+numSelecoes*2*(sizeMark+afast)){
			
			timeB=ranking[int(ceil((mouseY-margemSup)/(2*(sizeMark+afast))))];
			//brushing dos resultados dos jogos da selecao selecionada iterativamente (linha e coluna correspondentes da matriz)
			//strokeWeight(1);
			//stroke(150, 150, 150, 80);
			noStroke();
			fill(255, 255, 255, 220);
			rect(margemEsq+2, margemSup +sizeMark + 2*(sizeMark+afast)*posRanking[timeB]-5*2*sizeMark, numSelecoes*2*(sizeMark+afast)-2, 12*2*(sizeMark));
			//for(i=0; i<1; i++){
			//	line(margemEsq+3, margemSup+sizeMark + 2*(sizeMark+afast)*posRanking[timeB]-i*2*sizeMark, margemEsq+numSelecoes*2*(sizeMark+afast)-3, margemSup+sizeMark + 2*(sizeMark+afast)*posRanking[timeB]-i*2*sizeMark);
			//}
			  for (int i = 1; i < numSelecoes; i = i+1){
				if(matrizGols[i][timeB]>-1){
					drawMark(margemEsq+int(sizeMark/2)+ 2*(sizeMark+afast)*posRanking[i], margemSup+ 2*(sizeMark+afast)*posRanking[timeB], timeB, i, 5, 0, 0, 255); 
				}
			  }	
			textSize(18);
			textAlign(RIGHT, CENTER);
			fill(0, 60, 103);
			text(nomeTime[timeB], mouseX+afastamentoTxt, margemSup-2*sizeMark+ 2*(sizeMark+afast)*posRanking[timeB]);
			
			textSize(14);
			if (timeB==1){
			  fill(0, 60, 103, 100);
			  timeB=ranking[int(ceil((mouseY-margemSup)/(2*(sizeMark+afast))))+1];
			  text(nomeTime[timeB], mouseX+afastamentoTxt, mouseY+15);
			  textSize(12);
			  timeB=ranking[int(ceil((mouseY-margemSup)/(2*(sizeMark+afast))))+2];
			  text(nomeTime[timeB], mouseX+afastamentoTxt, mouseY+30);
			}
			if (timeB>1 && timeB<(numSelecoes-1)){
			  fill(0, 60, 103, 100);
			  timeB=ranking[int(ceil((mouseY-margemSup)/(2*(sizeMark+afast))))+1];
			  text(nomeTime[timeB], mouseX+afastamentoTxt, mouseY+15);
			  timeB=ranking[int(ceil((mouseY-margemSup)/(2*(sizeMark+afast))))-1];
			  text(nomeTime[timeB], mouseX+afastamentoTxt, mouseY-15);
			}
			if (timeB==numSelecoes){
			  fill(0, 60, 103, 100);
			  timeB=ranking[int(ceil((mouseY-margemSup)/(2*(sizeMark+afast))))-1];
			  text(nomeTime[timeB], mouseX+afastamentoTxt, mouseY-15);
			  textSize(12);
			  timeB=ranking[int(ceil((mouseY-margemSup)/(2*(sizeMark+afast))))-2];
			  text(nomeTime[timeB], mouseX+afastamentoTxt, mouseY-30);
			}
			
				
		}
	}
}

void drawMark(int xM, int yM, int time_i, int time_j, int sizeM, int orientM, int typeM, int alphaM){	
    /*
	sizeM --- de preferencia um numero par
	orientM --- pode ter valores: 0, 1, 2 ou 3
	typeMark --- 0 -> bolas | 1 -> barras
	*/	
	// desenha a marca com orientacao orientM
	int Ox, Oy;
	int cor1,cor2;
	int gols_1 = matrizGols[time_i][time_j];
	int gols_2 = matrizGols[time_j][time_i];
	
	if (typeM == 0){ //bolas
		
		strokeWeight(1);
		stroke(140);
		noFill();
		rect(xM-int(sizeM/2), yM+int(sizeM/2), 2*sizeM, sizeM);
		//line(xM, yM, xM+2*sizeM, yM);
		noStroke();
		
		if(gols_1>-1){
			if(gols_1==0){
				fill(140);
				ellipse(xM, yM+sizeM, sizeM, sizeM);
				
			}else{
				//fill(100);
				//fill(69, 191, 55);
				fill(23, 127, 47);
				for(int i=0; i<gols_1; i=i+1){
					ellipse(xM, yM-1-i*sizeM, sizeM, sizeM);
					
				}
			}
		}
		
		if(gols_2>-1){
			if(gols_2==0){ 
				fill(140);
				ellipse(xM+sizeM, yM+sizeM, sizeM, sizeM);
			}else{
				//fill(100);
				fill(210, 60, 60);
				for(int i=0; i<gols_2; i=i+1){
					ellipse(xM+sizeM, yM+2*sizeM+i*sizeM, sizeM, sizeM);
				}
			}
		}
	} 

	
	if(typeM==2){ //ellipse
	// definir a cor levando em conta o time vencedor
	// gols1 é referente ao time na linha da matriz
	// gols2 é referente ao time na coluna da matriz
		if(gols_1>gols_2){
			if(gols_1==0) {cor1 =4;}
			if(gols_1>=1 && gols_1<4){cor1 =3;}
			if(gols_1>=4 && gols_1<7){cor1 =2;}
			if(gols_1>=7 && gols_1<10){cor1 =1;}
			if(gols_1>=10){cor1 =0;}
			fill(paleta5Cores[cor1][0],paleta5Cores[cor1][1],paleta5Cores[cor1][2], alphaM);
			
			if(gols_2==0) {cor2 =4;}
			if(gols_2>=1 && gols_2<4){cor2 =5;}
			if(gols_2>=4 && gols_2<7){cor2 =6;}
			if(gols_2>=7 && gols_2<10){cor2 =7;}
			if(gols_2>=10){cor2 =8;}
			fill(paleta5Cores[cor2][0],paleta5Cores[cor2][1],paleta5Cores[cor2][2], alphaM);
		}else{
			if(gols_1==0) {cor1 =4;}
			if(gols_1>=1 && gols_1<4){cor1 =5;}
			if(gols_1>=4 && gols_1<7){cor1 =6;}
			if(gols_1>=7 && gols_1<10){cor1 =7;}
			if(gols_1>=10){cor1 =8;}
			fill(paleta5Cores[cor1][0],paleta5Cores[cor1][1],paleta5Cores[cor1][2], alphaM);
			
			if(gols_2==0) {cor2 =4;}
			if(gols_2>=1 && gols_2<4){cor2 =3;}
			if(gols_2>=4 && gols_2<7){cor2 =2;}
			if(gols_2>=7 && gols_2<10){cor2 =1;}
			if(gols_2>=10){cor2 =0;}
			fill(paleta5Cores[cor2][0],paleta5Cores[cor2][1],paleta5Cores[cor2][2], alphaM);
		}
	
		if(gols_1> -1 || gols_2> -1){		
				ellipse(xM, yM, 2*sizeM+2*gols_1, 2*sizeM+2*gols_2);		
			}
	}
	
}