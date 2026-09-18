import { useMemo, useState, useRef } from "react";
import { geoMercator, geoPath, scaleLinear, min as d3min, max as d3max } from "d3";

import geojsonData from "../../data/processed/provincias_mapa.json";
import datos from "../../data/processed/provincias.json";

// El SVG interno mide esto y CSS lo escala. Argentina es alta y angosta.
const H = 640;

// ==========================================================================
// MapaProvincias: mapa de la Argentina coloreado por esperanza de vida
// (mujeres, 2040). Se puede clickear una provincia para seleccionarla, y la
// provincia elegida se resalta con borde claro. Un tooltip muestra el nombre.
//
// Props:
//   seleccion -> código INDEC de la provincia elegida
//   onSelect  -> callback(código) al clickear una provincia
// ==========================================================================
export default function MapaProvincias({ seleccion, onSelect }) {
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null); // { cod, nombre, x, y }

  // Valor para colorear cada provincia: esperanza de vida de mujeres en 2040.
  const valorPorCod = useMemo(() => {
    const m = {};
    for (const p of datos.provincias) {
      m[p.codigo] = p.esperanza[p.esperanza.length - 1].mujeres;
    }
    return m;
  }, []);

  // Colores extremos de la escala (oscuro = menos años, claro = más años).
  const COLOR_MIN = "#5c2e1a";
  const COLOR_MAX = "#F0997B";

  // Escala de color y valores mínimo/máximo (para la barra de referencia).
  const { color, minV, maxV } = useMemo(() => {
    const vals = Object.values(valorPorCod);
    const lo = d3min(vals);
    const hi = d3max(vals);
    return {
      color: scaleLinear().domain([lo, hi]).range([COLOR_MIN, COLOR_MAX]),
      minV: lo,
      maxV: hi,
    };
  }, [valorPorCod]);

  const coma1 = (v) => v.toFixed(1).replace(".", ",");

  // Proyección y generador de paths. Dos pasos para que el ancho quede ajustado
  // a la forma real del país (y no sobre espacio a los costados).
  const { path, W } = useMemo(() => {
    // 1) Ajustamos a la altura para conocer el ancho natural.
    let proj = geoMercator().fitSize([2000, H], geojsonData);
    let p = geoPath(proj);
    const b = p.bounds(geojsonData); // [[x0,y0],[x1,y1]]
    const ancho = Math.ceil(b[1][0] - b[0][0]) + 16;
    // 2) Reajustamos dentro de una caja de ese ancho, con un margen de 8px.
    proj = geoMercator().fitExtent([[8, 8], [ancho - 8, H - 8]], geojsonData);
    return { path: geoPath(proj), W: ancho };
  }, []);

  const alHover = (f) => (evento) => {
    const caja = wrapRef.current.getBoundingClientRect();
    setHover({
      cod: f.properties.cod,
      nombre: f.properties.nombre,
      x: evento.clientX - caja.left,
      y: evento.clientY - caja.top,
    });
  };

  const nombreCorto = (n) => (n.startsWith("Tierra del Fuego") ? "Tierra del Fuego" : n);

  return (
    <div className="mapa-wrap" ref={wrapRef}>
      <svg viewBox={`0 0 ${W} ${H}`} className="mapa-svg" role="img" aria-label="Mapa de provincias">
        {geojsonData.features.map((f) => {
          const cod = f.properties.cod;
          const activa = cod === seleccion;
          return (
            <path
              key={cod}
              d={path(f)}
              fill={color(valorPorCod[cod])}
              stroke={activa ? "#F5F0E8" : "#15110E"}
              strokeWidth={activa ? 2 : 0.5}
              style={{ cursor: "pointer", opacity: hover && hover.cod === cod && !activa ? 0.85 : 1 }}
              onClick={() => onSelect(cod)}
              onMouseMove={alHover(f)}
              onMouseEnter={alHover(f)}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </svg>

      {/* Leyenda de color: barra con degradé + dirección */}
      <div className="mapa-leyenda">
        <div className="ley-cap">Esperanza de vida · mujeres · 2040</div>
        <div
          className="ley-barra"
          style={{ background: `linear-gradient(90deg, ${COLOR_MIN}, ${COLOR_MAX})` }}
        />
        <div className="ley-ejes">
          <span>{coma1(minV)} años</span>
          <span className="ley-flecha">menos → más años</span>
          <span>{coma1(maxV)} años</span>
        </div>
      </div>

      {hover && (
        <div className="mapa-tooltip" style={{ left: hover.x, top: hover.y }}>
          <strong>{nombreCorto(hover.nombre)}</strong>
          <br />
          {valorPorCod[hover.cod].toFixed(1).replace(".", ",")} años
        </div>
      )}
    </div>
  );
}
