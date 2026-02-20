import re
import json
from collections import defaultdict, Counter
from datetime import datetime, timedelta
from fastapi import FastAPI, UploadFile, File
import uuid
import os
import zipfile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir HTML
app.mount("/app", StaticFiles(directory=".", html=True), name="static")
app.mount("/static", StaticFiles(directory="static"), name="static")

UPLOAD_DIR = "uploads"
RESULT_DIR = "results"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

@app.get("/")
async def root():
    return FileResponse("app/wrapped.html")

@app.post("/upload")
async def upload(file: UploadFile = File(...)):

    unique_id = str(uuid.uuid4())

    zip_path = f"{UPLOAD_DIR}/{unique_id}.zip"
    json_path = f"{RESULT_DIR}/{unique_id}.json"

    # salva zip
    with open(zip_path, "wb") as f:
        f.write(await file.read())

    # processa zip
    resultado = processar_zip(zip_path)

    # salva json final
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=4)

    return {"id": unique_id}


# ===== SUA LÓGICA ATUAL VAI AQUI =====

def processar_zip(zip_path):

    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall("temp")

    padrao_msg = re.compile(r'^(\d{2}/\d{2}/\d{4}) (\d{2}:\d{2}) - (.*?): (.*)')

    padrao_emoji = re.compile(
        "[" 
        "\U0001F300-\U0001F5FF"
        "\U0001F600-\U0001F64F"
        "\U0001F680-\U0001F6FF"
        "\U0001F700-\U0001F77F"
        "\U0001F780-\U0001F7FF"
        "\U0001F800-\U0001F8FF"
        "\U0001F900-\U0001F9FF"
        "\U0001FA00-\U0001FAFF"
        "]"
    )

    padrao_sticker = re.compile(r'(STK-\d{8}-WA\d+)\.webp', re.IGNORECASE)

    # ---------- STOPWORDS ----------
    stopwords = {
        "a","o","os","as","de","do","da","dos","das","e","é","em",
        "um","uma","pra","pro","por","com","que","na","no","nos","nas",
        "eu","vc","vcs","me","te","se","ta","to","foi","vai","ja","já","não","sim"
    }

    # --- MENSAGENS SISTEMA

    mensagens_sistema = [
        "mensagens e chamadas são protegidas",
        "adicionou",
        "removeu",
        "mudou o assunto",
        "mudou a descrição",
        "mudou a foto do grupo",
        "entrou usando este link",
        "saiu",
        "criou o grupo",
        "apagar esta mensagem",
        "está na sua lista de contatos"
    ]

    # ---------- CONTADORES ----------
    total_mensagens = 0
    mensagens_por_pessoa = defaultdict(int)
    mensagens_por_dia = defaultdict(int)

    emojis_totais = 0
    emojis_por_pessoa = defaultdict(int)
    emojis_contagem = defaultdict(int)
    emojis_por_pessoa_detalhado = defaultdict(lambda: defaultdict(int))

    palavras_por_pessoa = defaultdict(lambda: defaultdict(int))
    palavras_totais = defaultdict(int)

    emojis_por_usuario = defaultdict(Counter)

    primeiro_chat = []

    stickers_contagem = defaultdict(int)
    stickers_por_pessoa = defaultdict(lambda: defaultdict(int))

    usuarios = set()
    datas_com_mensagem = set()
    primeira_data = None
    total_palavras_conversa = 0

    # ---------- CONQUISTAS ----------
    mensagens_madrugada = 0
    total_stickers_geral = 0
    total_coracoes = 0

    # ---------- LEITURA ----------
    with open("chat-01/chat01-nomidias.txt", "r", encoding="utf-8") as arquivo:
        for linha in arquivo:
            linha = linha.strip()
            match = padrao_msg.match(linha)

            if not match:
                continue

            data, hora, autor, mensagem = match.groups()

            # ---------- PREVIEW DA PRIMEIRA CONVERSA ----------
            msg_lower = mensagem.lower()

            eh_sistema = any(frase in msg_lower for frase in mensagens_sistema)
            eh_midia = mensagem.strip().lower() in ["<mídia oculta>", "<mídia omitida>"]

            if (
                not eh_sistema
                and not eh_midia
                and len(primeiro_chat) < 10
            ):
                primeiro_chat.append({
                    "mensagem": mensagem, 
                    "autor": autor
            })


            total_mensagens += 1
            mensagens_por_pessoa[autor] += 1
            mensagens_por_dia[data] += 1
            usuarios.add(autor)
            datas_com_mensagem.add(data)

            if primeira_data is None:
                primeira_data = data

            # MADRUGADA
            hora_int = int(hora.split(":")[0])
            if 0 <= hora_int <= 5:
                mensagens_madrugada += 1

            # EMOJIS
            lista_emojis = padrao_emoji.findall(mensagem)
            emojis_totais += len(lista_emojis)
            emojis_por_pessoa[autor] += len(lista_emojis)

            for emoji in lista_emojis:
                emojis_contagem[emoji] += 1
                emojis_por_pessoa_detalhado[autor][emoji] += 1
                if "❤" in emoji:
                    total_coracoes += 1

            # PALAVRAS
            msg_limpa = padrao_emoji.sub("", mensagem)
            msg_limpa = re.sub(r"[^\w\s]", "", msg_limpa).lower()

            for palavra in msg_limpa.split():
                if palavra and palavra not in stopwords:
                    palavras_por_pessoa[autor][palavra] += 1
                    palavras_totais[palavra] += 1
                    total_palavras_conversa += 1
            
            # PRIMEIRO CHAT

            # STICKERS
            match_sticker = padrao_sticker.search(mensagem)
            if match_sticker:
                nome = match_sticker.group(1)
                stickers_contagem[nome] += 1
                stickers_por_pessoa[autor][nome] += 1
                total_stickers_geral += 1

    # ---------- PROCESSAMENTOS ----------
    quem_mais_falou = max(mensagens_por_pessoa, key=mensagens_por_pessoa.get)

    dia_mais_agitado = max(mensagens_por_dia, key=mensagens_por_dia.get)

    emoji_mais_usado = max(emojis_contagem, key=emojis_contagem.get) if emojis_contagem else None

    sticker_mais_usado = max(stickers_contagem, key=stickers_contagem.get) if stickers_contagem else None

    # EMOJI FAVORITO POR PESSOA
    emoji_favorito_por_pessoa = {}
    for p, e in emojis_por_pessoa_detalhado.items():
        if e:  # se a pessoa enviou emojis
            top_emoji = max(e, key=e.get)       # pega o emoji mais usado
            quantidade = e[top_emoji]           # pega quantas vezes ele enviou
            emoji_favorito_por_pessoa[p] = {
                "emoji": top_emoji,
                "quantidade": quantidade
            }
        else:
            emoji_favorito_por_pessoa[p] = None

    # TOP 3 EMOJIS POR PESSOA
    top3_emojis_por_usuario = {}

    for pessoa, emojis_dict in emojis_por_pessoa_detalhado.items():
        # ordena do mais usado pro menos usado
        ordenado = sorted(
            emojis_dict.items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]

        top3_emojis_por_usuario[pessoa] = [
            {
                "emoji": emoji,
                "quantidade": qtd
            }
            for emoji, qtd in ordenado
        ]

    # STICKER FAVORITO POR PESSOA
    sticker_favorito_por_pessoa = {}
    for p, s in stickers_por_pessoa.items():
        if s:  # se a pessoa enviou emojis
            top_sticker = max(s, key=s.get)       # pega o emoji mais usado
            quantidade = s[top_sticker]           # pega quantas vezes ele enviou
            sticker_favorito_por_pessoa[p] = {
                "sticker": top_sticker,
                "quantidade": quantidade
            }
        else:
            sticker_favorito_por_pessoa[p] = None


    # TOP PALAVRAS POR PESSOA
    top_palavras_por_pessoa = {
        p: sorted(pal.items(), key=lambda x: x[1], reverse=True)[:5]
        for p, pal in palavras_por_pessoa.items()
    }

    # ---------- LIVRO ----------
    PALAVRAS_POR_PAGINA = 250
    paginas = int(total_palavras_conversa / PALAVRAS_POR_PAGINA)

    livros = [
        ("O Pequeno Príncipe – Antoine de Saint-Exupéry (~96 págs)", 0, 120),
        ("A Revolução dos Bichos – George Orwell (~136 págs)", 121, 180),
        ("Harry Potter e a Pedra Filosofal – J. K. Rowling (~208 págs)", 181, 260),
        ("1984 – George Orwell (~328 págs)", 261, 360),
        ("O Senhor dos Anéis – J. R. R. Tolkien (~576 págs)", 361, 999999),
    ]

    for livro, minimo, maximo in livros:
        if minimo <= paginas <= maximo:
            livro_equivalente = livro
            break

    # ---------- MARATONA ----------
    datas_ordenadas = sorted(datetime.strptime(d, "%d/%m/%Y") for d in datas_com_mensagem)

    max_dias = seq = 1
    for i in range(1, len(datas_ordenadas)):
        if datas_ordenadas[i] - datas_ordenadas[i-1] == timedelta(days=1):
            seq += 1
            max_dias = max(max_dias, seq)
        else:
            seq = 1

    total_conquistas = 2

    fa_figurinhas_if = { 
        "quantidade": total_stickers_geral,
        "atingiu_meta": total_stickers_geral > 1000
    }

    coracao_quente = { 
        "quantidade": total_coracoes,
        "atingiu_meta": total_coracoes > 500
    }

    if fa_figurinhas_if["atingiu_meta"] == True:
        total_conquistas += 1
    else:
        total_conquistas += 0

    if coracao_quente["atingiu_meta"] == True:
        total_conquistas += 1
    else:
        total_conquistas += 0

    palavra_geral = None
    qtd_geral = 0

    for pessoa, lista in top_palavras_por_pessoa.items():
        if lista:  # garante que não está vazia
            palavra, qtd = lista[0]  # a mais usada daquela pessoa
            if qtd > qtd_geral:
                palavra_geral = palavra
                qtd_geral = qtd

    mensagens_diarias = round(total_mensagens/len(datas_com_mensagem))

    # ---------- JSON FINAL ----------
    resultado = {
        "geral": {
            "inicio_conversa": primeira_data,
            "total_mensagens": total_mensagens,
            "total_palavras": total_palavras_conversa,
            "total_emojis": emojis_totais,
            "total_stickers": total_stickers_geral,
            "total_coracoes": total_coracoes,
            "mensagens_madrugada": mensagens_madrugada,
            "top_palavra": palavra_geral,
            "primeiras_mensagens": primeiro_chat,
            "media_diaria_msg": mensagens_diarias
        },

        "participantes": {
            p: {
                "mensagens": mensagens_por_pessoa[p],
                "emojis": emojis_por_pessoa[p],
                "emoji_favorito": emoji_favorito_por_pessoa[p],
                "sticker_favorito": sticker_favorito_por_pessoa[p],
                "top_palavras": top_palavras_por_pessoa[p],
                "top_emojis": top3_emojis_por_usuario[p]
            }
            for p in usuarios
        },

        "rankings": {
            "quem_mais_falou": quem_mais_falou,
            "dia_mais_agitado": {
                "data": dia_mais_agitado,
                "mensagens": mensagens_por_dia[dia_mais_agitado]
            },
            "emoji_mais_usado": emoji_mais_usado,
            "sticker_mais_usado": sticker_mais_usado
        },

        "emojis": dict(emojis_contagem),
        "stickers": dict(stickers_contagem),

        "livro": {
            "paginas_aproximadas": paginas,
            "livro_equivalente": livro_equivalente
        },

        "conquistas": {
            "maratona_dias": max_dias,
            "fa_de_figurinha": fa_figurinhas_if,
            "coracao_quente": coracao_quente,
            "coruja_mensagens": mensagens_madrugada,
            "total_conquistas": total_conquistas
        }
    }

    return resultado

# ---------- PADRÕES ----------
