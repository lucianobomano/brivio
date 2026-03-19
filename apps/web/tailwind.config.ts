import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                bg: {
                    0: "var(--color-bg-0)",
                    1: "var(--color-bg-1)",
                    2: "var(--color-bg-2)",
                    3: "var(--color-bg-3)",
                },
                text: {
                    primary: "var(--color-text-primary)",
                    secondary: "var(--color-text-secondary)",
                },
                accent: {
                    indigo: "var(--color-accent-indigo)",
                    blue: "var(--color-accent-blue)",
                    hover: "var(--color-accent-hover)",
                    info: "var(--color-info)",
                },
                success: "var(--color-success)",
                warning: "var(--color-warning)",
                error: "var(--color-error)",
                destructive: "var(--color-error)", // Standard mapping
                info: "var(--color-info)",

                // Community
                community: {
                    pink: "var(--color-community-pink)",
                    purple: "var(--color-community-purple)",
                    deepviolet: "var(--color-community-deepviolet)",
                    coral: "var(--color-community-coral)",
                }
            },
            fontFamily: {
                sans: ["var(--font-inter)", "sans-serif"],
                tight: ["var(--font-inter-tight)", "sans-serif"],
            },
        },
    },
    plugins: [],
};
export default config;
