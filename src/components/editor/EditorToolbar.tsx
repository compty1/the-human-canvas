import { useState } from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EditorToolbarProps {
  editor: Editor | null;
  onImageUpload?: () => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
}

const ToolbarButton = ({ onClick, isActive, children, title }: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "p-2 border-2 border-foreground transition-all hover:bg-accent",
      isActive && "bg-primary text-primary-foreground"
    )}
  >
    {children}
  </button>
);

const ToolbarDivider = () => (
  <div className="w-px h-8 bg-foreground mx-1" />
);

export const EditorToolbar = ({ editor, onImageUpload }: EditorToolbarProps) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);

  if (!editor) return null;

  const openLinkPopover = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    setLinkOpen(true);
  };

  const applyLink = () => {
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    }
    setLinkOpen(false);
    setLinkUrl("");
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
    setLinkUrl("");
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-muted border-2 border-foreground border-b-0">
      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block Elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Links & Images */}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={openLinkPopover}
            title="Add Link"
            className={cn(
              "p-2 border-2 border-foreground transition-all hover:bg-accent",
              editor.isActive("link") && "bg-primary text-primary-foreground"
            )}
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="space-y-2">
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyLink()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={applyLink} className="flex-1">
                Apply
              </Button>
              {editor.isActive("link") && (
                <Button size="sm" variant="destructive" onClick={removeLink}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {onImageUpload && (
        <ToolbarButton onClick={onImageUpload} title="Add Image">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
      )}

      <ToolbarDivider />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
};
