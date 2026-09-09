# Identidade visual — Achei no Vale

Referência: Manual de marca, Isabelly Carmo, fornecido em 08/09/2026.

## Paleta

| Uso | Cor |
| --- | --- |
| Dourado, destaques | `#e4a030` |
| Terracota, apoio e avisos | `#a85527` |
| Creme, fundos | `#fff9ec` |
| Verde, cor principal, ações e superfícies escuras | `#1d402d` |
| Preto, títulos | `#000004` |

`app/brand-manual.css` define os tokens e conecta as variáveis dos componentes à paleta. Dourado serve como destaque; textos sobre creme usam verde ou terracota para legibilidade.

## Arquivos oficiais

- `public/brand/logo-green.png`: versão verde completa preservada. O cabeçalho usa `logo-green-compact.svg`, descrito abaixo.
- `public/brand/logo-terracotta.png`: variante terracota disponível para usos de apoio.
- `public/brand/logo-gold.png`: cópia de LOGO 1.png, usada no rodapé verde.
- `public/brand/symbol-green.png`: cópia de SIMBOLO 1.png, origem dos ícones.

Os logotipos preservam as cores, letras e proporções dos PNGs entregues pela designer. A tipografia do logotipo está incorporada à imagem. A interface mantém Plus Jakarta Sans, pois o manual não especifica uma fonte de interface nem inclui arquivo de fonte.

O favicon usa a versão branca do símbolo oficial em PNG de 64 × 64 com fundo transparente. Apple Touch Icon e ícones PWA usam o símbolo oficial proporcionalmente sobre creme. O ícone maskable possui margem adicional de proteção. Ao substituir ativos, atualizar também a versão do cache em `public/sw.js`.

O verde é a cor principal dos botões, destaque do nome da cidade na abertura, preços, links e navegação ativa. O dourado destaca elementos sobre fundos escuros; creme é o fundo principal. Terracota fica restrito a elementos de apoio, fretes e avisos.

## Aplicação no site

O cabeçalho usa `logo-green-compact.svg`, composto pelos traçados originais do SVG fornecido, sem o slogan e com a caixa de visualização ajustada. O rodapé mantém a assinatura completa. O símbolo e as letras não foram redesenhados.

A cidade fica acessível em uma faixa própria no cabeçalho móvel. Busca e ações de detalhe usam botões verdes; ações secundárias usam contorno. Cards têm fotos 4:3, preço verde destacado, localização legível e ação explícita.

### Fotografias regionais

As imagens são ilustrativas da região de Rio do Sul; não representam imóveis anunciados nem mudam de localização quando outra cidade é selecionada. Os créditos também estão acessíveis no destaque da página.

- `rio-do-sul-centro.webp`: Parzeus, “Centro de Rio do Sul - 05.06.2021 07”, Wikimedia Commons, CC BY-SA 4.0. Fonte: https://commons.wikimedia.org/wiki/File:Centro_de_Rio_do_Sul_-_05.06.2021_07.jpg — Licença: https://creativecommons.org/licenses/by-sa/4.0/
- `rio-do-sul-entardecer.webp`: Pedro Terres, “Entardecer em Rio do Sul - SC”, Wikimedia Commons, CC BY-SA 2.0. Fonte: https://commons.wikimedia.org/wiki/File:Entardecer_em_Rio_do_Sul_-_SC.jpeg — Licença: https://creativecommons.org/licenses/by-sa/2.0/

Conversão para WebP, redimensionamento e recorte visual com `object-fit`. Cada imagem adaptada mantém a licença indicada acima; as licenças das fotos não alteram a licença do restante do código.
