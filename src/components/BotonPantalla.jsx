import { useState, useEffect } from "react";

// Botón flotante para entrar/salir de pantalla completa (modo presentación).
// Usa la Fullscreen API del navegador.
export default function BotonPantalla() {
  const [full, setFull] = useState(false);

  useEffect(() => {
    // Mantenemos el estado sincronizado si el usuario sale con Esc.
    const onChange = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <button
      className="btn-pantalla"
      onClick={toggle}
      aria-label={full ? "Salir de pantalla completa" : "Ver en pantalla completa"}
      title={full ? "Salir de pantalla completa" : "Modo presentación (pantalla completa)"}
    >
      {full ? (
        // ícono "contraer"
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3v6H3M21 9h-6V3M3 15h6v6M15 21v-6h6" />
        </svg>
      ) : (
        // ícono "expandir"
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
        </svg>
      )}
      <span>{full ? "Salir" : "Presentación"}</span>
    </button>
  );
}
