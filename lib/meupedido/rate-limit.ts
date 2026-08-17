// Rate limit in-memory por IP para as rotas públicas do Meu Pedido.
// CPF é enumerável — sem isso a rota viraria um oráculo de CPFs válidos.
// (pm2 roda instância única; se um dia virar cluster, mover para Redis.)

const janelas = new Map<string, number[]>();

const JANELA_MS = 60_000;
const MAX_POR_JANELA = 15;

export function permitido(ip: string): boolean {
  const agora = Date.now();
  const hits = (janelas.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  if (hits.length >= MAX_POR_JANELA) {
    janelas.set(ip, hits);
    return false;
  }
  hits.push(agora);
  janelas.set(ip, hits);
  // higiene: não deixa o Map crescer sem limite
  if (janelas.size > 5000) {
    for (const [k, v] of janelas) {
      if (!v.length || agora - v[v.length - 1] > JANELA_MS) janelas.delete(k);
    }
  }
  return true;
}

export function ipDaRequest(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : headers.get("x-real-ip") ?? "local").trim();
}
