import { VenteLigne } from '../types';

export interface Composant {
  id: string;
  nom: string;
  quantite: number;
  categorie?: string;
}

// Interface pour gérer les deux formats de données JSON
export interface Composition {
  type: string;
  id: string;
  nom: string;
  isModified: boolean;
  nombreComposants: number;
  // Format ancien: tableau de strings
  compositions?: string[];
  // Format nouveau: tableau d'objets
  composants?: Composant[];
}

// Interface pour l'édition des compositions (avec objets Composant)
export interface CompositionEdition {
  type: string;
  id: string;
  nom: string;
  isModified: boolean;
  nombreComposants: number;
  composants: Composant[]; // Format pour l'édition: tableau d'objets
}

export interface CompositionsData {
  compositions: Composition[];
}

export class CompositionService {
  private compositions: Composition[] = [];

  // Charger les compositions depuis le fichier JSON ou localStorage
  async chargerCompositions(): Promise<void> {
    try {
      // PRIORITÉ : Charger depuis le fichier compositions-enrichies.json (avec catégories)
      try {
        const response = await fetch('/compositions-enrichies.json');
        if (response.ok) {
          const data = await response.json();
          this.compositions = data;
          console.log('✅ Compositions chargées depuis compositions-enrichies.json:', this.compositions.length);
          return;
        }
      } catch (error) {
        console.warn('⚠️ Impossible de charger compositions-enrichies.json, essai localStorage');
      }

      // Fallback : essayer localStorage
      const savedData = localStorage.getItem('compositions');
      if (savedData) {
        const data = JSON.parse(savedData);
        // Convertir la structure organisée par type en tableau plat
        this.compositions = this.convertirStructureEnTableau(data);
        console.log('✅ Compositions chargées depuis localStorage:', this.compositions.length);
        return;
      }

      // Fallback : essayer l'ancienne clé
      const savedDataOld = localStorage.getItem('compositions-unifiees');
      if (savedDataOld) {
        const data: CompositionsData = JSON.parse(savedDataOld);
        this.compositions = data.compositions;
        console.log('✅ Compositions chargées depuis localStorage (ancienne clé):', this.compositions.length);
        return;
      }

      // Fallback : essayer le fichier compositions-unifiees.json
      const responseOld = await fetch('/compositions-unifiees.json');
      const dataOld: CompositionsData = await responseOld.json();
      this.compositions = dataOld.compositions;
      console.log('✅ Compositions chargées depuis compositions-unifiees.json:', this.compositions.length);
      
      // Sauvegarder dans localStorage pour la prochaine fois
      localStorage.setItem('compositions-unifiees', JSON.stringify(dataOld, null, 2));
    } catch (error) {
      console.error('❌ Erreur lors du chargement des compositions:', error);
      this.compositions = [];
    }
  }

  // Convertir la structure organisée par type en tableau plat
  private convertirStructureEnTableau(data: any): Composition[] {
    const compositions: Composition[] = [];
    
    if (data && typeof data === 'object') {
      // Parcourir tous les types de compositions
      Object.keys(data).forEach(type => {
        if (Array.isArray(data[type])) {
          data[type].forEach((comp: any) => {
            compositions.push(comp);
          });
        }
      });
    }
    
    return compositions;
  }

  // Trouver une composition par ID
  trouverCompositionParId(id: string | number): Composition | undefined {
    const idString = String(id);
    return this.compositions.find(comp => comp.id === idString);
  }

