"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Youtube from "@tiptap/extension-youtube";

import { EditorToolbar } from "@/components/admin/products/rich-text/EditorToolbar";
import { ResizableImage, Video } from "@/components/admin/products/rich-text/extensions";

/**
 * Editor enriquecido de la descripción completa de producto (Sprint 6.3).
 * Elegido Tiptap (headless, sobre ProseMirror) en vez de Quill/Lexical --
 * ver CLAUDE.md sección 9 para la justificación completa -- porque trae
 * extensiones oficiales listas para exactamente lo que pedía el sprint
 * (negrita/cursiva/subrayado/tachado/títulos/listas/citas/separador/
 * enlaces/color/imágenes/YouTube), headless de verdad (la toolbar es
 * 100% propia, con los mismos `Button`/`Popover`/`Select` de shadcn que
 * ya usa el resto del panel, no un tema visual ajeno que hubiera que
 * forzar a parecerse al proyecto).
 *
 * `immediatelyRender: false` es la solución oficial de Tiptap para
 * Next.js/SSR -- sin esto, Tiptap tira un error de hidratación porque
 * intenta montar el editor durante el render del servidor. Mismo
 * problema de fondo que `leaflet` (Sprint 3.7), resuelto acá con la
 * opción que el propio Tiptap expone para frameworks SSR en vez de un
 * `next/dynamic(..., { ssr:false })` -- ambas son formas válidas de
 * evitar que algo dependiente del DOM se evalúe en el servidor; esta es
 * la que Tiptap documenta como la correcta para su propio caso.
 *
 * `scopeId`: carpeta del bucket `product-content` para las imágenes/
 * videos que se inserten -- el `productId` real en edición, o un UUID
 * generado una sola vez por `ProductForm.tsx` mientras se crea un
 * producto nuevo (todavía sin id).
 *
 * `StarterKit` (Tiptap v3) ya incluye `Link` y `Underline` -- a diferencia
 * de v2, donde eran extensiones aparte. Registrarlos de nuevo por separado
 * (como se hizo en un primer intento) genera "Duplicate extension names"
 * y comportamiento inconsistente del editor; se configuran acá vía
 * `StarterKit.configure({ link: {...} })` en vez de agregar
 * `@tiptap/extension-link`/`@tiptap/extension-underline` como paquetes
 * propios.
 *
 * Bug real encontrado y corregido durante la verificación de este mismo
 * sprint: `useEditor({ content: value })` solo usa `value` para el
 * contenido INICIAL del editor -- si `value` cambia después de montado
 * (exactamente lo que pasa en modo edición: `ProductForm.tsx` arranca con
 * `description = ""` y recién la actualiza cuando `useProduct()` termina
 * de traer el producto de forma asíncrona), Tiptap no se entera solo. Sin
 * el efecto de abajo, abrir "Editar producto" mostraba el editor vacío
 * aunque el producto sí tuviera una descripción guardada -- guardar en
 * ese estado hubiera borrado el contenido real. `emitUpdate: false` evita
 * que este `setContent` dispare `onUpdate` (que llamaría a `onChange`,
 * volviendo a setear `value` -- un loop innecesario, no infinito pero sí
 * un round-trip de más).
 */
export function RichTextEditor({
  value,
  onChange,
  scopeId,
}: {
  value: string;
  onChange: (html: string) => void;
  scopeId: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: { openOnClick: false, autolink: true },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      ResizableImage,
      Video,
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
    ],
    content: value,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base dark:prose-invert max-w-none min-h-[220px] px-4 py-3 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <EditorToolbar editor={editor} scopeId={scopeId} />
      <EditorContent editor={editor} />
    </div>
  );
}
