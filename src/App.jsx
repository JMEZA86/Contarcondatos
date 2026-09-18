import PiramidePoblacional from "./components/PiramidePoblacional.jsx";

// Componente principal de la app. Por ahora tiene dos partes:
//  1) el Hero (título + bajada) con la identidad "Estratos"
//  2) el Explorador con la pirámide nacional interactiva
// Más adelante se suman las otras capas (natalidad, ratio previsional, provincias).
export default function App() {
  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <header className="hero">
        <div className="contenedor">
          <p className="kicker">Argentina · Transición demográfica</p>
          <h1>La Pirámide Invertida</h1>
          <p className="bajada">
            Argentina nace menos y vive más. Cada vez hay menos gente joven
            sosteniendo a más gente mayor. Movés el año y ves cómo cambia la
            forma de la población, con datos oficiales de INDEC.
          </p>
        </div>
      </header>

      {/* ---------------- EXPLORADOR ---------------- */}
      <main className="explorador">
        <div className="contenedor">
          <h2>La forma cambia</h2>
          <p className="subtitulo">
            Población por edad y sexo, total del país. Deslizá el año para ver la
            proyección hasta 2040.
          </p>

          <PiramidePoblacional />

          <p className="fuente">
            Fuente: INDEC. Estimaciones y proyecciones de población 2022–2040,
            elaboradas con base en el Censo Nacional de Población, Hogares y
            Viviendas 2022. Las edades se agrupan en quinquenios; el grupo “100+”
            incluye 100 años y más.
          </p>
        </div>
      </main>
    </>
  );
}
