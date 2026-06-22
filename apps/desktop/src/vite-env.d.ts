/// <reference types="vite/client" />
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

declare module "*.scss" {
  const content: { [className: string]: string };
  export default content;
}
