import { VenteLigne } from '../types';
import { CompositionService } from './CompositionService';
import { JsonVenteData } from './ExcelToJsonService';

export interface ImportResult {
  success: boolean;
  ventesOriginales: VenteLigne[];
  ventesDecomposees: VenteLigne[];
  stats: {
    lignesImportees: number;
    lignesTraitees: number;
    compositionsTrouvees: number;
    composantsAjoutes: number;
    erreurs: string[];
  } | null;
  message: string;
}

export class JsonImportService {
  private compositionService: CompositionService;

  constructor() {
    this.compositionService = new CompositionService();
  }

  /**
   * Importe un fichier JSON de ventes décomposées (format VenteLigne[])
   */
  async importVentesJsonFile(jsonContent: string): Promise<ImportResult> {
    try {
      console.log('🔄 Début de l\'import fichier ventes JSON...');
      
      const jsonData = JSON.parse(jsonContent);
      console.log('🔍 Structure du fichier ventes:', {
        hasVentes: !!jsonData.ventes,
        ventesType: typeof jsonData.ventes,
        isArray: Array.isArray(jsonData.ventes),
        ventesLength: jsonData.ventes?.length,
        hasMetadata: !!jsonData.metadata
      });

      // Vérifier si c'est un fichier de ventes décomposées
      if (jsonData.ventes && Array.isArray(jsonData.ventes)) {
        console.log(`📊 ${jsonData.ventes.length} ventes trouvées dans le fichier`);
        
        // Les ventes sont déjà décomposées, pas besoin de les redécomposer
        const ventesDecomposees = jsonData.ventes;
        
        // Analyser les ventes pour détecter les compositions
        const ventesAnalysees = this.analyserCompositions(ventesDecomposees);
        
        // Calculer les statistiques
        const stats = {
          lignesImportees: ventesAnalysees.length,
          lignesTraitees: ventesAnalysees.length,
          compositionsTrouvees: ventesAnalysees.filter((v: VenteLigne) => v.type === 'Composé').length,
          composantsAjoutes: ventesAnalysees.filter((v: VenteLigne) => v.type === 'Cumulé').length,
          erreurs: []
        };

        return {
          success: true,
          ventesOriginales: ventesAnalysees, // Même données car déjà décomposées
          ventesDecomposees: ventesAnalysees,
          stats,
          message: `Import réussi : ${ventesAnalysees.length} ventes décomposées importées`
        };

        return {
          success: true,
          ventesOriginales: ventesDecomposees, // Même données car déjà décomposées
          ventesDecomposees,
          stats,
          message: `Import réussi : ${ventesDecomposees.length} ventes décomposées importées`
        };
      }

      // Si ce n'est pas un fichier de ventes, essayer le format Excel converti
      return await this.importJsonData(jsonData as JsonVenteData);

    } catch (error) {
      console.error('❌ Erreur lors de l\'import fichier ventes JSON:', error);
      return {
        success: false,
        ventesOriginales: [],
        ventesDecomposees: [],
        stats: null,
        message: `Erreur d'import : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  async importJsonData(jsonData: JsonVenteData): Promise<ImportResult> {
    try {
      console.log('🔄 Début de l\'import JSON Excel converti...');
      
      // Convertir JSON en VenteLignes
      const ventesOriginales = this.convertJsonToVenteLignes(jsonData);
      console.log(`📊 ${ventesOriginales.length} ventes originales importées`);

      // DÉCOMPOSER les ventes avec le CompositionService
      console.log('🔄 Décomposition des ventes composées...');
      const resultatDecomposition = await this.compositionService.decomposerVentes(ventesOriginales);
      const ventesDecomposees = resultatDecomposition.ventes;
      console.log(`📊 ${ventesDecomposees.length} ventes après décomposition (+${resultatDecomposition.composantsAjoutes} composants ajoutés)`);

      // Calculer les statistiques sur les ventes DÉCOMPOSÉES
      const stats = this.calculerStatistiques(ventesOriginales, ventesDecomposees);

      return {
        success: true,
        ventesOriginales,
        ventesDecomposees,
        stats,
        message: `Import réussi : ${ventesOriginales.length} ventes originales → ${ventesDecomposees.length} ventes après décomposition (+${resultatDecomposition.composantsAjoutes} composants ajoutés)`
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'import JSON:', error);
      return {
        success: false,
        ventesOriginales: [],
        ventesDecomposees: [],
        stats: null,
        message: `Erreur d'import : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Convertit les données JSON en VenteLigne
   */
  private convertJsonToVenteLignes(jsonData: JsonVenteData): VenteLigne[] {
    const ventes: VenteLigne[] = [];

    // Debug: afficher les colonnes disponibles
    if (jsonData.data.length > 0) {
      console.log('🔍 Colonnes disponibles dans le JSON:', Object.keys(jsonData.data[0]));
    }

    for (const row of jsonData.data) {
      try {
        // Mapping des colonnes Excel vers les propriétés VenteLigne
        const vente: VenteLigne = {
          date: this.parseDate(row.Date || row['Date']),
          nom: row.Produit || row.produit || '',
          produit: row.Produit || row.produit || '',
          id: row.Id || row.ID || row.id || '',
          quantite: this.parseNumber(row.Qté || row['Qté'] || row.quantite || row.quantity) || 0,
          boutique: row.Boutique || row.boutique || '',
          montantTTC: this.parseNumber(row['Montant TTC'] || row.montantTTC || row.montant, true) || 0, // Montant en centimes
          prix_ttc: this.parseNumber(row['Prix unitaire TTC'] || row['Prix TTC'] || row.prix_ttc, true) || 0, // Prix en centimes
          prix_achat: this.parseNumber(row['Prix d\'achat'] || row['Prix Achat'] || row.prix_achat, true) || 0, // Prix en centimes
          tva: this.parseNumber(row.TVA || row.tva, true) || 0, // TVA en centimes
          categorie: row['Cat. défaut'] || row['Cat. racine'] || row.Catégorie || row.categorie || '',
          fournisseur: row.Fournisseur || row.fournisseur || '',
          fabricant: row.Fabriquant || row.Fabricant || row.fabricant || '',
          caissier: row.Caissier || row.caissier || '',
          commande: row.Commande || row.commande || '',
          numeroOperation: row['#Op'] || row['Op'] || row.operation || '',
          retour: this.parseBoolean(row.Retour || row.retour),
          client: row.Client || row.client || '',
          paiement: row.Paiement || row.paiement || '',
          ean: row.EAN || row.Ean || row.ean || '',
          reference: row.Référence || row['Référence'] || row.reference || '',
          declinaison: row.Déclinaison || row.declinaison || '',
          remiseTTC: this.parseNumber(row['Remise TTC'] || row.remiseTTC, true) || 0, // Remise en centimes
          type: 'Original' // Par défaut, sera modifié par la décomposition
        };

        // Vérifier que les données essentielles sont présentes
        // Permettre les services sans ID (frais de port, etc.)
        const isService = vente.produit.toLowerCase().includes('frais de port') || 
                         vente.produit.toLowerCase().includes('livraison') || 
                         vente.produit.toLowerCase().includes('transport') || 
                         vente.produit.toLowerCase().includes('service');
        
        // Debug des lignes problématiques
        if (!vente.id && !isService) {
          console.log(`🔍 Ligne sans ID non-service:`, {
            produit: vente.produit,
            id: vente.id,
            quantite: vente.quantite,
            montant: vente.montantTTC,
            isService
          });
        }
        
        if (isService) {
          console.log(`🔍 Service détecté:`, {
            produit: vente.produit,
            id: vente.id,
            quantite: vente.quantite,
            montant: vente.montantTTC,
            isService
          });
        }
        
        // Détecter les retours via la colonne "Retour" ou les montants négatifs
        if (vente.retour || vente.montantTTC < 0 || vente.quantite < 0) {
          console.log(`🔴 Retour détecté:`, {
            produit: vente.produit,
            id: vente.id,
            quantite: vente.quantite,
            montant: vente.montantTTC,
            retour: vente.retour,
            type: vente.retour ? 'Colonne Retour' : (vente.montantTTC < 0 ? 'Montant négatif' : 'Quantité négative')
          });
        }
        
        // Accepter les montants négatifs (retours/remboursements) et les services
        if ((vente.id && vente.produit && vente.quantite !== 0) || (isService && vente.produit && vente.quantite >= 0)) {
          // Vérifier la cohérence du montant TTC
          const montantCalcule = vente.quantite * vente.prix_ttc;
          const montantDeclare = vente.montantTTC;
          
          if (Math.abs(montantCalcule - montantDeclare) > 0.01) {
            console.warn(`⚠️ Incohérence montant TTC pour ${vente.produit}: calculé=${montantCalcule}, déclaré=${montantDeclare}`);
          }
          
          // Si c'est un service sans ID, assigner un ID temporaire
          if (isService && !vente.id) {
            vente.id = `SERVICE_${vente.produit.replace(/[^a-zA-Z0-9]/g, '_')}`;
            console.log(`🏷️ Service sans ID traité: "${vente.produit}" → ID: ${vente.id}`);
          }
          
          ventes.push(vente);
        } else {
          console.warn(`⚠️ Ligne ignorée - données manquantes:`, row);
        }

      } catch (error) {
        console.error(`❌ Erreur lors de la conversion de la ligne:`, row, error);
      }
    }

    console.log(`✅ ${ventes.length} ventes valides converties`);
    return ventes;
  }

  /**
   * Parse une date
   */
  private parseDate(dateValue: any): Date {
    if (!dateValue) return new Date();
    
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    if (typeof dateValue === 'string') {
      // Essayer différents formats de date
      const formats = [
        dateValue, // Format original
        dateValue.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'), // DD/MM/YYYY -> YYYY-MM-DD
        dateValue.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'), // DD-MM-YYYY -> YYYY-MM-DD
      ];
      
      for (const format of formats) {
        const date = new Date(format);
        if (!isNaN(date.getTime())) {
          console.log(`📅 Date parsée: "${dateValue}" → ${date.toISOString()}`);
          return date;
        }
      }
    }
    
    if (typeof dateValue === 'number') {
      // Gestion des dates Excel (nombre de jours depuis 1900-01-01)
      const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
      if (!isNaN(excelDate.getTime())) {
        console.log(`📅 Date Excel parsée: ${dateValue} → ${excelDate.toISOString()}`);
        return excelDate;
      }
    }
    
    console.warn(`⚠️ Date non reconnue: ${dateValue}, utilisation de la date actuelle`);
    return new Date();
  }

  /**
   * Parse un nombre (convertit les centimes en euros si nécessaire)
   */
  private parseNumber(value: any, isMonetary: boolean = false): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    if (typeof value === 'number') {
      // Si c'est un montant monétaire, convertir les centimes en euros
      return isMonetary ? value / 100 : value;
    }
    
    if (typeof value === 'string') {
      // Nettoyer la chaîne (enlever les espaces, virgules, etc.)
      const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      if (isNaN(parsed)) return 0;
      
      // Si c'est un montant monétaire, convertir les centimes en euros
      return isMonetary ? parsed / 100 : parsed;
    }
    
    return 0;
  }

  /**
   * Parse un booléen
   */
  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'oui' || lower === 'yes';
    }
    
    if (typeof value === 'number') {
      return value !== 0;
    }
    
    return false;
  }

