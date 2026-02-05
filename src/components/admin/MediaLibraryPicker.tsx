 import { useState, useEffect } from "react";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Input } from "@/components/ui/input";
 import { PopButton } from "@/components/pop-art";
 import { Search, Loader2, Check, Image as ImageIcon } from "lucide-react";
 
 interface MediaLibraryPickerProps {
   open: boolean;
   onClose: () => void;
   onSelect: (url: string) => void;
   multiple?: boolean;
   onSelectMultiple?: (urls: string[]) => void;
 }
 
 interface MediaFile {
   id: string;
   url: string;
   filename: string;
 }
 
 export const MediaLibraryPicker = ({
   open,
   onClose,
   onSelect,
   multiple = false,
   onSelectMultiple,
 }: MediaLibraryPickerProps) => {
   const [search, setSearch] = useState("");
   const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
 
   // Fetch from storage bucket
   const { data: files = [], isLoading } = useQuery({
     queryKey: ["media-picker-files"],
     queryFn: async () => {
       const items: MediaFile[] = [];
       
       // Get files from root
       const { data: rootFiles } = await supabase.storage
         .from("content-images")
         .list("", { limit: 500 });
       
       rootFiles?.forEach(f => {
         if (f.name && !f.id?.includes("folder")) {
           const { data } = supabase.storage.from("content-images").getPublicUrl(f.name);
           items.push({
             id: f.id || f.name,
             url: data.publicUrl,
             filename: f.name,
           });
         }
       });
       
       // Get files from artwork folder
       const { data: artworkFiles } = await supabase.storage
         .from("content-images")
         .list("artwork", { limit: 500 });
       
       artworkFiles?.forEach(f => {
         if (f.name) {
           const { data } = supabase.storage.from("content-images").getPublicUrl(`artwork/${f.name}`);
           items.push({
             id: `artwork-${f.id || f.name}`,
             url: data.publicUrl,
             filename: f.name,
           });
         }
       });
       
       return items;
     },
     enabled: open,
   });
 
   const filteredFiles = files.filter(f => 
     f.filename.toLowerCase().includes(search.toLowerCase())
   );
 
   const toggleSelect = (url: string) => {
     if (multiple) {
       setSelectedUrls(prev => 
         prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
       );
     } else {
       onSelect(url);
       onClose();
     }
   };
 
   const handleConfirm = () => {
     if (multiple && onSelectMultiple) {
       onSelectMultiple(selectedUrls);
     }
     onClose();
   };
 
   useEffect(() => {
     if (!open) setSelectedUrls([]);
   }, [open]);
 
   return (
     <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
       <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
         <DialogHeader>
           <DialogTitle>Select from Media Library</DialogTitle>
         </DialogHeader>
         
         <div className="relative mb-4">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
           <Input
             placeholder="Search files..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-10"
           />
         </div>
         
         <div className="flex-1 overflow-auto">
           {isLoading ? (
             <div className="flex justify-center py-12">
               <Loader2 className="w-8 h-8 animate-spin" />
             </div>
           ) : filteredFiles.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
               <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
               <p>No media files found</p>
             </div>
           ) : (
             <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
               {filteredFiles.map((file) => {
                 const isSelected = selectedUrls.includes(file.url);
                 return (
                   <button
                     key={file.id}
                     onClick={() => toggleSelect(file.url)}
                     className={`relative aspect-square overflow-hidden border-2 transition-all ${
                       isSelected ? "border-primary ring-2 ring-primary" : "border-muted hover:border-foreground"
                     }`}
                   >
                     <img
                       src={file.url}
                       alt={file.filename}
                       className="w-full h-full object-cover"
                       loading="lazy"
                     />
                     {isSelected && (
                       <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                         <Check className="w-8 h-8 text-primary" />
                       </div>
                     )}
                     <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                       <p className="text-white text-[10px] truncate">{file.filename}</p>
                     </div>
                   </button>
                 );
               })}
             </div>
           )}
         </div>
         
         {multiple && (
           <div className="flex justify-between items-center pt-4 border-t">
             <span className="text-sm text-muted-foreground">
               {selectedUrls.length} selected
             </span>
             <PopButton onClick={handleConfirm} disabled={selectedUrls.length === 0}>
               Add Selected
             </PopButton>
           </div>
         )}
       </DialogContent>
     </Dialog>
   );
 };