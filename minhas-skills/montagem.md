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
- Teste visual v01 (12 s, 720×1280, 30 fps, sem áudio): `serie/turno-da-noite/entregas/teste-visual_v01.mp4`. Aguardando a aprovação dela.

## Próximo passo
Ela aprova ou corrige o visual do teste. Depois: escolher o serviço de voz de IA, escrever o roteiro dos 4 episódios e montar o fluxo de etapas da série.
