
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo (development/production)
  // O terceiro parâmetro '' permite carregar TODAS as variáveis, não apenas as com prefixo VITE_
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      // Isso substitui 'process.env.API_KEY' no seu código pelo valor real da chave durante o build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  }
})
