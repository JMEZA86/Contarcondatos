import { FUENTES, LinkFuente } from "../fuentes.jsx";

// ==========================================================================
// Colofón (footer): cierra el sitio con el título, todas las fuentes en un
// solo lugar y la firma con seudónimo. La descripción metodológica completa
// va en el Formulario de Inscripción, no en la pieza.
// ==========================================================================
export default function Colofon() {
  return (
    <footer className="colofon">
      <div className="contenedor">
        <p className="colofon-titulo">La Argentina que envejece</p>
        <p className="colofon-bajada">
          Nacer menos, vivir más: la ecuación que cambia el país.
        </p>
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
  );
}
