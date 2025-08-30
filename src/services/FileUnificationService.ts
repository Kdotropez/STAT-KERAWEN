import { VenteLigne } from '../types';

export interface ProduitUnifie {
  id: string;
  nom: string;
  categorie: string;
  prix_achat_ht: number;
  prix_vente_ttc: number;
  type: 'simple' | 'compose';
  composants?: ComposantUnifie[];
  source: 'excel' | 'json' | 'fusion';
}

export interface ComposantUnifie {
  id: string;
  nom: string;
  quantite: number;
  prix_achat_ht: number;
  prix_vente_ttc: number;
}

export interface FichierUnifie {
  produits: ProduitUnifie[];
  date_creation: string;
  date_modification: string;
  version: string;
  hash_compositions: string; // Hash pour détecter les changements
  statistiques: {
    total_produits: number;
    produits_simples: number;
    produits_composes: number;
    produits_excel: number;
    produits_json: number;
  };
}

export class FileUnificationService {
  private produitsUnifies: ProduitUnifie[] = [];

  // Charger et analyser le fichier Excel
  async chargerFichierExcel(): Promise<any[]> {
    try {
      const ExcelAnalyzerService = (await import('./ExcelAnalyzerService')).default;
      const analyseurExcel = new ExcelAnalyzerService();
      const produitsExcel = await analyseurExcel.analyserFichierExcel('/id produits pour mappage.xls');
      console.log(`📊 ${produitsExcel.length} produits Excel chargés`);
      return produitsExcel;
    } catch (error) {
      console.warn('⚠️ Impossible de charger le fichier Excel:', error);
      return [];
    }
  }

  // Charger les compositions depuis le JSON
  async chargerCompositionsJSON(): Promise<any[]> {
    try {
      const CompositionService = (await import('./CompositionService')).default;
      const serviceComposition = new CompositionService();
      await serviceComposition.chargerCompositions();
      
      const compositions = serviceComposition.getCompositions();
      console.log(`📊 ${compositions.length} compositions JSON chargées`);
      return compositions;
    } catch (error) {
      console.warn('⚠️ Impossible de charger les compositions JSON:', error);
      return [];
    }
  }

  // Unifier les données Excel et JSON
  async unifierFichiers(): Promise<FichierUnifie> {
    console.log('🚀 Début de l\'unification des fichiers...');
    
    // Charger les données Excel
    const produitsExcel = await this.chargerFichierExcel();
    
    // Charger les compositions JSON
    const compositionsJSON = await this.chargerCompositionsJSON();
    
    // Créer le fichier unifié
    const fichierUnifie = await this.creerFichierUnifie(produitsExcel, compositionsJSON);
    
    console.log('✅ Unification terminée:', fichierUnifie.statistiques);
    return fichierUnifie;
  }

