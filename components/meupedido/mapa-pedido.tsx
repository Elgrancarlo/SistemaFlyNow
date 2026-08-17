"use client";

// Mapa "onde seu pedido está": SVG do Brasil (malha IBGE pré-projetada) com
// zoom na região entre a última movimentação e o destino. Sem tile/API externa
// — a posição é aproximada por cidade, igual ao modelo de referência.
import { MAPA_VIEWBOX, UF_PATHS, projetar } from "@/lib/meupedido/mapa-brasil";

interface Ponto {
  lat: number;
  lng: number;
  rotulo: string;
}

export function MapaPedido({ posicao, destino }: { posicao: Ponto; destino: Ponto | null }) {
  const p = projetar(posicao.lat, posicao.lng);
  const d = destino ? projetar(destino.lat, destino.lng) : null;

  // viewBox: enquadra pin e destino com folga; zoom mínimo p/ não colar demais
  const xs = [p.x, ...(d ? [d.x] : [])];
  const ys = [p.y, ...(d ? [d.y] : [])];
  const pad = 60;
  let minX = Math.min(...xs) - pad;
  let maxX = Math.max(...xs) + pad;
  let minY = Math.min(...ys) - pad;
  let maxY = Math.max(...ys) + pad;
  const MIN_SPAN = 220;
  if (maxX - minX < MIN_SPAN) {
    const cx = (minX + maxX) / 2;
    minX = cx - MIN_SPAN / 2;
    maxX = cx + MIN_SPAN / 2;
  }
  if (maxY - minY < MIN_SPAN * 0.72) {
    const cy = (minY + maxY) / 2;
    minY = cy - (MIN_SPAN * 0.72) / 2;
    maxY = cy + (MIN_SPAN * 0.72) / 2;
  }
  // não sai dos limites do desenho
  minX = Math.max(0, minX);
  minY = Math.max(0, minY);
  maxX = Math.min(MAPA_VIEWBOX.w, maxX);
  maxY = Math.min(MAPA_VIEWBOX.h, maxY);

  const escala = (maxX - minX) / 300; // p/ manter pin/traço com tamanho visual estável

  return (
    <svg
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      className="h-52 w-full"
      role="img"
      aria-label={`Última movimentação em ${posicao.rotulo}`}
    >
      {UF_PATHS.map(({ uf, d: path }) => (
        <path
          key={uf}
          d={path}
          fill="#f1e9df"
          stroke="#d9cdbd"
          strokeWidth={0.8 * escala}
        />
      ))}

      {d && (
        <>
          <line
            x1={p.x}
            y1={p.y}
            x2={d.x}
            y2={d.y}
            stroke="#ea580c"
            strokeWidth={1.6 * escala}
            strokeDasharray={`${5 * escala} ${5 * escala}`}
            opacity={0.55}
          />
          {/* destino: alvo */}
          <circle cx={d.x} cy={d.y} r={5 * escala} fill="none" stroke="#57534e" strokeWidth={1.4 * escala} />
          <circle cx={d.x} cy={d.y} r={1.8 * escala} fill="#57534e" />
        </>
      )}

      {/* posição atual: pin pulsante */}
      <circle cx={p.x} cy={p.y} r={10 * escala} fill="#ea580c" opacity={0.18}>
        <animate attributeName="r" values={`${7 * escala};${13 * escala};${7 * escala}`} dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.25;0.08;0.25" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={p.x} cy={p.y} r={4.5 * escala} fill="#ea580c" stroke="#fff" strokeWidth={1.6 * escala} />
    </svg>
  );
}