  // Parser un composant depuis le format JSON (ex: "BK VERRE VILLAGE TROPEZ (1)")
  private parserComposant(composantString: string): Composant | null {
    try {
      // Format attendu: "NOM_PRODUIT (QUANTITE)"
      const match = composantString.match(/^(.+?)\s*\((\d+)\)$/);
      if (match) {
        const nomComplet = match[1].trim();
        const quantite = parseInt(match[2], 10);
        
        // Extraire l'ID de 4 chiffres du nom si présent
        const idMatch = nomComplet.match(/\b(\d{4})\b/);
        const id = idMatch ? idMatch[1] : nomComplet.replace(/\s+/g, '_').toUpperCase();
        
        // Nettoyer le nom en retirant les parenthèses avec chiffres à la fin
        const nomNettoye = nomComplet.replace(/\s*\(\d+\)$/, '');
        
        return {
          id: id,
          nom: nomNettoye,
          quantite: quantite
        };
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Erreur lors du parsing du composant:', composantString, error);
      return null;
    }
  }

  // Obtenir les composants d'une composition (gère les deux formats)
  obtenirComposants(composition: Composition): Composant[] {
    const composants: Composant[] = [];

    // Format nouveau: tableau d'objets
    if (composition.composants && Array.isArray(composition.composants)) {
      return composition.composants;
    }

    // Format ancien: tableau de strings
    if (composition.compositions && Array.isArray(composition.compositions)) {
      composition.compositions.forEach(composantStr => {
        const composant = this.parserComposant(composantStr);
        if (composant) {
          composants.push(composant);
        }
      });
    }

    return composants;
  }

  // Obtenir toutes les compositions
  getCompositions(): Composition[] {
    return this.compositions;
  }

  // Obtenir les IDs des compositions
  getIdsCompositions(): string[] {
    return this.compositions.map(comp => comp.id);
  }

  // Convertir une Composition en CompositionEdition (pour l'édition)
  compositionPourEdition(composition: Composition): CompositionEdition {
    const composantsParses = this.obtenirComposants(composition);

    return {
      ...composition,
      composants: composantsParses
    };
  }

  // Obtenir toutes les compositions au format édition
  getCompositionsPourEdition(): CompositionEdition[] {
    return this.compositions.map(comp => this.compositionPourEdition(comp));
  }

  // Exporter les compositions vers un fichier JSON
  async exporterCompositions(): Promise<void> {
    try {
      const data: CompositionsData = { compositions: this.compositions };
      const jsonString = JSON.stringify(data, null, 2);
      
      // Créer un blob et télécharger le fichier
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `compositions-unifiees_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Fichier de compositions exporté avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'export des compositions:', error);
    }
  }

  // Décomposer une vente en ses composants
  async decomposerVente(ligneOriginale: VenteLigne): Promise<VenteLigne[]> {
    const resultat: VenteLigne[] = [];

    // Vérifier si c'est un produit composé
    const composition = this.trouverCompositionParId(ligneOriginale.id);
    if (!composition) {
      console.log(`🔍 Pas de composition trouvée pour ID: ${ligneOriginale.id} (${ligneOriginale.produit})`);
      return resultat;
    }

    console.log(`🔍 Recherche composition pour ID: ${ligneOriginale.id} (type: ${typeof ligneOriginale.id}) ...`);

    // Charger les données Excel pour obtenir les vrais IDs
    let produitsExcel: any[] = [];
    try {
      const ExcelAnalyzerService = (await import('./ExcelAnalyzerService')).default;
      const analyseurExcel = new ExcelAnalyzerService();
      produitsExcel = await analyseurExcel.analyserFichierExcel('/id produits pour mappage.xls');
      console.log(`📊 ${produitsExcel.length} produits Excel chargés pour la décomposition`);
    } catch (error) {
      console.warn('⚠️ Impossible de charger les données Excel, utilisation des IDs du JSON:', error);
    }

    // Obtenir les composants
    const composants = this.obtenirComposants(composition);
    console.log(`📋 Composants trouvés pour ${composition.nom}:`, composants);

    for (const composant of composants) {
      // Chercher le vrai ID du composant dans les données Excel
      let vraiId = composant.id;
      let vraiNom = composant.nom;

      if (produitsExcel.length > 0) {
        // Recherche plus précise : chercher d'abord par nom exact, puis par inclusion
        let produitExcel = produitsExcel.find(p => 
          p.nom.toLowerCase() === composant.nom.toLowerCase()
        );
        
        if (!produitExcel) {
          // Si pas de correspondance exacte, chercher par inclusion mais être plus strict
          produitExcel = produitsExcel.find(p => {
            const nomComposant = composant.nom.toLowerCase();
            const nomExcel = p.nom.toLowerCase();
            
            // Éviter les confusions entre "VN TROPEZ" et "VN TROPEZ CLEAR LN"
            if (nomComposant.includes('vn tropez') && nomExcel.includes('vn tropez')) {
              // Pour les VN TROPEZ, faire une correspondance exacte ou très proche
              return nomComposant === nomExcel || 
                     (nomComposant === 'vn tropez' && nomExcel === 'vn tropez') ||
                     (nomComposant === 'vn tropez clear ln' && nomExcel === 'vn tropez clear ln');
            }
            
            // Pour les autres produits, utiliser l'inclusion normale
            return nomComposant.includes(nomExcel) || nomExcel.includes(nomComposant);
          });
        }
        
        if (produitExcel) {
          vraiId = produitExcel.id;
          vraiNom = produitExcel.nom;
          console.log(`  🔍 Correspondance trouvée: "${composant.nom}" → "${vraiNom}" (ID: ${vraiId})`);
        } else {
          console.warn(`  ⚠️ Aucune correspondance trouvée pour "${composant.nom}" dans les données Excel`);
          console.log(`  🔍 Produits Excel disponibles:`, produitsExcel.slice(0, 5).map(p => p.nom));
          
          // Fallback: utiliser le nom du composant comme ID si pas de correspondance
          vraiId = composant.nom.replace(/\s+/g, '_').toUpperCase();
          vraiNom = composant.nom;
          console.log(`  🔄 Fallback utilisé: ID="${vraiId}", Nom="${vraiNom}"`);
        }
      }
      
      const ligneComposant: VenteLigne = {
        ...ligneOriginale, // Copier toutes les propriétés
        id: vraiId,
        produit: vraiNom,
        quantite: ligneOriginale.quantite * composant.quantite, // Multiplier par la quantité du composant
        prix_ttc: 0, // Prix à 0 pour les composants
        prix_achat: 0, // Prix d'achat à 0 pour les composants
        montantTTC: 0, // Montant à 0 pour les composants
        tva: 0, // TVA à 0 pour les composants
        // Garder le mode de paiement original
      };

      resultat.push(ligneComposant);
      console.log(`  ➕ Ajouté: ${vraiNom} (ID: ${vraiId}) - Qté: ${ligneComposant.quantite}`);
    }

    return resultat;
  }

  // Décomposer toutes les ventes d'un fichier avec cumul des quantités
  async decomposerVentes(ventes: VenteLigne[]): Promise<VenteLigne[]> {
    const resultat: VenteLigne[] = [];

    if (!ventes || !Array.isArray(ventes)) {
      console.warn('⚠️ Ventes invalides pour la décomposition:', ventes);
      return resultat;
    }

    console.log(`🔍 DEBUG: Début de la décomposition avec ${ventes.length} lignes`);
    
    // Charger les données unifiées pour obtenir les vraies catégories
    let produitsUnifies: any[] = [];
    try {
      const FileUnificationService = (await import('./FileUnificationService')).default;
      const unificationService = new FileUnificationService();
      
      // Essayer de charger depuis le fichier de référence d'abord
      const fichierReference = await unificationService.chargerDepuisFichierReference();
      if (fichierReference) {
        produitsUnifies = fichierReference.produits;
        console.log(`📊 ${produitsUnifies.length} produits unifiés chargés depuis le fichier de référence`);
      } else {
        // Sinon essayer localStorage
        const fichierSauvegarde = unificationService.chargerDepuisLocalStorage();
        if (fichierSauvegarde) {
          produitsUnifies = fichierSauvegarde.produits;
          console.log(`📊 ${produitsUnifies.length} produits unifiés chargés depuis localStorage`);
        } else {
          console.warn('⚠️ Aucun fichier unifié disponible, utilisation des IDs du JSON');
        }
        
        // Debug: afficher quelques exemples de produits unifiés
        if (produitsUnifies.length > 0) {
          console.log('🔍 Exemples de produits unifiés disponibles:');
          produitsUnifies.slice(0, 5).forEach((p: any, index: number) => {
            console.log(`  ${index + 1}. ${p.nom} (ID: ${p.id}, Catégorie: ${p.categorie || 'N/A'})`);
          });
          
          // Chercher spécifiquement les produits problématiques
          const sunsetProducts = produitsUnifies.filter((p: any) => p.nom.toLowerCase().includes('sunset'));
          const sacTrioProducts = produitsUnifies.filter((p: any) => p.nom.toLowerCase().includes('sac trio'));
          const seauProducts = produitsUnifies.filter((p: any) => p.nom.toLowerCase().includes('seau'));
          
          console.log('🔍 Produits SUNSET trouvés:', sunsetProducts.map((p: any) => `${p.nom} (ID: ${p.id})`));
          console.log('🔍 Produits SAC TRIO trouvés:', sacTrioProducts.map((p: any) => `${p.nom} (ID: ${p.id})`));
          console.log('🔍 Produits SEAU trouvés:', seauProducts.map((p: any) => `${p.nom} (ID: ${p.id})`));
        }
      }
    } catch (error) {
      console.warn('⚠️ Impossible de charger les données unifiées, utilisation des IDs du JSON:', error);
    }

    // ÉTAPE 1 : Traiter tous les produits SIMPLES (non composés)
    console.log('🔄 ÉTAPE 1 : Traitement des produits simples...');
    for (const ligne of ventes) {
      if (ligne) {
        // Vérifier si c'est un produit composé
        const composition = this.trouverCompositionParId(ligne.id);
        
        if (!composition) {
          // C'est un produit simple, on l'ajoute directement
          resultat.push(ligne);
          console.log(`  ➕ Produit simple ajouté: ${ligne.produit} (ID: ${ligne.id}) - Qté: ${ligne.quantite}`);
        } else {
          // C'est un produit composé, on l'ajoute aussi (il sera traité à l'étape 2)
          resultat.push(ligne);
          console.log(`  📦 Produit composé ajouté: ${ligne.produit} (ID: ${ligne.id}) - Qté: ${ligne.quantite}`);
        }
      }
    }
    
    console.log(`🔍 Après étape 1: ${resultat.length} lignes dans le résultat`);

    // ÉTAPE 2 : Traiter les produits COMPOSÉS et ajouter leurs composants
    console.log('🔄 ÉTAPE 2 : Traitement des produits composés...');
    let composantsAjoutes = 0;
    
    // Debug: Lister tous les produits composés trouvés
    const produitsComposes = ventes.filter(v => this.trouverCompositionParId(v.id));
    console.log(`🔍 Produits composés trouvés: ${produitsComposes.length}`, 
      produitsComposes.map(p => ({ id: p.id, nom: p.produit, quantite: p.quantite }))
    );
    
    for (const ligne of ventes) {
      if (ligne) {
        // Vérifier si c'est un produit composé
        const composition = this.trouverCompositionParId(ligne.id);
        
        if (composition) {
          console.log(`🔍 Décomposition de ${composition.nom} (ID: ${composition.id})`);
          
          // Obtenir les composants
          const composants = this.obtenirComposants(composition);
          console.log(`  📋 Composants trouvés: ${composants.length}`, composants.map(c => ({ nom: c.nom, quantite: c.quantite })));
          
          for (const composant of composants) {
            const quantiteComposant = ligne.quantite * composant.quantite;
            
            // Chercher le vrai ID du composant dans les données Excel
            let vraiId = composant.id;
            let vraiNom = composant.nom;
            let produitTrouve = null;
            
            if (produitsUnifies.length > 0) {
              // Recherche plus précise : chercher d'abord par nom exact, puis par inclusion
              let produitUnifie = produitsUnifies.find((p: any) => 
                p.nom.toLowerCase() === composant.nom.toLowerCase()
              );
              
              if (!produitUnifie) {
                // Si pas de correspondance exacte, chercher par inclusion mais être plus strict
                produitUnifie = produitsUnifies.find((p: any) => {
                  const nomComposant = composant.nom.toLowerCase();
                  const nomUnifie = p.nom.toLowerCase();
                  
                  // Éviter les confusions entre "VN TROPEZ" et "VN TROPEZ CLEAR LN"
                  if (nomComposant.includes('vn tropez') && nomUnifie.includes('vn tropez')) {
                    // Pour les VN TROPEZ, faire une correspondance exacte ou très proche
                    return nomComposant === nomUnifie || 
                           (nomComposant === 'vn tropez' && nomUnifie === 'vn tropez') ||
                           (nomComposant === 'vn tropez clear ln' && nomUnifie === 'vn tropez clear ln');
                  }
                  
                  // Recherche par mots-clés pour les produits spécifiques
                  if (nomComposant.includes('sunset') && nomUnifie.includes('sunset')) {
                    return true;
                  }
                  if (nomComposant.includes('sac trio') && nomUnifie.includes('sac trio')) {
                    return true;
                  }
                  if (nomComposant.includes('seau') && nomUnifie.includes('seau')) {
                    return true;
                  }
                  
                  // Pour les autres produits, utiliser l'inclusion normale
                  return nomComposant.includes(nomUnifie) || nomUnifie.includes(nomComposant);
                });
              }
              
              let produitTrouve = null;
              if (produitUnifie) {
                vraiId = produitUnifie.id;
                vraiNom = produitUnifie.nom;
                produitTrouve = produitUnifie;
                console.log(`  🔍 Correspondance trouvée: "${composant.nom}" → "${vraiNom}" (ID: ${vraiId})`);
              } else {
                console.warn(`  ⚠️ Aucune correspondance trouvée pour "${composant.nom}" dans les données unifiées`);
                
                // Debug détaillé pour comprendre le problème
                console.log(`  🔍 Recherche pour: "${composant.nom}"`);
                console.log(`  🔍 Produits unifiés disponibles (${produitsUnifies.length}):`, produitsUnifies.slice(0, 10).map((p: any) => `${p.nom} (ID: ${p.id})`));
                
                // Chercher spécifiquement les produits similaires
                const produitsSimilaires = produitsUnifies.filter((p: any) => 
                  p.nom.toLowerCase().includes(composant.nom.toLowerCase().split(' ')[0]) ||
                  composant.nom.toLowerCase().includes(p.nom.toLowerCase().split(' ')[0])
                );
                console.log(`  🔍 Produits similaires trouvés:`, produitsSimilaires.map((p: any) => `${p.nom} (ID: ${p.id})`));
                
                if (produitsUnifies.length === 0) {
                  console.warn('⚠️ ATTENTION: Fichier unifié vide ou incomplet !');
                  console.warn('⚠️ Il faut d\'abord aller dans l\'onglet "Unification Fichiers" et cliquer sur "Unifier les Fichiers"');
                }
                
                // Fallback: utiliser le nom du composant comme ID si pas de correspondance
                vraiId = composant.nom.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toUpperCase();
                vraiNom = composant.nom;
                console.log(`  🔄 Fallback utilisé: ID="${vraiId}", Nom="${vraiNom}"`);
              }
            }
            
            // Vérifier si ce composant existe déjà dans le résultat (produit simple vendu séparément)
            const composantExistant = resultat.find(v => v.id === vraiId);
            
            if (composantExistant) {
              // Le composant existe déjà (produit simple vendu séparément), on cumule les quantités
              const nouvelleQuantite = composantExistant.quantite + quantiteComposant;
              const nouveauMontant = composantExistant.prix_ttc * nouvelleQuantite;
              
              // Mettre à jour la ligne existante
              composantExistant.quantite = nouvelleQuantite;
              composantExistant.montantTTC = nouveauMontant;
              
              console.log(`  ✅ Composant cumulé: ${vraiNom} (ID: ${vraiId}) - Qté: ${nouvelleQuantite} (Prix: ${composantExistant.prix_ttc}€, Total: ${nouveauMontant}€)`);
            } else {
              // Le composant n'existe pas, on l'ajoute avec prix à 0 (car il vient d'un produit composé)
              const ligneComposant: VenteLigne = {
                ...ligne, // Copier toutes les propriétés
                id: vraiId,
                produit: vraiNom,
                quantite: quantiteComposant,
                prix_ttc: 0, // Prix à 0 pour les composants du produit composé
                prix_achat: 0, // Prix d'achat à 0 pour les composants
                montantTTC: 0, // Montant à 0 pour les composants
                tva: 0, // TVA à 0 pour les composants
                // Utiliser la catégorie du composant (priorité) ou du produit unifié
                categorie: composant.categorie || (produitTrouve && (produitTrouve as any).categorie ? (produitTrouve as any).categorie : 'Non classé')
              };
              
              resultat.push(ligneComposant);
              composantsAjoutes++;
              console.log(`  ➕ Composant ajouté: ${vraiNom} (ID: ${vraiId}) - Qté: ${ligneComposant.quantite} (Prix: 0€)`);
            }
          }
        }
      }
    }

    console.log(`✅ Décomposition terminée: ${ventes.length} lignes originales → ${resultat.length} lignes totales (+${composantsAjoutes} composants ajoutés)`);
    return resultat;
  }

  // Ajouter une nouvelle composition
  async ajouterComposition(nouvelleComposition: CompositionEdition): Promise<boolean> {
    try {
      // Vérifier que l'ID n'existe pas déjà
      if (this.trouverCompositionParId(nouvelleComposition.id)) {
        console.error('❌ ID déjà existant:', nouvelleComposition.id);
        return false;
      }

      // Convertir les composants en format string pour le stockage
      const compositionPourStockage: Composition = {
        ...nouvelleComposition,
        compositions: nouvelleComposition.composants.map(comp => `${comp.nom} (${comp.quantite})`)
      };

      // Ajouter la nouvelle composition
      this.compositions.push(compositionPourStockage);
      
      // Sauvegarder dans le fichier JSON
      await this.sauvegarderCompositions();
      
      console.log('✅ Nouvelle composition ajoutée:', nouvelleComposition.nom);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la composition:', error);
      return false;
    }
  }

  // Modifier une composition existante
  async modifierComposition(idOriginal: string, compositionModifiee: CompositionEdition): Promise<boolean> {
    try {
      const index = this.compositions.findIndex(c => c.id === idOriginal);
      if (index === -1) {
        console.error('❌ Composition non trouvée:', idOriginal);
        return false;
      }

      // Convertir les composants en format string pour le stockage
      const compositionPourStockage: Composition = {
        ...compositionModifiee,
        compositions: compositionModifiee.composants.map(comp => `${comp.nom} (${comp.quantite})`)
      };

      // Remplacer la composition
      this.compositions[index] = compositionPourStockage;
      
      // Sauvegarder dans le fichier JSON
      await this.sauvegarderCompositions();
      
      console.log('✅ Composition modifiée:', compositionModifiee.nom);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la modification de la composition:', error);
      return false;
    }
  }

  // Supprimer une composition
  async supprimerComposition(id: string): Promise<boolean> {
    try {
      const index = this.compositions.findIndex(c => c.id === id);
      if (index === -1) {
        console.error('❌ Composition non trouvée:', id);
        return false;
      }

      const compositionSupprimee = this.compositions[index];
      
      // Supprimer la composition
      this.compositions.splice(index, 1);
      
      // Sauvegarder dans le fichier JSON
      await this.sauvegarderCompositions();
      
      console.log('✅ Composition supprimée:', compositionSupprimee.nom);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la composition:', error);
      return false;
    }
  }

  // Sauvegarder les compositions dans le fichier JSON
  private async sauvegarderCompositions(): Promise<void> {
    try {
      const data: CompositionsData = { compositions: this.compositions };
      
      // Sauvegarder dans localStorage pour l'instant
      localStorage.setItem('compositions-unifiees', JSON.stringify(data, null, 2));
      
      console.log('💾 Sauvegarde des compositions dans localStorage...');
      
      // TODO: En production, implémenter la sauvegarde côté serveur
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  }
}

export default CompositionService;
