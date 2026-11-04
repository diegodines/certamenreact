// Lógica de Carioca con naipe inglés.
// Jugada a validar: 2 ESCALAS (cada escala = 4 o más cartas consecutivas de la misma pinta).

export const PINTAS = ["diamante", "corazon", "trebol", "pica"];

// Carioca se juega con 2 mazos ingleses: cada número/pinta puede aparecer máximo 2 veces.
export const LIMITE_POR_CARTA = 2;

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
  const valor = numero === 10 ? "0" : nombreNumero(numero);
  return `https://deckofcardsapi.com/static/img/${valor}${CODIGO_PINTA[pinta]}.png`;
}

// Todas las formas de separar los valores de una pinta (conteos por posición 1..14) en escalas.
function separarEnEscalas(conteos) {
  const inicio = conteos.findIndex((c) => c > 0);
  if (inicio === -1) return [[]];
  const opciones = [];
  // La carta más baja obligatoriamente inicia una escala; probamos largos desde 4.
  for (let fin = inicio + 3; fin <= 14 && fin - inicio < 13; fin++) {
    if (conteos.slice(inicio, fin + 1).some((c) => c === 0)) break;
    const resto = [...conteos];
    for (let i = inicio; i <= fin; i++) resto[i]--;
    separarEnEscalas(resto).forEach((otras) => opciones.push([[inicio, fin], ...otras]));
  }
  return opciones;
}

// Separaciones posibles de una pinta, probando el As como bajo (1) o alto (14).
function escalasDePinta(pinta, numeros) {
  const ases = numeros.filter((n) => n === 1).length;
  const opciones = [];
  for (let altos = 0; altos <= ases; altos++) {
    const conteos = new Array(15).fill(0);
    numeros.forEach((n) => n !== 1 && conteos[n]++);
    conteos[1] = ases - altos;
    conteos[14] = altos;
    separarEnEscalas(conteos).forEach((escalas) =>
      opciones.push(escalas.map(([desde, hasta]) => ({ pinta, desde: desde % 13 || 13, hasta: hasta % 13 || 13 })))
    );
  }
  return opciones;
}

// Valida que TODAS las cartas en pantalla formen exactamente 2 escalas.
// Devuelve { valido, escalas: [{ pinta, desde, hasta }] }.
export function validarDosEscalas(cartas) {
  let combinaciones = [[]];
  for (const pinta of PINTAS) {
    const numeros = cartas.filter((c) => c.pinta === pinta).map((c) => c.numero);
    if (numeros.length === 0) continue;
    const opciones = escalasDePinta(pinta, numeros);
    combinaciones = combinaciones.flatMap((previas) =>
      opciones.map((op) => [...previas, ...op]).filter((esc) => esc.length <= 2)
    );
  }
  const juego = combinaciones.find((esc) => esc.length === 2);
  return juego ? { valido: true, escalas: juego } : { valido: false, escalas: [] };
}
