import { Collection, CollectionField, CollectionFieldType } from "./schema";

let counter = 0;

function genId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function createCollection(name: string): Collection {
  return {
    id: genId("col"),
    name,
    fields: [{ id: "title", type: "text", label: "Título" }],
    items: [],
  };
}

export function renameCollection(collection: Collection, name: string): Collection {
  return { ...collection, name };
}

export function addField(collection: Collection, label: string, type: CollectionFieldType): Collection {
  const field: CollectionField = { id: genId("field"), type, label };
  return { ...collection, fields: [...collection.fields, field] };
}

export function removeField(collection: Collection, fieldId: string): Collection {
  return {
    ...collection,
    fields: collection.fields.filter((f) => f.id !== fieldId),
    items: collection.items.map((item) => {
      const next = { ...item };
      delete next[fieldId];
      return next;
    }),
  };
}

export function addItem(collection: Collection): Collection {
  const item: Record<string, unknown> = {};
  for (const field of collection.fields) {
    item[field.id] = field.type === "boolean" ? false : "";
  }
  return { ...collection, items: [...collection.items, item] };
}

export function updateItemField(
  collection: Collection,
  index: number,
  fieldId: string,
  value: unknown
): Collection {
  return {
    ...collection,
    items: collection.items.map((item, i) => (i === index ? { ...item, [fieldId]: value } : item)),
  };
}

export function removeItem(collection: Collection, index: number): Collection {
  return { ...collection, items: collection.items.filter((_, i) => i !== index) };
}
