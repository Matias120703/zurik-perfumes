import { mergeAttributes, Node, type CommandProps } from "@tiptap/core";
import TiptapImage from "@tiptap/extension-image";

/**
 * Extiende el `Image` oficial de Tiptap con dos atributos nuevos --
 * `width` (redimensionar) y `align` (alinear) -- en vez de escribir un
 * nodo de imagen desde cero. Sprint 6.3 pide "redimensionarse" y
 * "alinearse": se resuelve con presets de ancho (25/50/75/100%) y
 * alineación (izquierda/centro/derecha) aplicados vía la toolbar
 * (`EditorToolbar.tsx`) sobre la imagen seleccionada -- no un handle de
 * arrastre libre, mismo criterio de simplicidad que ya usa el proyecto
 * (CLAUDE.md sección 6, principio 6: no construir más de lo que hace
 * falta). `mergeAttributes` (de @tiptap/core) concatena `style`
 * correctamente cuando dos atributos distintos devuelven cada uno su
 * propio fragmento de estilo -- no hace falta combinarlos a mano.
 */
export const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => element.style.width || element.getAttribute("width") || "100%",
        renderHTML: (attributes) => ({
          style: `width: ${attributes.width}; height: auto;`,
        }),
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({
          "data-align": attributes.align,
          style: `display: block; margin-left: ${attributes.align === "left" ? "0" : "auto"}; margin-right: ${
            attributes.align === "right" ? "0" : "auto"
          };`,
        }),
      },
    };
  },
});

/**
 * Tiptap no tiene una extensión oficial de video -- se define un Node
 * propio, mismo patrón de atributos (`width`/`align`) que `ResizableImage`
 * para que la toolbar reutilice exactamente los mismos comandos sobre
 * ambos tipos de nodo. Atómico y en bloque (`atom: true`, `group: "block"`)
 * -- se selecciona/borra como una sola unidad, igual que una imagen.
 */
export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      width: {
        default: "100%",
        parseHTML: (element) => element.style.width || "100%",
        renderHTML: (attributes) => ({ style: `width: ${attributes.width};` }),
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({
          "data-align": attributes.align,
          style: `display: block; margin-left: ${attributes.align === "left" ? "0" : "auto"}; margin-right: ${
            attributes.align === "right" ? "0" : "auto"
          };`,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "video" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(HTMLAttributes, { controls: "true" })];
  },

  addCommands() {
    return {
      setVideo:
        (options: { src: string; width?: string; align?: string }) =>
        ({ commands }: CommandProps) =>
          commands.insertContent({ type: this.name, attrs: options }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string; width?: string; align?: string }) => ReturnType;
    };
  }
}
