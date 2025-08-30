import { VenteLigne } from '../../types';

export interface ArticleReference {
  id: string;
  nom: string;
  categorie: string;
  fournisseur?: string;
  fabricant?: string;
  prixAchat?: number;
  specifications?: string;
}

export interface DeclinaisonReference {
  id: string;
  nom: string;
  produitId: string;
  variante?: string;
}

export class ReferenceService {
  private articles: Map<string, ArticleReference> = new Map();
  private declinaisons: Map<string, DeclinaisonReference> = new Map();

  constructor() {
    this.chargerReferences();
  }

  /**
   * Charge les fichiers de référence (produits et déclinaisons)
   */
  private async chargerReferences() {
    try {
      // Charger le fichier de référence des produits
      const responseProduits = await fetch('/id produits pour mappage.xls');
      if (responseProduits.ok) {
        // TODO: Parser le fichier Excel des produits
        console.log('Fichier de référence produits chargé');
      }

      // Charger le fichier de référence des déclinaisons
      const responseDeclinaisons = await fetch('/id declinaison pour mappage.xls');
      if (responseDeclinaisons.ok) {
        // TODO: Parser le fichier Excel des déclinaisons
        console.log('Fichier de référence déclinaisons chargé');
      }
    } catch (error) {
      console.warn('Impossible de charger les fichiers de référence:', error);
    }
  }

  /**
   * Enrichit une vente avec toutes les informations de l'article via l'ID
   */
  enrichirVente(vente: VenteLigne): VenteLigne {
    const article = this.articles.get(vente.id);
    
    if (article) {
      return {
        ...vente,
        produit: article.nom,
        categorie: article.categorie,
        fournisseur: article.fournisseur,
        fabricant: article.fabricant,
        prixAchat: article.prixAchat,
        specifications: article.specifications
      };
    }

    // Si l'article n'est pas trouvé, essayer avec les déclinaisons
    const declinaison = this.declinaisons.get(vente.id);
    if (declinaison) {
      const articleParent = this.articles.get(declinaison.produitId);
      if (articleParent) {
        return {
          ...vente,
          produit: `${articleParent.nom} - ${declinaison.nom}`,
          categorie: articleParent.categorie,
          fournisseur: articleParent.fournisseur,
          fabricant: articleParent.fabricant,
          prixAchat: articleParent.prixAchat,
          specifications: articleParent.specifications
        };
      }
    }

    // Si rien n'est trouvé, retourner la vente telle quelle
    console.warn(`Aucune référence trouvée pour l'ID: ${vente.id}`);
    return vente;
  }

  /**
   * Enrichit une liste de ventes
   */
  enrichirVentes(ventes: VenteLigne[]): VenteLigne[] {
    return ventes.map(vente => this.enrichirVente(vente));
  }

  /**
   * Obtient les statistiques par catégorie
   */
  obtenirStatistiquesParCategorie(ventes: VenteLigne[]) {
    const stats = new Map<string, {
      montant: number;
      quantite: number;
      marge: number;
      nombreVentes: number;
    }>();

    ventes.forEach(vente => {
      const categorie = vente.categorie || 'Non catégorisé';
      const existant = stats.get(categorie) || {
        montant: 0,
        quantite: 0,
        marge: 0,
        nombreVentes: 0
      };

      existant.montant += vente.montantTTC;
      existant.quantite += vente.quantite;
      existant.marge += vente.marge || 0;
      existant.nombreVentes += 1;

      stats.set(categorie, existant);
    });

    return Array.from(stats.entries()).map(([categorie, stats]) => ({
      categorie,
      ...stats
    }));
  }

  /**
   * Obtient les statistiques par fournisseur
   */
  obtenirStatistiquesParFournisseur(ventes: VenteLigne[]) {
    const stats = new Map<string, {
      montant: number;
      quantite: number;
      marge: number;
      nombreVentes: number;
    }>();

    ventes.forEach(vente => {
      const fournisseur = vente.fournisseur || 'Non spécifié';
      const existant = stats.get(fournisseur) || {
        montant: 0,
        quantite: 0,
        marge: 0,
        nombreVentes: 0
      };

      existant.montant += vente.montantTTC;
      existant.quantite += vente.quantite;
      existant.marge += vente.marge || 0;
      existant.nombreVentes += 1;

      stats.set(fournisseur, existant);
    });

    return Array.from(stats.entries()).map(([fournisseur, stats]) => ({
      fournisseur,
      ...stats
    }));
  }

  /**
   * Recherche un article par ID
   */
  rechercherArticle(id: string): ArticleReference | null {
    return this.articles.get(id) || null;
  }

  /**
   * Obtient la liste de tous les articles
   */
  obtenirTousLesArticles(): ArticleReference[] {
    return Array.from(this.articles.values());
  }

  /**
   * Obtient les articles par catégorie
   */
  obtenirArticlesParCategorie(categorie: string): ArticleReference[] {
    return Array.from(this.articles.values()).filter(
      article => article.categorie === categorie
    );
  }
}


