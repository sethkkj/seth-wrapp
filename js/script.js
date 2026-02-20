let observer;

/* ---------- OBSERVER DAS TELAS ---------- */

function iniciarObserver() {
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("ativa");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll(".tela").forEach(tela => {
    observer.observe(tela);
  });
}

/* ---------- FETCH ---------- */

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const url = id ? `/app/results/${id}.json` : "resultado.json";

fetch(url)
  .then(res => res.json())
  .then(dados => {

    /* ---------- HELPERS ---------- */
    const nomes = Object.keys(dados.participantes);

    const preencherTexto = (id, texto, delay = 0) => {
      const el = document.getElementById(id);
      if (!el) return;

      el.style.opacity = "0";
      el.style.transition = "opacity 1s ease";

      setTimeout(() => {
        el.textContent = texto;
        el.style.opacity = "1";
      }, delay);
    };

    const preencherTexto2 = (id, texto, delay = 0) => {
      const el = document.getElementById(id);
      if (!el) return;

      el.style.opacity = "0";
      el.style.transition = "opacity 1s ease";

      setTimeout(() => {
        el.innerHTML = texto;
        el.style.opacity = "1";
      }, delay);
    };



    const topEmojis = (obj, n = 6) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([e]) => e);

    const emojiMaisUsado = obj =>
      Object.entries(obj)
        .reduce((max, cur) => cur[1] > max[1] ? cur : max, ["", 0])[0];

    /* ---------- CHAT ---------- */

    function reproduzirConversa(mensagens) {
      const tudocomecou = document.getElementById("data-inicio");
      const container = document.getElementById("chat-preview");
      container.innerHTML = "";
      if (!mensagens.length) return;

      const autorEsquerda = mensagens[0].autor;

      mensagens.forEach(({ autor, mensagem }, i) => {
        const bubble = document.createElement("div");
        bubble.className = "msg " + (autor === autorEsquerda ? "msg-left" : "msg-right");
        bubble.textContent = mensagem;
        
        tudocomecou.style.display = "block";

        bubble.style.animation = `${autor === autorEsquerda ? "fadeSlideLeft" : "fadeSlideRight"} .4s forwards`;
        bubble.style.animationDelay = `${i * .45}s`;

        container.appendChild(bubble);
      });
    }

          /* ===========================
        COMPARAÇÃO VISUAL
      =========================== */

      let comparacaoRodou = false;
      let comparacaoRodou2 = false;

      const telaComparacao = document.querySelector(".tela-4");
      const telaMsg = document.querySelector(".tela-2");

      const observerComparacao = new IntersectionObserver(entries => {

        if (entries[0].isIntersecting && !comparacaoRodou) {

          comparacaoRodou = true;

          const v1 = dados.participantes[nomes[0]].mensagens;
          const v2 = dados.participantes[nomes[1]].mensagens;

          iniciarComparacaoVisual(v1, v2);
          preencherTexto2("maisfalou1", `<b>${dados.rankings.quem_mais_falou}</b> realmente gosta de conversar! 😂`, 4500)

        }

      }, { threshold: 0.6 });

      observerComparacao.observe(telaComparacao);

    const observerMsg = new IntersectionObserver(entries => {

        if (entries[0].isIntersecting && !comparacaoRodou2) {

          comparacaoRodou2 = true;

          preencherTexto2(
            "media-msgs",
            `Vocês trocaram <b>${dados.geral.total_mensagens}</b> mensagens! \nE isso dá uma média de <b>${dados.geral.media_diaria_msg}</b> mensagens por dia.`, 7000);
        }

      }, { threshold: 0.6 });

      observerMsg.observe(telaMsg);


      /* ===========================
        FUNÇÃO PRINCIPAL
      =========================== */

      function iniciarComparacaoVisual(valor1, valor2) {

        const total = valor1 + valor2;

        const porc1 = (valor1 / total) * 100;
        const porc2 = (valor2 / total) * 100;

        // barras
        document.getElementById("barra-01").style.width = porc1 + "%";
        document.getElementById("barra-02").style.width = porc2 + "%";

        // numeros animados
        animarNumero2({
          elemento: document.getElementById("num-01"),
          valorFinal: valor1,
          duracao: 4000,
          sufixo: " mensagens"
        });

        animarNumero({
          elemento: document.getElementById("num-02"),
          valorFinal: valor2,
          duracao: 4000,
          sufixo: " mensagens"
        });
      }

    function observarChat(mensagens) {
      const telaChat = document.querySelector(".tela-1");
      if (!telaChat) return;

      const chatObserver = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          reproduzirConversa(mensagens);
          chatObserver.disconnect(); // roda só uma vez
        }
      }, { threshold: 0.6 });

      chatObserver.observe(telaChat);
    }
    observarChat(dados.geral.primeiras_mensagens);

    function animarNumero({
      elemento,
      valorFinal,
      duracao = 1200,
      prefixo = "",
      sufixo = "",
      easing = true
    }) {
      if (!elemento) return;

      const inicio = 0;
      const inicioTempo = performance.now();

      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function animar(agora) {
        const tempoDecorrido = agora - inicioTempo;
        const progresso = Math.min(tempoDecorrido / duracao, 1);

        const fator = easing ? easeOutCubic(progresso) : progresso;
        const valorAtual = Math.floor(inicio + fator * (valorFinal - inicio));

        elemento.textContent = `${prefixo}${valorAtual}${sufixo}`;

        if (progresso < 1) {
          requestAnimationFrame(animar);
        } else {
          elemento.textContent = `${prefixo}${valorFinal}${sufixo}`;
        }
      }
    

      requestAnimationFrame(animar);
    }

    function animarNumero2({
      elemento,
      valorFinal,
      duracao = 1200,
      prefixo = "",
      sufixo = "",
      easing = true
    }) {
      if (!elemento) return;

      const inicio = 0;
      const inicioTempo = performance.now();

      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function animar(agora) {
        const tempoDecorrido = agora - inicioTempo;
        const progresso = Math.min(tempoDecorrido / duracao, 1);

        const fator = easing ? easeOutCubic(progresso) : progresso;
        const valorAtual = Math.floor(inicio + fator * (valorFinal - inicio));

        elemento.innerHTML = `${prefixo}${valorAtual}${sufixo}`;

        if (progresso < 1) {
          requestAnimationFrame(animar);
        } else {
          elemento.innerHTML = `${prefixo}${valorFinal}${sufixo}`;
        }
      }
    

      requestAnimationFrame(animar);
    }

    const telaCalendario = document.querySelector(".tela-3");

    const observerCalendario = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {

            const dataMaisAgitada = dados.rankings.dia_mais_agitado.data;

            mostrarCalendarioAnimado(dataMaisAgitada);

            observer.unobserve(entry.target); // roda só uma vez
          }
        });
      },
      {
        threshold: 0.6
      }
    );

    observerCalendario.observe(telaCalendario);


    function animarQuandoVisivel(id, valor, opcoes = {}) {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          animarNumero({
            elemento: el,
            valorFinal: valor,
            ...opcoes
          });
          obs.disconnect();
        }
      }, { threshold: 0.6 });

      obs.observe(el);
    }

    function diaDaSemana(dataStr) {
      // Espera "DD/MM/AAAA"
      const [dia, mes, ano] = dataStr.split("/").map(Number);

      // mês começa em 0 no JS
      const data = new Date(ano, mes - 1, dia);

      const dias = [
        "Domingo",
        "Segunda-Feira",
        "Terça-Feira",
        "Quarta-Feira",
        "Quinta-Feira",
        "Sexta-Feira",
        "Sábado"
      ];

      return dias[data.getDay()];
    }

    function alternarTexto(elemento, textos, delay = 1500) { 
      if (!elemento || !textos.length) 
        return; 
      let ultimoIndex = -1; 
      setInterval(() => { 
        let index; 
        do { index = Math.floor(Math.random() * textos.length); 

        } 
        while (index === ultimoIndex); 
        ultimoIndex = index; 
        elemento.textContent = textos[index]; 
      }, delay); 
    }
    function gerarCalendario(mes, ano) {
      const primeiroDia = new Date(ano, mes - 1, 1).getDay();
      const totalDias = new Date(ano, mes, 0).getDate();

      return {
        primeiroDia,
        totalDias
      };
    }

    function mostrarCalendarioAnimado(dataStr) {
      // Espera "DD/MM/AAAA"
      const [dia, mes, ano] = dataStr.split("/").map(Number);

      const calendario = document.getElementById("calendario");
      const diasEl = document.getElementById("dias");

      diasEl.innerHTML = "";
      calendario.classList.add("show");

      const { primeiroDia, totalDias } = gerarCalendario(mes, ano);

      // Espaços vazios antes do dia 1
      for (let i = 0; i < primeiroDia; i++) {
        diasEl.appendChild(document.createElement("span"));
      }

      // Dias do mês
      for (let d = 1; d <= totalDias; d++) {
        const span = document.createElement("span");
        span.textContent = d;
        diasEl.appendChild(span);

        // animação em sequência
        setTimeout(() => {
          span.classList.add("show");

          if (d === dia) {
            span.classList.add("destaque");
          }
        }, d * 60);
      }
  }

    /* ---------- MINIGAME ---------- */

    function renderEmojis(containerId, lista) {
      const container = document.getElementById(containerId);
      container.innerHTML = "";

      lista.forEach(item => {

        const div = document.createElement("div");
        div.className = "emoji-item";

        div.innerHTML = `
          <span>${item.emoji}</span>
          <span class="emoji-count">${item.quantidade}x</span>
        `;

        container.appendChild(div);

      });

    }

    preencherTexto("nome-1", `${nomes[0]}`)
    preencherTexto("nome-2", `${nomes[1]}`)

    renderEmojis("emojis-1", dados.participantes[nomes[0]].top_emojis);
    renderEmojis("emojis-2", dados.participantes[nomes[1]].top_emojis);

    const audio = document.getElementById("bgMusic");
    const startBtn = document.getElementById("btn-play");
    const toggleBtn = document.getElementById("audioToggle");

    startBtn.addEventListener("click", () => {

      audio.volume = 0.4;
      audio.play();

    });
    toggleBtn.addEventListener("click", () => {
      
      audio.muted = !audio.muted;

      toggleBtn.textContent = audio.muted ? "🔇" : "🔊";

    }); 

    function criarMinigame(strings, maisUsado, containerId, resultadoId) {
      const container = document.getElementById(containerId);
      const resultado = document.getElementById(resultadoId);
      if (!container) return;

      container.innerHTML = "";

      strings.forEach(str => {
        const btn = document.createElement("button");
        btn.textContent = str;
        btn.id = "btn-minigame";
        btn.style.position = "relative";
        btn.style.overflow = "visible";
        
        Object.assign(btn.style, {
          fontSize: "3.4rem",
          border: "1px solid #ffffff1a",
          borderRadius: "22px",
          margin: "4px",
          padding: "25px 20px",
          cursor: "pointer",
          background: "#ffffff13",
          boxShadow: "0 0 12px #ffffff10",
          transition: `
            background .4s ease,
            box-shadow .5s cubic-bezier(.2,.9,.2,1)
          `,
          position: "relative"
        });

        //rgba(37, 211, 102, 0.4)

        btn.onclick = () => {
          const acertou = str === maisUsado;

          // TEXTO
          resultado.innerHTML = `O mais usado foi o <span style="font-size: 1.8rem;">${maisUsado}</span>, com <b>${dados.emojis[maisUsado]}</b> vezes!`;
          resultado.style.opacity = "1";

          // BOTÃO CLICADO
          btn.style.backgroundImage = acertou
            ? "linear-gradient(to right bottom, #00ce4b, #00e46b, #00ed83, #00f69b, #00ffb1)"
            : "linear-gradient(to right bottom, #b70000, #c90000, #da0000, #ed0000, #ff0000)";

          btn.style.boxShadow = acertou
            ? "0 0 0 5px #ffffff, 0 15px 20px rgba(0,255,140,.20), inset 0 0 11px rgba(0,0,0,.38)"
            : "0 0 0 0px #ffffff00, 0 15px 20px rgba(255, 21, 60, 0.2), inset 0 0 11px rgba(0,0,0,.38)";
          btn.style.border = acertou
            ? "none"
            : "none";

          // 👉 SE ERROU, REVELA O CORRETO
          if (!acertou) {
            document
              .querySelectorAll(`#${containerId} button`)
              .forEach(b => {
                if (b.textContent === maisUsado) {
                  b.style.backgroundImage =
                    "linear-gradient(to right bottom, #00ce4b, #00e46b, #00ed83, #00f69b, #00ffb1)";
                  b.style.boxShadow =
                    "0 0 0 5px #ffffff, 0 15px 20px rgba(0,255,140,.20), inset 0 0 11px rgba(0,0,0,.38)";
                  b.style.border = "none";
                }
              });
          }

          // DESABILITA TODOS
          document
            .querySelectorAll(`#${containerId} button`)
            .forEach(b => b.disabled = true);
        };


        
        container.appendChild(btn);
      });
    }

    /* ---------- BOTÃO INICIAR ---------- */

    const btn = document.getElementById("btn-play");
    const main = document.querySelector("main");
    const hint = document.querySelector(".hint-scroll");

    btn.addEventListener("click", () => {
      btn.style.display = "none";
      main.classList.add("ativo");
      hint.classList.add("hidden");

      // ativa SOMENTE a tela 0 (nomes)
      pag1 = document.getElementById("intro-usuarios");
      pag1.style.display = "block";
      pag1.style.animation = "fadeSlideUp .4s forwards" 

      iniciarObserver();
    });


    /* ---------- DADOS ---------- */
    const conq = dados.conquistas
    const dataCString = `${dados.geral.inicio_conversa}`;
    const dataAString = `${dados.rankings.dia_mais_agitado.data}`;
    const [dia, mes, ano] = dataCString.split("/");
    const [diaA, mesA, anoA] = dataAString.split("/");

    const meses = [
      "janeiro", "fevereiro", "março", "abril",
      "maio", "junho", "julho", "agosto",
      "setembro", "outubro", "novembro", "dezembro"
    ];

    preencherTexto("intro-usuario1", `${nomes[0]}`);
    preencherTexto("intro-usuario2", `${nomes[1]}`);

    preencherTexto("data-inicio", `Tudo começou em\n${dia} de ${meses[Number(mes)-1]} de ${ano}`);

    /*preencherTexto2(
      "media-msgs",
      `Vocês trocaram <b>${dados.geral.total_mensagens}</b> mensagens! \nE isso dá uma média de <b>${dados.geral.media_diaria_msg}</b> mensagens por dia.`, 7000);
    */
    preencherTexto(
      "dia-agitado",
      `${diaDaSemana(dados.rankings.dia_mais_agitado.data)}\n${diaA} de ${meses[Number(mesA)-1]} de ${anoA}`
    );

    preencherTexto(
      "total_usuario01",
      `${nomes[0]}: ${dados.participantes[nomes[0]].mensagens} mensagens`
    );
    preencherTexto(
      "total_usuario02",
      `${nomes[1]}: ${dados.participantes[nomes[1]].mensagens} mensagens`
    );

    preencherTexto(
      "t-emojis",
      `Emojis Favoritos`,
    );
    /*preencherTexto(
      "emojis-usuarios",
      `${nomes[0]}:\n ${formatarTopEmojis(dados.participantes[nomes[0]].top_emojis)}\n${nomes[1]}:\n ${formatarTopEmojis(dados.participantes[nomes[1]].top_emojis)}`,
    );*/

    preencherTexto(
      "total-palavras",
      `${dados.geral.total_palavras}`,
    );

    preencherTexto2(
      "livro-equivalente",
      `<b>${dados.livro.livro_equivalente}</b>\n`,
    );

    preencherTexto(
      "sticker-geral",
      `O sticker mais usado na conversa foi o ${dados.rankings.sticker_mais_usado}`,
    );
    preencherTexto(
      "sticker-geral",
      `${dados.rankings.sticker_mais_usado}`,
    );
    preencherTexto(
      "sticker-usu01",
      `Figurinha mais enviada por ${nomes[0]}:`,
    );
    preencherTexto(
      "sticker-usu02",
      `Figurinha mais enviada por ${nomes[1]}:`,
    );

    //const stkgeral = document.getElementById("stk-geral");
    const conqsM = document.getElementById("maratona");
    //stkgeral.src = `chat-princess/${dados.rankings.sticker_mais_usado}.webp`;
    //stkgeral.style.alignSelf = "center";

    

    /*preencherTexto(
      "conquistas-desbloqueadas",
      `✅ Maratona: ${conq.maratona_dias} dias de conversa consecutivos!\n${conq.fa_de_figurinha.atingiu_meta?"✅":"❌"} Fã de Figurinha: ${conq.fa_de_figurinha.quantidade} de 1000 figurinhas trocadas\n${conq.coracao_quente.atingiu_meta?"✅":"❌"} Coração Quente: ${conq.coracao_quente.quantidade} de 500 corações trocados\n✅ Coruja: ${conq.coruja_mensagens} mensagens na madrugada\n🎯 Conquistas: ${conq.total_conquistas}`,
    ); */

    // Variaveis pras conquistas !!!

    const figurinhais = conq.fa_de_figurinha.atingiu_meta
    const coracaoqis = conq.coracao_quente.atingiu_meta

    const maratonaobj = document.getElementById("maratonaobj");
    const figurinhaobj = document.getElementById("figurinhaobj");
    const coracaoobj = document.getElementById("coracaoobj");
    const corujaobj = document.getElementById("corujaobj");

    // conquistas ja desbloqueadas autoooo

    maratonaobj.classList.add("ativa");
    corujaobj.classList.add("ativa");

    // nao auto

    function conqscond() {

      if (figurinhais===true) {
        figurinhaobj.classList.add("ativa")
      } else {
        figurinhaobj.classList.add("bloqueada");
      }

      if (coracaoqis===true) {
        coracaoobj.classList.add("ativa")
      } else {
        coracaoobj.classList.add("bloqueada");
      }
    
    }

    conqscond()

    preencherTexto2(
      "voceconq",
      `Você desbloqueou um total de <b>${conq.total_conquistas}</b> conquistas!`,
    );

    preencherTexto2(
      "maratonadias",
      `<b>${conq.maratona_dias}</b> dias de conversa consecutivos!`);
    
    preencherTexto2(
      "figurinhasquant",
      `<b>${conq.fa_de_figurinha.quantidade}</b> de 1000 figurinhas trocadas.`);
    
    preencherTexto2(
      "coracaoquant",
      `<b>${conq.coracao_quente.quantidade}</b> de 500 corações trocados.`);
    
    preencherTexto2(
      "corujadias",
      `<b>${conq.coruja_mensagens}</b> mensagens na madrugada.`);

    animarQuandoVisivel(
      "total-msgs", dados.geral.total_mensagens, 
    {
      duracao: 6000,
      sufixo: " mensagens"
    });

    animarQuandoVisivel(
      "total-palavras", dados.geral.total_palavras, 
    {
      duracao: 6000,
      prefixo: "E a conversa de vocês tiveram um total de \n",
      sufixo: " palavras"
    });

    preencherTexto2("dia-agitado2", `<b>${dados.rankings.dia_mais_agitado.mensagens}</b> mensagens nesse dia!`)

    preencherTexto2("t-emojis-enviados2", `Vocês trocaram um total de <b>${dados.geral.total_emojis}</b> emojis na conversa.\nPelo jeito os dois amam usar emojis! 😯`)

    /*animarQuandoVisivel(
      "t-emojis-enviados2", dados.geral.total_emojis, 
    {
      duracao: 5000,
      prefixo: "Vocês trocaram um total de ",
      sufixo: " emojis na conversa.\nPelo jeito os dois amam usar os emojis!" 
    }); */

    const textAEm = document.getElementById("alter-emoji");
    textAEm.style.fontSize = "7rem";

    const alternateEmojis = ["😂", "🤡", "🤔", "🔥", "😍", "😎", "🙈", "😬", "🙄", "🥰", "😁", "🤨", "💩"]

    alternarTexto(textAEm, alternateEmojis, 1200)

    window.addEventListener("scroll", () => {
    const y = window.scrollY;

    document.querySelector(".bg-layer").style.transform =
      `translateY(${y * 0.5}px)`;
  });


    /* ---------- MINIGAME EMOJIS ---------- */

    const emojisObj = dados.emojis;
    const emojisTop6 = topEmojis(emojisObj);
    const maisUsadoE = emojiMaisUsado(emojisObj);

    criarMinigame(emojisTop6, maisUsadoE, "minijogo1", "resultado1");

    /* ---------- CONFETE FINAL ---------- */

    const ultimaTela = document.querySelector(".tela:last-child");

    const confettiObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.6 }
        });
        confettiObserver.disconnect();
      }
    }, { threshold: 0.6 });
    confettiObserver.observe(ultimaTela);



    
  })

  .catch(err => console.error("Erro ao ler JSON:", err));
