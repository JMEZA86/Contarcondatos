import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuración mínima de Vite para un proyecto React.
// El plugin de React habilita JSX y el fast-refresh (recarga en caliente).
export default defineConfig({
  plugins: [react()],
});
