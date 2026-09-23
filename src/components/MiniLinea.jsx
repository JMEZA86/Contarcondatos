import { useState, useRef } from "react";
import { scaleLinear } from "d3";

// ==========================================================================
// MiniLinea: un gráfico de líneas chico y sobrio (estilo "Estratos") para
// mostrar una o dos series a lo largo de los años. Sirve para la Capa 2
// (fecundidad, esperanza de vida). Opcionalmente dibuja una línea de
// referencia punteada (ej: el nivel de reemplazo 2,1).
//
// Al pasar el mouse (o tocar) muestra un tooltip con el valor de cada serie
// en ese año — así se pueden leer también los años del medio, no solo los
// extremos.
//
// Props:
//   lineas     -> [{ nombre, color, puntos: [{anio, valor}] }]
//   dominioY   -> [min, max] del eje vertical
//   referencia -> { valor, label, color } (opcional): línea punteada horizontal
//   marca      -> { anio, label } (opcional): línea vertical punteada que separa
//                 lo estimado de lo proyectado (ej: "proyección →")
//   formato    -> función para formatear los valores (ej: (v) => v.toFixed(1))
//   unidad     -> texto de la unidad, se muestra al pie del tooltip
// ==========================================================================
const ANCHO = 340;
const ALTO = 168;
const M = { top: 20, right: 16, bottom: 24, left: 16 };

