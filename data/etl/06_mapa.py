"""
06_mapa.py
==============================================================================
Objetivo: preparar el GeoJSON de provincias (data/raw/provincias.geojson,
fuente georef/IGN) para usarlo en el mapa de la Capa 4. Hace tres cosas:

  1) Deja solo las propiedades que necesitamos: código INDEC (id, como número)
     y nombre. (El resto —fuente, iso, centroide— se descarta.)
  2) Recorta Tierra del Fuego: su polígono oficial incluye la Antártida y las
     islas del Atlántico Sur (miles de sub-polígonos hasta -78° de latitud),
     que estiran el mapa hasta el polo. Nos quedamos con la parte al norte de
     -56° (Isla Grande de TdF, Malvinas, Isla de los Estados).
     El archivo original queda intacto en data/raw/ (trazabilidad).
  3) Redondea las coordenadas a 3 decimales (~100 m) para aligerar el archivo.

Cómo se corre:
    python3 data/etl/06_mapa.py
Salida:
    data/processed/provincias_mapa.geojson
==============================================================================
"""

import json
from pathlib import Path

DATA = Path(__file__).resolve().parents[1]
ENTRADA = DATA / "raw" / "provincias.geojson"
SALIDA = DATA / "processed" / "provincias_mapa.json"  # .json para que Vite lo parsee

DECIMALES = 3          # precisión de las coordenadas (~100 m)
LAT_CORTE = -56.0      # al sur de esto = Antártida -> se descarta (solo TdF)
LON_CORTE = -52.0      # al este de esto = Georgias/Sandwich del Sur -> se descarta
COD_TDF = 2 * 47       # 94, Tierra del Fuego


def redondear(coords):
    """Redondea recursivamente todas las coordenadas de una geometría."""
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], DECIMALES), round(coords[1], DECIMALES)]
    return [redondear(c) for c in coords]


def area_anillo(anillo):
    """Área con signo (shoelace). Positiva = antihorario, negativa = horario."""
    a = 0.0
    for i in range(len(anillo) - 1):
        x1, y1 = anillo[i]
        x2, y2 = anillo[i + 1]
        a += x1 * y2 - x2 * y1
    return a / 2.0


def rewind_poligono(poligono):
    """Deja el anillo exterior HORARIO y los huecos antihorarios, que es lo que
    d3-geo espera en la esfera. Si el exterior queda antihorario, d3 dibuja el
    complemento (todo el mapa menos la provincia) y se llena la pantalla."""
    salida = []
    for i, anillo in enumerate(poligono):
        antihorario = area_anillo(anillo) > 0
        exterior = i == 0
        if exterior and antihorario:
            anillo = anillo[::-1]      # exterior -> horario
        elif not exterior and not antihorario:
            anillo = anillo[::-1]      # huecos -> antihorario
        salida.append(anillo)
    return salida


def rewind(geom):
    if geom["type"] == "Polygon":
        return {"type": "Polygon", "coordinates": rewind_poligono(geom["coordinates"])}
    return {
        "type": "MultiPolygon",
        "coordinates": [rewind_poligono(p) for p in geom["coordinates"]],
    }


# Área mínima (en grados²) para conservar un sub-polígono. Descarta islotes
# minúsculos (ruido visual y, en TdF, anillos degenerados que rompen d3-geo).
AREA_MIN = 0.001


def conservar_poligono(poligono):
    """True si el sub-polígono es Argentina continental o una isla relevante
    (Isla Grande de TdF, Malvinas, Isla de los Estados). Descarta la Antártida
    (muy al sur), las Georgias/Sandwich del Sur (muy al este) y los islotes
    diminutos."""
    puntos = [pt for anillo in poligono for pt in anillo]
    lat_max = max(pt[1] for pt in puntos)
    lon_max = max(pt[0] for pt in puntos)
    area = abs(area_anillo(poligono[0]))  # área del anillo exterior
    return lat_max > LAT_CORTE and lon_max < LON_CORTE and area > AREA_MIN


def main():
    geo = json.load(open(ENTRADA, encoding="utf-8"))
    features = []

    for f in geo["features"]:
        props = f["properties"]
        cod = int(props["id"])           # "02" -> 2
        geom = f["geometry"]

        # --- Recorte de Tierra del Fuego ---
        if cod == COD_TDF and geom["type"] == "MultiPolygon":
            antes = len(geom["coordinates"])
            polis = [p for p in geom["coordinates"] if conservar_poligono(p)]
            geom = {"type": "MultiPolygon", "coordinates": polis}
            print(f"Tierra del Fuego: {antes} -> {len(polis)} sub-polígonos "
                  f"(se descartó la Antártida y las Georgias/Sandwich del Sur).")

        # --- Reordenar anillos (winding) para que d3-geo los dibuje bien ---
        geom = rewind(geom)

        # --- Redondeo de coordenadas ---
        geom = {"type": geom["type"], "coordinates": redondear(geom["coordinates"])}

        features.append(
            {
                "type": "Feature",
                "properties": {"cod": cod, "nombre": props["nombre"]},
                "geometry": geom,
            }
        )

    salida = {"type": "FeatureCollection", "features": features}
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    # separators sin espacios -> archivo más chico
    with open(SALIDA, "w", encoding="utf-8") as fp:
        json.dump(salida, fp, ensure_ascii=False, separators=(",", ":"))

    kb_in = ENTRADA.stat().st_size / 1024
    kb_out = SALIDA.stat().st_size / 1024
    print(f"\nProvincias: {len(features)}")
    print(f"Entrada:  {kb_in:.0f} KB")
    print(f"Salida:   {kb_out:.0f} KB  ({SALIDA})")


if __name__ == "__main__":
    main()
