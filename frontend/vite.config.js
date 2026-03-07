import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        server: {
            port: 5173,
            host: '0.0.0.0',
            allowedHosts: ['.lvh.me', 'localhost'],
            proxy: {
                '/api': {
                    target: env.VITE_BACKEND_URL || 'http://localhost:5000',
                    changeOrigin: true
                }
            }
        }
    }
})
