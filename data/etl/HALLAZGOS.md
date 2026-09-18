# Hallazgos de la exploración de datos (INDEC)

> Generado a partir de `data/etl/01_explorar.py`. Este documento describe la
> estructura **real** de los 4 archivos crudos de `data/raw/`, los problemas de
> datos detectados y las decisiones para el script de limpieza (ETL).
> Fecha de exploración: 2026-09-18.

---

## Resumen de los 4 archivos

| Archivo | Tipo | Filas | Qué contiene | Capa del proyecto |
|---|---|---|---|---|
| `proyecciones_nacionales_2022_2040_base.csv` | CSV | 3.838 | Población por edad (0–100, año a año) y sexo, total país, 2022–2040 | 1 — Pirámide nacional |
| `proyecciones_jurisdicciones_2022_2040_base.csv` | CSV | 19.152 | Población por grupo de edad (de a 5 años) y sexo, por provincia, 2022–2040 | 4 — Pirámide por provincia |
| `proyecciones_nacionales_2022_2040_c3_6.xlsx` | Excel (5 hojas) | — | Natalidad, mortalidad, esperanza de vida, fecundidad — nacional | 2 — Por qué cambia |
| `proyecciones_jurisdicciones_2022_2040_c3_c4.xlsx` | Excel (3 hojas) | — | Esperanza de vida y fecundidad por provincia | 4 — Vista por provincia |

Ambos CSV usan **punto y coma (`;`)** como separador y se leen bien en **UTF-8**.

---

## 1) CSV nacional — `proyecciones_nacionales_2022_2040_base.csv`

- **Columnas:** `Edad`, `Sexo`, `Poblacion`, `Fecha` (limpias, sin espacios, todas enteras).
- **Edad:** 0 a 100 (año a año, 101 valores). El 100 incluye "100 y más".
- **Sexo:** 2 valores → `1` y `2`.
- **Fecha (año):** 2022 a 2040 (19 años, uno por uno).
- **Poblacion:** de 936 a 396.705. **Sin nulos.**
- Chequeo de completitud: 101 edades × 2 sexos × 19 años = **3.838 filas** ✓ (coincide).

**Estado:** limpio. Casi listo para usar tal cual.

---

## 2) CSV jurisdicciones — `proyecciones_jurisdicciones_2022_2040_base.csv`

- **Columnas (¡ojo!):** vienen con **espacios en los nombres**:
  `' Jurisdiccion '`, `' Sexo '`, `' Edad(q) '`, `' Poblacion'`, `'Fecha'`.
  → Hay que hacer `.strip()` a los nombres de columna al leer.
- **Edad(q):** grupos de 5 años → 0, 5, 10, …, 100 (21 grupos). El `(q)` es por "quinquenal".
- **Sexo:** `1` y `2` (igual que el nacional).
- **Jurisdiccion:** 24 códigos → `2, 6, 10, 14, … 94` (ver tabla de mapeo abajo).
- **Fecha:** 2022 a 2040.
- Chequeo: 24 juris × 2 sexos × 21 grupos × 19 años = **19.152 filas** ✓.

### ⚠️ Problema de datos detectado
La columna `Poblacion` quedó leída como **texto**, no como número. Motivo:
**5 filas** traen un guión `"-"` en vez de un número. Son todas de
**Chaco (código 22), Sexo 2, edad 100+, años 2031–2035**: INDEC marca así un
valor tan chico que redondea a cero.

- **Decisión ETL:** reemplazar `"-"` por `0` y convertir la columna a entero.
- Rango real (ignorando los guiones): **2 a 765.785**.

---

## 3) Códigos de Sexo (aplica a ambos CSV)

INDEC codifica el sexo como:

| Código | Sexo | Color en el proyecto |
|---|---|---|
| `1` | Varones | Verde `#1D9E75` |
| `2` | Mujeres | Coral `#D85A30` |

> Convención estándar de INDEC. Se puede verificar de forma indirecta con la
> esperanza de vida: en el Excel nacional, "Varones" siempre da un valor menor
> que "Mujeres", consistente con que Sexo=1 son varones.

---

## 4) Códigos de Jurisdicción → Provincia

Los códigos del CSV son los oficiales de INDEC. Mapeo propuesto (a **verificar**
contra los nombres del Excel y contra el GeoJSON de georef antes de usarlo para
el mapa):

| Código | Provincia | | Código | Provincia |
|---|---|---|---|---|
| 2 | Ciudad Autónoma de Buenos Aires | | 54 | Misiones |
| 6 | Buenos Aires | | 58 | Neuquén |
| 10 | Catamarca | | 62 | Río Negro |
| 14 | Córdoba | | 66 | Salta |
| 18 | Corrientes | | 70 | San Juan |
| 22 | Chaco | | 74 | San Luis |
| 26 | Chubut | | 78 | Santa Cruz |
| 30 | Entre Ríos | | 82 | Santa Fe |
| 34 | Formosa | | 86 | Santiago del Estero |
| 38 | Jujuy | | 90 | Tucumán |
| 42 | La Pampa | | 94 | Tierra del Fuego |
| 46 | La Rioja | | | |
| 50 | Mendoza | | | |