  /**
   * Calcule les statistiques de l'import
   */
  private calculerStatistiques(ventesOriginales: VenteLigne[], ventesFinales: VenteLigne[]): ImportResult['stats'] {
    const compositionsTrouvees = ventesOriginales.filter(v => 
      this.compositionService.getCompositions().some(comp => comp.id === v.id)
    ).length;

    const composantsAjoutes = ventesFinales.length - ventesOriginales.length;

    return {
      lignesImportees: ventesOriginales.length,
      lignesTraitees: ventesFinales.length,
      compositionsTrouvees,
      composantsAjoutes,
      erreurs: []
    };
  }

  /**
   * Analyse les ventes pour détecter automatiquement les compositions
   */
  private analyserCompositions(ventes: VenteLigne[]): VenteLigne[] {
    console.log('🔍 Analyse des compositions dans les ventes...');
    
    // Récupérer les compositions disponibles
    const compositionsDisponibles = this.compositionService.getCompositions();
    console.log(`🔍 ${compositionsDisponibles.length} compositions disponibles dans le service`);
    
    // Grouper les ventes par commande pour détecter les compositions
    const ventesParCommande = new Map<string, VenteLigne[]>();
    ventes.forEach(vente => {
      const commandeKey = vente.commande || 'sans_commande';
      if (!ventesParCommande.has(commandeKey)) {
        ventesParCommande.set(commandeKey, []);
      }
      ventesParCommande.get(commandeKey)!.push(vente);
    });
    
    console.log(`🔍 ${ventesParCommande.size} commandes analysées`);
    
    const ventesAnalysees = ventes.map(vente => {
      const venteAnalysee = { ...vente };
      
      // Vérifier si l'ID correspond à une composition dans le service
      const compositionTrouvee = compositionsDisponibles.find(comp => comp.id === vente.id);
      
      if (compositionTrouvee) {
        venteAnalysee.type = 'Composé';
        console.log(`✅ Composition détectée (service): ${vente.produit} (${vente.id})`);
      }
      // Détecter les compositions par analyse des commandes
      else if (this.estCompositionParCommande(vente, ventesParCommande)) {
        venteAnalysee.type = 'Composé';
        console.log(`✅ Composition détectée (commande): ${vente.produit} (${vente.id})`);
      }
      // Détecter les composants par ID (ceux qui ont des IDs avec underscores)
      else if (typeof vente.id === 'string' && vente.id.includes('_')) {
        venteAnalysee.type = 'Cumulé';
        console.log(`✅ Composant détecté: ${vente.produit} (${vente.id})`);
      }
      // Détecter les composants par prix nul (ceux qui ont prix_ttc = 0)
      else if (vente.prix_ttc === 0 && vente.montantTTC === 0) {
        venteAnalysee.type = 'Cumulé';
        console.log(`✅ Composant détecté (prix nul): ${vente.produit} (${vente.id})`);
      }
      // Les autres sont des produits simples
      else {
        venteAnalysee.type = 'Original';
      }
      
      return venteAnalysee;
    });
    
    const compositions = ventesAnalysees.filter(v => v.type === 'Composé').length;
    const composants = ventesAnalysees.filter(v => v.type === 'Cumulé').length;
    const originaux = ventesAnalysees.filter(v => v.type === 'Original').length;
    
    console.log(`📊 Résultat analyse: ${compositions} compositions, ${composants} composants, ${originaux} originaux`);
    
    return ventesAnalysees;
  }

