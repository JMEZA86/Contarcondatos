import { FUENTES, LinkFuente } from "../fuentes.jsx";

// ==========================================================================
// Colofón (footer): cierra el sitio con el título y todas las fuentes en un
// solo lugar. Sin firma: la obra se presenta de forma anónima (evaluación a
// ciegas) y el seudónimo va solo en el Formulario de Inscripción, igual que la
// descripción metodológica.
// ==========================================================================
export default function Colofon() {
  return (
    <footer className="colofon">
      <div className="contenedor">
        <p className="colofon-titulo">La Argentina que envejece</p>
        <p className="colofon-bajada">
          Nacer menos, vivir más: la ecuación que cambia el país.
        </p>
        <div className="colofon-fuentes">
          <p className="colofon-fuentes-tit">Fuentes · datos oficiales y abiertos</p>
          <ul>
            <li>
              <LinkFuente href={FUENTES.indec}>
                INDEC — Estimaciones y proyecciones de población 2022–2040
              </LinkFuente>{" "}
              (base Censo 2022): pirámide, fecundidad y esperanza de vida proyectadas.
            </li>
            <li>
              <LinkFuente href={FUENTES.dosier}>
                INDEC — Dosier «La transformación de la población argentina» (2025)
              </LinkFuente>
              : serie histórica 2001–2022 de fecundidad y esperanza de vida.
            </li>
            <li>
              <LinkFuente href={FUENTES.indec}>
                INDEC — Proyecciones por jurisdicción 2022–2040
              </LinkFuente>
              : indicadores por provincia.
            </li>
            <li>
              <LinkFuente href={FUENTES.anses}>ANSES — Anuario Estadístico</LinkFuente>
              : aportantes por beneficiario del sistema previsional.
            </li>
            <li>
              <LinkFuente href={FUENTES.opc}>OPC — Estado de situación del SIPA</LinkFuente>
              : cobertura del sistema (51,6%).
            </li>
            <li>
              <LinkFuente href={FUENTES.georef}>Georef (Ministerio del Interior)</LinkFuente>
              : cartografía de las provincias.
            </li>
            <li>
              <LinkFuente href={FUENTES.onu}>ONU — División de Población (WPP)</LinkFuente>
              : nivel de reemplazo (2,1 hijos por mujer).
            </li>
          </ul>
        </div>
        <p className="colofon-firma">
          Exploración interactiva · 2026 · Datos oficiales y abiertos del INDEC.
        </p>
      </div>
    </footer>
  );
}
