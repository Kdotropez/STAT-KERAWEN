import * as XLSX from 'xlsx';
import { VenteLigne, MappingColonnes } from '../../types';

export class ExcelService {
  async lireFichierExcel(file: File): Promise<any[][]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          resolve(jsonData as any[][]);
        } catch (error) {
          reject(new Error(`Erreur lors de la lecture du fichier Excel: ${error}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  }

  appliquerMapping(data: any[][], mapping: MappingColonnes): VenteLigne[] {
    if (data.length < 2) {
      throw new Error('Le fichier Excel doit contenir au moins une ligne d\'en-tête et une ligne de données');
    }

    const headers = data[0]?.map(header => String(header || '')) || [];
    const lignes = data.slice(1);
    const ventes: VenteLigne[] = [];

    console.log('🔍 Debug - Headers trouvés:', headers);
    console.log('🔍 Debug - Mapping reçu:', mapping);
    console.log('🔍 Debug - Nombre de lignes à traiter:', lignes.length);

    // Traiter seulement les 3 premières lignes pour le debug
    const lignesADebugger = lignes.slice(0, 3);
    console.log('🔍 Debug - Traitement des 3 premières lignes seulement');

    for (let i = 0; i < lignes.length; i++) {
      const ligne = lignes[i];
      if (!ligne || !Array.isArray(ligne)) {
        console.warn(`⚠️ Ligne ${i} invalide:`, ligne);
        continue;
      }
      
      if (ligne.every(cell => cell === null || cell === undefined || cell === '')) {
        continue; // Ignorer les lignes vides
      }

      try {
        // Debug détaillé seulement pour les 3 premières lignes
        const debugMode = i < 3;
        const vente = this.convertirLigne(ligne, headers, mapping, debugMode);
        if (vente) {
          ventes.push(vente);
        }
      } catch (error) {
        console.warn(`Erreur lors du traitement de la ligne ${i}:`, error);
        // Continuer avec les autres lignes
      }
    }

    console.log(`✅ Ventes extraites avec succès: ${ventes.length} lignes`);
    return ventes;
  }

  private convertirLigne(ligne: any[], headers: string[], mapping: MappingColonnes, debugMode: boolean = false): VenteLigne | null {
          const vente: Record<string, any> = {};

    if (debugMode) {
      console.log('🔍 Debug - Traitement d\'une ligne:');
      console.log('  📋 Ligne brute:', ligne);
      console.log('  📋 Headers:', headers);
      console.log('  🔧 Mapping:', mapping);
    }

    // Traiter toutes les colonnes mappées selon les spécifications de l'utilisateur
    Object.entries(mapping).forEach(([colonneSource, colonneCible]) => {
      const index = headers.findIndex(header => header === colonneSource);
      if (debugMode) {
        console.log(`  🔍 Mapping "${colonneSource}" → "${colonneCible}" (index: ${index})`);
      }
      
      if (index !== -1 && ligne[index] !== undefined && ligne[index] !== null && colonneCible) {
        const valeur = ligne[index];
        if (debugMode) {
          console.log(`    ✅ Valeur trouvée: ${valeur} (type: ${typeof valeur})`);
        }
        
        // Traitement spécial selon le type de colonne
        if (colonneCible.toLowerCase().includes('date') || colonneCible.toLowerCase().includes('heure')) {
          vente[colonneCible] = this.parserDate(valeur);
          if (debugMode) console.log(`    📅 Date parsée: ${vente[colonneCible]}`);
        } else if (colonneCible.toLowerCase().includes('qté') || colonneCible.toLowerCase().includes('quantité') || colonneCible.toLowerCase().includes('quantite') || colonneCible.toLowerCase().includes('qte')) {
          vente[colonneCible] = this.parserNombre(valeur);
          if (debugMode) console.log(`    🔢 Quantité parsée: ${vente[colonneCible]}`);
        } else if (colonneCible.toLowerCase().includes('prix')) {
          // Les prix sont en centimes, les convertir en euros
          vente[colonneCible] = this.parserPrix(valeur);
          if (debugMode) console.log(`    💰 Prix parsé: ${vente[colonneCible]}`);
        } else if (colonneCible.toLowerCase().includes('montant') || 
                   colonneCible.toLowerCase().includes('tva') ||
                   colonneCible.toLowerCase().includes('remise')) {
          vente[colonneCible] = this.parserPrix(valeur);
          if (debugMode) console.log(`    💵 Montant parsé: ${vente[colonneCible]}`);
        } else if (colonneCible.toLowerCase().includes('id')) {
          // L'ID est crucial pour la décomposition des compositions
          vente[colonneCible] = String(valeur).trim();
          if (debugMode) console.log(`    🆔 ID parsé: ${vente[colonneCible]}`);
        } else {
          vente[colonneCible] = String(valeur);
          if (debugMode) console.log(`    📝 Texte parsé: ${vente[colonneCible]}`);
        }
      } else {
        if (debugMode) console.log(`    ❌ Valeur non trouvée ou mapping invalide`);
      }
    });

    // Vérifier que les champs essentiels sont présents (plus flexible)
    const champsEssentiels = ['date', 'id', 'qte'];
    if (debugMode) {
      console.log('🔍 Debug - Validation des champs essentiels:');
      console.log('  📋 Champs requis:', champsEssentiels);
      console.log('  📋 Vente traitée:', vente);
    }
    
    const champsManquants = champsEssentiels.filter(champ => {
      // Chercher le champ dans les valeurs mappées
      const valeurTrouvee = Object.values(mapping).find(target => 
        target && typeof target === 'string' && target.toLowerCase().includes(champ.toLowerCase())
      );
      
      if (debugMode) {
        console.log(`  🔍 Vérification du champ "${champ}":`);
        console.log(`    🔧 Mapping trouvé: "${valeurTrouvee}"`);
      }
      
      // Pour l'ID, être plus permissif - accepter si on a au moins un champ qui ressemble à un ID
      if (champ === 'id') {
        const idTrouve = Object.values(mapping).find(target => 
          target && typeof target === 'string' && (target.toLowerCase().includes('id') || 
                    target.toLowerCase().includes('identifiant') ||
                    target.toLowerCase().includes('reference'))
        );
        const valeurId = idTrouve ? vente[idTrouve as string] : null;
        if (debugMode) console.log(`    🆔 ID trouvé: "${idTrouve}" → valeur: "${valeurId}"`);
        return !idTrouve || !vente[idTrouve as string];
      }
      
      // Pour la quantité, accepter 0 comme valeur valide
      if (champ === 'qte') {
        const valeurQte = valeurTrouvee ? vente[valeurTrouvee as string] : null;
        if (debugMode) console.log(`    🔢 Quantité trouvée: "${valeurTrouvee}" → valeur: ${valeurQte} (type: ${typeof valeurQte})`);
        return !valeurTrouvee || (vente[valeurTrouvee as string] === undefined || vente[valeurTrouvee as string] === null);
      }
      
      const valeurChamp = valeurTrouvee ? vente[valeurTrouvee as string] : null;
      if (debugMode) console.log(`    📝 Champ trouvé: "${valeurTrouvee}" → valeur: ${valeurChamp} (type: ${typeof valeurChamp})`);
      return !valeurTrouvee || (vente[valeurTrouvee as string] === undefined || vente[valeurTrouvee as string] === null);
    });
    
    if (champsManquants.length > 0) {
      console.warn(`❌ Ligne ignorée - champs manquants: ${champsManquants.join(', ')}`);
      if (debugMode) {
        console.log('📋 Vente traitée:', vente);
        console.log('🔧 Mapping utilisé:', mapping);
      }
      return null;
    }
    
    if (debugMode) console.log('✅ Tous les champs essentiels sont présents !');

    // Convertir vers le format VenteLigne attendu
    const venteLigne: VenteLigne = {
      date: vente['date'] || new Date(),
      nom: vente['produit'] || vente['nom'] || 'Produit inconnu',
      produit: vente['produit'] || vente['nom'] || 'Produit inconnu',
      id: vente['id'] || '',
      quantite: vente['qte'] || vente['qté'] || vente['quantite'] || 0,
      boutique: vente['boutique'] || 'Boutique inconnue',
      montantTTC: vente['montant_ttc'] || vente['montant ttc'] || vente['montantTTC'] || 0,
      prixAchat: vente['prix_achat'] || vente['prix achat'] || vente['prixAchat'],
      marge: vente['marge'],
      // Ajouter tous les autres champs comme propriétés dynamiques
      heure: vente['heure'],
      caissier: vente['caissier'],
      commande: vente['commande'],
      numeroOperation: vente['numeroOperation'] || vente['#Op'] || vente['Op'] || vente['Operation'] || '',
      retour: vente['retour'],
      prix_ttc: vente['prix_ttc'] || vente['prix ttc'] || vente['prixTTC'],
      tva: vente['tva'],
      remise_ttc: vente['remise_ttc'] || vente['remise ttc'] || vente['remiseTTC'],
      fournisseur: vente['fournisseur'],
      fabricant: vente['fabricant'],
      categorie: vente['categorie'],
      paiement: vente['paiement'],
      client: vente['client'],
      ean: vente['ean'],
      reference: vente['reference'],
      declinaison: vente['declinaison']
    };

    // Calculer automatiquement le montant TTC si on a quantite et prix ttc
    const quantite = venteLigne.quantite;
    const prixTTC = venteLigne.prix_ttc;
    if (quantite && prixTTC && !venteLigne.montantTTC) {
      venteLigne.montantTTC = quantite * prixTTC;
      console.log(`Montant TTC calculé: ${quantite} × ${prixTTC} = ${venteLigne.montantTTC}`);
    }

    // Calculer la marge si on a prix d'achat
    const prixAchat = venteLigne.prixAchat;
    if (prixAchat && prixTTC) {
      venteLigne.marge = prixTTC - prixAchat;
      console.log(`Marge calculée: ${prixTTC} - ${prixAchat} = ${venteLigne.marge}`);
    }

    return venteLigne;
  }

  private parserDate(valeur: any): Date | null {
    if (!valeur) return null;
    
    try {
      // Essayer de parser comme Date Excel
      if (typeof valeur === 'number') {
        return new Date((valeur - 25569) * 86400 * 1000);
      }
      
      // Essayer de parser comme string
      if (typeof valeur === 'string') {
        // Gérer le format DD/MM/YYYY
        const match = valeur.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (match) {
          const [, jour, mois, annee] = match;
          // Les mois en JavaScript commencent à 0, donc on soustrait 1
          return new Date(parseInt(annee), parseInt(mois) - 1, parseInt(jour));
        }
        
        // Gérer le format DD-MM-YYYY
        const match2 = valeur.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (match2) {
          const [, jour, mois, annee] = match2;
          return new Date(parseInt(annee), parseInt(mois) - 1, parseInt(jour));
        }
        
        // Essayer le parsing standard JavaScript
        const date = new Date(valeur);
        if (!isNaN(date.getTime())) {
          return date;
        }
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
    const resultat = isNaN(nombre) ? 0 : nombre;
    
    // Log pour debug
    console.log(`🔢 Nombre parsé: ${valeur} → ${resultat}`);
    
    return resultat;
  }

  private parserPrix(valeur: any): number {
    if (valeur === null || valeur === undefined || valeur === '') {
      return 0;
    }
    
    // Les prix sont en centimes, les convertir en euros
    const nombre = parseFloat(String(valeur).replace(/[^\d.,-]/g, '').replace(',', '.'));
    const resultat = isNaN(nombre) ? 0 : nombre / 100;
    
    // Log pour debug
    console.log(`💰 Prix parsé: ${valeur} → ${nombre} centimes → ${resultat} €`);
    
    return resultat;
  }

  obtenirEnTetes(data: any[][]): string[] {
    return data[0]?.map(header => String(header || '')) || [];
  }

  async exporterExcel(data: any[], nomFichier: string): Promise<void> {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Données');
    
    XLSX.writeFile(workbook, `${nomFichier}.xlsx`);
  }
}
