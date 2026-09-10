export type CityTourismPhoto = {
  src: string;
  caption: string;
  author: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
};

// Curated by municipality. Never substitute a photograph of another city.
export const cityTourismPhotos: Record<string, CityTourismPhoto> = {
  "atalanta": {
    src: "https://upload.wikimedia.org/wikipedia/commons/5/57/Parque_Mata_Atl%C3%A2ntica.jpg",
    caption: "Parque Mata Atlântica e Cachoeira Perau do Gropp",
    author: "Crislaine Munaro",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Parque_Mata_Atl%C3%A2ntica.jpg",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
  "aurora": {
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/Aurora_-_State_of_Santa_Catarina%2C_Brazil_-_panoramio.jpg/960px-Aurora_-_State_of_Santa_Catarina%2C_Brazil_-_panoramio.jpg",
    caption: "Paisagem de Aurora",
    author: "valdir muller",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Aurora_-_State_of_Santa_Catarina,_Brazil_-_panoramio.jpg",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
  "dona-emma": {
    src: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Casa_dos_L%C3%A9n%C3%A1rd.jpg",
    caption: "Casa dos Lénárd, em Nova Esperança",
    author: "Fernando Chíquio Boppré",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Casa_dos_L%C3%A9n%C3%A1rd.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  "ibirama": {
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/IbiramaSunset.jpg/1280px-IbiramaSunset.jpg",
    caption: "Fim de tarde em Ibirama",
    author: "Vilson Junior",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:IbiramaSunset.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  "imbuia": {
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/A_beleza_da_natureza_de_Imbuia.jpg/1280px-A_beleza_da_natureza_de_Imbuia.jpg",
    caption: "Paisagem natural de Imbuia",
    author: "Sharlene Melanie",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:A_beleza_da_natureza_de_Imbuia.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  "ituporanga": {
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/Ituporanga-SC.JPG/1280px-Ituporanga-SC.JPG",
    caption: "Paisagem em Ituporanga",
    author: "Marinna Mendonca",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Ituporanga-SC.JPG",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
  "jose-boiteux": {
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Cachoeira_wiegand_Jos%C3%A9_Boiteux.jpg/960px-Cachoeira_wiegand_Jos%C3%A9_Boiteux.jpg",
    caption: "Cachoeira Wiegand",
    author: "Kuiã Wajãpi Vargas",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Cachoeira_wiegand_Jos%C3%A9_Boiteux.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  "presidente-getulio": {
    src: "https://upload.wikimedia.org/wikipedia/commons/d/de/Igreja_em_Presidente_Get%C3%BAlio_-_SC.jpg",
    caption: "Igreja Matriz de Presidente Getúlio",
    author: "José Maciel",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Igreja_em_Presidente_Get%C3%BAlio_-_SC.jpg",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
  "rio-do-oeste": {
    src: "/tourism/rio-do-oeste.webp",
    caption: "Fim de tarde em Rio do Oeste",
    author: "Mai muller",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Fim_de_tarde_em_Rio_do_Oeste_-_SC_2014-05-02_15-16.jpg",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
  "rio-do-sul": {
    src: "/tourism/rio-do-sul.webp",
    caption: "Morro dos Três Picos",
    author: "Alexandre Vicenzi",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:3_Picos_-_Rio_do_Sul.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  "salete": {
    src: "/tourism/salete.webp",
    caption: "Santuário do Morro da Salete",
    author: "Charles Ringenberg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Santuario_Morro_Salete_-_panoramio.jpg",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
  },
  "santa-terezinha": {
    src: "/tourism/santa-terezinha.webp",
    caption: "Morro do Taió",
    author: "Paulo Marcelo Adamek",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Morro_do_Tai%C3%B3.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  "vitor-meireles": {
    src: "/tourism/vitor-meireles.webp",
    caption: "Serra da Abelha",
    author: "Liu Idárraga Orozco",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:%C3%81rea_de_Relevante_Interesse_Ecol%C3%B3gica_Serra_da_Abelha_-_Liu_Id%C3%A1rraga_Orozco_%2818%29.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
};

export const regionalTourismFallback: CityTourismPhoto = {
  src: "/brand/rio-do-sul-entardecer.webp",
  caption: "Paisagem regional do Alto Vale, registrada em Rio do Sul",
  author: "Pedro Terres",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Entardecer_em_Rio_do_Sul_-_SC.jpeg",
  license: "CC BY-SA 2.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
};
