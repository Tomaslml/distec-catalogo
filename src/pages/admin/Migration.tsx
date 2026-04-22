import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const BUCKET_NAME = 'product-images';

export default function Migration() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const runMigration = async () => {
    setRunning(true);
    setLog(["Iniciando migración..."]);
    
    try {
      // 1. Intentar asegurar bucket (si falla por RLS, seguimos adelante asumiendo que el usuario lo creó)
      addLog(`Verificando bucket "${BUCKET_NAME}"...`);
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const exists = buckets?.find(b => b.name === BUCKET_NAME);
        if (!exists) {
          addLog(`Intentando crear bucket "${BUCKET_NAME}"...`);
          const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
          });
          if (createError) {
            addLog(`Aviso: No se pudo crear el bucket automáticamente (${createError.message}).`);
            addLog(`Asegurate de haberlo creado manualmente en el dashboard de Supabase como PUBLIC.`);
          } else {
            addLog("Bucket creado exitosamente.");
          }
        } else {
          addLog(`El bucket "${BUCKET_NAME}" ya existe.`);
        }
      } catch (e) {
        addLog("Aviso: No se pudo verificar el bucket. Procediendo de todas formas...");
      }

      // 2. Traer productos
      const { data: products, error: pError } = await supabase
        .from('products')
        .select('id, name, image_url');
      
      if (pError) throw pError;
      addLog(`Encontrados ${products?.length} productos.`);

      for (const product of products || []) {
        if (product.image_url && product.image_url.startsWith('data:image')) {
          addLog(`Migrando: ${product.name}...`);
          
          const matches = product.image_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (!matches) continue;

          const contentType = matches[1];
          const base64Data = matches[2];
          
          // Convertir Base64 a Blob
          const res = await fetch(product.image_url);
          const blob = await res.blob();
          
          const extension = contentType.split('/')[1] || 'png';
          const fileName = `${crypto.randomUUID()}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, blob, { contentType, upsert: true });

          if (uploadError) {
            addLog(`Error subiendo ${product.name}: ${uploadError.message}`);
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

          await supabase
            .from('products')
            .update({ image_url: publicUrlData.publicUrl })
            .eq('id', product.id);

          addLog(`✓ ${product.name} migrado con éxito.`);
        }
      }
      
      addLog("Migración finalizada con éxito.");
      setDone(true);
      toast.success("Migración completada");
    } catch (err: any) {
      addLog(`Error fatal: ${err.message}`);
      toast.error("Error en la migración");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Migración de Imágenes a Storage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este proceso moverá todas las imágenes guardadas en Base64 al bucket de Supabase Storage.
            Esto hará que el catálogo cargue muchísimo más rápido.
          </p>
          
          <Button 
            onClick={runMigration} 
            disabled={running || done}
            className="w-full"
          >
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migrando...
              </>
            ) : done ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Migración completada
              </>
            ) : (
              "Iniciar Migración"
            )}
          </Button>

          <div className="bg-muted p-4 rounded-lg font-mono text-xs h-64 overflow-y-auto space-y-1 border">
            {log.length === 0 && <span className="text-muted-foreground">Esperando inicio...</span>}
            {log.map((line, i) => (
              <div key={i} className={line.startsWith('✓') ? "text-green-500" : line.includes('Error') ? "text-destructive" : ""}>
                {line}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
