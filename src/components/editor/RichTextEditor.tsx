import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./EditorToolbar";
import { useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({
  content,
  onChange,
  placeholder = "Start writing...",
}: RichTextEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return null;
    }

    // Upload to Supabase storage
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data, error } = await supabase.storage
      .from("content-images")
      .upload(fileName, file);

    if (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("content-images")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto border-2 border-foreground",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 hover:text-primary/80",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none min-h-[300px] p-4 border-2 border-foreground bg-background focus:outline-none",
      },
      // Handle paste events for images
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              uploadImage(file).then((url) => {
                if (url && editor) {
                  editor.chain().focus().setImage({ src: url }).run();
                  toast({
                    title: "Image uploaded",
                    description: "Image pasted and uploaded successfully.",
                  });
                }
              });
            }
            return true;
          }
        }
        return false;
      },
      // Handle drop events for images
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const file = files[0];
        if (file.type.startsWith("image/")) {
          event.preventDefault();
          uploadImage(file).then((url) => {
            if (url && editor) {
              editor.chain().focus().setImage({ src: url }).run();
              toast({
                title: "Image uploaded",
                description: "Image dropped and uploaded successfully.",
              });
            }
          });
          return true;
        }
        return false;
      },
    },
  });

  const handleImageUpload = async () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const url = await uploadImage(file);
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }

    // Reset input
    e.target.value = "";
  };

  return (
    <div className="rich-text-editor" ref={editorContainerRef}>
      <EditorToolbar editor={editor} onImageUpload={handleImageUpload} />
      <div className="relative">
        <EditorContent editor={editor} />
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground pointer-events-none">
          Paste or drop images
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        
        .ProseMirror h1 {
          font-family: var(--font-display);
          font-size: 2rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        
        .ProseMirror h2 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        
        .ProseMirror h3 {
          font-family: var(--font-display);
          font-size: 1.25rem;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .ProseMirror blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
        }
        
        .ProseMirror code {
          background: hsl(var(--muted));
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
        }
        
        .ProseMirror pre {
          background: hsl(var(--foreground));
          color: hsl(var(--background));
          padding: 1rem;
          border-radius: 0;
          border: 2px solid hsl(var(--foreground));
          overflow-x: auto;
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        
        .ProseMirror hr {
          border: none;
          border-top: 4px solid hsl(var(--foreground));
          margin: 1.5rem 0;
        }
        
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
};
