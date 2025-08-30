import CryptoJS from 'crypto-js';

export class SecurityService {
  private readonly SECRET_KEY = 'statistiques-ventes-2024-secret-key';
  private readonly STORAGE_PREFIX = 'stats_ventes_';

  /**
   * Chiffre les données avant sauvegarde
   */
  public chiffrerDonnees(donnees: any): string {
    const donneesString = JSON.stringify(donnees);
    return CryptoJS.AES.encrypt(donneesString, this.SECRET_KEY).toString();
  }

  /**
   * Déchiffre les données sauvegardées
   */
  public dechiffrerDonnees(donneesChiffrees: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(donneesChiffrees, this.SECRET_KEY);
      const donneesString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(donneesString);
    } catch (error) {
      console.error('Erreur lors du déchiffrement:', error);
      return null;
    }
  }

  /**
   * Sauvegarde des données dans le localStorage
   */
  public sauvegarderDonnees(cle: string, donnees: any): void {
    try {
      // Nettoyer les anciennes données si le localStorage est plein
      if (this.estLocalStoragePlein()) {
        console.log('🧹 Nettoyage du localStorage...');
        this.nettoyerLocalStorage();
      }
      
      const donneesChiffrees = this.chiffrerDonnees(donnees);
      localStorage.setItem(this.STORAGE_PREFIX + cle, donneesChiffrees);
      console.log(`✅ Données sauvegardées: ${cle}`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      // En cas d'erreur de quota, essayer de nettoyer et réessayer
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.log('🧹 Nettoyage d\'urgence du localStorage...');
        this.nettoyerLocalStorage();
        try {
          const donneesChiffrees = this.chiffrerDonnees(donnees);
          localStorage.setItem(this.STORAGE_PREFIX + cle, donneesChiffrees);
          console.log(`✅ Données sauvegardées après nettoyage: ${cle}`);
        } catch (retryError) {
          console.error('❌ Impossible de sauvegarder même après nettoyage:', retryError);
          throw new Error('Impossible de sauvegarder les données');
        }
      } else {
        throw new Error('Impossible de sauvegarder les données');
      }
    }
  }

  private estLocalStoragePlein(): boolean {
    try {
      const testKey = this.STORAGE_PREFIX + '__test__';
      const testValue = 'x'.repeat(1024 * 1024); // 1MB
      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);
      return false;
    } catch {
      return true;
    }
  }

  private nettoyerLocalStorage(): void {
    try {
      const keysToKeep = ['configuration_mapping'];
      const allKeys = Object.keys(localStorage);
      
      // Supprimer les anciennes données de ventes
      allKeys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX + 'ventes_') && !keysToKeep.includes(key.replace(this.STORAGE_PREFIX, ''))) {
          localStorage.removeItem(key);
          console.log(`🗑️ Supprimé: ${key}`);
        }
      });
      
      console.log('✅ Nettoyage du localStorage terminé');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    }
  }

  /**
   * Charge des données depuis le localStorage
   */
  public chargerDonnees(cle: string): any {
    try {
      const donneesChiffrees = localStorage.getItem(this.STORAGE_PREFIX + cle);
      if (!donneesChiffrees) {
        return null;
      }
      return this.dechiffrerDonnees(donneesChiffrees);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return null;
    }
  }

  /**
   * Supprime des données sauvegardées
   */
  public supprimerDonnees(cle: string): void {
    localStorage.removeItem(this.STORAGE_PREFIX + cle);
  }

  /**
   * Sauvegarde automatique des ventes
   */
  public sauvegarderVentes(ventes: any[]): void {
    const timestamp = new Date().toISOString();
    const cle = `ventes_${timestamp}`;
    this.sauvegarderDonnees(cle, {
      ventes,
      timestamp,
      version: '1.0'
    });
  }

  /**
   * Sauvegarde la configuration de mapping
   */
  public sauvegarderConfiguration(config: any): void {
    this.sauvegarderDonnees('configuration_mapping', {
      config,
      timestamp: new Date().toISOString(),
      version: '1.0'
    });
  }

  /**
   * Charge la configuration de mapping
   */
  public chargerConfiguration(): any {
    return this.chargerDonnees('configuration_mapping');
  }

  /**
   * Obtient la liste des sauvegardes disponibles
   */
  public obtenirSauvegardes(): string[] {
    const sauvegardes: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const cle = localStorage.key(i);
      if (cle && cle.startsWith(this.STORAGE_PREFIX)) {
        const nomSauvegarde = cle.replace(this.STORAGE_PREFIX, '');
        sauvegardes.push(nomSauvegarde);
      }
    }
    
    return sauvegardes.sort().reverse();
  }

  /**
   * Exporte toutes les données en fichier de sauvegarde
   */
  public exporterSauvegardeComplete(): void {
    const toutesLesDonnees: Record<string, any> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const cle = localStorage.key(i);
      if (cle && cle.startsWith(this.STORAGE_PREFIX)) {
        const nomSauvegarde = cle.replace(this.STORAGE_PREFIX, '');
        toutesLesDonnees[nomSauvegarde] = this.chargerDonnees(nomSauvegarde);
      }
    }
    
    const blob = new Blob([JSON.stringify(toutesLesDonnees, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sauvegarde_statistiques_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Importe une sauvegarde complète
   */
  public async importerSauvegardeComplete(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const donnees = JSON.parse(e.target?.result as string);
          
          Object.entries(donnees).forEach(([cle, valeur]) => {
            this.sauvegarderDonnees(cle, valeur);
          });
          
          resolve();
        } catch (error) {
          reject(new Error('Format de sauvegarde invalide'));
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  }
}
