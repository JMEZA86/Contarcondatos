"""
04_ratio_sosten.py
==============================================================================
Objetivo: calcular el RATIO DE SOSTÉN DEMOGRÁFICO proyectado (Capa 3) a partir
de los mismos datos de INDEC de la pirámide nacional (data/processed/
piramide_nacional.json). Para cada año 2022-2040 calcula:

  - activos  = población en edad de trabajar (15 a 64 años)
  - mayores  = población de 65 años o más
  - sosten   = activos / mayores  (cuántas personas en edad activa hay por
               cada persona de 65+)  <- el número principal
  - dep_100  = mayores / activos * 100 (tasa de dependencia de mayores)

IMPORTANTE (honestidad del dato): esto es el sostén demográfico POTENCIAL
(toda la gente en edad de trabajar), no el ratio real de aportantes por
jubilado del sistema previsional. Es un proxy de la presión de fondo. En el
sistema real de ANSES había ~1,89 aportantes por beneficiario en 2023.

Cómo se corre (desde la raíz del repo):
    python3 data/etl/04_ratio_sosten.py

Salida:
    data/processed/ratio_sosten.json
==============================================================================
"""

import json
from pathlib import Path

DATA = Path(__file__).resolve().parents[1]
PROCESSED = DATA / "processed"
ENTRADA = PROCESSED / "piramide_nacional.json"
SALIDA = PROCESSED / "ratio_sosten.json"

# Límites de los tramos de edad.
ACT_MIN, ACT_MAX = 15, 64  # edad "activa" (potencialmente trabajadora)
MAYOR_MIN = 65             # 65 y más


def main():
    piramide = json.load(open(ENTRADA, encoding="utf-8"))
    anios = piramide["meta"]["anios"]

    serie = []
    for anio in anios:
        filas = piramide["piramide"][str(anio)]
        activos = sum(
            f["varones"] + f["mujeres"] for f in filas if ACT_MIN <= f["edad"] <= ACT_MAX
        )
        mayores = sum(f["varones"] + f["mujeres"] for f in filas if f["edad"] >= MAYOR_MIN)
        serie.append(
            {
                "anio": anio,
                "activos": activos,
                "mayores": mayores,
                "sosten": round(activos / mayores, 2),
                "dep_por_100": round(mayores / activos * 100, 1),
            }
        )

    primero = serie[0]
    ultimo = serie[-1]

    salida = {
        "meta": {
            "titulo": "Ratio de sostén demográfico proyectado — Total del país",
            "fuente": "Elaboración propia sobre INDEC. Proyecciones de población "
                      "2022–2040 (base Censo 2022).",
            "anios": anios,
            "definicion": "Personas en edad de trabajar (15 a 64 años) por cada "
                          "persona de 65 años o más.",
            "advertencia": "Es el sostén demográfico potencial (toda la población "
                           "en edad activa), no el ratio real de aportantes por "
                           "jubilado del sistema previsional.",
        },
        # Contexto honesto: el dato real del sistema previsional (ANSES + OPC).
        "contexto_anses": {
            "aportantes_por_beneficiario_2009": 1.72,
            "aportantes_por_beneficiario_2023": 1.89,
            "cobertura_beneficios_pct": 51.6,   # el sistema cubre el 51,6% de lo que paga
            "deficit_millones_dic2021": 144016,
            "fecha_cobertura": "diciembre 2021",
            "fuente_ratio": "ANSES, Anuario Estadístico 2008/2023, Capítulo 4.",
            "fuente_cobertura": "OPC, Estado de situación del SIPA (datos al 31/12/2021), "
                                "en base al Boletín Estadístico de la Seguridad Social de ANSES.",
            "nota": "En el sistema previsional real, el ratio aportante/beneficiario "
                    "se mantuvo estable (subió de 1,72 en 2009 a 1,89 en 2023). "
                    "Acá mostramos la presión demográfica de fondo, que sí empeora.",
        },
        "serie": serie,
        "resumen": {
            "anio_inicial": primero["anio"],
            "sosten_inicial": primero["sosten"],
            "anio_final": ultimo["anio"],
            "sosten_final": ultimo["sosten"],
            "caida_pct": round((ultimo["sosten"] / primero["sosten"] - 1) * 100, 1),
        },
    }

    with open(SALIDA, "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, indent=2)

    # Reporte de control
    print(f"Archivo: {SALIDA}  ({SALIDA.stat().st_size} bytes)")
    print("\nAño | activos (15-64) | mayores (65+) | sostén (act/mayor)")
    for d in serie:
        print(f"  {d['anio']} | {d['activos']:>11,} | {d['mayores']:>10,} | {d['sosten']}")
    print(f"\n{primero['anio']}: {primero['sosten']} activos por mayor")
    print(f"{ultimo['anio']}: {ultimo['sosten']} activos por mayor "
          f"({salida['resumen']['caida_pct']}%)")


if __name__ == "__main__":
    main()
