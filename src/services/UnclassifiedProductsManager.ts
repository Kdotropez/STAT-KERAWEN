import { VenteLigne } from '../types';

export interface UnclassifiedProduct {
  nom: string;
  quantite: number;
  montant: number;
  date: string | Date;
  boutique: string;
  categorieSuggeree?: string;
  idPropose?: string;
}

export interface ClassificationRule {
  nomPattern: string;
  categorie: string;
  id?: string;
  description?: string;
}

export class UnclassifiedProductsManager {
  private classificationRules: ClassificationRule[] = [];
  private unclassifiedProducts: UnclassifiedProduct[] = [];

  constructor() {
    this.loadClassificationRules();
  }

  /**
   * Charge les règles de classification depuis localStorage
   */
  private loadClassificationRules(): void {
    try {
      const rules = localStorage.getItem('classification-rules');
      if (rules) {
        this.classificationRules = JSON.parse(rules);
        console.log(`📋 ${this.classificationRules.length} règles de classification chargées`);
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors du chargement des règles de classification:', error);
      this.classificationRules = [];
    }
  }

  /**
   * Sauvegarde les règles de classification dans localStorage
   */
  private saveClassificationRules(): void {
    try {
      localStorage.setItem('classification-rules', JSON.stringify(this.classificationRules, null, 2));
      console.log('💾 Règles de classification sauvegardées');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des règles:', error);
    }
  }

  /**
   * Ajoute une nouvelle règle de classification
   */
  addClassificationRule(rule: ClassificationRule): void {
    this.classificationRules.push(rule);
    this.saveClassificationRules();
    console.log(`✅ Règle ajoutée: "${rule.nomPattern}" → ${rule.categorie}`);
  }

  /**
   * Supprime une règle de classification
   */
  removeClassificationRule(index: number): void {
    if (index >= 0 && index < this.classificationRules.length) {
      const rule = this.classificationRules.splice(index, 1)[0];
      this.saveClassificationRules();
      console.log(`🗑️ Règle supprimée: "${rule.nomPattern}"`);
    }
  }

  /**
   * Obtient toutes les règles de classification
   */
  getClassificationRules(): ClassificationRule[] {
    return [...this.classificationRules];
  }

  /**
   * Analyse les ventes et identifie les produits sans ID
   */
  analyzeUnclassifiedProducts(ventes: VenteLigne[]): UnclassifiedProduct[] {
    this.unclassifiedProducts = [];

    ventes.forEach(vente => {
      // Vérifier si le produit a un ID valide OU s'il s'agit d'un service
      if (!this.hasValidId(vente.id) || this.isServiceProduct(vente.produit)) {
        const unclassifiedProduct: UnclassifiedProduct = {
          nom: vente.produit,
          quantite: vente.quantite,
          montant: vente.montantTTC,
          date: typeof vente.date === 'string' ? vente.date : vente.date.toISOString().split('T')[0],
          boutique: vente.boutique,
          categorieSuggeree: this.suggestCategory(vente.produit),
          idPropose: this.isServiceProduct(vente.produit) ? `SERVICE_${this.simpleHash(vente.produit)}` : this.suggestId(vente.produit)
        };

        this.unclassifiedProducts.push(unclassifiedProduct);
      }
    });

    console.log(`🔍 ${this.unclassifiedProducts.length} produits/services sans ID identifiés`);
    return [...this.unclassifiedProducts];
  }

  /**
   * Vérifie si un ID est valide
   */
  private hasValidId(id: string): boolean {
    return Boolean(id && 
           id !== 'undefined' && 
           id !== 'null' && 
           id.trim() !== '' && 
           !isNaN(Number(id)) && 
           Number(id) > 0);
  }

  /**
   * Vérifie si un produit doit être traité comme un service (frais de port, etc.)
   */
  private isServiceProduct(nomProduit: string): boolean {
    const nomLower = nomProduit.toLowerCase();
    return nomLower.includes('frais de port') || 
           nomLower.includes('livraison') || 
           nomLower.includes('transport') ||
           nomLower.includes('service');
  }

  /**
   * Suggère une catégorie basée sur le nom du produit
   */
  private suggestCategory(nomProduit: string): string {
    const nomLower = nomProduit.toLowerCase();
    
    // Services et frais
    if (this.isServiceProduct(nomProduit)) return 'SERVICES ET FRAIS';
    
    // Règles de suggestion basées sur le nom
    if (nomLower.includes('verre') || nomLower.includes('glass')) return 'VERRE';
    if (nomLower.includes('assiette') || nomLower.includes('plate')) return 'ASSIETTE';
    if (nomLower.includes('vasque') || nomLower.includes('bowl')) return 'VASQUE ET SEAU';
    if (nomLower.includes('seau') || nomLower.includes('bucket')) return 'VASQUE ET SEAU';
    if (nomLower.includes('ice') || nomLower.includes('glace')) return 'ICE TROPEZ';
    if (nomLower.includes('carton') || nomLower.includes('box')) return 'EMBALLAGE';
    if (nomLower.includes('sac') || nomLower.includes('bag')) return 'EMBALLAGE';
    if (nomLower.includes('vn') || nomLower.includes('vin')) return 'VERRE';
    if (nomLower.includes('bk') || nomLower.includes('bock')) return 'VERRE';
    if (nomLower.includes('sunset')) return 'VERRE';
    if (nomLower.includes('flute')) return 'VERRE';
    if (nomLower.includes('sobag')) return 'VASQUE ET SEAU';
    if (nomLower.includes('air beach')) return 'VERRE';
    
    return 'À classer';
  }

  /**
   * Suggère un ID basé sur le nom du produit
   */
  private suggestId(nomProduit: string): string {
    // Générer un ID temporaire basé sur le nom
    const nomClean = nomProduit.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const hash = this.simpleHash(nomClean);
    return `TEMP_${hash}`;
  }

  /**
   * Hash simple pour générer des IDs temporaires
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString().slice(0, 6);
  }

  /**
   * Applique les règles de classification aux ventes
   */
  applyClassificationRules(ventes: VenteLigne[]): VenteLigne[] {
    const ventesModifiees = ventes.map(vente => {
      // Si le produit a déjà un ID valide ET n'est pas un service, le laisser tel quel
      if (this.hasValidId(vente.id) && !this.isServiceProduct(vente.produit)) {
        return vente;
      }

      // Chercher une règle qui correspond
      const rule = this.classificationRules.find(rule => 
        vente.produit.toLowerCase().includes(rule.nomPattern.toLowerCase())
      );

      if (rule) {
        console.log(`🏷️ Règle appliquée: "${vente.produit}" → ${rule.categorie} (ID: ${rule.id || 'auto'})`);
        return {
          ...vente,
          id: rule.id || (this.isServiceProduct(vente.produit) ? `SERVICE_${this.simpleHash(vente.produit)}` : this.suggestId(vente.produit)),
          categorie: rule.categorie
        };
      }

      // Si c'est un service sans règle, appliquer la catégorie par défaut
      if (this.isServiceProduct(vente.produit)) {
        console.log(`🏷️ Service détecté: "${vente.produit}" → SERVICES ET FRAIS`);
        return {
          ...vente,
          id: `SERVICE_${this.simpleHash(vente.produit)}`,
          categorie: 'SERVICES ET FRAIS'
        };
      }

      return vente;
    });

    return ventesModifiees;
  }

  /**
   * Obtient les statistiques des produits non classés
   */
  getUnclassifiedStats(): {
    nombreProduits: number;
    totalQuantite: number;
    totalMontant: number;
    categoriesSuggerees: { [key: string]: number };
  } {
    const stats = {
      nombreProduits: this.unclassifiedProducts.length,
      totalQuantite: 0,
      totalMontant: 0,
      categoriesSuggerees: {} as { [key: string]: number }
    };

    this.unclassifiedProducts.forEach(produit => {
      stats.totalQuantite += produit.quantite;
      stats.totalMontant += produit.montant;
      
      const categorie = produit.categorieSuggeree || 'À classer';
      stats.categoriesSuggerees[categorie] = (stats.categoriesSuggerees[categorie] || 0) + 1;
    });

    return stats;
  }

  /**
   * Exporte les produits non classés en JSON
   */
  exportUnclassifiedProducts(): string {
    const exportData = {
      produits: this.unclassifiedProducts,
      stats: this.getUnclassifiedStats(),
      regles: this.classificationRules,
      dateExport: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importe des règles de classification depuis un fichier JSON
   */
  importClassificationRules(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data.regles)) {
        this.classificationRules = data.regles;
        this.saveClassificationRules();
        console.log(`📥 ${this.classificationRules.length} règles importées`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'import des règles:', error);
      throw new Error('Format de fichier invalide');
    }
  }

  /**
   * Génère des règles de classification automatiques basées sur les produits non classés
   */
  generateAutoRules(): ClassificationRule[] {
    const autoRules: ClassificationRule[] = [];
    const categoriesCount: { [key: string]: number } = {};

    this.unclassifiedProducts.forEach(produit => {
      const categorie = produit.categorieSuggeree || 'À classer';
      categoriesCount[categorie] = (categoriesCount[categorie] || 0) + 1;
    });

    // Créer des règles pour les catégories les plus fréquentes
    Object.entries(categoriesCount)
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a)
      .forEach(([categorie, count]) => {
        autoRules.push({
          nomPattern: `*${categorie.toLowerCase()}*`,
          categorie,
          description: `Règle auto-générée (${count} produits)`
        });
      });

    return autoRules;
  }
}

export default UnclassifiedProductsManager;
