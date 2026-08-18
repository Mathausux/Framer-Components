import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Componentes em "Framer Codes Component/" importam de "framer", pacote
    // que só existe dentro do runtime do canvas do Framer. Substituímos
    // pelo shim local para poder renderizar esses componentes de verdade
    // no Page Builder. Veja src/lib/framerCanvasShim.ts.
    config.resolve.alias = {
      ...config.resolve.alias,
      framer$: path.resolve(__dirname, "src/lib/framerCanvasShim.ts"),
    };
    // Componentes de "Framer Codes Component/" ficam fora da árvore de
    // node_modules do app (não há node_modules na raiz do repositório).
    // Adiciona explicitamente o node_modules do app para que "react" e
    // "framer-motion" resolvam também a partir desses arquivos externos.
    config.resolve.modules = [
      path.resolve(__dirname, "node_modules"),
      ...(config.resolve.modules ?? ["node_modules"]),
    ];
    return config;
  },
};

export default nextConfig;
