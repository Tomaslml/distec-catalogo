
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function removeDuplicates() {
  console.log("Iniciando limpieza de duplicados...");
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, brand, sort_order')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error al obtener productos:", error);
    return;
  }

  const seen = new Map();
  const toDelete = [];

  for (const p of products) {
    const key = `${p.name}-${p.brand}`.toLowerCase().trim();
    if (seen.has(key)) {
      // Ya vimos este producto, este es un duplicado
      toDelete.push(p.id);
    } else {
      seen.set(key, p.id);
    }
  }

  if (toDelete.length > 0) {
    console.log(`Borrando ${toDelete.length} duplicados...`);
    const { error: delError } = await supabase
      .from('products')
      .delete()
      .in('id', toDelete);

    if (delError) {
      console.error("Error al borrar duplicados:", delError);
    } else {
      console.log("¡Limpieza completada con éxito!");
    }
  } else {
    console.log("No se encontraron duplicados.");
  }
}

removeDuplicates();
