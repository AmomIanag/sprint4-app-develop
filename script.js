// Alturas simuladas para o protótipo acadêmico, associadas a cada localidade.

const localidades = [
  { nome: "São Paulo, SP, Brasil", alturaVegetacao: 12 },
  { nome: "Caieiras, SP, Brasil", alturaVegetacao: 20 },
  { nome: "Cajamar, SP, Brasil", alturaVegetacao: 27 },
  { nome: "Jundiaí, SP, Brasil", alturaVegetacao: 35 },
  { nome: "Itupeva, SP, Brasil", alturaVegetacao: 41 },
  { nome: "Campinas, SP, Brasil", alturaVegetacao: 50 },
  { nome: "Hortolândia, SP, Brasil", alturaVegetacao: 56 },
  { nome: "Sumaré, SP, Brasil", alturaVegetacao: 18 },
  { nome: "Americana, SP, Brasil", alturaVegetacao: 32 },
  { nome: "Limeira, SP, Brasil", alturaVegetacao: 64 }
];

// Fonte única das faixas, classificações, prioridades e ações recomendadas.
const faixasVegetacao = [
  {
    min: 0,
    max: 20,
    classificacao: "Normal",
    acao: "Nenhuma intervenção necessária.",
    prioridade: "Baixa",
    ordemPrioridade: 4,
    classe: "status-normal"
  },
  {
    min: 20,
    max: 35,
    classificacao: "Atenção",
    acao: "Manter acompanhamento do ponto.",
    prioridade: "Moderada",
    ordemPrioridade: 3,
    classe: "status-atencao"
  },
  {
    min: 35,
    max: 50,
    classificacao: "Risco",
    acao: "Programar intervenção da equipe.",
    prioridade: "Alta",
    ordemPrioridade: 2,
    classe: "status-risco"
  },
  {
    min: 50,
    max: null,
    classificacao: "Crítico",
    acao: "Realizar intervenção imediata.",
    prioridade: "Imediata",
    ordemPrioridade: 1,
    classe: "status-critico"
  }
];


// Pegando elementos do nosso html

const botao = document.getElementById("botaoBuscar");
const cards = document.getElementById("cards");
const mensagem = document.getElementById("mensagem");
const resumoMonitoramento = document.getElementById("resumoMonitoramento");
const totalPontos = document.getElementById("totalPontos");
const totalPrioridadeAlta = document.getElementById("totalPrioridadeAlta");
const totalAtencao = document.getElementById("totalAtencao");
const totalNormal = document.getElementById("totalNormal");
const controleOrdenacao = document.getElementById("controleOrdenacao");
const ordenacaoCards = document.getElementById("ordenacaoCards");

let pontosProcessados = [];


// Quando o botão for clicado, a função é executada

botao.addEventListener("click", buscarDados);
ordenacaoCards.addEventListener("change", atualizarOrdenacao);


// Função principal

async function buscarDados() {
  cards.innerHTML = "";
  pontosProcessados = [];
  limparResumo();
  controleOrdenacao.hidden = true;
  ordenacaoCards.disabled = true;
  mensagem.textContent = "Carregando dados...";
  botao.disabled = true;

  const dadosLocalidades = [];
  let houveErro = false;

  // For que serve para passar pelas localidades
  for (let i = 0; i < localidades.length; i++) {
    mensagem.textContent =
      "Buscando " + (i + 1) + " de " + localidades.length;

    const dados = await buscarLocalidade(localidades[i]);

    if (dados) {
      dados.ordemOriginal = i;
      dadosLocalidades.push(dados);
    } else {
      houveErro = true;
    }

    // Pausa entre cada localidade
    await esperar();
  }

  pontosProcessados = processarPontos(dadosLocalidades);

  if (pontosProcessados.length > 0) {
    const resumo = calcularResumo(pontosProcessados);
    renderizarResumo(resumo);
    controleOrdenacao.hidden = false;
    ordenacaoCards.disabled = false;
    atualizarOrdenacao();
  }

  if (dadosLocalidades.length === 0) {
    mensagem.textContent = "Erro ao carregar os dados. Tente novamente.";
  } else if (houveErro) {
    mensagem.textContent = "Dados carregados parcialmente. Algumas localidades não puderam ser consultadas.";
  } else {
    mensagem.textContent = "Dados carregados com sucesso.";
  }
  botao.disabled = false;
}

