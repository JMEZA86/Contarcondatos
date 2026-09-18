"""
05_provincias.py
==============================================================================
Objetivo: armar el JSON de la Capa 4 (vista por provincia) a partir del Excel
de jurisdicciones (proyecciones_jurisdicciones_2022_2040_c3_c4.xlsx):

  - Cuadro 3: esperanza de vida al nacer por sexo y jurisdicción (2025-2040)
  - Cuadro 4: tasa global de fecundidad (TGF) por jurisdicción (2025-2040)

Además incluye los valores NACIONALES (desde indicadores_nacionales.json) para
poder comparar cada provincia contra el promedio del país.

Estructura del Excel (verificada):
  Cuadro 3: fila de años = 4; col0 = provincia (desde fila 5);
            cols 1-4 = Varones (2025,2030,2035,2040); col 5 = separadora;
            cols 6-9 = Mujeres (2025,2030,2035,2040).
  Cuadro 4: col0 = provincia (desde fila 4); cols 1-4 = TGF (2025-2040).

Cómo se corre:
    python3 data/etl/05_provincias.py
Salida:
    data/processed/provincias.json
==============================================================================
"""

import json
import unicodedata
from pathlib import Path

import pandas as pd

DATA = Path(__file__).resolve().parents[1]
RAW = DATA / "raw"
PROCESSED = DATA / "processed"
XLSX = RAW / "proyecciones_jurisdicciones_2022_2040_c3_c4.xlsx"
SALIDA = PROCESSED / "provincias.json"

ANIOS = [2025, 2030, 2035, 2040]

# Mapa nombre-normalizado -> código INDEC (para poder unir con el mapa/GeoJSON
# más adelante). La clave es el nombre sin acentos y en minúsculas.
CODIGOS = {
    "ciudad autonoma de buenos aires": 2,
    "buenos aires": 6,
    "catamarca": 10,
    "cordoba": 14,
    "corrientes": 18,
    "chaco": 22,
    "chubut": 26,
    "entre rios": 30,
    "formosa": 34,
    "jujuy": 38,
    "la pampa": 42,
    "la rioja": 46,
    "mendoza": 50,
    "misiones": 54,
    "neuquen": 58,
    "rio negro": 62,
    "salta": 66,
    "san juan": 70,
    "san luis": 74,
    "santa cruz": 78,
    "santa fe": 82,
    "santiago del estero": 86,
    "tucuman": 90,
    # Tierra del Fuego puede venir con nombre largo -> se resuelve por prefijo.
}


def normalizar(texto):
    """minúsculas, sin acentos, sin espacios de más."""
    t = str(texto).strip().lower()
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")
    return " ".join(t.split())


def codigo_de(nombre):
    n = normalizar(nombre)
    if n in CODIGOS:
        return CODIGOS[n]
    if n.startswith("tierra del fuego"):
        return 94
    return None  # no reconocida


def es_provincia(valor):
    """True si la celda parece un nombre de provincia (no vacío, no encabezado)."""
    if pd.isna(valor):
        return False
    n = normalizar(valor)
    if n in ("", "jurisdiccion", "sexo", "varones", "mujeres"):
        return False
    if n.startswith("fuente") or n.startswith("cuadro"):
        return False
    return codigo_de(valor) is not None


def num(v):
    return None if pd.isna(v) else round(float(v), 2)


def main():
    # ---------- Cuadro 3: esperanza de vida ----------
    c3 = pd.read_excel(XLSX, sheet_name="Cuadro 3", header=None)
    esperanza = {}  # codigo -> {"nombre", "serie":[{anio,varones,mujeres}]}
    for _, fila in c3.iterrows():
        if not es_provincia(fila.iloc[0]):
            continue
        cod = codigo_de(fila.iloc[0])
        serie = []
        for j, anio in enumerate(ANIOS):
            serie.append(
                {
                    "anio": anio,
                    "varones": num(fila.iloc[1 + j]),   # cols 1-4
                    "mujeres": num(fila.iloc[6 + j]),   # cols 6-9 (col 5 = separadora)
                }
            )
        esperanza[cod] = {"nombre": str(fila.iloc[0]).strip(), "serie": serie}

    # ---------- Cuadro 4: fecundidad (TGF) ----------
    c4 = pd.read_excel(XLSX, sheet_name="Cuadro 4", header=None)
    fecundidad = {}  # codigo -> [{anio, valor}]
    for _, fila in c4.iterrows():
        if not es_provincia(fila.iloc[0]):
            continue
        cod = codigo_de(fila.iloc[0])
        fecundidad[cod] = [
            {"anio": anio, "valor": num(fila.iloc[1 + j])} for j, anio in enumerate(ANIOS)
        ]

    # ---------- Valores nacionales (para comparar) ----------
    nac = json.load(open(PROCESSED / "indicadores_nacionales.json", encoding="utf-8"))
    nacional = {
        "esperanza": nac["esperanza_vida"]["serie"],
        "fecundidad": nac["fecundidad"]["serie"],
    }

    # ---------- Armar la lista de provincias (ordenada por nombre) ----------
    provincias = []
    for cod in sorted(esperanza.keys()):
        provincias.append(
            {
                "codigo": cod,
                "nombre": esperanza[cod]["nombre"],
                "esperanza": esperanza[cod]["serie"],
                "fecundidad": fecundidad.get(cod, []),
            }
        )
    provincias.sort(key=lambda p: normalizar(p["nombre"]))

    salida = {
        "meta": {
            "titulo": "Indicadores por provincia — esperanza de vida y fecundidad",
            "fuente": "INDEC. Proyecciones por jurisdicción 2022–2040 (base Censo 2022).",
            "anios": ANIOS,
        },
        "nacional": nacional,
        "provincias": provincias,
    }

    PROCESSED.mkdir(parents=True, exist_ok=True)
    with open(SALIDA, "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, indent=2)

    # ---------- Reporte de control ----------
    print(f"Archivo: {SALIDA}  ({SALIDA.stat().st_size} bytes)")
    print(f"Provincias: {len(provincias)}")
    faltan = [p["nombre"] for p in provincias if p["codigo"] is None or not p["fecundidad"]]
    print("Sin código o sin fecundidad:", faltan or "ninguna")
    print("\nEjemplos (esperanza mujeres 2040 | fecundidad 2040):")
    for p in provincias[:3] + provincias[-2:]:
        e = p["esperanza"][-1]["mujeres"]
        fdato = p["fecundidad"][-1]["valor"] if p["fecundidad"] else None
        print(f"   [{p['codigo']:>2}] {p['nombre']:<35} | {e} | {fdato}")


if __name__ == "__main__":
    main()
