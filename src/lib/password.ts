import { hash, verify } from "argon2";

const HASH_OPTIONS = {
  type: 2, // argon2id
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, HASH_OPTIONS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await verify(hashedPassword, password);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}