> Para unir con el mapa (GeoJSON de georef) conviene usar estos códigos como
> clave, no los nombres (los nombres cambian de acento/formato entre fuentes).

---

## 5) Excel nacional — `proyecciones_nacionales_2022_2040_c3_6.xlsx`

Tiene **5 hojas**: `Índice`, `Cuadro 3`, `Cuadro 4`, `Cuadro 5`, `Cuadro 6`.

Todas las hojas de datos tienen **títulos y notas arriba de la tabla real** (el
encabezado NO está en la primera fila) y una fila de **"Fuente: INDEC…" al final**.
→ Al leerlas hay que **saltar filas** (`skiprows`) y cortar la fila de fuente.

| Hoja | Contenido | Años disponibles | Uso |
|---|---|---|---|
| Cuadro 3 | Tasas (por mil): crecimiento total, vegetativo, **natalidad**, mortalidad, migración neta | 2025, 2030, 2035, 2040 | **Capa 2 (natalidad)** |
| Cuadro 4 | Inmigrantes, emigrantes, saldo migratorio | períodos 2023-24 … 2035-39 | opcional |
| Cuadro 5 | **Esperanza de vida al nacer** por sexo (Varones / Mujeres / Diferencia) | 2025, 2030, 2035, 2040 | Capa 2 / contexto |
| Cuadro 6 | **Tasa global de fecundidad** (hijos por mujer) | 2025, 2030, 2035, 2040 | **Capa 2 (fecundidad)** |

Datos clave que ya se leen: natalidad baja de 9.5‰ (2025) a 10.2‰ (2040) —
ojo, se mueve poco; fecundidad **1.27 → 1.40** hijos por mujer; esperanza de vida
Varones 75.7→78.7 y Mujeres 81.1→83.0.

> ⚠️ **Importante:** estos indicadores solo traen **4 años sueltos**
> (2025/2030/2035/2040), no una serie anual. Para un gráfico de línea suave habrá
> que decidir si se interpola entre esos puntos o se muestran como hitos.

---

## 6) Excel jurisdicciones — `proyecciones_jurisdicciones_2022_2040_c3_c4.xlsx`

Tiene **3 hojas**: `Índice de cuadros`, `Cuadro 3`, `Cuadro 4`.
Mismo patrón: títulos arriba, encabezados en dos niveles.

| Hoja | Contenido | Formato | Uso |
|---|---|---|---|
| Cuadro 3 | **Esperanza de vida al nacer** por sexo y provincia | Filas = provincia; columnas = Varones(2025-40) y Mujeres(2025-40); hay una **columna vacía separadora** entre ambos bloques | **Capa 4** |
| Cuadro 4 | **Tasa global de fecundidad** por provincia | Filas = provincia; columnas = 2025, 2030, 2035, 2040 | **Capa 4** |

Detalles a manejar en el ETL:
- Los encabezados están en **dos filas** (una dice "Varones/Mujeres", otra los años).
- Hay una **columna intermedia vacía** en el Cuadro 3 (separador visual del Excel).
- Las provincias vienen por **nombre** (no por código) → habrá que mapearlas al
  código de INDEC para poder unirlas con el CSV y con el GeoJSON.

---

## 7) Decisiones para el ETL (script `02_limpiar.py`, siguiente paso)

1. **Leer CSV** con `sep=";"`, `encoding="utf-8"`, y `.strip()` en los nombres de columna.
2. **Población jurisdicciones:** reemplazar `"-"` → `0` y pasar a entero.
3. **Sexo:** mapear `1→"varon"`, `2→"mujer"` (o mantener el código y decidir color en el front).
4. **Jurisdicción:** agregar columna con el **nombre** de la provincia (desde la tabla de mapeo) y conservar el código.
5. **Excel:** leer cada Cuadro con `skiprows` para saltar títulos, tomar solo las
   filas de datos, descartar la fila "Fuente:" y renombrar columnas a mano.
6. **Salida:** exportar JSON limpios a `data/processed/` (uno por gráfico), livianos
   y con nombres de campo en inglés/simple para consumir desde React/D3.

---

## 8) ⚠️ Gap a resolver (no está en estos archivos)

- **Serie histórica 1950–2021:** el brief plantea un slider **1950→2040**, pero
  estos 4 archivos solo cubren **2022–2040** (proyecciones). Los años 1950–2021
  necesitan **otra fuente** (censos / estimaciones retrospectivas de INDEC).
  → Decisión pendiente: conseguir ese histórico, o ajustar el slider a 2022–2040.
- **Ratio aportantes/jubilado (Capa 3):** los datos de **ANSES** todavía no están
  descargados (ver brief, sección 4).
