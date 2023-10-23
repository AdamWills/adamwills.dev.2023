/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./content/**/*.{njk, md}", "./_includes/**/*.njk"],
	theme: {
		extend: {
			fontFamily: {
				sans: ["futura-pt", "sans-serif"],
			},
			fontSize: {
				"6xl": ["7.45rem", "7.5rem"],
				"6xl": ["5.96rem", "6rem"],
				"4xl": ["4.768rem", "6rem"],
				"3xl": ["3.815rem", "4.5rem"],
				"2xl": ["3.052rem", "4.5rem"],
				xl: ["2.441rem", "3rem"],
				lg: ["1.953rem", "3rem"],
				md: ["1.563rem", "3rem"],
				base: ["1.25rem", "3rem"],
				sm: ["1rem", "1.5rem"],
				xs: ["0.8rem", "1.5rem"],
			},
			spacing: {
				quarter: "0.375rem",
				half: "0.75rem",
				one: "1.5rem",
				two: "3rem",
				three: "4.5rem",
				four: "6rem",
				five: "7.5rem",
				six: "9rem",
				eight: "12rem",
				twelve: "18rem",
				sixteen: "24rem",
			},
			colors: {
				"brand-red": {
					50: "#fff1f1",
					100: "#ffdfdf",
					200: "#ffc5c4",
					300: "#ff9c9b",
					400: "#ff6361",
					500: "#ff3330",
					600: "#f11411",
					700: "#d40d0a", // brand-red
					800: "#a80e0c",
					900: "#8a1412",
					950: "#4c0403",
				},
				"brand-black": "#0d0d0a",
				"brand-blue": "#101827",
			},
		},
	},
	plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
