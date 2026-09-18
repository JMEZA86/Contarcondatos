import MiniLinea from "./MiniLinea.jsx";
import indicadores from "../../data/processed/indicadores_nacionales.json";

// Colores de la paleta "Estratos".
const VERDE = "#1d9e75"; // varones
const CORAL = "#d85a30"; // mujeres / acento

// Formatea un número con coma decimal, estilo argentino (1.4 -> "1,4").
const coma = (v) => v.toFixed(1).replace(".", ",");

// ==========================================================================
// Capa 2 — "Por qué cambia".
// Dos fuerzas explican que la pirámide se invierta:
//   1) Menos nacimientos (fecundidad debajo del reemplazo) -> base más angosta
//   2) Más años de vida (esperanza de vida en alza)        -> cúpula más ancha
// Cada fuerza muestra una cifra grande + un mini-gráfico de su evolución.
// ==========================================================================
export default function PorQueCambia() {
  const fec = indicadores.fecundidad;
  const esp = indicadores.esperanza_vida;

  // Valores puntuales para las cifras grandes (año final: 2040).
  const fec2040 = fec.serie[fec.serie.length - 1].valor; // 1.4
  const esp2040 = esp.serie[esp.serie.length - 1]; // {varones, mujeres}
  const esp2025 = esp.serie[0];
  const gananciaMuj = (esp2040.mujeres - esp2025.mujeres).toFixed(1).replace(".", ",");
  const gananciaVar = (esp2040.varones - esp2025.varones).toFixed(1).replace(".", ",");

  return (
    <section className="capa">
      <div className="contenedor">
        <p className="kicker">Por qué cambia</p>
        <h2 className="capa-titulo">Dos fuerzas invierten la pirámide</h2>
        <p className="capa-intro">
          La forma no cambia por azar. Se nace menos y se vive más — y esas dos
          fuerzas, juntas, empujan a la población hacia arriba.
        </p>

        <div className="fuerzas">
          {/* ---------- Fuerza 1: menos nacimientos ---------- */}
          <article className="fuerza">
            <p className="fuerza-eyebrow" style={{ color: CORAL }}>
              Menos nacimientos
            </p>
            <p className="fuerza-cifra">
              {coma(fec2040)} <span className="u">hijos por mujer</span>
            </p>
            <p className="fuerza-desc">
              Es lo proyectado para 2040. Pero hacen falta{" "}
              <strong>2,1</strong> para que una población se renueve sola: hace
              décadas que Argentina está por debajo. Por eso la{" "}
              <strong>base</strong> de la pirámide se angosta.
            </p>
            <MiniLinea
              lineas={[
                {
                  nombre: "Fecundidad",
                  color: CORAL,
                  puntos: fec.serie.map((d) => ({ anio: d.anio, valor: d.valor })),
                },
              ]}
              dominioY={[0, 2.4]}
              referencia={{ valor: fec.nivel_reemplazo, label: "Reemplazo (2,1)" }}
              formato={coma}
              unidad="hijos por mujer"
            />
          </article>

          {/* ---------- Fuerza 2: más años de vida ---------- */}
          <article className="fuerza">
            <p className="fuerza-eyebrow" style={{ color: VERDE }}>
              Más años de vida
            </p>
            <p className="fuerza-cifra">
              {coma(esp2040.mujeres)}{" "}
              <span className="u">/ {coma(esp2040.varones)} años</span>
            </p>
            <p className="fuerza-desc">
              Esperanza de vida al nacer en 2040 (mujeres / varones). Sigue
              subiendo — <strong>+{gananciaMuj}</strong> y{" "}
              <strong>+{gananciaVar}</strong> años desde 2025. Más gente llega a
              edades altas, y la <strong>cúpula</strong> de la pirámide se
              ensancha.
            </p>
            <MiniLinea
              lineas={[
                {
                  nombre: "Mujeres",
                  color: CORAL,
                  puntos: esp.serie.map((d) => ({ anio: d.anio, valor: d.mujeres })),
                },
                {
                  nombre: "Varones",
                  color: VERDE,
                  puntos: esp.serie.map((d) => ({ anio: d.anio, valor: d.varones })),
                },
              ]}
              dominioY={[70, 86]}
              formato={coma}
              unidad="años al nacer"
            />
          </article>
        </div>

        <p className="fuente-mini">
          Fuente: INDEC. Estimaciones y proyecciones de población 2022–2040
          (cuadros de fecundidad y esperanza de vida). Los cuadros publican solo
          los años 2025, 2030, 2035 y 2040.
        </p>
      </div>
    </section>
  );
}
