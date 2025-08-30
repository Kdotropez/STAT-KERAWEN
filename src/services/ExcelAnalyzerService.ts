import * as XLSX from 'xlsx';

export interface ProduitExcel {
  id: string;
  nom: string;
  categorie: string;
  prixAchatHT: number;
  prixVenteTTC: number;
}

export class ExcelAnalyzerService {
  private produits: ProduitExcel[] = [];

  // Charger et analyser le fichier Excel
  async analyserFichierExcel(filePath: string): Promise<ProduitExcel[]> {
    try {
      console.log('🔍 Début de l\'analyse du fichier Excel...');
      
      // Essayer d'abord le fichier Excel
      try {
        const response = await fetch(filePath);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          console.log(`📊 Fichier Excel chargé: ${jsonData.length} lignes`);
          console.log('📋 Premières lignes:', jsonData.slice(0, 5));

          // Analyser la structure du fichier
          const headers = jsonData[0] as string[];
          console.log('📋 Headers détectés:', headers);

          // Chercher les colonnes importantes
          const idIndex = this.trouverColonne(headers, ['identifiant mere', 'id', 'ID', 'Id', 'Référence', 'REF']);
          const nomIndex = this.trouverColonne(headers, ['produit', 'nom', 'Nom', 'NOM', 'Produit', 'PRODUIT', 'Désignation']);
          const categorieIndex = this.trouverColonne(headers, ['categorie', 'catégorie', 'Catégorie', 'CATEGORIE', 'Catégorie', 'CAT']);
          const prixAchatIndex = this.trouverColonne(headers, ['prix achat ht', 'prix achat', 'Prix Achat', 'PRIX ACHAT', 'PA HT', 'Prix Achat HT']);
          const prixVenteIndex = this.trouverColonne(headers, ['prix vente ht', 'prix vente', 'Prix Vente', 'PRIX VENTE', 'PV TTC', 'Prix Vente TTC']);

          console.log('🔍 Index des colonnes trouvés:', {
            id: idIndex,
            nom: nomIndex,
            categorie: categorieIndex,
            prixAchat: prixAchatIndex,
            prixVente: prixVenteIndex
          });

          // Traiter les données
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row && row.length > 0) {
              const produit: ProduitExcel = {
                id: String(row[idIndex] || ''),
                nom: String(row[nomIndex] || ''),
                categorie: String(row[categorieIndex] || ''),
                prixAchatHT: parseFloat(row[prixAchatIndex]) || 0,
                prixVenteTTC: parseFloat(row[prixVenteIndex]) || 0
              };

              if (produit.id && produit.nom) {
                this.produits.push(produit);
              }
            }
          }

          console.log(`✅ Analyse Excel terminée: ${this.produits.length} produits trouvés`);
          return this.produits;
        }
      } catch (excelError) {
        console.log('⚠️ Erreur avec le fichier Excel, essai avec le fichier JSON de test...');
      }

      // Si le fichier Excel échoue, utiliser le fichier JSON avec les vraies données
      console.log('🔄 Utilisation du fichier JSON avec les vraies données...');
      const testResponse = await fetch('/real-excel-data.json');
      if (!testResponse.ok) {
        throw new Error(`Erreur HTTP: ${testResponse.status} ${testResponse.statusText}`);
      }
      
      const testData = await testResponse.json();
      console.log('📊 Fichier JSON de test chargé:', testData);

      const headers = testData.headers;
      const data = testData.data;

      // Chercher les colonnes importantes
      const idIndex = this.trouverColonne(headers, ['identifiant mere', 'id', 'ID', 'Id', 'Référence', 'REF']);
      const nomIndex = this.trouverColonne(headers, ['produit', 'nom', 'Nom', 'NOM', 'Produit', 'PRODUIT', 'Désignation']);
      const categorieIndex = this.trouverColonne(headers, ['categorie', 'catégorie', 'Catégorie', 'CATEGORIE', 'Catégorie', 'CAT']);
      const prixAchatIndex = this.trouverColonne(headers, ['prix achat ht', 'prix achat', 'Prix Achat', 'PRIX ACHAT', 'PA HT', 'Prix Achat HT']);
      const prixVenteIndex = this.trouverColonne(headers, ['prix vente ht', 'prix vente', 'Prix Vente', 'PRIX VENTE', 'PV TTC', 'Prix Vente TTC']);

      console.log('🔍 Index des colonnes trouvés:', {
        id: idIndex,
        nom: nomIndex,
        categorie: categorieIndex,
        prixAchat: prixAchatIndex,
        prixVente: prixVenteIndex
      });

      // Traiter les données
      for (let i = 0; i < data.length; i++) {
        const row = data[i] as any[];
        if (row && row.length > 0) {
          const produit: ProduitExcel = {
            id: String(row[idIndex] || ''),
            nom: String(row[nomIndex] || ''),
            categorie: String(row[categorieIndex] || ''),
            prixAchatHT: parseFloat(row[prixAchatIndex]) || 0,
            prixVenteTTC: parseFloat(row[prixVenteIndex]) || 0
          };

          if (produit.id && produit.nom) {
            this.produits.push(produit);
          }
        }
      }

      console.log(`✅ Analyse JSON terminée: ${this.produits.length} produits trouvés`);
      return this.produits;
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse:', error);
      throw error;
    }
  }

  // Trouver l'index d'une colonne par ses noms possibles
  private trouverColonne(headers: string[], nomsPossibles: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i]).toLowerCase();
      for (const nom of nomsPossibles) {
        if (header.includes(nom.toLowerCase())) {
          return i;
        }
      }
    }
    return 0; // Par défaut, première colonne
  }

  // Chercher un produit par son nom (recherche approximative)
  chercherProduitParNom(nomRecherche: string): ProduitExcel | null {
    const nomLower = nomRecherche.toLowerCase();
    
    // Recherche exacte d'abord
    let produit = this.produits.find(p => p.nom.toLowerCase() === nomLower);
    if (produit) return produit;

    // Recherche par mots-clés
    const motsRecherche = nomLower.split(/\s+/);
    
    for (const produit of this.produits) {
      const nomProduit = produit.nom.toLowerCase();
      let score = 0;
      
      for (const mot of motsRecherche) {
        if (nomProduit.includes(mot)) {
          score++;
        }
      }
      
      // Si au moins 2 mots correspondent, on considère que c'est une correspondance
      if (score >= Math.min(2, motsRecherche.length)) {
        return produit;
      }
    }

    return null;
  }

  // Chercher tous les produits contenant un mot-clé
  chercherProduitsParMotCle(motCle: string): ProduitExcel[] {
    const motLower = motCle.toLowerCase();
    return this.produits.filter(p => 
      p.nom.toLowerCase().includes(motLower) ||
      p.categorie.toLowerCase().includes(motLower)
    );
  }

  // Obtenir tous les produits
  getProduits(): ProduitExcel[] {
    return this.produits;
  }

  // Exporter les résultats d'analyse
  exporterAnalyse(): void {
    const analyse = {
      dateAnalyse: new Date().toISOString(),
      totalProduits: this.produits.length,
      produits: this.produits
    };

    const jsonString = JSON.stringify(analyse, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyse-excel_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Analyse exportée avec succès');
  }
}

export default ExcelAnalyzerService;
