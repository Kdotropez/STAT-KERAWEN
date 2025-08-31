const fs = require('fs');

function compareFiles() {
  try {
    // Lire les deux fichiers
    const file1 = JSON.parse(fs.readFileSync('public/decembre 2024_converted.json', 'utf8'));
    const file2 = JSON.parse(fs.readFileSync('public/DECEMBRE 2024 COMPLET_converted.json', 'utf8'));
    
    console.log('=== FICHIER 1: decembre 2024_converted.json ===');
    console.log('Type:', typeof file1);
    console.log('Clés:', Object.keys(file1));
    console.log('Nombre de données:', file1.data ? file1.data.length : 'N/A');
    if (file1.data && file1.data.length > 0) {
      console.log('Premier élément clés:', Object.keys(file1.data[0]));
      console.log('Exemple ID:', file1.data[0].Id);
      console.log('Exemple Produit:', file1.data[0].Produit);
    }
    
    console.log('\n=== FICHIER 2: DECEMBRE 2024 COMPLET_converted.json ===');
    console.log('Type:', typeof file2);
    console.log('Clés:', Object.keys(file2));
    console.log('Nombre de données:', file2.data ? file2.data.length : 'N/A');
    if (file2.data && file2.data.length > 0) {
      console.log('Premier élément clés:', Object.keys(file2.data[0]));
      console.log('Exemple ID:', file2.data[0].Id);
      console.log('Exemple Produit:', file2.data[0].Produit);
    }
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

compareFiles();
