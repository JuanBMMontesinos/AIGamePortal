import crypto from "crypto";

/**
 * Utilitário de comparação de strings em tempo constante para mitigação de Timing Attacks.
 *
 * Em cenários de autenticação de tokens, webhooks ou senhas de administração, a comparação
 * tradicional por operadores de igualdade (`===` ou `!==`) sofre de curto-circuito (early-exit),
 * permitindo que atacantes descubram o segredo caractere por caractere medindo a latência
 * da resposta em nanossegundos/microssegundos.
 *
 * Além disso, o método nativo `crypto.timingSafeEqual` do Node.js lança uma exceção `RangeError`
 * caso os buffers de entrada tenham comprimentos (length) diferentes.
 *
 * Esta função soluciona ambos os problemas através de pré-hashing com SHA-256:
 * 1. Ambas as entradas são computadas como digests SHA-256 (sempre exatamente 32 bytes cada).
 * 2. O `crypto.timingSafeEqual` compara os dois digests de tamanho idêntico em tempo estritamente constante.
 * 3. Nenhuma informação sobre o comprimento real da chave ou conteúdo é vazada através do tempo de execução.
 *
 * @param a Primeira string a comparar (ex: segredo fornecido pelo cliente/requisição)
 * @param b Segunda string a comparar (ex: segredo esperado no ambiente/banco)
 * @returns `true` se as strings forem estritamente idênticas; `false` caso contrário.
 */
export function safeConstantTimeCompare(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  // Gera digests SHA-256 em Buffer de 32 bytes para normalizar o comprimento
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();

  return crypto.timingSafeEqual(hashA, hashB);
}
