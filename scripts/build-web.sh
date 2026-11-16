#!/usr/bin/env bash
set -euo pipefail

mkdir -p www/vendor
cp node_modules/alpinejs/dist/cdn.min.js www/vendor/alpine.min.js
npx @tailwindcss/cli -i src/input.css -o www/vendor/tailwind.css --minify
echo "Web assets built cleanly in www/vendor/"
