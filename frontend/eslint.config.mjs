import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const designSystemPlugin = {
  rules: {
    "no-banned-tokens": {
      meta: {
        type: "problem",
        messages: {
          bannedClass: "Banned hardcoded class '{{ class }}'. Use design system tokens from @/app/lib/.",
          bannedRp: "Hardcoded 'Rp ' is banned. Use formatRupiah() from '@/app/lib/format'."
        }
      },
      create(context) {
        function isDesignSystemSource() {
          const filename = context.filename.replaceAll("\\", "/");
          return (
            filename.endsWith("/eslint.config.mjs") ||
            filename.includes("/src/app/lib/")
          );
        }

        function checkValue(node, val) {
          if (typeof val !== 'string') return;
          if (isDesignSystemSource()) return;
          
          const bannedClasses = ['font-black', 'rounded-md', 'font-extrabold', 'font-mono'];
          for (const cls of bannedClasses) {
            if (new RegExp(`\\b${cls}\\b`).test(val)) {
              context.report({ node, messageId: 'bannedClass', data: { class: cls } });
            }
          }
          
          const zIndexMatch = val.match(/z-\[\d+\]/);
          if (zIndexMatch) {
             context.report({ node, messageId: 'bannedClass', data: { class: zIndexMatch[0] } });
          }
          
          const textMatch = val.match(/text-\[\d+px\]/);
          if (textMatch) {
             context.report({ node, messageId: 'bannedClass', data: { class: textMatch[0] } });
          }

          if (val.includes('Rp ') && !context.filename.includes('format.ts') && !context.filename.includes('charts.ts')) {
            context.report({ node, messageId: 'bannedRp' });
          }
        }

        return {
          Literal(node) {
            checkValue(node, node.value);
          },
          TemplateElement(node) {
            checkValue(node, node.value.raw);
          }
        };
      }
    }
  }
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "design-system": designSystemPlugin
    },
    rules: {
      "design-system/no-banned-tokens": "error"
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
