# rules

Regras completas para colaboracao entre Codex, Claude e outros agentes neste repositorio.

## Regra zero

- Ler `Sync/sync` deve ser a primeira coisa feita antes de executar qualquer acao neste repositorio.
- Esta regra vale para Codex, Claude e qualquer outro agente.
- Nenhum comando, edicao, instalacao, criacao de arquivo, organizacao de pasta ou alteracao de componente deve acontecer antes da leitura de `Sync/sync`.

## Regras globais

- Skills so podem ser instaladas dentro de `Skills/` quando o usuario declarar explicitamente o comando `skillinstall`.
- Sem `skillinstall`, agentes podem sugerir, planejar, revisar ou preparar conteudo de skills, mas nao instalar skills.
- Preferir commits pequenos e mensagens objetivas.
- Nao sobrescrever trabalho de outro agente sem registrar o motivo em `Sync/log.md` ou em bloqueios no `Sync/sync`.
- Ao concluir uma tarefa em uma pull request, fazer o merge automaticamente sem perguntar ao usuario, desde que a PR esteja com CI verde (ou sem checks configurados) e sem conflitos. Se houver CI falhando ou conflitos, resolver antes de mergear; se nao for possivel resolver, avisar o usuario em vez de mergear.

## Organizacao do repositorio

- `Sync/`: arquivos de coordenacao entre Codex, Claude e outros agentes.
- `Sync/sync`: arquivo leve, lido antes de qualquer acao.
- `Sync/rules.md`: regras completas, lido apenas quando necessario.
- `Sync/log.md`: historico de decisoes e tarefas concluidas.
- `Skills/`: skills instaladas ou criadas para o repositorio, apenas mediante comando `skillinstall`.
- `Framer Codes Component/`: componentes Framer organizados por empresa.
- `Framer Codes Component/AYVU/`: componentes criados para AYVU.
- `Framer Codes Component/COLLATERAL PARTNERS/`: componentes criados para Collateral Partners.
- `Framer Codes Component/MEMP/`: componentes criados para MEMP.
- `Framer Codes Component/FRAMER SKILLS/`: componentes, exemplos ou utilitarios relacionados a Framer Skills.

## Regras para componentes Framer

Sempre que Codex, Claude ou outro agente criar um componente Framer neste repositorio, o componente deve seguir estas regras:

1. Criar o componente dentro da pasta correta da empresa em `Framer Codes Component/`.
2. Criar componentes em React/TypeScript quando aplicavel, mantendo compatibilidade com Framer.
3. Definir `propertyControls` claros para todas as configuracoes editaveis no Framer.
4. Expor textos, cores, imagens, links, variantes e valores numericos importantes como propriedades configuraveis.
5. Usar nomes de props descritivos e estaveis.
6. Evitar dependencias externas desnecessarias; quando forem necessarias, registrar a decisao em `Sync/log.md`.
7. Manter layout responsivo e previsivel dentro do canvas do Framer.
8. Evitar estilos globais que possam afetar outros componentes.
9. Preferir animacoes performaticas com transform/opacity.
10. Garantir que textos nao estourem os limites visuais do componente.
11. Documentar no proprio arquivo apenas comentarios curtos quando houver logica nao obvia.
12. Ao concluir, registrar no `Sync/log.md` quais componentes foram criados ou alterados.