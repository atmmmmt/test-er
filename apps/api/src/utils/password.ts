import bcrypt from 'bcryptjs';

export async function makePasswordHash(password: string) {
  return bcrypt.hash(password, 10);
}

export async function passwordMatches(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
