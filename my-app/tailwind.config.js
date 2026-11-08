module.exports = {
  content: [
    "./src/**/*.{html,ts,css,scss}",
  ],
  theme: {
    extend: {
      colors: {
        moss: '#3F634D',
        'moss-d': '#294A38',
        sage: '#9BB69C',
        cream: '#FFFCF7',
        beige: '#F3EADB',
        earth: '#A95F3D',
        clay: '#D49667',
        ink: '#253128',
        ink2: '#667166',
        line: '#E8DED0',
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
        lora: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
