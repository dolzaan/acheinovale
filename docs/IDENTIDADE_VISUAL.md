# Identidade visual — Achei no Vale

Referência: Manual de marca, Isabelly Carmo, fornecido em 08/09/2026.
Materiais oficiais: https://drive.google.com/drive/folders/1_Q_R1SwyJykPmYLKeqgXildFfWegJgCE

## Paleta

| Uso | Cor |
| --- | --- |
| Dourado, destaques | `#e4a030` |
| Terracota, ações | `#a85527` |
| Creme, fundos | `#fff9ec` |
| Verde, textos e superfícies escuras | `#1d402d` |
| Preto, títulos | `#000004` |

`app/brand-manual.css` define os tokens e conecta as variáveis dos componentes à paleta. Dourado serve como destaque; textos sobre creme usam verde ou terracota para legibilidade.

## Arquivos oficiais

- `public/brand/logo-terracotta.png`: cópia de LOGO 2.png, usada no cabeçalho.
- `public/brand/logo-gold.png`: cópia de LOGO 1.png, usada no rodapé verde.
- `public/brand/symbol-green.png`: cópia de SIMBOLO 1.png, origem dos ícones.

Os logotipos preservam as cores, letras e proporções dos PNGs entregues pela designer. A tipografia do logotipo está incorporada à imagem. A interface mantém Plus Jakarta Sans, pois o manual não especifica uma fonte de interface nem inclui arquivo de fonte.

Favicon, Apple Touch Icon e ícones PWA usam o símbolo oficial proporcionalmente sobre creme. O ícone maskable possui margem adicional de proteção. Ao substituir ativos, atualizar também a versão do cache em `public/sw.js`.
