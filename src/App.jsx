import PiramidePoblacional from "./components/PiramidePoblacional.jsx";

// Componente principal. La vista de la pirámide se arma en dos columnas
// (texto+controles a la izquierda, gráfico a la derecha) que entran en una
// sola pantalla en desktop. Más adelante se suman las otras capas debajo.
export default function App() {
  return (
    <main className="pagina">
      <div className="contenedor">
        <PiramidePoblacional />
      </div>
    </main>
  );
}