export default function MiniLinea({
  lineas,
  dominioY,
  referencia,
  marca,
  notas = {},
  formato = (v) => v,
  unidad = "",
}) {
  // Con muchos años (serie larga) no dibujamos un círculo por punto: satura.
  // Dejamos solo los extremos y el punto bajo el mouse. La línea sigue entera.
  const denso = lineas[0].puntos.length > 13;
  const anios = lineas[0].puntos.map((p) => p.anio);
  const xMin = Math.min(...anios);
  const xMax = Math.max(...anios);

  const x = scaleLinear().domain([xMin, xMax]).range([M.left, ANCHO - M.right]);
  const y = scaleLinear().domain(dominioY).range([ALTO - M.bottom, M.top]);

  const pathDe = (puntos) =>
    puntos.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.anio)} ${y(p.valor)}`).join(" ");

  // --- Estado del hover: índice del año activo + posición del puntero ---
  const [hover, setHover] = useState(null); // { i, x, y }
  const wrapRef = useRef(null);

  const alHover = (i) => (evento) => {
    const caja = wrapRef.current.getBoundingClientRect();
    setHover({ i, x: evento.clientX - caja.left, y: evento.clientY - caja.top });
  };
  const salir = () => setHover(null);

  // Límites de cada "columna" de detección (a mitad de camino entre años).
  const columna = (i) => {
    const izq = i === 0 ? M.left : (x(anios[i - 1]) + x(anios[i])) / 2;
    const der =
      i === anios.length - 1 ? ANCHO - M.right : (x(anios[i]) + x(anios[i + 1])) / 2;
    return { izq, der };
  };

  const anioHover = hover ? anios[hover.i] : null;

  // Descripción para lectores de pantalla: qué series, qué rango de años y los
  // valores inicial y final de cada una.
  const etiquetaAria =
    `Gráfico de líneas, ${xMin} a ${xMax}${unidad ? `, en ${unidad}` : ""}. ` +
    lineas
      .map((s) => {
        const p = s.puntos;
        return `${s.nombre}: ${formato(p[0].valor)} en ${p[0].anio}, ${formato(
          p[p.length - 1].valor
        )} en ${p[p.length - 1].anio}`;
      })
      .join("; ") + ".";

  return (
    <div className="mini-wrap" ref={wrapRef}>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="mini-linea" role="img" aria-label={etiquetaAria}>
        {/* Línea de referencia punteada (ej: reemplazo 2,1) */}
        {referencia && (
          <g>
            <line
              x1={M.left}
              x2={ANCHO - M.right}
              y1={y(referencia.valor)}
              y2={y(referencia.valor)}
              stroke={referencia.color || "var(--texto-3)"}
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <text
              x={ANCHO - M.right}
              y={y(referencia.valor) - 5}
              textAnchor="end"
              fill={referencia.color || "var(--texto-2)"}
              fontFamily="var(--sans)"
              fontSize="10.5"
            >
              {referencia.label}
            </text>
          </g>
        )}

        {/* Marca vertical: separa lo estimado de lo proyectado */}
        {marca && (
          <g>
            <line
              x1={x(marca.anio)}
              x2={x(marca.anio)}
              y1={M.top - 2}
              y2={ALTO - M.bottom}
              stroke="var(--texto-3)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <text
              x={x(marca.anio) + 4}
              y={M.top + 8}
              textAnchor="start"
              fill="var(--texto-3)"
              fontFamily="var(--sans)"
              fontSize="9.5"
            >
              {marca.label}
            </text>
          </g>
        )}

        {/* Guía vertical del año bajo el mouse */}
        {hover && (
          <line
            x1={x(anioHover)}
            x2={x(anioHover)}
            y1={M.top}
            y2={ALTO - M.bottom}
            stroke="#ffffff"
            strokeOpacity="0.18"
          />
        )}

        {/* Una línea + puntos + valores por cada serie */}
        {lineas.map((serie) => (
          <g key={serie.nombre}>
            <path d={pathDe(serie.puntos)} fill="none" stroke={serie.color} strokeWidth="2.5" />
            {serie.puntos.map((p, i) => (
              <g key={p.anio}>
                {(!denso || i === 0 || i === serie.puntos.length - 1 ||
                  (hover && hover.i === i)) && (
                  <circle
                    cx={x(p.anio)}
                    cy={y(p.valor)}
                    r={hover && hover.i === i ? 4.6 : 3.2}
                    fill={serie.color}
                  />
                )}
                {/* Etiqueta de valor solo en los extremos, para no saturar.
                    Una serie puede pedir no etiquetar (etiquetar:false), útil
                    cuando es una línea de comparación que se pisaría con otra. */}
                {(i === 0 || i === serie.puntos.length - 1) && serie.etiquetar !== false && (
                  <text
                    x={x(p.anio)}
                    y={y(p.valor) - 9}
                    textAnchor="middle"
                    fill="var(--texto-1)"
                    fontFamily="var(--sans)"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {formato(p.valor)}
                  </text>
                )}
              </g>
            ))}
          </g>
        ))}

        {/* Etiquetas de año (primero y último) */}
        {[xMin, xMax].map((a) => (
          <text
            key={a}
            x={x(a)}
            y={ALTO - 8}
            textAnchor={a === xMin ? "start" : "end"}
            fill="var(--texto-3)"
            fontFamily="var(--sans)"
            fontSize="11"
          >
            {a}
          </text>
        ))}

        {/* Capa transparente de detección de hover: una columna por año. */}
        {anios.map((a, i) => {
          const { izq, der } = columna(i);
          return (
            <rect
              key={`hit-${a}`}
              x={izq}
              y={M.top}
              width={der - izq}
              height={ALTO - M.bottom - M.top}
              fill="transparent"
              onMouseMove={alHover(i)}
              onMouseEnter={alHover(i)}
              onMouseLeave={salir}
            />
          );
        })}
      </svg>

      {/* Tooltip: año + valor de cada serie */}
      {hover && (
        <div className="mini-tooltip" style={{ left: hover.x, top: hover.y }}>
          <div className="mt-anio">{anioHover}</div>
          {lineas.map((serie) => (
            <div className="mt-fila" key={serie.nombre}>
              <span>
                <span className="punto" style={{ background: serie.color }} />
                {serie.nombre}
              </span>
              <span className="mt-val">{formato(serie.puntos[hover.i].valor)}</span>
            </div>
          ))}
          {unidad && <div className="mt-unidad">{unidad}</div>}
          {notas[anioHover] && <div className="mt-nota">{notas[anioHover]}</div>}
        </div>
      )}
    </div>
  );
}
