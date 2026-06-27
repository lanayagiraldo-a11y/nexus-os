import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Que se carguen desde node_modules en runtime (no se empaquetan): evita el
  // problema del worker de pdfjs y mantiene mammoth funcionando en el servidor.
  serverExternalPackages: ["unpdf", "mammoth"],
};

export default nextConfig;
