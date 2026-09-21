import { usePaleta } from "../paleta.jsx";

// Botón flotante que activa/desactiva el modo apto para daltónicos
// (cambia el par verde/coral por azul/naranja, distinguible por todos).
export default function BotonDaltonico() {
  const { daltonico, toggle } = usePaleta();

  return (
    <button
      className={"btn-daltonico" + (daltonico ? " activo" : "")}
      onClick={toggle}
      aria-pressed={daltonico}
      title={
        daltonico
          ? "Volver a los colores originales"
          : "Colores aptos para daltónicos (azul / naranja)"
      }
    >
      {/* ícono de ojo */}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span>{daltonico ? "Daltónico ✓" : "Daltónico"}</span>
    </button>
  );
}
