/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // ⚠️ VERY IMPORTANT
    ],
    theme: {
        extend: {
            colors: {
                primary: "#301B69",
            },
        },
    },
    plugins: [],
};