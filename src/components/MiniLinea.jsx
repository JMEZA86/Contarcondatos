import { scaleLinear } from "d3";

// ==========================================================================
// MiniLinea: un gráfico de líneas chico y sobrio (estilo "Estratos") para
// mostrar una o dos series a lo largo de los años. Sirve para la Capa 2
// (fecundidad, esperanza de vida). Opcionalmente dibuja una línea de
// referencia punteada (ej: el nivel de reemplazo 2,1).
//
// Props:
//   lineas     -> [{ nombre, color, puntos: [{anio, valor}] }]
//   dominioY   -> [min, max] del eje vertical
//   referencia -> { valor, label, color } (opcional): línea punteada horizontal
//   formato    -> función para formatear los valores (ej: (v) => v.toFixed(1))
// ==========================================================================
const ANCHO = 340;
const ALTO = 190;
const M = { top: 22, right: 16, bottom: 26, left: 16 };

export default function MiniLinea({ lineas, dominioY, referencia, formato = (v) => v }) {
  // Todos los años presentes (tomados de la primera serie).
  const anios = lineas[0].puntos.map((p) => p.anio);
  const xMin = Math.min(...anios);
  const xMax = Math.max(...anios);

  // Escalas: año -> x en píxeles, valor -> y en píxeles (invertida: más arriba = más valor).
  const x = scaleLinear().domain([xMin, xMax]).range([M.left, ANCHO - M.right]);
  const y = scaleLinear().domain(dominioY).range([ALTO - M.bottom, M.top]);

  // Construye el atributo "d" de un <path> a partir de los puntos de una serie.
  const pathDe = (puntos) =>
    puntos.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.anio)} ${y(p.valor)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="mini-linea" role="img">
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

      {/* Una línea + puntos + valores por cada serie */}
      {lineas.map((serie) => (
        <g key={serie.nombre}>
          <path d={pathDe(serie.puntos)} fill="none" stroke={serie.color} strokeWidth="2.5" />
          {serie.puntos.map((p, i) => (
            <g key={p.anio}>
              <circle cx={x(p.anio)} cy={y(p.valor)} r="3.2" fill={serie.color} />
              {/* Etiqueta de valor solo en los extremos, para no saturar. */}
              {(i === 0 || i === serie.puntos.length - 1) && (
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
    </svg>
  );
}