  /**
   * Détermine si une vente est une composition en analysant sa commande
   */
  private estCompositionParCommande(vente: VenteLigne, ventesParCommande: Map<string, VenteLigne[]>): boolean {
    const commandeKey = vente.commande || 'sans_commande';
    const ventesDeLaCommande = ventesParCommande.get(commandeKey) || [];
    
    // Si cette commande contient des composants (prix nul), alors les autres ventes sont des compositions
    const contientComposants = ventesDeLaCommande.some(v => 
      v.prix_ttc === 0 && v.montantTTC === 0 && v.id !== vente.id
    );
    
    // Si cette vente a un prix > 0 et que la commande contient des composants, c'est une composition
    return contientComposants && vente.prix_ttc > 0 && vente.montantTTC > 0;
  }

  /**
   * Valide la structure du JSON avant import
   */
  validateJsonStructure(jsonData: JsonVenteData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Vérifier que les données existent
    if (!jsonData.data || !Array.isArray(jsonData.data)) {
      errors.push('Structure JSON invalide: données manquantes');
      return { isValid: false, errors };
    }

    if (jsonData.data.length === 0) {
      errors.push('Aucune donnée à importer');
      return { isValid: false, errors };
    }

    // Vérifier les colonnes obligatoires
    const requiredColumns = ['Id', 'Produit', 'Qté'];
    const firstRow = jsonData.data[0];
    
    for (const column of requiredColumns) {
      if (!(column in firstRow)) {
        errors.push(`Colonne obligatoire manquante: ${column}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default JsonImportService;
