import PiramidePoblacional from "./components/PiramidePoblacional.jsx";
import PorQueCambia from "./components/PorQueCambia.jsx";
import PresionQueViene from "./components/PresionQueViene.jsx";
import VistaProvincia from "./components/VistaProvincia.jsx";
import TuHistoria from "./components/TuHistoria.jsx";
import Colofon from "./components/Colofon.jsx";
import BotonPantalla from "./components/BotonPantalla.jsx";
import BotonDaltonico from "./components/BotonDaltonico.jsx";

// Componente principal. La narrativa se lee de arriba a abajo:
//   1) Hero: la pirámide interactiva (la forma cambia)
//   2) Por qué cambia: fecundidad + esperanza de vida
//   3) Qué consecuencia tiene: el sostén demográfico proyectado
//   4) Cómo varía según la región: vista por provincia
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
      <VistaProvincia />
      <TuHistoria />
      <Colofon />

      <div className="botones-flotantes">
        <BotonDaltonico />
        <BotonPantalla />
      </div>
    </>
  );
}
