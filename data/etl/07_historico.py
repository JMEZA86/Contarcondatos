"""
07_historico.py
==============================================================================
Objetivo: extender hacia atrás las series de FECUNDIDAD y ESPERANZA DE VIDA de
la Capa 2, usando UNA sola fuente INDEC y sin bache.

Fuente
    INDEC — "Estimaciones y proyecciones 2022-2040. La transformación de la
    población argentina. Dosier estadístico" (octubre 2025).
      - Gráfico 2 (pág. 4): TGF estimada y proyectada, 2001-2040.
      - Gráfico 4 (pág. 7): Esperanza de vida al nacer por sexo, estimada y
        proyectada, 2001-2040.
    Los dos gráficos salen de la misma base (Censo 2022), la misma que ya
    alimenta la proyección 2025-2040 del proyecto (ver 03_indicadores). Por eso
    no hay mezcla de fuentes ni salto metodológico.

Método
    Los gráficos del PDF son vectoriales: cada línea es una polilínea cuyos
    vértices son los valores año a año. Leemos esos vértices y los calibramos
    contra los ejes (cuyas etiquetas numéricas también están en el PDF). Se
    valida contra las cifras que el propio Dosier cita en el texto:
        Fecundidad: 2017 ~ 2,1 ; 2022 = 1,4.
        Esperanza 2040: 78,7 (varones) / 83,0 (mujeres).
    y contra los cuadros de proyección que ya teníamos (2025: TGF 1,27;
    esperanza 75,7 / 81,1). El error de lectura es de ±0,02 (TGF) / ±0,3 (años).

    De cada gráfico tomamos SOLO la parte ESTIMADA (observada), 2001-2022. Para
    la proyección (2025, 2030, 2035, 2040) usamos los valores EXACTOS de los
    cuadros, que ya están en indicadores_nacionales.json (más precisos que
    leerlos del gráfico).

IMPORTANTE: se corre DESPUÉS de 03_indicadores.py, porque lee y reescribe su
salida. Si se vuelve a correr 03, hay que volver a correr 07.

Cómo se corre (desde la raíz del repo):
    python3 data/etl/03_indicadores.py
    python3 data/etl/07_historico.py

Salida:
    data/processed/indicadores_nacionales.json  (fecundidad y esperanza
    extendidas 2001-2040)
==============================================================================
"""

import json
from collections import defaultdict
from pathlib import Path

import numpy as np
import pymupdf

DATA = Path(__file__).resolve().parents[1]
PDF = DATA / "raw" / "dosier_transformacion_poblacion_2022_2040.pdf"
ARCHIVO = DATA / "processed" / "indicadores_nacionales.json"

# Colores de las líneas (RGB 0-1) tal como vienen en el PDF.
AZUL = (0.173, 0.286, 0.573)   # TGF; y esperanza de MUJERES
CYAN = (0.427, 0.827, 0.851)   # esperanza de VARONES
ANIO_CORTE = 2022              # hasta acá es "estimado"; después, proyección


def _close(c, ref, tol=0.02):
    return c is not None and all(abs(a - b) < tol for a, b in zip(c, ref))


def _calibracion(pg, y_es_valor):
    """Devuelve funciones (x->año, y->valor) leyendo las etiquetas numéricas de
    los ejes. `y_es_valor(txt)` decide si un texto es una etiqueta del eje Y."""
    xs, ys = [], []
    for w in pg.get_text("words"):
        txt = w[4]
        cx, cy = (w[0] + w[2]) / 2, (w[1] + w[3]) / 2
        # Eje X: años (2000, 2005, ...), abajo del gráfico y hacia la derecha.
        if txt.isdigit() and len(txt) == 4 and txt.startswith("20") and w[0] >= 250 and cy > 320:
            xs.append((cx, int(txt)))
        # Eje Y: lo define el llamador según el gráfico.
        v = y_es_valor(txt)
        if v is not None and w[0] < 250:
            ys.append((cy, v))
    ax, bx = np.polyfit([p[0] for p in xs], [p[1] for p in xs], 1)
    ay, by = np.polyfit([p[0] for p in ys], [p[1] for p in ys], 1)
    return (lambda x: ax * x + bx), (lambda y: ay * y + by)


def _puntos(d):
    pts = []
    for it in d["items"]:
        if it[0] == "l":
            pts += [(it[1].x, it[1].y), (it[2].x, it[2].y)]
        elif it[0] == "c":
            pts += [(it[1].x, it[1].y), (it[4].x, it[4].y)]
    return pts


