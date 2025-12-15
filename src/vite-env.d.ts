

declare module "*.css";
declare module "*.svg";
declare module "*.png";
declare module "*.jpg";

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly PROD?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}