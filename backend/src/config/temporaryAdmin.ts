import { env } from './env.js';

export const TEMP_ADMIN_ID = 'temporary-superadmin';

export function isTemporaryAdmin(id?: string) {
  return env.NODE_ENV !== 'production' && id === TEMP_ADMIN_ID;
}