// Associa a cada ponto sua classificação, prioridade e ação recomendada.
function processarPontos(dadosLocalidades) {
  return dadosLocalidades.map(function (dados) {
    const regra = classificarVegetacao(dados.alturaVegetacao);

    if (!regra) {
      return null;
    }

    return {
      ...dados,
      classificacao: regra.classificacao,
      acao: regra.acao,
      prioridade: regra.prioridade,
      ordemPrioridade: regra.ordemPrioridade,
      classe: regra.classe
    };
  }).filter(function (ponto) {
    return ponto !== null;
  });
}

// Calcula os indicadores usando somente os pontos processados.
function calcularResumo(pontos) {
  const resumo = {
    total: pontos.length,
    prioridadeAlta: 0,
    atencao: 0,
    normal: 0
  };

  pontos.forEach(function (ponto) {
    if (ponto.classificacao === "Risco" || ponto.classificacao === "Crítico") {
      resumo.prioridadeAlta++;
    } else if (ponto.classificacao === "Atenção") {
      resumo.atencao++;
    } else if (ponto.classificacao === "Normal") {
      resumo.normal++;
    }
  });

  return resumo;
}

function renderizarResumo(resumo) {
  totalPontos.textContent = resumo.total;
  totalPrioridadeAlta.textContent = resumo.prioridadeAlta;
  totalAtencao.textContent = resumo.atencao;
  totalNormal.textContent = resumo.normal;
  resumoMonitoramento.hidden = false;
}

function limparResumo() {
  totalPontos.textContent = "";
  totalPrioridadeAlta.textContent = "";
  totalAtencao.textContent = "";
  totalNormal.textContent = "";
  resumoMonitoramento.hidden = true;
}

// Cria uma cópia antes de ordenar para preservar a ordem do array processado.
function ordenarPontos(pontos, criterio) {
  const pontosOrdenados = pontos.slice();

  if (criterio === "original") {
    return pontosOrdenados.sort(function (pontoA, pontoB) {
      return pontoA.ordemOriginal - pontoB.ordemOriginal;
    });
  }

  return pontosOrdenados.sort(function (pontoA, pontoB) {
    return pontoA.ordemPrioridade - pontoB.ordemPrioridade
      || pontoB.alturaVegetacao - pontoA.alturaVegetacao
      || pontoA.ordemOriginal - pontoB.ordemOriginal;
  });
}

function atualizarOrdenacao() {
  const pontosOrdenados = ordenarPontos(pontosProcessados, ordenacaoCards.value);
  renderizarLocalidades(pontosOrdenados);
}


// Busca as coordenadas da localidade no OpenStreetMap (api sugerida pelo professor)

async function buscarLocalidade(localidade) {
  const enderecoMapa =
    "https://nominatim.openstreetmap.org/search" +
    "?format=json" +
    "&limit=1" +
    "&q=" +
    encodeURIComponent(localidade.nome);

  try {
    const respostaMapa = await fetch(enderecoMapa);

    const dadosMapa = await respostaMapa.json();

    if (dadosMapa.length === 0) {
      throw new Error("Localidade não encontrada.");
    }

    const latitude = dadosMapa[0].lat;
    const longitude = dadosMapa[0].lon;

    return await buscarClima(localidade, latitude, longitude);
  } catch (erro) {
    mensagem.textContent = "Erro ao buscar localização.";
    console.log(erro);
    return null;
  }
}


// Busca os dados meteorológicos no Open-Meteo (api sugerida pelo professor)

