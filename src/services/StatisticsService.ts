import { VenteLigne } from '../types';

export interface StatistiquesVentes {
  // Informations générales
  totalVentes: number;
  totalMontant: number;
  periodeDebut: string;
  periodeFin: string;
  
  // Ventes par produit
  ventesParProduit: Array<{
    id: string;
    nom: string;
    quantite: number;
    montant: number;
    prixMoyen: number;
    type: string;
    prix_ttc: number;
  }>;
  
  // Ventes par boutique
  ventesParBoutique: Array<{
    boutique: string;
    quantite: number;
    montant: number;
    nombreVentes: number;
  }>;
  
  // Ventes par catégorie
  ventesParCategorie: Array<{
    categorie: string;
    quantite: number;
    montant: number;
    nombreProduits: number;
  }>;
  
  // Ventes par jour
  ventesParJour: Array<{
    date: string;
    quantite: number;
    montant: number;
    nombreVentes: number;
  }>;
  
  // Top produits
  topProduits: Array<{
    id: string;
    nom: string;
    quantite: number;
    montant: number;
    rang: number;
  }>;
  
  // Compositions décomposées
  compositionsDecomposees: {
    nombreCompositions: number;
    composantsAjoutes: number;
    montantCompositions: number;
  };
  
  // Retours et remboursements
  retours: Array<{
    produit: string;
    id: string;
    quantite: number;
    montant: number;
    date: string;
  }>;
  
  // Métadonnées
  dateCalcul: string;
  version: string;
}

export class StatisticsService {
  private ventes: VenteLigne[] = [];
  private compositionService: any; // Assuming CompositionService is globally available or passed

  constructor(compositionService?: any) {
    this.compositionService = compositionService;
  }

