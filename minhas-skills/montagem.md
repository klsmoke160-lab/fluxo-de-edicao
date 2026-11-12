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
- História: o Claude propõe 3 ideias originais e ela escolhe uma. Ideia escolhida: (pendente).
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

## Próximo passo
Ela escolhe uma das 3 ideias de história. Depois: teste visual de ~10 s (personagem + cenário) para aprovar o estilo.