  // Créer le fichier unifié en fusionnant les données
  private async creerFichierUnifie(produitsExcel: any[], compositionsJSON: any[]): Promise<FichierUnifie> {
    const produitsUnifies: ProduitUnifie[] = [];
    let produitsExcelCount = 0;
    let produitsJSONCount = 0;
    let produitsComposesCount = 0;

    // 1. Ajouter tous les produits Excel (produits simples)
    for (const produitExcel of produitsExcel) {
      const produitUnifie: ProduitUnifie = {
        id: produitExcel.id,
        nom: produitExcel.nom,
        categorie: produitExcel.categorie || 'Non classé',
        prix_achat_ht: produitExcel.prix_achat_ht || 0,
        prix_vente_ttc: produitExcel.prix_vente_ttc || 0,
        type: 'simple',
        source: 'excel'
      };
      
      produitsUnifies.push(produitUnifie);
      produitsExcelCount++;
    }

    // 2. Traiter les compositions JSON
    for (const composition of compositionsJSON) {
      // Vérifier si le produit composé existe déjà dans Excel
      const produitExcelExistant = produitsExcel.find(p => p.id === composition.id);
      
      if (produitExcelExistant) {
        // Le produit composé existe dans Excel, mettre à jour avec les données Excel
        const index = produitsUnifies.findIndex(p => p.id === composition.id);
        if (index !== -1) {
          produitsUnifies[index] = {
            ...produitsUnifies[index],
            type: 'compose',
            source: 'fusion',
            composants: await this.extraireComposants(composition, produitsExcel)
          };
        }
      } else {
        // Le produit composé n'existe pas dans Excel, l'ajouter
        const produitCompose: ProduitUnifie = {
          id: composition.id,
          nom: composition.nom,
          categorie: 'COMPOSITION',
          prix_achat_ht: 0, // À calculer à partir des composants
          prix_vente_ttc: 0, // À définir manuellement
          type: 'compose',
          source: 'json',
          composants: await this.extraireComposants(composition, produitsExcel)
        };
        
        produitsUnifies.push(produitCompose);
        produitsJSONCount++;
      }
      
      produitsComposesCount++;
    }

    // 3. Calculer les prix d'achat des produits composés
    for (const produit of produitsUnifies) {
      if (produit.type === 'compose' && produit.composants) {
        produit.prix_achat_ht = produit.composants.reduce((total, composant) => {
          return total + (composant.prix_achat_ht * composant.quantite);
        }, 0);
      }
    }

    const fichierUnifie: FichierUnifie = {
      produits: produitsUnifies,
      date_creation: new Date().toISOString(),
      date_modification: new Date().toISOString(),
      version: '1.0',
      hash_compositions: await this.calculerHashCompositions(compositionsJSON),
      statistiques: {
        total_produits: produitsUnifies.length,
        produits_simples: produitsUnifies.filter(p => p.type === 'simple').length,
        produits_composes: produitsComposesCount,
        produits_excel: produitsExcelCount,
        produits_json: produitsJSONCount
      }
    };

    this.produitsUnifies = produitsUnifies;
    return fichierUnifie;
  }

  // Extraire les composants d'une composition avec les vraies données Excel
  private async extraireComposants(composition: any, produitsExcel: any[]): Promise<ComposantUnifie[]> {
    const composants: ComposantUnifie[] = [];

    // Obtenir les composants selon le format (ancien ou nouveau)
    let composantsList: any[] = [];
    
    if (composition.composants && Array.isArray(composition.composants)) {
      // Format nouveau: tableau d'objets
      composantsList = composition.composants;
    } else if (composition.compositions && Array.isArray(composition.compositions)) {
      // Format ancien: tableau de strings
      composantsList = composition.compositions.map((comp: string) => {
        const match = comp.match(/^(.+?)\s*\((\d+)\)$/);
        if (match) {
          return {
            nom: match[1].trim(),
            quantite: parseInt(match[2], 10)
          };
        }
        return null;
      }).filter(Boolean);
    }

    // Traiter chaque composant
    for (const composant of composantsList) {
      if (!composant) continue;

      // Fonction de recherche améliorée
      const trouverProduitExcel = (nomComposant: string): any => {
        const nomNormalise = nomComposant.toLowerCase().trim();
        
        // 1. Recherche exacte
        let produit = produitsExcel.find(p => 
          p.nom.toLowerCase().trim() === nomNormalise
        );
        if (produit) return produit;

        // 2. Recherche par inclusion (nom du composant dans le nom Excel)
        produit = produitsExcel.find(p => 
          p.nom.toLowerCase().includes(nomNormalise)
        );
        if (produit) return produit;

        // 3. Recherche par inclusion inverse (nom Excel dans le nom du composant)
        produit = produitsExcel.find(p => 
          nomNormalise.includes(p.nom.toLowerCase())
        );
        if (produit) return produit;

                  // 4. Recherche par mots-clés (prendre les mots importants)
          const motsComposant = nomNormalise.split(/\s+/).filter(mot => mot.length > 2);
          if (motsComposant.length > 1) {
            // Chercher un produit qui contient au moins 2 mots du composant
            produit = produitsExcel.find(p => {
              const motsExcel = p.nom.toLowerCase().split(/\s+/);
              const motsCommuns = motsComposant.filter(mot => 
                motsExcel.some((motExcel: string) => motExcel.includes(mot) || mot.includes(motExcel))
              );
              return motsCommuns.length >= 2;
            });
            if (produit) return produit;
          }

        return null;
      };

      // Chercher le composant dans les produits Excel
      const produitExcel = trouverProduitExcel(composant.nom);

      if (produitExcel) {
        // Composant trouvé dans Excel
        const composantUnifie: ComposantUnifie = {
          id: produitExcel.id,
          nom: produitExcel.nom,
          quantite: composant.quantite,
          prix_achat_ht: produitExcel.prix_achat_ht || 0,
          prix_vente_ttc: produitExcel.prix_vente_ttc || 0
        };
        composants.push(composantUnifie);
        console.log(`  ✅ Composant trouvé: ${produitExcel.nom} (ID: ${produitExcel.id}) pour "${composant.nom}"`);
      } else {
        // Composant non trouvé dans Excel, utiliser les données du JSON
        const composantUnifie: ComposantUnifie = {
          id: composant.nom.replace(/\s+/g, '_').toUpperCase(),
          nom: composant.nom,
          quantite: composant.quantite,
          prix_achat_ht: 0,
          prix_vente_ttc: 0
        };
        composants.push(composantUnifie);
        console.log(`  ⚠️ Composant non trouvé dans Excel: ${composant.nom}`);
      }
    }

    return composants;
  }

