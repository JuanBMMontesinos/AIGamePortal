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

function getUnsubscribeSecret(): string {
  return (
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
    process.env.ADMIN_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "aigameportal_newsletter_unsubscribe_secret_default"
  );
}

/**
 * Gera um token criptográfico HMAC-SHA256 para links de cancelamento de inscrição (Unsubscribe).
 *
 * Garante que apenas quem recebeu o link gerado pelo servidor consiga solicitar o cancelamento
 * de determinado e-mail, neutralizando enumeração forjada por terceiros ou robôs.
 *
 * @param email Endereço de e-mail do assinante
 * @returns Token hexadecimal de 64 caracteres
 */
export function generateUnsubscribeToken(email: string): string {
  if (!email || typeof email !== "string") return "";
  const normalized = email.trim().toLowerCase();
  const secret = getUnsubscribeSecret();
  return crypto.createHmac("sha256", secret).update(normalized).digest("hex");
}

/**
 * Valida o token de descadastro contra o e-mail informado.
 * Utiliza safeConstantTimeCompare para mitigar ataques de temporização.
 *
 * @param email Endereço de e-mail a validar
 * @param token Token fornecido na requisição
 * @returns true se a assinatura do token for válida
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token || typeof email !== "string" || typeof token !== "string") {
    return false;
  }
  const expectedToken = generateUnsubscribeToken(email);
  if (!expectedToken) return false;
  return safeConstantTimeCompare(token.trim(), expectedToken);
}
