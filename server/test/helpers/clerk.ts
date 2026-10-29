import { generateKeyPairSync, sign } from "node:crypto";

// Test-only credentials and signing keys: never read a developer's real keys.
export function configureClerkTestEnvironment() {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const domain = "taskmate-test.clerk.accounts.dev";
  process.env.NODE_ENV = "test";
  process.env.CLIENT_ORIGIN = "http://localhost:3000";
  process.env.CLERK_PUBLISHABLE_KEY = `pk_test_${Buffer.from(`${domain}$`).toString("base64")}`;
  process.env.CLERK_SECRET_KEY = "sk_test_taskmate_unit_tests_only";
  process.env.CLERK_JWT_KEY = publicKey.export({ type: "spki", format: "pem" }).toString();

  return (claims: Record<string, unknown> = {}) => {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "taskmate-test-key" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      iss: `https://${domain}`, sub: "user_taskmate_test", sid: "sess_taskmate_test",
      azp: "http://localhost:3000", iat: now, nbf: now - 5, exp: now + 60,
      ...claims,
    })).toString("base64url");
    const input = `${header}.${payload}`;
    return `${input}.${sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url")}`;
  };
}