  // Obtenir le fichier unifié
  getFichierUnifie(): FichierUnifie | null {
    if (this.produitsUnifies.length === 0) {
      return null;
    }

    return {
      produits: this.produitsUnifies,
      date_creation: new Date().toISOString(),
      date_modification: new Date().toISOString(),
      version: '1.0',
      hash_compositions: '', // Sera calculé lors de la création
      statistiques: {
        total_produits: this.produitsUnifies.length,
        produits_simples: this.produitsUnifies.filter(p => p.type === 'simple').length,
        produits_composes: this.produitsUnifies.filter(p => p.type === 'compose').length,
        produits_excel: this.produitsUnifies.filter(p => p.source === 'excel').length,
        produits_json: this.produitsUnifies.filter(p => p.source === 'json').length
      }
    };
  }

  // Exporter le fichier unifié en JSON
  async exporterFichierUnifie(): Promise<void> {
    const fichierUnifie = this.getFichierUnifie();
    if (!fichierUnifie) {
      throw new Error('Aucun fichier unifié disponible. Veuillez d\'abord effectuer l\'unification.');
    }

    try {
      const jsonString = JSON.stringify(fichierUnifie, null, 2);
      
      // Créer un blob et télécharger le fichier
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `fichier-unifie_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Fichier unifié exporté avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'export du fichier unifié:', error);
      throw error;
    }
  }

  // Sauvegarder dans localStorage ET créer un fichier de référence local
  async sauvegarderDansLocalStorage(): Promise<void> {
    const fichierUnifie = this.getFichierUnifie();
    if (fichierUnifie) {
      try {
        // Sauvegarde localStorage (temporaire)
        localStorage.setItem('fichier-unifie', JSON.stringify(fichierUnifie, null, 2));
        console.log('💾 Fichier unifié sauvegardé dans localStorage');
        
        // Créer un fichier de référence local dans le projet
        await this.creerFichierReferenceLocal(fichierUnifie);
        console.log('💾 Fichier de référence local créé');
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
      }
    }
  }

  // Créer un fichier de référence local dans le projet
  private async creerFichierReferenceLocal(fichierUnifie: FichierUnifie): Promise<void> {
    try {
      const jsonString = JSON.stringify(fichierUnifie, null, 2);
      
      // Créer un fichier téléchargeable avec un nom explicite
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fichier-unifie-reference.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Fichier unifié créé: fichier-unifie-reference.json');
      console.log('📝 Instructions IMPORTANTES:');
      console.log('  1. Le fichier a été téléchargé automatiquement');
      console.log('  2. Déplacez-le dans le dossier /public/ de votre projet');
      console.log('  3. Remplacez l\'ancien fichier vide par celui-ci');
      console.log('  4. Rechargez la page pour que les changements prennent effet');
      console.log('  5. Les IDs corrects seront maintenant disponibles pour l\'import JSON');
      
    } catch (error) {
      console.error('❌ Erreur lors de la création du fichier de référence:', error);
    }
  }

  // Calculer un hash simple des compositions pour détecter les changements
  private async calculerHashCompositions(compositions: any[]): Promise<string> {
    const compositionsString = JSON.stringify(compositions.map(c => ({ id: c.id, nom: c.nom, compositions: c.compositions })));
    // Hash simple basé sur la longueur et les premiers caractères
    return btoa(compositionsString).slice(0, 20);
  }

  // Vérifier si le fichier unifié est à jour
  async verifierMiseAJour(): Promise<boolean> {
    try {
      // 1. Essayer de charger depuis le fichier de référence local
      const fichierReference = await this.chargerDepuisFichierReference();
      if (fichierReference) {
        console.log('✅ Fichier de référence local trouvé et chargé');
        return true;
      }

      // 2. Essayer de charger depuis localStorage
      const fichierSauvegarde = this.chargerDepuisLocalStorage();
      if (!fichierSauvegarde) {
        console.log('🔄 Aucun fichier unifié en cache, unification nécessaire');
        return false;
      }

      // 3. Vérifier si les compositions ont changé
      const compositionsJSON = await this.chargerCompositionsJSON();
      const hashActuel = await this.calculerHashCompositions(compositionsJSON);

      if (fichierSauvegarde.hash_compositions !== hashActuel) {
        console.log('🔄 Compositions modifiées, unification nécessaire');
        return false;
      }

      console.log('✅ Fichier unifié à jour');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error);
      return false;
    }
  }

  // Charger depuis le fichier de référence local
  async chargerDepuisFichierReference(): Promise<FichierUnifie | null> {
    try {
      const response = await fetch('/fichier-unifie-reference.json');
      if (!response.ok) {
        console.log('📁 Fichier de référence local non trouvé');
        return null;
      }

      const fichierUnifie: FichierUnifie = await response.json();
      
      // Valider la structure du fichier
      if (!fichierUnifie.produits || !Array.isArray(fichierUnifie.produits)) {
        console.error('❌ Format de fichier de référence invalide');
        return null;
      }

      this.produitsUnifies = fichierUnifie.produits;
      
      // Sauvegarder dans localStorage pour la session
      localStorage.setItem('fichier-unifie', JSON.stringify(fichierUnifie, null, 2));
      
      console.log('✅ Fichier de référence local chargé avec succès');
      return fichierUnifie;
    } catch (error) {
      console.log('📁 Fichier de référence local non accessible:', error);
      return null;
    }
  }

  // Charger depuis localStorage
  chargerDepuisLocalStorage(): FichierUnifie | null {
    try {
      const savedData = localStorage.getItem('fichier-unifie');
      if (savedData) {
        const fichierUnifie: FichierUnifie = JSON.parse(savedData);
        this.produitsUnifies = fichierUnifie.produits;
        console.log('✅ Fichier unifié chargé depuis localStorage');
        return fichierUnifie;
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement depuis localStorage:', error);
    }
    return null;
  }

  // Charger depuis un fichier JSON importé
  async chargerDepuisFichier(file: File): Promise<FichierUnifie> {
    try {
      const text = await file.text();
      const fichierUnifie: FichierUnifie = JSON.parse(text);
      
      // Valider la structure du fichier
      if (!fichierUnifie.produits || !Array.isArray(fichierUnifie.produits)) {
        throw new Error('Format de fichier invalide');
      }
      
      this.produitsUnifies = fichierUnifie.produits;
      
      // Sauvegarder dans localStorage
      localStorage.setItem('fichier-unifie', JSON.stringify(fichierUnifie, null, 2));
      
      console.log('✅ Fichier unifié chargé depuis le fichier importé');
      return fichierUnifie;
    } catch (error) {
      console.error('❌ Erreur lors du chargement du fichier:', error);
      throw new Error('Impossible de charger le fichier unifié');
    }
  }

  // Vérifier si un fichier unifié existe dans le dossier de téléchargements
  async verifierFichierExistant(): Promise<boolean> {
    try {
      // Essayer de charger le fichier le plus récent
      const response = await fetch('/fichier-unifie_latest.json');
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default FileUnificationService;
