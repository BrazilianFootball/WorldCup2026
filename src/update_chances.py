import csv
import json
import re

# Mapping of team names to emojis based on the existing table
# (Add any future countries here if necessary)
FLAG_MAPPING = {
    'Argentina': '🇦🇷', 'Espanha': '🇪🇸', 'Brasil': '🇧🇷', 'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'França': '🇫🇷', 'Colômbia': '🇨🇴', 'Marrocos': '🇲🇦', 'Portugal': '🇵🇹',
    'Alemanha': '🇩🇪', 'Japão': '🇯🇵', 'Uruguai': '🇺🇾', 'Países Baixos': '🇳🇱',
    'Equador': '🇪🇨', 'Bélgica': '🇧🇪', 'Noruega': '🇳🇴', 'Croácia': '🇭🇷',
    'Suíça': '🇨🇭', 'Senegal': '🇸🇳', 'México': '🇲🇽', 'Canadá': '🇨🇦',
    'Austrália': '🇦🇺', 'Áustria': '🇦🇹', 'Argélia': '🇩🇿', 'Irã': '🇮🇷',
    'Paraguai': '🇵🇾', 'Egito': '🇪🇬', 'Turquia': '🇹🇷', 'Costa do Marfim': '🇨🇮',
    'EUA': '🇺🇸', 'Escócia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Coreia do Sul': '🇰🇷', 'Tchéquia': '🇨🇿',
    'Uzbequistão': '🇺🇿', 'Tunísia': '🇹🇳', 'Suécia': '🇸🇪', 'República Democrática do Congo': '🇨🇩',
    'Jordânia': '🇯🇴', 'Gana': '🇬🇭', 'Arábia Saudita': '🇸🇦', 'Panamá': '🇵🇦',
    'Bósnia e Herzegovina': '🇧🇦', 'Iraque': '🇮🇶', 'Nova Zelândia': '🇳🇿',
    'África do Sul': '🇿🇦', 'Cabo Verde': '🇨🇻', 'Catar': '🇶🇦', 'Curaçao': '🇨🇼',
    'Haiti': '🇭🇹'
}

def get_flag(team_name):
    return FLAG_MAPPING.get(team_name, '🏳️')

def update_html():
    csv_file = 'data/summary.csv'
    html_file = 'docs/chances.html'
    
    data = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            team = row['team']
            data.append({
                'pos': int(row['position']),
                'team': team,
                'flag': get_flag(team),
                'champ': float(row['champion']),
                'final': float(row['final']),
                'semi': float(row['semifinals']),
                'qf': float(row['quarterfinals']),
                'r16': float(row['round_of_16']),
                'r32': float(row['round_of_32'])
            })
            
    # Format the data as JS string
    js_data = "                        const data = [\n"
    rows = []
    for d in data:
        rows.append(f"                            {{pos: {d['pos']}, team: '{d['team']}', flag: '{d['flag']}', champ: {d['champ']}, final: {d['final']}, semi: {d['semi']}, qf: {d['qf']}, r16: {d['r16']}, r32: {d['r32']}}}")
    js_data += ",\n".join(rows)
    js_data += "\n                        ];"
    
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
        
    # Replace the content between // -- DATA START -- and // -- DATA END --
    pattern = r'(// -- DATA START --).*?(// -- DATA END --)'
    replacement = f'\\1\n{js_data}\n                        \\2'
    
    new_html = re.sub(pattern, replacement, html_content, flags=re.DOTALL)
    
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(new_html)
        
    print("Successfully updated chances.html with latest data from summary.csv")

if __name__ == '__main__':
    update_html()
