import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // Supabase URL에서 도메인 추출
  const supabaseUrl = env.VITE_SUPABASE_URL || 'https://dummy.supabase.co'
  
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  build: {
    // 프로덕션 빌드에서 콘솔 로그 제거
    minify: 'terser',
    terserOptions: {
      compress: {
        // 콘솔 로그 제거
        drop_console: true,
        drop_debugger: true,
        // 사용하지 않는 코드 제거
        dead_code: true,
        // 조건문 최적화
        conditionals: true
      },
      mangle: {
        // 함수명과 변수명 난독화
        toplevel: true
      },
      format: {
        // 주석 제거
        comments: false
      }
    },
    // 소스맵 비활성화 (보안상)
    sourcemap: false,
    // 청크 크기 경고 임계값 증가
    chunkSizeWarningLimit: 1000
  },
  // 개발 서버 설정
  server: {
    // 개발 환경에서는 콘솔 로그 유지
    hmr: true,
    // 미들웨어를 통한 조건부 COEP 헤더 설정
    middlewareMode: false,
    cors: true,
    // 개발 환경에서는 엄격한 보안 헤더 제거 (IDE 웹뷰 호환성)
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    // 외부 리소스 프록시 설정 (CORS 문제 해결)
    proxy: {
      '/api/paddle-cdn': {
        target: 'https://cdn.paddle.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/paddle-cdn/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Paddle CDN을 위한 CORS 헤더 설정
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Cross-Origin-Resource-Policy'] = 'cross-origin';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
            // COEP 정책 준수를 위한 헤더 제거
            delete proxyRes.headers['Cross-Origin-Embedder-Policy'];
          });
        },
      },
      '/api/supabase-storage': {
        target: supabaseUrl,
        changeOrigin: true,
        rewrite: (path) => {
          // /api/supabase-storage/contents/... -> /storage/v1/object/public/contents/...
          const newPath = path.replace(/^\/api\/supabase-storage/, '/storage/v1/object/public');
          console.log('Proxy rewrite:', path, '->', newPath);
          return newPath;
        },
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // COEP 정책과 호환되는 CORS 헤더 설정
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Cross-Origin-Resource-Policy'] = 'same-origin';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
            // COEP 정책 준수를 위한 헤더 제거
            delete proxyRes.headers['Cross-Origin-Embedder-Policy'];
          });
        },
      },
      '/api/fal-media': {
        target: 'https://v3.fal.media',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fal-media/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // COEP 정책과 호환되는 CORS 헤더 설정
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Cross-Origin-Resource-Policy'] = 'same-origin';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
            // COEP 정책 준수를 위한 헤더 제거
            delete proxyRes.headers['Cross-Origin-Embedder-Policy'];
          });
        },
      },
    }
  },
  // FFmpeg 최적화를 위한 설정
  optimizeDeps: {
    include: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  // 전역 변수 정의
  define: {
    global: 'globalThis',
  },
  worker: {
    format: 'es',
    plugins: [react()],
    rollupOptions: {
      output: {
        entryFileNames: 'worker-[name]-[hash].js',
      }
    }
  },
  // ES2020 타겟 설정
  esbuild: {
    target: 'es2020'
  }
  }
})