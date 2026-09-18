"""
01_explorar.py
==============================================================================
Objetivo: mirar la estructura REAL de los 4 archivos de INDEC que están en
data/raw/, ANTES de escribir cualquier limpieza. No transforma nada: solo
lee e imprime qué hay adentro (columnas, tipos, valores posibles, años, nulos
y, en los Excel, las hojas). Con esto después definimos el ETL definitivo.

Cómo se corre (desde la raíz del repo):
    python3 data/etl/01_explorar.py

Está pensado para leerse de arriba a abajo. Cada bloque tiene un comentario
que explica qué hace y por qué.
==============================================================================
"""

# pandas es la librería estándar de Python para trabajar con tablas de datos.
# La importamos con el apodo "pd", que es la convención universal.
import pandas as pd

# pathlib nos deja construir rutas de archivos de forma prolija y que funciona
# igual en Windows, Mac o Linux.
from pathlib import Path


# ---------------------------------------------------------------------------
# 1) Ubicar la carpeta de datos crudos (data/raw) sin importar desde dónde
#    se ejecute el script.
# ---------------------------------------------------------------------------
# __file__ es la ruta de ESTE archivo (data/etl/01_explorar.py).
# .resolve() la vuelve absoluta; .parents[1] sube dos niveles (de etl/ a data/).
RAW = Path(__file__).resolve().parents[1] / "raw"


# ---------------------------------------------------------------------------
# 2) Una función auxiliar para imprimir títulos separados, así el output
#    en la terminal se lee ordenado.
# ---------------------------------------------------------------------------
def titulo(texto):
    print("\n" + "=" * 78)
    print(texto)
    print("=" * 78)


# ---------------------------------------------------------------------------
# 3) Explorar un archivo CSV.
# ---------------------------------------------------------------------------
# Los dos CSV de INDEC usan punto y coma (;) como separador, no coma. Por eso
# le pasamos sep=";". También probamos el encoding: los archivos parecen ASCII,
# pero por las dudas usamos utf-8 y, si falla, latin-1 (típico en datos ARG).
def explorar_csv(nombre_archivo):
    ruta = RAW / nombre_archivo
    titulo(f"CSV: {nombre_archivo}")

    # Intentamos leer con utf-8; si explota por un caracter raro, usamos latin-1.
    try:
        df = pd.read_csv(ruta, sep=";", encoding="utf-8")
        encoding_usado = "utf-8"
    except UnicodeDecodeError:
        df = pd.read_csv(ruta, sep=";", encoding="latin-1")
        encoding_usado = "latin-1"

    # Los nombres de columna del archivo de jurisdicciones vienen con espacios
    # (" Jurisdiccion "). Los mostramos TAL CUAL están (con las comillas para
    # que se noten los espacios) porque eso hay que saberlo para limpiar después.
    print(f"Encoding leído OK con: {encoding_usado}")
    print(f"Filas x Columnas: {df.shape[0]} filas, {df.shape[1]} columnas")
    print("\nNombres de columna EXACTOS (entre comillas se ven los espacios):")
    for col in df.columns:
        print(f"   '{col}'  -> tipo detectado: {df[col].dtype}")

    # A partir de acá limpiamos los nombres (sacamos espacios de los bordes)
    # SOLO para poder explorar cómodos. El archivo original no se toca.
    df.columns = [c.strip() for c in df.columns]

    # Mostramos las primeras filas para tener una foto del contenido.
    print("\nPrimeras 5 filas:")
    print(df.head().to_string(index=False))

    # Para cada columna, mostramos cuántos valores distintos tiene. Si son pocos
    # (<= 30), los listamos: sirve para descubrir los códigos de Sexo, las
    # jurisdicciones y los años disponibles.
    print("\nValores únicos por columna:")
    for col in df.columns:
        valores = df[col].dropna().unique()
        cantidad = len(valores)
        if cantidad <= 30:
            # Ordenamos para que se lea prolijo (si se puede ordenar).
            try:
                valores_ordenados = sorted(valores.tolist())
            except TypeError:
                valores_ordenados = valores.tolist()
            print(f"   {col}: {cantidad} distintos -> {valores_ordenados}")
        else:
            # Si son muchos (ej: población), mostramos solo el rango min-max.
            print(f"   {col}: {cantidad} distintos (min={df[col].min()}, max={df[col].max()})")

    # Nulos: cuántas celdas vacías hay por columna. Si hay, hay que decidir
    # qué hacer con ellas en la limpieza.
    print("\nNulos por columna:")
    print(df.isna().sum().to_string())

    return df


# ---------------------------------------------------------------------------
# 4) Explorar un archivo Excel (.xlsx).
# ---------------------------------------------------------------------------
# Un Excel puede tener VARIAS hojas (pestañas). Primero listamos las hojas y
# después mostramos las primeras filas de cada una para entender qué trae.
def explorar_xlsx(nombre_archivo):
    ruta = RAW / nombre_archivo
    titulo(f"EXCEL: {nombre_archivo}")

    # pd.ExcelFile abre el archivo y nos deja ver los nombres de las hojas
    # sin cargar todo a memoria.
    xls = pd.ExcelFile(ruta)
    print(f"Cantidad de hojas: {len(xls.sheet_names)}")
    print(f"Nombres de las hojas: {xls.sheet_names}")

    # Recorremos hoja por hoja.
    for hoja in xls.sheet_names:
        print("\n" + "-" * 70)
        print(f"HOJA: '{hoja}'")
        print("-" * 70)

        # Leemos la hoja SIN asumir dónde está el encabezado (header=None),
        # porque los Excel de INDEC suelen tener títulos y notas arriba de la
        # tabla real. Así vemos las primeras filas crudas y ubicamos dónde
        # empieza de verdad la tabla.
        crudo = pd.read_excel(ruta, sheet_name=hoja, header=None)
        print(f"Filas x Columnas (crudo, sin interpretar encabezado): "
              f"{crudo.shape[0]} x {crudo.shape[1]}")
        print("\nPrimeras 12 filas (crudas, tal cual el Excel):")
        # to_string muestra la tabla completa sin cortar columnas.
        print(crudo.head(12).to_string(index=False, header=False))


# ---------------------------------------------------------------------------
# 5) Programa principal: recorrer los 4 archivos.
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # --- Los dos CSV (población por sexo y edad) ---
    explorar_csv("proyecciones_nacionales_2022_2040_base.csv")
    explorar_csv("proyecciones_jurisdicciones_2022_2040_base.csv")

    # --- Los dos Excel (indicadores: natalidad, esperanza de vida, etc.) ---
    explorar_xlsx("proyecciones_nacionales_2022_2040_c3_6.xlsx")
    explorar_xlsx("proyecciones_jurisdicciones_2022_2040_c3_c4.xlsx")

    titulo("Exploración terminada")
