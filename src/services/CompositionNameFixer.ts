// Interfaces définies localement pour éviter les dépendances

export interface CompositionEnrichie {
  id: string;
  nom: string;
  type: string;
  composants: ComposantEnrichi[];
  autres: Record<string, any>;
}

export interface ComposantEnrichi {
  nom: string;
  quantite: number;
  id: string;
  categorie: string;
}

export class CompositionNameFixer {
  /**
   * Corrige les noms des compositions en générant des noms descriptifs
   */
  static corrigerNomsCompositions(compositions: CompositionEnrichie[]): CompositionEnrichie[] {
    return compositions.map(composition => {
      const nomCorrige = this.genererNomComposition(composition);
      return {
        ...composition,
        nom: nomCorrige
      };
    });
  }

  /**
   * Génère un nom descriptif pour une composition basé sur ses composants
   */
  private static genererNomComposition(composition: CompositionEnrichie): string {
    if (!composition.composants || composition.composants.length === 0) {
      return `Composition ${composition.id}`;
    }

    // Grouper les composants par nom et quantités
    const composantsGroupes = new Map<string, number>();
    
    composition.composants.forEach(composant => {
      const nom = composant.nom.trim();
      const quantite = composant.quantite || 1;
      
      if (composantsGroupes.has(nom)) {
        composantsGroupes.set(nom, composantsGroupes.get(nom)! + quantite);
      } else {
        composantsGroupes.set(nom, quantite);
      }
    });

    // Générer le nom descriptif
    const parties: string[] = [];
    
    // Ajouter le composant principal (vasque ou autre)
    const composantsPrincipaux = ['VASQUE', 'SEAU', 'SOBAG'];
    let composantPrincipal = '';
    
    composantsGroupes.forEach((quantite, nom) => {
      if (composantsPrincipaux.some(mot => nom.toUpperCase().includes(mot))) {
        composantPrincipal = `${nom}${quantite > 1 ? ` x${quantite}` : ''}`;
        return;
      }
    });

    if (composantPrincipal) {
      parties.push(composantPrincipal);
    }

    // Ajouter les autres composants
    const autresComposants: string[] = [];
    
    composantsGroupes.forEach((quantite, nom) => {
      if (!composantsPrincipaux.some(mot => nom.toUpperCase().includes(mot))) {
        const partie = `${nom}${quantite > 1 ? ` x${quantite}` : ''}`;
        autresComposants.push(partie);
      }
    });

    // Limiter le nombre de composants affichés pour éviter des noms trop longs
    if (autresComposants.length > 0) {
      if (autresComposants.length <= 3) {
        parties.push(...autresComposants);
      } else {
        // Si trop de composants, afficher les 2 premiers + "et X autres"
        parties.push(autresComposants[0], autresComposants[1], `et ${autresComposants.length - 2} autres`);
      }
    }

    // Joindre avec " + "
    const nomComplet = parties.join(' + ');
    
    // Limiter la longueur si nécessaire
    if (nomComplet.length > 80) {
      return nomComplet.substring(0, 77) + '...';
    }

    return nomComplet;
  }

  /**
   * Sauvegarde les compositions corrigées dans un fichier JSON
   */
  static async sauvegarderCompositionsCorrigees(compositions: CompositionEnrichie[]): Promise<void> {
    const compositionsCorrigees = this.corrigerNomsCompositions(compositions);
    
    const dataStr = JSON.stringify(compositionsCorrigees, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'compositions-enrichies-corrigees.json';
    link.click();
    
    console.log('✅ Fichier compositions-enrichies-corrigees.json téléchargé');
  }
}

export default CompositionNameFixer;
