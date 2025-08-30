import { Composition, Composant } from './CompositionService';

// Interfaces pour les compositions enrichies
export interface ComposantEnrichi {
  nom: string;
  quantite: number;
  id?: string;
  categorie?: string;
  prix?: number;
}

export interface CompositionEnrichie {
  id?: string;
  nom?: string;
  type?: string;
  composants: ComposantEnrichi[];
  autres?: Record<string, any>;
}

export interface ImportResult {
  success: boolean;
  message: string;
  compositionsImportees: number;
  erreurs: string[];
}

export class CompositionsEnrichiesImporter {
  
  /**
   * Importe les compositions enrichies depuis le fichier JSON
   */
  async importerCompositionsEnrichies(): Promise<ImportResult> {
    try {
      console.log('🔄 Début de l\'import des compositions enrichies...');
      
      // Charger le fichier JSON
      const compositions = await this.chargerFichierEnrichi();
      console.log(`📊 ${compositions.length} compositions chargées depuis le fichier enrichi`);
      
      // Convertir au format du système
      const compositionsConverties = this.convertirCompositions(compositions);
      console.log(`✅ ${compositionsConverties.length} compositions converties`);
      
      // Sauvegarder dans le localStorage
      await this.sauvegarderDansLocalStorage(compositionsConverties);
      
      return {
        success: true,
        message: `Import réussi : ${compositionsConverties.length} compositions importées`,
        compositionsImportees: compositionsConverties.length,
        erreurs: []
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'import:', error);
      return {
        success: false,
        message: `Erreur lors de l'import : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        compositionsImportees: 0,
        erreurs: [error instanceof Error ? error.message : 'Erreur inconnue']
      };
    }
  }
  
  /**
   * Charge le fichier JSON des compositions enrichies
   */
  private async chargerFichierEnrichi(): Promise<CompositionEnrichie[]> {
    try {
      const response = await fetch('/compositions-enrichies.json');
      if (!response.ok) {
        throw new Error(`Impossible de charger le fichier (${response.status}: ${response.statusText})`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Erreur lors du chargement du fichier enrichi:', error);
      throw error;
    }
  }
  
  /**
   * Convertit les compositions enrichies au format du système
   */
  private convertirCompositions(compositionsEnrichies: CompositionEnrichie[]): Composition[] {
    const compositions: Composition[] = [];
    const erreurs: string[] = [];
    
    for (const compEnrichie of compositionsEnrichies) {
      try {
        const composition = this.convertirComposition(compEnrichie);
        if (composition) {
          compositions.push(composition);
        }
      } catch (error) {
        const erreur = `Erreur composition ${compEnrichie.id}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        console.warn(erreur);
        erreurs.push(erreur);
      }
    }
    
    if (erreurs.length > 0) {
      console.warn(`⚠️ ${erreurs.length} erreurs lors de la conversion:`, erreurs);
    }
    
    return compositions;
  }
  
  /**
   * Convertit une composition enrichie au format du système
   */
  private convertirComposition(compEnrichie: CompositionEnrichie): Composition | null {
    if (!compEnrichie.id || !compEnrichie.nom || !compEnrichie.composants?.length) {
      console.warn(`⚠️ Composition invalide: ${compEnrichie.id || 'ID manquant'}`);
      return null;
    }
    
    // Déterminer le type de composition
    const type = this.determinerType(compEnrichie.type || '');
    
    // Convertir les composants
    const composants: Composant[] = compEnrichie.composants.map(comp => ({
      id: comp.id || comp.nom, // Utiliser l'ID si disponible, sinon le nom
      nom: comp.nom,
      quantite: comp.quantite
    }));
    
    const composition: Composition = {
      type,
      id: compEnrichie.id,
      nom: compEnrichie.nom,
      nombreComposants: composants.length,
      composants,
      isModified: true
    };
    
    console.log(`✅ Composition convertie: ${composition.nom} (${composition.composants?.length || 0} composants)`);
    return composition;
  }
  
  /**
   * Détermine le type de composition
   */
  private determinerType(typeOriginal: string): string {
    const typeLower = typeOriginal.toLowerCase();
    
    if (typeLower.includes('vasque')) return 'vasque';
    if (typeLower.includes('pack')) return 'pack-verre';
    if (typeLower.includes('trio')) return 'trio';
    if (typeLower.includes('composition')) return 'composition';
    
    return 'pack'; // Type par défaut
  }
  
  /**
   * Sauvegarde les compositions dans le localStorage
   */
  private async sauvegarderDansLocalStorage(compositions: Composition[]): Promise<void> {
    try {
      // Créer la structure attendue par le système
      const structureCompositions: Record<string, Composition[]> = {
        vasque: [],
        'pack-verre': [],
        trio: [],
        pack: []
      };
      
      // Organiser par type
      for (const composition of compositions) {
        if (structureCompositions[composition.type]) {
          structureCompositions[composition.type].push(composition);
        } else {
          structureCompositions.pack.push(composition);
        }
      }
      
      // Sauvegarder dans localStorage
      localStorage.setItem('compositions', JSON.stringify(structureCompositions));
      
      console.log(`💾 ${compositions.length} compositions sauvegardées dans localStorage`);
      console.log('📊 Répartition par type:', {
        vasque: structureCompositions.vasque.length,
        'pack-verre': structureCompositions['pack-verre'].length,
        trio: structureCompositions.trio.length,
        pack: structureCompositions.pack.length
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde dans localStorage:', error);
      throw error;
    }
  }
  
  /**
   * Vérifie si le fichier enrichi existe
   */
  async verifierFichierExiste(): Promise<boolean> {
    try {
      const response = await fetch('/compositions-enrichies.json');
      return response.ok;
    } catch {
      return false;
    }
  }
  
  /**
   * Obtient des statistiques sur le fichier enrichi
   */
  async obtenirStatistiques(): Promise<{
    existe: boolean;
    nombreCompositions: number;
    typesCompositions: Record<string, number>;
  }> {
    const existe = await this.verifierFichierExiste();
    
    if (!existe) {
      return {
        existe: false,
        nombreCompositions: 0,
        typesCompositions: {}
      };
    }
    
    try {
      const compositions = await this.chargerFichierEnrichi();
      const typesCompositions: Record<string, number> = {};
      
      for (const comp of compositions) {
        const type = comp.type || 'inconnu';
        typesCompositions[type] = (typesCompositions[type] || 0) + 1;
      }
      
      return {
        existe: true,
        nombreCompositions: compositions.length,
        typesCompositions
      };
    } catch (error) {
      return {
        existe: true,
        nombreCompositions: 0,
        typesCompositions: {}
      };
    }
  }
}

export default CompositionsEnrichiesImporter;
