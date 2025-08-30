import { VenteLigne } from '../types';

export interface FichierVenteJSON {
  nomFichier: string;
  dateConversion: string;
  ventes: VenteLigne[];
  metadata: {
    nombreLignes: number;
    boutiques: string[];
    periodeDebut: string;
    periodeFin: string;
    version: string;
  };
}

export class FileConversionService {
  
  // Convertir un fichier Excel en JSON et le sauvegarder
  async convertirEtSauvegarder(
    nomFichier: string, 
    ventes: VenteLigne[], 
    formatOriginal: 'excel' | 'csv' = 'excel'
  ): Promise<FichierVenteJSON> {
    
    const date = new Date();
    const nomJSON = this.genererNomFichierJSON(nomFichier);
    
    // Calculer les métadonnées
    const boutiques = Array.from(new Set(ventes.map(v => v.boutique)));
    const dates = ventes.map(v => new Date(v.date)).sort((a, b) => a.getTime() - b.getTime());
    
    const fichierJSON: FichierVenteJSON = {
      nomFichier: nomJSON,
      dateConversion: date.toISOString(),
      ventes: ventes,
      metadata: {
        nombreLignes: ventes.length,
        boutiques: boutiques,
        periodeDebut: dates.length > 0 ? dates[0].toISOString().split('T')[0] : '',
        periodeFin: dates.length > 0 ? dates[dates.length - 1].toISOString().split('T')[0] : '',
        version: '1.0'
      }
    };

    // Sauvegarder le fichier JSON
    await this.sauvegarderFichierJSON(fichierJSON);
    
    console.log(`✅ Fichier converti et sauvegardé: ${nomJSON}`);
    console.log(`📊 ${ventes.length} ventes converties depuis ${formatOriginal.toUpperCase()}`);
    
    return fichierJSON;
  }

  // Générer un nom de fichier JSON basé sur le nom original
  private genererNomFichierJSON(nomOriginal: string): string {
    const date = new Date();
    const timestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
    
    // Extraire le nom de base sans extension
    const nomBase = nomOriginal.replace(/\.[^/.]+$/, '');
    const nomSecurise = nomBase.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    return `ventes-${nomSecurise}-${timestamp}.json`;
  }

  // Sauvegarder le fichier JSON (téléchargement automatique)
  private async sauvegarderFichierJSON(fichierJSON: FichierVenteJSON): Promise<void> {
    const blob = new Blob([JSON.stringify(fichierJSON, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fichierJSON.nomFichier;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`📁 Fichier JSON téléchargé: ${fichierJSON.nomFichier}`);
    console.log(`💡 INSTRUCTIONS IMPORTANTES:`);
    console.log(`   1. Le fichier a été téléchargé dans votre dossier "Téléchargements"`);
    console.log(`   2. Copiez-le dans: /public/ventes-json/${fichierJSON.nomFichier}`);
    console.log(`   3. Cela permettra un chargement automatique la prochaine fois`);
    console.log(`   4. Ou utilisez le gestionnaire JSON dans l'application pour le charger`);
    
    // Afficher une notification à l'utilisateur
    this.afficherNotification(fichierJSON.nomFichier);
  }

  // Afficher une notification à l'utilisateur
  private afficherNotification(nomFichier: string): void {
    // Créer une notification temporaire avec un ID unique
    const notificationId = 'json-notification-' + Date.now();
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 9999;
      max-width: 400px;
      font-family: Arial, sans-serif;
      border-left: 4px solid #2e7d32;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; display: flex; align-items: center;">
        <span style="margin-right: 8px;">✅</span>
        Fichier JSON créé !
      </div>
      <div style="font-size: 14px; margin-bottom: 8px; background: rgba(255,255,255,0.1); padding: 5px; border-radius: 3px;">
        ${nomFichier}
      </div>
      <div style="font-size: 12px; opacity: 0.9;">
        📁 Copiez ce fichier dans /public/ventes-json/ pour un chargement automatique
      </div>
    `;
    
    // Ajouter la notification au body
    document.body.appendChild(notification);
    
    // Log dans la console aussi
    console.log('🎉 NOTIFICATION JSON:', nomFichier);
    console.log('📁 Placez ce fichier dans /public/ventes-json/');
    
    // Supprimer la notification après 10 secondes
    setTimeout(() => {
      const element = document.getElementById(notificationId);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 10000);
  }

  // Charger un fichier JSON depuis le dossier public
  async chargerFichierJSON(nomFichier: string): Promise<FichierVenteJSON | null> {
    try {
      const response = await fetch(`/ventes-json/${nomFichier}`);
      if (response.ok) {
        const fichierJSON: FichierVenteJSON = await response.json();
        console.log(`✅ Fichier JSON chargé: ${nomFichier}`);
        console.log(`📊 ${fichierJSON.ventes.length} ventes chargées`);
        return fichierJSON;
      } else {
        console.warn(`⚠️ Fichier JSON non trouvé: ${nomFichier}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Erreur lors du chargement du fichier JSON: ${nomFichier}`, error);
      return null;
    }
  }

  // Lister tous les fichiers JSON disponibles
  async listerFichiersJSON(): Promise<string[]> {
    try {
      // Créer un fichier d'index pour lister les fichiers disponibles
      const response = await fetch('/ventes-json/index.json');
      if (response.ok) {
        const index = await response.json();
        return index.fichiers || [];
      }
    } catch (error) {
      console.log('ℹ️ Aucun index de fichiers JSON trouvé');
    }
    return [];
  }

  // Créer un index des fichiers JSON
  async creerIndexFichiersJSON(fichiers: string[]): Promise<void> {
    const index = {
      dateCreation: new Date().toISOString(),
      fichiers: fichiers,
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(index, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📋 Index des fichiers JSON créé');
  }

  // Charger plusieurs fichiers JSON et les fusionner
  async chargerEtFusionnerFichiersJSON(nomsFichiers: string[]): Promise<VenteLigne[]> {
    const toutesVentes: VenteLigne[] = [];
    
    for (const nomFichier of nomsFichiers) {
      const fichierJSON = await this.chargerFichierJSON(nomFichier);
      if (fichierJSON) {
        toutesVentes.push(...fichierJSON.ventes);
        console.log(`✅ ${fichierJSON.ventes.length} ventes ajoutées depuis ${nomFichier}`);
      }
    }
    
    console.log(`📊 Total: ${toutesVentes.length} ventes fusionnées depuis ${nomsFichiers.length} fichiers`);
    return toutesVentes;
  }

  // Vérifier si un fichier JSON existe déjà
  async fichierJSONExiste(nomFichier: string): Promise<boolean> {
    try {
      const response = await fetch(`/ventes-json/${nomFichier}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Obtenir les statistiques d'un fichier JSON
  obtenirStatistiquesFichier(fichierJSON: FichierVenteJSON): {
    nombreVentes: number;
    nombreBoutiques: number;
    periode: string;
    tailleFichier: string;
  } {
    const tailleFichier = new Blob([JSON.stringify(fichierJSON)]).size;
    const tailleMB = (tailleFichier / (1024 * 1024)).toFixed(2);
    
    return {
      nombreVentes: fichierJSON.ventes.length,
      nombreBoutiques: fichierJSON.metadata.boutiques.length,
      periode: `${fichierJSON.metadata.periodeDebut} - ${fichierJSON.metadata.periodeFin}`,
      tailleFichier: `${tailleMB} MB`
    };
  }
}

export default FileConversionService;
