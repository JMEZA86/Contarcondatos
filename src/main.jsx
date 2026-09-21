// Punto de entrada de la app. Acá React "monta" el componente principal (App)
// dentro del <div id="root"> del index.html.
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { PaletaProvider } from "./paleta.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PaletaProvider>
      <App />
    </PaletaProvider>
  </React.StrictMode>
);