def fecundidad_estimada(doc):
    """TGF observada 2001-2022, del Gráfico 2 (pág. índice 3)."""
    pg = doc[3]
    yv = lambda t: (float(t.replace(",", ".")) if t in
                    ("1,0", "1,2", "1,4", "1,6", "1,8", "2,0", "2,2", "2,4",
                     "2,6", "2,8", "3,0") else None)
    x2anio, y2val = _calibracion(pg, yv)
    # La línea estimada es la polilínea azul más larga dentro del gráfico.
    mejor = None
    for d in pg.get_drawings():
        if not _close(d.get("color"), AZUL):
            continue
        n = sum(1 for it in d["items"] if it[0] in ("l", "c"))
        if mejor is None or n > mejor[0]:
            mejor = (n, d)
    serie = {}
    for x, y in _puntos(mejor[1]):
        anio = round(x2anio(x))
        if 2001 <= anio <= ANIO_CORTE:
            serie[anio] = round(float(y2val(y)), 2)
    return [{"anio": a, "valor": serie[a], "origen": "estimado"} for a in sorted(serie)]


def esperanza_estimada(doc):
    """Esperanza de vida por sexo, observada 2001-2022, del Gráfico 4 (pág 6)."""
    pg = doc[6]
    yv = lambda t: (int(t) if t.isdigit() and 70 <= int(t) <= 85 else None)
    x2anio, y2val = _calibracion(pg, yv)
    grupos = defaultdict(list)
    for d in pg.get_drawings():
        r = d["rect"]
        if not (248 <= r.x0 and r.x1 <= 548 and 144 <= r.y0 and r.y1 <= 332):
            continue
        sexo = "mujeres" if _close(d.get("color"), AZUL) else (
            "varones" if _close(d.get("color"), CYAN) else None)
        if sexo:
            for it in d["items"]:
                if it[0] == "l":
                    grupos[sexo] += [(it[1].x, it[1].y), (it[2].x, it[2].y)]

    def a_serie(raw):
        por_anio = defaultdict(list)
        for x, y in raw:
            por_anio[round(x2anio(x))].append(float(y2val(y)))
        return {a: round(float(np.mean(v)), 1) for a, v in por_anio.items()}

    muj, var = a_serie(grupos["mujeres"]), a_serie(grupos["varones"])
    anios = sorted(a for a in set(muj) | set(var) if 2001 <= a <= ANIO_CORTE)
    return [{"anio": a, "varones": var.get(a), "mujeres": muj.get(a),
             "origen": "estimado"} for a in anios]


def main():
    doc = pymupdf.open(PDF)
    fec_hist = fecundidad_estimada(doc)
    esp_hist = esperanza_estimada(doc)

    with open(ARCHIVO, encoding="utf-8") as f:
        datos = json.load(f)

    # --- Fecundidad: estimada (2001-2022) + proyección exacta (>2022) ---
    fec = datos["fecundidad"]
    proy = [{"anio": d["anio"], "valor": d["valor"], "origen": "proyeccion"}
            for d in fec["serie"] if d["anio"] > ANIO_CORTE]
    fec["serie"] = fec_hist + proy
    fec["descripcion"] = (
        "Tasa global de fecundidad (TGF): hijos promedio por mujer. Debajo de "
        "2,1 la población no se renueva sola. Serie estimada 2001-2022 y "
        "proyección 2025-2040 (INDEC).")

    # --- Esperanza de vida: estimada (2001-2022) + proyección exacta (>2022) ---
    esp = datos["esperanza_vida"]
    proy_e = [{"anio": d["anio"], "varones": d["varones"], "mujeres": d["mujeres"],
               "origen": "proyeccion"} for d in esp["serie"] if d["anio"] > ANIO_CORTE]
    esp["serie"] = esp_hist + proy_e

    datos["meta"]["fuente"] = (
        "INDEC. Estimaciones y proyecciones de población 2022-2040, base Censo "
        "2022. Serie estimada 2001-2022 leída del Dosier estadístico 'La "
        "transformación de la población argentina' (gráficos 2 y 4); proyección "
        "2025-2040 de los cuadros 5 y 6.")
    datos["meta"]["nota"] = (
        "Fecundidad y esperanza de vida: valores estimados (observados) "
        "2001-2022 y proyectados 2025-2040, todo del INDEC con base Censo 2022.")

    with open(ARCHIVO, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)

    # --- Reporte de control ---
    print(f"Archivo: {ARCHIVO} ({ARCHIVO.stat().st_size} bytes)\n")
    print("Fecundidad (TGF):")
    for d in fec["serie"]:
        print(f"   {d['anio']}: {d['valor']:>5}  ({d['origen']})")
    print("\nEsperanza de vida (varones / mujeres):")
    for d in esp["serie"]:
        print(f"   {d['anio']}: {d['varones']} / {d['mujeres']}  ({d['origen']})")


if __name__ == "__main__":
    main()
