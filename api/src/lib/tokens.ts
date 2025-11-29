const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface TokenPayload {
  imageId: string;
  userId: string;
  exp: number;
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hmacVerify(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await hmacSign(data, secret);

  if (signature.length !== expectedSignature.length) return false;

  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function generateImageToken(
  imageId: string,
  userId: string,
  secret: string
): Promise<string> {
  const payload: TokenPayload = {
    imageId,
    userId,
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };

  const data = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const signature = await hmacSign(data, secret);
  return `${data}.${signature}`;
}

export async function verifyImageToken(
  token: string,
  imageId: string,
  secret: string
): Promise<{ userId: string } | null> {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;

    const valid = await hmacVerify(data, signature, secret);
    if (!valid) return null;

    const paddedData = data.replace(/-/g, "+").replace(/_/g, "/");
    const payload: TokenPayload = JSON.parse(atob(paddedData));

    if (payload.imageId !== imageId) return null;
    if (payload.exp < Date.now()) return null;

    return { userId: payload.userId };
  } catch {
    return null;
  }
}