async function buscarClima(localidade, latitude, longitude) {
  const enderecoClima =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=" + latitude +
    "&longitude=" + longitude +
    "&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m";

  try {
    const respostaClima = await fetch(enderecoClima);

    const dadosClima = await respostaClima.json();

    const temperatura = dadosClima.current.temperature_2m;
    const umidade = dadosClima.current.relative_humidity_2m;
    const chuva = dadosClima.current.precipitation;
    const vento = dadosClima.current.wind_speed_10m;
    const riscoClimatico = verificarRisco(
      temperatura,
      umidade,
      chuva,
      vento
    );

    return {
      nome: localidade.nome,
      alturaVegetacao: localidade.alturaVegetacao,
      latitude,
      longitude,
      temperatura,
      umidade,
      chuva,
      vento,
      riscoClimatico
    };

  } catch (erro) {
    mensagem.textContent = "Erro ao buscar dados meteorológicos.";
    console.log(erro);
    return null;
  }
}

// Recebe uma altura e retorna a faixa correspondente.
function classificarVegetacao(altura) {
  if (!Number.isFinite(altura) || altura < 0) {
    return null;
  }

  for (const faixa of faixasVegetacao) {
    const acimaDoMinimo = faixa.min === 0
      ? altura >= faixa.min
      : altura > faixa.min;
    const abaixoDoMaximo = faixa.max === null || altura <= faixa.max;

    if (acimaDoMinimo && abaixoDoMaximo) {
      return faixa;
    }
  }

  return null;
}

// Percorre os resultados e cria os cards dinamicamente.
function renderizarLocalidades(dadosLocalidades) {
  cards.innerHTML = "";

  dadosLocalidades.forEach(function (dados) {
    criarCard(dados);
  });
}

// Cria um card para cada localidade

function criarCard(dados) {
  const card = document.createElement("article");
  card.classList.add("card", dados.classe);

  card.innerHTML = `
    <span class="localizacao-rotulo">Localização</span>
    <h3>${dados.nome}</h3>

    <div class="vegetacao-resumo">
      <div class="vegetacao-altura">
        <span>Altura da vegetação (simulada)</span>
        <strong>${dados.alturaVegetacao} cm</strong>
      </div>

      <div class="status-grupo">
        <div class="status-item">
          <span class="status-rotulo">Classificação</span>
          <span class="status-badge">${dados.classificacao}</span>
        </div>

        <div class="prioridade-grupo">
          <span class="status-rotulo">Prioridade de atendimento</span>
          <strong>${dados.prioridade}</strong>
        </div>
      </div>

      <p class="acao-recomendada">
        <strong>Ação recomendada:</strong>
        ${dados.acao}
      </p>
    </div>

    <h4 class="dados-climaticos">Dados climáticos e localização</h4>

    <p class="risco-climatico">
      <strong>Condição climática:</strong>
      ${dados.riscoClimatico}
    </p>

    <p class="dado-secundario">
      <strong>Latitude:</strong>
      ${Number(dados.latitude).toFixed(4)}
    </p>

    <p class="dado-secundario">
      <strong>Longitude:</strong>
      ${Number(dados.longitude).toFixed(4)}
    </p>

    <p class="dado-secundario">
      <strong>Temperatura:</strong>
      ${dados.temperatura} °C
    </p>

    <p class="dado-secundario">
      <strong>Umidade:</strong>
      ${dados.umidade}%
    </p>

    <p class="dado-secundario">
      <strong>Chuva:</strong>
      ${dados.chuva} mm
    </p>

    <p class="dado-secundario">
      <strong>Vento:</strong>
      ${dados.vento} km/h
    </p>

    <a
      href="https://www.openstreetmap.org/?mlat=${dados.latitude}&mlon=${dados.longitude}"
      target="_blank"
      rel="noopener noreferrer"
    >
      Ver no mapa →
    </a>
  `;

  cards.appendChild(card);
}

// Função para verificar o risco e retornar análise se tem risco ou não
function verificarRisco(temperatura, umidade, chuva, vento) {
    if (temperatura >= 32 && umidade <=35) {
        return "Alto risco de incêndio";
    }

    if (chuva >= 20) {
        return "Risco de alagamento e erosão";
    }

    if (vento >= 40) {
        return "Risco de queda de árvore";
    }

    return "Risco baixo";
}

// Cria uma pausa de um segundo entre as consultas

function esperar() {
  return new Promise(function (resolve) {
    setTimeout(resolve, 1000);
  });
}
