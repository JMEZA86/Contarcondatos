import { useState } from "react";
import indicadores from "../../data/processed/indicadores_nacionales.json";
import { usePaleta } from "../paleta.jsx";

// Escala de la "regla" donde se ubica la apuesta y la respuesta.
const MIN = 0.8;
const MAX = 4.0;
const W = 680;
const H = 104;
const PAD = 34;
const coma = (v) => v.toFixed(1).replace(".", ",");

// ==========================================================================
// "Adiviná antes de ver" (guess-then-reveal). Antes de mostrar el dato de
// fecundidad, se le pide al usuario que adivine cuántos hijos tiene en promedio
// una mujer en Argentina. Al revelar, se compara su apuesta con la realidad
// (~1,3) y con el nivel de reemplazo (2,1). El contraste engancha y fija el dato.
// ==========================================================================
export default function Adivina() {
  const { mujeres: CORAL } = usePaleta();
  const real = indicadores.fecundidad.serie[0].valor; // 1,27 (proyección 2025)
  const reemplazo = indicadores.fecundidad.nivel_reemplazo; // 2,1

  const [apuesta, setApuesta] = useState(2.5);
  const [revelado, setRevelado] = useState(false);

  // valor -> x en píxeles dentro de la regla
  const x = (v) => PAD + ((v - MIN) / (MAX - MIN)) * (W - 2 * PAD);
  const ejeY = 54;

  const diferencia = apuesta - real;

  return (
    <section className="capa capa-adivina">
      <div className="contenedor">
        <p className="kicker">Antes de seguir…</p>
        <h2 className="capa-titulo">
          ¿Cuántos hijos tiene, en promedio, una mujer en Argentina?
        </h2>
        <p className="capa-intro">
          Arrastrá tu apuesta y después revelá el dato real.
        </p>

        {/* Regla con la apuesta (y, al revelar, la realidad y el reemplazo) */}
        <svg viewBox={`0 0 ${W} ${H}`} className="adivina-regla" role="img">
          {/* eje */}
          <line x1={PAD} x2={W - PAD} y1={ejeY} y2={ejeY} stroke="#4a4038" strokeWidth="2" />
          {[1, 2, 3, 4].map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={ejeY - 5} y2={ejeY + 5} stroke="#4a4038" />
              <text x={x(t)} y={ejeY + 22} textAnchor="middle" fill="var(--texto-3)" fontFamily="var(--sans)" fontSize="12">
                {t}
              </text>
            </g>
          ))}

          {/* Marca de la apuesta del usuario */}
          <g>
            <path
              d={`M ${x(apuesta)} ${ejeY - 2} l -7 -12 l 14 0 Z`}
              fill="var(--texto-1)"
            />
            <text x={x(apuesta)} y={ejeY - 18} textAnchor="middle" fill="var(--texto-1)" fontFamily="var(--sans)" fontSize="13" fontWeight="700">
              {coma(apuesta)}
            </text>
          </g>

          {/* Al revelar: reemplazo (2,1) y la realidad */}
          {revelado && (
            <g>
              <line x1={x(reemplazo)} x2={x(reemplazo)} y1={ejeY - 30} y2={ejeY + 10} stroke="var(--texto-3)" strokeDasharray="4 4" />
              <text x={x(reemplazo)} y={ejeY + 38} textAnchor="middle" fill="var(--texto-3)" fontFamily="var(--sans)" fontSize="11">
                reemplazo 2,1
              </text>
              <circle cx={x(real)} cy={ejeY} r="6" fill={CORAL} stroke="var(--fondo)" strokeWidth="2" />
              <text x={x(real)} y={ejeY + 38} textAnchor="middle" fill={CORAL} fontFamily="var(--sans)" fontSize="12" fontWeight="700">
                real {coma(real)}
              </text>
            </g>
          )}
        </svg>

        {/* Slider de la apuesta */}
        {!revelado && (
          <>
            <input
              type="range"
              min={MIN}
              max={MAX}
              step="0.1"
              value={apuesta}
              onChange={(e) => setApuesta(Number(e.target.value))}
              aria-label="Tu apuesta de hijos por mujer"
            />
            <div>
              <button className="adivina-btn" onClick={() => setRevelado(true)}>
                Ver la respuesta
              </button>
            </div>
          </>
        )}

        {/* Reveal */}
        {revelado && (
          <div className="adivina-reveal">
            <p className="adivina-frase">
              La realidad es <strong style={{ color: CORAL }}>{coma(real)}</strong>{" "}
              hijos por mujer.
            </p>
            <p className="adivina-detalle">
              {diferencia > 0.2
                ? "Como la mayoría, apostaste más alto. "
                : diferencia < -0.2
                ? "Apostaste incluso más bajo que la realidad. "
                : "¡Muy cerca! "}
              Argentina está <strong>muy por debajo del 2,1</strong> que hace
              falta para que una población se renueve sola — y por eso la base de
              la pirámide se angosta.
            </p>
            <button
              className="adivina-reset"
              onClick={() => {
                setRevelado(false);
                setApuesta(2.5);
              }}
            >
              ↺ Probar de nuevo
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
