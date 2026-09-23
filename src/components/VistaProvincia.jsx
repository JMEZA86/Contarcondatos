import { useState } from "react";
import MiniLinea from "./MiniLinea.jsx";
import MapaProvincias from "./MapaProvincias.jsx";
import datos from "../../data/processed/provincias.json";
import { usePaleta } from "../paleta.jsx";
import { FUENTES, LinkFuente } from "../fuentes.jsx";

const GRIS = "#7a7266"; // país (comparación) — gris, no cambia con el modo daltónico

const coma1 = (v) => v.toFixed(1).replace(".", ",");
const coma2 = (v) => v.toFixed(2).replace(".", ",");
// Nombre corto para el selector y los títulos (Tierra del Fuego es larguísimo).
const corto = (n) => (n.startsWith("Tierra del Fuego") ? "Tierra del Fuego" : n);
// Formatea una diferencia con signo: +1,2 / -0,3
const signo = (v, fmt) => (v >= 0 ? "+" : "−") + fmt(Math.abs(v));

// ==========================================================================
// Capa 4 — "Cómo varía según la región".
// Selector de provincia + comparación de esperanza de vida y fecundidad contra
// el promedio nacional. (Versión sin mapa; el mapa GeoJSON se suma después.)
// ==========================================================================
export default function VistaProvincia() {
  const { varones: VERDE, mujeres: CORAL } = usePaleta();
  // Arranca en Ciudad Autónoma de Buenos Aires (código 2).
  const [codigo, setCodigo] = useState(2);
  const prov = datos.provincias.find((p) => p.codigo === codigo);
  const nac = datos.nacional;

  // Valores del último año (2040) para las cifras destacadas.
  const provEsp = prov.esperanza[prov.esperanza.length - 1]; // {varones, mujeres}
  const nacEsp = nac.esperanza[nac.esperanza.length - 1];
  const provFec = prov.fecundidad[prov.fecundidad.length - 1].valor;
  const nacFec = nac.fecundidad[nac.fecundidad.length - 1].valor;

  const difEspMuj = provEsp.mujeres - nacEsp.mujeres;
  const difFec = provFec - nacFec;

  return (
    <section className="capa">
      <div className="contenedor">
        <p className="kicker">Cómo varía según la región</p>
        <h2 className="capa-titulo">No todas las provincias son iguales</h2>
        <p className="capa-intro">
          El promedio nacional esconde diferencias grandes. Elegí una provincia y
          compará su esperanza de vida y su fecundidad con el país.
        </p>

        {/* Selector de provincia */}
        <div className="selector-prov">
          <label htmlFor="prov">Provincia:</label>
          <select
            id="prov"
            value={codigo}
            onChange={(e) => setCodigo(Number(e.target.value))}
          >
            {datos.provincias.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {corto(p.nombre)}
              </option>
            ))}
          </select>
        </div>

        <div className="prov-grid">
          {/* ---------- Mapa (izquierda) ---------- */}
          <div className="prov-mapa">
            <MapaProvincias seleccion={codigo} onSelect={setCodigo} />
          </div>

          {/* ---------- Tarjetas (derecha, apiladas) ---------- */}
          <div className="prov-cards">
          {/* ---------- Esperanza de vida ---------- */}
          <article className="fuerza">
            <p className="fuerza-eyebrow" style={{ color: CORAL }}>
              Esperanza de vida
            </p>
            <p className="fuerza-cifra">
              {coma1(provEsp.mujeres)}{" "}
              <span className="u">/ {coma1(provEsp.varones)} años</span>
            </p>
            <p className="fuerza-desc">
              Mujeres / varones en 2040. Las mujeres de {corto(prov.nombre)} viven{" "}
              <strong>{signo(difEspMuj, coma1)}</strong> años respecto del promedio
              nacional ({coma1(nacEsp.mujeres)}).
            </p>
            <MiniLinea
              lineas={[
                {
                  nombre: "Mujeres",
                  color: CORAL,
                  puntos: prov.esperanza.map((d) => ({ anio: d.anio, valor: d.mujeres })),
                },
                {
                  nombre: "Varones",
                  color: VERDE,
                  puntos: prov.esperanza.map((d) => ({ anio: d.anio, valor: d.varones })),
                },
              ]}
              dominioY={[70, 86]}
              formato={coma1}
              unidad="años al nacer"
            />
          </article>

          {/* ---------- Fecundidad ---------- */}
          <article className="fuerza">
            <p className="fuerza-eyebrow" style={{ color: CORAL }}>
              Fecundidad
            </p>
            <p className="fuerza-cifra">
              {coma2(provFec)} <span className="u">hijos por mujer</span>
            </p>
            <p className="fuerza-desc">
              Proyectada para 2040. Es <strong>{signo(difFec, coma2)}</strong>{" "}
              respecto del promedio nacional ({coma2(nacFec)}) — y sigue lejos del
              2,1 necesario para renovar la población.
            </p>
            <MiniLinea
              lineas={[
                {
                  nombre: corto(prov.nombre),
                  color: CORAL,
                  puntos: prov.fecundidad.map((d) => ({ anio: d.anio, valor: d.valor })),
                },
                {
                  nombre: "País",
                  color: GRIS,
                  etiquetar: false, // no etiquetar sus extremos (se pisan con la provincia)
                  puntos: nac.fecundidad.map((d) => ({ anio: d.anio, valor: d.valor })),
                },
              ]}
              dominioY={[0, 2.4]}
              referencia={{ valor: 2.1, label: "Reemplazo (2,1)" }}
              formato={coma2}
              unidad="hijos por mujer"
            />
          </article>
          </div>
        </div>

        <p className="fuente-mini">
          Fuente:{" "}
          <LinkFuente href={FUENTES.indec}>
            INDEC — Proyecciones por jurisdicción 2022–2040
          </LinkFuente>{" "}
          (base Censo 2022; años 2025, 2030, 2035 y 2040). A diferencia del total
          del país, el INDEC publica los indicadores por provincia solo como
          proyección: por eso esta sección no incluye serie histórica hacia
          atrás. Mapa:{" "}
          <LinkFuente href={FUENTES.georef}>
            Georef (Ministerio del Interior)
          </LinkFuente>
          . El nivel de reemplazo (2,1) es el estándar demográfico para
          poblaciones de baja mortalidad (
          <LinkFuente href={FUENTES.onu}>División de Población, ONU</LinkFuente>).
        </p>
      </div>
    </section>
  );
}