  // Charger les ventes depuis localStorage (priorité aux données cumulatives)
  chargerVentes(): VenteLigne[] {
    try {
      // Essayer d'abord les données cumulatives mensuelles
      const ventesCumulatives = localStorage.getItem('ventes_mensuelles_cumulatives');
      if (ventesCumulatives) {
        this.ventes = JSON.parse(ventesCumulatives);
        console.log(`📊 ${this.ventes.length} ventes cumulatives chargées pour les statistiques`);
        return this.ventes;
      }
      
      // Fallback sur les ventes importées classiques
      const ventesSauvegardees = localStorage.getItem('ventes-importees');
      if (ventesSauvegardees) {
        this.ventes = JSON.parse(ventesSauvegardees);
        console.log(`📊 ${this.ventes.length} ventes classiques chargées pour les statistiques`);
        return this.ventes;
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des ventes:', error);
    }
    return [];
  }

  // Sauvegarder les ventes dans localStorage ET dans un fichier public
  async sauvegarderVentes(ventes: VenteLigne[]): Promise<void> {
    this.ventes = ventes;
    
    try {
      // Sauvegarde localStorage
      localStorage.setItem('ventes-importees', JSON.stringify(ventes, null, 2));
      console.log(`💾 ${ventes.length} ventes sauvegardées dans localStorage`);
      
      // Sauvegarde fichier public
      await this.exporterVentesFichier(ventes);
      console.log('💾 Fichier de ventes exporté dans /public/');
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  }

  // Exporter les ventes dans un fichier JSON dans le dossier public
  private async exporterVentesFichier(ventes: VenteLigne[]): Promise<void> {
    const date = new Date();
    const nomFichier = `ventes-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}.json`;
    
    const donneesExport = {
      ventes: ventes,
      metadata: {
        nombreVentes: ventes.length,
        dateExport: date.toISOString(),
        version: '1.0'
      }
    };

    // Créer un blob et télécharger
    const blob = new Blob([JSON.stringify(donneesExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`📁 Fichier exporté: ${nomFichier}`);
  }

  // Calculer toutes les statistiques
  async calculerStatistiques(ventes?: VenteLigne[]): Promise<StatistiquesVentes> {
    // Utiliser les ventes passées en paramètre ou charger depuis localStorage
    let ventesAAnalyser = ventes || this.chargerVentes();
    
    // Si des ventes sont passées en paramètre, elles sont déjà décomposées
    // Sinon, décomposer automatiquement les compositions avec le service unifié
    if (!ventes) {
      try {
        const UnifiedProductService = (await import('./UnifiedProductService')).default;
        const unifiedService = new UnifiedProductService();
        await unifiedService.chargerProduitsUnifies();
        
        const resultatDecomposition = unifiedService.decomposerVentes(ventesAAnalyser);
        ventesAAnalyser = resultatDecomposition.ventes;
        
        console.log(`🔍 Décomposition effectuée: ${ventesAAnalyser.length} lignes après décomposition (+${resultatDecomposition.composantsAjoutes} composants ajoutés)`);
      } catch (error) {
        console.warn('⚠️ Impossible de décomposer les compositions, utilisation des ventes originales:', error);
      }
    }
    
    console.log('🔍 DEBUG - Ventes reçues pour statistiques:', ventesAAnalyser.length);
    console.log('🔍 DEBUG - Exemples de ventes:');
    ventesAAnalyser.slice(0, 3).forEach((vente, index) => {
      console.log(`  ${index + 1}. ID: "${vente.id}", Nom: "${vente.nom}", Type: "${vente.type}"`);
    });

    const stats: StatistiquesVentes = {
      totalVentes: ventesAAnalyser.length,
      totalMontant: 0,
      periodeDebut: '',
      periodeFin: '',
      ventesParProduit: [],
      ventesParBoutique: [],
      ventesParCategorie: [],
      ventesParJour: [],
      topProduits: [],
      compositionsDecomposees: {
        nombreCompositions: 0,
        composantsAjoutes: 0,
        montantCompositions: 0
      },
      retours: [],
      dateCalcul: new Date().toISOString(),
      version: '1.0'
    };

    if (ventesAAnalyser.length === 0) {
      return stats;
    }

    // Calculer le montant total et les périodes
    stats.totalMontant = ventesAAnalyser.reduce((total, vente) => total + vente.montantTTC, 0);
    
    // Debug: vérifier les retours (via colonne Retour ou montants négatifs)
    const retours = ventesAAnalyser.filter(vente => vente.retour || vente.montantTTC < 0);
    if (retours.length > 0) {
      const totalRetours = retours.reduce((total, vente) => total + vente.montantTTC, 0);
      console.log(`🔴 Retours détectés: ${retours.length} lignes, total: ${totalRetours}€`);
      retours.forEach(vente => {
        console.log(`  - ${vente.produit}: ${vente.montantTTC}€ (qté: ${vente.quantite}, retour: ${vente.retour})`);
      });
    }
    
    // Debug: vérifier les services inclus dans le total
    const services = ventesAAnalyser.filter(vente => {
      const nomLower = vente.produit.toLowerCase();
      return nomLower.includes('frais de port') || nomLower.includes('livraison') || nomLower.includes('transport') || nomLower.includes('service');
    });
    
    if (services.length > 0) {
      const totalServices = services.reduce((total, vente) => total + vente.montantTTC, 0);
      console.log(`💰 Services inclus dans le CA total: ${services.length} services, montant: ${totalServices}€`);
      services.forEach(service => {
        console.log(`  - ${service.produit}: ${service.montantTTC}€`);
      });
    }
    
    const dates = ventesAAnalyser.map(v => new Date(v.date)).sort((a, b) => a.getTime() - b.getTime());
    stats.periodeDebut = dates[0].toISOString().split('T')[0];
    stats.periodeFin = dates[dates.length - 1].toISOString().split('T')[0];

    // Ventes par produit (avec distinction prix à 0 vs prix > 0)
    const ventesParProduitMap = new Map<string, { quantite: number; montant: number; nom: string; prix_ttc: number }>();
    ventesAAnalyser.forEach(vente => {
      // Gestion des articles sans ID - convertir en string et vérifier
      const idString = String(vente.id || '');
      const produitId = idString && idString !== 'undefined' && idString !== 'null' && idString.trim() !== '' 
        ? idString 
        : `SANS_ID_${vente.produit.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      // Créer une clé unique basée sur l'ID et le prix pour distinguer les types
      const key = `${produitId}_${vente.prix_ttc === 0 ? 'composant' : 'simple'}`;
      const existant = ventesParProduitMap.get(key);
      if (existant) {
        existant.quantite += vente.quantite;
        existant.montant += vente.montantTTC;
      } else {
        ventesParProduitMap.set(key, {
          quantite: vente.quantite,
          montant: vente.montantTTC,
          nom: vente.produit,
          prix_ttc: vente.prix_ttc
        });
      }
    });

    stats.ventesParProduit = Array.from(ventesParProduitMap.entries())
      .map(([key, data]) => {
        const [id, type] = key.split('_');
        const produit = {
          id: id.startsWith('SANS_ID_') ? 'Sans ID' : id,
          nom: data.nom,
          quantite: data.quantite,
          montant: data.montant,
          prixMoyen: data.montant / data.quantite,
          type: type === 'composant' ? 'Composant' : (id.startsWith('SANS_ID_') ? 'À classer' : 'Simple'),
          prix_ttc: data.prix_ttc
        };
        
        // Debug pour VN TROPEZ
        if (id === '5851') {
          console.log('🔍 Debug StatisticsService - VN TROPEZ:', {
            key,
            type,
            produit
          });
        }
        
        // Debug pour les services
        if (id.startsWith('SERVICE_') || data.nom.toLowerCase().includes('frais de port')) {
          console.log('🔍 Debug StatisticsService - Service:', {
            key,
            type,
            produit
          });
        }
        
        return produit;
      })
      .filter(produit => produit.montant > 0) // Filtrer les produits avec montant = 0
      .sort((a, b) => b.montant - a.montant);

    // Ventes par boutique - EXCLURE les composants (prix à 0)
    const ventesParBoutiqueMap = new Map<string, { quantite: number; montant: number; nombreVentes: number }>();
    ventesAAnalyser.forEach(vente => {
      // Exclure les composants (prix à 0) des statistiques par boutique
      if (vente.prix_ttc === 0) {
        return; // Ignorer les composants
      }
      
      const boutique = vente.boutique;
      const existant = ventesParBoutiqueMap.get(boutique);
      if (existant) {
        existant.quantite += vente.quantite;
        existant.montant += vente.montantTTC;
        existant.nombreVentes++;
      } else {
        ventesParBoutiqueMap.set(boutique, {
          quantite: vente.quantite,
          montant: vente.montantTTC,
          nombreVentes: 1
        });
      }
    });

    stats.ventesParBoutique = Array.from(ventesParBoutiqueMap.entries()).map(([boutique, data]) => ({
      boutique,
      quantite: data.quantite,
      montant: data.montant,
      nombreVentes: data.nombreVentes
    })).sort((a, b) => b.montant - a.montant);

    // Ventes par catégorie - INCLURE tous les produits (composants décomposés + produits simples + services)
    const ventesParCategorieMap = new Map<string, { quantite: number; montant: number; nombreProduits: Set<string> }>();
    ventesAAnalyser.forEach(vente => {
      // Inclure TOUS les produits (composants décomposés + produits simples + services)
      let categorie = vente.categorie;
      
      // Gestion des articles sans ID ou avec ID invalide - convertir en string
      const idString = String(vente.id || '');
      if (!idString || idString === 'undefined' || idString === 'null' || idString.trim() === '') {
        // Vérifier si c'est un service
        const nomLower = vente.produit.toLowerCase();
        if (nomLower.includes('frais de port') || nomLower.includes('livraison') || nomLower.includes('transport') || nomLower.includes('service')) {
          categorie = 'SERVICES ET FRAIS';
          console.log(`🏷️ Service détecté: "${vente.produit}" - placé dans "SERVICES ET FRAIS"`);
        } else {
          categorie = 'À classer';
          console.log(`⚠️ Article sans ID détecté: "${vente.produit}" - placé dans "À classer"`);
        }
      } else if (!categorie) {
        categorie = 'Non classé';
      }
      
      const existant = ventesParCategorieMap.get(categorie);
      if (existant) {
        existant.quantite += vente.quantite;
        existant.montant += vente.montantTTC;
        // Compter TOUS les produits (même les composants avec prix à 0)
        existant.nombreProduits.add(String(vente.id || `sans-id-${vente.produit}`));
      } else {
        ventesParCategorieMap.set(categorie, {
          quantite: vente.quantite,
          montant: vente.montantTTC,
          nombreProduits: new Set([String(vente.id || `sans-id-${vente.produit}`)])
        });
      }
    });

    stats.ventesParCategorie = Array.from(ventesParCategorieMap.entries()).map(([categorie, data]) => ({
      categorie,
      quantite: data.quantite,
      montant: data.montant,
      nombreProduits: data.nombreProduits.size
    })).sort((a, b) => b.montant - a.montant);

    // Ventes par jour - EXCLURE les composants (prix à 0)
    const ventesParJourMap = new Map<string, { quantite: number; montant: number; nombreVentes: number }>();
    ventesAAnalyser.forEach(vente => {
      // Exclure les composants (prix à 0) des statistiques par jour
      if (vente.prix_ttc === 0) {
        return; // Ignorer les composants
      }
      
      const date = new Date(vente.date).toISOString().split('T')[0];
      const existant = ventesParJourMap.get(date);
      if (existant) {
        existant.quantite += vente.quantite;
        existant.montant += vente.montantTTC;
        existant.nombreVentes++;
      } else {
        ventesParJourMap.set(date, {
          quantite: vente.quantite,
          montant: vente.montantTTC,
          nombreVentes: 1
        });
      }
    });

    stats.ventesParJour = Array.from(ventesParJourMap.entries()).map(([date, data]) => ({
      date,
      quantite: data.quantite,
      montant: data.montant,
      nombreVentes: data.nombreVentes
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Top produits (top 10) - par quantité pour voir les produits simples
    stats.topProduits = stats.ventesParProduit
      .sort((a, b) => b.quantite - a.quantite) // Trier par quantité décroissante
      .slice(0, 10)
      .map((produit, index) => ({
        ...produit,
        rang: index + 1
      }));

    // Compositions décomposées
    // Utiliser le service unifié pour des statistiques précises
    try {
      const UnifiedProductService = (await import('./UnifiedProductService')).default;
      const unifiedService = new UnifiedProductService();
      await unifiedService.chargerProduitsUnifies();
      
      // Calculer les statistiques avec le service unifié
      const statsCompositions = unifiedService.calculerStatistiquesCompositions(ventesAAnalyser);
      
      stats.compositionsDecomposees = {
        nombreCompositions: statsCompositions.nombreCompositions,
        composantsAjoutes: statsCompositions.composantsAjoutes,
        montantCompositions: statsCompositions.montantCompositions
      };
      
      console.log(`🔍 Compositions décomposées: ${statsCompositions.nombreCompositions} compositions, ${statsCompositions.composantsAjoutes} composants ajoutés`);
      
    } catch (error) {
      console.warn('⚠️ Impossible de charger les produits unifiés pour les statistiques:', error);
      // Fallback sur l'ancienne logique
      const ventesAvecPrix = ventesAAnalyser.filter(v => v.prix_ttc > 0);
      const ventesSansPrix = ventesAAnalyser.filter(v => v.prix_ttc === 0);
      
      stats.compositionsDecomposees = {
        nombreCompositions: ventesAvecPrix.length,
        composantsAjoutes: ventesSansPrix.length,
        montantCompositions: ventesAvecPrix.reduce((total, v) => total + v.montantTTC, 0)
      };
    }

    // Retours et remboursements
    stats.retours = ventesAAnalyser
      .filter(vente => vente.retour || vente.montantTTC < 0 || vente.quantite < 0)
      .map(vente => ({
        produit: vente.produit,
        id: String(vente.id || 'Sans ID'),
        quantite: vente.quantite,
        montant: vente.montantTTC,
        date: new Date(vente.date).toISOString().split('T')[0]
      }))
      .sort((a, b) => b.montant - a.montant); // Trier par montant décroissant (plus négatif en premier)

    return stats;
  }

  // Obtenir les ventes actuelles
  getVentes(): VenteLigne[] {
    return this.ventes;
  }

  // Vider les ventes
  viderVentes(): void {
    this.ventes = [];
    localStorage.removeItem('ventes-importees');
    console.log('🗑️ Ventes supprimées');
  }
}

export default StatisticsService;
