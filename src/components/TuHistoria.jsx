import { useState } from "react";
import piramide from "../../data/processed/piramide_nacional.json";
import ratio from "../../data/processed/ratio_sosten.json";
import provinciasData from "../../data/processed/provincias.json";
import { usePaleta } from "../paleta.jsx";
import { FUENTES, LinkFuente } from "../fuentes.jsx";

const fmt = (n) => Math.round(n).toLocaleString("es-AR");
const coma1 = (v) => v.toFixed(1).replace(".", ",");
const signo = (v) => (v >= 0 ? "+" : "−") + coma1(Math.abs(v));
const corto = (n) => (n.startsWith("Tierra del Fuego") ? "Tierra del Fuego" : n);

// ==========================================================================
// "¿Y vos?" — sección de personalización. El usuario ingresa su edad, provincia
// y sexo, y ve su lugar en la transición demográfica: su cohorte, cuánto va a
// caer el sostén para cuando sea mayor, y la esperanza de vida de su provincia.
// Todo se calcula con los datos que ya tiene el proyecto (INDEC).
// ==========================================================================
export default function TuHistoria() {
  const { varones: VERDE, mujeres: CORAL } = usePaleta();
  const [edad, setEdad] = useState(30);
  const [codProv, setCodProv] = useState(6); // Buenos Aires por defecto
  const [sexo, setSexo] = useState("mujeres");

  // Año en curso, acotado al rango con datos (2022–2040). El cálculo siempre
  // parte del año actual hacia 2040 y se actualiza solo con el paso del tiempo.
  const ANIO_FINAL = 2040;
  const anioActual = Math.min(ANIO_FINAL, Math.max(2022, new Date().getFullYear()));

  // Edad "limpia" para los cálculos (0 a 100).
  const e = Math.max(0, Math.min(100, Number.isFinite(edad) ? edad : 0));
  const edad2040 = e + (ANIO_FINAL - anioActual); // edad proyectada en 2040

  // Cohorte: cuántas personas de esa edad y sexo hay este año.
  const pirAnio = piramide.piramide[String(anioActual)] || piramide.piramide["2022"];
  const filaEdad = pirAnio.find((f) => f.edad === e);
  const cohorte = filaEdad ? filaEdad[sexo] : 0;

  // Sostén demográfico: hoy (año actual) vs 2040.
  const filaSostHoy = ratio.serie.find((d) => d.anio === anioActual);
  const sostHoy = filaSostHoy ? filaSostHoy.sosten : ratio.resumen.sosten_inicial;
  const sost2040 = ratio.resumen.sosten_final; // 4,23

  // Esperanza de vida al nacer proyectada para 2040 en su provincia vs. el
  // promedio nacional, según el sexo elegido. Usamos 2040 (último año) para que
  // sea CONSISTENTE con la vista por provincia (Capa 4), que también usa 2040.
  const prov = provinciasData.provincias.find((p) => p.codigo === codProv);
  const ultimo = prov.esperanza.length - 1;
  const espProv = prov.esperanza[ultimo][sexo];
  const espNac = provinciasData.nacional.esperanza[ultimo][sexo];
  const difEsp = espProv - espNac;

  const sexoLabel = sexo === "mujeres" ? "las mujeres" : "los varones";
  const colorSexo = sexo === "mujeres" ? CORAL : VERDE;

  return (
    <section className="capa capa-vos">
      <div className="contenedor">
        <p className="kicker">Esto te toca a vos</p>
        <h2 className="capa-titulo">¿Y vos, dónde estás en esta historia?</h2>

        {/* --- Controles --- */}
        <div className="vos-controles">
          <label className="vos-campo">
            <span>Tengo</span>
            <input
              type="number"
              min="0"
              max="100"
              value={edad}
              onChange={(ev) => setEdad(parseInt(ev.target.value, 10))}
            />
            <span>años</span>
          </label>

          <label className="vos-campo">
            <span>en</span>
            <select value={codProv} onChange={(ev) => setCodProv(Number(ev.target.value))}>
              {provinciasData.provincias.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {corto(p.nombre)}
                </option>
              ))}
            </select>
          </label>

          <div className="vos-sexo" role="group" aria-label="Sexo">
            <button
              className={sexo === "mujeres" ? "activo" : ""}
              onClick={() => setSexo("mujeres")}
              style={sexo === "mujeres" ? { background: CORAL, borderColor: CORAL } : {}}
            >
              Mujer
            </button>
            <button
              className={sexo === "varones" ? "activo" : ""}
              onClick={() => setSexo("varones")}
              style={sexo === "varones" ? { background: VERDE, borderColor: VERDE } : {}}
            >
              Varón
            </button>
          </div>
        </div>

        {/* --- Resultado personalizado --- */}
        <div className="vos-resultado">
          <p className="vos-frase">
            En 2040 vas a tener{" "}
            <span className="vos-num" style={{ color: colorSexo }}>
              {edad2040}
            </span>{" "}
            años.
          </p>

          <p className="vos-detalle">
            Ese año, por cada persona mayor va a haber{" "}
            <strong>{coma1(sost2040)}</strong> personas en edad de trabajar. Hoy
            son <strong>{coma1(sostHoy)}</strong>.{" "}
            {edad2040 >= 65 && (
              <span>Y vos ya vas a estar entre las personas que el sistema sostiene.</span>
            )}
          </p>

          <p className="vos-detalle">
            {cohorte > 0 ? (
              <>
                Sos {sexo === "mujeres" ? "una" : "uno"} de{" "}
                <strong>{fmt(cohorte)}</strong> {sexo} de {e} años en el país.{" "}
              </>
            ) : null}
            En <strong>{corto(prov.nombre)}</strong>, la esperanza de vida al
            nacer proyectada a 2040 para {sexoLabel} es{" "}
            <strong>{coma1(espProv)} años</strong> —{" "}
            <strong style={{ color: difEsp >= 0 ? VERDE : CORAL }}>
              {signo(difEsp)}
            </strong>{" "}
            respecto del promedio nacional ({coma1(espNac)}).
          </p>
        </div>

        <p className="fuente-mini">
          Cálculos propios sobre{" "}
          <LinkFuente href={FUENTES.indec}>INDEC</LinkFuente>. La esperanza de
          vida es al nacer, un indicador de la provincia — no una predicción
          individual.
        </p>
      </div>
    </section>
  );
}
