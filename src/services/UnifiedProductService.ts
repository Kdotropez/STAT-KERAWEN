import { VenteLigne } from '../types';

interface ProduitUnifie {
  id: string;
  nom: string;
  categorie: string;
  prix_vente_ttc: number;
  type: 'composition' | 'composant' | 'simple';
  nombre_composants?: number;
  composants?: Array<{
    id: string;
    nom: string;
    quantite: number;
    categorie: string;
    prix_vente_ttc: number;
  }>;
}

interface FichierUnifie {
  metadata: {
    date_creation: string;
    total_produits: number;
    compositions: number;
    composants: number;
    produits_simples: number;
    source: string;
  };
  produits: ProduitUnifie[];
}

export default class UnifiedProductService {
  private produitsUnifies: ProduitUnifie[] = [];
  private produitsMap: Map<string, ProduitUnifie> = new Map();

  async chargerProduitsUnifies(): Promise<void> {
    try {
      const response = await fetch('/produits-unifies-avec-prix.json');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const fichierUnifie: FichierUnifie = await response.json();
      this.produitsUnifies = fichierUnifie.produits;
      
      // Créer une map pour un accès rapide par ID
      this.produitsUnifies.forEach(produit => {
        this.produitsMap.set(produit.id, produit);
      });
      
      console.log(`📦 ${this.produitsUnifies.length} produits unifiés chargés`);
      console.log(`   - ${fichierUnifie.metadata.compositions} compositions`);
      console.log(`   - ${fichierUnifie.metadata.composants} composants`);
      console.log(`   - ${fichierUnifie.metadata.produits_simples} produits simples`);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des produits unifiés:', error);
      throw error;
    }
  }

  trouverProduitParId(id: string): ProduitUnifie | null {
    return this.produitsMap.get(id) || null;
  }

  estComposition(id: string): boolean {
    const produit = this.trouverProduitParId(id);
    return produit?.type === 'composition';
  }

  estComposant(id: string): boolean {
    const produit = this.trouverProduitParId(id);
    return produit?.type === 'composant';
  }

  estProduitSimple(id: string): boolean {
    const produit = this.trouverProduitParId(id);
    return produit?.type === 'simple';
  }

  decomposerVentes(ventes: VenteLigne[]): { ventes: VenteLigne[]; composantsAjoutes: number } {
    const ventesDecomposees: VenteLigne[] = [];
    let composantsAjoutes = 0;

    ventes.forEach(vente => {
      const id = vente.id || '';
      const produit = this.trouverProduitParId(id);

      if (!produit) {
        // Produit non trouvé, l'ajouter tel quel
        ventesDecomposees.push(vente);
        return;
      }

      if (produit.type === 'composition') {
        // Ajouter la composition avec son prix
        const compositionVente: VenteLigne = {
          ...vente,
          prix_ttc: produit.prix_vente_ttc,
          montantTTC: produit.prix_vente_ttc * vente.quantite
        };
        ventesDecomposees.push(compositionVente);

        // Ajouter les composants avec prix = 0
        if (produit.composants) {
          produit.composants.forEach(composant => {
            const composantVente: VenteLigne = {
              id: composant.id,
              nom: composant.nom,
              categorie: composant.categorie,
              prix_ttc: 0, // Prix à 0 pour éviter le double comptage
              montantTTC: 0,
              quantite: composant.quantite * vente.quantite,
              date: vente.date,
              boutique: vente.boutique,
                             client: vente.client,
               commande: vente.commande,
               operationId: vente.operationId,
               produit: composant.nom,
              retour: false
            };
            ventesDecomposees.push(composantVente);
            composantsAjoutes++;
          });
        }

        console.log(`🔍 Composition décomposée: ${produit.nom} (${produit.composants?.length || 0} composants)`);
      } else {
        // Produit simple ou composant, l'ajouter avec son prix défini
        const venteAvecPrix: VenteLigne = {
          ...vente,
          prix_ttc: produit.prix_vente_ttc,
          montantTTC: produit.prix_vente_ttc * vente.quantite
        };
        ventesDecomposees.push(venteAvecPrix);
      }
    });

    console.log(`📊 Décomposition terminée: ${ventesDecomposees.length} lignes (+${composantsAjoutes} composants ajoutés)`);
    
    return {
      ventes: ventesDecomposees,
      composantsAjoutes
    };
  }

  calculerStatistiquesCompositions(ventes: VenteLigne[]): {
    nombreCompositions: number;
    composantsAjoutes: number;
    montantCompositions: number;
  } {
    let nombreCompositions = 0;
    let composantsAjoutes = 0;
    let montantCompositions = 0;

    ventes.forEach(vente => {
      const id = vente.id || '';
      const produit = this.trouverProduitParId(id);

      if (produit?.type === 'composition') {
        nombreCompositions++;
        montantCompositions += vente.montantTTC;
      } else if (produit?.type === 'composant') {
        composantsAjoutes++;
      }
    });

    return {
      nombreCompositions,
      composantsAjoutes,
      montantCompositions
    };
  }

  getProduitsUnifies(): ProduitUnifie[] {
    return this.produitsUnifies;
  }
}
