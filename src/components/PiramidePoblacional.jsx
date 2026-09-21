import { useMemo, useState, useEffect, useRef } from "react";
import { scaleLinear, easeCubicOut } from "d3";

// Importamos el JSON limpio que generó el ETL (data/processed).
// Vite lo empaqueta automáticamente; queda disponible como un objeto JS.
import datos from "../../data/processed/piramide_nacional.json";

// ==========================================================================
// Constantes de layout del gráfico.
// El SVG se dibuja con estas medidas "internas" (viewBox) y después CSS lo
// escala al ancho disponible. Así se ve nítido en cualquier pantalla.
// ==========================================================================
const ANCHO = 920;
const MARGEN = { top: 34, right: 12, bottom: 30, left: 12 };
const HUECO_CENTRO = 58; // espacio central para las etiquetas de edad
const ALTO_FILA = 24; // alto de cada banda de edad (quinquenio)
const DURACION_ANIM = 550; // milisegundos que dura la transición entre años

// Colores (los mismos de la paleta "Estratos").
const VERDE = "#1d9e75"; // varones
const CORAL = "#d85a30"; // mujeres

// ==========================================================================
// Helper: agrupar las edades año-a-año (0,1,2,...) en quinquenios
// (0-4, 5-9, ..., 95-99, 100+). Con barras más altas, el patrón de siluetas
// se lee mejor y queda alineado con los datos por provincia (que ya vienen
// en grupos de 5).
// ==========================================================================
function agruparEnQuinquenios(filas) {
  const grupos = [];
  for (let inicio = 0; inicio <= 100; inicio += 5) {
    const fin = inicio === 100 ? 100 : inicio + 4;
    let varones = 0;
    let mujeres = 0;
    for (const f of filas) {
      if (f.edad >= inicio && f.edad <= fin) {
        varones += f.varones;
        mujeres += f.mujeres;
      }
    }
    grupos.push({
      etiqueta: inicio === 100 ? "100+" : `${inicio}`,
      // Texto largo para el tooltip:
      rango: inicio === 100 ? "100 años y más" : `${inicio} a ${fin} años`,
      inicio,
      varones,
      mujeres,
    });
  }
  return grupos; // 21 grupos, de 0 a 100+
}

// Formatea un número al estilo argentino (46.135.579).
const fmt = (n) => Math.round(n).toLocaleString("es-AR");

