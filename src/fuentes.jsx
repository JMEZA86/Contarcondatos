// URLs de las fuentes de datos, en un solo lugar para mantenerlas consistentes
// en todas las notas al pie. Son los lugares oficiales de descarga de cada base.
export const FUENTES = {
  // INDEC — Estimaciones y proyecciones de población 2022-2040 (XLSX/CSV).
  indec: "https://censo.gob.ar/index.php/proyecciones/",
  // ANSES — Anuario Estadístico 2008/2023 (Cap. 4: aportantes/beneficiarios).
  anses:
    "https://www.anses.gob.ar/sites/default/files/2025-11/Anuario%20Estad%C3%ADstico_final.pdf",
  // OPC — Estado de situación del SIPA (cobertura del sistema previsional).
  opc: "https://opc.gob.ar/empleo-y-prevision-social/estado-de-situacion-del-sistema-integrado-previsional-argentino-sipa/",
  // Georef (Ministerio del Interior) — GeoJSON de provincias para el mapa.
  georef: "https://infra.datos.gob.ar/georef/provincias.geojson",
  // ONU — División de Población (World Population Prospects): nivel de reemplazo.
  onu: "https://population.un.org/wpp/",
};

// Componente de enlace de fuente reutilizable (abre en pestaña nueva, seguro).
export function LinkFuente({ href, children }) {
  return (
    <a className="link-fuente" href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  );
}
