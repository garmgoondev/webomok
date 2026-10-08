# WebOmok visual identity

Two stones. Five in a row. A quiet place to play.

The emblem pairs a warm Kaya-inspired wooden grid with obsidian and pearl stones. A hand-drawn gold 五 (five) marks the goal of Gomoku. All artwork uses vector paths, gradients and restrained shadows; no fonts or external images are required.

| Role | Color |
| --- | --- |
| Midnight background | `#020617` |
| Slate surface | `#0f172a` |
| Signature gold | `#d9ad59` |
| Kaya wood | `#d6a763` |
| Pearl | `#f6f3e9` |
| Primary text | `#f1f5f9` |

Use Geist for the interface and a bold WebOmok wordmark. Keep messaging clear, welcoming and focused on play. Use amber for interactive controls; reserve signature gold for the emblem and identity accents.

Render `BrandLogo` at 44px in navigation (40px on compact screens). Leave at least 8px of clear space. Keep its aspect ratio, colors and stone arrangement intact. The favicon exports preserve the same silhouette at 16–512px; use the SVG wherever scaling is needed.

The component is decorative by default when next to the visible wordmark. Supply `title="WebOmok"` when displaying the badge alone. Every instance has unique SVG gradient and filter IDs.

Edit `scripts/generate-brand.mjs` and run `pnpm brand:generate` to regenerate the inline component, favicon SVG, PNG suite and multi-size ICO from a single source. The 192px and 512px manifest icons use `purpose: any`; they are not maskable icons. The manifest supplies app identity and standalone launch settings; it does not add offline play.
