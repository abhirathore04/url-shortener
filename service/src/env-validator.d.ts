declare module '../configs/env-validator' {
  export function validateEnvironment(): { [key: string]: string };
}
