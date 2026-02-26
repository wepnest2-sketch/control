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

/* Driver.js Custom Theme */
.driver-popover.driverjs-theme {
  background-color: #ffffff;
  color: #000000;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  border: 1px solid rgba(0,0,0,0.05);
  font-family: var(--font-sans);
}

.driver-popover.driverjs-theme .driver-popover-title {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #000000;
}

.driver-popover.driverjs-theme .driver-popover-description {
  font-size: 14px;
  line-height: 1.6;
  color: #4b5563;
  margin-bottom: 20px;
}

.driver-popover.driverjs-theme button {
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.driver-popover.driverjs-theme .driver-popover-next-btn {
  background-color: #000000 !important;
  color: #ffffff !important;
  border: none !important;
  text-shadow: none !important;
}

.driver-popover.driverjs-theme .driver-popover-next-btn:hover {
  background-color: #333333 !important;
}

.driver-popover.driverjs-theme .driver-popover-prev-btn,
.driver-popover.driverjs-theme .driver-popover-close-btn {
  background-color: #f3f4f6 !important;
  color: #374151 !important;
  border: 1px solid #e5e7eb !important;
}

.driver-popover.driverjs-theme .driver-popover-prev-btn:hover,
.driver-popover.driverjs-theme .driver-popover-close-btn:hover {
  background-color: #e5e7eb !important;
}

.driver-popover.driverjs-theme .driver-popover-progress-text {
  color: #9ca3af;
  font-size: 12px;
}

/* Highlight overlay */
.driver-overlay path {
  fill: #000000 !important;
  fill-opacity: 0.7 !important;
}
