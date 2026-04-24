
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from project root
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanup() {
  console.log("Iniciando limpieza manual...");
  
  const { data, error } = await supabase
    .from('products')
    .delete()
    .ilike('name', '%TEST PRODUCTO BORRAR%');

  if (error) {
    console.error("Error al borrar:", error);
  } else {
    console.log("Producto de test eliminado exitosamente.");
  }

  // También buscamos duplicados exactos si los hay
  const { data: allProducts } = await supabase.from('products').select('id, name');
  if (allProducts) {
    const seen = new Set();
    const duplicates = [];
    for (const p of allProducts) {
      if (seen.has(p.name)) {
        duplicates.push(p.id);
      } else {
        seen.add(p.name);
      }
    }
    
    if (duplicates.length > 0) {
      console.log(`Encontrados ${duplicates.length} duplicados. Borrando...`);
      await supabase.from('products').delete().in('id', duplicates);
      console.log("Duplicados eliminados.");
    }
  }
}

cleanup();
