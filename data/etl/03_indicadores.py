"""
03_indicadores.py
==============================================================================
Objetivo: extraer del Excel nacional (proyecciones_nacionales_2022_2040_c3_6.xlsx)
los indicadores de la Capa 2 ("Por qué cambia") y dejarlos en un JSON limpio:

  - Fecundidad (TGF, hijos por mujer)      -> Cuadro 6
  - Natalidad y mortalidad (por mil)       -> Cuadro 3
  - Esperanza de vida al nacer (por sexo)  -> Cuadro 5

Los Excel de INDEC traen títulos y notas ARRIBA de cada tabla, y una fila
"Fuente:" al final. Para no depender de la posición exacta de los encabezados,
leemos cada hoja "en crudo" (header=None) y buscamos las filas cuyo primer
valor es uno de los años (2025, 2030, 2035, 2040).

Cómo se corre (desde la raíz del repo):
    python3 data/etl/03_indicadores.py

Salida:
    data/processed/indicadores_nacionales.json
==============================================================================
"""

import json
from pathlib import Path

import pandas as pd

DATA = Path(__file__).resolve().parents[1]
RAW = DATA / "raw"
PROCESSED = DATA / "processed"
ENTRADA = RAW / "proyecciones_nacionales_2022_2040_c3_6.xlsx"
SALIDA = PROCESSED / "indicadores_nacionales.json"

# Los 4 años que traen estos cuadros.
ANIOS = [2025, 2030, 2035, 2040]


def a_numero(valor):
    """Convierte una celda a float; si está vacía o no es número, devuelve None."""
    if pd.isna(valor):
        return None
    try:
        return round(float(valor), 2)
    except (TypeError, ValueError):
        return None


def filas_por_anio(hoja):
    """Lee una hoja en crudo y devuelve un dict {anio: fila_como_lista}.
    'fila_como_lista' son los valores de esa fila (col 0, 1, 2, ...)."""
    crudo = pd.read_excel(ENTRADA, sheet_name=hoja, header=None)
    out = {}
    for _, fila in crudo.iterrows():
        primera = a_numero(fila.iloc[0])
        # Si la primera celda es uno de nuestros años, guardamos la fila.
        if primera is not None and int(primera) in ANIOS:
            out[int(primera)] = list(fila)
    return out


def main():
    # --- Cuadro 3: natalidad (col 3) y mortalidad (col 4) ---
    # Columnas: 0=Años, 1=Crec. total, 2=Crec. vegetativo, 3=Natalidad,
    #           4=Mortalidad, 5=Migración neta.
    c3 = filas_por_anio("Cuadro 3")
    natalidad = [{"anio": a, "valor": a_numero(c3[a][3])} for a in ANIOS]
    mortalidad = [{"anio": a, "valor": a_numero(c3[a][4])} for a in ANIOS]

    # --- Cuadro 5: esperanza de vida (col 1=Varones, col 2=Mujeres) ---
    c5 = filas_por_anio("Cuadro 5")
    esperanza = [
        {"anio": a, "varones": a_numero(c5[a][1]), "mujeres": a_numero(c5[a][2])}
        for a in ANIOS
    ]

    # --- Cuadro 6: fecundidad / TGF (col 1) ---
    c6 = filas_por_anio("Cuadro 6")
    fecundidad = [{"anio": a, "valor": a_numero(c6[a][1])} for a in ANIOS]

    salida = {
        "meta": {
            "titulo": "Indicadores demográficos — Total del país",
            "fuente": "INDEC. Estimaciones y proyecciones de población 2022–2040, "
                      "base Censo 2022 (cuadros 3, 5 y 6).",
            "anios": ANIOS,
            "nota": "Los cuadros de INDEC solo publican estos 4 años.",
        },
        "fecundidad": {
            "unidad": "hijos por mujer",
            "nivel_reemplazo": 2.1,
            "descripcion": "Tasa global de fecundidad (TGF): hijos promedio por "
                           "mujer. Debajo de 2,1 la población no se renueva sola.",
            "serie": fecundidad,
        },
        "natalidad": {
            "unidad": "nacimientos por mil habitantes",
            "serie": natalidad,
        },
        "mortalidad": {
            "unidad": "muertes por mil habitantes",
            "serie": mortalidad,
        },
        "esperanza_vida": {
            "unidad": "años al nacer",
            "descripcion": "Cuántos años se espera que viva, en promedio, una "
                           "persona nacida ese año.",
            "serie": esperanza,
        },
    }

    PROCESSED.mkdir(parents=True, exist_ok=True)
    with open(SALIDA, "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, indent=2)

    # --- Reporte de control ---
    print(f"Archivo: {SALIDA}  ({SALIDA.stat().st_size} bytes)")
    print("\nFecundidad (hijos por mujer):")
    for d in fecundidad:
        print(f"   {d['anio']}: {d['valor']}")
    print("\nNatalidad (por mil):")
    for d in natalidad:
        print(f"   {d['anio']}: {d['valor']}")
    print("\nEsperanza de vida (años):")
    for d in esperanza:
        print(f"   {d['anio']}: varones {d['varones']} | mujeres {d['mujeres']}")


if __name__ == "__main__":
    main()
