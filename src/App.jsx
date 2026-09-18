import PiramidePoblacional from "./components/PiramidePoblacional.jsx";
import PorQueCambia from "./components/PorQueCambia.jsx";

// Componente principal. La narrativa se lee de arriba a abajo:
//   1) Hero: la pirámide interactiva (la forma cambia)
//   2) Por qué cambia: fecundidad + esperanza de vida
// Más adelante se suman el ratio previsional y la vista por provincia.
export default function App() {
  return (
    <>
      <main className="pagina">
        <div className="contenedor">
          <PiramidePoblacional />
        </div>
      </main>

      <PorQueCambia />
    </>
  );
}
