import { createContext, useContext, useState, useEffect } from "react";

// ==========================================================================
// Paleta de los colores de DATOS (varones / mujeres). Se puede alternar entre
// el modo normal (verde / coral, identidad "Estratos") y un modo apto para
// daltónicos (azul / naranja), que es el par distinguible por todos los tipos
// de daltonismo rojo-verde. Un solo botón cambia los colores en toda la pieza.
//
// Importante: solo cambian los colores que CODIFICAN un dato (el sexo). El
// acento coral de la marca (títulos, botones) no se toca.
// ==========================================================================
const NORMAL = { varones: "#1d9e75", mujeres: "#d85a30" }; // verde / coral
const DALTONICO = { varones: "#4f9fe0", mujeres: "#e07b39" }; // azul / naranja

const PaletaCtx = createContext({
  varones: NORMAL.varones,
  mujeres: NORMAL.mujeres,
  daltonico: false,
  toggle: () => {},
});

export function PaletaProvider({ children }) {
  // Recordamos la elección del usuario entre visitas (si el navegador deja).
  const [daltonico, setDaltonico] = useState(() => {
    try {
      return localStorage.getItem("daltonico") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("daltonico", daltonico ? "1" : "0");
    } catch {
      /* navegador sin localStorage: no pasa nada */
    }
  }, [daltonico]);

  const colores = daltonico ? DALTONICO : NORMAL;
  const valor = {
    varones: colores.varones,
    mujeres: colores.mujeres,
    daltonico,
    toggle: () => setDaltonico((d) => !d),
  };

  return <PaletaCtx.Provider value={valor}>{children}</PaletaCtx.Provider>;
}

export const usePaleta = () => useContext(PaletaCtx);
