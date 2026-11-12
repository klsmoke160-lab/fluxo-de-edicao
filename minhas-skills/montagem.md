# Montagem do fluxo de edição

Fase atual: 3 (referências e perfil) · Atualizado em 2026-11-12

## Ambiente
- A montagem está sendo feita numa sessão do Claude Code na nuvem (container temporário), não no computador da pessoa.
- Sistema do computador dela, GPU e programa de edição: ainda não informados.
- Instalado nesta montagem: nada.

## Decisões
- Tipo e formato: série animada de 4 episódios para o TikTok, vertical 9:16, cada episódio com mais de 1 minuto.
- Final de episódio: sem votação A/B. Cada episódio termina num gancho para o próximo.
- Produção das cenas: o Claude constrói cenários e personagens em código (Three.js) e renderiza em MP4. Antes, um teste de ~10 s para aprovar o visual.
- Vozes: voz de IA (serviço e vozes por personagem ainda a escolher; vai precisar de uma conta/chave dela).
- História: o Claude propõe 3 ideias originais e ela escolhe uma. Ideia escolhida: **Turno da Noite** (Davi, mercadinho 24 horas, o cliente que só aparece no monitor do corredor 3).
- Revisão: (pendente) programa de edição ou só assistir ao vídeo pronto.
- Pastas: ferramentas e skills em `minhas-skills/` deste repositório (proposto; ela ainda não confirmou).
- Som (música e efeitos), nomes das skills e prefixo: (pendente).

## Perfil
- Referências analisadas: 3 (fichas em `perfil/referencias.md`). A skill recomenda 5 a 10.
- Análise feita só por quadros (1 a cada 2 s) e detector de cortes. Falta medir câmera e curvas, e ouvir o áudio.
- Perfil escrito: ainda não.

## Fluxo aprovado
(pendente: o fluxo de 8 etapas é para apresentador falando para a câmera; aqui ele vai ser adaptado para série animada: roteiro, vozes, cenários e personagens, animação e câmera, legendas e HUD, som, render.)

## Skills escritas
- [ ] regras comuns
- [ ] skill mestra
- [ ] etapas

## Série
- Projeto em `serie/turno-da-noite/` (Three.js + `render.cjs`, que tira um quadro por vez no Chromium e monta o MP4 com FFmpeg).
- Teste visual v01 (12 s, 720×1280, 30 fps, sem áudio): `serie/turno-da-noite/entregas/teste-visual_v01.mp4`. **Visual aprovado por ela** ("está no caminho certo").

## História
- Regra pedida por ela: o Davi nunca vê ele mesmo. O vulto não é o Davi, e o Davi não aparece no monitor.
- Final escolhido (EP 4): o corredor 3 não existe. O Davi conta só dois corredores; a CAM 03 mostra o vulto andando até o caixa; a loja está vazia.
- Roteiro v01 dos 4 episódios em `serie/turno-da-noite/roteiro.md`. Aguardando a aprovação dela.

## Produção (ela pediu: "faz tudo")
- Vozes: Piper (aberto, roda sem conta), três vozes pt-BR: Davi = faber, Seu Osmar = jeff com filtro de telefone, Seu Jair = cadu. Os modelos ficam em `serie/turno-da-noite/vozes-modelos/` (fora do git; baixar de novo de huggingface.co/rhasspy/piper-voices).
- A cliente Dona Neide virou o Seu Jair, porque o Piper não tem voz feminina em pt-BR.
- Motor dos episódios: `serie/turno-da-noite/motor/`, tomadas em `episodios/epNN.json`, `montar.py` (vozes, tempos, áudio) e `render.cjs`.
- Efeitos sonoros e ambiente são sintetizados no FFmpeg (sem biblioteca de sons, sem música).
- Entregas v01 em `serie/turno-da-noite/entregas/`, 720×1280, 30 fps.

## Skills escritas (série)
- [x] `minhas-skills/serie-animada/SKILL.md`: skill mestra da série, com as etapas, os tipos de tomada e as armadilhas.

## Visual v02 (ela pediu: "está muito igual ao original, diferencia um pouco")
- Personagens de cabeça quadrada arredondada, olhos ovais, sobrancelhas; Davi de boné e avental verde-azulados; Seu Jair de jaqueta marrom.
- Loja lilás com faixa rosa, balcão roxo, luz rosa; placas amarelas; visor âmbar; monitor azulado; celular roxo.
- HUD em etiqueta de preço amarela com relógio digital; legenda em caixa escura com o nome de quem fala.
- História, falas e vozes iguais à v01. Entregas: `serie/turno-da-noite/entregas/turno-da-noite_epNN_v02.mp4`.

## Próximo passo
Ela assiste aos 4 episódios v02 e pede as correções (voz, ritmo, visual). Eu não ouvi o áudio nem assisti ao movimento: conferi por quadros parados e por medições.
