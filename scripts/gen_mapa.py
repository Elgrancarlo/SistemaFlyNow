"""Gera os assets do mapa do Brasil para a página Meu Pedido.

Entrada:  br-uf.geojson (IBGE, malha das UFs, qualidade mínima)
          municipios.csv (kelvins/municipios-brasileiros: nome, lat, lng, codigo_uf)
Saída:    lib/meupedido/mapa-brasil.ts  — paths SVG das UFs + projeção lat/lng→x,y
          lib/meupedido/municipios.json — {"CIDADE|UF": [lat, lng]} normalizado
"""
import csv
import json
import math
import unicodedata

SCRATCH = "/private/tmp/claude-501/-Users-carlosfelipe/c9d58800-0eef-4352-b8ff-0ef10960ffc6/scratchpad"
REPO = "/Users/carlosfelipe/Desktop/APP PEDIDOS - FLYNOW/app-pedidos-flynow"

UF_BY_CODAREA = {
    "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
    "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL",
    "28": "SE", "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP",
    "41": "PR", "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF",
}

geo = json.load(open(f"{SCRATCH}/br-uf.geojson"))

# Bounds reais do Brasil a partir do próprio geojson
min_lng = min_lat = 1e9
max_lng = max_lat = -1e9
def walk(coords):
    global min_lng, max_lng, min_lat, max_lat
    if isinstance(coords[0], (int, float)):
        lng, lat = coords[0], coords[1]
        min_lng, max_lng = min(min_lng, lng), max(max_lng, lng)
        min_lat, max_lat = min(min_lat, lat), max(max_lat, lat)
    else:
        for c in coords:
            walk(c)
for f in geo["features"]:
    walk(f["geometry"]["coordinates"])

# Projeção equiretangular com correção de aspecto na latitude média
MID_LAT = math.radians((min_lat + max_lat) / 2)
W = 1000.0
K = W / (max_lng - min_lng)
H = (max_lat - min_lat) * K / math.cos(MID_LAT)

def project(lng, lat):
    x = (lng - min_lng) * K
    y = (max_lat - lat) * K / math.cos(MID_LAT)
    return round(x, 1), round(y, 1)

def ring_to_path(ring):
    pts = [project(lng, lat) for lng, lat in ring]
    # simplifica pontos consecutivos idênticos após arredondamento
    out = [pts[0]]
    for p in pts[1:]:
        if p != out[-1]:
            out.append(p)
    d = f"M{out[0][0]} {out[0][1]}"
    for x, y in out[1:]:
        d += f"L{x} {y}"
    return d + "Z"

paths = []
for f in geo["features"]:
    sigla = UF_BY_CODAREA.get(f["properties"]["codarea"], f["properties"]["codarea"])
    g = f["geometry"]
    rings = []
    if g["type"] == "Polygon":
        rings = [g["coordinates"][0]]
    elif g["type"] == "MultiPolygon":
        rings = [poly[0] for poly in g["coordinates"]]
    d = "".join(ring_to_path(r) for r in rings)
    paths.append((sigla, d))

ts = [
    "// GERADO por scripts/gen_mapa.py — malha das UFs (IBGE, qualidade mínima) já projetada.",
    "// Projeção equiretangular; use projetar(lat, lng) para posicionar pins no mesmo plano.",
    f"export const MAPA_VIEWBOX = {{ w: {round(W, 1)}, h: {round(H, 1)} }};",
    f"const MIN_LNG = {min_lng};",
    f"const MAX_LAT = {max_lat};",
    f"const K = {K};",
    f"const COS_MID = {math.cos(MID_LAT)};",
    "",
    "export function projetar(lat: number, lng: number): { x: number; y: number } {",
    "  return { x: (lng - MIN_LNG) * K, y: (MAX_LAT - lat) * (K / COS_MID) };",
    "}",
    "",
    "export const UF_PATHS: { uf: string; d: string }[] = [",
]
for sigla, d in paths:
    ts.append(f'  {{ uf: "{sigla}", d: "{d}" }},')
ts.append("];")

import os
os.makedirs(f"{REPO}/lib/meupedido", exist_ok=True)
open(f"{REPO}/lib/meupedido/mapa-brasil.ts", "w").write("\n".join(ts) + "\n")

def norm(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.upper().strip()

SIGLA_BY_COD_UF = {int(k): v for k, v in UF_BY_CODAREA.items()}
munis = {}
for row in csv.DictReader(open(f"{SCRATCH}/municipios.csv")):
    uf = SIGLA_BY_COD_UF[int(row["codigo_uf"])]
    key = f"{norm(row['nome'])}|{uf}"
    munis[key] = [round(float(row["latitude"]), 4), round(float(row["longitude"]), 4)]

json.dump(munis, open(f"{REPO}/lib/meupedido/municipios.json", "w"), ensure_ascii=False, separators=(",", ":"))

size_ts = os.path.getsize(f"{REPO}/lib/meupedido/mapa-brasil.ts")
size_js = os.path.getsize(f"{REPO}/lib/meupedido/municipios.json")
print(f"mapa-brasil.ts: {size_ts/1024:.0f} KB | municipios.json: {size_js/1024:.0f} KB | municipios: {len(munis)}")
print("viewBox:", round(W,1), round(H,1))
