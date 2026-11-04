// Lógica de Carioca con naipe inglés.
// Jugada a validar: 2 ESCALAS (cada escala = 4 o más cartas consecutivas de la misma pinta).

export const PINTAS = ["diamante", "corazon", "trebol", "pica"];

// Carioca se juega con 2 mazos ingleses: cada número/pinta puede aparecer máximo 2 veces.
export const LIMITE_POR_CARTA = 2;

// Comodín (joker): 2 por mazo, 4 en total. En pantalla se guarda como { numero: 0, pinta: "comodin" }.
export const COMODIN = "comodin";
export const LIMITE_COMODINES = 4;

const LETRAS = { A: 1, J: 11, Q: 12, K: 13 };

// Convierte lo escrito en el input ("A", "7", "q", "13") a número 1..13, o null si no es válido.
export function parsearNumero(texto) {
  const t = texto.trim().toUpperCase();
  if (LETRAS[t]) return LETRAS[t];
  const n = Number(t);
  return Number.isInteger(n) && n >= 1 && n <= 13 ? n : null;
}

export function nombreNumero(n) {
  return { 1: "A", 11: "J", 12: "Q", 13: "K" }[n] || String(n);
}

// Imagen de cada carta. Si prefieres tus propias imágenes, cambia solo esta función.
const CODIGO_PINTA = { diamante: "D", corazon: "H", trebol: "C", pica: "S" };
export function imagenCarta(numero, pinta) {
  if (pinta === COMODIN) return "https://deckofcardsapi.com/static/img/X1.png";
  const valor = numero === 10 ? "0" : nombreNumero(numero);
  return `https://deckofcardsapi.com/static/img/${valor}${CODIGO_PINTA[pinta]}.png`;
}

// Todas las formas de separar los valores de una pinta (conteos por posición 1..14) en escalas,
// usando comodines para tapar huecos o alargar la escala (máximo 1 comodín por escala).
// Cada opción: { escalas: [[desde, hasta, posComodin]], usados }.
function separarEnEscalas(conteos, comodines) {
  const inicio = conteos.findIndex((c) => c > 0);
  if (inicio === -1) return [{ escalas: [], usados: 0 }];
  const opciones = [];
  // La carta natural más baja inicia la escala (o va justo después de un comodín).
  const partidas = comodines > 0 && inicio > 1 ? [inicio, inicio - 1] : [inicio];
  for (const desde of partidas) {
    let posComodin = desde < inicio ? desde : null;
    for (let fin = desde; fin <= 14 && fin - desde < 13; fin++) {
      if (fin !== posComodin && conteos[fin] === 0) {
        if (posComodin !== null || comodines === 0) break;
        posComodin = fin;
      }
      if (fin - desde + 1 < 4) continue;
      const resto = [...conteos];
      for (let i = desde; i <= fin; i++) if (i !== posComodin) resto[i]--;
      const usado = posComodin !== null ? 1 : 0;
      separarEnEscalas(resto, comodines - usado).forEach((otras) =>
        opciones.push({ escalas: [[desde, fin, posComodin], ...otras.escalas], usados: usado + otras.usados })
      );
    }
  }
  return opciones;
}

// Separaciones posibles de una pinta, probando el As como bajo (1) o alto (14).
function escalasDePinta(pinta, numeros, comodines) {
  const ases = numeros.filter((n) => n === 1).length;
  const opciones = [];
  for (let altos = 0; altos <= ases; altos++) {
    const conteos = new Array(15).fill(0);
    numeros.forEach((n) => n !== 1 && conteos[n]++);
    conteos[1] = ases - altos;
    conteos[14] = altos;
    separarEnEscalas(conteos, comodines).forEach(({ escalas, usados }) =>
      opciones.push({
        usados,
        escalas: escalas.map(([desde, hasta, posComodin]) => ({
          pinta,
          desde: desde % 13 || 13,
          hasta: hasta % 13 || 13,
          comodin: posComodin !== null,
        })),
      })
    );
  }
  return opciones;
}

// Valida que TODAS las cartas en pantalla (comodines incluidos) formen exactamente 2 escalas.
// Devuelve { valido, escalas: [{ pinta, desde, hasta, comodin }] }.
export function validarDosEscalas(cartas) {
  const totalComodines = cartas.filter((c) => c.pinta === COMODIN).length;
  let combinaciones = [{ escalas: [], usados: 0 }];
  for (const pinta of PINTAS) {
    const numeros = cartas.filter((c) => c.pinta === pinta).map((c) => c.numero);
    if (numeros.length === 0) continue;
    combinaciones = combinaciones.flatMap((previa) =>
      escalasDePinta(pinta, numeros, totalComodines - previa.usados)
        .map((op) => ({ escalas: [...previa.escalas, ...op.escalas], usados: previa.usados + op.usados }))
        .filter((c) => c.escalas.length <= 2)
    );
  }
  // Todos los comodines en pantalla deben quedar usados dentro de las escalas.
  const juego = combinaciones.find((c) => c.escalas.length === 2 && c.usados === totalComodines);
  return juego ? { valido: true, escalas: juego.escalas } : { valido: false, escalas: [] };
}
