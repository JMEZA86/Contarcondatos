import { useMemo, useState } from "react";
import { scaleLinear, max as d3max } from "d3";

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
    // Sumamos varones y mujeres de las edades que caen en este grupo.
    // El grupo de 100 es "100 y más" (solo la edad 100).
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
      inicio,
      varones,
      mujeres,
    });
  }
  return grupos; // 21 grupos, de 0 a 100+
}

// Formatea un número al estilo argentino (46.135.579).
const fmt = (n) => n.toLocaleString("es-AR");

export default function PiramidePoblacional() {
  // El año que el usuario elige con el slider. Arranca en el primero disponible.
  const anios = datos.meta.anios; // [2022, ..., 2040]
  const [anio, setAnio] = useState(anios[0]);

  // ------------------------------------------------------------------------
  // Pre-cálculo 1: agrupar TODOS los años en quinquenios una sola vez.
  // useMemo evita recalcular en cada render si los datos no cambian.
  // ------------------------------------------------------------------------
  const porAnio = useMemo(() => {
    const out = {};
    for (const a of anios) {
      out[a] = agruparEnQuinquenios(datos.piramide[String(a)]);
    }
    return out;
  }, [anios]);

  // ------------------------------------------------------------------------
  // Pre-cálculo 2: el valor máximo de población en CUALQUIER año/grupo/sexo.
  // Lo usamos para fijar la escala del eje X. Si la escala se recalculara por
  // año, las barras "saltarían" al mover el slider; con un máximo fijo, la
  // pirámide crece/decrece de forma comparable entre años.
  // ------------------------------------------------------------------------
  const maxPob = useMemo(() => {
    let m = 0;
    for (const a of anios) {
      for (const g of porAnio[a]) {
        m = Math.max(m, g.varones, g.mujeres);
      }
    }
    return m;
  }, [porAnio, anios]);

  // ------------------------------------------------------------------------
  // Geometría del gráfico.
  // ------------------------------------------------------------------------
  const grupos = porAnio[anio];
  const nFilas = grupos.length; // 21
  const alto = MARGEN.top + nFilas * ALTO_FILA + MARGEN.bottom;

  const anchoPlot = ANCHO - MARGEN.left - MARGEN.right;
  const anchoMitad = (anchoPlot - HUECO_CENTRO) / 2; // ancho de cada lado
  const bordeIzq = MARGEN.left + anchoMitad; // borde interno del lado varones
  const bordeDer = bordeIzq + HUECO_CENTRO; // borde interno del lado mujeres

  // Escala: convierte una cantidad de población en un ancho en píxeles.
  const x = scaleLinear().domain([0, maxPob]).range([0, anchoMitad]);

  // Posición vertical: el grupo 0 (0-4) va ABAJO, el 100+ va ARRIBA.
  const yDe = (i) => MARGEN.top + (nFilas - 1 - i) * ALTO_FILA;
  const altoBarra = ALTO_FILA - 6; // dejamos un respiro entre barras

  // Ticks del eje X (población), en valores redondos.
  const ticks = x.ticks(4).filter((t) => t > 0);

  // ------------------------------------------------------------------------
  // Un dato para contar la historia: qué % tiene 65 años o más este año.
  // ------------------------------------------------------------------------
  const totalAnio = grupos.reduce((s, g) => s + g.varones + g.mujeres, 0);
  const total65 = grupos
    .filter((g) => g.inicio >= 65)
    .reduce((s, g) => s + g.varones + g.mujeres, 0);
  const pct65 = ((total65 / totalAnio) * 100).toFixed(1);

  // ¿Es un año proyectado? (2022 es base; de 2023 en adelante es proyección.)
  const esProyeccion = anio > anios[0];

  return (
    <div>
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

      {/* --- Leyenda de colores --- */}
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
        de la población tiene 65 años o más. Población total:{" "}
        {fmt(totalAnio)} personas.
      </p>

      {/* --- El gráfico --- */}
      <svg
        className="grafico-piramide"
        viewBox={`0 0 ${ANCHO} ${alto}`}
        role="img"
        aria-label={`Pirámide de población de Argentina en ${anio}`}
      >
        {/* ----------------------------------------------------------------
            <defs>: acá definimos los PATRONES de siluetas humanas.
            Cada patrón es un mosaico ("tile") de 12x16 px con una personita
            (círculo = cabeza, rectángulo redondeado = cuerpo). Al usarlo como
            relleno de una barra, se repite y da la textura "de gente".
            patternUnits="userSpaceOnUse" hace que el mosaico se mida en las
            mismas unidades que el gráfico, así las personitas quedan del mismo
            tamaño en todas las barras.
        ---------------------------------------------------------------- */}
        <defs>
          <pattern
            id="gente-varones"
            width="12"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            {/* fondo tenue del color */}
            <rect width="12" height="16" fill={VERDE} opacity="0.18" />
            {/* cabeza */}
            <circle cx="6" cy="4" r="2.1" fill={VERDE} />
            {/* cuerpo */}
            <rect x="3.4" y="6.6" width="5.2" height="7" rx="2.4" fill={VERDE} />
          </pattern>

          <pattern
            id="gente-mujeres"
            width="12"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <rect width="12" height="16" fill={CORAL} opacity="0.18" />
            <circle cx="6" cy="4" r="2.1" fill={CORAL} />
            <rect x="3.4" y="6.6" width="5.2" height="7" rx="2.4" fill={CORAL} />
          </pattern>
        </defs>

        {/* --- Encabezados de cada lado --- */}
        <text
          x={bordeIzq}
          y={18}
          textAnchor="end"
          fill={VERDE}
          fontFamily="var(--sans)"
          fontSize="13"
          fontWeight="600"
          letterSpacing="0.12em"
        >
          VARONES
        </text>
        <text
          x={bordeDer}
          y={18}
          textAnchor="start"
          fill={CORAL}
          fontFamily="var(--sans)"
          fontSize="13"
          fontWeight="600"
          letterSpacing="0.12em"
        >
          MUJERES
        </text>

        {/* --- Líneas guía verticales del eje X (población) --- */}
        {ticks.map((t) => (
          <g key={`tick-${t}`}>
            {/* lado varones (a la izquierda del centro) */}
            <line
              x1={bordeIzq - x(t)}
              x2={bordeIzq - x(t)}
              y1={MARGEN.top}
              y2={alto - MARGEN.bottom}
              stroke="#ffffff"
              strokeOpacity="0.06"
            />
            {/* lado mujeres (a la derecha del centro) */}
            <line
              x1={bordeDer + x(t)}
              x2={bordeDer + x(t)}
              y1={MARGEN.top}
              y2={alto - MARGEN.bottom}
              stroke="#ffffff"
              strokeOpacity="0.06"
            />
            {/* etiquetas de población (en miles) */}
            <text
              x={bordeIzq - x(t)}
              y={alto - MARGEN.bottom + 16}
              textAnchor="middle"
              fill="var(--texto-3)"
              fontFamily="var(--sans)"
              fontSize="11"
            >
              {Math.round(t / 1000)}k
            </text>
            <text
              x={bordeDer + x(t)}
              y={alto - MARGEN.bottom + 16}
              textAnchor="middle"
              fill="var(--texto-3)"
              fontFamily="var(--sans)"
              fontSize="11"
            >
              {Math.round(t / 1000)}k
            </text>
          </g>
        ))}

        {/* --- Las barras + etiquetas de edad --- */}
        {grupos.map((g, i) => {
          const y = yDe(i);
          const wVar = x(g.varones);
          const wMuj = x(g.mujeres);
          return (
            <g key={g.etiqueta}>
              {/* Barra varones: sale del centro hacia la IZQUIERDA. */}
              <rect
                x={bordeIzq - wVar}
                y={y}
                width={wVar}
                height={altoBarra}
                fill="url(#gente-varones)"
                rx="2"
              />
              {/* Barra mujeres: sale del centro hacia la DERECHA. */}
              <rect
                x={bordeDer}
                y={y}
                width={wMuj}
                height={altoBarra}
                fill="url(#gente-mujeres)"
                rx="2"
              />
              {/* Etiqueta de edad, centrada en el hueco del medio. */}
              <text
                x={(bordeIzq + bordeDer) / 2}
                y={y + altoBarra / 2 + 4}
                textAnchor="middle"
                fill="var(--texto-2)"
                fontFamily="var(--sans)"
                fontSize="11"
              >
                {g.etiqueta}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
