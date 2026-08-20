import { Node } from "./schema";

/**
 * Operações imutáveis sobre a árvore de Node do canvas. Todas retornam uma
 * nova árvore (a raiz recebida nunca é mutada), para casar bem com state
 * de React e permitir undo/redo por comparação de referência no futuro.
 */

export function findNode(root: Node, id: string): Node | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function findParent(root: Node, childId: string): Node | null {
  for (const child of root.children ?? []) {
    if (child.id === childId) return root;
    const found = findParent(child, childId);
    if (found) return found;
  }
  return null;
}

/**
 * Caminho da raiz até `id`, inclusive nos dois extremos. Retorna `null` se
 * `id` não existir na árvore. Usado para descobrir se um nó está dentro do
 * template de uma cms-collection (o ancestral mais próximo desse tipo).
 */
export function findAncestors(root: Node, id: string): Node[] | null {
  if (root.id === id) return [root];
  for (const child of root.children ?? []) {
    const path = findAncestors(child, id);
    if (path) return [root, ...path];
  }
  return null;
}

export function updateNode(root: Node, id: string, patch: Partial<Node>): Node {
  if (root.id === id) {
    return { ...root, ...patch };
  }
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map((child) => updateNode(child, id, patch)),
  };
}

export function removeNode(root: Node, id: string): Node {
  if (!root.children) return root;
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== id)
      .map((child) => removeNode(child, id)),
  };
}

/**
 * Insere `node` como filho de `parentId` na posição `index` (padrão: no final).
 */
export function insertNode(root: Node, parentId: string, node: Node, index?: number): Node {
  if (root.id === parentId) {
    const children = [...(root.children ?? [])];
    const at = index ?? children.length;
    children.splice(at, 0, node);
    return { ...root, children };
  }
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map((child) => insertNode(child, parentId, node, index)),
  };
}

/**
 * Move um nó existente (por id) para ser filho de `newParentId` na posição `index`.
 */
export function moveNode(root: Node, nodeId: string, newParentId: string, index?: number): Node {
  const node = findNode(root, nodeId);
  if (!node || nodeId === newParentId) return root;

  const withoutNode = removeNode(root, nodeId);
  return insertNode(withoutNode, newParentId, node, index);
}

let counter = 0;

/** Gera um id curto e razoavelmente único para novos nós. */
export function generateNodeId(prefix = "node"): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}
