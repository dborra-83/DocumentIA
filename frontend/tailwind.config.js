/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nueva paleta de colores
        'navy-dark': '#000024',
        'navy-blue': '#0A1732',
        'bright-blue': '#008FD0',
        'sky-light': '#E9F3FA',
        'turquoise': '#08BDBA',
        'violet': '#A56EFF',
        'pink': '#EE5396',
        'gold': '#F1C21B',
        'coral': '#ED4739',
        
        // Aliases para uso semántico
        primary: '#008FD0',      // bright-blue
        secondary: '#0A1732',    // navy-blue
        success: '#08BDBA',      // turquoise
        warning: '#F1C21B',      // gold
        error: '#ED4739',        // coral
        info: '#A56EFF',         // violet
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
