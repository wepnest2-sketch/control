@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}

body {
  font-family: var(--font-sans);
  background-color: #F5F5F5;
}

/* Force LTR for inputs to ensure numbers are entered correctly */
input[type="number"],
input[type="tel"],
.font-mono {
  direction: ltr;
}

/* Ensure numbers are always LTR even in RTL context */
.numeric {
  direction: ltr;
  display: inline-block;
}
