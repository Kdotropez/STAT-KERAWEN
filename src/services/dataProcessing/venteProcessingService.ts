import { VenteLigne, ComposantVendu } from '../../types';

export interface VenteTraitee extends VenteLigne {
  // Colonnes importantes selon les spécifications
  date: Date;
  heure?: string;
  boutique: string;
  caissier?: string;
  commande?: string;
  retour?: boolean;
  id: string;
  nomArticle?: string;
  fournisseur?: string;
  fabricant?: string;
  prixUnitaire: number;
  qté: number;
  montantTTC: number;
  tva?: number;
  prixAchat?: number;
  categorie?: string;
  paiement?: string;
  
  // Colonnes optionnelles
  op?: string;
  activite?: string;
  caisse?: string;
  client?: string;
  groupe?: string;
  ean?: string;
  mesure?: string;
  remiseTTC?: number;
  livreur?: string;
  reference?: string;
  catDefaut?: string;
  catRacine?: string;
  pays?: string;
  mode?: string;
  tag?: string;
  note?: string;
}

export class VenteProcessingService {
  
  /**
   * Traite une ligne de vente selon les spécifications de l'utilisateur
   */
  traiterLigneVente(ligne: any, mapping: { [key: string]: string }): VenteTraitee | null {
    try {
      const vente: any = {};

      // Mapper toutes les colonnes selon les spécifications
      Object.entries(mapping).forEach(([colonneSource, colonneCible]) => {
        const valeur = ligne[colonneSource];
        
        if (valeur !== undefined && valeur !== null && valeur !== '') {
          // Traitement spécial selon le type de colonne
          switch (colonneCible.toLowerCase()) {
            case 'date':
            case 'date et heure':
              vente.date = this.parserDate(valeur);
              break;
              
            case 'heure':
              vente.heure = String(valeur);
              break;
              
            case 'qté':
            case 'quantité':
              vente.qté = this.parserNombre(valeur);
              break;
              
            case 'prix unitaire':
            case 'prix de vente ttc unitaire':
              vente.prixUnitaire = this.parserNombre(valeur);
              break;
              
            case 'montant ttc':
              vente.montantTTC = this.parserNombre(valeur);
              break;
              
            case 'prix d\'achat':
              vente.prixAchat = this.parserNombre(valeur);
              break;
              
            case 'tva':
              vente.tva = this.parserNombre(valeur);
              break;
              
            case 'remise ttc':
              vente.remiseTTC = this.parserNombre(valeur);
              break;
              
            case 'id':
              vente.id = String(valeur).trim();
              break;
              
            case 'retour':
              vente.retour = this.parserBoolean(valeur);
              break;
              
            default:
              // Pour toutes les autres colonnes (texte)
              vente[colonneCible] = String(valeur);
          }
        }
      });

      // Vérifier les champs essentiels
      if (!vente.date || !vente.id || !vente.qté || !vente.montantTTC) {
        console.warn('Ligne ignorée - champs essentiels manquants:', vente);
        return null;
      }

      // Calculer la marge si possible
      if (vente.prixAchat && vente.montantTTC) {
        vente.marge = vente.montantTTC - (vente.prixAchat * vente.qté);
      }

      return vente as VenteTraitee;
      
    } catch (error) {
      console.error('Erreur lors du traitement de la ligne:', error, ligne);
      return null;
    }
  }

  /**
   * Traite un ensemble de ventes
   */
  traiterVentes(lignes: any[], mapping: { [key: string]: string }): VenteTraitee[] {
    const ventesTraitees: VenteTraitee[] = [];
    
    for (const ligne of lignes) {
      const vente = this.traiterLigneVente(ligne, mapping);
      if (vente) {
        ventesTraitees.push(vente);
      }
    }
    
    return ventesTraitees;
  }

  /**
   * Filtre les ventes selon différents critères
   */
  filtrerVentes(ventes: VenteTraitee[], filtres: {
    periode?: { debut: Date; fin: Date };
    boutiques?: string[];
    categories?: string[];
    fournisseurs?: string[];
    fabricants?: string[];
    paiements?: string[];
    caissiers?: string[];
  }): VenteTraitee[] {
    return ventes.filter(vente => {
      // Filtre par période
      if (filtres.periode && vente.date) {
        if (vente.date < filtres.periode.debut || vente.date > filtres.periode.fin) {
          return false;
        }
      }
      
      // Filtre par boutiques
      if (filtres.boutiques && filtres.boutiques.length > 0) {
        if (!filtres.boutiques.includes(vente.boutique)) {
          return false;
        }
      }
      
      // Filtre par catégories
      if (filtres.categories && filtres.categories.length > 0) {
        if (!vente.categorie || !filtres.categories.includes(vente.categorie)) {
          return false;
        }
      }
      
      // Filtre par fournisseurs
      if (filtres.fournisseurs && filtres.fournisseurs.length > 0) {
        if (!vente.fournisseur || !filtres.fournisseurs.includes(vente.fournisseur)) {
          return false;
        }
      }
      
      // Filtre par fabricants
      if (filtres.fabricants && filtres.fabricants.length > 0) {
        if (!vente.fabricant || !filtres.fabricants.includes(vente.fabricant)) {
          return false;
        }
      }
      
      // Filtre par méthodes de paiement
      if (filtres.paiements && filtres.paiements.length > 0) {
        if (!vente.paiement || !filtres.paiements.includes(vente.paiement)) {
          return false;
        }
      }
      
      // Filtre par caissiers
      if (filtres.caissiers && filtres.caissiers.length > 0) {
        if (!vente.caissier || !filtres.caissiers.includes(vente.caissier)) {
          return false;
        }
      }
      
      return true;
    });
  }

  private parserDate(valeur: any): Date | null {
    if (!valeur) return null;
    
    try {
      // Essayer de parser comme Date Excel
      if (typeof valeur === 'number') {
        return new Date((valeur - 25569) * 86400 * 1000);
      }
      
      // Essayer de parser comme string
      const date = new Date(valeur);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private parserNombre(valeur: any): number {
    if (valeur === null || valeur === undefined || valeur === '') {
      return 0;
    }
    
    const nombre = parseFloat(String(valeur).replace(/[^\d.,-]/g, '').replace(',', '.'));
    return isNaN(nombre) ? 0 : nombre;
  }

  private parserBoolean(valeur: any): boolean {
    if (typeof valeur === 'boolean') return valeur;
    if (typeof valeur === 'string') {
      const lower = valeur.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'oui' || lower === 'yes';
    }
    if (typeof valeur === 'number') return valeur !== 0;
    return false;
  }
}


