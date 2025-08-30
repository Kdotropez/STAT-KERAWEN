import { Composition, CompositionsData, VenteLigne, ComposantVendu } from '../../types';

export class CompositionService {
  private compositions: Map<string, Composition> = new Map();

  constructor(compositionsData: CompositionsData) {
    this.chargerCompositions(compositionsData);
  }

      private chargerCompositions(data: CompositionsData): void {
    if (data.compositions) {
      data.compositions.forEach((composition: Composition) => {
        this.compositions.set(composition.id, composition);
      });
    }
  }

  /**
   * Décompose une vente en ses composants
   */
  public decomposerVente(vente: VenteLigne): VenteLigne {
    const composition = this.compositions.get(vente.id);
    
    if (!composition) {
      console.warn(`Composition non trouvée pour l'ID: ${vente.id}`);
      return vente;
    }

    const composants: ComposantVendu[] = [];
    const prixUnitaire = vente.montantTTC / vente.quantite;

                // Traiter chaque composant de la composition  
        if (composition.compositions) {
          composition.compositions.forEach((composantStr: string) => {
            const match = composantStr.match(/^(.+?)\s*\((\d+)\)$/);
            if (match) {
              const nomComposant = match[1].trim();
              const quantiteComposant = parseInt(match[2]);
              const nombreComposants = composition.nombreComposants || 1;
              
              composants.push({
                id: `comp_${nomComposant.replace(/\s+/g, '_')}`,
                nom: nomComposant,
                quantite: quantiteComposant * vente.quantite,
                prixUnitaire: prixUnitaire / nombreComposants,
                marge: vente.marge ? (vente.marge / nombreComposants) * quantiteComposant : undefined
              });
            }
          });
        }

    return {
      ...vente,
      composants
    };
  }

  /**
   * Décompose une liste de ventes
   */
  public decomposerVentes(ventes: VenteLigne[]): VenteLigne[] {
    return ventes.map(vente => this.decomposerVente(vente));
  }

  /**
   * Obtient les statistiques des composants vendus
   */
  public obtenirStatistiquesComposants(ventes: VenteLigne[]): Map<string, ComposantVendu> {
    const statsComposants = new Map<string, ComposantVendu>();

    ventes.forEach(vente => {
      if (vente.composants) {
        vente.composants.forEach((composant: ComposantVendu) => {
          const existant = statsComposants.get(composant.nom);
          
          if (existant) {
            existant.quantite += composant.quantite;
            if (composant.prixUnitaire) {
              existant.prixUnitaire = (existant.prixUnitaire! + composant.prixUnitaire) / 2;
            }
            if (composant.marge) {
              existant.marge = (existant.marge || 0) + composant.marge;
            }
          } else {
            statsComposants.set(composant.nom, { ...composant });
          }
        });
      }
    });

    return statsComposants;
  }

  /**
   * Obtient la liste des compositions disponibles
   */
  public obtenirCompositions(): Composition[] {
    return Array.from(this.compositions.values());
  }

  /**
   * Recherche une composition par nom ou ID
   */
  public rechercherComposition(recherche: string): Composition[] {
    const terme = recherche.toLowerCase();
    return Array.from(this.compositions.values()).filter(comp => 
      comp.nom.toLowerCase().includes(terme) || 
      comp.id.toLowerCase().includes(terme)
    );
  }
}
