"""
02_limpiar.py
==============================================================================
Objetivo: tomar el CSV crudo de población nacional (data/raw) y dejar un JSON
limpio y liviano en data/processed, listo para dibujar la PIRÁMIDE NACIONAL
(gráfico ancla, capa 1) con D3 en el front.

Este es el primer paso del ETL "de verdad": ya no exploramos, transformamos.
Se apoya en lo que descubrimos en HALLAZGOS.md.

Cómo se corre (desde la raíz del repo):
    python3 data/etl/02_limpiar.py

Salida:
    data/processed/piramide_nacional.json
==============================================================================
"""

import json
from pathlib import Path

import pandas as pd


# ---------------------------------------------------------------------------
# 1) Rutas de entrada y salida.
# ---------------------------------------------------------------------------
# parents[1] sube de data/etl/ a data/. Así el script funciona desde cualquier lado.
DATA = Path(__file__).resolve().parents[1]
RAW = DATA / "raw"
PROCESSED = DATA / "processed"

ARCHIVO_ENTRADA = RAW / "proyecciones_nacionales_2022_2040_base.csv"
ARCHIVO_SALIDA = PROCESSED / "piramide_nacional.json"


# ---------------------------------------------------------------------------
# 2) Diccionario para traducir el código de Sexo a una palabra.
# ---------------------------------------------------------------------------
# En HALLAZGOS.md confirmamos: 1 = varones, 2 = mujeres (convención INDEC).
SEXO = {1: "varones", 2: "mujeres"}


def main():
    # -----------------------------------------------------------------------
    # 3) Leer el CSV crudo.
    # -----------------------------------------------------------------------
    # sep=";" porque el archivo usa punto y coma. encoding="utf-8" porque ya
    # verificamos que se lee bien así.
    df = pd.read_csv(ARCHIVO_ENTRADA, sep=";", encoding="utf-8")

    # Por prolijidad, sacamos espacios de los nombres de columna (este archivo
    # no los tiene, pero cuesta cero y nos protege si cambian).
    df.columns = [c.strip() for c in df.columns]

    print(f"Leídas {len(df)} filas de {ARCHIVO_ENTRADA.name}")
    print(f"Columnas: {list(df.columns)}")

    # -----------------------------------------------------------------------
    # 4) Chequeos de calidad (que los datos sean lo que esperamos).
    # -----------------------------------------------------------------------
    # Si algo no cuadra, mejor enterarnos ACÁ y no en el navegador.
    assert set(df["Sexo"].unique()) == {1, 2}, "Sexo debería ser solo 1 y 2"
    assert df["Poblacion"].isna().sum() == 0, "No debería haber población nula"
    assert (df["Poblacion"] >= 0).all(), "La población no puede ser negativa"
    print("Chequeos OK: sexo 1/2, sin nulos, población no negativa.")

    # -----------------------------------------------------------------------
    # 5) Traducir el código de sexo a palabra ("varones" / "mujeres").
    # -----------------------------------------------------------------------
    df["sexo_nombre"] = df["Sexo"].map(SEXO)

    # -----------------------------------------------------------------------
    # 6) Reordenar la tabla a lo que necesita la pirámide.
    # -----------------------------------------------------------------------
    # Una pirámide, por año, necesita para cada edad: cuántos varones y cuántas
    # mujeres. Hoy tenemos una fila por (edad, sexo, año). Con "pivot" pasamos
    # el sexo a columnas: quedan columnas "varones" y "mujeres".
    tabla = df.pivot_table(
        index=["Fecha", "Edad"],   # una fila por año+edad
        columns="sexo_nombre",     # el sexo se abre en columnas
        values="Poblacion",        # el valor de cada celda es la población
        aggfunc="sum",             # (por si hubiera duplicados; no debería)
    ).reset_index()

    # pivot_table deja un "nombre" raro en el eje de columnas; lo limpiamos.
    tabla.columns.name = None

    # Nos aseguramos de que existan ambas columnas y sean enteros.
    for col in ["varones", "mujeres"]:
        tabla[col] = tabla[col].fillna(0).astype(int)

    # -----------------------------------------------------------------------
    # 7) Armar la estructura final del JSON.
    # -----------------------------------------------------------------------
    # Elegimos agrupar por AÑO, porque el slider del front va a pedir "dame la
    # pirámide del año X". Formato:
    #
    #   {
    #     "meta": {...},
    #     "piramide": {
    #        "2022": [ {"edad":0,"varones":244479,"mujeres":...}, ... ],
    #        "2023": [ ... ],
    #        ...
    #     }
    #   }
    #
    # Nota: guardamos los valores en POSITIVO. Que las mujeres vayan a la
    # izquierda y los varones a la derecha (o al revés) es decisión del gráfico,
    # no del dato. D3 se encarga de invertir un lado al dibujar.
    anios = sorted(tabla["Fecha"].unique().tolist())
    edades = sorted(tabla["Edad"].unique().tolist())

    piramide = {}
    for anio in anios:
        # Filtramos el año y lo ordenamos por edad ascendente (0 abajo, 100 arriba).
        sub = tabla[tabla["Fecha"] == anio].sort_values("Edad")
        piramide[str(anio)] = [
            {
                "edad": int(fila["Edad"]),
                "varones": int(fila["varones"]),
                "mujeres": int(fila["mujeres"]),
            }
            for _, fila in sub.iterrows()
        ]

    salida = {
        "meta": {
            "titulo": "Población por edad y sexo — Total del país",
            "fuente": "INDEC. Estimaciones y proyecciones de población 2022–2040, "
                      "base Censo 2022.",
            "anios": anios,
            "edad_min": int(min(edades)),
            "edad_max": int(max(edades)),
            "nota_edad": "La edad 100 incluye '100 y más'.",
            "unidad": "personas",
        },
        "piramide": piramide,
    }

    # -----------------------------------------------------------------------
    # 8) Guardar el JSON.
    # -----------------------------------------------------------------------
    # ensure_ascii=False para que los acentos se guarden como acentos (á, ñ)
    # y no como códigos feos. indent=2 para que sea legible si lo abrimos.
    PROCESSED.mkdir(parents=True, exist_ok=True)
    with open(ARCHIVO_SALIDA, "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, indent=2)

    # -----------------------------------------------------------------------
    # 9) Mini reporte para confirmar que salió bien.
    # -----------------------------------------------------------------------
    peso_kb = ARCHIVO_SALIDA.stat().st_size / 1024
    print("\n--- Listo ---")
    print(f"Años exportados: {anios[0]}–{anios[-1]} ({len(anios)} años)")
    print(f"Edades por año: {len(edades)} (de {min(edades)} a {max(edades)})")
    print(f"Archivo: {ARCHIVO_SALIDA}  ({peso_kb:.1f} KB)")

    # Dato de control: población total en el primer y último año, para ver que
    # los números tengan sentido (deberían ser decenas de millones).
    total_2022 = tabla[tabla["Fecha"] == anios[0]][["varones", "mujeres"]].sum().sum()
    total_2040 = tabla[tabla["Fecha"] == anios[-1]][["varones", "mujeres"]].sum().sum()
    print(f"Población total {anios[0]}: {total_2022:,.0f}")
    print(f"Población total {anios[-1]}: {total_2040:,.0f}")


if __name__ == "__main__":
    main()
