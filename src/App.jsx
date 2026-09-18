import PiramidePoblacional from "./components/PiramidePoblacional.jsx";
import PorQueCambia from "./components/PorQueCambia.jsx";
import PresionQueViene from "./components/PresionQueViene.jsx";

// Componente principal. La narrativa se lee de arriba a abajo:
//   1) Hero: la pirámide interactiva (la forma cambia)
//   2) Por qué cambia: fecundidad + esperanza de vida
//   3) Qué consecuencia tiene: el sostén demográfico proyectado
// Más adelante se suma la vista por provincia.
export default function App() {
  return (
    <>
      <main className="pagina">
        <div className="contenedor">
          <PiramidePoblacional />
        </div>
      </main>

      <PorQueCambia />
      <PresionQueViene />
    </>
  );
}
