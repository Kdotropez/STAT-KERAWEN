import * as XLSX from 'xlsx';

export interface ProduitReference {
  id: string;
  nom: string;
  description?: string;
  categorie?: string;
  fournisseur?: string;
  fabricant?: string;
  prix?: number;
  [key: string]: any;
}

export class ReferenceService {
  private produitsReference: ProduitReference[] = [];

  async chargerReferenceProduits(file: File): Promise<ProduitReference[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          const produits: ProduitReference[] = [];
          const headers = jsonData[0] as string[];
          
          // Chercher l'index de la colonne ID
          const idIndex = headers.findIndex(header => 
            header && header.toLowerCase().includes('id')
          );
          
          // Chercher l'index de la colonne Nom/Produit
          const nomIndex = headers.findIndex(header => 
            header && (header.toLowerCase().includes('nom') || 
                     header.toLowerCase().includes('produit') ||
                     header.toLowerCase().includes('description'))
          );
          
          console.log('🔍 Debug - Fichier référence produits:');
          console.log('Headers:', headers);
          console.log('ID index:', idIndex);
          console.log('Nom index:', nomIndex);
          
          // Traiter chaque ligne de données
          for (let i = 1; i < jsonData.length; i++) {
            const ligne = jsonData[i] as any[];
            if (ligne && ligne[idIndex]) {
              const produit: ProduitReference = {
                id: String(ligne[idIndex]).trim(),
                nom: ligne[nomIndex] || 'Nom non disponible'
              };
              
              // Ajouter d'autres colonnes si disponibles
              headers.forEach((header, index) => {
                if (header && index !== idIndex && index !== nomIndex && ligne[index]) {
                  produit[header.toLowerCase()] = ligne[index];
                }
              });
              
              produits.push(produit);
            }
          }
          
          this.produitsReference = produits;
          resolve(produits);
        } catch (error) {
          reject(new Error(`Erreur lors de la lecture du fichier de référence: ${error}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  }

  trouverProduitParId(id: string): ProduitReference | null {
    return this.produitsReference.find(produit => produit.id === id) || null;
  }

  obtenirTousProduits(): ProduitReference[] {
    return this.produitsReference;
  }
}


