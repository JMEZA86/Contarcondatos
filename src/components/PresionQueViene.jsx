import MiniLinea from "./MiniLinea.jsx";
import ratio from "../../data/processed/ratio_sosten.json";

const CORAL = "#d85a30";
const coma = (v) => v.toFixed(1).replace(".", ",");

// ==========================================================================
// Capa 3 — "Qué consecuencia tiene".
// Muestra la PROYECCIÓN del sostén demográfico: cuántas personas en edad de
// trabajar (15-64) hay por cada persona de 65+, 2022 -> 2040. Cae de 5,5 a 4,2.
// Como ancla del presente, suma el dato real del sistema previsional (ANSES/OPC),
// dejando claro que la proyección es demográfica (potencial), no del sistema.
// ==========================================================================
export default function PresionQueViene() {
  const serie = ratio.serie;
  const r = ratio.resumen;
  const ctx = ratio.contexto_anses;

  return (
    <section className="capa">
      <div className="contenedor">
        <p className="kicker">Qué consecuencia tiene</p>
        <h2 className="capa-titulo">Cada vez menos sostén</h2>
        <p className="capa-intro">
          Si se nace menos y se vive más, queda menos gente en edad de trabajar
          por cada persona mayor. No es una predicción incierta: es aritmética de
          la población que ya nació.
        </p>

        <div className="sosten-layout">
          {/* Columna izquierda: cifra + explicación + ancla del presente */}
          <div className="sosten-texto">
            <p className="sosten-cifra">
              {coma(r.sosten_final)}{" "}
              <span className="u">
                personas en edad activa por cada persona de 65+
              </span>
            </p>
            <p className="sosten-sub">
              Es lo proyectado para <strong>{r.anio_final}</strong>. Eran{" "}
              <strong>{coma(r.sosten_inicial)}</strong> en {r.anio_inicial}: una
              caída del <strong>{coma(Math.abs(r.caida_pct))}%</strong> en menos
              de 20 años.
            </p>

            <div className="ancla-hoy">
              <p className="ancla-titulo">En el sistema real, hoy</p>
              <p className="ancla-texto">
                Hay ~<strong>{coma(ctx.aportantes_por_beneficiario_2023)}</strong>{" "}
                aportantes por cada beneficiario, y el sistema cubre solo el{" "}
                <strong>51%</strong> de los beneficios que paga.
              </p>
              <p className="ancla-fuente">ANSES / OPC · 2021–2023</p>
            </div>
          </div>

          {/* Columna derecha: la línea 2022-2040 */}
          <div className="sosten-grafico">
            <MiniLinea
              lineas={[
                {
                  nombre: "Sostén",
                  color: CORAL,
                  puntos: serie.map((d) => ({ anio: d.anio, valor: d.sosten })),
                },
              ]}
              dominioY={[3.5, 6]}
              formato={coma}
              unidad="activos (15-64) por cada mayor"
            />
          </div>
        </div>

        <p className="fuente-mini">
          Gráfico: elaboración propia sobre INDEC (proyecciones 2022–2040). Es el
          sostén demográfico <em>potencial</em> — toda la población en edad de
          trabajar, no solo quienes aportan. El ratio del sistema previsional real
          (ANSES) se mantuvo estable entre 2009 y 2023; lo que empeora es la
          presión demográfica de fondo.
        </p>
      </div>
    </section>
  );
}
