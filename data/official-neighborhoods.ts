export type OfficialNeighborhoodList = {
  /** Lei, plano diretor ou página da prefeitura de onde a lista foi copiada. */
  source: string;
  sourceUrl: string;
  /**
   * alta: lei ou plano diretor lido direto. média: documento oficial lido em parte ou só por trechos.
   * baixa: lista montada a partir de citações soltas em documentos da prefeitura.
   */
  confidence: "alta" | "média" | "baixa";
  neighborhoods: string[];
  /** Comunidades do interior (linhas, ribeirões, braços), quando a fonte as separa dos bairros. */
  ruralLocalities: string[];
};

// Listas copiadas das fontes oficiais de cada município do Alto Vale, indexadas pelo código IBGE.
// Só entra o que está escrito na fonte citada, com a grafia dela; municípios sem fonte encontrada
// (Aurora, Imbuia, Laurentino, Presidente Nereu, Santa Terezinha) ficam de fora. Pesquisa de 11/2026.
export const officialNeighborhoods: Record<string, OfficialNeighborhoodList> = {
  // Agrolândia
  "4200200": {
    source: "Plano Diretor, LC 252/2024 (Anexo II, mapa de zoneamento rural)",
    sourceUrl: "https://diariomunicipal.sc.gov.br/atos/5786375",
    confidence: "baixa",
    neighborhoods: ["Centro", "São João"],
    ruralLocalities: ["Rio Novo", "Pitangueira", "Barra do Tigre", "Ribeirão do Tigre", "Valada do Tigre", "Ribeirão Xaxim", "Ribeirão das Pedras", "Serra Velha", "Ribeirão Garganta", "Serra dos Alves", "Campinho", "Rio Bonito", "Ribeirão Bohmann", "Ribeirão Geffert"],
  },
  // Agronômica
  "4200309": {
    source: "Plano Diretor, LC 220/2026 e LC 193/2024 (anexos I e V)",
    sourceUrl: "https://diariomunicipal.sc.gov.br/atos/7991307",
    confidence: "média",
    neighborhoods: ["Centro", "Primavera", "Belo Horizonte", "Régis", "Mosquito", "Arnoldo Cani", "Lauro Pamplona"],
    ruralLocalities: ["Ribeirão Alegre", "Ribeirão Fausto", "Valada Gropp", "Valada Mosquito", "Valada Mosquitinho", "Salamargo", "Morro do Carvão", "Ribeirão Strey", "Alto Gropp", "Mosquito Grande", "Alto Mosquitinho", "Planalto Areado", "Tifa Brandl", "Alto Areado", "Alto Serrinha"],
  },
  // Atalanta
  "4201802": {
    source: "Página de história da prefeitura",
    sourceUrl: "https://atalanta.sc.gov.br/historia.html",
    confidence: "média",
    neighborhoods: ["Centro"],
    ruralLocalities: ["Dona Luiza", "Ribeirão Matilde", "Boa Vista", "Rio Caçador", "São João", "São Miguel", "Santo Antônio", "Alto Dona Luiza", "Vila Gropp"],
  },
  // Braço do Trombudo
  "4202859": {
    source: "Câmara de Vereadores e Plano Diretor (LC 162/2023)",
    sourceUrl: "https://www.camarabracodotrombudo.sc.gov.br/dados-municipio",
    confidence: "baixa",
    neighborhoods: ["Centro"],
    ruralLocalities: ["Km 10", "Km 15", "Km 20", "Serril", "Águas Sulfurosas", "Braço Novo"],
  },
  // Chapadão do Lageado
  "4204194": {
    source: "Plano Diretor, LC 127/2023 (Anexo 01, macrozoneamento)",
    sourceUrl: "https://diariomunicipal.sc.gov.br/atos/4920777",
    confidence: "média",
    neighborhoods: [],
    ruralLocalities: ["Figueiredo", "Alto Figueiredo", "Chapadão Figueiredo", "Rio Lageado", "Bom Retiro", "Alto Rio Saltinho", "Rio Saltinho", "Ranchinho", "Serra do Tanque", "Chapadão Florestal", "Chapadão Rio do Meio", "Rio do Meio", "Ilha Grande", "Sebold"],
  },
  // Dona Emma
  "4205100": {
    source: "Plano Diretor (LC 188/2024) e leis de transporte escolar",
    sourceUrl: "https://diariomunicipal.sc.gov.br/atos/6717392",
    confidence: "baixa",
    neighborhoods: ["Centro", "Nova Esperança"],
    ruralLocalities: ["Caminho Pinhal", "Ribeirão da Vargem", "Marreco", "Rio Caçador", "Caminho do Posto"],
  },
  // Ibirama
  "4206900": {
    source: "Roteiro de coleta de lixo da prefeitura (a Lei 2.756/2010 de bairros não pôde ser lida)",
    sourceUrl: "https://ibirama.atende.net/cidadao/pagina/coleta-de-residuos-solidos",
    confidence: "média",
    neighborhoods: ["25 de Julho", "Anchieta", "Areado", "Bela Vista", "Centro", "Dalbérgia", "Nova Sttetin", "Operário", "Ponto Chic", "Progresso", "São Miguel", "Taquaras"],
    ruralLocalities: [],
  },
  // Ituporanga
  "4208500": {
    source: "Lei Complementar 137/2024 (Anexo 02, limites dos bairros) e cronograma de coleta",
    sourceUrl: "https://www.ituporanga.sc.gov.br/documento/view/4/perimetro-urbano",
    confidence: "alta",
    neighborhoods: ["Santo Antônio", "Jardim América", "Centro", "Gabiroba", "Bela Vista", "Boa Vista", "Vila Nova", "Cerro Negro", "Seminário", "Faxinal Vila Nova", "Nossa Senhora de Fátima", "Da Gruta", "Salto Grande"],
    ruralLocalities: ["Águas Negras", "Alto Braço Perimbó", "Braço Perimbó", "Chapadão Santana", "Dona Eulália", "Fundos Gabiroba", "Lagoa Vermelha", "Ribeirão Klauberg", "Rio Areia", "Rio Batalha", "Rio Bonito", "Rio dos Bugres", "Rio do Norte", "Rio Novo", "Três Barras", "Rio das Pedras"],
  },
  // José Boiteux
  "4209151": {
    source: "Atos da prefeitura no Diário Oficial dos Municípios",
    sourceUrl: "https://diariomunicipal.sc.gov.br/?r=site%2Fportal&codigoEntidade=142&q=bairros",
    confidence: "baixa",
    neighborhoods: ["Centro"],
    ruralLocalities: [],
  },
  // Lontras
  "4209904": {
    source: "Plano Diretor (LC 41/2012) e Plano de Saneamento; a LC 42/2012 de bairros não pôde ser lida",
    sourceUrl: "https://servicos.lontras.sc.gov.br/uploads/sites/609/2023/08/1227149_VOLUME_1___PMSB_LONTRAS_R01.pdf",
    confidence: "baixa",
    neighborhoods: ["Riachuelo", "Jardim Primavera", "Salto Pilão"],
    ruralLocalities: ["Concórdia", "Dona Lucia", "Braço Concórdia", "Alto Concórdia", "Piava", "Alto Subida", "Atafona", "Dona Paula", "Pinheiro", "Pomerana", "Cutia", "Alto Cutia", "Ribeirão do Salto", "Lontrinhas"],
  },
  // Mirim Doce
  "4210852": {
    source: "Edital 005/2026 da prefeitura (áreas dos agentes de saúde)",
    sourceUrl: "https://arquivos.qconcursos.com/regulamento/arquivo/98650/prefeitura-de-mirim-doce-sc-2026-agente-comunitario-de-saude-edital-n-5-edital.pdf",
    confidence: "média",
    neighborhoods: ["Centro"],
    ruralLocalities: ["Tifa Venturi", "Taquaruçu", "Boa Vista", "Bela Vista", "Ribeirão da Caça", "Venceslau Iatchac", "Braço Escoz", "Mirinzinho", "Campinas Koab", "Pinhalzinho", "Barra Grande", "Serra Chata", "Forradinho", "Serra Velha", "Alto Volta Grande", "Volta Grande"],
  },
  // Petrolândia
  "4212700": {
    source: "Página de histórico da prefeitura",
    sourceUrl: "https://petrolandia.sc.gov.br/pagina-2840/",
    confidence: "média",
    neighborhoods: [],
    ruralLocalities: ["Abissínia", "Alto Barra Nova", "Alto do Indaiá", "Alto Três Barras", "Barra do Rio do Cedro", "Barra do Maracujá", "Barra Nova", "Fachinal do Tigre", "Indaiá", "Londrina", "Maracujá", "Pinhal", "Rio Antinha", "Rio Corrente", "Rio de Dentro", "Rio Galego", "Rio do Jango", "Serra da Barra Nova", "Serra Grande", "Tamanduá"],
  },
  // Pouso Redondo
  "4213708": {
    source: "Página Perfil da Cidade da prefeitura (bairros e localidades juntos)",
    sourceUrl: "https://pousoredondo.sc.gov.br/pagina-23887/",
    confidence: "média",
    neighborhoods: ["Alto Paleta", "Alto Pombinhas", "Alto Rio de Traz", "Arno Siewerdt", "Arroio Grande", "Aterrado", "Barra do Aterrado", "Barro Branco", "Boa Vista", "Boa Vista 2", "Centro", "Corruchel", "Ervinha", "Fachinal", "Independência", "Lageado Grande", "Leopoldo Mees", "Paleta", "Pinheiro", "Pombinhas", "Pouso da Caixa", "Progresso", "Ribeirão Vassoura", "Rio das Pombas", "Rio de Traz", "Saltinho", "Salto Pombinhas", "Santa Isabel", "Santa Rita", "São Bernardo", "São Miguel", "Serra Azul", "Serra do Aterrado", "Serra dos Ilhéus", "Serra Grande", "Sitio Peters", "Sumidor", "Taquaroçu", "Vila Adelaide", "Vila Planalto"],
    ruralLocalities: [],
  },
  // Presidente Getúlio
  "4214003": {
    source: "Lei 3.208/2018 (cria e delimita os bairros; vigência a confirmar)",
    sourceUrl: "https://www.camarapresidentegetulio.sc.gov.br/proposicoes/Leis-ordinarias/0/15/0/4260",
    confidence: "média",
    neighborhoods: ["Centro", "Índio Esquerdo", "Niterói", "Pinheiro", "Pinheiro Alto", "Primavera", "Revólver", "Rio Ferro"],
    ruralLocalities: [],
  },
  // Rio do Campo
  "4214508": {
    source: "Regiões do Orçamento Participativo, página da prefeitura",
    sourceUrl: "https://servicos.riodocampo.sc.gov.br/pagina-6275/",
    confidence: "média",
    neighborhoods: [],
    ruralLocalities: ["Rio da Prata", "Rio da Prata Central", "Serra do Mirador", "Varaneira", "Alto Rio do Campo I", "Alto Rio do Campo II", "Rio Caixão", "Saltinho", "Alto Taiozinho", "Rio Waldrich", "Taiozinho", "Tamanduá", "Santa Maria", "Rio Azul", "Alto Rio Azul", "Ribeirão Carneiro", "Salto Rio do Oeste", "Caçador", "Serrinha", "Encano", "Encaninho", "Cruzeiro", "Floresta", "Sul Brasil", "Guanabara"],
  },
  // Rio do Oeste
  "4214607": {
    source: "Lei Complementar 43/2014 (perímetro urbano e bairros)",
    sourceUrl: "https://riodooeste.sc.gov.br/uploads/sites/302/2022/06/2357014_Lei_Complementar_0432014_Perimetro_Urbano.pdf",
    confidence: "média",
    neighborhoods: ["Centro", "Pioneiros", "Jardim Primavera", "Gabiroba", "Vila Nova", "Jardim das Hortênsias", "Bela Vista", "Ribeirão do Tigre"],
    ruralLocalities: [],
  },
  // Rio do Sul
  "4214805": {
    source: "Plano Diretor, LC 163/2006 consolidada (art. 499, Dos Bairros)",
    sourceUrl: "https://leismunicipais.com.br/plano-diretor-rio-do-sul-sc-2024-04-29-versao-consolidada",
    confidence: "alta",
    neighborhoods: ["Albertina", "Barragem", "Barra Itoupava", "Barra do Trombudo", "Bela Aliança", "Boa Vista", "Bremer", "Budag", "Canta Galo", "Canoas", "Centro", "Eugênio Schneider", "Fundo Canoas", "Jardim América", "Laranjeiras", "Navegantes", "Pamplona", "Progresso", "Rainha", "Santana", "Sumaré", "Santa Rita", "Taboão", "Valada Itoupava", "Valada São Paulo"],
    ruralLocalities: [],
  },
  // Salete
  "4215307": {
    source: "Página Bairros e Comunidades da prefeitura",
    sourceUrl: "https://salete.sc.gov.br/pagina-24037/",
    confidence: "média",
    neighborhoods: ["Beira Rio", "Bela Vista", "Cachoeira", "Casan", "Centro", "Cohab 2", "Residencial Hortênsia", "São Cristóvão", "São José", "Schreiber", "Vila Nova"],
    ruralLocalities: ["Barra Grande", "Braço Torretti", "Ribeirão Alegre", "Ribeirão América", "Ribeirão Cipriano", "Ribeirão do Ouro", "Ribeirão Platina", "Rio Herta", "Rio Luiz", "Rio Wildy", "Santa Margarida", "São Luiz"],
  },
  // Taió
  "4217808": {
    source: "Plano Diretor, LC 262/2021 (anexos 04 e 05, bairros e localidades)",
    sourceUrl: "https://www.diariomunicipal.sc.gov.br/atos/3507624",
    confidence: "alta",
    neighborhoods: ["Barra do Lobo", "Centro", "Padre Eduardo", "Seminário", "São João", "Universitário", "Victor Konder", "Vila Mariana"],
    ruralLocalities: ["Alto Palmital", "Alto Ribeirão da Vargem", "Barragem", "Bela Vista", "Boa Vista", "Bom Jesus", "Bracatinga", "Braço Ficher", "Braço Iris", "Braço Scoz", "Braço da Erva", "Braço da Ilha", "Cachoeira", "Carrego da Pechinca", "Encano", "Espigão", "Fazenda Induma", "Fazenda São Jacó", "Laranejeiras", "Margem Direita", "Margem Esquerda", "Marrecas", "Morro da Palha", "Palmital", "Passo Manso", "Ribeirao Gramado", "Ribeirão Corisco", "Ribeirão Estevão", "Ribeirão Pequeno", "Ribeirão Pinheiro", "Ribeirão Pintado", "Ribeirão da Erva", "Ribeirão das Pedras", "Ribeirão do Ouro", "Ribeirão do Salto", "Ribeirão dos Lobos", "Santo Antonio", "Serra dos Kraemmer", "Tifa Berlanda", "Tifa Eitz", "Tifa Machetti", "Tifa Pacheco", "Vargem I", "Vargem II"],
  },
  // Trombudo Central
  "4218608": {
    source: "Decreto 008/2018 (microáreas da Saúde da Família)",
    sourceUrl: "https://www.diariomunicipal.sc.gov.br/atos/1505891",
    confidence: "baixa",
    neighborhoods: ["Liberdade", "Centro", "Estação", "Vila Nova", "Jalisco", "Vila Teodoro", "Lorenal", "Cidade Alta", "Botafogo"],
    ruralLocalities: ["Km 10", "Ribeirão Kindel", "Km 05", "Tifa Baasch", "Tifa Pinheiro", "Sabugueiro", "Palhocinha", "Ribeirão Café", "Bracatinga I", "Bracatinga II", "Tifa Prada", "Fruteira", "Pouso da Caixa", "São Bernardo"],
  },
  // Vidal Ramos
  "4219200": {
    source: "Páginas da prefeitura e Plano de Saneamento (lista parcial)",
    sourceUrl: "https://vidalramos.sc.gov.br/municipio/parteiras/",
    confidence: "baixa",
    neighborhoods: ["Centro"],
    ruralLocalities: ["Campestre", "Tifa", "Cinema", "Fartura", "Chapadão do Tigre", "Areia", "Indaial", "Mulungu", "Salseiro", "Fazenda Rio Bonito"],
  },
  // Vitor Meireles
  "4219358": {
    source: "Lei 1.104/2021 (bairros) e Lei 1.096/2021 (mapa político)",
    sourceUrl: "https://vitormeireles.sc.gov.br/noticia-694775/",
    confidence: "média",
    neighborhoods: ["Centro", "Palmitos", "Das Lagoas", "Wietnã", "Sabugueiro"],
    ruralLocalities: ["Alto Ribeirão Faxinal", "Alto Ribeirão Palmitos", "Barra da Prata", "Cinco Lotes", "Colônia Sadlowski", "Gabiroba", "Paca", "Pratinha", "Ribeirão Abelha", "Ribeirão das Frutas", "Ribeirão do Tigre", "Ribeirão Palmitos", "Rio Bruno", "Rio Denecke I", "Rio Denecke II", "Salto Dollmann", "Santa Cruz dos Pinhais", "Serra da Abelha I", "Serra da Abelha II", "Serrinha"],
  },
  // Witmarsum
  "4219408": {
    source: "Página de eventos da prefeitura (lista parcial)",
    sourceUrl: "https://witmarsum.sc.gov.br/category/noticias/eventos/",
    confidence: "baixa",
    neighborhoods: ["Centro"],
    ruralLocalities: ["Ribeirão Pequeno", "Alto Rio Krauel", "Gnadental", "Waldheim", "Jundiá", "Catangara", "Caminho Butinga", "Serra Cambará", "Catangara Baixo", "Tucano Boi", "Tucano Feliz", "Vila Nova", "Cambará Baixo", "Tifa do Marreco", "Anú", "Margem Esquerda", "Tucaninho"],
  },
};
