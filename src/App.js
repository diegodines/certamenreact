import React, { useState } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import {
  PINTAS,
  LIMITE_POR_CARTA,
  COMODIN,
  LIMITE_COMODINES,
  parsearNumero,
  nombreNumero,
  imagenCarta,
  validarDosEscalas,
} from "./carioca";

import 'bootstrap/dist/css/bootstrap.css'

const COLECCION = "jugadascarioca";

export function App(){
  const [numero, setNumero] = useState("");
  const [pinta, setPinta] = useState(PINTAS[0]);
  const [cartas, setCartas] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0); // para repetir la animación del H1
  const animBoton = useAnimationControls();

  function agregar() {
    if (pinta === COMODIN) {
      if (cartas.filter((c) => c.pinta === COMODIN).length >= LIMITE_COMODINES) {
        setError(`Límite alcanzado: máximo ${LIMITE_COMODINES} comodines`);
        return;
      }
      setError("");
      setCartas([...cartas, { id: Date.now(), numero: 0, pinta: COMODIN }]);
      animBoton.start({ scale: [1, 1.3, 1], rotate: [0, -8, 8, 0], transition: { duration: 0.4 } });
      return;
    }
    const n = parsearNumero(numero);
    if (!n) {
      setError("Número inválido (usa 1-13, A, J, Q o K)");
      return;
    }
    const repetidas = cartas.filter((c) => c.numero === n && c.pinta === pinta).length;
    if (repetidas >= LIMITE_POR_CARTA) {
      setError(`Límite alcanzado: máximo ${LIMITE_POR_CARTA} cartas ${nombreNumero(n)} de ${pinta}`);
      return;
    }
    setError("");
    setCartas([...cartas, { id: Date.now(), numero: n, pinta }]);
    setNumero("");
    // efecto del botón Agregar: pulso + giro leve
    animBoton.start({ scale: [1, 1.3, 1], rotate: [0, -8, 8, 0], transition: { duration: 0.4 } });
  }

  function descartar(id) {
    setCartas(cartas.filter((c) => c.id !== id));
  }

  async function validar() {
    setIntento(intento + 1);
    const resultado = validarDosEscalas(cartas);
    if (!resultado.valido) {
      setMensaje("NO FORMA JUEGO :C");
      return;
    }
    try {
      await addDoc(collection(db, COLECCION), {
        jugada: "2 escalas",
        cartas: cartas.map((c) => ({ numero: c.numero, pinta: c.pinta })),
        escalas: resultado.escalas,
        fecha: new Date(),
      });
      setMensaje("FORMA JUEGO: 2 ESCALAS");
    } catch (e) {
      setMensaje("FORMA JUEGO, pero no se pudo guardar en Firebase");
      console.error(e);
    }
  }

  return (
    <div className="container text-center py-4">
      <h2>Carioca - 2 Escalas</h2>

      <div className="d-flex justify-content-center gap-2 my-3">
        <input
          type="text"
          className="form-control w-auto"
          placeholder="Número (1-13, A, J, Q, K)"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />
        <select className="form-select w-auto" value={pinta} onChange={(e) => setPinta(e.target.value)}>
          {PINTAS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
          <option value={COMODIN}>comodín (joker)</option>
        </select>
        <motion.button className="btn btn-primary" onClick={agregar} animate={animBoton}>
          Agregar
        </motion.button>
      </div>
      {error && <p className="text-danger">{error}</p>}

      <div className="d-flex flex-wrap justify-content-center gap-2 my-3">
        <AnimatePresence>
          {cartas.map((c) => (
            <motion.div
              key={c.id}
              className="position-relative"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            >
              <img src={imagenCarta(c.numero, c.pinta)} alt={c.pinta === COMODIN ? "comodín" : `${nombreNumero(c.numero)} de ${c.pinta}`} width={90} />
              <button
                className="btn btn-danger btn-sm position-absolute top-0 end-0 py-0 px-1"
                onClick={() => descartar(c.id)}
              >
                X
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button className="btn btn-success" onClick={validar} disabled={cartas.length === 0}>
        Validar Juego
      </button>

      {mensaje && (
        <motion.h1
          key={intento}
          className="my-4"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
        >
          {mensaje}
        </motion.h1>
      )}
    </div>
  );
}
