"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { type Editor, useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Clapperboard,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Redo2,
  Strikethrough,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  Video as VideoIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadDescriptionAsset } from "@/services/storage";

const HEADING_ITEMS = [
  { value: "paragraph", label: "Párrafo" },
  { value: "1", label: "Título 1" },
  { value: "2", label: "Título 2" },
  { value: "3", label: "Título 3" },
  { value: "4", label: "Título 4" },
  { value: "5", label: "Título 5" },
  { value: "6", label: "Título 6" },
];

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={active ? "bg-muted text-foreground" : undefined}
    >
      {children}
    </Button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />;
}

/**
 * Toolbar del editor enriquecido (Sprint 6.3). Puramente presentacional:
 * recibe el `editor` de Tiptap ya inicializado (`RichTextEditor.tsx`) y
 * dispara comandos sobre él -- no tiene estado propio del documento,
 * mismo criterio que separa `lib/`/hooks de la UI en el resto del panel.
 * `scopeId` es el productId real (edición) o un UUID temporal (alta) que
 * define la carpeta del bucket `product-content` para lo que se suba acá.
 */
export function EditorToolbar({ editor, scopeId }: { editor: Editor | null; scopeId: string }) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const state = useEditorState({
    editor,
    selector: (ctx) => {
      const ed = ctx.editor;
      if (!ed) return null;
      return {
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        underline: ed.isActive("underline"),
        strike: ed.isActive("strike"),
        bulletList: ed.isActive("bulletList"),
        orderedList: ed.isActive("orderedList"),
        blockquote: ed.isActive("blockquote"),
        link: ed.isActive("link"),
        headingValue: ed.isActive("heading", { level: 1 })
          ? "1"
          : ed.isActive("heading", { level: 2 })
            ? "2"
            : ed.isActive("heading", { level: 3 })
              ? "3"
              : ed.isActive("heading", { level: 4 })
                ? "4"
                : ed.isActive("heading", { level: 5 })
                  ? "5"
                  : ed.isActive("heading", { level: 6 })
                    ? "6"
                    : "paragraph",
        canUndo: ed.can().undo(),
        canRedo: ed.can().redo(),
      };
    },
  });

  if (!editor || !state) return null;

  async function handleImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const url = await uploadDescriptionAsset(scopeId, file);
      editor?.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleVideoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingVideo(true);
    try {
      const url = await uploadDescriptionAsset(scopeId, file);
      editor?.chain().focus().setVideo({ src: url }).run();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo subir el video.");
    } finally {
      setIsUploadingVideo(false);
    }
  }

  function applyHeading(value: string) {
    if (value === "paragraph") {
      editor?.chain().focus().setParagraph().run();
    } else {
      editor
        ?.chain()
        .focus()
        .toggleHeading({ level: Number(value) as 1 | 2 | 3 | 4 | 5 | 6 })
        .run();
    }
  }

  function applyLink() {
    if (!linkUrl.trim()) return;
    editor?.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run();
    setLinkUrl("");
  }

  function removeLink() {
    editor?.chain().focus().unsetLink().run();
    setLinkUrl("");
  }

  function applyYoutube() {
    if (!youtubeUrl.trim()) return;
    editor?.commands.setYoutubeVideo({ src: youtubeUrl.trim() });
    setYoutubeUrl("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-xl border-b border-border bg-muted/40 p-2">
      <Select items={HEADING_ITEMS} value={state.headingValue} onValueChange={(value) => applyHeading(value as string)}>
        <SelectTrigger className="h-7 w-[7.5rem] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HEADING_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Divider />

      <ToolbarButton label="Negrita" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Cursiva" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Subrayado"
        active={state.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Tachado"
        active={state.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Lista con viñetas"
        active={state.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Lista numerada"
        active={state.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Cita"
        active={state.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="size-3.5" />
      </ToolbarButton>

      <Divider />

      <Popover>
        <PopoverTrigger
          render={
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Enlace" className={state.link ? "bg-muted text-foreground" : undefined}>
              <Link2 className="size-3.5" />
            </Button>
          }
        />
        <PopoverContent className="w-64">
          <div className="flex gap-2">
            <Input
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="https://..."
              className="h-8"
            />
            <Button type="button" size="sm" onClick={applyLink}>
              Aplicar
            </Button>
          </div>
          {state.link ? (
            <Button type="button" variant="ghost" size="sm" onClick={removeLink}>
              Quitar enlace
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>

      <label className="flex items-center" aria-label="Color de texto">
        <Palette className="mr-1 size-3.5 text-muted-foreground" aria-hidden />
        <input
          type="color"
          className="size-6 cursor-pointer rounded border border-border bg-transparent p-0"
          onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
        />
      </label>

      <label className="flex items-center" aria-label="Color de resaltado">
        <Highlighter className="mr-1 size-3.5 text-muted-foreground" aria-hidden />
        <input
          type="color"
          className="size-6 cursor-pointer rounded border border-border bg-transparent p-0"
          onChange={(event) => editor.chain().focus().toggleHighlight({ color: event.target.value }).run()}
        />
      </label>

      <Divider />

      <ToolbarButton
        label="Insertar imagen"
        disabled={isUploadingImage}
        onClick={() => imageInputRef.current?.click()}
      >
        <ImagePlus className="size-3.5" />
      </ToolbarButton>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleImageSelected}
      />

      <ToolbarButton
        label="Subir video"
        disabled={isUploadingVideo}
        onClick={() => videoInputRef.current?.click()}
      >
        <VideoIcon className="size-3.5" />
      </ToolbarButton>
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm"
        className="hidden"
        onChange={handleVideoSelected}
      />

      <Popover>
        <PopoverTrigger
          render={
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Insertar video de YouTube">
              <Clapperboard className="size-3.5" />
            </Button>
          }
        />
        <PopoverContent className="w-72">
          <div className="flex gap-2">
            <Input
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="h-8"
            />
            <Button type="button" size="sm" onClick={applyYoutube}>
              Insertar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Divider />

      <ToolbarButton label="Alinear imagen/video a la izquierda" onClick={() => applyMediaAlign(editor, "left")}>
        <AlignLeft className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Centrar imagen/video" onClick={() => applyMediaAlign(editor, "center")}>
        <AlignCenter className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Alinear imagen/video a la derecha" onClick={() => applyMediaAlign(editor, "right")}>
        <AlignRight className="size-3.5" />
      </ToolbarButton>

      {(["25%", "50%", "75%", "100%"] as const).map((width) => (
        <Button
          key={width}
          type="button"
          variant="ghost"
          size="xs"
          className="text-[0.7rem]"
          onClick={() => applyMediaWidth(editor, width)}
        >
          {width}
        </Button>
      ))}

      <ToolbarButton label="Eliminar elemento seleccionado" onClick={() => editor.chain().focus().deleteSelection().run()}>
        <Trash2 className="size-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton label="Deshacer" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Rehacer" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="size-3.5" />
      </ToolbarButton>
    </div>
  );
}

/** `updateAttributes` aplica sobre el nodo seleccionado (imagen o video) --
 * si la selección actual no es ninguno de los dos, Tiptap simplemente no
 * hace nada (sin error), así que estos dos botones son seguros de mostrar
 * siempre, sin trackear si hay una imagen/video seleccionado en este momento. */
function applyMediaAlign(editor: Editor, align: "left" | "center" | "right") {
  editor.chain().focus().updateAttributes("image", { align }).updateAttributes("video", { align }).run();
}

function applyMediaWidth(editor: Editor, width: string) {
  editor.chain().focus().updateAttributes("image", { width }).updateAttributes("video", { width }).run();
}
