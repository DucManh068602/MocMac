module.exports = {
  content: [
    "./src/**/*.{html,ts,css,scss}",
  ],
  theme: {
    extend: {
      colors: {
        moss: '#435731',
        'moss-d': '#35472A',
        sage: '#7C9468',
        cream: '#FBFAF3',
        beige: '#EBE5D4',
        earth: '#AA4D2D',
        clay: '#C77A4A',
        ink: '#2B2A22',
        ink2: '#6B6A5C',
        line: '#E4DDC8',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Be Vietnam Pro', 'system-ui', 'sans-serif'],
        lora: ['Lora', 'serif'],
      },
    },
  },
  plugins: [],
};