export default function PiramidePoblacional() {
  const anios = datos.meta.anios; // [2022, ..., 2040]
  const [anio, setAnio] = useState(anios[0]);

  // Índice de la franja de edad sobre la que está el mouse (o null si ninguna),
  // y la posición del puntero para ubicar el tooltip.
  const [hover, setHover] = useState(null); // { i, x, y }
  const wrapRef = useRef(null); // referencia al div contenedor (para medir posición)

  // ------------------------------------------------------------------------
  // Pre-cálculo 1: agrupar TODOS los años en quinquenios una sola vez.
  // ------------------------------------------------------------------------
  const porAnio = useMemo(() => {
    const out = {};
    for (const a of anios) {
      out[a] = agruparEnQuinquenios(datos.piramide[String(a)]);
    }
    return out;
  }, [anios]);

  // ------------------------------------------------------------------------
  // Pre-cálculo 2: el valor máximo de población en CUALQUIER año/grupo/sexo,
  // para fijar la escala del eje X y que las barras sean comparables entre años.
  // ------------------------------------------------------------------------
  const maxPob = useMemo(() => {
    let m = 0;
    for (const a of anios) {
      for (const g of porAnio[a]) m = Math.max(m, g.varones, g.mujeres);
    }
    return m;
  }, [porAnio, anios]);

  // ------------------------------------------------------------------------
  // ANIMACIÓN (tweening).
  // "display" son los valores que realmente se dibujan. Cuando cambia el año,
  // animamos "display" desde donde está hasta el año destino, cuadro a cuadro
  // con requestAnimationFrame. Así las barras se deslizan en vez de saltar.
  // ------------------------------------------------------------------------
  const [display, setDisplay] = useState(() => porAnio[anios[0]]);
  const displayRef = useRef(display); // para arrancar la animación desde el estado actual
  useEffect(() => {
    displayRef.current = display;
  });

  useEffect(() => {
    const desde = displayRef.current; // valores actuales en pantalla
    const hasta = porAnio[anio]; // valores del año elegido
    let inicio = null;
    let raf;

    const paso = (ts) => {
      if (inicio === null) inicio = ts;
      const t = Math.min(1, (ts - inicio) / DURACION_ANIM);
      const e = easeCubicOut(t); // curva de suavizado (rápido al principio, frena al final)
      // Interpolamos varones y mujeres de cada grupo entre "desde" y "hasta".
      const interp = hasta.map((g, i) => ({
        ...g,
        varones: desde[i].varones + (g.varones - desde[i].varones) * e,
        mujeres: desde[i].mujeres + (g.mujeres - desde[i].mujeres) * e,
      }));
      setDisplay(interp);
      if (t < 1) raf = requestAnimationFrame(paso);
    };

    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf); // si cambian de año a mitad de camino, cortamos
  }, [anio, porAnio]);

  // ------------------------------------------------------------------------
  // Geometría del gráfico.
  // ------------------------------------------------------------------------
  const grupos = porAnio[anio]; // valores EXACTOS del año (para textos/tooltip)
  const nFilas = grupos.length; // 21
  const alto = MARGEN.top + nFilas * ALTO_FILA + MARGEN.bottom;

  const anchoPlot = ANCHO - MARGEN.left - MARGEN.right;
  const anchoMitad = (anchoPlot - HUECO_CENTRO) / 2;
  const bordeIzq = MARGEN.left + anchoMitad; // borde interno del lado varones
  const bordeDer = bordeIzq + HUECO_CENTRO; // borde interno del lado mujeres

  const x = scaleLinear().domain([0, maxPob]).range([0, anchoMitad]);
  const yDe = (i) => MARGEN.top + (nFilas - 1 - i) * ALTO_FILA;
  const altoBarra = ALTO_FILA - 6;
  const ticks = x.ticks(4).filter((t) => t > 0);

  // Dato para el subtítulo: % de 65 años o más este año.
  const totalAnio = grupos.reduce((s, g) => s + g.varones + g.mujeres, 0);
  const total65 = grupos
    .filter((g) => g.inicio >= 65)
    .reduce((s, g) => s + g.varones + g.mujeres, 0);
  const pct65 = ((total65 / totalAnio) * 100).toFixed(1);
  const esProyeccion = anio > anios[0];

  // ------------------------------------------------------------------------
  // Manejo del hover: guardamos qué franja y dónde está el puntero.
  // Convertimos la posición del mouse a coordenadas RELATIVAS al contenedor,
  // porque el tooltip es un <div> que se ubica con esas coordenadas.
  // ------------------------------------------------------------------------
  const alEntrar = (i) => (evento) => {
    const caja = wrapRef.current.getBoundingClientRect();
    setHover({
      i,
      x: evento.clientX - caja.left,
      y: evento.clientY - caja.top,
    });
  };
  const alSalir = () => setHover(null);

  // Datos de la franja bajo el mouse (si hay), para el contenido del tooltip.
  const gHover = hover ? grupos[hover.i] : null;
  const totalHover = gHover ? gHover.varones + gHover.mujeres : 0;
  const pctHover = gHover ? ((totalHover / totalAnio) * 100).toFixed(1) : 0;

  return (
    // Layout de dos columnas en desktop: controles a la izquierda, gráfico a la
    // derecha. En pantallas angostas (mobile) se apila en una sola columna.
    <div className="piramide-layout">
      {/* ---------- Columna izquierda: título, intro y controles ---------- */}
      <div className="piramide-controles">
      {/* --- Título e introducción (antes estaban en un hero aparte) --- */}
      <p className="kicker">Argentina · Transición demográfica</p>
      <h1 className="titulo">La Argentina que envejece</h1>
      <p className="bajada">
        Nacer menos, vivir más: la ecuación que cambia el país.
      </p>

      <h2 className="seccion-titulo">La forma cambia</h2>
      <p className="seccion-ayuda">
        Movés el año y ves cómo cambia la forma de la población, 2022–2040.
      </p>

      {/* --- Control del año --- */}
      <div className="control-anio">
        <span className="anio-grande">{anio}</span>
        <span className="etiqueta-fase">
          {esProyeccion ? "Proyección INDEC" : "Base · Censo 2022"}
        </span>
      </div>

      <input
        type="range"
        min={anios[0]}
        max={anios[anios.length - 1]}
        step={1}
        value={anio}
        onChange={(e) => setAnio(Number(e.target.value))}
        aria-label="Elegir año"
      />
      <div className="rango-anios" style={{ marginBottom: 18 }}>
        <span>{anios[0]}</span>
        <span>{anios[anios.length - 1]}</span>
      </div>

      <div className="leyenda">
        <span className="item">
          <span className="muestra" style={{ background: VERDE }} />
          Varones
        </span>
        <span className="item">
          <span className="muestra" style={{ background: CORAL }} />
          Mujeres
        </span>
      </div>

      <p className="fuente" style={{ marginTop: 6, color: "var(--texto-2)" }}>
        En {anio}, el <strong style={{ color: "var(--texto-1)" }}>{pct65}%</strong>{" "}
        de la población tiene 65 años o más. Población total: {fmt(totalAnio)}{" "}
        personas.
      </p>

      <p className="fuente-mini">
        Fuente: INDEC. Estimaciones y proyecciones de población 2022–2040 (base
        Censo 2022). Edades en quinquenios; “100+” incluye 100 años y más.
      </p>
      </div>
      {/* ---------- Fin columna izquierda ---------- */}

      {/* ---------- Columna derecha: el gráfico ---------- */}
      {/* --- El gráfico (envuelto para poder poner el tooltip encima) --- */}
      <div className="grafico-wrap" ref={wrapRef}>
        <svg
          className="grafico-piramide"
          viewBox={`0 0 ${ANCHO} ${alto}`}
          role="img"
          aria-label={`Pirámide de población de Argentina en ${anio}`}
        >
          {/* PATRONES de siluetas humanas (mosaico 12x16 con cabeza + cuerpo). */}
          <defs>
            <pattern id="gente-varones" width="12" height="16" patternUnits="userSpaceOnUse">
              <rect width="12" height="16" fill={VERDE} opacity="0.18" />
              <circle cx="6" cy="4" r="2.1" fill={VERDE} />
              <rect x="3.4" y="6.6" width="5.2" height="7" rx="2.4" fill={VERDE} />
            </pattern>
            <pattern id="gente-mujeres" width="12" height="16" patternUnits="userSpaceOnUse">
              <rect width="12" height="16" fill={CORAL} opacity="0.18" />
              <circle cx="6" cy="4" r="2.1" fill={CORAL} />
              <rect x="3.4" y="6.6" width="5.2" height="7" rx="2.4" fill={CORAL} />
            </pattern>
          </defs>

          {/* Encabezados de cada lado */}
          <text x={bordeIzq} y={18} textAnchor="end" fill={VERDE} fontFamily="var(--sans)" fontSize="13" fontWeight="600" letterSpacing="0.12em">
            VARONES
          </text>
          <text x={bordeDer} y={18} textAnchor="start" fill={CORAL} fontFamily="var(--sans)" fontSize="13" fontWeight="600" letterSpacing="0.12em">
            MUJERES
          </text>

          {/* Líneas guía y etiquetas del eje X (población en miles) */}
          {ticks.map((t) => (
            <g key={`tick-${t}`}>
              <line x1={bordeIzq - x(t)} x2={bordeIzq - x(t)} y1={MARGEN.top} y2={alto - MARGEN.bottom} stroke="#ffffff" strokeOpacity="0.06" />
              <line x1={bordeDer + x(t)} x2={bordeDer + x(t)} y1={MARGEN.top} y2={alto - MARGEN.bottom} stroke="#ffffff" strokeOpacity="0.06" />
              <text x={bordeIzq - x(t)} y={alto - MARGEN.bottom + 16} textAnchor="middle" fill="var(--texto-3)" fontFamily="var(--sans)" fontSize="11">
                {Math.round(t / 1000)}k
              </text>
              <text x={bordeDer + x(t)} y={alto - MARGEN.bottom + 16} textAnchor="middle" fill="var(--texto-3)" fontFamily="var(--sans)" fontSize="11">
                {Math.round(t / 1000)}k
              </text>
            </g>
          ))}

          {/* Barras (usan "display": los valores animados) + etiqueta de edad */}
          {display.map((g, i) => {
            const y = yDe(i);
            const wVar = x(g.varones);
            const wMuj = x(g.mujeres);
            return (
              <g key={g.etiqueta}>
                <rect x={bordeIzq - wVar} y={y} width={wVar} height={altoBarra} fill="url(#gente-varones)" rx="2" />
                <rect x={bordeDer} y={y} width={wMuj} height={altoBarra} fill="url(#gente-mujeres)" rx="2" />
                <text x={(bordeIzq + bordeDer) / 2} y={y + altoBarra / 2 + 4} textAnchor="middle" fill="var(--texto-2)" fontFamily="var(--sans)" fontSize="11">
                  {g.etiqueta}
                </text>
              </g>
            );
          })}

          {/* Marco de resaltado sobre la franja bajo el mouse */}
          {hover && (
            <rect
              x={MARGEN.left}
              y={yDe(hover.i) - 3}
              width={anchoPlot}
              height={ALTO_FILA - 2}
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.22"
              rx="3"
            />
          )}

          {/* Capa transparente de detección de hover: un rect por fila que cubre
              todo el ancho (incluido el centro), para que el tooltip aparezca al
              pasar por cualquier parte de la franja de edad. Va al final para
              quedar "arriba" y recibir los eventos del mouse. */}
          {grupos.map((g, i) => (
            <rect
              key={`hit-${g.etiqueta}`}
              x={MARGEN.left}
              y={yDe(i) - 3}
              width={anchoPlot}
              height={ALTO_FILA - 2}
              fill="transparent"
              onMouseMove={alEntrar(i)}
              onMouseEnter={alEntrar(i)}
              onMouseLeave={alSalir}
            />
          ))}
        </svg>

        {/* --- Tooltip (cartelito). Solo se muestra si hay una franja activa. --- */}
        {gHover && (
          <div className="tooltip" style={{ left: hover.x, top: hover.y }}>
            <div className="tt-edad">{gHover.rango}</div>
            <div className="tt-fila">
              <span>
                <span className="punto" style={{ background: VERDE }} />
                Varones
              </span>
              <span className="val">{fmt(gHover.varones)}</span>
            </div>
            <div className="tt-fila">
              <span>
                <span className="punto" style={{ background: CORAL }} />
                Mujeres
              </span>
              <span className="val">{fmt(gHover.mujeres)}</span>
            </div>
            <div className="tt-fila tt-total">
              <span>Total ({pctHover}% del país)</span>
              <span className="val">{fmt(totalHover)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
