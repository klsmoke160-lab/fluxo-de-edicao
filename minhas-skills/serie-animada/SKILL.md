---
name: serie-animada
description: "Skill mestra da série animada Turno da Noite (e de novas séries no mesmo motor): mostra em que etapa um episódio está e guia a produção, do roteiro ao MP4 final com voz, efeitos e legenda. Use em /serie-animada, ou quando a pessoa pedir para criar, mudar, renderizar ou corrigir um episódio."
---

# serie-animada

Você produz episódios de uma série animada vertical (9:16) para o TikTok. Tudo é feito em código: o cenário e os personagens em Three.js, as vozes com o Piper, o som com o FFmpeg. O projeto fica em `serie/turno-da-noite/`.

## Como falar
Português, frases curtas. Uma etapa por vez. Mostre o resultado de cada etapa e espere o "sim" antes da próxima. Diga sempre o que você conferiu e o que não conferiu (você não ouve o áudio nem assiste ao movimento: confere por quadros parados e por medições).

## Regras da série (não quebrar)
- O vulto só aparece no monitor. Nunca fala, nunca aparece "ao vivo", nunca é o Davi.
- O Davi nunca aparece no monitor.
- Sem votação no final: cada episódio termina num gancho. Cada episódio tem mais de 1 minuto.
- Referências servem para o jeito de fazer. História e personagens são da pessoa.
- Estilo: ver `minhas-skills/perfil/referencias.md`.

## Arquivos
| Arquivo | O que é |
|---|---|
| `roteiro.md` | O roteiro para leitura (personagens, cenas, falas, ganchos) |
| `episodios/epNN.json` | O episódio que o motor executa: uma lista de tomadas |
| `motor/motor.js` | Cenário, personagens e os tipos de tomada |
| `motor/index.html` | Legenda, HUD, celular e cartão final (HTML por cima do 3D) |
| `montar.py` | Vozes, tempos (`timeline.json`) e mixagem do áudio |
| `render.cjs` | Tira um quadro por vez no Chromium e monta o MP4 |
| `saida/` | Arquivos de trabalho (não vão para o git) |
| `entregas/` | Os vídeos prontos, com versão no nome |

## As etapas de um episódio
1. **Roteiro.** Escreva ou mude as cenas em `roteiro.md` e espere a aprovação.
2. **Tomadas.** Traduza o roteiro para `episodios/epNN.json`. Cada tomada tem `tipo`, `min` (duração mínima), e opcionalmente `fala: [quem, texto]`, `legenda` (se o texto na tela for diferente do falado, por exemplo "3" em vez de "três"), `pre`/`pos` (silêncio antes e depois da fala) e `sfx: [[nome, segundo, ganho_dB]]`.
3. **Vozes e tempos.** `python3 montar.py epNN vozes`. A duração de cada tomada é o maior entre `min` e a fala com as pausas. Confira se o total passa de 60 s.
4. **Conferência por quadros.** `node render.cjs epNN quadros <tempos>` com um tempo dentro de cada tomada. Junte numa folha e olhe: enquadramento, legenda, texto cortado, placa espelhada, personagem dentro de objeto.
5. **Render.** `node render.cjs epNN video` (cerca de 6 a 9 minutos por episódio; rode em segundo plano, dois por vez no máximo).
6. **Áudio.** `python3 montar.py epNN audio` grava `entregas/turno-da-noite_epNN_vXX.mp4`.
7. **Revisão da pessoa.** Ela assiste e pede mudanças. Nunca sobrescreva uma entrega: suba a versão (`VERSAO` no `montar.py`).

## Tipos de tomada
`caixa_aberto` (olha: frente, monitor, vira) · `sai_do_caixa` · `pov_anda` (para: corredor, caixa) · `monitor` (vulto: nenhum, meio, vira, perto, anda; `apaga`, `falhas`) · `close` (quem, lugar, cabeca, susto, fone, olhaCima, maoParede, camAng) · `corredor3` (pisca; layout velas) · `celular` (tela: mensagem, ligacao, encerrada) · `registradora` (itens, cupom) · `dois` (cliente: entra, parado, sai) · `placa` (n) · `lanterna` (n) · `pov_loja` · `campainha` (toca) · `preto` (texto, sub).

Uma cena que não cabe nesses tipos pede um tipo novo em `TOMADAS`, no `motor.js`.

## Armadilhas já encontradas
- **Texto em placa dos dois lados aparece espelhado.** Use dois planos, um para cada face.
- **Câmera de close atravessa objetos.** Confira o ângulo (`camAng`) em cada lugar novo; no caixa a registradora some no close.
- **Lanterna perto de parede estoura o branco.** Baixe a intensidade quando a parede está a menos de 3 m.
- **O Piper só tem vozes masculinas em pt-BR.** Personagem feminina precisa de outro serviço de voz.
- **Número falado e número escrito.** Na fala escreva "três"; na legenda, "3".
- **O detector de cortes do FFmpeg falha em cena escura.** Não confie nele para contar cortes de referência.
- **Não apague arquivos por comando com curinga depois de mudar de pasta.** Use uma pasta nova para cada conferência.

## Caderno de aprendizados
Toda correção da pessoa que vale para os próximos episódios vira uma linha em `serie/turno-da-noite/aprendizados.md`: `- [ ] <etapa> · <o que foi pedido> · <data>`. As regras acima só mudam quando ela pedir para aplicar os aprendizados.
