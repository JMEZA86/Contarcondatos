import { FUENTES, LinkFuente } from "../fuentes.jsx";

// ==========================================================================
// Cierre del sitio: metodología + colofón (footer).
// La sección "Cómo se hizo" suma rigor y transparencia (datos, método y —sobre
// todo— los límites, para no prometer lo que el dato no da). El colofón cierra
// con seudónimo, fecha y todas las fuentes en un solo lugar.
// ==========================================================================
export default function Metodologia() {
  return (
    <>
      <section className="capa capa-metodo">
        <div className="contenedor">
          <p className="kicker">Metodología</p>
          <h2 className="capa-titulo">Cómo se hizo, y con qué límites</h2>
          <p className="capa-intro">
            Todo el proyecto usa datos oficiales y abiertos del INDEC. Nada está
            inventado: cuando un dato no existe, se aclara en vez de rellenarlo.
          </p>

          <div className="metodo-grid">
            <article className="metodo-item">
              <h3>Datos</h3>
              <p>
                Censo 2022, las Estimaciones y proyecciones de población
                2022–2040 y el Dosier{" "}
                <em>“La transformación de la población argentina”</em> (INDEC,
                2025). Todas fuentes abiertas y citadas en cada gráfico.
              </p>
            </article>

            <article className="metodo-item">
              <h3>Método</h3>
              <p>
                Limpieza y cálculo en Python. La serie histórica 2001–2022 se
                leyó de los gráficos oficiales del Dosier y se{" "}
                <strong>validó contra las cifras que el propio INDEC publica</strong>{" "}
                (error ±0,02 en fecundidad). La proyección 2025–2040 sale de los
                cuadros oficiales.
              </p>
            </article>

            <article className="metodo-item">
              <h3>Límites (lo que no hicimos)</h3>
              <p>
                Las provincias tienen solo proyección: el INDEC no publica su
                serie histórica. El “sostén” es demográfico{" "}
                <em>potencial</em>, no el ratio real del sistema previsional. Y
                la esperanza de vida es un indicador poblacional, no una
                predicción individual.
              </p>
            </article>
          </div>
        </div>
      </section>

      <footer className="colofon">
        <div className="contenedor">
          <p className="colofon-titulo">La Argentina que envejece</p>
          <p className="colofon-bajada">Nacer menos, vivir más: la ecuación que cambia el país.</p>
          <p className="colofon-fuentes">
            Fuentes:{" "}
            <LinkFuente href={FUENTES.indec}>INDEC — Proyecciones 2022–2040</LinkFuente>
            {" · "}
            <LinkFuente href={FUENTES.dosier}>INDEC — Dosier 2025</LinkFuente>
            {" · "}
            <LinkFuente href={FUENTES.anses}>ANSES</LinkFuente>
            {" · "}
            <LinkFuente href={FUENTES.opc}>OPC</LinkFuente>
            {" · "}
            <LinkFuente href={FUENTES.georef}>Georef</LinkFuente>
            {" · "}
            <LinkFuente href={FUENTES.onu}>ONU</LinkFuente>
          </p>
          <p className="colofon-firma">
            Exploración interactiva · <strong>Curuzú</strong> · 2026 · Datos
            oficiales y abiertos del INDEC.
          </p>
        </div>
      </footer>
    </>
  );
}
